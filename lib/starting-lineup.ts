import type { Project, StartingLineup, StartingLineupPlayer } from '@/types/project';

export { STARTING_LINEUP_TEMPLATES } from '@/features/starting-lineup/utils/design';
import { STARTING_LINEUP_TEMPLATES } from '@/features/starting-lineup/utils/design';
export function createStartingLineup(project: Project): StartingLineup {
  const starters = project.players.filter((p) => p.status === 'starting').slice(0, 11).map<StartingLineupPlayer>((p) => ({ playerId: p.id, captain: false }));
  return {
    title: 'STARTING XI', textScale: 1.25, backgroundOpacity: 100, starters, substitutes: project.players.filter((p) => p.status === 'substitute').map((p) => p.id),
    hero: { src: '', playerId: project.players.find((p) => p.status === 'starting' && p.photo)?.id, x: 0, y: 0, zoom: 1 }, competitionLogo: '', matchInfo: { enabled: true, opponent: project.team.opponent, opponentLogo: project.team.opponentLogo, date: project.team.date, time: project.team.time, venue: project.team.venue, round: '' },
    sponsors: [], showSponsors: false, sponsorPosition: 'bottom', substituteLayout: 'wrapped', nameStyle: 'full', template: 'hero-xi', colors: { ...project.colors }, background: { ...project.background }, size: project.size,
  };
}
export function ensureStartingLineup(project: Project) {
  const current = project.startingLineup ?? createStartingLineup(project); const available = new Set(project.players.map((p) => p.id));
  const starters = current.starters.filter((entry) => available.has(entry.playerId)).slice(0, 11); const used = new Set(starters.map((entry) => entry.playerId));
  for (const player of project.players.filter((p) => p.status === 'starting')) if (starters.length < 11 && !used.has(player.id)) { starters.push({ playerId: player.id, captain: false }); used.add(player.id); }
  return { ...current, starters, substitutes: current.substitutes.filter((id) => available.has(id) && !used.has(id)).slice(0, 12) };
}
export function startingTemplate(id: StartingLineup['template']) { return STARTING_LINEUP_TEMPLATES.find((t) => t.id === id) ?? STARTING_LINEUP_TEMPLATES[0]; }
