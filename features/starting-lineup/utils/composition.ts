import { SIZES, type StartingLineup } from '@/types/project';

export function startingComposition(data: StartingLineup) {
  const [width, height] = SIZES[data.size], unit = Math.min(width, height) / 1080;
  const pad = 28 * unit, top = (data.matchInfo.enabled ? 280 : 245) * unit;
  const subRows = Math.ceil(data.substitutes.length / (data.substituteLayout === 'compact' ? 1 : 2));
  const subHeight = (subRows ? 54 + subRows * 36 : 0) * unit;
  // A full twelve-person compact bench reflows into two columns to keep the XI readable.
  const benchHeight = Math.min(subHeight, 270 * unit);
  const bottom = height - 70 * unit - benchHeight;
  const list = { x: width * .505, y: top, width: width * .495 - pad, height: bottom - top };
  const hero = { x: pad, y: top, width: width * .465 - pad, height: bottom - top };
  return { width, height, unit, pad, top, bottom, hero, list, benchHeight };
}

/** Keep the image reachable inside its left-only clip; stored coordinates remain unchanged. */
export function boundedHeroPlacement(image: { width: number; height: number }, data: StartingLineup, frame: { x: number; y: number; width: number; height: number }) {
  const [w, h] = SIZES[data.size];
  const scale = Math.min(frame.width / image.width, frame.height / image.height) * data.hero.zoom;
  const width = image.width * scale, height = image.height * scale;
  const cx = frame.x + (frame.width - width) / 2, cy = frame.y + (frame.height - height) / 2;
  const x = Math.max(frame.x - width * .8, Math.min(frame.x + frame.width - width * .2, cx + data.hero.x * w / 100));
  const y = Math.max(frame.y - height * .8, Math.min(frame.y + frame.height - height * .2, cy + data.hero.y * h / 100));
  return { x, y, width, height };
}
