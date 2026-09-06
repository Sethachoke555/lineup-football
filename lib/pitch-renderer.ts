import type { Point, Project } from '@/types/project';
import { graphicLayout, projectPitch } from './pitch-geometry';

export function drawPitch(ctx: CanvasRenderingContext2D, project: Project) {
  const layout = graphicLayout(project); const { pitch: p, unit: u } = layout;
  const map = (x: number, y: number) => projectPitch(layout, { x, y });
  const path = (points: Point[], close = false) => {
    ctx.beginPath(); points.forEach((point, i) => { if (i) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); }); if (close) ctx.closePath();
  };
  const rectangle = (x: number, y: number, width: number, height: number) => path([map(x, y), map(x + width, y), map(x + width, y + height), map(x, y + height)], true);
  const corners = [map(0, 0), map(100, 0), map(100, 100), map(0, 100)];
  ctx.save();
  // A solid extruded platform and soft floor shadow make the pitch read as a 3D object.
  ctx.shadowColor = '#000000aa'; ctx.shadowBlur = 35 * u; ctx.shadowOffsetY = 22 * u;
  path(corners.map((point) => ({ ...point, y: point.y + 17 * u })), true); ctx.fillStyle = '#030d18'; ctx.fill();
  ctx.shadowColor = 'transparent';
  const edge = ctx.createLinearGradient(0, p.y + p.height, 0, p.y + p.height + 20 * u);
  edge.addColorStop(0, project.colors.secondary); edge.addColorStop(1, '#030d18');
  path([corners[3], corners[2], { x: corners[2].x, y: corners[2].y + 17 * u }, { x: corners[3].x, y: corners[3].y + 17 * u }], true); ctx.fillStyle = edge; ctx.fill();
  path(corners, true);
  const grass = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
  grass.addColorStop(0, project.template === 'minimal' ? '#397c70' : '#103c39'); grass.addColorStop(1, project.template === 'minimal' ? '#73ae8c' : '#216b53');
  ctx.fillStyle = grass; ctx.fill();
  for (let i = 0; i < 10; i++) { rectangle(0, i * 10, 100, 10); ctx.fillStyle = i % 2 ? '#ffffff0d' : '#0000000d'; ctx.fill(); }
  ctx.strokeStyle = '#d0ffe38c'; ctx.lineWidth = 2 * u;
  rectangle(4, 3, 92, 94); ctx.stroke();
  path([map(4, 50), map(96, 50)]); ctx.stroke();
  const circle = (cx: number, cy: number, rx: number, ry: number) => {
    path(Array.from({ length: 65 }, (_, i) => { const angle = i / 64 * Math.PI * 2; return map(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry); }), true);
  };
  circle(50, 50, 14, 13); ctx.stroke(); circle(50, 50, .5, .5); ctx.fillStyle = '#e4ffed'; ctx.fill();
  for (const far of [true, false]) {
    const y = far ? 3 : 97; const direction = far ? 1 : -1;
    rectangle(25, y, 50, direction * 17); ctx.stroke(); rectangle(38, y, 24, direction * 6); ctx.stroke();
    circle(50, y + direction * 11.5, .45, .45); ctx.fill();
    const left = map(39, y); const right = map(61, y); const lift = (far ? 19 : 28) * u;
    ctx.save(); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = u;
    for (let col = 0; col <= 8; col++) { const x = left.x + (right.x - left.x) * col / 8; path([{ x, y: left.y }, { x, y: left.y - lift }]); ctx.stroke(); }
    for (let row = 0; row <= 3; row++) { const gy = left.y - lift * row / 3; path([{ x: left.x, y: gy }, { x: right.x, y: gy }]); ctx.stroke(); }
    ctx.lineWidth = 3 * u; ctx.strokeStyle = '#e3fff3'; path([left, { x: left.x, y: left.y - lift }, { x: right.x, y: right.y - lift }, right]); ctx.stroke(); ctx.restore();
  }
  path(corners, true); ctx.strokeStyle = '#aaffd545'; ctx.lineWidth = 3 * u; ctx.stroke();
  path([{ x: corners[3].x + 3 * u, y: corners[3].y + 3 * u }, { x: corners[2].x - 3 * u, y: corners[2].y + 3 * u }]); ctx.strokeStyle = project.colors.accent; ctx.lineWidth = 3 * u; ctx.stroke();
  ctx.restore();
}
