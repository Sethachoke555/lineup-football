import type { Player } from '@/types/project';
import { Range } from '@/components/ui';
export function PositionEditor({ player, onChange }: { player: Player; onChange: (patch: Partial<Player>) => void }) {
  if (player.status !== 'starting') return null;
  return <div className="inspector-section"><h3>Pitch position</h3><Range label="Pitch X" value={Math.round(player.x * 10) / 10} min={10} max={90} step={0.1} unit="%" onChange={(x) => onChange({ x })} /><Range label="Pitch Y" value={Math.round(player.y * 10) / 10} min={10} max={90} step={0.1} unit="%" onChange={(y) => onChange({ y })} /></div>;
}
