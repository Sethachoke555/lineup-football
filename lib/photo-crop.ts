import type { Player, PlayerPhotoSettings, Point } from '@/types/project';

export interface ImageSize { width: number; height: number }
export interface CropFrame extends ImageSize { x: number; y: number }
export const DEFAULT_PHOTO_SETTINGS: PlayerPhotoSettings = { version: 1, x: 0, y: 0, zoom: .94, cropWidth: 4, cropHeight: 5 };
export const MIN_PHOTO_ZOOM = .1;
export const MAX_PHOTO_ZOOM = 512;

export function photoPlacement(image: ImageSize, settings: PlayerPhotoSettings, frame: CropFrame) {
  const scale = Math.min(frame.width / image.width, frame.height / image.height) * settings.zoom;
  const width = image.width * scale; const height = image.height * scale;
  return { x: frame.x + (frame.width - width) / 2 + settings.x * frame.width, y: frame.y + (frame.height - height) / 2 + settings.y * frame.height, width, height };
}

export function fillPhotoZoom(image: ImageSize, settings: PlayerPhotoSettings) {
  return Math.max(settings.cropWidth / image.width, settings.cropHeight / image.height) / Math.min(settings.cropWidth / image.width, settings.cropHeight / image.height);
}

export function limitPhotoSettings(settings: PlayerPhotoSettings, image: ImageSize): PlayerPhotoSettings {
  const zoom = Math.max(MIN_PHOTO_ZOOM, Math.min(MAX_PHOTO_ZOOM, settings.zoom));
  const box = photoPlacement(image, { ...settings, zoom }, { x: 0, y: 0, width: settings.cropWidth, height: settings.cropHeight });
  // Permit deliberate negative space, but keep some of the image reachable in the frame.
  const limitX = (box.width / settings.cropWidth + 1) / 2 - .05;
  const limitY = (box.height / settings.cropHeight + 1) / 2 - .05;
  return { ...settings, zoom, x: Math.max(-limitX, Math.min(limitX, settings.x)), y: Math.max(-limitY, Math.min(limitY, settings.y)) };
}

export function zoomPhotoAt(settings: PlayerPhotoSettings, nextZoom: number, focus: Point, image: ImageSize) {
  const zoom = Math.max(MIN_PHOTO_ZOOM, Math.min(MAX_PHOTO_ZOOM, nextZoom));
  const ratio = zoom / settings.zoom;
  return limitPhotoSettings({ ...settings, zoom, x: focus.x + (settings.x - focus.x) * ratio, y: focus.y + (settings.y - focus.y) * ratio }, image);
}

export function playerPhotoFrame(settings: PlayerPhotoSettings, width: number, height: number): CropFrame {
  if (settings.legacyFrame) {
    const frameWidth = width * .88;
    const frameHeight = settings.legacyFrame === 'portrait' ? height * .8 : frameWidth;
    return { x: -frameWidth / 2, y: settings.legacyFrame === 'circle' ? -height * .12 - frameWidth / 2 : -height * .52, width: frameWidth, height: frameHeight };
  }
  const frameHeight = height * .8;
  const frameWidth = frameHeight * settings.cropWidth / settings.cropHeight;
  return { x: -frameWidth / 2, y: -height * .52, width: frameWidth, height: frameHeight };
}

/** Preserve the exact old image placement, including legacy circles, until reframing is requested. */
export function settingsForPlayer(player: Player, image: ImageSize): PlayerPhotoSettings {
  if (player.photoSettings) return { ...player.photoSettings };
  const t = player.transform; const w = 100; const h = 105;
  const frameWidth = w * .88; const frameHeight = t.crop === 'portrait' ? h * .8 : frameWidth;
  const fill = Math.max(frameWidth / image.width, frameHeight / image.height) / Math.min(frameWidth / image.width, frameHeight / image.height);
  const frameTop = t.crop === 'circle' ? -h * .12 - frameWidth / 2 : -h * .52;
  return { version: 1, x: t.x / 200, y: t.y / 200 + (-h * .52 - frameTop) / frameHeight, zoom: t.zoom * t.scale * (t.crop === 'portrait' ? 1 : fill), cropWidth: frameWidth, cropHeight: frameHeight, legacyFrame: t.crop };
}

export function drawCroppedPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement, settings: PlayerPhotoSettings, frame: CropFrame) {
  const placement = photoPlacement({ width: image.naturalWidth, height: image.naturalHeight }, settings, frame);
  ctx.save(); ctx.beginPath();
  if (settings.legacyFrame === 'circle') ctx.ellipse(frame.x + frame.width / 2, frame.y + frame.height / 2, frame.width / 2, frame.height / 2, 0, 0, Math.PI * 2);
  else ctx.rect(frame.x, frame.y, frame.width, frame.height);
  ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, placement.x, placement.y, placement.width, placement.height);
  ctx.restore();
}
