import { test, expect } from '@playwright/test';

// AC-MORT-001 ~ AC-MORT-004: 每次清空 localStorage 使用默认值
test.describe('房贷计算器', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('tools_mortgage_state'));
    await page.goto('/#/tools/mortgage');
    await page.waitForSelector('nz-statistic', { timeout: 15_000 });
  });

  // AC-MORT-001 页面基础渲染
  test('AC-MORT-001 页面基础渲染', async ({ page }) => {
    await expect(page.getByText('第 1 步：贷款参数计算')).toBeVisible();
    await expect(page.getByText('第 2 步：公积金对冲压力测试')).toBeVisible();
    await expect(page.getByText('计算结果汇总')).toBeVisible();
  });

  // AC-MORT-002 默认值下方案一计算正确
  // 房价 1,200,000 | 公积金上限 700,000 | 方案 fullDown
  // → 首付 = 1,200,000 - 700,000 = 500,000；商贷 = 0
  test('AC-MORT-002 默认值下方案一计算正确', async ({ page }) => {
    const resultPanel = page.locator('.result-panel');
    await expect(resultPanel).toContainText('500,000');
    await expect(page.locator('.detail-row', { hasText: '商贷金额' })).toContainText('0 元');
  });

  
  // AC-MORT-003 切换组合贷后首付按比例重算
  // combo: 首付 = 1,200,000 × 30% = 360,000
  //        公积金贷款 = min(700,000, 840,000) = 700,000
  //        商贷 = 840,000 - 700,000 = 140,000
  test('AC-MORT-003 切换组合贷后首付按比例重算', async ({ page }) => {
    await page.getByText('方案 2：组合贷').click();
    await page.waitForTimeout(300);

    const resultPanel = page.locator('.result-panel');
    await expect(resultPanel).toContainText('360,000');
    await expect(page.locator('.detail-row', { hasText: '公积金贷款额' })).toContainText('700,000 元');
    await expect(page.locator('.detail-row', { hasText: '商贷金额' })).toContainText('140,000 元');
  });
  
  // AC-MORT-004 参数变化触发实时重算-
  // 改房价 1,200,000 → 1,000,000；fullDown: 首付 = 1,000,000 - 700,000 = 300,000
  test('AC-MORT-004 参数变化触发实时重算', async ({ page }) => {
    const housePriceInput = page
      .locator('nz-form-item', { hasText: '房子价格' })
      .locator('input');
    await housePriceInput.fill('1000000');
    await housePriceInput.press('Tab');
    await expect(page.locator('.result-panel')).toContainText('300,000');
  });
});

// AC-MORT-005 状态持久化
// 使用 page.evaluate 清理（而非 addInitScript），确保 reload 不会再次清空
test.describe('AC-MORT-005 状态持久化', () => {
  test('修改输入后刷新页面值保持', async ({ page }) => {
    // 1. 进入页面后手动清空旧状态，确保从默认值开始
    await page.goto('/#/tools/mortgage');
    await page.evaluate(() => localStorage.removeItem('tools_mortgage_state'));
    await page.reload();
    await page.waitForSelector('nz-statistic', { timeout: 15_000 });

    // 2. 切换到方案二（触发 form.valueChanges → saveState）
    await page.getByText('方案 2：组合贷').click();
    await page.waitForTimeout(500);

    // 3. 刷新页面（不清空 localStorage）
    await page.reload();
    await page.waitForSelector('nz-statistic', { timeout: 15_000 });

    // 4. 组合贷结果应恢复：首付 360,000
    await expect(page.locator('.result-panel')).toContainText('360,000');
  });
});
