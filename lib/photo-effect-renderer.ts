import type { PlayerPhotoEffect, PlayerPhotoSettings, Point } from '@/types/project';
import { photoPlacement, type CropFrame } from './photo-crop';
import { projectPhotoPoint } from './photo-effects';

const alphaCache = new WeakMap<HTMLImageElement, boolean>();
export function hasPhotoTransparency(image: HTMLImageElement) {
  const cached = alphaCache.get(image); if (cached !== undefined) return cached;
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(image, 0, 0, 128, 128);
  const data = ctx.getImageData(0, 0, 128, 128).data;
  let transparent = false;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) { transparent = true; break; }
  alphaCache.set(image, transparent); return transparent;
}

// Bounded LRU: moving lineup players reuses the same raster. Source bytes are never modified.
const cache = new Map<string, HTMLCanvasElement>();
const imageIds = new WeakMap<HTMLImageElement, number>(); let nextImageId = 0;
function surface(width: number, height: number) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(width)); c.height = Math.max(1, Math.ceil(height)); return c;
}

/** Map one texture triangle onto a projected triangle using an affine transform. */
function triangle(ctx: CanvasRenderingContext2D, texture: HTMLCanvasElement, from: Point[], to: Point[]) {
  const [s0, s1, s2] = from; const [d0, d1, d2] = to;
  const sx1 = s1.x - s0.x, sy1 = s1.y - s0.y, sx2 = s2.x - s0.x, sy2 = s2.y - s0.y;
  const det = sx1 * sy2 - sx2 * sy1;
  const a = ((d1.x - d0.x) * sy2 - (d2.x - d0.x) * sy1) / det;
  const c = ((d2.x - d0.x) * sx1 - (d1.x - d0.x) * sx2) / det;
  const b = ((d1.y - d0.y) * sy2 - (d2.y - d0.y) * sy1) / det;
  const d = ((d2.y - d0.y) * sx1 - (d1.y - d0.y) * sx2) / det;
  ctx.save(); ctx.beginPath();
  // Subpixel overlap avoids antialiasing cracks between triangles.
  const center = { x: (d0.x + d1.x + d2.x) / 3, y: (d0.y + d1.y + d2.y) / 3 };
  to.forEach((p, i) => { const length = Math.hypot(p.x - center.x, p.y - center.y); const x = p.x + (p.x - center.x) / length * .35; const y = p.y + (p.y - center.y) / length * .35; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.closePath(); ctx.clip(); ctx.transform(a, b, c, d, d0.x - a * s0.x - c * s0.y, d0.y - b * s0.x - d * s0.y); ctx.drawImage(texture, 0, 0); ctx.restore();
}

export function drawPhotoEffect(ctx: CanvasRenderingContext2D, image: HTMLImageElement, crop: PlayerPhotoSettings, effect: PlayerPhotoEffect, frame: CropFrame, cardWidth: number, accent: string) {
  let id = imageIds.get(image); if (id === undefined) { id = ++nextImageId; imageIds.set(image, id); }
  const scale = cardWidth / 500;
  const key = JSON.stringify([id, crop, effect, frame.width, frame.height, cardWidth, accent]);
  let layer = cache.get(key);
  if (!layer) {
    const pad = cardWidth * 1.1;
    layer = surface(frame.width + pad * 2, frame.height + pad * 2);
    const texture = surface(frame.width + pad * 2, frame.height + pad * 2);
    const t = texture.getContext('2d')!;
    t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
    const placement = photoPlacement({ width: image.naturalWidth, height: image.naturalHeight }, crop, { x: pad, y: pad, width: frame.width, height: frame.height });
    // Reveal more of the original above the frame, but retain the lower-body crop beneath the name bar.
    t.beginPath();
    if (crop.legacyFrame === 'circle' && effect.overlap === 0) t.ellipse(pad + frame.width / 2, pad + frame.height / 2, frame.width / 2, frame.height / 2, 0, 0, Math.PI * 2);
    else t.rect(pad - frame.width * effect.overlap * .25, pad - frame.height * effect.overlap, frame.width * (1 + effect.overlap * .5), frame.height * (1 + effect.overlap));
    t.clip(); t.drawImage(image, placement.x, placement.y, placement.width, placement.height);
    const projected = surface(layer.width, layer.height); const p = projected.getContext('2d')!;
    p.imageSmoothingEnabled = true; p.imageSmoothingQuality = 'high';
    if (effect.mode === 'cutout') p.drawImage(texture, 0, 0);
    else if (!effect.tiltX && !effect.tiltY) {
      const ox = pad + frame.width / 2, oy = pad + frame.height / 2;
      p.translate(ox + effect.x * scale, oy + effect.y * scale); p.rotate(effect.rotation * Math.PI / 180); p.scale(effect.zoom, effect.zoom);
      p.drawImage(texture, -ox, -oy);
    }
    else {
      const ox = pad + frame.width / 2, oy = pad + frame.height / 2;
      const project = (x: number, y: number) => { const point = projectPhotoPoint({ x: (x - ox) / scale, y: (y - oy) / scale }, effect); return { x: ox + point.x * scale, y: oy + point.y * scale }; };
      // Only tessellate the bounded crop area, avoiding perspective singularities in transparent padding.
      const left = pad - frame.width * effect.overlap * .25, top = pad - frame.height * effect.overlap;
      const width = frame.width * (1 + effect.overlap * .5), height = frame.height * (1 + effect.overlap);
      const cols = 12; const rows = cols;
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const x = left + col * width / cols, y = top + row * height / rows;
        const points = [{ x, y }, { x: x + width / cols, y }, { x: x + width / cols, y: y + height / rows }, { x, y: y + height / rows }];
        const targets = points.map((v) => project(v.x, v.y));
        triangle(p, texture, points.slice(0, 3), targets.slice(0, 3));
        triangle(p, texture, [points[0], points[2], points[3]], [targets[0], targets[2], targets[3]]);
      }
    }
    const out = layer.getContext('2d')!;
    if (effect.mode === '3d') {
      const mask = surface(layer.width, layer.height); const m = mask.getContext('2d')!;
      const tint = (color: string) => { m.clearRect(0, 0, mask.width, mask.height); m.globalCompositeOperation = 'source-over'; m.drawImage(projected, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = color; m.fillRect(0, 0, mask.width, mask.height); m.globalCompositeOperation = 'source-over'; };
      if (effect.shadow.enabled && effect.shadow.opacity > 0) {
        tint('#000000'); out.save(); out.globalAlpha = effect.shadow.opacity; out.filter = `blur(${effect.shadow.blur * scale}px)`;
        out.drawImage(mask, effect.shadow.x * effect.shadow.distance * scale, effect.shadow.y * effect.shadow.distance * scale); out.restore();
      }
      const edge = effect.edge;
      if (edge.style !== 'none') {
        tint(edge.style === 'outline' || edge.style === 'soft' ? '#ffffff' : edge.useTeamColor ? accent : edge.color);
        out.save();
        if (edge.style === 'outline') {
          for (let i = 0; i < 16; i++) { const angle = i * Math.PI / 8; out.drawImage(mask, Math.cos(angle) * edge.width * scale, Math.sin(angle) * edge.width * scale); }
        } else { out.globalAlpha = edge.strength; out.filter = `blur(${edge.blur * scale}px)`; out.drawImage(mask, 0, 0); }
        out.restore();
      }
    }
    out.drawImage(projected, 0, 0);
    cache.set(key, layer);
    let pixels = [...cache.values()].reduce((sum, canvas) => sum + canvas.width * canvas.height, 0);
    while (cache.size > 1 && (cache.size > 24 || pixels > 8_000_000)) {
      const oldest = cache.keys().next().value!; const previous = cache.get(oldest)!;
      pixels -= previous.width * previous.height; cache.delete(oldest);
    }
  } else { cache.delete(key); cache.set(key, layer); }
  ctx.save();
  // The player can cross the card's top and side decoration; the name/number always stays in front.
  ctx.beginPath(); ctx.rect(frame.x - cardWidth * 1.1, frame.y - cardWidth * 1.1, layer.width, frame.height + cardWidth * 1.1); ctx.clip();
  ctx.drawImage(layer, frame.x - cardWidth * 1.1, frame.y - cardWidth * 1.1); ctx.restore();
}

export function drawDepthCard(ctx: CanvasRenderingContext2D, frame: CropFrame, effect: PlayerPhotoEffect, cardWidth: number, color: string, accent: string) {
  if (effect.mode !== '3d' || !effect.card.enabled) return;
  const unit = cardWidth / 500; const c = effect.card;
  ctx.save(); ctx.translate(frame.x + frame.width / 2, frame.y + frame.height / 2); ctx.rotate(c.tilt * Math.PI / 180);
  const face = (offset: number, fill: string) => { ctx.beginPath(); ctx.roundRect(-frame.width / 2 + offset, -frame.height / 2 + offset, frame.width, frame.height, c.radius * unit); ctx.fillStyle = fill; ctx.fill(); };
  ctx.shadowColor = `rgba(0,0,0,${c.shadow})`; ctx.shadowBlur = 20 * unit; ctx.shadowOffsetY = 12 * unit;
  face(c.depth * unit, '#050911'); ctx.shadowColor = 'transparent'; face(0, color);
  if (c.border > 0) { ctx.strokeStyle = accent; ctx.lineWidth = c.border * unit; ctx.stroke(); }
  ctx.restore();
}
