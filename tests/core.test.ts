import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, newPlayer } from '../lib/defaults';
import { arrangePlayers, formationSlots, placeStarter } from '../lib/formations';
import { FORMATIONS, SIZES } from '../types/project';
import { applyTemplate, TEMPLATES } from '../lib/templates';
import { LocalProjectRepository, STORAGE_KEY } from '../lib/storage';
import { validateProject } from '../lib/validation';
import { graphicLayout } from '../lib/renderer';
class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
test('every formation has eleven unique, bounded positions with a goalkeeper at the bottom', () => {
  for (const formation of FORMATIONS) {
    const slots = formationSlots(formation); assert.equal(slots.length, 11); assert.equal(new Set(slots.map((p) => `${p.x},${p.y}`)).size, 11);
    assert.ok(slots.every((p) => p.x >= 10 && p.x <= 90 && p.y >= 10 && p.y <= 90));
    assert.ok(slots.slice(1).every((p) => p.y < slots[0].y));
  }
});
test('formation changes preserve player data and substitute coordinates', () => {
  const project = createProject(); const sub = newPlayer(11, 'substitute'); project.players.push(sub);
  const arranged = arrangePlayers(project.players, '3-4-2-1');
  assert.equal(arranged[11], sub); assert.equal(arranged[4].id, project.players[4].id); assert.equal(arranged[4].name, project.players[4].name);
  assert.notDeepEqual(arranged[4], project.players[4]); assert.equal(project.formation, '4-3-3');
});
test('all four templates preserve squad, team and manual coordinates', () => {
  const p = createProject(); p.players[3].x = 31.25;
  for (const t of TEMPLATES) { const next = applyTemplate(p, t); assert.equal(next.players, p.players); assert.equal(next.team, p.team); assert.equal(next.players[3].x, 31.25); assert.equal(next.template, t.id); }
});
test('a promoted starter fills an available slot without moving existing players', () => {
  const p = createProject(); p.players = arrangePlayers(p.players, p.formation).slice(0, 10); p.players[3].x = 33.5;
  const before = structuredClone(p.players); const placed = placeStarter(newPlayer(11), p.players, p.formation);
  assert.deepEqual(p.players, before); assert.ok(!p.players.some((x) => x.x === placed.x && x.y === placed.y));
});
test('all output layouts keep formation cards inside the pitch region', () => {
  for (const size of Object.keys(SIZES) as (keyof typeof SIZES)[]) for (const formation of FORMATIONS) {
    const layout = graphicLayout({ ...createProject(), size, formation });
    for (const point of formationSlots(formation)) {
      assert.ok(point.x / 100 * layout.pitch.width - layout.cardWidth * .55 >= 0);
      assert.ok(point.y / 100 * layout.pitch.height - layout.cardHeight * .55 >= 0);
      assert.ok(point.y / 100 * layout.pitch.height + layout.cardHeight * .55 <= layout.pitch.height);
    }
  }
});
test('save, load, update, duplicate and delete round-trip through the repository', async () => {
  const repository = new LocalProjectRepository(new MemoryStorage()); const p = createProject();
  await repository.save(p); assert.deepEqual(await repository.get(p.id), p);
  p.team.name = 'Test FC'; await repository.save(p); assert.equal((await repository.list()).length, 1);
  const copy = await repository.duplicate(p); assert.notEqual(copy.id, p.id); assert.equal((await repository.list()).length, 2);
  await repository.remove(p.id); assert.equal(await repository.get(p.id), null); assert.equal((await repository.list()).length, 1);
});
test('quota failures are surfaced and existing storage is preserved', async () => {
  const storage = new MemoryStorage(); const p = createProject(); await new LocalProjectRepository(storage).save(p); const before = storage.getItem(STORAGE_KEY);
  const broken = new LocalProjectRepository({ getItem: (key) => storage.getItem(key), setItem: () => { throw new Error('QuotaExceededError'); } });
  await assert.rejects(broken.save({ ...p, name: 'Changed' }), /storage is full/); assert.equal(storage.getItem(STORAGE_KEY), before);
});
test('corrupt libraries and unsafe imports are rejected without writes', async () => {
  const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, '{bad');
  await assert.rejects(new LocalProjectRepository(storage).save(createProject()), /left intact/); assert.equal(storage.getItem(STORAGE_KEY), '{bad');
  const p = createProject(); p.players[1].id = p.players[0].id; assert.throws(() => validateProject(p), /unique/);
  const q = createProject(); q.team.logo = 'https://example.com/image.png'; assert.throws(() => validateProject(q), /embedded/);
  const r = createProject(); r.players.push(newPlayer(11)); assert.throws(() => validateProject(r), /11 starters/);
  const s = createProject(); s.players[0].transform.zoom = NaN; assert.throws(() => validateProject(s), /photo zoom/);
});
