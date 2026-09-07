import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../lib/defaults';
import { createStartingLineup } from '../lib/starting-lineup';
import { validateProject } from '../lib/validation';

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
