import type { Player, Project, PhotoTransform } from '@/types/project';
export const DEFAULT_TRANSFORM: PhotoTransform = { zoom: 1, scale: 1, x: 0, y: 0, crop: 'portrait' };
export function newPlayer(index: number, status: Player['status'] = 'starting'): Player {
  return { id: crypto.randomUUID(), name: `Player ${index + 1}`, nickname: '', number: String(index + 1), position: index === 0 ? 'GK' : 'CM', status, photo: '', transform: { ...DEFAULT_TRANSFORM }, x: 50, y: 50 };
}
export function createProject(): Project {
  const names = ['KITTIPONG', 'NARONG', 'THANAKORN', 'PONGSAK', 'WASAN', 'ANUWAT', 'PHANUPHONG', 'SURIYA', 'SETHACHOKE', 'NATTAWUT', 'TEERAPAT'];
  const positions = ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'];
  const coordinates = [[50, 88], [16, 65], [39, 65], [61, 65], [84, 65], [23, 40], [50, 40], [77, 40], [23, 15], [50, 15], [77, 15]];
  return { version: 1, id: crypto.randomUUID(), name: 'NONDAENG FC · Matchday', updatedAt: new Date().toISOString(),
    team: { name: 'NONDAENG FC', shortName: 'NDFC', logo: '', opponent: 'UNITED FC', opponentLogo: '', competition: 'โฏนตาคัพ 2026', date: '2026-09-12', time: '18:00', venue: 'Nondaeng Stadium', coach: 'Coach Somchai' },
    players: names.map((name, i) => ({ ...newPlayer(i), name, position: positions[i], x: coordinates[i][0], y: coordinates[i][1] })),
    formation: '4-3-3', size: 'portrait', template: 'broadcast', colors: { primary: '#071c46', secondary: '#1258c7', accent: '#f04458', text: '#ffffff' },
    background: { kind: 'pitch', image: '', brightness: 100, blur: 0, overlay: 25 }, text: { size: 1, uppercase: true, useNickname: false },
  };
}
