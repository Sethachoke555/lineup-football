import type { Project, StartingLineup } from '@/types/project';

export const STARTING_LINEUP_TEMPLATES = [
  { id: 'hero-xi', name: 'Hero XI' },
  { id: 'formation-pro', name: 'Formation Pro' },
  { id: 'player-cards', name: 'Player Cards' },
  { id: 'clean-xi', name: 'Clean XI' },
  { id: 'matchday-xi', name: 'Matchday XI' },
  { id: 'stadium-xi', name: 'Stadium XI' },
] as const;
export const FORMAT_LABELS = { square: 'Instagram Post 1:1', portrait: 'Portrait Post 4:5', story: 'Story / TikTok 9:16', landscape: 'Landscape 16:9' };

/** Returns presentation settings only; squad selection and club data never change. */
export function autoDesign(project: Project, data: StartingLineup): Partial<StartingLineup> {
  const names = data.starters.map((s) => s.displayName || project.players.find((p) => p.id === s.playerId)?.name || '');
  const longest = Math.max(1, ...names.map((n) => Array.from(n).length));
  return { colors: { ...project.colors }, design: { variation: 0, fontScale: longest > 25 ? .85 : 1, spacing: data.size === 'story' ? 1.1 : 1 },
    hero: { ...data.hero, playerId: data.hero.playerId || (!data.hero.src ? project.players.find((p) => p.photo && data.starters.some((s) => s.playerId === p.id))?.id : undefined), x: 0, y: 0, zoom: 1 },
    background: { ...data.background, kind: data.template === 'stadium-xi' ? 'stadium' : 'gradient', overlay: 35 } };
}
export function shuffleDesign(data: StartingLineup): Partial<StartingLineup> {
  const variation = ((data.design?.variation ?? 0) + 1) % 6;
  return { design: { fontScale: 1, spacing: 1, ...data.design, variation }, hero: { ...data.hero, x: [-3, 2, -1, 3, 0, -2][variation], y: variation % 2 ? -2 : 0 }, background: { ...data.background, overlay: 20 + variation * 8 } };
}
