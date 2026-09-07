import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('background removal preserves alpha, both versions, crop and hero export', async ({ page }) => {
  await page.goto('/');
  const src = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 300; c.height = 600;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#e83459'; ctx.fillRect(80, 10, 140, 580);
    return c.toDataURL();
  });
  await page.getByLabel('Player photo', { exact: true }).setInputFiles({ name: 'cutout.png', mimeType: 'image/png', buffer: Buffer.from(src.split(',')[1], 'base64') });
  const dialog = page.getByRole('dialog', { name: 'Player Photo — Background Removal' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Use Cutout', exact: true })).toBeEnabled({ timeout: 30000 });
  await dialog.getByRole('button', { name: 'Use Cutout', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const player = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0].players[8]);
  expect(player.playerPhoto.originalSrc).toBe(src);
  expect(player.playerPhoto.activeVersion).toBe('cutout');
  expect(player.photo).toBe(player.playerPhoto.cutoutSrc);
  expect(await page.evaluate(async (src) => {
    const image = new Image(); image.src = src; await image.decode();
    const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; c.getContext('2d')!.drawImage(image, 0, 0);
    return [image.width, image.height, c.getContext('2d')!.getImageData(0, 0, 1, 1).data[3]];
  }, player.photo)).toEqual([300, 600, 0]);
  await page.getByRole('button', { name: 'Use Original', exact: true }).click();
  await page.getByRole('button', { name: 'Use Cutout', exact: true }).click();
  await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click();
  await page.getByLabel('Hero from squad').selectOption(player.id);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
  expect((await readFile((await (await download).path())!)).byteLength).toBeGreaterThan(1000);
});

test('background removal real inference keeps source dimensions', async ({ page }) => {
  test.skip(!process.env.REMOVAL_PHOTO, 'Set REMOVAL_PHOTO to a local real player photo for model integration testing.');
  test.setTimeout(300000);
  await page.goto('/');
  await page.getByLabel('Player photo', { exact: true }).setInputFiles(process.env.REMOVAL_PHOTO!);
  const dialog = page.getByRole('dialog', { name: 'Player Photo — Background Removal' });
  await expect(dialog.getByRole('button', { name: 'Use Cutout', exact: true })).toBeEnabled({ timeout: 250000 });
  await page.screenshot({ path: 'test-results/removal-real.png' });
  await dialog.getByRole('button', { name: 'Use Cutout', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0].players[8]);
  expect(p.playerPhoto.cutoutSrc).not.toBe(p.playerPhoto.originalSrc);
  const result = await page.evaluate(async (photo) => {
    const a = new Image(); a.src = photo.originalSrc; await a.decode();
    const b = new Image(); b.src = photo.cutoutSrc; await b.decode();
    const c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const ctx = c.getContext('2d')!; ctx.drawImage(b, 0, 0);
    const pixels = ctx.getImageData(0, 0, b.width, b.height).data;
    let transparent = 0, opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] < 10) transparent++; if (pixels[i] > 245) opaque++; }
    return { same: a.width === b.width && a.height === b.height, transparent, opaque };
  }, p.playerPhoto);
  expect(result.same).toBe(true); expect(result.transparent).toBeGreaterThan(100); expect(result.opaque).toBeGreaterThan(100);
});
