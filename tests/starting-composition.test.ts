import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../lib/defaults';
import { createStartingLineup } from '../lib/starting-lineup';
import { validateProject } from '../lib/validation';
import { startingLineupBackgrounds, selectStartingBackground } from '../features/starting-lineup/utils/backgrounds';
import { startingComposition, boundedHeroPlacement } from '../features/starting-lineup/utils/composition';

test('starting backgrounds and typography round-trip without changing content', () => {
  const p = createProject(); const data = createStartingLineup(p);
  data.hero.x = 20; data.hero.y = -10; data.starters[0].captain = true;
  for (const preset of startingLineupBackgrounds) {
    const next = { ...data, ...selectStartingBackground(data, preset.id), textScale: 1.5, backgroundOpacity: 65 };
    assert.deepEqual(next.hero, data.hero); assert.deepEqual(next.starters, data.starters);
    assert.deepEqual(next.colors, data.colors); assert.deepEqual(next.matchInfo, data.matchInfo);
    assert.deepEqual(validateProject(JSON.parse(JSON.stringify({ ...p, startingLineup: next }))).startingLineup, JSON.parse(JSON.stringify(next)));
  }
  for (const textScale of [.79, 1.51, NaN]) assert.throws(() => validateProject({ ...p, startingLineup: { ...data, textScale } }));
});

test('hero stays reachable on the left and rows/bench fit every canvas size', () => {
  const data = createStartingLineup(createProject());
  for (const size of ['portrait', 'square', 'story', 'landscape'] as const) {
    for (const count of [0, 12]) {
      const d = { ...data, size, substitutes: Array.from({ length: count }, (_, i) => String(i)) };
      const layout = startingComposition(d);
      assert.ok(layout.hero.x + layout.hero.width < layout.list.x);
      assert.ok(layout.list.x + layout.list.width < layout.width);
      assert.ok(layout.list.height / 11 > 40);
      assert.ok(layout.bottom + layout.benchHeight < layout.height);
      for (const x of [-50, 50]) {
        const placed = boundedHeroPlacement({ width: 4000, height: 100 }, { ...d, hero: { ...d.hero, x, zoom: 2 } }, layout.hero);
        assert.ok(placed.x < layout.hero.x + layout.hero.width);
        assert.ok(placed.x + placed.width > layout.hero.x);
        assert.ok(Math.abs(placed.width / placed.height - 40) < .001);
      }
    }
  }
});
