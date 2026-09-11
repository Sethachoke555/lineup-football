// Process once per upload; keep alpha intact for transparent player cutouts.
export function enhancePhoto(image) {
 const canvas = document.createElement('canvas');
 const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
 canvas.width = Math.max(1, Math.round(image.width * scale));
 canvas.height = Math.max(1, Math.round(image.height * scale));
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
 const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
 const data = pixels.data;
 let sum = 0, weight = 0;
 for (let i = 0; i < data.length; i += 16) {
  const alpha = data[i + 3] / 255;
  sum += (data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722) * alpha;
  weight += alpha;
 }
 const mean = weight ? sum / weight / 255 : .5;
 const exposure = Math.max(-.12, Math.min(.28, (.5 - mean) * .7));
 for (let i = 0; i < data.length; i += 4) {
  if (!data[i + 3]) continue;
  const rgb = [data[i], data[i + 1], data[i + 2]].map(value => {
   const v = value / 255;
   const lit = v + exposure * 4 * v * (1 - v);
   return lit + .12 * (lit - .5) * lit * (1 - lit);
  });
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  for (let channel = 0; channel < 3; channel++) {
   data[i + channel] = Math.round(255 * Math.max(0, Math.min(1, luminance + (rgb[channel] - luminance) * 1.07)));
  }
 }
 ctx.putImageData(pixels, 0, 0);
 return canvas;
}
