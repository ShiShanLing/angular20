/**
 * 股吧情绪规则：行情语境 + 讽刺吐槽（中性，不算看空）
 */

/** 需结合当日涨跌判断的多义看多词（从无条件 bullish 词典中拆出） */
export const CONTEXT_BULLISH_WORDS = [
  '大牛市', '慢牛', '长牛', '牛市', '牛来', '牛真来', '启动', '牛市来了',
];

/** 牛市/行情离场句式（明确看空，优先于语境看多词） */
export const BULL_DEPARTURE_PATTERNS = [
  /牛跑了/,
  /牛走了/,
  /牛没了/,
  /牛撤了/,
  /牛不见/,
  /(?:慢牛|长牛|大牛市|牛市).{0,3}(?:跑了|走了|没了|撤了|不见)/,
  /(?:慢牛|长牛|大牛市|牛市)(?:已经|快|就要)?(?:结束|完了|过了|没了)/,
  /(?:游资|主力|资金|外资|北向|量化|散户).{0,6}跑了/,
];

/** 撤逃句中的主体词（词典里可能误命中「主力=看多」等，需剔除） */
export const FLEE_ACTOR_WORDS = ['主力', '游资', '量化', '散户', '外资', '北向', '资金'];

/** 明显反讽「牛市/启动」的句式（不论涨跌 → 吐槽中性） */
export const BULLISH_IRONY_PATTERNS = [
  /躲.*牛市/,
  /躲开.*牛市/,
  /没有.*牛市/,
  /哪有.*牛市/,
  /还.*说.*牛市/,
  /谁.*说.*牛市/,
  /相信.*牛市.*亏/,
  /亏.*相信.*牛市/,
  /快买.*牛市/,
  /神一般.*牛市/,
  /牛市.*结束/,
  /牛市.*过了/,
  /牛市.*吹/,
  /瞎子.*牛市/,
  /还有.*牛市\s*[？?]/,
  /这是.*牛市\s*[？?]/,
  /牛市.*是这样/,
  /根本没有.*牛市/,
];

/** 吐槽/讽刺标记（计入 neutral，不计入 bearish） */
export const COMPLAINT_MARKERS = [
  '呵呵', '哈哈', '笑死', '果然', '又是', '又是这样', '一如既往',
  '果然如此', '每次都', '又来了', '老样子', '习惯就好',
  '绿油油', '套路', '老乡别走', '太漂亮了', '厉害了', '太牛了',
  '指数回来了', '钱没了', '躲牛市', '躲开牛市',
];

/** 文本是否命中牛市离场/撤逃句式 */
export function hasBullDeparture(text) {
  return BULL_DEPARTURE_PATTERNS.some(p => p.test(text));
}

/** 牛市离场 → 看空（优先于语境看多） */
export function applyBullDeparturePatterns(text, scores, matchedWords) {
  if (!hasBullDeparture(text)) return false;

  matchedWords.bearish = matchedWords.bearish || [];
  if (!matchedWords.bearish.includes('牛跑了')) {
    matchedWords.bearish.push('牛跑了');
  }
  scores.bearish = (scores.bearish || 0) + 1;
  matchedWords.bullish = (matchedWords.bullish || []).filter(w => !FLEE_ACTOR_WORDS.includes(w));
  return true;
}

/**
 * @param {'涨'|'跌'|'震荡'|'未知'} marketDirection
 */
export function applyContextBullishWords(text, marketDirection, scores, matchedWords) {
  const lower = text.toLowerCase();
  const departure = hasBullDeparture(text);
  const hasComplaint = COMPLAINT_MARKERS.some(m => lower.includes(m.toLowerCase()));
  const hasIronyPattern = BULLISH_IRONY_PATTERNS.some(p => p.test(text));

  for (const word of CONTEXT_BULLISH_WORDS) {
    if (!lower.includes(word.toLowerCase())) continue;

    // 「牛市跑了」等离场句：已在 applyBullDeparturePatterns 记看空，不再记看多
    if (departure) continue;

    if (hasIronyPattern || hasComplaint) {
      matchedWords.complaint = matchedWords.complaint || [];
      matchedWords.complaint.push(word);
      scores.complaint = (scores.complaint || 0) + 0.6;
      continue;
    }

    if (marketDirection === '涨') {
      matchedWords.bullish.push(word);
      scores.bullish += 1;
    } else if (marketDirection === '跌') {
      matchedWords.complaint = matchedWords.complaint || [];
      matchedWords.complaint.push(word);
      scores.complaint = (scores.complaint || 0) + 0.6;
    } else {
      matchedWords.complaint = matchedWords.complaint || [];
      matchedWords.complaint.push(word);
      scores.complaint = (scores.complaint || 0) + 0.3;
    }
  }
}

/** 吐槽/讽刺标记（不含已由语境词处理的） */
export function applyComplaintMarkers(text, scores, matchedWords) {
  const lower = text.toLowerCase();
  for (const word of COMPLAINT_MARKERS) {
    if (!lower.includes(word.toLowerCase())) continue;
    if (matchedWords.complaint?.includes(word)) continue;
    matchedWords.complaint = matchedWords.complaint || [];
    matchedWords.complaint.push(word);
    scores.complaint = (scores.complaint || 0) + 0.6;
  }
}

/**
 * 最终标签：fear/greed 优先；吐槽不计入看空；sarcastic 不再映射 bearish
 */
export function finalizeSentimentLabel(scores) {
  const positive = (scores.bullish || 0) + (scores.greed || 0);
  const negative = (scores.bearish || 0) + (scores.fear || 0);
  const total = positive + negative;
  const rawScore = total > 0 ? (positive - negative) / total : 0;

  if ((scores.fear || 0) > 1.5) return { label: 'fear', rawScore };
  if ((scores.greed || 0) > 1.5) return { label: 'greed', rawScore };
  if (rawScore > 0.25) return { label: 'bullish', rawScore };
  if (rawScore < -0.25) return { label: 'bearish', rawScore };
  return { label: 'neutral', rawScore };
}

export function sentimentPromptRules(marketDirection = '未知') {
  return [
    `今日行情方向（权威参考）: ${marketDirection}`,
    '「牛市」「启动」「牛来」等：上涨日记 bullish；下跌日记 neutral（反讽吐槽），不要记 bearish。',
    '「牛跑了」「牛市跑了」「慢牛走了」「主力跑了」等离场/撤逃句：记 bearish，不要记 bullish。',
    '「老乡别走」「哈哈」「指数回来了钱没了」等吐槽/讽刺：记 neutral，不要记 bearish/fear，除非同时有明确看空词（暴跌、销户、崩盘等）。',
    '只有明确看空/恐慌词（割肉、跌停、销户、崩盘、爆仓等）才记 bearish/fear。',
  ].join('\n');
}
