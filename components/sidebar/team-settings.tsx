import type { Team } from '@/types/project';
import { Field } from './fields';
import { ImageUpload } from '@/components/players/image-upload';
export function TeamSettings({ team, onChange, onError }: { team: Team; onChange: (patch: Partial<Team>) => void; onError: (message: string) => void }) {
  return <div className="panel-fields"><div className="section-heading"><h2>Team & match</h2><span>01</span></div>
    <Field label="Team name" value={team.name} maxLength={60} onChange={(e) => onChange({ name: e.target.value })} />
    <Field label="Short name" value={team.shortName} maxLength={8} onChange={(e) => onChange({ shortName: e.target.value })} />
    <ImageUpload label="Team logo" value={team.logo} onChange={(logo) => onChange({ logo })} onError={onError} />
    <Field label="Opponent name" value={team.opponent} maxLength={60} onChange={(e) => onChange({ opponent: e.target.value })} />
    <ImageUpload label="Opponent logo" value={team.opponentLogo} onChange={(opponentLogo) => onChange({ opponentLogo })} onError={onError} />
    <Field label="Competition" value={team.competition} maxLength={100} onChange={(e) => onChange({ competition: e.target.value })} />
    <div className="field-grid"><Field label="Match date" type="date" value={team.date} onChange={(e) => onChange({ date: e.target.value })} /><Field label="Kickoff" type="time" value={team.time} onChange={(e) => onChange({ time: e.target.value })} /></div>
    <Field label="Venue" value={team.venue} maxLength={100} onChange={(e) => onChange({ venue: e.target.value })} />
    <Field label="Coach" value={team.coach} maxLength={60} onChange={(e) => onChange({ coach: e.target.value })} />
  </div>;
}
