#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PRIVACY_URL = 'https://www.xian-janssen.com.cn/privacy-policy';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countMatches(value, expression) {
  return (value.match(expression) || []).length;
}

function countTag(html, tagName) {
  return countMatches(html, new RegExp('<' + tagName + '\\b', 'gi'));
}

function splitCssDeclarations(value) {
  const declarations = [];
  let current = '';
  let quote = '';
  let parentheses = 0;
  let index = 0;

  while (index < value.length) {
    const character = value.charAt(index);
    if (quote) {
      current += character;
      if (character === '\\' && index + 1 < value.length) {
        current += value.charAt(index + 1);
        index += 2;
        continue;
      }
      if (character === quote) quote = '';
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      index += 1;
      continue;
    }
    if (character === '&') {
      const entity = value.slice(index).match(/^&(?:#x?[0-9a-f]+|[a-z][a-z0-9]+);/i);
      if (entity) {
        current += entity[0];
        index += entity[0].length;
        continue;
      }
    }
    if (character === '(') parentheses += 1;
    else if (character === ')' && parentheses > 0) parentheses -= 1;
    if (character === ';' && parentheses === 0) {
      declarations.push(current);
      current = '';
    } else {
      current += character;
    }
    index += 1;
  }
  declarations.push(current);
  return declarations;
}

function extractBody(source) {
  const match = source.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i);
  return match ? match[1] : source;
}

function createImageRemovalStats() {
  return {
    removedImageElements: 0,
    removedImageAttributes: 0,
    removedCssImageDeclarations: 0
  };
}

function createWordStyleRemovalStats() {
  return {
    removedWordListRules: 0,
    removedLegacyWordDeclarations: 0
  };
}

function cssDeclarationProperty(declaration) {
  const match = String(declaration || '').match(/^\s*([\w-]+)\s*:/);
  return match ? match[1].toLowerCase() : '';
}

function isLegacyWordCssProperty(property) {
  return /^layout-grid(?:-[\w-]+)?$/i.test(property) ||
    /^(?:tab-stops|text-underline)$/i.test(property);
}

function shouldRemoveWordCssDeclaration(declaration, stats) {
  const property = cssDeclarationProperty(declaration);
  const removable = /^mso-[\w-]+$/i.test(property) || isLegacyWordCssProperty(property);
  if (removable && stats && isLegacyWordCssProperty(property)) {
    stats.removedLegacyWordDeclarations += 1;
  }
  return removable;
}

function removeWordListRules(css, stats) {
  return css.replace(/@list\s+[^{}]+\{[^{}]*\}/gi, function () {
    stats.removedWordListRules += 1;
    return '';
  });
}

function removeWordListRulesFromHtml(html, stats) {
  return html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    function (_whole, attributes, css) {
      return '<style' + attributes + '>' + removeWordListRules(css, stats) + '</style>';
    });
}

function compactStyleWhitespace(html) {
  return html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    function (_whole, attributes, css) {
      const compacted = minifyCss(css);
      return '<style' + attributes + '>' + compacted + '</style>';
    });
}

function compactCssWhitespace(css) {
  let result = '';
  let quote = '';
  let index = 0;

  while (index < css.length) {
    const character = css.charAt(index);

    if (quote) {
      result += character;
      if (character === '\\' && index + 1 < css.length) {
        result += css.charAt(index + 1);
        index += 2;
        continue;
      }
      if (character === quote) quote = '';
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      result += character;
      index += 1;
      continue;
    }

    if (character === '\\' && index + 1 < css.length) {
      result += character + css.charAt(index + 1);
      index += 2;
      continue;
    }

    if (/\s/.test(character)) {
      result += ' ';
      index += 1;
      while (index < css.length && /\s/.test(css.charAt(index))) index += 1;
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
}

function minifyCssDeclarationList(value) {
  return splitCssDeclarations(value).map(function (declaration) {
    const trimmed = declaration.trim();
    if (!trimmed) return '';
    const property = cssDeclarationProperty(trimmed);
    if (!property || property.indexOf('--') === 0) return trimmed;
    const colonIndex = trimmed.indexOf(':');
    return property + ':' + trimmed.slice(colonIndex + 1).trim();
  }).filter(Boolean).join(';');
}

function removeCssStructuralWhitespace(css) {
  let result = '';
  let quote = '';
  let parentheses = 0;
  let index = 0;

  while (index < css.length) {
    const character = css.charAt(index);

    if (quote) {
      result += character;
      if (character === '\\' && index + 1 < css.length) {
        result += css.charAt(index + 1);
        index += 2;
        continue;
      }
      if (character === quote) quote = '';
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      result += character;
      index += 1;
      continue;
    }

    if (character === '\\' && index + 1 < css.length) {
      result += character + css.charAt(index + 1);
      index += 2;
      continue;
    }

    if (character === '(') parentheses += 1;
    else if (character === ')' && parentheses > 0) parentheses -= 1;

    if (parentheses === 0 && /[{},;]/.test(character)) {
      result = result.replace(/\s+$/, '');
      result += character;
      index += 1;
      while (index < css.length && /\s/.test(css.charAt(index))) index += 1;
      continue;
    }

    result += character;
    index += 1;
  }

  return result.trim();
}

function minifyCss(css) {
  let result = compactCssWhitespace(css);
  result = result.replace(/\{([^{}]*)\}/g, function (_whole, declarations) {
    return '{' + minifyCssDeclarationList(declarations) + '}';
  });
  return removeCssStructuralWhitespace(result);
}

function minifyCssWhitespaceInHtml(html) {
  let result = compactStyleWhitespace(html);
  result = result.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, quotedValue, doubleValue, singleValue) {
      const quote = quotedValue.charAt(0);
      const value = doubleValue !== undefined ? doubleValue : singleValue;
      return 'style=' + quote + minifyCssDeclarationList(value) + quote;
    });
  return result;
}

function createCssCommentRemovalStats() {
  return { removedCssComments: 0 };
}

function removeCssComments(css, stats) {
  let result = '';
  let quote = '';
  let index = 0;

  while (index < css.length) {
    const character = css.charAt(index);

    if (quote) {
      result += character;
      if (character === '\\' && index + 1 < css.length) {
        result += css.charAt(index + 1);
        index += 2;
        continue;
      }
      if (character === quote) quote = '';
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      result += character;
      index += 1;
      continue;
    }

    if (character === '/' && css.charAt(index + 1) === '*') {
      const end = css.indexOf('*/', index + 2);
      assert(end !== -1, 'CSS 注释未闭合');
      stats.removedCssComments += 1;
      index = end + 2;
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
}

function removeCssCommentsFromHtml(html, stats) {
  return html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    function (_whole, attributes, css) {
      return '<style' + attributes + '>' + removeCssComments(css, stats) + '</style>';
    });
}

function assertCssCommentsAbsent(html) {
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || [];
  styleBlocks.forEach(function (block) {
    const css = block.replace(/^<style\b[^>]*>/i, '').replace(/<\/style\s*>$/i, '');
    const probeStats = createCssCommentRemovalStats();
    removeCssComments(css, probeStats);
    assert(probeStats.removedCssComments === 0, '样式声明中仍包含 CSS 注释');
  });
}

function assertStyleLineBreaksAbsent(html) {
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || [];
  styleBlocks.forEach(function (block) {
    const css = block.replace(/^<style\b[^>]*>/i, '').replace(/<\/style\s*>$/i, '');
    assert(!/[\r\n]/.test(css), '样式声明中仍包含换行');
  });
}

function assertStyleWhitespaceCompacted(html) {
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || [];
  styleBlocks.forEach(function (block) {
    const css = block.replace(/^<style\b[^>]*>/i, '').replace(/<\/style\s*>$/i, '');
    assert(minifyCss(css) === css, '样式声明中仍包含可安全删除的空白');
  });
  html.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, _quotedValue, doubleValue, singleValue) {
      const value = doubleValue !== undefined ? doubleValue : singleValue;
      assert(minifyCssDeclarationList(value) === value, '内联样式中仍包含可安全删除的空白');
      return _whole;
    });
}

function removeLineBreakCharacters(html) {
  return String(html || '').replace(/\r\n?|\n/g, ' ');
}

function assertLineBreakCharactersAbsent(html) {
  assert(!/[\r\n]/.test(html), '生成的 HTML 仍包含源码换行字符');
}

function assertWordListRulesAbsent(html) {
  const styleText = (html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || []).join('');
  assert(!/@list\s+/i.test(styleText), '结果仍包含 Word 私有 @list 规则');
}

function assertLegacyWordCssAbsent(html) {
  const declarationGroups = [];
  (html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || []).forEach(function (block) {
    const css = block.replace(/^<style\b[^>]*>/i, '').replace(/<\/style\s*>$/i, '');
    css.replace(/\{([^{}]*)\}/g, function (_whole, declarations) {
      declarationGroups.push(declarations);
      return _whole;
    });
  });
  html.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, _quoted, doubleValue, singleValue) {
      declarationGroups.push(doubleValue !== undefined ? doubleValue : singleValue);
      return _whole;
    });
  declarationGroups.forEach(function (value) {
    splitCssDeclarations(value).forEach(function (declaration) {
      assert(!isLegacyWordCssProperty(cssDeclarationProperty(declaration)),
        '结果仍包含旧式 Word/IE 排版声明：' + cssDeclarationProperty(declaration));
    });
  });
}

function declarationHasImageReference(declaration) {
  return /url\s*\(/i.test(declaration);
}

function removeCssImageDeclarations(declarations, stats) {
  return splitCssDeclarations(declarations).filter(function (declaration) {
    if (!declarationHasImageReference(declaration)) return true;
    stats.removedCssImageDeclarations += 1;
    return false;
  });
}

function cleanStyleBlock(block, imageStats, wordStyleStats) {
  let content = block
    .replace(/^<style\b[^>]*>/i, '')
    .replace(/<\/style\s*>$/i, '')
    .replace(/^\s*<!--/, '')
    .replace(/-->\s*$/, '');

  if (/behavior\s*:\s*url\s*\(/i.test(content)) return '';

  content = removeWordListRules(content, wordStyleStats);

  content = content.replace(/\{([^{}]*)\}/g, function (_whole, declarations) {
    const kept = removeCssImageDeclarations(declarations, imageStats).filter(function (declaration) {
      return !shouldRemoveWordCssDeclaration(declaration, wordStyleStats);
    });
    return '{' + kept.join(';').trim() + '}';
  });
  return '<style>' + content.trim() + '</style>';
}

function collectStyles(source, imageStats, wordStyleStats) {
  return (source.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || [])
    .map(function (block) { return cleanStyleBlock(block, imageStats, wordStyleStats); }).filter(Boolean).join('');
}

function cleanBodyShell(source) {
  return extractBody(source)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[(?:if[^\]]*|endif)\]>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<xml\b[^>]*>[\s\S]*?<\/xml\s*>/gi, '')
    .replace(/<!doctype\b[^>]*>/gi, '')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, '')
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .trim();
}

function stripInlineWordDeclarations(html, imageStats, wordStyleStats) {
  return html.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, quotedValue, doubleValue, singleValue) {
      const quote = quotedValue.charAt(0);
      const value = doubleValue !== undefined ? doubleValue : singleValue;
      const kept = removeCssImageDeclarations(value, imageStats).filter(function (declaration) {
        return !shouldRemoveWordCssDeclaration(declaration, wordStyleStats);
      });
      return 'style=' + quote + kept.join(';').trim() + quote;
    });
}

function removeImageReferences(html, stats) {
  let result = html;

  result = result.replace(/<v:shape\b[^>]*>[\s\S]*?<v:imagedata\b[^>]*>[\s\S]*?<\/v:shape\s*>/gi,
    function (whole) {
      stats.removedImageElements += Math.max(1, countTag(whole, 'v:imagedata'));
      return '';
    });
  result = result.replace(/<img\b[^>]*>/gi, function () {
    stats.removedImageElements += 1;
    return '';
  });
  result = result.replace(/<v:imagedata\b[^>]*\/?\s*>/gi, function () {
    stats.removedImageElements += 1;
    return '';
  });
  result = result.replace(/<image\b[^>]*>[\s\S]*?<\/image\s*>|<image\b[^>]*\/?\s*>/gi, function () {
    stats.removedImageElements += 1;
    return '';
  });
  result = result.replace(/<input\b(?=[^>]*\btype\s*=\s*(?:"image"|'image'|image\b))[^>]*>/gi, function () {
    stats.removedImageElements += 1;
    return '';
  });

  result = result.replace(/\s(?:background|poster|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    function () {
      stats.removedImageAttributes += 1;
      return '';
    });

  result = result.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    function (_whole, attributes, css) {
      const cleaned = css.replace(/\{([^{}]*)\}/g, function (_rule, declarations) {
        return '{' + removeCssImageDeclarations(declarations, stats).join(';').trim() + '}';
      });
      return '<style' + attributes + '>' + cleaned + '</style>';
    });

  result = result.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, quotedValue, doubleValue, singleValue) {
      const quote = quotedValue.charAt(0);
      const value = doubleValue !== undefined ? doubleValue : singleValue;
      return 'style=' + quote + removeCssImageDeclarations(value, stats).join(';').trim() + quote;
    });

  return result;
}

function assertImagesAbsent(html) {
  assert(!/<(?:img|v:imagedata|image)\b/i.test(html), '结果仍包含图片节点');
  assert(!/<input\b(?=[^>]*\btype\s*=\s*(?:"image"|'image'|image\b))/i.test(html),
    '结果仍包含图片输入节点');
  assert(!/\s(?:background|poster|srcset)\s*=/i.test(html), '结果仍包含图片资源属性');
  assert(!/url\s*\(/i.test(html), '结果仍包含 CSS 图片 URL');
}

function preserveSafeSpanAttributes(attributes, preserveHyperlinkAppearance) {
  const preserved = [];
  const classMatch = attributes.match(/\bclass\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
  const styleMatch = attributes.match(/\bstyle\s*=\s*("[^"]*"|'[^']*')/i);
  let classValue = classMatch ? classMatch[1] : '';
  if (classValue && (/^["']/.test(classValue))) classValue = classValue.slice(1, -1);
  if (preserveHyperlinkAppearance && !/(?:^|\s)MsoHyperlink(?:\s|$)/i.test(classValue)) {
    classValue = (classValue ? classValue + ' ' : '') + 'MsoHyperlink';
  }
  if (classValue) preserved.push('class="' + classValue.replace(/"/g, '&quot;') + '"');
  if (styleMatch) preserved.push('style=' + styleMatch[1]);
  return preserved.length ? ' ' + preserved.join(' ') : '';
}

function disableLinks(html) {
  let replacedCount = 0;
  const result = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,
    function (_whole, attributes, content) {
      replacedCount += 1;
      if (attributes.indexOf(PRIVACY_URL) !== -1 || content.indexOf(PRIVACY_URL) !== -1) {
        return '<span class="non-clickable-privacy-url">' + content + '</span>';
      }
      const hasHref = /\bhref\s*=/i.test(attributes);
      return '<span' + preserveSafeSpanAttributes(attributes, hasHref) + '>' + content + '</span>';
    });
  return { html: result, replacedCount: replacedCount };
}

function preventVisibleUrlWrapping(html) {
  let wrappedCount = 0;
  const result = html.split(/(<[^>]*>)/g).map(function (part) {
    if (part.charAt(0) === '<') return part;
    return part.replace(/\bhttps?:\/\/[^\s<]+/gi, function (url) {
      wrappedCount += 1;
      return '<span class="non-wrapping-url">' + url + '</span>';
    });
  }).join('');
  return { html: result, wrappedCount: wrappedCount };
}

function normalizeAttributeQuotes(html) {
  function normalizeTag(tag) {
    let result = '';
    let index = 0;
    let activeDoubleQuote = false;
    while (index < tag.length) {
      const character = tag.charAt(index);
      if (character === '"') {
        activeDoubleQuote = !activeDoubleQuote;
        result += character;
        index += 1;
        continue;
      }
      if (!activeDoubleQuote && character === "'") {
        let previousIndex = result.length - 1;
        while (previousIndex >= 0 && /\s/.test(result.charAt(previousIndex))) previousIndex -= 1;
        if (result.charAt(previousIndex) === '=') {
          const closingIndex = tag.indexOf("'", index + 1);
          if (closingIndex !== -1) {
            const value = tag.slice(index + 1, closingIndex).replace(/"/g, '&quot;');
            result += '"' + value + '"';
            index = closingIndex + 1;
            continue;
          }
        }
      }
      result += character;
      index += 1;
    }
    return result;
  }

  let output = '';
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor);
    if (start === -1) return output + html.slice(cursor);
    output += html.slice(cursor, start);
    let end = start + 1;
    let quote = '';
    while (end < html.length) {
      const character = html.charAt(end);
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') break;
      end += 1;
    }
    if (end >= html.length) return output + html.slice(start);
    output += normalizeTag(html.slice(start, end + 1));
    cursor = end + 1;
  }
  return output;
}

function hasLegalWrapper(html) {
  return /<[^>]+\bclass\s*=\s*(?:"[^"]*\blegal-permission\b[^"]*"|'[^']*\blegal-permission\b[^']*'|[^\s>]*\blegal-permission\b[^\s>]*)/i.test(html);
}

function addRequiredStyles(html) {
  const rules = [
    '.legal-permission .link-orange { color: #ed7d31 !important; }',
    '.legal-permission .non-clickable-privacy-url { color: inherit !important; text-decoration: inherit; cursor: text; }',
    '.legal-permission .non-wrapping-url { white-space: nowrap; }'
  ].join(' ');
  if (/<\/style\s*>/i.test(html)) return html.replace(/<\/style\s*>/i, ' ' + rules + '</style>');
  return '<style>' + rules + '</style>' + html;
}

function convertFontShorthand(declaration, stats) {
  const match = declaration.trim().match(/^font\s*:\s*([\s\S]+)$/i);
  if (!match) return null;
  stats.normalizedFontShorthandDeclarations += 1;

  const value = match[1].trim();
  const sizePattern = '(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger|0|(?:\\d*\\.?\\d+)(?:%|px|pt|pc|in|cm|mm|em|rem|ex|ch|vw|vh|vmin|vmax))';
  const parsed = value.match(new RegExp('^(.*?)\\b(' + sizePattern + ')(?:\\s*\\/\\s*([^\\s]+))?\\s+.+$', 'i'));
  if (!parsed) return '';

  const preserved = [];
  const prefix = parsed[1].trim().split(/\s+/).filter(Boolean);
  prefix.forEach(function (token) {
    if (/^(?:italic|oblique)$/i.test(token)) preserved.push('font-style:' + token);
    else if (/^small-caps$/i.test(token)) preserved.push('font-variant:' + token);
    else if (/^(?:bold|bolder|lighter|[1-9]00)$/i.test(token)) preserved.push('font-weight:' + token);
    else if (/^(?:ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded)$/i.test(token)) {
      preserved.push('font-stretch:' + token);
    }
  });
  preserved.push('font-size:' + parsed[2]);
  if (parsed[3]) preserved.push('line-height:' + parsed[3]);
  return preserved.join(';');
}

function removeFontDeclarations(declarations, stats) {
  return splitCssDeclarations(declarations).reduce(function (kept, declaration) {
    if (/^\s*font-family\s*:/i.test(declaration)) {
      stats.removedFontFamilyDeclarations += 1;
      return kept;
    }
    if (/^\s*font\s*:/i.test(declaration)) {
      const converted = convertFontShorthand(declaration, stats);
      if (converted) kept.push(converted);
      return kept;
    }
    if (declaration.trim()) kept.push(declaration.trim());
    return kept;
  }, []).join(';');
}

function removeFontFamilySettings(html, stats) {
  let result = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    function (_whole, attributes, css) {
      const withoutFontFaces = css.replace(/@font-face\s*\{[^{}]*\}/gi, function () {
        stats.removedFontFaceRules += 1;
        return '';
      });
      const cleanedCss = withoutFontFaces.replace(/\{([^{}]*)\}/g,
        function (_rule, declarations) {
          return '{' + removeFontDeclarations(declarations, stats) + '}';
        });
      return '<style' + attributes + '>' + cleanedCss + '</style>';
    });

  result = result.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, quotedValue, doubleValue, singleValue) {
      const quote = quotedValue.charAt(0);
      const value = doubleValue !== undefined ? doubleValue : singleValue;
      return 'style=' + quote + removeFontDeclarations(value, stats) + quote;
    });

  result = result.replace(/<font\b([^>]*)>/gi, function (_whole, attributes) {
    const cleaned = attributes.replace(
      /\s+face\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
      function () {
        stats.removedFontFaceAttributes += 1;
        return '';
      });
    return '<font' + cleaned + '>';
  });

  return result;
}

function createFontRemovalStats() {
  return {
    removedFontFaceRules: 0,
    removedFontFamilyDeclarations: 0,
    removedFontFaceAttributes: 0,
    normalizedFontShorthandDeclarations: 0
  };
}

function assertFontFamilySettingsAbsent(html) {
  assert(!/@font-face\b/i.test(html), 'HTML 仍包含 @font-face 字体规则');
  assert(!/\bfont-family\s*:/i.test(html), 'HTML 仍包含 font-family 字体声明');
  assert(!/\bfont\s*:/i.test(html), 'HTML 仍包含 font 简写字体声明');
  assert(!/<font\b[^>]*\bface\s*=/i.test(html), 'HTML 仍包含 font face 字体属性');
}

function convertCssSingleQuotedStrings(css) {
  let output = '';
  let index = 0;

  while (index < css.length) {
    if (css.slice(index, index + 2) === '/*') {
      const commentEnd = css.indexOf('*/', index + 2);
      const end = commentEnd === -1 ? css.length : commentEnd + 2;
      output += css.slice(index, end).replace(/'/g, '&#39;');
      index = end;
      continue;
    }

    if (css.charAt(index) !== "'") {
      output += css.charAt(index);
      index += 1;
      continue;
    }

    let content = '';
    let cursor = index + 1;
    let closed = false;
    while (cursor < css.length) {
      const character = css.charAt(cursor);
      if (character === '\\' && cursor + 1 < css.length) {
        content += character + css.charAt(cursor + 1);
        cursor += 2;
        continue;
      }
      if (character === "'") {
        closed = true;
        cursor += 1;
        break;
      }
      content += character;
      cursor += 1;
    }

    assert(closed, 'CSS 中存在未闭合的单引号字符串，无法安全转换');
    output += '"' + content.replace(/"/g, '\\"') + '"';
    index = cursor;
  }

  return output;
}

function makeNestedCoreDataSafe(html) {
  let output = '';
  let cursor = 0;
  const styleExpression = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let match;

  while ((match = styleExpression.exec(html)) !== null) {
    output += html.slice(cursor, match.index).replace(/'/g, '&#39;');
    const openTagEnd = match[0].indexOf('>') + 1;
    const closeTagStart = match[0].toLowerCase().lastIndexOf('</style');
    output += match[0].slice(0, openTagEnd).replace(/'/g, '&#39;');
    output += convertCssSingleQuotedStrings(match[1]);
    output += match[0].slice(closeTagStart);
    cursor = match.index + match[0].length;
  }

  output += html.slice(cursor).replace(/'/g, '&#39;');
  assert(output.indexOf("'") === -1, 'HTML 正文片段仍包含裸单引号');
  return output;
}

function encodeForJson(fragment) {
  const entities = fragment.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return JSON.stringify(entities).replace(/'/g, '\\u0027') + '\n';
}

function validateNestedCoreDataSafety(txt) {
  const legalPermission = JSON.parse(txt);
  const coreDataJson = JSON.stringify({
    company_config: { legal_permission: legalPermission }
  });
  assert(coreDataJson.indexOf("'") === -1,
    'legal_permission 经过外层 core-data JSON 序列化后仍包含裸单引号');
  const reparsed = JSON.parse(coreDataJson);
  assert(reparsed.company_config.legal_permission === legalPermission,
    'legal_permission 经过外层 core-data JSON 往返后发生变化');
  return coreDataJson;
}

function decodeGeneratedValue(text) {
  return JSON.parse(text).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

function encodeFragment(fragment) {
  let normalized = String(fragment || '').replace(/^\uFEFF/, '');
  assert(normalized.trim(), 'HTML 内容为空');
  assert(!/<!doctype\b|<\/?(?:html|head|body)\b|<meta\b/i.test(normalized),
    'HTML 仍包含完整文档外壳');
  assert(countMatches(normalized,
    /<[^>]+\bclass\s*=\s*(?:"[^"]*\blegal-permission\b[^"]*"|'[^']*\blegal-permission\b[^']*'|[^\s>]*\blegal-permission\b[^\s>]*)/gi) === 1,
    'HTML 必须恰好包含一个 legal-permission 容器');
  assert(!/<a\b/i.test(normalized) && !/\bhref\s*=/i.test(normalized), 'HTML 仍包含可点击链接');
  assert(!/\bon[a-z]+\s*=/i.test(normalized), 'HTML 包含事件处理属性');
  assert(!/<(?:script|iframe|object|embed)\b/i.test(normalized), 'HTML 包含不允许的标签');

  const imageStats = createImageRemovalStats();
  normalized = removeImageReferences(normalized, imageStats);
  assertImagesAbsent(normalized);

  const wordStyleStats = createWordStyleRemovalStats();
  normalized = removeWordListRulesFromHtml(normalized, wordStyleStats);
  assertWordListRulesAbsent(normalized);

  const fontStats = createFontRemovalStats();
  normalized = removeFontFamilySettings(normalizeAttributeQuotes(normalized), fontStats);
  const cssCommentStats = createCssCommentRemovalStats();
  normalized = removeCssCommentsFromHtml(normalized, cssCommentStats);
  normalized = compactStyleWhitespace(normalized);
  assertFontFamilySettingsAbsent(normalized);
  assertCssCommentsAbsent(normalized);
  assertStyleLineBreaksAbsent(normalized);
  normalized = makeNestedCoreDataSafe(normalized);

  const txt = encodeForJson(normalized);
  const decoded = decodeGeneratedValue(txt);
  assert(decoded === normalized, 'TXT 无法逐字符还原编辑后的 HTML');
  assert(txt.indexOf("'") === -1, 'TXT 仍包含裸单引号');
  const payload = JSON.parse('{"legal_permission":' + txt.trim() + '}');
  assert(typeof payload.legal_permission === 'string', 'legal_permission 不是合法的 JSON 字符串');
  const coreDataJson = validateNestedCoreDataSafety(txt);

  return {
    fragment: normalized,
    txt: txt,
    report: {
      version: 7,
      fragment_sha256: sha256(normalized),
      txt_sha256: sha256(txt),
      fragment_bytes: Buffer.byteLength(normalized),
      txt_bytes: Buffer.byteLength(txt),
      raw_apostrophes_in_txt: countMatches(txt, /'/g),
      raw_apostrophes_in_fragment: countMatches(normalized, /'/g),
      raw_apostrophes_after_core_data_stringify: countMatches(coreDataJson, /'/g),
      removed_images: imageStats.removedImageElements,
      removed_image_attributes: imageStats.removedImageAttributes,
      removed_css_image_declarations: imageStats.removedCssImageDeclarations,
      removed_word_list_rules: wordStyleStats.removedWordListRules,
      removed_css_comments: cssCommentStats.removedCssComments,
      removed_font_face_rules: fontStats.removedFontFaceRules,
      removed_font_family_declarations: fontStats.removedFontFamilyDeclarations,
      removed_font_face_attributes: fontStats.removedFontFaceAttributes,
      normalized_font_shorthand_declarations: fontStats.normalizedFontShorthandDeclarations,
      checks: {
        json_parse: true,
        exact_decode: true,
        core_data_safe: true,
        nested_core_data_safe: true,
        font_family_settings_absent: true,
        word_list_rules_absent: true,
        css_comments_absent: true,
        style_line_breaks_absent: true,
        legal_permission_present: true,
        document_shell_absent: true,
        images_absent: true,
        clickable_links_absent: true
      }
    }
  };
}

function decodeTxt(text) {
  const normalized = String(text || '').replace(/^\uFEFF/, '').trim();
  assert(normalized, 'TXT 内容为空');
  let encodedHtml;
  try {
    encodedHtml = JSON.parse(normalized);
  } catch (error) {
    throw new Error('TXT 不是合法的 JSON 字符串：' + error.message);
  }
  assert(typeof encodedHtml === 'string', 'TXT 顶层内容必须是一个 JSON 字符串');
  const html = encodedHtml.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  assert(JSON.parse(encodeForJson(html)) === encodedHtml, '反向解析结果无法无损重新编码');
  return {
    html: html,
    report: {
      version: 1,
      txt_sha256: sha256(normalized),
      html_sha256: sha256(html),
      txt_bytes: Buffer.byteLength(normalized),
      html_bytes: Buffer.byteLength(html),
      checks: {
        json_parse: true,
        top_level_string: true,
        exact_reencode: true
      }
    }
  };
}

function textFingerprint(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;|&#x0*A0;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'")
    .replace(/\s+/g, ' ').trim();
}

function inlineStyleFingerprint(html) {
  const fontStats = createFontRemovalStats();
  const styles = [];
  html.replace(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    function (_whole, _quotedValue, doubleValue, singleValue) {
      const value = (doubleValue !== undefined ? doubleValue : singleValue)
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&#x27;/gi, "'");
      const declarations = splitCssDeclarations(minifyCssDeclarationList(removeFontDeclarations(value, fontStats)))
        .filter(function (declaration) {
          return declaration.trim() && !shouldRemoveWordCssDeclaration(declaration);
        })
        .map(function (declaration) { return declaration.trim().replace(/\s+/g, ' '); });
      styles.push(declarations.join(';'));
      return _whole;
    });
  return JSON.stringify(styles);
}

function firstDifference(left, right) {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left.charAt(index) === right.charAt(index)) index += 1;
  if (index === left.length && index === right.length) return '';
  return '位置 ' + index + '，输入=' + JSON.stringify(left.slice(Math.max(0, index - 60), index + 80)) +
    '，输出=' + JSON.stringify(right.slice(Math.max(0, index - 60), index + 80));
}

function validate(sourceBodyWithoutImages, fragment, txt, removedImageCount, inputCounts, visibleUrlCount) {
  const decoded = decodeGeneratedValue(txt);
  assert(decoded === fragment, 'TXT 无法逐字符还原处理后的 HTML 片段');
  assert(txt.indexOf("'") === -1, 'TXT 仍包含裸单引号');
  assert(fragment.indexOf("'") === -1, 'HTML 正文片段仍包含裸单引号');
  assertFontFamilySettingsAbsent(fragment);
  assertWordListRulesAbsent(fragment);
  assertLegacyWordCssAbsent(fragment);
  validateNestedCoreDataSafety(txt);
  assert(!/<!doctype\b|<\/?(?:html|head|body)\b|<meta\b/i.test(decoded), '结果仍包含完整 HTML 文档外壳');
  assert(countMatches(decoded, /<[^>]+\bclass\s*=\s*"[^"]*\blegal-permission\b/gi) === 1,
    '结果必须恰好包含一个 legal-permission 容器');
  assert(!/<a\b/i.test(decoded) && !/\bhref\s*=/i.test(decoded), '结果仍包含可点击链接');
  assert(!/\bon[a-z]+\s*=/i.test(decoded), '结果包含事件处理属性');
  assert(!/<(?:script|iframe|object|embed)\b/i.test(decoded), '结果包含不允许的标签');
  assertImagesAbsent(decoded);
  assert(countMatches(decoded,
    /\bclass\s*=\s*"[^"]*\bnon-wrapping-url\b[^"]*"/gi) === visibleUrlCount,
    '可见 URL 的禁止内部换行标记数量发生变化');
  assert(textFingerprint(removeLineBreakCharacters(sourceBodyWithoutImages)) === textFingerprint(decoded),
    '除固定移除的源码换行外，可见文字指纹发生变化');
  const inputStyleFingerprint = inlineStyleFingerprint(removeLineBreakCharacters(sourceBodyWithoutImages));
  const outputStyleFingerprint = inlineStyleFingerprint(decoded);
  assert(inputStyleFingerprint === outputStyleFingerprint,
    '非字体内联样式发生变化：' + firstDifference(inputStyleFingerprint, outputStyleFingerprint));
  assert(countTag(decoded, 'img') === 0, '结果仍包含图片');
  assert(removedImageCount >= 0, '移除图片计数无效');
  ['p', 'table', 'tr', 'td', 'th', 'b', 'strong', 'u'].forEach(function (tag) {
    assert(countTag(decoded, tag) === inputCounts[tag], tag + ' 标签数量发生变化');
  });
}

function processHtml(source, inputPath) {
  assert(source.trim(), '输入 HTML 是空文件');
  const sourceBody = cleanBodyShell(source);
  assert(!/<(?:script|iframe|object|embed)\b/i.test(sourceBody), '输入正文包含不允许的标签');
  assert(!/\bon[a-z]+\s*=/i.test(sourceBody), '输入正文包含事件处理属性，需要人工确认');

  const inputImageCount = countTag(sourceBody, 'img') + countTag(sourceBody, 'v:imagedata');
  const visibleUrlCount = sourceBody.split(/(<[^>]*>)/g).reduce(function (total, part) {
    if (part.charAt(0) === '<') return total;
    return total + countMatches(part, /\bhttps?:\/\/[^\s<]+/gi);
  }, 0);
  const inputCounts = {};
  ['p', 'table', 'tr', 'td', 'th', 'b', 'strong', 'u'].forEach(function (tag) {
    inputCounts[tag] = countTag(sourceBody, tag);
  });

  const imageStats = createImageRemovalStats();
  const wordStyleStats = createWordStyleRemovalStats();
  const styles = collectStyles(source, imageStats, wordStyleStats);
  let body = stripInlineWordDeclarations(sourceBody, imageStats, wordStyleStats);
  body = removeImageReferences(body, imageStats);
  const sourceBodyWithoutImages = removeImageReferences(sourceBody, createImageRemovalStats());
  const linkResult = disableLinks(body);
  const urlResult = preventVisibleUrlWrapping(linkResult.html);
  body = normalizeAttributeQuotes(urlResult.html);
  if (!hasLegalWrapper(body)) body = '<div class="legal-permission">' + body + '</div>';

  let fragment = normalizeAttributeQuotes(styles + body);
  fragment = addRequiredStyles(fragment);
  const fontStats = createFontRemovalStats();
  fragment = removeFontFamilySettings(fragment, fontStats);
  const cssCommentStats = createCssCommentRemovalStats();
  fragment = removeCssCommentsFromHtml(fragment, cssCommentStats);
  fragment = minifyCssWhitespaceInHtml(fragment);
  assertFontFamilySettingsAbsent(fragment);
  assertWordListRulesAbsent(fragment);
  assertLegacyWordCssAbsent(fragment);
  assertCssCommentsAbsent(fragment);
  assertStyleLineBreaksAbsent(fragment);
  assertStyleWhitespaceCompacted(fragment);
  fragment = makeNestedCoreDataSafe(fragment);
  fragment = removeLineBreakCharacters(fragment);
  assertLineBreakCharactersAbsent(fragment);
  const txt = encodeForJson(fragment);
  validate(sourceBodyWithoutImages, fragment, txt, imageStats.removedImageElements, inputCounts, visibleUrlCount);

  return {
    fragment: fragment,
    txt: txt,
    report: {
      version: 11,
      input: path.resolve(inputPath),
      input_sha256: sha256(source),
      fragment_sha256: sha256(fragment),
      txt_sha256: sha256(txt),
      input_bytes: Buffer.byteLength(source),
      fragment_bytes: Buffer.byteLength(fragment),
      txt_bytes: Buffer.byteLength(txt),
      source_images: inputImageCount,
      removed_images: imageStats.removedImageElements,
      removed_image_attributes: imageStats.removedImageAttributes,
      removed_css_image_declarations: imageStats.removedCssImageDeclarations,
      removed_word_list_rules: wordStyleStats.removedWordListRules,
      removed_legacy_word_declarations: wordStyleStats.removedLegacyWordDeclarations,
      removed_css_comments: cssCommentStats.removedCssComments,
      disabled_links: linkResult.replacedCount,
      non_wrapping_urls: urlResult.wrappedCount,
      raw_apostrophes_in_txt: countMatches(txt, /'/g),
      raw_apostrophes_in_fragment: countMatches(fragment, /'/g),
      raw_apostrophes_after_core_data_stringify: 0,
      removed_font_face_rules: fontStats.removedFontFaceRules,
      removed_font_family_declarations: fontStats.removedFontFamilyDeclarations,
      removed_font_face_attributes: fontStats.removedFontFaceAttributes,
      normalized_font_shorthand_declarations: fontStats.normalizedFontShorthandDeclarations,
      checks: {
        json_parse: true,
        exact_decode: true,
        nested_core_data_safe: true,
        font_family_settings_absent: true,
        word_list_rules_absent: true,
        legacy_word_css_absent: true,
        css_comments_absent: true,
        style_line_breaks_absent: true,
        style_whitespace_compacted: true,
        css_structural_whitespace_absent: true,
        line_breaks_absent: true,
        visible_text_preserved: true,
        inline_styles_preserved: true,
        document_shell_absent: true,
        images_absent: true,
        clickable_links_absent: true
      }
    }
  };
}

function parseArgs(argv) {
  const result = { input: '', htmlOutput: '', txtOutput: '', reportOutput: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!result.input && value.charAt(0) !== '-') result.input = value;
    else if (value === '--html-output') result.htmlOutput = argv[++index] || '';
    else if (value === '--txt-output') result.txtOutput = argv[++index] || '';
    else if (value === '--report-output') result.reportOutput = argv[++index] || '';
    else if (value === '--help' || value === '-h') result.help = true;
    else throw new Error('未知参数：' + value);
  }
  return result;
}

function runCli(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.input) {
    console.log('用法：node process-consent-word-html.js <输入.html> [--html-output <片段.html>] [--txt-output <转码.txt>] [--report-output <报告.json>]');
    return args.help ? 0 : 1;
  }

  const inputPath = path.resolve(args.input);
  assert(fs.existsSync(inputPath), '找不到输入文件：' + inputPath);
  const extension = path.extname(inputPath);
  const stem = inputPath.slice(0, inputPath.length - extension.length);
  const htmlOutput = path.resolve(args.htmlOutput || stem + '_legal_permission.html');
  const txtOutput = path.resolve(args.txtOutput || stem + '_转码+转义.txt');
  const reportOutput = path.resolve(args.reportOutput || stem + '_处理报告.json');
  [htmlOutput, txtOutput, reportOutput].forEach(function (output) {
    assert(output !== inputPath, '禁止覆盖输入文件：' + output);
    assert(fs.existsSync(path.dirname(output)), '输出目录不存在：' + path.dirname(output));
  });

  const source = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const result = processHtml(source, inputPath);
  fs.writeFileSync(htmlOutput, result.fragment, 'utf8');
  fs.writeFileSync(txtOutput, result.txt, 'utf8');
  fs.writeFileSync(reportOutput, JSON.stringify(result.report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    html_output: htmlOutput,
    txt_output: txtOutput,
    report_output: reportOutput,
    report: result.report
  }, null, 2));
  return 0;
}

module.exports = {
  processHtml: processHtml,
  encodeFragment: encodeFragment,
  decodeTxt: decodeTxt,
  runCli: runCli
};

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    console.error('处理失败：' + error.message);
    process.exitCode = 1;
  }
}
