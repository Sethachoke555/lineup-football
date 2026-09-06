import { SIZES, type Point, type Project } from '@/types/project';

export function graphicLayout(project: Project) {
  const [width, height] = SIZES[project.size];
  const landscape = width > height;
  const unit = Math.min(width, height) / 1080;
  const pitch = { x: width * (landscape ? .055 : .07), y: height * .295, width: width * (landscape ? .89 : .86), height: height * .51 };
  const cardWidth = Math.min(pitch.width / 5.15, pitch.height / 4.85);
  return { width, height, unit, pitch, cardWidth, cardHeight: cardWidth * 1.05 };
}
export type GraphicLayout = ReturnType<typeof graphicLayout>;

/** The far touchline is narrower; saved positions remain pitch-relative percentages. */
export function projectPitch(layout: GraphicLayout, point: Point): Point {
  const p = layout.pitch; const depth = point.y / 100;
  return { x: p.x + p.width / 2 + (point.x / 100 - .5) * p.width * (.64 + .36 * depth), y: p.y + p.height * depth };
}

export function playerPlacement(layout: GraphicLayout, point: Point) {
  const ground = projectPitch(layout, point);
  const scale = .86 + .14 * point.y / 100;
  const width = layout.cardWidth * scale; const height = layout.cardHeight * scale;
  return { x: ground.x, y: ground.y - height * .5, width, height, ground };
}

/** Inverse of the upright card's center, including its depth-dependent height. */
export function pointFromPlayerCenter(layout: GraphicLayout, center: Point): Point {
  const p = layout.pitch;
  const depth = (center.y - p.y + layout.cardHeight * .43) / (p.height - layout.cardHeight * .07);
  return { x: 50 + (center.x - p.x - p.width / 2) / (p.width * (.64 + .36 * depth)) * 100, y: depth * 100 };
}
