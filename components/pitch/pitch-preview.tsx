'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { graphicLayout, renderGraphic } from '@/lib/renderer';
import { clamp, formationSlots } from '@/lib/formations';
import type { Point, Project } from '@/types/project';
type Drag = { id: string; startX: number; startY: number; origin: Point; point: Point; rect: DOMRect };
export function PitchPreview({ project, selectedId, select, onError, onMove, snap }: { project: Project; selectedId: string | null; select: (id: string) => void; onError: (message: string) => void; onMove: (id: string, point: Point) => void; snap: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<{ id: string; point: Point } | null>(null);
  const { width, height, pitch, cardWidth, cardHeight } = graphicLayout(project);
  const display = useMemo(() => draft ? { ...project, players: project.players.map((p) => p.id === draft.id ? { ...p, ...draft.point } : p) } : project, [draft, project]);
  useEffect(() => {
    let active = true; const buffer = document.createElement('canvas');
    const frame = requestAnimationFrame(() => {
      void renderGraphic(buffer, display).then(() => { if (active && ref.current) { ref.current.width = buffer.width; ref.current.height = buffer.height; ref.current.getContext('2d')?.drawImage(buffer, 0, 0); } }).catch((error: Error) => { if (active) onError(error.message); });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [display, onError]);
  const bounded = (point: Point) => ({ x: clamp(point.x, cardWidth * .55 / pitch.width * 100, 100 - cardWidth * .55 / pitch.width * 100), y: clamp(point.y, cardHeight * .55 / pitch.height * 100, 100 - cardHeight * .55 / pitch.height * 100) });
  const cancel = () => { drag.current = null; setDraft(null); };
  return <div ref={wrap} className="graphic-wrap" style={{ aspectRatio: `${width}/${height}`, '--graphic-ratio': width / height, maxWidth: width > height ? 960 : height > width * 1.5 ? 430 : 570 } as CSSProperties}>
    <canvas ref={ref} className="graphic-canvas" aria-label={`${project.team.name} starting lineup, formation ${project.formation}`} />
    {display.players.filter((p) => p.status === 'starting').map((p) => <button key={p.id} aria-label={`Select ${p.name}`} title={`${p.name} · drag to move, or use arrow keys`} className={`player-hitbox ${selectedId === p.id ? 'is-selected' : ''}`} style={{ left: `${(pitch.x + p.x / 100 * pitch.width) / width * 100}%`, top: `${(pitch.y + p.y / 100 * pitch.height) / height * 100}%`, width: `${cardWidth * 1.1 / width * 100}%`, height: `${cardHeight * 1.1 / height * 100}%` }}
      onClick={() => select(p.id)}
      onPointerDown={(event) => { if (event.button !== 0 || !wrap.current) return; select(p.id); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { id: p.id, startX: event.clientX, startY: event.clientY, origin: { x: p.x, y: p.y }, point: { x: p.x, y: p.y }, rect: wrap.current.getBoundingClientRect() }; }}
      onPointerMove={(event) => {
        const d = drag.current; if (!d || d.id !== p.id) return;
        let point = bounded({ x: d.origin.x + (event.clientX - d.startX) / d.rect.width * width / pitch.width * 100, y: d.origin.y + (event.clientY - d.startY) / d.rect.height * height / pitch.height * 100 });
        if (snap) { const nearest = formationSlots(project.formation).find((slot) => Math.hypot(slot.x - point.x, slot.y - point.y) < 5); if (nearest) point = nearest; }
        d.point = point; setDraft({ id: d.id, point });
      }}
      onPointerUp={(event) => { const d = drag.current; if (!d) return; if (Math.hypot(d.point.x - d.origin.x, d.point.y - d.origin.y) > .01) onMove(d.id, d.point); cancel(); event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={cancel} onLostPointerCapture={cancel}
      onKeyDown={(event) => { if (event.key === 'Escape') { cancel(); return; } const delta: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }; const step = delta[event.key]; if (step) { event.preventDefault(); select(p.id); onMove(p.id, bounded({ x: p.x + step.x * (event.shiftKey ? 5 : 1), y: p.y + step.y * (event.shiftKey ? 5 : 1) })); } }}
    />)}
  </div>;
}
