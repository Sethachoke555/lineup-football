import type { PlayerPhotoEffect, Point } from '@/types/project';

export const EFFECT_PRESETS = ['Clean Depth', 'Broadcast', 'Stadium Glow', 'Poster', 'None'] as const;
export type EffectPreset = typeof EFFECT_PRESETS[number];
export function photoEffectPreset(preset: EffectPreset = 'None'): PlayerPhotoEffect {
  const effect: PlayerPhotoEffect = {
    version: 1, mode: preset === 'None' ? 'original' : '3d', zoom: 1, x: 0, y: 0, rotation: 0, perspective: 800, tiltX: 0, tiltY: 0, overlap: .18,
    shadow: { enabled: true, x: 10, y: 18, blur: 25, opacity: .35, distance: 1 },
    edge: { style: 'none', width: 2, strength: .3, blur: 10, color: '#ffffff', useTeamColor: true },
    card: { enabled: false, depth: 8, shadow: .25, tilt: -3, border: 1, radius: 12 },
  };
  if (preset === 'Broadcast') { effect.tiltY = -6; effect.shadow.opacity = .45; effect.edge.style = 'outline'; effect.overlap = .25; }
  if (preset === 'Stadium Glow') { effect.edge.style = 'team'; effect.edge.blur = 18; effect.edge.strength = .45; effect.shadow.opacity = .5; effect.tiltY = 5; }
  if (preset === 'Poster') { effect.zoom = 1.2; effect.overlap = .4; effect.shadow.distance = 1.6; effect.shadow.opacity = .5; effect.tiltY = -8; }
  return effect;
}

/** Pinhole projection of the image plane. The image is tilted in 3D, then rotated in screen space. */
export function projectPhotoPoint(point: Point, effect: PlayerPhotoEffect): Point {
  const rx = effect.tiltX * Math.PI / 180; const ry = effect.tiltY * Math.PI / 180; const rz = effect.rotation * Math.PI / 180;
  const x = point.x * effect.zoom; const y = point.y * effect.zoom;
  const px = x * Math.cos(ry) + y * Math.sin(rx) * Math.sin(ry);
  const py = y * Math.cos(rx); const z = -x * Math.sin(ry) + y * Math.sin(rx) * Math.cos(ry);
  const scale = effect.perspective / (effect.perspective - z);
  return { x: (px * Math.cos(rz) - py * Math.sin(rz)) * scale + effect.x, y: (px * Math.sin(rz) + py * Math.cos(rz)) * scale + effect.y };
}
