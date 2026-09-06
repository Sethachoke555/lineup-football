import type { MatchResult, Project } from '@/types/project';

export function createMatchResult(project: Project): MatchResult {
  return {
    home: { name: project.team.name, logo: project.team.logo, score: 0 },
    away: { name: project.team.opponent || 'AWAY TEAM', logo: project.team.opponentLogo, score: 0 },
    competition: project.team.competition, venue: project.team.venue, date: project.team.date,
    scorers: [], template: 'broadcast', colors: { ...project.colors },
    background: { kind: 'stadium', image: '', brightness: 100, blur: 0, overlay: 30 }, size: 'portrait',
  };
}
