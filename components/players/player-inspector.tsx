import type { ReactNode } from 'react';
import { SlidersHorizontal, UserRound } from 'lucide-react';
import type { Player, Project } from '@/types/project';
import { Field, Range, Select } from '@/components/ui';

interface InspectorProps {
  player?: Player;
  project: Project;
  onChange: (patch: Partial<Player>) => void;
  onText: (patch: Partial<Project['text']>) => void;
  children?: ReactNode;
}

export function PlayerInspector({ player, project, onChange, onText, children }: InspectorProps) {
  return <>
    <div className="section-heading"><h2>Player inspector</h2><SlidersHorizontal size={16} /></div>
    {player ? <>
      <div className="inspector-person">
        <span className="inspector-number">{player.number || <UserRound size={24} />}</span>
        <div><strong>{player.name || 'Unnamed player'}</strong><span>{player.position} · {player.status === 'starting' ? 'Starting XI' : 'Substitute'}</span></div>
      </div>
      <Field label="Player name" value={player.name} maxLength={50} onChange={(e) => onChange({ name: e.target.value })} />
      <Field label="Nickname" value={player.nickname} maxLength={30} onChange={(e) => onChange({ nickname: e.target.value })} />
      <div className="field-grid">
        <Field label="Shirt number" inputMode="numeric" value={player.number} maxLength={3} onChange={(e) => onChange({ number: e.target.value.replace(/\D/g, '') })} />
        <Select label="Position" value={player.position} onChange={(position) => onChange({ position })}>
          {['GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LM','RM','LW','RW','ST','CF'].map((pos) => <option key={pos}>{pos}</option>)}
        </Select>
      </div>
      <Select label="Squad status" value={player.status} onChange={(status) => onChange({ status: status as Player['status'] })}>
        <option value="starting" disabled={player.status !== 'starting' && project.players.filter((p) => p.status === 'starting').length >= 11}>Starting XI</option>
        <option value="substitute" disabled={player.status !== 'substitute' && project.players.filter((p) => p.status === 'substitute').length >= 12}>Substitute</option>
      </Select>
      {children}
    </> : <div className="empty-inspector"><UserRound size={30} /><p>Select a player from the squad or preview.</p></div>}
    <div className="inspector-section">
      <h3>Lineup typography</h3>
      <Range label="Name size" value={project.text.size} min={0.75} max={1.4} step={0.05} onChange={(size) => onText({ size })} />
      <label className="checkbox-field"><input type="checkbox" checked={project.text.uppercase} onChange={(e) => onText({ uppercase: e.target.checked })} />Uppercase names</label>
      <label className="checkbox-field"><input type="checkbox" checked={project.text.useNickname} onChange={(e) => onText({ useNickname: e.target.checked })} />Use nicknames when available</label>
    </div>
    <div className="tip-card"><strong>Make every name count.</strong><p>Short names stay readable when your graphic is shared on a phone.</p></div>
  </>;
}
