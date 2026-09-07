import type { Project, StartingLineup, StartingLineupPlayer } from '@/types/project';

export const STARTING_LINEUP_TEMPLATES = [
  { id: 'broadcast-list', name: 'Broadcast List', colors: { primary: '#071c46', secondary: '#1258c7', accent: '#f04458', text: '#ffffff' }, scene: 'gradient' as const },
  { id: 'dark-team-sheet', name: 'Dark Team Sheet', colors: { primary: '#090b12', secondary: '#202536', accent: '#d8b36a', text: '#ffffff' }, scene: 'stadium' as const },
  { id: 'club-poster', name: 'Club Poster', colors: { primary: '#3a1028', secondary: '#d22d58', accent: '#ffcf4a', text: '#ffffff' }, scene: 'gradient' as const },
  { id: 'minimal-lineup', name: 'Minimal Lineup', colors: { primary: '#edf1f4', secondary: '#ffffff', accent: '#d9364e', text: '#14243c' }, scene: 'gradient' as const },
] as const;
export function createStartingLineup(project: Project): StartingLineup {
  const starters = project.players.filter((p) => p.status === 'starting').slice(0, 11).map<StartingLineupPlayer>((p) => ({ playerId: p.id, captain: false }));
  return {
    title: 'STARTING XI', starters, substitutes: project.players.filter((p) => p.status === 'substitute').map((p) => p.id),
    hero: { src: '', x: 0, y: 0, zoom: 1 }, competitionLogo: '', matchInfo: { enabled: true, opponent: project.team.opponent, opponentLogo: project.team.opponentLogo, date: project.team.date, time: project.team.time, venue: project.team.venue, round: '' },
    sponsors: [], showSponsors: false, sponsorPosition: 'bottom', substituteLayout: 'wrapped', nameStyle: 'full', template: 'broadcast-list', colors: { ...project.colors }, background: { ...project.background }, size: project.size,
  };
}
export function ensureStartingLineup(project: Project) {
  const current = project.startingLineup ?? createStartingLineup(project); const available = new Set(project.players.map((p) => p.id));
  const starters = current.starters.filter((entry) => available.has(entry.playerId)).slice(0, 11); const used = new Set(starters.map((entry) => entry.playerId));
  for (const player of project.players.filter((p) => p.status === 'starting')) if (starters.length < 11 && !used.has(player.id)) { starters.push({ playerId: player.id, captain: false }); used.add(player.id); }
  return { ...current, starters, substitutes: current.substitutes.filter((id) => available.has(id) && !used.has(id)).slice(0, 12) };
}
export function startingTemplate(id: StartingLineup['template']) { return STARTING_LINEUP_TEMPLATES.find((t) => t.id === id) ?? STARTING_LINEUP_TEMPLATES[0]; }
