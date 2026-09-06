import type { Project } from '@/types/project';
export function drawBackground(ctx: CanvasRenderingContext2D, project: Project, w: number, h: number, image?: HTMLImageElement) {
  const layer = document.createElement('canvas'); layer.width = w; layer.height = h;
  const bg = layer.getContext('2d')!;
  const gradient = bg.createLinearGradient(0, 0, w, h); gradient.addColorStop(0, project.colors.secondary); gradient.addColorStop(.6, project.colors.primary); gradient.addColorStop(1, project.colors.primary); bg.fillStyle = gradient; bg.fillRect(0, 0, w, h);
  if (project.background.kind === 'custom' && image) {
    const ratio = Math.max(w / image.naturalWidth, h / image.naturalHeight); const iw = image.naturalWidth * ratio; const ih = image.naturalHeight * ratio;
    bg.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
  }
  if (project.background.kind === 'pitch') {
    for (let i = 0; i < 12; i++) { bg.fillStyle = i % 2 === 0 ? '#ffffff04' : '#00000004'; bg.fillRect(0, i * h / 12, w, h / 12); }
  }
  if (project.background.kind === 'stadium') {
    bg.fillStyle = '#020c1b66'; bg.beginPath(); bg.moveTo(0, h * .15); bg.quadraticCurveTo(w / 2, h * .55, w, h * .15); bg.lineTo(w, h * .75); bg.lineTo(0, h * .75); bg.fill();
    for (let row = 0; row < 16; row++) for (let col = 0; col < 65; col++) {
      bg.fillStyle = (col * 7 + row * 3) % 5 === 0 ? '#ffffff35' : '#ffffff12';
      bg.fillRect(col * w / 65, h * .35 + row * h * .017 + Math.sin(col / 65 * Math.PI) * h * .1, w * .006, h * .004);
    }
    for (const x of [w * .06, w * .94]) {
      const light = bg.createRadialGradient(x, h * .17, 0, x, h * .17, w * .55); light.addColorStop(0, '#ffffffaa'); light.addColorStop(.1, '#ddffff40'); light.addColorStop(1, '#ffffff00'); bg.fillStyle = light; bg.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { bg.fillStyle = '#f0ffff'; bg.fillRect(x - w * .08 + i * w * .025, h * .17, w * .019, h * .006); }
    }
  }
  if (project.template === 'champions') {
    bg.strokeStyle = `${project.colors.accent}28`; bg.lineWidth = 2;
    for (let i = -2; i < 8; i++) { bg.beginPath(); bg.moveTo(i * w * .3, 0); bg.lineTo(i * w * .3 - w * .55, h); bg.stroke(); }
  }
  if (project.template === 'broadcast') {
    bg.fillStyle = '#ffffff05'; bg.beginPath(); bg.moveTo(w * .8, 0); bg.lineTo(w, 0); bg.lineTo(w * .25, h); bg.lineTo(0, h); bg.fill();
  }
  if (project.template !== 'minimal') {
    const glow = bg.createRadialGradient(w * .5, h * .38, 0, w * .5, h * .4, w * .8); glow.addColorStop(0, '#ffffff0b'); glow.addColorStop(1, '#00000066'); bg.fillStyle = glow; bg.fillRect(0, 0, w, h);
  }
  ctx.save(); ctx.fillStyle = project.colors.primary; ctx.fillRect(0, 0, w, h); ctx.filter = `brightness(${project.background.brightness}%) blur(${project.background.blur}px)`; ctx.drawImage(layer, 0, 0); ctx.restore();
  ctx.fillStyle = `rgba(0,0,0,${project.background.overlay / 100})`; ctx.fillRect(0, 0, w, h);
}
