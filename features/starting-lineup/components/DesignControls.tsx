import { Field, Range } from '@/components/ui';
import type { StartingLineup } from '@/types/project';

export function DesignControls({ data, onChange }: { data: StartingLineup; onChange: (patch: Partial<StartingLineup>) => void; onError: (message: string) => void }) {
  return <section className="inspector-section"><h3>Fine tune design</h3>
    <Field label="Text color" type="color" value={data.colors.text} onChange={e => onChange({ colors: { ...data.colors, text: e.target.value } })} />
    <Range label="Spacing" value={data.design?.spacing ?? 1} min={.8} max={1.2} step={.05} onChange={spacing => onChange({ design: { variation: 0, fontScale: 1, ...data.design, spacing } })} />
    <Range label="Decoration" value={data.design?.variation ?? 0} min={0} max={5} onChange={variation => onChange({ design: { fontScale: 1, spacing: 1, ...data.design, variation } })} />
  </section>;
}
