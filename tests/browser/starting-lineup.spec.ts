import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createProject, newPlayer } from '../../lib/defaults';
import { createStartingLineup } from '../../lib/starting-lineup';

test('starting lineup backgrounds, safe hero, text scale and custom cover persist', async ({ page }) => {
  await page.goto('/');
  const project = createProject(); project.mode = 'starting-lineup';
  const assets = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 800;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#ec376d'; ctx.fillRect(70, 10, 260, 780);
    const hero = c.toDataURL();
    c.width = 1200; c.height = 300; ctx.fillStyle = '#289d72'; ctx.fillRect(0, 0, 1200, 300);
    ctx.fillStyle = '#394ed4'; ctx.fillRect(500, 0, 200, 300);
    return { hero, background: c.toDataURL() };
  });
  for (let i = 0; i < 12; i++) project.players.push(newPlayer(11 + i, 'substitute'));
  project.players[1].name = 'ณรงค์';
  project.startingLineup = createStartingLineup(project);
  project.startingLineup.hero = { src: assets.hero, zoom: 1, x: 0, y: 0 };
  project.startingLineup.starters[0].captain = true;
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByLabel('Import project JSON').setInputFiles({ name: 'sheet.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.getByLabel('Text Size', { exact: true })).toHaveValue('125');
  const canvas = page.getByLabel('Starting Lineup preview', { exact: true });
  const shots = new Set<string>();
  for (const preset of ['Modern Dark', 'Stadium Lights', 'Club Texture', 'Clean White', 'Blue Grunge', 'Red Energy', 'Minimal', 'Championship']) {
    const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.getByRole('button', { name: preset, exact: true }).click();
    if (preset !== 'Modern Dark') await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before);
    shots.add(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()));
  }
  expect(shots.size).toBe(8);
  await page.getByRole('button', { name: 'Modern Dark', exact: true }).click();
  const rightPixels = () => canvas.evaluate((c: HTMLCanvasElement) => {
    const copy = document.createElement('canvas'); copy.width = Math.floor(c.width / 2); copy.height = c.height;
    copy.getContext('2d')!.drawImage(c, c.width / 2, 0, c.width / 2, c.height, 0, 0, copy.width, copy.height);
    return copy.toDataURL();
  });
  for (const size of ['portrait', 'square', 'story', 'landscape']) {
    await page.getByLabel('Canvas format').selectOption(size);
    await page.getByLabel('Hero move X').fill('-50');
    // Wait for the asynchronous canvas render to settle before comparing independent regions.
    await page.waitForTimeout(150);
    const right = await rightPixels();
    await page.getByLabel('Hero move X').fill('50'); await page.getByLabel('Hero zoom').fill('2');
    await page.waitForTimeout(150); expect(await rightPixels()).toBe(right);
  }
  await page.getByLabel('Canvas format').selectOption('portrait');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Text Size', { exact: true }).fill('150');
  await page.getByText('Customize background', { exact: true }).click();
  await page.getByLabel('Custom starting background', { exact: true }).setInputFiles({ name: 'background.png', mimeType: 'image/png', buffer: Buffer.from(assets.background.split(',')[1], 'base64') });
  await page.getByLabel('Background opacity', { exact: true }).fill('75');
  await page.getByLabel('Background brightness', { exact: true }).fill('110');
  await page.getByLabel('Background blur', { exact: true }).fill('3');
  await page.getByLabel('Overlay strength', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]);
  expect(saved.startingLineup.textScale).toBe(1.5); expect(saved.startingLineup.backgroundOpacity).toBe(75);
  expect(saved.startingLineup.starters).toEqual(project.startingLineup.starters);
  expect(saved.startingLineup.substitutes).toEqual(project.startingLineup.substitutes);
  expect(saved.team).toEqual(project.team); expect(saved.startingLineup.colors).toEqual(project.startingLineup.colors);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  expect(await page.evaluate(async (base64) => { const image = new Image(); image.src = 'data:image/png;base64,' + base64; await image.decode(); const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; c.getContext('2d')!.drawImage(image, 0, 0); return c.toDataURL() === (document.querySelector('canvas') as HTMLCanvasElement).toDataURL(); }, bytes.toString('base64'))).toBe(true);
  await page.getByLabel('Text Size', { exact: true }).fill('125');
  await page.getByRole('button', { name: 'Modern Dark', exact: true }).click();
  await page.waitForTimeout(150);
  await canvas.screenshot({ path: 'test-results/starting-readable.png' });
  await page.reload();
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByLabel('Text Size', { exact: true })).toHaveValue('150');
  await page.getByText('Customize background', { exact: true }).click();
  await expect(page.getByLabel('Background opacity', { exact: true })).toHaveValue('75');
});

test('starting lineup six templates preserve selection through auto design and shuffle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click();
  await page.locator('.starting-row .player-list-name').first().click();
  const names = await page.locator('.left-sidebar .player-list-name').allTextContents();
  const renders = new Set<string>();
  for (const template of ['hero-xi', 'formation-pro', 'player-cards', 'clean-xi', 'matchday-xi', 'stadium-xi']) {
    await page.getByLabel('Template', { exact: true }).selectOption(template);
    await page.getByRole('button', { name: 'Auto Design', exact: true }).click();
    await page.getByRole('button', { name: 'Shuffle Design', exact: true }).click();
    await expect(page.locator('.left-sidebar .player-list-name')).toHaveText(names);
    await expect(page.getByLabel('Captain', { exact: true })).toHaveCount(1);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
    renders.add((await readFile((await (await pending).path())!)).toString('base64'));
  }
  expect(renders.size).toBe(6);
});

test('starting lineup reuses squad, reorders, edits hero and exports all sizes', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'LINEUP', exact: true }).click(); await page.getByRole('button', { name: 'Squad', exact: true }).click(); await page.getByRole('button', { name: 'Add substitute', exact: true }).click(); await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click();
  await expect(page.getByRole('button', { name: 'STARTING LINEUP', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.left-sidebar .starting-row')).toHaveCount(11);
  await page.locator('.starting-row .player-list-name').first().click();
  await page.getByRole('button', { name: /Move KITTIPONG down/ }).click();
  await page.getByLabel('Advanced editing').check(); await page.getByLabel('Template').selectOption('matchday-xi'); await page.getByLabel('Name style').selectOption('surname');
  await page.getByLabel('Hero from squad').selectOption({ index: 1 }); await page.getByLabel('Hero zoom').fill('1.3'); await page.getByLabel('Hero move X').fill('20'); await page.getByLabel('Hero move Y').fill('-10');
  await page.getByLabel('Show match info').uncheck(); await page.getByLabel('Show match info').check();
  await expect(page.locator('.starting-controls .starting-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.getByRole('status')).toContainText('saved');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('touchline.projects.v1')!)[0]); expect(saved.startingLineup.starters).toHaveLength(11); expect(saved.startingLineup.hero.zoom).toBe(1.3);
  await page.reload(); await page.getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Load', exact: true }).click(); await page.getByRole('button', { name: 'STARTING LINEUP', exact: true }).click(); await expect(page.getByLabel('Hero zoom')).toHaveValue('1.3');
  for (const size of ['portrait', 'square', 'landscape', 'story']) { await page.getByLabel('Canvas format').selectOption(size); const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export PNG', exact: true }).click(); const download = await pending; expect(download.suggestedFilename()).toContain('starting-xi'); const bytes = await readFile((await download.path())!); expect(await page.evaluate(async (data) => { const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); return [img.naturalWidth, img.naturalHeight]; }, bytes.toString('base64'))).toEqual(size === 'portrait' ? [1080, 1350] : size === 'square' ? [1080, 1080] : size === 'landscape' ? [1920, 1080] : [1080, 1920]); }
  await page.getByRole('button', { name: 'MATCH RESULT', exact: true }).click(); await expect(page.getByText('Match details')).toBeVisible(); await page.getByRole('button', { name: 'LINEUP', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Starting lineup' })).toBeVisible();
});
