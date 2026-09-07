import type { StartingLineup, Project } from '@/types/project';
import { drawBackground } from '@/lib/background-renderer';

export const startingLineupBackgrounds = [
  { id: 'modern-dark', name: 'Modern Dark', decoration: 'panels', light: false },
  { id: 'stadium-lights', name: 'Stadium Lights', decoration: 'lights', light: false },
  { id: 'club-texture', name: 'Club Texture', decoration: 'weave', light: false },
  { id: 'clean-white', name: 'Clean White', decoration: 'lines', light: true },
  { id: 'blue-grunge', name: 'Blue Grunge', decoration: 'grain', light: false },
  { id: 'red-energy', name: 'Red Energy', decoration: 'slashes', light: false },
  { id: 'minimal', name: 'Minimal', decoration: 'border', light: true },
  { id: 'championship', name: 'Championship', decoration: 'diamonds', light: false },
] as const;
export type StartingBackgroundId = typeof startingLineupBackgrounds[number]['id'];
export function startingBackground(data: StartingLineup) {
  const fallback = ['clean-xi', 'minimal-lineup'].includes(data.template) ? 'clean-white' : ['stadium-xi', 'dark-team-sheet'].includes(data.template) ? 'stadium-lights' : 'modern-dark';
  return startingLineupBackgrounds.find(p => p.id === (data.backgroundPreset ?? fallback)) ?? startingLineupBackgrounds[0];
}

/** Background-only patch: never copies or resets squad, hero, or club colors. */
export function selectStartingBackground(data: StartingLineup, backgroundPreset: StartingBackgroundId): Partial<StartingLineup> {
  return { backgroundPreset, background: { ...data.background, kind: 'gradient' } };
}

export function drawStartingBackground(ctx: CanvasRenderingContext2D, project: Project, data: StartingLineup, w: number, h: number, image?: HTMLImageElement) {
  const preset = startingBackground(data), u = Math.min(w, h) / 1080;
  const colors = { ...data.colors };
  if (preset.light) { colors.primary = '#f6f7fa'; colors.secondary = '#ffffff'; }
  if (preset.id === 'modern-dark') colors.primary = '#080d17';
  if (preset.id === 'blue-grunge') colors.primary = '#081f4f';
  if (preset.id === 'red-energy') colors.primary = '#500d22';
  const layer = document.createElement('canvas'); layer.width = w; layer.height = h;
  const bg = layer.getContext('2d')!;
  drawBackground(bg, { ...project, colors, template: 'minimal', background: { ...data.background, kind: data.background.kind === 'custom' ? 'custom' : preset.decoration === 'lights' ? 'stadium' : data.background.kind, brightness: 100, blur: 0, overlay: 0 } }, w, h, image);
  bg.save(); bg.strokeStyle = data.colors.accent; bg.fillStyle = data.colors.accent;
  bg.globalAlpha = preset.light ? .12 : .18; bg.lineWidth = 2 * u;
  const shift = (data.design?.variation ?? 0) * w * .025;
  switch (preset.decoration) {
    case 'panels':
    case 'slashes':
      for (let i = -1; i < 5; i++) { const x = i * w * .3 + shift; bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x + w * .15, 0); bg.lineTo(x - w * .35, h); bg.lineTo(x - w * .5, h); bg.fill(); } break;
    case 'weave':
      for (let x = -h; x < w; x += 28 * u) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x + h, h); bg.stroke(); }
      bg.globalAlpha = .08; for (let y = 0; y < h; y += 30 * u) bg.fillRect(0, y, w, 7 * u); break;
    case 'grain':
      for (let i = 0; i < 1500; i++) { const x = (i * 173 + shift) % w, y = (i * i * 31) % h; bg.globalAlpha = .05 + i % 5 * .025; bg.fillRect(x, y, (2 + i % 11) * u, (1 + i % 3) * u); } break;
    case 'lines':
      for (let i = 0; i < 8; i++) bg.strokeRect(20 * u + i * 16 * u, 20 * u + i * 16 * u, w - 40 * u - i * 32 * u, h - 40 * u - i * 32 * u); break;
    case 'border':
      bg.globalAlpha = .8; bg.fillRect(0, 0, w, 12 * u); bg.fillRect(0, h - 12 * u, w, 12 * u); break;
    case 'diamonds':
      for (let x = -h; x < w; x += 110 * u) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x + h, h); bg.moveTo(x + h, 0); bg.lineTo(x, h); bg.stroke(); } break;
    case 'lights': break;
  }
  bg.restore();
  ctx.save(); ctx.fillStyle = colors.primary; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = (data.backgroundOpacity ?? 100) / 100;
  ctx.filter = `brightness(${data.background.brightness}%) blur(${data.background.blur * u}px)`;
  ctx.drawImage(layer, 0, 0); ctx.restore();
  ctx.fillStyle = `rgba(0,0,0,${data.background.overlay / 100})`; ctx.fillRect(0, 0, w, h);
}
