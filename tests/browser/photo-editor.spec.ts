import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const [label, width, height, mime] of [
  ['portrait', 600, 900, 'image/jpeg'], ['landscape', 900, 600, 'image/jpeg'],
  ['large JPG', 4000, 6000, 'image/jpeg'], ['transparent PNG', 400, 500, 'image/png'],
  ['edge WEBP', 500, 600, 'image/webp'], ['very tall', 100, 4000, 'image/png'], ['very wide', 4000, 100, 'image/png'],
] as const) {
  test(`photo editor: ${label}`, async ({ page }) => {
    await page.goto('/');
    const source = await page.evaluate(({ width, height, mime }) => {
      const c = document.createElement('canvas'); c.width = width; c.height = height;
      const ctx = c.getContext('2d')!; ctx.fillStyle = '#ed2464'; ctx.fillRect(width * .65, height * .05, width * .3, height * .9);
      return c.toDataURL(mime).split(',')[1];
    }, { width, height, mime });
    const upload = () => page.getByLabel('Player photo', { exact: true }).setInputFiles({ name: 'player.' + mime.split('/')[1], mimeType: mime, buffer: Buffer.from(source, 'base64') });
    await upload();
    const dialog = page.getByRole('dialog', { name: 'Edit Player Photo' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Photo', exact: true })).toHaveCount(0);
    await upload(); await expect(dialog).toBeVisible();
    const crop = page.getByLabel('Drag to position player photo');
    if (label === 'portrait') await page.screenshot({ path: 'test-results/photo-dialog.png' });
    const before = await crop.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const box = (await crop.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 30, box.y + box.height / 2 + 20, { steps: 5 }); await page.mouse.up();
    await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before);
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.mouse.wheel(0, -60);
    await page.getByRole('button', { name: 'Center', exact: true }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(before);
    if (mime === 'image/png') expect(await crop.evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(0);
    await crop.press('ArrowLeft'); await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const edited = await crop.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Photo', exact: true }).click();
    await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(edited);
    await crop.press('ArrowRight'); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Layout', exact: true }).click(); await page.getByRole('button', { name: '4-3-3', exact: true }).click();
    await page.getByRole('button', { name: 'Style', exact: true }).click(); await page.getByRole('button', { name: /Minimal White/ }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]);
    expect(saved.players[8].photo).toBe(`data:${mime};base64,${source}`);
    expect(saved.players[8].photoSettings.x).toBeLessThan(0);
    await page.reload(); await page.getByRole('button', { name: 'Load', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click();
    await page.getByRole('button', { name: 'Select SETHACHOKE', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Photo', exact: true }).click();
    await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(edited);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    expect(await page.evaluate(async (data) => {
      const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0);
      return c.toDataURL() === document.querySelector('canvas')!.toDataURL();
    }, bytes.toString('base64'))).toBe(true);
  });
}

test('mobile touch drag and modal fit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await page.goto('/');
  const buffer = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 100; c.height = 150; c.getContext('2d')!.fillRect(20, 20, 60, 100); return c.toDataURL().split(',')[1]; }), 'base64');
  await page.getByLabel('Player photo', { exact: true }).setInputFiles({ name: 'mobile.png', mimeType: 'image/png', buffer });
  const crop = page.getByLabel('Drag to position player photo'); await expect(crop).toBeVisible();
  const before = await crop.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const box = (await crop.boundingBox())!; const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 100, y: box.y + 100 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 125, y: box.y + 140 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before);
  expect(await page.getByRole('dialog').evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Apply', exact: true }).click(); await context.close();
});
