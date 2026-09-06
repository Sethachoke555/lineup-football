import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../lib/defaults';
import { createMatchResult } from '../lib/match-result';
import { validateProject } from '../lib/validation';

test('legacy projects and result projects round-trip with independent styles', () => {
  const p = createProject(); assert.doesNotThrow(() => validateProject(p));
  p.mode = 'result'; p.matchResult = createMatchResult(p);
  p.matchResult.colors.accent = '#123456'; assert.notEqual(p.colors.accent, '#123456');
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p);
});
test('invalid result scores, images and scorer IDs are rejected', () => {
  for (const score of [-1, 1.5, 100, NaN]) { const p = createProject(); p.matchResult = createMatchResult(p); p.matchResult.home.score = score; assert.throws(() => validateProject(p)); }
  const p = createProject(); p.matchResult = createMatchResult(p); p.matchResult.away.logo = 'https://invalid.test/image'; assert.throws(() => validateProject(p));
  p.matchResult.away.logo = ''; p.matchResult.scorers = [{ id: '1', side: 'home', name: 'Davis', minute: '45+2' }, { id: '1', side: 'away', name: 'Smith', minute: '60' }]; assert.throws(() => validateProject(p));
});
