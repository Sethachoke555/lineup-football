import { SIZES, type Project } from '@/types/project';
import { drawBackground } from './background-renderer';
import { drawContained, loadImage } from '@/utils/images';

export async function renderMatchResult(canvas: HTMLCanvasElement, project: Project) {
  const result = project.matchResult;
  if (!result) throw new Error('Match result data is missing.');
  const sources = [...new Set([result.home.logo, result.away.logo, result.background.kind === 'custom' ? result.background.image : ''].filter(Boolean))];
  const images = new Map(await Promise.all(sources.map(async (src) => [src, await loadImage(src)] as const)));
  const [w, h] = SIZES[result.size]; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas is unavailable.');
  const u = Math.min(w, h) / 1080; const landscape = w > h;
  drawBackground(ctx, { ...project, ...result }, w, h, images.get(result.background.image));
  const { accent, text: ink } = result.colors;
  const text = (value: string, x: number, y: number, size: number, max: number, color = ink, weight = 800) => {
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${weight} ${size * u}px Arial, "Noto Sans Thai", Tahoma, sans-serif`; ctx.fillText(value, x, y, max);
  };
  ctx.fillStyle = accent; ctx.fillRect(w * .07, h * .065, w * .07, 6 * u);
  text(result.competition.toUpperCase() || 'MATCHDAY', w / 2, h * .09, 23, w * .7);
  text('FULL TIME', w / 2, h * .19, result.template === 'minimal' ? 74 : 96, w * .86);
  const scoreY = h * .405; const crestSize = (landscape ? 145 : 175) * u;
  for (const [side, x] of [[result.home, w * .22], [result.away, w * .78]] as const) {
    const logo = images.get(side.logo);
    if (logo) drawContained(ctx, logo, x - crestSize / 2, scoreY - crestSize * .6, crestSize, crestSize);
    else {
      ctx.beginPath(); ctx.arc(x, scoreY - crestSize * .1, crestSize * .46, 0, Math.PI * 2); ctx.fillStyle = result.colors.secondary; ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 3 * u; ctx.stroke();
      text(side.name.trim().slice(0, 3).toUpperCase() || 'FC', x, scoreY - crestSize * .1, 38, crestSize * .75);
    }
    text(side.name.toUpperCase(), x, scoreY + crestSize * .7, 28, w * .34);
  }
  text(`${result.home.score} – ${result.away.score}`, w / 2, scoreY, landscape ? 130 : 112, w * .32, accent, 900);
  ctx.fillStyle = accent; ctx.fillRect(w * .08, h * .59, w * .84, 2 * u);
  if (result.scorers.length) {
    text('GOAL SCORERS', w / 2, h * .635, 17, w * .8, ink, 600);
    for (const side of ['home', 'away'] as const) {
      const entries = result.scorers.filter((s) => s.side === side); const x = w * (side === 'home' ? .27 : .73);
      const spacing = Math.min(34 * u, h * .2 / Math.max(entries.length, 1));
      entries.forEach((s, i) => text(`${s.name || 'Player'}${s.minute ? `  ${s.minute}′` : ''}`, x, h * .68 + i * spacing, Math.min(23, spacing / u * .75), w * .4, ink, 600));
    }
  }
  text([result.date, result.venue].filter(Boolean).join('  •  '), w / 2, h * .935, 20, w * .86, ink, 500);
}
