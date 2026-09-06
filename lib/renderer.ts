import { SIZES, type Project, type Player } from '@/types/project';
import { drawContained, loadImage } from '@/utils/images';
import { drawBackground } from './background-renderer';
export function graphicLayout(project: Project) {
  const [width, height] = SIZES[project.size];
  const landscape = width > height;
  const unit = Math.min(width, height) / 1080;
  const pitch = { x: width * (landscape ? .055 : .07), y: height * .24, width: width * (landscape ? .89 : .86), height: height * .57 };
  const cardWidth = Math.min(pitch.width / 5.15, pitch.height / 4.85);
  return { width, height, unit, pitch, cardWidth, cardHeight: cardWidth * 1.05 };
}
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, maxWidth: number, align: CanvasTextAlign = 'left', weight = 700) {
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px Arial, "Noto Sans Thai", Tahoma, sans-serif`;
  ctx.fillText(value, x, y, maxWidth);
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function crest(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, size: number, project: Project) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-size / 2, -size / 2); ctx.lineTo(size / 2, -size / 2); ctx.lineTo(size * .44, size * .18); ctx.quadraticCurveTo(0, size * .7, -size * .44, size * .18); ctx.closePath();
  ctx.fillStyle = project.colors.secondary; ctx.fill(); ctx.strokeStyle = project.colors.text; ctx.lineWidth = size * .025; ctx.stroke();
  text(ctx, label, 0, 0, size * .24, project.colors.text, size * .82, 'center', 900); ctx.restore();
}
function drawPitch(ctx: CanvasRenderingContext2D, project: Project) {
  const { pitch: p, unit } = graphicLayout(project);
  ctx.save();
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 === 0 ? '#ffffff04' : '#00000006'; ctx.fillRect(p.x, p.y + p.height * i / 8, p.width, p.height / 8); }
  ctx.strokeStyle = project.template === 'minimal' ? '#12244322' : '#ffffff26'; ctx.lineWidth = 2 * unit;
  ctx.strokeRect(p.x, p.y, p.width, p.height);
  ctx.beginPath(); ctx.moveTo(p.x, p.y + p.height / 2); ctx.lineTo(p.x + p.width, p.y + p.height / 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(p.x + p.width / 2, p.y + p.height / 2, p.width * .15, p.height * .15, 0, 0, Math.PI * 2); ctx.stroke();
  for (const bottom of [false, true]) {
    const by = bottom ? p.y + p.height : p.y;
    const direction = bottom ? -1 : 1;
    ctx.strokeRect(p.x + p.width * .25, by, p.width * .5, direction * p.height * .17);
    ctx.strokeRect(p.x + p.width * .38, by, p.width * .24, direction * p.height * .065);
    ctx.beginPath(); ctx.arc(p.x + p.width / 2, by + direction * p.height * .115, 2.5 * unit, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, project: Project, image?: HTMLImageElement) {
  const { pitch, cardWidth: w, cardHeight: h } = graphicLayout(project);
  const x = pitch.x + pitch.width * player.x / 100;
  const y = pitch.y + pitch.height * player.y / 100;
  ctx.save(); ctx.translate(x, y);
  const shadow = ctx.createRadialGradient(0, h * .26, 0, 0, h * .26, w * .55); shadow.addColorStop(0, '#00000050'); shadow.addColorStop(1, '#00000000'); ctx.fillStyle = shadow; ctx.fillRect(-w * .6, -h * .25, w * 1.2, h);
  if (image) {
    const t = player.transform; const frameWidth = w * .88; const frameHeight = t.crop === 'portrait' ? h * .8 : frameWidth;
    ctx.save(); ctx.beginPath();
    if (t.crop === 'circle') ctx.ellipse(0, -h * .12, frameWidth / 2, frameWidth / 2, 0, 0, Math.PI * 2);
    else ctx.rect(-frameWidth / 2, -h * .52, frameWidth, frameHeight);
    ctx.clip();
    const fit = (t.crop === 'portrait' ? Math.min : Math.max)(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight) * t.zoom * t.scale;
    const iw = image.naturalWidth * fit; const ih = image.naturalHeight * fit;
    ctx.drawImage(image, -iw / 2 + t.x / 100 * frameWidth / 2, -h * .52 + (frameHeight - ih) / 2 + t.y / 100 * frameHeight / 2, iw, ih);
    ctx.restore();
  } else {
  ctx.beginPath(); ctx.moveTo(-w * .2, -h * .45); ctx.lineTo(-w * .46, -h * .3); ctx.lineTo(-w * .35, -h * .06); ctx.lineTo(-w * .25, -h * .13); ctx.lineTo(-w * .26, h * .25); ctx.lineTo(w * .26, h * .25); ctx.lineTo(w * .25, -h * .13); ctx.lineTo(w * .35, -h * .06); ctx.lineTo(w * .46, -h * .3); ctx.lineTo(w * .2, -h * .45); ctx.quadraticCurveTo(0, -h * .29, -w * .2, -h * .45); ctx.closePath();
  const kit = ctx.createLinearGradient(-w / 2, 0, w / 2, h / 2); kit.addColorStop(0, player.position === 'GK' ? '#dfab4c' : project.colors.secondary); kit.addColorStop(1, player.position === 'GK' ? '#806020' : project.colors.primary); ctx.fillStyle = kit; ctx.fill(); ctx.strokeStyle = '#ffffff60'; ctx.lineWidth = 1.4; ctx.stroke();
  text(ctx, player.number, 0, -h * .075, w * .28, '#ffffff', w * .42, 'center', 900);
  ctx.fillStyle = project.colors.accent; ctx.fillRect(-w * .25, h * .18, w * .5, h * .035);
  }
  rounded(ctx, -w * .52, h * .28, w * 1.04, h * .22, 2, project.template === 'minimal' ? '#ffffffee' : '#071327ef');
  rounded(ctx, -w * .52, h * .28, w * .22, h * .22, 2, project.colors.accent);
  text(ctx, player.number, -w * .41, h * .39, w * .12, '#ffffff', w * .19, 'center', 900);
  let name = (project.text.useNickname && player.nickname ? player.nickname : player.name) || 'PLAYER';
  if (project.text.uppercase) name = name.toUpperCase();
  text(ctx, name, w * .1, h * .39, w * .135 * project.text.size, project.colors.text, w * .76, 'center', 800);
  ctx.restore();
}
export async function renderGraphic(canvas: HTMLCanvasElement, project: Project) {
  const sources = [...new Set([project.team.logo, project.team.opponentLogo, project.background.kind === 'custom' ? project.background.image : '', ...project.players.map((p) => p.photo)].filter(Boolean))];
  const loaded = await Promise.all(sources.map(async (src) => [src, await loadImage(src)] as const));
  const images = new Map(loaded);
  const { width: w, height: h, unit: u } = graphicLayout(project);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('This browser does not support Canvas 2D.');
  drawBackground(ctx, project, w, h, images.get(project.background.image));
  ctx.fillStyle = project.colors.accent; ctx.fillRect(w * .055, h * .038, 46 * u, 6 * u);
  text(ctx, 'MATCHDAY  /  STARTING ELEVEN', w * .055 + 64 * u, h * .041, 15 * u, project.colors.text, w * .7, 'left', 600);
  const logo = images.get(project.team.logo);
  if (logo) drawContained(ctx, logo, w * .11 - 50 * u, h * .115 - 50 * u, 100 * u, 100 * u);
  else crest(ctx, project.team.shortName || 'FC', w * .11, h * .115, 95 * u, project);
  text(ctx, project.team.name || 'YOUR TEAM', w * .19, h * .109, 57 * u, project.colors.text, w * .75, 'left', 900);
  text(ctx, project.team.competition, w * .19, h * .155, 23 * u, project.colors.text, w * .72, 'left', 400);
  ctx.globalAlpha = .2; ctx.fillStyle = project.colors.text; ctx.fillRect(w * .055, h * .195, w * .89, u); ctx.globalAlpha = 1;
  text(ctx, 'STARTING XI', w * .07, h * .219, 19 * u, project.colors.text, w * .5, 'left', 800);
  if (project.players.some((p) => p.status === 'substitute') && project.team.coach) text(ctx, `COACH / ${project.team.coach}`, w * .5, h * .219, 13 * u, project.colors.text, w * .42, 'center', 500);
  text(ctx, project.formation, w * .93, h * .219, 23 * u, project.colors.text, w * .2, 'right', 800);
  drawPitch(ctx, project);
  project.players.filter((p) => p.status === 'starting').forEach((p) => drawPlayer(ctx, p, project, images.get(p.photo)));
  const subs = project.players.filter((p) => p.status === 'substitute');
  if (subs.length) {
    text(ctx, 'SUBSTITUTES', w * .055, h * .835, 12 * u, project.colors.text, w * .18, 'left', 700);
    subs.forEach((p, i) => { const col = i % 6; const row = Math.floor(i / 6); text(ctx, `${p.number}  ${project.text.useNickname && p.nickname ? p.nickname : p.name}`, w * .055 + col * w * .15, h * (.854 + row * .02), 13 * u, project.colors.text, w * .14, 'left', 600); });
  } else text(ctx, project.team.coach ? `HEAD COACH  /  ${project.team.coach}` : '', w * .5, h * .852, 16 * u, project.colors.text, w * .8, 'center', 500);
  ctx.fillStyle = project.template === 'minimal' ? '#14243c' : '#030a1be8'; ctx.fillRect(0, h * .895, w, h * .105);
  ctx.fillStyle = project.colors.accent; ctx.fillRect(0, h * .895, w, 4 * u);
  text(ctx, `${project.team.shortName || project.team.name}  vs  ${project.team.opponent}`, w * .055, h * .932, 25 * u, '#ffffff', w * .67, 'left', 800);
  text(ctx, [project.team.date, project.team.time && `${project.team.time} KICKOFF`, project.team.venue].filter(Boolean).join('   •   '), w * .055, h * .97, 15 * u, '#c5ccdc', w * .86, 'left', 500);
  const opponentLogo = images.get(project.team.opponentLogo);
  if (opponentLogo) drawContained(ctx, opponentLogo, w * .865, h * .908, 65 * u, 65 * u);
  else text(ctx, 'MATCHDAY', w * .945, h * .932, 15 * u, '#ffffff', w * .18, 'right', 800);
}
