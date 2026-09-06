'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { graphicLayout, renderGraphic } from '@/lib/renderer';
import { playerPlacement, pointFromPlayerCenter } from '@/lib/pitch-geometry';
import { clamp, formationSlots } from '@/lib/formations';
import type { Point, Project } from '@/types/project';
type Drag = { id: string; startX: number; startY: number; origin: Point; point: Point; rect: DOMRect };
export function PitchPreview({ project, selectedId, select, onError, onMove, snap }: { project: Project; selectedId: string | null; select: (id: string) => void; onError: (message: string) => void; onMove: (id: string, point: Point) => void; snap: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<{ id: string; point: Point } | null>(null);
  const layout = graphicLayout(project);
  const { width, height, pitch, cardHeight } = layout;
  const display = useMemo(() => draft ? { ...project, players: project.players.map((p) => p.id === draft.id ? { ...p, ...draft.point } : p) } : project, [draft, project]);
  useEffect(() => {
    let active = true; const buffer = document.createElement('canvas');
    const frame = requestAnimationFrame(() => {
      void renderGraphic(buffer, display).then(() => { if (active && ref.current) { ref.current.width = buffer.width; ref.current.height = buffer.height; ref.current.getContext('2d')?.drawImage(buffer, 0, 0); } }).catch((error: Error) => { if (active) onError(error.message); });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [display, onError]);
  const bounded = (point: Point) => {
    const y = clamp(point.y, cardHeight * .55 / pitch.height * 100, 95);
    const card = playerPlacement(layout, { ...point, y });
    const margin = card.width * .55 / (pitch.width * (.64 + .36 * y / 100)) * 100;
    return { x: clamp(point.x, margin, 100 - margin), y };
  };
  const cancel = () => { drag.current = null; setDraft(null); };
  return <div ref={wrap} className="graphic-wrap" style={{ aspectRatio: `${width}/${height}`, '--graphic-ratio': width / height, maxWidth: width > height ? 960 : height > width * 1.5 ? 430 : 570 } as CSSProperties}>
    <canvas ref={ref} className="graphic-canvas" aria-label={`${project.team.name} starting lineup, formation ${project.formation}`} />
    {display.players.filter((p) => p.status === 'starting').map((p) => { const card = playerPlacement(layout, p); return <button key={p.id} aria-label={`Select ${p.name}`} title={`${p.name} · drag to move, or use arrow keys`} className={`player-hitbox ${selectedId === p.id ? 'is-selected' : ''}`} style={{ zIndex: Math.round(p.y * 10), left: `${card.x / width * 100}%`, top: `${card.y / height * 100}%`, width: `${card.width * 1.1 / width * 100}%`, height: `${card.height * 1.1 / height * 100}%` }}
      onClick={() => select(p.id)}
      onPointerDown={(event) => { if (event.button !== 0 || !wrap.current) return; select(p.id); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { id: p.id, startX: event.clientX, startY: event.clientY, origin: { x: p.x, y: p.y }, point: { x: p.x, y: p.y }, rect: wrap.current.getBoundingClientRect() }; }}
      onPointerMove={(event) => {
        const d = drag.current; if (!d || d.id !== p.id) return;
        const origin = playerPlacement(layout, d.origin);
        let point = bounded(pointFromPlayerCenter(layout, { x: origin.x + (event.clientX - d.startX) / d.rect.width * width, y: origin.y + (event.clientY - d.startY) / d.rect.height * height }));
        if (snap) { const nearest = formationSlots(project.formation).find((slot) => Math.hypot(slot.x - point.x, slot.y - point.y) < 5); if (nearest) point = nearest; }
        d.point = point; setDraft({ id: d.id, point });
      }}
      onPointerUp={(event) => { const d = drag.current; if (!d) return; if (Math.hypot(d.point.x - d.origin.x, d.point.y - d.origin.y) > .01) onMove(d.id, d.point); cancel(); event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={cancel} onLostPointerCapture={cancel}
      onKeyDown={(event) => { if (event.key === 'Escape') { cancel(); return; } const delta: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }; const step = delta[event.key]; if (step) { event.preventDefault(); select(p.id); onMove(p.id, bounded({ x: p.x + step.x * (event.shiftKey ? 5 : 1), y: p.y + step.y * (event.shiftKey ? 5 : 1) })); } }}
    />; })}
  </div>;
}
