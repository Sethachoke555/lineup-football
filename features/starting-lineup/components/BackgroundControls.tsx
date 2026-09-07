import { Field, Range, Select } from '@/components/ui';
import { ImageUpload } from '@/components/players/image-upload';
import type { Project, StartingLineup } from '@/types/project';
import { STARTING_LINEUP_TEMPLATES } from '../utils/design';
import { startingBackground, startingLineupBackgrounds, selectStartingBackground } from '../utils/backgrounds';

export function BackgroundControls({ project, data, onChange, onError }: {
  project: Project; data: StartingLineup; onChange: (patch: Partial<StartingLineup>) => void; onError: (message: string) => void;
}) {
  return <section>
    <h2>Template &amp; Background</h2>
    <Select label="Template" value={data.template} onChange={template => onChange({ template: template as StartingLineup['template'] })}>
      {STARTING_LINEUP_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      {!STARTING_LINEUP_TEMPLATES.some(t => t.id === data.template) && <option value={data.template}>Saved template</option>}
    </Select>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {startingLineupBackgrounds.map(p => <button key={p.id} className="button" aria-pressed={data.background.kind !== 'custom' && startingBackground(data).id === p.id} onClick={() => onChange(selectStartingBackground(data, p.id))}>{p.name}</button>)}
    </div>
    <details><summary>Customize background</summary>
      <ImageUpload label="Custom starting background" value={data.background.image} onError={onError} onChange={image => onChange({ background: { ...data.background, image, kind: image ? 'custom' : 'gradient' } })} />
      {data.background.image && <button className="button" onClick={() => onChange({ background: { ...data.background, kind: 'custom' } })}>Use custom background</button>}
      <Range label="Background brightness" value={data.background.brightness} min={20} max={160} unit="%" onChange={brightness => onChange({ background: { ...data.background, brightness } })} />
      <Range label="Background opacity" value={data.backgroundOpacity ?? 100} min={0} max={100} unit="%" onChange={backgroundOpacity => onChange({ backgroundOpacity })} />
      <Range label="Background blur" value={data.background.blur} min={0} max={20} onChange={blur => onChange({ background: { ...data.background, blur } })} />
      <Range label="Overlay strength" value={data.background.overlay} min={0} max={90} unit="%" onChange={overlay => onChange({ background: { ...data.background, overlay } })} />
    </details>
    <h3>Team Colors</h3>
    <div className="field-grid">{(['primary', 'secondary', 'accent'] as const).map(key => <Field key={key} label={key[0].toUpperCase() + key.slice(1) + ' color'} type="color" value={data.colors[key]} onChange={e => onChange({ colors: { ...data.colors, [key]: e.target.value } })} />)}</div>
    <button className="button" onClick={() => onChange({ colors: { ...project.colors } })}>Apply Team Colors</button>
  </section>;
}
