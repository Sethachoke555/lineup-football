import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('starting lineup reuses squad, reorders, edits hero and exports all sizes', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'LINEUP', exact: true }).click(); await page.getByRole('button', { name: 'Squad', exact: true }).click(); await page.getByRole('button', { name: 'Add substitute', exact: true }).click(); await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click();
  await expect(page.getByRole('button', { name: 'STARTING LINEUP', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.left-sidebar .starting-row')).toHaveCount(11);
  await page.locator('.starting-row .player-list-name').first().click();
  await page.getByRole('button', { name: /Move KITTIPONG down/ }).click();
  await page.getByLabel('Template').selectOption('club-poster'); await page.getByLabel('Name style').selectOption('surname');
  await page.getByLabel('Hero from squad').selectOption({ index: 1 }); await page.getByLabel('Hero zoom').fill('1.3'); await page.getByLabel('Hero move X').fill('20'); await page.getByLabel('Hero move Y').fill('-10');
  await page.getByLabel('Show match info').uncheck(); await page.getByLabel('Show match info').check();
  await expect(page.locator('.starting-controls .starting-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.getByRole('status')).toContainText('saved');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]); expect(saved.startingLineup.starters).toHaveLength(11); expect(saved.startingLineup.hero.zoom).toBe(1.3);
  await page.reload(); await page.getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click(); await expect(page.getByLabel('Hero zoom')).toHaveValue('1.3');
  for (const size of ['portrait', 'square', 'landscape', 'story']) { await page.getByLabel('Canvas format').selectOption(size); const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); const download = await pending; expect(download.suggestedFilename()).toContain('starting-xi'); const bytes = await readFile((await download.path())!); expect(await page.evaluate(async (data) => { const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); return [img.naturalWidth, img.naturalHeight]; }, bytes.toString('base64'))).toEqual(size === 'portrait' ? [1080, 1350] : size === 'square' ? [1080, 1080] : size === 'landscape' ? [1920, 1080] : [1080, 1920]); }
  await page.getByRole('button', { name: 'MATCH RESULT', exact: true }).click(); await expect(page.getByText('Match details')).toBeVisible(); await page.getByRole('button', { name: 'LINEUP', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Starting lineup' })).toBeVisible();
});
