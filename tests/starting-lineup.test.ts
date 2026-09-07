import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../lib/defaults';
import { createStartingLineup } from '../lib/starting-lineup';
import { validateProject } from '../lib/validation';
import { autoDesign, shuffleDesign, STARTING_LINEUP_TEMPLATES } from '../features/starting-lineup/utils/design';

test('all six designs round-trip without changing club or selected players', () => {
  const project = createProject();
  const original = createStartingLineup(project);
  original.starters[2].captain = true;
  original.starters[0].displayName = 'สมชาย VERY LONG FOOTBALL PLAYER NAME';
  for (const template of STARTING_LINEUP_TEMPLATES) {
    for (const size of ['portrait', 'square', 'story', 'landscape'] as const) {
      const data = { ...original, template: template.id, size };
      let designed = { ...data, ...autoDesign(project, data) };
      for (let i = 0; i < 6; i++) {
        designed = { ...designed, ...shuffleDesign(designed) };
        assert.deepEqual(designed.starters, original.starters);
        assert.deepEqual(designed.substitutes, original.substitutes);
        const saved = validateProject(JSON.parse(JSON.stringify({ ...project, startingLineup: designed })));
        assert.deepEqual(saved.team, project.team);
        assert.deepEqual(saved.players, project.players);
        assert.deepEqual(saved.startingLineup, JSON.parse(JSON.stringify(designed)));
      }
    }
  }
});

test('starting lineup initializes from the squad and survives save/load', () => {
  const project = createProject(); project.mode = 'starting-lineup'; project.startingLineup = createStartingLineup(project);
  assert.equal(project.startingLineup.starters.length, 11); assert.equal(project.startingLineup.substitutes.length, 0);
  project.startingLineup.starters.reverse(); project.startingLineup.starters[0].captain = true; project.startingLineup.hero = { src: project.players[0].photo, playerId: project.players[0].id, x: 14, y: -8, zoom: 1.25 };
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), project);
});

test('starting lineup rejects duplicate or incomplete starters and invalid hero settings', () => {
  const project = createProject(); project.startingLineup = createStartingLineup(project);
  project.startingLineup.starters = project.startingLineup.starters.slice(0, 10); assert.throws(() => validateProject(project));
  project.startingLineup.starters = createStartingLineup(project).starters; project.startingLineup.starters[1].playerId = project.startingLineup.starters[0].playerId; assert.throws(() => validateProject(project));
  project.startingLineup.starters = createStartingLineup(project).starters; project.startingLineup.hero.zoom = 4; assert.throws(() => validateProject(project));
});
