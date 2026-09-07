import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../lib/defaults';
import { createStartingLineup } from '../lib/starting-lineup';
import { validateProject } from '../lib/validation';

const originalSrc = 'data:image/jpeg;base64,YQ==';
const cutoutSrc = 'data:image/png;base64,Yg==';
test('original and cutout round-trip with active source and crop intact', () => {
  const p = createProject();
  p.players[0].photo = cutoutSrc;
  p.players[0].playerPhoto = { originalSrc, cutoutSrc, activeVersion: 'cutout' };
  p.startingLineup = createStartingLineup(p);
  p.startingLineup.hero = { src: cutoutSrc, x: 15, y: -10, zoom: 1.2, playerPhoto: { originalSrc, cutoutSrc, activeVersion: 'cutout' } };
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), JSON.parse(JSON.stringify(p)));
  p.players[0].playerPhoto.activeVersion = 'original';
  assert.throws(() => validateProject(p), /Active photo/);
  p.players[0].photo = originalSrc;
  assert.doesNotThrow(() => validateProject(p));
});
test('legacy photos load while malformed versions are rejected', () => {
  const p = createProject(); assert.doesNotThrow(() => validateProject(p));
  p.players[0].photo = cutoutSrc;
  p.players[0].playerPhoto = { originalSrc, cutoutSrc: 'https://example.com/cutout.png', activeVersion: 'cutout' };
  assert.throws(() => validateProject(p));
});
