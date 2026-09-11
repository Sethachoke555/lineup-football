export function disposeVideo(video) {
 if (!video) return;
 video.pause();
 URL.revokeObjectURL(video.src);
 video.removeAttribute('src');
 video.load();
}

export async function decodeVideo(file) {
 const video = document.createElement('video');
 video.muted = true;
 video.playsInline = true;
 video.loop = true;
 video.preload = 'auto';
 try {
  await new Promise((resolve, reject) => {
   const timeout = setTimeout(() => finish(new Error('เปิดวิดีโอไม่ได้ กรุณาลองไฟล์อื่น')), 15000);
   const finish = error => {
    clearTimeout(timeout);
    video.onloadeddata = video.onerror = null;
    error ? reject(error) : resolve();
   };
   video.onloadeddata = () => finish();
   video.onerror = () => finish(new Error('เปิดวิดีโอไม่ได้ กรุณาใช้ MP4 หรือ WebM ที่เบราว์เซอร์รองรับ'));
   video.src = URL.createObjectURL(file);
  });
  if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 5) {
   throw new Error('กรุณาเลือกวิดีโอความยาวไม่เกิน 5 วินาที');
  }
  return video;
 } catch (error) { disposeVideo(video); throw error; }
}

export function seekVideo(video, time) {
 video.pause();
 return new Promise((resolve, reject) => {
  if (!video.seeking && Math.abs(video.currentTime - time) < .001) return resolve();
  const finish = error => {
   clearTimeout(timeout);
   video.removeEventListener('seeked', done);
   error ? reject(error) : resolve();
  };
  const done = () => finish();
  const timeout = setTimeout(() => finish(new Error('Video seek timed out')), 5000);
  video.addEventListener('seeked', done);
  video.currentTime = time;
 });
}
