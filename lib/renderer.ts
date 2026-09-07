import { type Project, type Player } from '@/types/project';
import { drawContained, loadImage } from '@/utils/images';
import { drawBackground } from './background-renderer';
import { graphicLayout, playerPlacement } from './pitch-geometry';
import { drawCroppedPhoto, playerPhotoFrame, settingsForPlayer } from './photo-crop';
import { drawPhotoEffect, drawDepthCard } from './photo-effect-renderer';
import { renderMatchResult } from './result-renderer';
import { renderStartingLineup } from './starting-lineup-renderer';
import { drawPitch } from './pitch-renderer';
export { graphicLayout } from './pitch-geometry';
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
function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, project: Project, image?: HTMLImageElement) {
  const { x, y, width: w, height: h } = playerPlacement(graphicLayout(project), player);
  ctx.save(); ctx.translate(x, y);
  drawPlayerCard(ctx, player, project, w, h, image);
  ctx.restore();
}
export function drawPlayerCard(ctx: CanvasRenderingContext2D, player: Player, project: Project, w: number, h: number, image?: HTMLImageElement) {
  ctx.save();
  ctx.save(); ctx.translate(w * .13, h * .53); ctx.scale(1, .23);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * .7); shadow.addColorStop(0, '#000000a0'); shadow.addColorStop(1, '#00000000'); ctx.fillStyle = shadow; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, h * .51, w * .4, h * .075, 0, 0, Math.PI * 2); ctx.fillStyle = '#061c2899'; ctx.fill(); ctx.strokeStyle = `${project.colors.accent}88`; ctx.lineWidth = 1.5; ctx.stroke();
  if (image) {
    const settings = settingsForPlayer(player, { width: image.naturalWidth, height: image.naturalHeight });
    const frame = playerPhotoFrame(settings, w, h);
    if (player.photoEffect && player.photoEffect.mode !== 'original') {
      drawDepthCard(ctx, frame, player.photoEffect, w, project.colors.cardBackground ?? '#090b10', project.colors.accent);
      drawPhotoEffect(ctx, image, settings, player.photoEffect, frame, w, project.colors.accent);
    } else drawCroppedPhoto(ctx, image, settings, frame);
  } else {
  ctx.beginPath(); ctx.moveTo(-w * .2, -h * .45); ctx.lineTo(-w * .46, -h * .3); ctx.lineTo(-w * .35, -h * .06); ctx.lineTo(-w * .25, -h * .13); ctx.lineTo(-w * .26, h * .25); ctx.lineTo(w * .26, h * .25); ctx.lineTo(w * .25, -h * .13); ctx.lineTo(w * .35, -h * .06); ctx.lineTo(w * .46, -h * .3); ctx.lineTo(w * .2, -h * .45); ctx.quadraticCurveTo(0, -h * .29, -w * .2, -h * .45); ctx.closePath();
  const kit = ctx.createLinearGradient(-w / 2, 0, w / 2, h / 2); kit.addColorStop(0, player.position === 'GK' ? '#dfab4c' : project.colors.secondary); kit.addColorStop(1, player.position === 'GK' ? '#806020' : project.colors.primary); ctx.fillStyle = kit; ctx.fill(); ctx.strokeStyle = '#ffffff60'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.save(); ctx.clip();
  const fabric = ctx.createLinearGradient(-w * .3, 0, w * .3, 0); fabric.addColorStop(0, '#00000040'); fabric.addColorStop(.3, '#ffffff35'); fabric.addColorStop(.53, '#ffffff05'); fabric.addColorStop(1, '#00000060'); ctx.fillStyle = fabric; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#ffffff38'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-w * .22, -h * .34); ctx.lineTo(-w * .18, h * .19); ctx.moveTo(w * .22, -h * .34); ctx.lineTo(w * .18, h * .19); ctx.stroke(); ctx.restore();
  text(ctx, player.number, 0, -h * .075, w * .28, '#ffffff', w * .42, 'center', 900);
  ctx.fillStyle = project.colors.accent; ctx.fillRect(-w * .25, h * .18, w * .5, h * .035);
  }
  rounded(ctx, -w * .5, h * .31, w * 1.04, h * .22, 2, '#020916');
  rounded(ctx, -w * .52, h * .28, w * 1.04, h * .22, 2, project.colors.cardBackground ?? '#090b10');
  ctx.fillStyle = '#ffffff50'; ctx.fillRect(-w * .52, h * .28, w * 1.04, 1);
  ctx.fillStyle = '#ffffff40'; ctx.fillRect(-w * .29, h * .32, 1, h * .14);
  text(ctx, player.number, -w * .41, h * .39, w * .12, project.colors.accent, w * .19, 'center', 900);
  let name = (project.text.useNickname && player.nickname ? player.nickname : player.name) || 'PLAYER';
  if (project.text.uppercase) name = name.toUpperCase();
  text(ctx, name, w * .1, h * .39, w * .135 * project.text.size, project.colors.cardText ?? '#ffffff', w * .76, 'center', 800);
  ctx.restore();
}
export async function renderGraphic(canvas: HTMLCanvasElement, project: Project) {
  if (project.mode === 'result') return renderMatchResult(canvas, project);
  if (project.mode === 'starting-lineup') return renderStartingLineup(canvas, project);
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
  project.players.filter((p) => p.status === 'starting').sort((a, b) => a.y - b.y).forEach((p) => drawPlayer(ctx, p, project, images.get(p.photo)));
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
