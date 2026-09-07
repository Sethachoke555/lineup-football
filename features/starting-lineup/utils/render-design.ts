import { SIZES, type Project, type StartingLineup } from '@/types/project';
import { loadImage, drawContained } from '@/lib/images';
import { drawStartingBackground, startingBackground } from './backgrounds';
import { startingComposition, boundedHeroPlacement } from './composition';
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
  const layout = startingComposition(data);
  const { unit: u, pad, top, bottom } = layout;
  const clean = startingBackground(data).light;
  const textScale = data.textScale ?? 1.25;
  drawStartingBackground(ctx, project, data, w, h, images.get(data.background.image));
  const ink = clean ? '#152033' : data.colors.text;
  if (data.template === 'matchday-xi' || data.template === 'club-poster') {
    ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = data.colors.accent;
    ctx.fillRect(0, 25 * u, w, 90 * u); ctx.restore();
  }
  const text = (value: string, x: number, y: number, size: number, width: number, color = ink, weight = 700) => {
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    let font = size;
    ctx.font = `${weight} ${font}px Arial, "Noto Sans Thai", Tahoma, sans-serif`;
    while (ctx.measureText(value).width > width && font > 8 * u) { font -= .5; ctx.font = `${weight} ${font}px Arial, "Noto Sans Thai", Tahoma, sans-serif`; }
    ctx.fillText(value, x, y, width);
  };
  const logo = images.get(project.team.logo);
  const logoRight = w * .03;
  const logoTop = h * .03;
  // Keep tall crests inside the header, above the existing match information.
  const logoScale = logo ? Math.min(w * .8 / logo.naturalWidth, (198 * u - logoTop) / logo.naturalHeight) : 0;
  const logoWidth = logo ? logo.naturalWidth * logoScale : 0;
  const logoHeight = logo ? logo.naturalHeight * logoScale : 0;
  const logoX = w - logoRight - logoWidth;
  if (logo) ctx.drawImage(logo, logoX, logoTop, logoWidth, logoHeight);
  const titleX = pad;
  const headerRight = logo ? logoX - 26 * u : w - pad;
  const headerWidth = headerRight - titleX - (data.competitionLogo ? 88 * u : 0);
  text(data.title, titleX, 80 * u, 82 * u, headerWidth, ink, 900);
  text(project.team.name, titleX, 147 * u, 34 * u, headerWidth);
  text(project.team.competition, titleX, 186 * u, 23 * u, headerWidth);
  const competition = images.get(data.competitionLogo);
  if (competition) drawContained(ctx, competition, headerRight - 72 * u, 42 * u, 72 * u, 72 * u);
  if (data.matchInfo.enabled) {
    const opponentLogo = images.get(data.matchInfo.opponentLogo);
    if (opponentLogo) drawContained(ctx, opponentLogo, titleX, 207 * u, 42 * u, 42 * u);
    const matchX = titleX + (opponentLogo ? 54 * u : 0);
    text(`vs ${data.matchInfo.opponent} · ${data.matchInfo.date} ${data.matchInfo.time}`, matchX, 218 * u, 22 * u, w - matchX - pad);
    text([data.matchInfo.venue, data.matchInfo.round].filter(Boolean).join(' · '), matchX, 249 * u, 20 * u, w - matchX - pad);
  }
  const formation = data.template === 'formation-pro', cards = data.template === 'player-cards';
  const { x: listX, width: listW, y: listTop } = layout.list;
  const heroImage = images.get(hero);
  if (!formation && !cards && heroImage) {
    const frame = layout.hero;
    const placement = boundedHeroPlacement({ width: heroImage.naturalWidth, height: heroImage.naturalHeight }, data, frame);
    ctx.save(); ctx.beginPath(); ctx.rect(frame.x, frame.y, frame.width, frame.height); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(heroImage, placement.x, placement.y, placement.width, placement.height); ctx.restore();
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
      text(`${p.number}  ${entry.captain ? 'C · ' : ''}${name}`, x + 12 * u, y + ch - 29 * u, 22 * u * textScale, cw - 24 * u, '#ffffff');
    } else {
      const rh = (bottom - listTop) / 11, y = listTop + index * rh;
      const gap = (3 + ((data.design?.spacing ?? 1) - .8) * 10) * u;
      ctx.fillStyle = clean ? '#ffffffed' : '#060e1bed'; ctx.fillRect(listX, y, listW, rh - gap);
      ctx.fillStyle = data.colors.accent; ctx.fillRect(listX, y, 4 * u, rh - gap);
      const mid = y + (rh - gap) / 2;
      const numberWidth = 65 * u, positionWidth = 52 * u, captainWidth = entry.captain ? 34 * u : 0;
      const nameX = listX + 84 * u;
      const positionX = listX + listW - positionWidth - 10 * u;
      const nameWidth = positionX - nameX - captainWidth - 10 * u;
      const scale = textScale * (data.design?.fontScale ?? 1);
      const numberSize = Math.min(39 * u * scale, rh * .78);
      const nameSize = Math.min(34 * u * scale, rh * .69);
      text(p.number, listX + 12 * u, mid, numberSize, numberWidth, clean ? '#152033' : data.colors.accent, 900);
      // Fit by reducing font size, never by horizontally stretching text.
      text(name, nameX, mid, nameSize, nameWidth, ink, 800);
      text(p.position, positionX, mid, Math.min(19 * u * scale, rh * .43), positionWidth, ink, 500);
      if (entry.captain) {
        const bx = positionX - captainWidth - 4 * u, size = Math.min(28 * u, rh * .55);
        ctx.fillStyle = data.colors.accent; ctx.fillRect(bx, mid - size / 2, size, size);
        text('C', bx + 5 * u, mid, size * .7, size - 8 * u, '#ffffff', 900);
      }
    }
  });
  const subs = data.substitutes.map(id => squad.get(id)).filter(p => !!p);
  if (subs.length) {
    const benchX = formation || cards ? pad : listX;
    const benchWidth = w - benchX - pad;
    const cols = data.substituteLayout === 'compact' && subs.length <= 6 ? 1 : 2;
    text('SUBSTITUTES', benchX, bottom + 26 * u, 20 * u * textScale, benchWidth, ink, 900);
    const rowHeight = (layout.benchHeight - 48 * u) / Math.ceil(subs.length / cols);
    subs.forEach((p, i) => text(`${p.number} ${data.nameStyle === 'nickname' ? p.nickname || p.name : p.name}`, benchX + i % cols * benchWidth / cols, bottom + 60 * u + Math.floor(i / cols) * rowHeight, Math.min(22 * u * textScale, rowHeight * .85), benchWidth / cols - 12 * u));
  }
  if (data.showSponsors) data.sponsors.slice(0, 12).forEach((s, i) => { const img = images.get(s.src); if (img) drawContained(ctx, img, pad + i * (w - 2 * pad) / 12, data.sponsorPosition === 'top' ? 6 * u : h - 33 * u, (w - 2 * pad) / 12 - 8 * u, 26 * u); });
}
