import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function upload(page: Page, opaque = false) {
  const src = await page.evaluate((opaque) => {
    const c = document.createElement('canvas'); c.width = 800; c.height = 1000; const ctx = c.getContext('2d')!;
    if (opaque) { ctx.fillStyle = '#294467'; ctx.fillRect(0, 0, 800, 1000); }
    ctx.fillStyle = '#cf976d'; ctx.beginPath(); ctx.ellipse(400, 220, 120, 165, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#201b1a'; ctx.beginPath(); ctx.ellipse(400, 115, 125, 65, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cf976d'; ctx.fillRect(350, 350, 100, 110);
    ctx.fillStyle = '#e7314b'; ctx.beginPath(); ctx.moveTo(340, 405); ctx.lineTo(170, 470); ctx.lineTo(120, 740); ctx.lineTo(220, 750); ctx.lineTo(240, 940); ctx.lineTo(560, 940); ctx.lineTo(580, 750); ctx.lineTo(680, 740); ctx.lineTo(630, 470); ctx.lineTo(460, 405); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 120px Arial'; ctx.fillText('10', 330, 680);
    return c.toDataURL(opaque ? 'image/jpeg' : 'image/png').split(',')[1];
  }, opaque);
  await page.getByLabel('Player photo', { exact: true }).setInputFiles({ name: opaque ? 'player.jpg' : 'cutout.png', mimeType: opaque ? 'image/jpeg' : 'image/png', buffer: Buffer.from(src, 'base64') });
  await page.getByRole('button', { name: 'Keep Original', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Edit Player Photo' })).toBeVisible();
}
const preview = (page: Page) => page.getByLabel('Live player card preview');
const pixels = (page: Page) => preview(page).evaluate((c: HTMLCanvasElement) => c.toDataURL());
async function openDetails(page: Page, name: string) {
  const summary = page.getByText(name, { exact: true });
  if (!(await summary.locator('..').evaluate((el) => el.hasAttribute('open')))) await summary.click();
}

test('depth controls, alpha layers, presets, persistence and exports', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/'); await upload(page);
  await page.getByLabel('Zoom', { exact: true }).fill('710');
  const crop = page.getByLabel('Drag to position player photo'); const framing = await crop.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole('button', { name: 'Broadcast', exact: true }).click();
  await expect.poll(() => preview(page).evaluate((c: HTMLCanvasElement) => c.width)).toBe(900);
  for (const [label, value] of [['Effect zoom', '1.1'], ['Effect move X', '20'], ['Effect move Y', '-15'], ['Rotation', '8'], ['Tilt X', '9'], ['Tilt Y', '-12'], ['Perspective', '650'], ['Head overlap', '0.4']]) {
    const before = await pixels(page); await page.getByLabel(label, { exact: true }).fill(value);
    await expect.poll(() => pixels(page)).not.toBe(before);
  }
  await openDetails(page, 'Depth shadow');
  for (const [label, value] of [['Shadow X', '30'], ['Shadow Y', '35'], ['Shadow blur', '40'], ['Shadow opacity', '0.7'], ['Shadow distance', '2']]) {
    const before = await pixels(page); await page.getByLabel(label, { exact: true }).fill(value); await expect.poll(() => pixels(page)).not.toBe(before);
  }
  const shadowed = await pixels(page); await page.getByLabel('Shadow', { exact: true }).uncheck(); await expect.poll(() => pixels(page)).not.toBe(shadowed); await page.getByLabel('Shadow', { exact: true }).check();
  await openDetails(page, 'Outline / glow');
  const outlined = await pixels(page); await page.getByLabel('Outline width').fill('6'); await expect.poll(() => pixels(page)).not.toBe(outlined);
  await page.getByLabel('Edge effect').selectOption('team');
  for (const [label, value] of [['Glow strength', '0.8'], ['Glow blur', '30'], ['Glow color', '#00ffcc']]) {
    const before = await pixels(page); await page.getByLabel(label, { exact: true }).fill(value); await expect.poll(() => pixels(page)).not.toBe(before);
  }
  await openDetails(page, '3D card'); await page.getByLabel('Enable 3D card').check();
  for (const [label, value] of [['Card depth', '20'], ['Card shadow', '0.8'], ['Card tilt', '8'], ['Card border', '4'], ['Card radius', '30']]) {
    const before = await pixels(page); await page.getByLabel(label, { exact: true }).fill(value); await expect.poll(() => pixels(page)).not.toBe(before);
  }
  await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(framing);
  await page.getByLabel('Parallax Preview').check(); const staticPixels = await pixels(page);
  await preview(page).hover({ position: { x: 30, y: 30 } }); await expect.poll(() => pixels(page)).not.toBe(staticPixels);
  await page.getByLabel('Parallax Preview').uncheck(); await expect.poll(() => pixels(page)).toBe(staticPixels);
  await page.screenshot({ path: 'test-results/photo-depth-editor.png', fullPage: true });
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]);
  const effect = saved.players[8].photoEffect; expect(effect.mode).toBe('3d'); expect(effect.tiltX).toBe(9); expect(effect.edge.color).toBe('#00ffcc'); expect(effect.parallax).toBeUndefined();
  await page.getByRole('button', { name: 'Edit Photo', exact: true }).click(); await expect(page.getByLabel('Rotation', { exact: true })).toHaveValue('8');
  for (const name of ['Clean Depth', 'Stadium Glow', 'Poster', 'None']) { await page.getByRole('button', { name, exact: true }).click(); await expect.poll(() => crop.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(framing); }
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Layout', exact: true }).click(); await page.getByRole('button', { name: '3-5-2', exact: true }).click();
  await page.getByRole('button', { name: 'Style', exact: true }).click(); await page.getByRole('button', { name: /Stadium Night/ }).click();
  await page.getByRole('button', { name: 'MATCH RESULT', exact: true }).click(); await page.getByRole('button', { name: 'LINEUP', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0].players[8].photoEffect)).toEqual(effect);
  await page.reload(); await page.getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: 'Select SETHACHOKE', exact: true }).click(); await page.getByRole('button', { name: 'Edit Photo', exact: true }).click();
  await expect(page.getByLabel('Tilt X', { exact: true })).toHaveValue('9'); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Layout', exact: true }).click();
  for (const size of ['portrait', 'square', 'landscape', 'story']) {
    await page.getByLabel('Canvas format').selectOption(size);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); const bytes = await readFile((await (await pending).path())!);
    expect(await page.evaluate(async (data) => { const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0); return c.toDataURL() === document.querySelector('canvas')!.toDataURL(); }, bytes.toString('base64'))).toBe(true);
  }
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'JPG', exact: true }).click(); const bytes = await readFile((await (await pending).path())!);
  const error = await page.evaluate(async (data) => { const img = new Image(); img.src = `data:image/jpeg;base64,${data}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0); const a = ctx.getImageData(0, 0, c.width, c.height).data; const b = document.querySelector('canvas')!.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let total = 0; for (let i = 0; i < a.length; i += 4) total += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return total / (a.length / 4 * 3); }, bytes.toString('base64'));
  expect(error).toBeLessThan(4); expect(errors).toEqual([]);
});

test('opaque photos are honest about cutout; transparent cutout works on mobile', async ({ page }) => {
  await page.goto('/'); await upload(page, true); await expect(page.getByRole('button', { name: 'Cutout', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '3D Effect', exact: true }).click(); await expect(page.getByLabel('Tilt X', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await upload(page);
  await page.getByRole('button', { name: 'Cutout', exact: true }).click(); await expect(page.getByLabel('Head overlap')).toBeVisible();
  expect(await preview(page).evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(0);
  await page.getByRole('button', { name: 'Poster', exact: true }).click(); await page.getByLabel('Effect zoom', { exact: true }).fill('1.3');
  expect(await page.getByRole('dialog').evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
});

test('eleven effect players export efficiently from a restored project', async ({ page }) => {
  await page.goto('/'); await upload(page); await page.getByRole('button', { name: 'Stadium Glow', exact: true }).click(); await page.getByRole('button', { name: 'Apply', exact: true }).click(); await page.getByRole('button', { name: 'Save', exact: true }).click();
  const project = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]; const source = p.players[8]; p.players.forEach((player: Record<string, unknown>) => { player.photo = source.photo; player.photoSettings = source.photoSettings; player.photoEffect = source.photoEffect; }); return p; });
  await page.getByRole('button', { name: 'Load', exact: true }).click(); await page.getByLabel('Import project JSON').setInputFiles({ name: 'eleven.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const start = Date.now(); const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); await pending;
  test.info().annotations.push({ type: '11-player export time', description: `${Date.now() - start} ms` });
  await page.screenshot({ path: 'test-results/eleven-depth-players.png', fullPage: true });
});
