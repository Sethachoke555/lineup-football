import { SIZES, type Project, type StartingLineup } from '@/types/project';
import { loadImage, drawContained } from '@/lib/images';
import { drawBackground } from '@/lib/background-renderer';
import { drawCroppedPhoto, settingsForPlayer } from '@/lib/photo-crop';
import { formationSlots } from '@/lib/formations';

/** Shared canvas renderer for both live preview and full-resolution exports. */
export async function renderDesignedLineup(canvas: HTMLCanvasElement, project: Project, data: StartingLineup) {
  const squad = new Map(project.players.map(p => [p.id, p]));
  const hero = (data.hero.playerId ? squad.get(data.hero.playerId)?.photo : data.hero.src) || '';
  const sources = [hero, project.team.logo, data.competitionLogo, data.matchInfo.opponentLogo, data.background.image, ...data.starters.map(s => squad.get(s.playerId)?.photo), ...data.sponsors.map(s => s.src)].filter((s): s is string => !!s);
  const images = new Map(await Promise.all([...new Set(sources)].map(async src => [src, await loadImage(src)] as const)));
  const [w, h] = SIZES[data.size]; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable.');
  const u = Math.min(w, h) / 1080, pad = 48 * u;
  const clean = data.template === 'clean-xi';
  const variation = data.design?.variation ?? 0;
  const colors = variation % 2 ? { ...data.colors, primary: data.colors.secondary, secondary: data.colors.primary } : data.colors;
  drawBackground(ctx, { ...project, colors, background: { ...data.background, kind: data.template === 'stadium-xi' && data.background.kind !== 'custom' ? 'stadium' : data.background.kind } }, w, h, images.get(data.background.image));
  const ink = clean ? '#152033' : data.colors.text;
  if (clean) { ctx.fillStyle = '#f4f6f9'; ctx.fillRect(0, 0, w, h); }
  ctx.save(); ctx.globalAlpha = .13; ctx.fillStyle = data.colors.accent;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w * (.12 + i * .4), h * ((variation + 1) / 8), w * .2, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  const text = (value: string, x: number, y: number, size: number, width: number, color = ink, weight = 700) => {
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    let font = size * (data.design?.fontScale ?? 1);
    ctx.font = `${weight} ${font}px Arial, "Noto Sans Thai", Tahoma, sans-serif`;
    while (ctx.measureText(value).width > width && font > 8 * u) { font -= .5; ctx.font = `${weight} ${font}px Arial, "Noto Sans Thai", Tahoma, sans-serif`; }
    ctx.fillText(value, x, y, width);
  };
  const logo = images.get(project.team.logo);
  if (logo) drawContained(ctx, logo, pad, pad, 92 * u, 92 * u);
  const titleX = logo ? pad + 112 * u : pad;
  text(data.title, titleX, pad + 25 * u, 44 * u, w - titleX - pad, ink, 900);
  text(project.team.name, titleX, pad + 67 * u, 25 * u, w - titleX - pad);
  text(project.team.competition, titleX, pad + 99 * u, 17 * u, w - titleX - pad);
  const competition = images.get(data.competitionLogo);
  if (competition) drawContained(ctx, competition, w - pad - 55 * u, pad + 85 * u, 55 * u, 45 * u);
  const top = pad + 145 * u, footer = h - (data.matchInfo.enabled ? 205 : 145) * u;
  const bottom = footer - 25 * u;
  const formation = data.template === 'formation-pro', cards = data.template === 'player-cards';
  const story = data.size === 'story';
  let listX = clean ? pad : w * .50, listW = w - listX - pad, listTop = top;
  if (story && !formation && !cards && !clean) { listX = pad; listW = w - 2 * pad; listTop = top + (bottom - top) * .34; }
  const heroImage = images.get(hero);
  if (!formation && !cards && !clean && heroImage) {
    const hx = pad, hy = top, hw = story ? w - 2 * pad : w * .45, hh = story ? listTop - top - 18 * u : bottom - top;
    ctx.save(); ctx.beginPath(); ctx.rect(hx, hy, hw, hh); ctx.clip();
    const scale = Math.min(hw / heroImage.naturalWidth, hh / heroImage.naturalHeight) * data.hero.zoom;
    const iw = heroImage.naturalWidth * scale, ih = heroImage.naturalHeight * scale;
    ctx.drawImage(heroImage, hx + (hw - iw) / 2 + data.hero.x * w / 100, hy + (hh - ih) / 2 + data.hero.y * h / 100, iw, ih); ctx.restore();
  }
  if (formation) {
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2 * u;
    ctx.strokeRect(pad, top, w - pad * 2, bottom - top);
    ctx.beginPath(); ctx.moveTo(pad, (top + bottom) / 2); ctx.lineTo(w - pad, (top + bottom) / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, (top + bottom) / 2, 70 * u, 0, Math.PI * 2); ctx.stroke();
  }
  const slots = formationSlots(project.formation);
  const columns = data.size === 'landscape' ? 6 : 4;
  const rows = Math.ceil(11 / columns);
  data.starters.slice(0, 11).forEach((entry, index) => {
    const p = squad.get(entry.playerId); if (!p) return;
    const name = entry.displayName || (data.nameStyle === 'nickname' ? p.nickname || p.name : p.name);
    if (formation || cards) {
      const cw = formation ? (w - pad * 2) / 5 : (w - pad * 2) / columns;
      const ch = formation ? (bottom - top) / 4.7 : (bottom - top) / rows;
      const x = formation ? pad + slots[index].x / 100 * (w - pad * 2) - cw / 2 : pad + index % columns * cw;
      const y = formation ? top + (slots[index].y - 5) / 100 * (bottom - top - ch) : top + Math.floor(index / columns) * ch;
      ctx.fillStyle = '#07101bd9'; ctx.fillRect(x + 5 * u, y, cw - 10 * u, ch - 8 * u);
      const image = images.get(p.photo);
      if (image) drawCroppedPhoto(ctx, image, settingsForPlayer(p, { width: image.naturalWidth, height: image.naturalHeight }), { x: x + 10 * u, y, width: cw - 20 * u, height: ch - 53 * u });
      else text(p.number, x + cw * .3, y + ch * .35, 38 * u, cw * .6, data.colors.accent);
      text(`${p.number}  ${entry.captain ? 'C · ' : ''}${name}`, x + 12 * u, y + ch - 29 * u, 17 * u, cw - 24 * u, '#ffffff');
    } else {
      const rh = (bottom - listTop) / 11, y = listTop + index * rh;
      ctx.fillStyle = clean ? '#ffffff' : '#060e1bcc'; ctx.fillRect(listX, y, listW, rh - (3 + ((data.design?.spacing ?? 1) - .8) * 12) * u);
      if (data.template === 'matchday-xi') { ctx.fillStyle = data.colors.accent; ctx.fillRect(listX, y, 5 * u, rh - 3 * u); }
      text(p.number, listX + 14 * u, y + rh / 2, 24 * u, 48 * u, clean ? '#152033' : data.colors.accent, 900);
      text(name, listX + 72 * u, y + rh / 2, Math.min(26 * u, rh * .5), listW - 115 * u);
      if (entry.captain) { ctx.fillStyle = data.colors.accent; ctx.fillRect(listX + listW - 32 * u, y + rh / 2 - 12 * u, 24 * u, 24 * u); text('C', listX + listW - 27 * u, y + rh / 2, 16 * u, 20 * u, '#ffffff'); }
    }
  });
  text('SUBSTITUTES', pad, footer, 17 * u, w - 2 * pad);
  const subs = data.substitutes.map(id => squad.get(id)).filter(p => !!p);
  const subCols = data.size === 'landscape' ? 6 : 4;
  subs.forEach((p, i) => text(`${p.number} ${data.nameStyle === 'nickname' ? p.nickname || p.name : p.name}`, pad + i % subCols * (w - 2 * pad) / subCols, footer + 28 * u + Math.floor(i / subCols) * 24 * u, 15 * u, (w - 2 * pad) / subCols - 14 * u));
  if (data.matchInfo.enabled) {
    text(`vs ${data.matchInfo.opponent} · ${data.matchInfo.date} ${data.matchInfo.time}`, pad, h - 88 * u, 19 * u, w - 2 * pad);
    text([data.matchInfo.venue, data.matchInfo.round].filter(Boolean).join(' · '), pad, h - 62 * u, 15 * u, w - 2 * pad);
  }
  if (data.showSponsors) data.sponsors.slice(0, 12).forEach((s, i) => { const img = images.get(s.src); if (img) drawContained(ctx, img, pad + i * (w - 2 * pad) / 12, data.sponsorPosition === 'top' ? 6 * u : h - 33 * u, (w - 2 * pad) / 12 - 8 * u, 26 * u); });
}
