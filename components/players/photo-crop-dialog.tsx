'use client';
import { useEffect, useRef, useState } from 'react';
import type { PlayerPhotoEffect, Player, PlayerPhotoSettings, Project } from '@/types/project';
import { DEFAULT_PHOTO_SETTINGS, drawCroppedPhoto, fillPhotoZoom, limitPhotoSettings, MAX_PHOTO_ZOOM, MIN_PHOTO_ZOOM, zoomPhotoAt } from '@/lib/photo-crop';
import { photoEffectPreset } from '@/lib/photo-effects';
import { hasPhotoTransparency } from '@/lib/photo-effect-renderer';
import { PhotoEffectControls } from './photo-effect-controls';
import { drawPlayerCard } from '@/lib/renderer';

export function PhotoCropDialog({ image, settings, player, project, onApply, onCancel }: {
  src: string; image: HTMLImageElement; settings: PlayerPhotoSettings; player: Player; project: Project;
  onApply: (settings: PlayerPhotoSettings, effect: PlayerPhotoEffect) => void; onCancel: () => void;
}) {
  const [crop, setCrop] = useState(settings);
  const [effect, setEffect] = useState(() => player.photoEffect ? structuredClone(player.photoEffect) : photoEffectPreset());
  const [parallax, setParallax] = useState(false);
  const [hover, setHover] = useState({ x: 0, y: 0 });
  const transparent = hasPhotoTransparency(image);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const current = useRef(crop);
  const drag = useRef<{ id: number; x: number; y: number; crop: PlayerPhotoSettings } | null>(null);
  const size = { width: image.naturalWidth, height: image.naturalHeight };
  useEffect(() => {
    const modal = dialog.current!; const previous = document.activeElement as HTMLElement | null;
    modal.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { modal.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    current.current = crop;
    const canvas = stage.current!; canvas.width = 800; canvas.height = 800 * crop.cropHeight / crop.cropWidth;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    drawCroppedPhoto(ctx, image, crop, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }, [crop, image]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const card = preview.current!; card.width = effect.mode === 'original' ? 600 : 900; card.height = effect.mode === 'original' ? 660 : 1000;
      const cardCtx = card.getContext('2d')!; cardCtx.translate(card.width / 2, effect.mode === 'original' ? 320 : 630);
      const displayEffect = parallax && effect.mode === '3d' ? { ...effect, tiltX: effect.tiltX + hover.y * 2, tiltY: effect.tiltY + hover.x * 2 } : effect;
      drawPlayerCard(cardCtx, { ...player, photoSettings: crop, photoEffect: displayEffect }, project, 500, 525, image);
    });
    return () => cancelAnimationFrame(frame);
  }, [crop, effect, hover, parallax, image, player, project]);
  useEffect(() => {
    const canvas = stage.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); const rect = canvas.getBoundingClientRect();
      setCrop(zoomPhotoAt(current.current, current.current.zoom * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .002), { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 }, { width: image.naturalWidth, height: image.naturalHeight }));
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, [image]);
  const zoom = (value: number) => setCrop((c) => zoomPhotoAt(c, value, { x: 0, y: 0 }, size));
  const maxZoom = Math.min(MAX_PHOTO_ZOOM, Math.max(4, fillPhotoZoom(size, crop) * 3, settings.zoom));
  return <dialog ref={dialog} className="photo-dialog" aria-labelledby="photo-title" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
    <header><span className="eyebrow">PLAYER PORTRAIT</span><h2 id="photo-title">Edit Player Photo</h2><p>Leave space above the hair. Position the head, shoulders and upper chest inside the frame.</p></header>
    <div className="photo-editor-grid"><div>
      <div className="crop-stage" style={{ aspectRatio: `${crop.cropWidth}/${crop.cropHeight}` }}>
        <canvas ref={stage} tabIndex={0} aria-label="Drag to position player photo" aria-describedby="crop-help"
          onPointerDown={(e) => { if (e.button !== 0 || drag.current) return; e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, crop }; }}
          onPointerMove={(e) => { const d = drag.current; if (!d || d.id !== e.pointerId) return; const rect = e.currentTarget.getBoundingClientRect(); setCrop(limitPhotoSettings({ ...d.crop, x: d.crop.x + (e.clientX - d.x) / rect.width, y: d.crop.y + (e.clientY - d.y) / rect.height }, size)); }}
          onPointerUp={(e) => { drag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={(e) => { const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (delta) { e.preventDefault(); setCrop(limitPhotoSettings({ ...crop, x: crop.x + delta[0] * (e.shiftKey ? .05 : .01), y: crop.y + delta[1] * (e.shiftKey ? .05 : .01) }, size)); } }} />
        <div className="crop-guides" aria-hidden="true"><span>HEAD / HAIR</span><span>SHOULDERS</span><span>UPPER BODY</span></div>
      </div>
      <p id="crop-help" className="muted">Drag or use arrow keys to position. Scroll to zoom.</p>
      <div className="photo-zoom"><label htmlFor="photo-zoom">Zoom</label><output htmlFor="photo-zoom">{Math.round(crop.zoom * 100)}%</output></div>
      <div className="photo-zoom-controls"><button className="button" aria-label="Zoom out" onClick={() => zoom(crop.zoom / 1.15)}>−</button><input id="photo-zoom" type="range" min={0} max={1000} step={1} value={Math.round(Math.log(crop.zoom / MIN_PHOTO_ZOOM) / Math.log(maxZoom / MIN_PHOTO_ZOOM) * 1000)} aria-valuetext={`${Math.round(crop.zoom * 100)} percent`} onChange={(e) => zoom(MIN_PHOTO_ZOOM * Math.pow(maxZoom / MIN_PHOTO_ZOOM, Number(e.target.value) / 1000))} /><button className="button" aria-label="Zoom in" onClick={() => zoom(Math.min(maxZoom, crop.zoom * 1.15))}>+</button></div>
      <div className="photo-buttons"><button className="button" onClick={() => setCrop({ ...crop, x: 0, y: 0 })}>Center</button><button className="button" onClick={() => setCrop({ ...DEFAULT_PHOTO_SETTINGS })}>Reset</button></div>
    </div><aside className="photo-card-preview"><h3>Live player card</h3><canvas ref={preview} aria-label="Live player card preview" onPointerMove={(event) => { if (!parallax || event.pointerType !== 'mouse') return; const rect = event.currentTarget.getBoundingClientRect(); setHover({ x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 }); }} onPointerLeave={() => setHover({ x: 0, y: 0 })} style={{ background: `linear-gradient(145deg, ${project.colors.secondary}, ${project.colors.primary})` }} /><p className="muted">Your lineup uses this exact framing. Transparent areas reveal the scene behind the player.</p>{crop.legacyFrame && <p className="muted">Previous crop preserved. Choose Reset to switch to a 4:5 portrait.</p>}<PhotoEffectControls effect={effect} onChange={setEffect} transparent={transparent} parallax={parallax} onParallax={setParallax} /></aside></div>
    <footer><button className="button" onClick={onCancel}>Cancel</button><button className="button primary" onClick={() => onApply(crop, effect)}>Apply</button></footer>
  </dialog>;
}
