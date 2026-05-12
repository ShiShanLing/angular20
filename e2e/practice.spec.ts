import { test, expect, type Page } from '@playwright/test';

const STORAGE_KEY = 'angular20_practice_v1';
const SKIP_BUILTIN_KEY = 'angular20_practice_skip_builtin_seed_v1';
const FILTER_CATEGORY_KEY = 'angular20_practice_filter_category_v1';

// 3 行有效题目：iOS / Android / TS（分类别名）
const SAMPLE_CSV = Buffer.from(
  '\uFEFF分类,题目,答案,标签\n' +
  'iOS,题目甲：RunLoop 与线程关系？,RunLoop 与线程一一对应,基础\n' +
  'Android,题目乙：Activity 启动模式？,standard/singleTop/singleTask,基础\n' +
  'TS,题目丙：signal 与变更检测？,signal 更新会标记视图,进阶\n'
);

/** 上传 CSV fixture，等待导入成功提示出现后返回 */
async function importCSV(page: Page): Promise<void> {
  await page.locator('.practice-topbar .file-pick input[type="file"]').setInputFiles({
    name: 'practice.csv',
    mimeType: 'text/csv',
    buffer: SAMPLE_CSV,
  });
  await expect(page.getByText(/新增 \d+ 条/)).toBeVisible({ timeout: 10_000 });
}

//
test.describe('练习题页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript( 
      ([practiceKey, skipBuiltinKey, filterKey]: [string, string, string]) => {
        localStorage.removeItem(practiceKey);
        localStorage.removeItem(filterKey);
        localStorage.setItem(skipBuiltinKey, '1');
      },
      [STORAGE_KEY, SKIP_BUILTIN_KEY, FILTER_CATEGORY_KEY] as [string, string, string]
    );

    await page.goto('/#/practice');
    await page.waitForSelector('.practice-app', { timeout: 15_000 });
  });
  // ── AC-PRAC-001 ───────────────────────────────────────────────────────────
  test('AC-PRAC-001 空题库基础状态', async ({ page }) => {
    await expect(page.getByText('暂无题目')).toBeVisible();
    await expect(page.getByRole('button', { name: '加载内置 iOS 题库' })).toBeVisible();
    // 空库全屏态不展示顶栏导航
    await expect(page.locator('.practice-topbar')).toHaveCount(0);
  });
  
  // ── AC-PRAC-002 ───────────────────────────────────────────────────────────
  test('AC-PRAC-002 导入有效题库后更新统计与题面', async ({ page }) => {
    await importCSV(page);

    await expect(page.getByText('共 3 题')).toBeVisible();
    await expect(page.locator('h1.q')).toBeVisible();
    await expect(page.locator('.badge').first()).toBeVisible();
    await expect(page.locator('button', { hasText: '上一题' })).toBeDisabled();
    await expect(page.locator('button', { hasText: '下一题' })).toBeEnabled();
    await expect(page.locator('button', { hasText: '显示参考答案' })).toBeEnabled();
  });

  // ── AC-PRAC-003 ───────────────────────────────────────────────────────────
  test('AC-PRAC-003 显示与隐藏答案', async ({ page }) => {
    await importCSV(page);

    await page.locator('button', { hasText: '显示参考答案' }).click();
    await expect(page.locator('.reference-wrap')).not.toHaveClass(/reference--hidden/);
    await expect(page.locator('.reference-body')).toBeVisible();

    await page.locator('button', { hasText: '隐藏参考答案' }).click();
    await expect(page.locator('.reference-wrap')).toHaveClass(/reference--hidden/);
  });

  // ── AC-PRAC-004 ───────────────────────────────────────────────────────────
  test('AC-PRAC-004 切换题目时重置答案显示状态', async ({ page }) => {
    await importCSV(page);

    await page.locator('button', { hasText: '显示参考答案' }).click();
    await expect(page.locator('.reference-wrap')).not.toHaveClass(/reference--hidden/);

    await page.locator('button', { hasText: '下一题' }).click();
    await expect(page.locator('.reference-wrap')).toHaveClass(/reference--hidden/);
    await expect(page.locator('button', { hasText: '显示参考答案' })).toBeVisible();
  });

  // ── AC-PRAC-005 ───────────────────────────────────────────────────────────
  test('AC-PRAC-005 清空题库流程', async ({ page }) => {
    await importCSV(page);

    await page.locator('button', { hasText: '清空' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('清空题库？')).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: '清空' }).click();

    await expect(page.getByText('暂无题目')).toBeVisible({ timeout: 5_000 });

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(stored).toBeNull();
  });
});
