import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('result workflow, isolated lineup, save/load and exports', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Player name', { exact: true }).fill('KEPT PLAYER');
  await page.getByRole('button', { name: 'MATCH RESULT', exact: true }).click();
  await page.getByLabel('Home team', { exact: true }).fill('HOME UNITED');
  await page.getByLabel('Away team', { exact: true }).fill('AWAY CITY');
  await page.getByLabel('Home score', { exact: true }).fill('3');
  await page.getByLabel('Away score', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Add goal scorer' }).click();
  await page.getByLabel('Scorer 1 name').fill('DAVIS'); await page.getByLabel('Scorer 1 minute').fill('45+2');
  await page.getByRole('button', { name: 'Add goal scorer' }).click();
  await page.getByLabel('Scorer 2 team').selectOption('away'); await page.getByLabel('Scorer 2 name').fill('SMITH');
  await page.getByRole('button', { name: 'Remove scorer 2' }).click();
  const source = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 400; const ctx = c.getContext('2d')!; ctx.fillStyle = '#e03550'; ctx.fillRect(30, 30, 240, 340); return c.toDataURL().split(',')[1]; });
  for (const label of ['Home logo', 'Away logo']) await page.getByLabel(label, { exact: true }).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(source, 'base64') });
  await page.getByText('Background / ภาพพื้นหลัง', { exact: true }).click(); await page.getByLabel('Scene', { exact: true }).selectOption('custom');
  await page.getByLabel('Custom background', { exact: true }).setInputFiles({ name: 'background.png', mimeType: 'image/png', buffer: Buffer.from(source, 'base64') });
  await page.getByRole('button', { name: /Dark Champions/ }).click();
  await page.getByRole('button', { name: 'LINEUP', exact: true }).click();
  await expect(page.getByLabel('Player name', { exact: true })).toHaveValue('KEPT PLAYER');
  await page.getByRole('button', { name: 'MATCH RESULT', exact: true }).click();
  await expect(page.getByLabel('Home score', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Scorer 1 name')).toHaveValue('DAVIS');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('saved');
  await page.reload(); await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByLabel('Home team', { exact: true })).toHaveValue('HOME UNITED');
  for (const size of ['portrait', 'square', 'landscape', 'story']) {
    await page.getByLabel('Result canvas format').selectOption(size);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
    const download = await pending; expect(download.suggestedFilename()).toContain('match-result');
    const data = (await readFile((await download.path())!)).toString('base64');
    expect(await page.evaluate(async (data) => { const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; c.getContext('2d')!.drawImage(image, 0, 0); return c.toDataURL() === document.querySelector('canvas')!.toDataURL(); }, data)).toBe(true);
  }
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'JPG', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!); expect([...bytes.subarray(0, 2)]).toEqual([255, 216]);
  await page.getByLabel('Result canvas format').selectOption('portrait');
  await page.screenshot({ path: 'test-results/match-result-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator('canvas')).toBeVisible();
});
