import type { Formation, Player, Point } from '@/types/project';
export function formationSlots(formation: Formation): Point[] {
  const rows = formation.split('-').map(Number);
  const slots: Point[] = [{ x: 50, y: 88 }];
  rows.forEach((count, row) => {
    const y = 65 - row * (50 / (rows.length - 1));
    for (let i = 0; i < count; i++) slots.push({ x: count === 1 ? 50 : 16 + (i * 68) / (count - 1), y });
  });
  return slots;
}
export function arrangePlayers(players: Player[], formation: Formation): Player[] {
  const slots = formationSlots(formation);
  let index = 0;
  return players.map((p) => p.status === 'starting' ? { ...p, ...slots[index++] } : p);
}
export function placeStarter(player: Player, players: Player[], formation: Formation): Player {
  const occupied = players.filter((p) => p.status === 'starting' && p.id !== player.id);
  const slots = formationSlots(formation);
  const slot = slots.find((slot) => !occupied.some((p) => Math.hypot(p.x - slot.x, p.y - slot.y) < 9)) ?? slots[Math.min(occupied.length, 10)];
  return { ...player, ...slot };
}
export function clamp(value: number, min = 0, max = 100) { return Math.min(max, Math.max(min, value)); }
