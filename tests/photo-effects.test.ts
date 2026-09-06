import test from 'node:test';
import assert from 'node:assert/strict';
import { EFFECT_PRESETS, photoEffectPreset, projectPhotoPoint } from '../lib/photo-effects';
import { createProject } from '../lib/defaults';
import { validateProject } from '../lib/validation';
import { arrangePlayers } from '../lib/formations';
import { applyTemplate, TEMPLATES } from '../lib/templates';

test('all effect presets validate, round-trip and survive formation/template changes', () => {
  for (const name of EFFECT_PRESETS) {
    const p = createProject(); p.players[0].photoEffect = photoEffectPreset(name);
    assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p);
    assert.deepEqual(arrangePlayers(p.players, '3-5-2')[0].photoEffect, p.players[0].photoEffect);
    for (const template of TEMPLATES) assert.deepEqual(applyTemplate(p, template).players[0].photoEffect, p.players[0].photoEffect);
  }
  const a = photoEffectPreset('Broadcast'); a.shadow.x = 55; assert.equal(photoEffectPreset('Broadcast').shadow.x, 10);
});
test('projection is identity at rest, preserves uniform scale, and adds perspective foreshortening', () => {
  const e = photoEffectPreset('Clean Depth'); const point = { x: 120, y: 80 };
  assert.deepEqual(projectPhotoPoint(point, e), point);
  assert.deepEqual(projectPhotoPoint(point, { ...e, zoom: 1.5 }), { x: 180, y: 120 });
  const right = projectPhotoPoint({ x: 100, y: 0 }, { ...e, tiltY: 20 });
  const left = projectPhotoPoint({ x: -100, y: 0 }, { ...e, tiltY: 20 });
  assert.ok(Math.abs(left.x) > right.x);
  assert.notEqual(projectPhotoPoint(point, { ...e, tiltX: 20, perspective: 600 }).y, projectPhotoPoint(point, { ...e, tiltX: 20, perspective: 2000 }).y);
});
test('all allowed extreme projections remain finite and in front of the camera', () => {
  for (const tiltX of [-20, 20]) for (const tiltY of [-20, 20]) for (const x of [-280, 280]) for (const y of [-440, 220]) {
    const p = projectPhotoPoint({ x, y }, { ...photoEffectPreset(), tiltX, tiltY, perspective: 600, zoom: 1.5 });
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); assert.ok(Math.abs(p.x) < 2000 && Math.abs(p.y) < 2000);
  }
});
test('effect import rejects bad nested settings and unbounded rendering work', () => {
  for (const patch of [{ zoom: NaN }, { perspective: 0 }, { tiltX: 90 }, { overlap: 100 }, { shadow: { enabled: true, blur: 500 } }, { edge: { color: 'url(http://invalid)' } }, { card: null }]) {
    const p = createProject(); p.players[0].photoEffect = { ...photoEffectPreset(), ...patch } as typeof p.players[0]['photoEffect'];
    assert.throws(() => validateProject(p));
  }
});
