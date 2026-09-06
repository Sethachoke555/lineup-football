const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(source: string): Promise<HTMLImageElement> {
  const existing = cache.get(source); if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image); image.onerror = () => { cache.delete(source); reject(new Error('An uploaded image could not be decoded. Replace it and try again.')); };
    image.src = source;
  });
  if (cache.size >= 48) cache.delete(cache.keys().next().value!);
  cache.set(source, promise); return promise;
}
export async function readImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WEBP image.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Please choose an image smaller than 12 MB.');
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Unable to read this file.')); reader.readAsDataURL(file); });
  const image = await loadImage(data);
  if (image.naturalWidth * image.naturalHeight > 32_000_000) throw new Error('Please use an image under 32 megapixels.');
  return data;
}
export function drawContained(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * ratio; const h = image.naturalHeight * ratio;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
