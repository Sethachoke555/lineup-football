'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { Field, Select } from '@/components/sidebar/fields';
import { ImageUpload } from '@/components/players/image-upload';
import { BackgroundSettings } from '@/components/sidebar/background-settings';
import { TemplateSettings } from '@/components/templates/template-settings';
import { renderMatchResult } from '@/lib/result-renderer';
import { SIZES, type MatchResult, type Project } from '@/types/project';

export function MatchResultEditor({ project, onChange, onError }: { project: Project; onChange: (patch: Partial<MatchResult>) => void; onError: (message: string) => void }) {
  const result = project.matchResult!;
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true; const buffer = document.createElement('canvas');
    const frame = requestAnimationFrame(() => {
      void document.fonts.ready.then(() => renderMatchResult(buffer, project)).then(() => {
        if (active && canvas.current) { canvas.current.width = buffer.width; canvas.current.height = buffer.height; canvas.current.getContext('2d')?.drawImage(buffer, 0, 0); }
      }).catch((e: Error) => { if (active) onError(e.message); });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [project, onError]);
  const [width, height] = SIZES[result.size];
  return <div className="workspace result-workspace">
    <aside className="left-sidebar"><div className="panel-fields"><div className="section-heading"><h2>Match details</h2><span>FULL TIME</span></div>
      {(['home', 'away'] as const).map((side) => <section key={side} className="result-team"><h3>{side === 'home' ? 'Home team / ทีมเหย้า' : 'Away team / ทีมเยือน'}</h3>
        <Field label={`${side === 'home' ? 'Home' : 'Away'} team`} maxLength={80} value={result[side].name} onChange={(e) => onChange({ [side]: { ...result[side], name: e.target.value } })} />
        <Field label={`${side === 'home' ? 'Home' : 'Away'} score`} type="number" min={0} max={99} step={1} value={result[side].score} onChange={(e) => onChange({ [side]: { ...result[side], score: Math.max(0, Math.min(99, Math.floor(Number(e.target.value) || 0))) } })} />
        <ImageUpload label={`${side === 'home' ? 'Home' : 'Away'} logo`} value={result[side].logo} onChange={(logo) => onChange({ [side]: { ...result[side], logo } })} onError={onError} />
      </section>)}
      <Field label="Result competition" maxLength={120} value={result.competition} onChange={(e) => onChange({ competition: e.target.value })} />
      <Field label="Result date" type="date" value={result.date} onChange={(e) => onChange({ date: e.target.value })} />
      <Field label="Result venue" maxLength={120} value={result.venue} onChange={(e) => onChange({ venue: e.target.value })} />
      <Select label="Result canvas format" value={result.size} onChange={(size) => onChange({ size: size as MatchResult['size'] })}>{Object.entries(SIZES).map(([key, value]) => <option key={key} value={key}>{key} · {value.join(' × ')}</option>)}</Select>
    </div></aside>
    <main className="center-panel"><div className="preview-heading"><div><span className="eyebrow">THE FINAL WHISTLE</span><h1>Match result</h1></div><span className="live-badge"><i />Live preview</span></div>
      <div className="canvas-stage"><div className="graphic-wrap" style={{ aspectRatio: `${width}/${height}`, '--graphic-ratio': width / height, maxWidth: width > height ? 960 : height > width * 1.5 ? 430 : 570 } as CSSProperties}><canvas ref={canvas} className="graphic-canvas" aria-label={`${result.home.name} ${result.home.score} – ${result.away.score} ${result.away.name}, full time`} /></div></div>
      <div className="preview-footer"><span>{width} × {height} px</span><span>FULL TIME</span><span>Export PNG / JPG</span></div>
    </main>
    <aside className="right-sidebar result-controls"><section><div className="section-heading"><h2>Goal scorers</h2><span>{result.scorers.length}/20</span></div><p className="muted">เพิ่มชื่อผู้ทำประตูและนาที เช่น 45+2</p>
      {result.scorers.map((scorer, index) => <div className="result-scorer" key={scorer.id}>
        <Select label={`Scorer ${index + 1} team`} value={scorer.side} onChange={(side) => onChange({ scorers: result.scorers.map((s) => s.id === scorer.id ? { ...s, side: side as 'home' | 'away' } : s) })}><option value="home">Home</option><option value="away">Away</option></Select>
        <Field label={`Scorer ${index + 1} name`} maxLength={50} value={scorer.name} onChange={(e) => onChange({ scorers: result.scorers.map((s) => s.id === scorer.id ? { ...s, name: e.target.value } : s) })} />
        <Field label={`Scorer ${index + 1} minute`} placeholder="45+2" maxLength={7} value={scorer.minute} onChange={(e) => onChange({ scorers: result.scorers.map((s) => s.id === scorer.id ? { ...s, minute: e.target.value.replace(/[^0-9+]/g, '') } : s) })} />
        <button className="button danger" aria-label={`Remove scorer ${index + 1}`} onClick={() => onChange({ scorers: result.scorers.filter((s) => s.id !== scorer.id) })}>Remove</button>
      </div>)}
      <button className="button full-width" disabled={result.scorers.length >= 20} onClick={() => onChange({ scorers: [...result.scorers, { id: crypto.randomUUID(), side: 'home', name: '', minute: '' }] })}>Add goal scorer</button>
    </section><details open><summary>Template & colors</summary><TemplateSettings playerCards={false} project={{ ...project, ...result }} onTemplate={(t) => onChange({ template: t.id, colors: { ...t.colors }, background: { ...result.background, kind: t.scene, overlay: t.id === 'minimal' ? 0 : 25 } })} onColors={(patch) => onChange({ colors: { ...result.colors, ...patch } })} /></details>
    <details><summary>Background / ภาพพื้นหลัง</summary><BackgroundSettings background={result.background} onChange={(patch) => onChange({ background: { ...result.background, ...patch } })} onError={onError} /></details></aside>
  </div>;
}
