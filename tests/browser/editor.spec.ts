import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function canvasReady(page: Page) { await expect.poll(() => page.locator('canvas').evaluate((c: HTMLCanvasElement) => c.width)).toBe(1080); }
test('edit, drag, undo, save, template change and reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/'); await canvasReady(page);
  await page.getByRole('button', { name: 'Select SETHACHOKE', exact: true }).click();
  await page.getByLabel('Player name', { exact: true }).fill('TEST STRIKER');
  await expect(page.getByRole('button', { name: 'Select TEST STRIKER' })).toBeVisible();
  const player = page.getByRole('button', { name: 'Select TEST STRIKER' }); const box = (await player.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 + 20, { steps: 8 }); await page.mouse.up();
  const moved = (await player.boundingBox())!; expect(moved.x).toBeGreaterThan(box.x + 20);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await player.boundingBox())!.x).toBeCloseTo(box.x, 0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  const beforeSub = (await player.boundingBox())!;
  await page.getByRole('button', { name: 'Add substitute', exact: true }).click();
  expect((await player.boundingBox())!.x).toBeCloseTo(beforeSub.x, 0);
  expect((await player.boundingBox())!.y).toBeCloseTo(beforeSub.y, 0);
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.getByRole('status')).toContainText('saved');
  await page.getByRole('button', { name: 'Style', exact: true }).click(); await page.getByRole('button', { name: /Minimal White/ }).click();
  await expect(player).toBeVisible(); await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.locator('.save-indicator')).toHaveText('Saved locally');
  await expect(page.getByRole('button', { name: /Broadcast Blue/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(player).toBeVisible(); expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/editor-desktop.png', fullPage: true });
});
test('uploads alpha PNG, adjusts crop and exports all sizes as PNG/JPG', async ({ page }) => {
  await page.goto('/'); await canvasReady(page);
  const source = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 120; c.height = 160; const ctx = c.getContext('2d')!; ctx.fillStyle = '#fa00ff'; ctx.fillRect(30, 20, 60, 120); return c.toDataURL('image/png').split(',')[1]; });
  await page.getByRole('button', { name: 'Select SETHACHOKE', exact: true }).click();
  await page.getByLabel('Player photo', { exact: true }).setInputFiles({ name: 'cutout.png', mimeType: 'image/png', buffer: Buffer.from(source, 'base64') });
  await page.getByRole('button', { name: 'Keep Original', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Edit Player Photo' })).toBeVisible();
  await page.getByLabel('Zoom', { exact: true }).fill('734');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]);
  expect(saved.players[8].photo).toBe(`data:image/png;base64,${source}`); expect(saved.players[8].photoSettings.zoom).toBeCloseTo(1.5, 2);
  await page.getByRole('button', { name: 'Layout', exact: true }).click();
  for (const [size, width, height] of [['portrait', 1080, 1350], ['square', 1080, 1080], ['landscape', 1920, 1080], ['story', 1080, 1920]] as const) {
    await page.getByLabel('Canvas format').selectOption(size);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); const download = await pending;
    const bytes = await readFile((await download.path())!); expect(bytes.readUInt32BE(16)).toBe(width); expect(bytes.readUInt32BE(20)).toBe(height);
    await expect(page.getByRole('button', { name: 'Export PNG', exact: true })).toBeEnabled();
  }
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'JPG', exact: true }).click(); const download = await pending;
  const bytes = await readFile((await download.path())!); expect(bytes[0]).toBe(255); expect(bytes[1]).toBe(216); expect(download.suggestedFilename()).toBe('nondaeng-fc-lineup-2026.jpg');
  const dimensions = await page.evaluate(async (data) => { const image = new Image(); image.src = `data:image/jpeg;base64,${data}`; await image.decode(); return [image.naturalWidth, image.naturalHeight]; }, bytes.toString('base64'));
  expect(dimensions).toEqual([1080, 1920]);
});
test('formation switching, full squad capacity, JSON backup and import', async ({ page }) => {
  await page.goto('/'); await canvasReady(page); await page.getByRole('button', { name: 'Layout', exact: true }).click();
  for (const f of ['4-4-2','4-3-3','4-2-3-1','4-1-4-1','4-1-2-1-2','3-4-3','3-5-2','3-4-2-1','5-3-2','5-4-1']) { await page.getByRole('button', { name: f, exact: true }).click(); await expect(page.locator('.player-hitbox')).toHaveCount(11); }
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Add substitute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add substitute', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add starter', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'JSON backup', exact: true }).click(); const backup = await pending;
  await page.getByLabel('Import project JSON').setInputFiles((await backup.path())!);
  await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(page.locator('.squad-row')).toHaveCount(23);
});
test('mobile preview and editing fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await canvasReady(page);
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Team', exact: true }).click(); await page.getByLabel('Team name', { exact: true }).fill('MOBILE FC');
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', /MOBILE FC/);
  await page.screenshot({ path: 'test-results/editor-mobile.png', fullPage: true });
});
test('project duplication/deletion, roster deletion/duplication and reset undo work', async ({ page }) => {
  await page.goto('/'); await canvasReady(page);
  await page.getByRole('button', { name: 'Duplicate SETHACHOKE', exact: true }).click(); await expect(page.locator('.squad-row')).toHaveCount(12);
  await page.getByRole('button', { name: 'Delete SETHACHOKE copy', exact: true }).click(); await expect(page.locator('.squad-row')).toHaveCount(11);
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await expect(page.locator('.squad-row')).toHaveCount(12);
  await page.getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('button', { name: 'Duplicate current', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(page.getByLabel('Project name')).toHaveValue(/copy$/); await expect(page.locator('.save-indicator')).toHaveText('Saved locally');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: /Delete project/ }).click(); await expect(page.getByText('No saved matchdays yet')).toBeVisible();
  await page.getByRole('button', { name: 'Close project library' }).click();
  await expect(page.locator('.save-indicator')).toHaveText('Unsaved');
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset project', exact: true }).click(); await expect(page.locator('.squad-row')).toHaveCount(11);
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await expect(page.locator('.squad-row')).toHaveCount(12);
});
test('logos, custom backgrounds, JPG/WEBP uploads and export match the live canvas', async ({ page }) => {
  await page.goto('/'); await canvasReady(page);
  const sources = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 240; c.height = 240; const ctx = c.getContext('2d')!; ctx.fillStyle = '#cf306a'; ctx.fillRect(0, 0, 240, 240); ctx.fillStyle = '#ffffff'; ctx.fillRect(60, 60, 120, 120); return { png: c.toDataURL('image/png').split(',')[1], jpg: c.toDataURL('image/jpeg').split(',')[1], webp: c.toDataURL('image/webp').split(',')[1] }; });
  await page.getByRole('button', { name: 'Team', exact: true }).click();
  await page.getByLabel('Team logo', { exact: true }).setInputFiles({ name: 'crest.png', mimeType: 'image/png', buffer: Buffer.from(sources.png, 'base64') });
  await page.getByLabel('Opponent logo', { exact: true }).setInputFiles({ name: 'opponent.webp', mimeType: 'image/webp', buffer: Buffer.from(sources.webp, 'base64') });
  await page.getByRole('button', { name: 'Scene', exact: true }).click(); await page.getByLabel('Scene', { exact: true }).selectOption('custom');
  await page.getByLabel('Custom background', { exact: true }).setInputFiles({ name: 'stadium.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(sources.jpg, 'base64') });
  await expect(page.getByRole('button', { name: 'Remove custom background', exact: true })).toBeVisible();
  await page.getByLabel('Brightness', { exact: true }).fill('80'); await page.getByLabel('Blur', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Select SETHACHOKE', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); const download = await pending; const bytes = await readFile((await download.path())!);
  const match = await page.evaluate(async (data) => { const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0); return c.toDataURL() === document.querySelector('canvas')!.toDataURL(); }, bytes.toString('base64'));
  expect(match).toBe(true);
});
test('storage failures report an error and keep JSON backup available', async ({ page }) => {
  await page.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function (key, value) { if (key === 'touchline.projects.v1') throw new DOMException('Full', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await page.goto('/'); await canvasReady(page); await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.status-message')).toContainText('Local save failed'); await expect(page.locator('.save-indicator')).toHaveText('Unsaved');
  await page.getByRole('button', { name: 'Load', exact: true }).click(); const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'JSON backup', exact: true }).click(); expect((await pending).suggestedFilename()).toMatch(/\.json$/);
});
test('blocked browser storage does not crash the project library', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/'); await canvasReady(page); await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Blocked'); expect(errors).toEqual([]);
});
