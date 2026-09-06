import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PHOTO_SETTINGS, photoPlacement, settingsForPlayer, playerPhotoFrame, zoomPhotoAt } from '../lib/photo-crop';
import { newPlayer } from '../lib/defaults';
import { validateProject } from '../lib/validation';
import { createProject } from '../lib/defaults';

test('portrait placement keeps proportions and scales identically at export resolution', () => {
  for (const image of [{ width: 600, height: 900 }, { width: 4000, height: 100 }, { width: 100, height: 4000 }]) {
    const s = { ...DEFAULT_PHOTO_SETTINGS, x: -.15, y: .12, zoom: 2.3 };
    const a = photoPlacement(image, s, { x: 0, y: 0, width: 80, height: 100 });
    const b = photoPlacement(image, s, { x: 0, y: 0, width: 800, height: 1000 });
    assert.ok(Math.abs(a.width / a.height - image.width / image.height) < 1e-10);
    for (const key of ['x', 'y', 'width', 'height'] as const) assert.ok(Math.abs(b[key] - a[key] * 10) < 1e-9);
  }
});

test('zoom keeps the source point under the cursor stationary', () => {
  const image = { width: 900, height: 600 }; const s = { ...DEFAULT_PHOTO_SETTINGS, zoom: 1, x: .1, y: -.1 };
  const focus = { x: .2, y: .1 }; const frame = { x: -.5, y: -.625, width: 1, height: 1.25 };
  const a = photoPlacement(image, s, frame); const b = photoPlacement(image, zoomPhotoAt(s, 2, focus, image), frame);
  assert.ok(Math.abs((focus.x - a.x) / a.width - (focus.x - b.x) / b.width) < 1e-9);
  assert.ok(Math.abs((focus.y * 1.25 - a.y) / a.height - (focus.y * 1.25 - b.y) / b.height) < 1e-9);
});

test('legacy crop migration preserves old placement for all frames', () => {
  for (const crop of ['portrait', 'circle', 'square'] as const) {
    const player = newPlayer(0, 'starting'); player.transform = { crop, x: 30, y: -20, zoom: 1.5, scale: .8 };
    const image = { width: 800, height: 1200 }; const s = settingsForPlayer(player, image);
    const f = playerPhotoFrame(s, 100, 105); const actual = photoPlacement(image, s, f);
    const fit = (crop === 'portrait' ? Math.min : Math.max)(88 / 800, f.height / 1200) * 1.5 * .8;
    assert.ok(Math.abs(actual.x - (-800 * fit / 2 + .15 * 88)) < 1e-9);
    assert.ok(Math.abs(actual.y - (-105 * .52 + (f.height - 1200 * fit) / 2 - .1 * f.height)) < 1e-9);
    const project = createProject(); project.players[0].photoSettings = s; assert.doesNotThrow(() => validateProject(project));
  }
});

test('crop imports reject non-finite values and invalid aspect ratios', () => {
  for (const patch of [{ zoom: NaN }, { x: Infinity }, { cropWidth: 0 }, { cropHeight: 4 }, { zoom: 513 }]) {
    const p = createProject(); p.players[0].photoSettings = { ...DEFAULT_PHOTO_SETTINGS, ...patch };
    assert.throws(() => validateProject(p));
  }
});
