import type { PlayerPhotoEffect } from '@/types/project';
import { EFFECT_PRESETS, photoEffectPreset } from '@/lib/photo-effects';
import { Field, Range, Select } from '@/components/ui';

export function PhotoEffectControls({ effect, onChange, transparent, parallax, onParallax }: {
  effect: PlayerPhotoEffect; onChange: (value: PlayerPhotoEffect) => void; transparent: boolean; parallax: boolean; onParallax: (value: boolean) => void;
}) {
  const patch = (value: Partial<PlayerPhotoEffect>) => onChange({ ...effect, ...value });
  return <section className="photo-effects"><h3>PHOTO EFFECT</h3>
    <div className="effect-modes" role="group" aria-label="Photo effect mode">{(['original', 'cutout', '3d'] as const).map((mode) => <button className="button" key={mode} aria-pressed={effect.mode === mode} disabled={mode === 'cutout' && !transparent} title={mode === 'cutout' && !transparent ? 'Upload a photo with transparency to use Cutout.' : undefined} onClick={() => patch({ mode })}>{mode === '3d' ? '3D Effect' : mode === 'cutout' ? 'Cutout' : 'Original'}</button>)}</div>
    <p className="muted">{transparent ? 'Cutout uses the existing transparent edges and lets the player extend above the frame.' : 'This photo has an opaque background. Depth affects the whole photo. Upload a transparent PNG/WEBP for player-shaped edges; background removal is not applied.'}</p>
    <div className="effect-presets" role="group" aria-label="3D presets">{EFFECT_PRESETS.map((name) => <button className="button" key={name} onClick={() => onChange(photoEffectPreset(name))}>{name}</button>)}</div>
    {effect.mode !== 'original' && <Range label="Head overlap" value={effect.overlap} min={0} max={.5} step={.01} onChange={(overlap) => patch({ overlap })} />}
    {effect.mode === '3d' && <>
      <details open><summary>Player transform</summary>
        <Range label="Effect zoom" value={effect.zoom} min={.5} max={1.5} step={.01} onChange={(zoom) => patch({ zoom })} unit="×" />
        <Range label="Effect move X" value={effect.x} min={-100} max={100} onChange={(x) => patch({ x })} />
        <Range label="Effect move Y" value={effect.y} min={-100} max={100} onChange={(y) => patch({ y })} />
        <Range label="Rotation" value={effect.rotation} min={-30} max={30} onChange={(rotation) => patch({ rotation })} unit="°" />
        <Range label="Perspective" value={effect.perspective} min={600} max={2000} step={10} onChange={(perspective) => patch({ perspective })} />
        <Range label="Tilt X" value={effect.tiltX} min={-20} max={20} onChange={(tiltX) => patch({ tiltX })} unit="°" />
        <Range label="Tilt Y" value={effect.tiltY} min={-20} max={20} onChange={(tiltY) => patch({ tiltY })} unit="°" />
      </details>
      <details><summary>Depth shadow</summary>
        <label className="checkbox-field"><input type="checkbox" checked={effect.shadow.enabled} onChange={(e) => patch({ shadow: { ...effect.shadow, enabled: e.target.checked } })} />Shadow</label>
        {effect.shadow.enabled && <>{(['x', 'y', 'blur', 'opacity', 'distance'] as const).map((key) => <Range key={key} label={`Shadow ${key === 'x' || key === 'y' ? key.toUpperCase() : key}`} value={effect.shadow[key]} min={key === 'x' || key === 'y' ? -60 : 0} max={key === 'opacity' ? 1 : key === 'distance' ? 3 : 60} step={key === 'opacity' || key === 'distance' ? .05 : 1} onChange={(value) => patch({ shadow: { ...effect.shadow, [key]: value } })} />)}</>}
      </details>
      <details><summary>Outline / glow</summary>
        <Select label="Edge effect" value={effect.edge.style} onChange={(style) => patch({ edge: { ...effect.edge, style: style as PlayerPhotoEffect['edge']['style'] } })}><option value="none">None</option><option value="outline">White Outline</option><option value="team">Team Color Glow</option><option value="soft">Soft Light</option></Select>
        {effect.edge.style === 'outline' && <Range label="Outline width" value={effect.edge.width} min={0} max={8} step={.5} onChange={(width) => patch({ edge: { ...effect.edge, width } })} />}
        {(effect.edge.style === 'team' || effect.edge.style === 'soft') && <>
          <Range label="Glow strength" value={effect.edge.strength} min={0} max={1} step={.05} onChange={(strength) => patch({ edge: { ...effect.edge, strength } })} />
          <Range label="Glow blur" value={effect.edge.blur} min={0} max={50} onChange={(blur) => patch({ edge: { ...effect.edge, blur } })} />
          {effect.edge.style === 'team' && <><label className="checkbox-field"><input type="checkbox" checked={effect.edge.useTeamColor} onChange={(e) => patch({ edge: { ...effect.edge, useTeamColor: e.target.checked } })} />Use team accent</label><Field label="Glow color" type="color" value={effect.edge.color} onChange={(e) => patch({ edge: { ...effect.edge, color: e.target.value, useTeamColor: false } })} /></>}
        </>}
      </details>
      <details><summary>3D card</summary>
        <label className="checkbox-field"><input type="checkbox" checked={effect.card.enabled} onChange={(e) => patch({ card: { ...effect.card, enabled: e.target.checked } })} />Enable 3D card</label>
        {effect.card.enabled && <>{(['depth', 'shadow', 'tilt', 'border', 'radius'] as const).map((key) => <Range key={key} label={`Card ${key}`} value={effect.card[key]} min={key === 'tilt' ? -12 : 0} max={key === 'shadow' ? 1 : key === 'border' ? 6 : key === 'tilt' ? 12 : key === 'radius' ? 40 : 30} step={key === 'shadow' ? .05 : 1} onChange={(value) => patch({ card: { ...effect.card, [key]: value } })} />)}</>}
      </details>
      <label className="checkbox-field"><input type="checkbox" checked={parallax} onChange={(e) => onParallax(e.target.checked)} />Parallax Preview</label><p className="muted">Hover over the live card for subtle motion. Export uses your saved static position.</p>
    </>}
  </section>;
}
