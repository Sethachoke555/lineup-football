/// <reference lib="webworker" />
import { removeBackground } from '@imgly/background-removal';

self.onmessage = async (event: MessageEvent<{ src: string }>) => {
  try {
    const original = await (await fetch(event.data.src)).blob();
    const bitmap = await createImageBitmap(original);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0); bitmap.close();
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Existing alpha cutouts bypass segmentation to preserve their hair/edge details.
    let transparent = false;
    for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] < 250) { transparent = true; break; }
    let result: Blob;
    if (transparent) result = await canvas.convertToBlob({ type: 'image/png' });
    else {
      const segmented = await removeBackground(original, {
        model: 'isnet_fp16', device: 'cpu', proxyToWorker: false, rescale: true,
        output: { format: 'image/png', quality: 1 },
        progress: (key, current, total) => self.postMessage({ progress: { key, current, total } }),
      });
      const cutout = await createImageBitmap(segmented);
      if (cutout.width !== canvas.width || cutout.height !== canvas.height) throw new Error('Unexpected output dimensions.');
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(cutout, 0, 0); cutout.close();
      result = await canvas.convertToBlob({ type: 'image/png' });
    }
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Background removal failed.' });
  }
};
