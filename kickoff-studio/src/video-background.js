import { decodeVideo, disposeVideo, seekVideo } from './video.js';

export function releaseCutout(cutout) {
 cutout?.frames.forEach(frame => frame.close());
}

// Cache transparent frames once so playback, scrubbing and export use the same result.
export async function removeVideoBackground(file, { signal, onProgress = () => {}, removeFrame } = {}) {
 const frames=[];
 let visibleFrames=0,removedFrames=0;
 let video;
 const check=()=>signal?.throwIfAborted();
 try {
  check();
  video=await decodeVideo(file);
  const remove=removeFrame || (await import('@imgly/background-removal')).removeBackground;
  const config={device:'cpu',model:'isnet_quint8',progress:(key,current,total)=>{
   if(!signal?.aborted && key.includes('fetch'))onProgress({download:total?Math.round(current/total*100):0});
  }};
  const fps=12,count=Math.ceil(video.duration*fps);
  const scale=Math.min(1,720/Math.max(video.videoWidth,video.videoHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
  canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  const ctx=canvas.getContext('2d');
  const probe=document.createElement('canvas');probe.width=64;probe.height=64;
  const probeContext=probe.getContext('2d',{willReadFrequently:true});
  for(let index=0;index<count;index++) {
   check();await seekVideo(video,index/fps);check();
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(video,0,0,canvas.width,canvas.height);
   const input=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Frame encoding failed')),'image/png'));
   check();const output=await remove(input,config);check();
   const frame=await createImageBitmap(output);frames.push(frame);check();
   probeContext.clearRect(0,0,64,64);probeContext.drawImage(frame,0,0,64,64);
   const pixels=probeContext.getImageData(0,0,64,64).data;
   let foreground=0,background=0;
   for(let i=3;i<pixels.length;i+=4){if(pixels[i]>127)foreground++;if(pixels[i]<64)background++;}
   if(foreground>4)visibleFrames++;
   if(background>40)removedFrames++;
   onProgress({completed:index+1,total:count});
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(!visibleFrames)throw new Error('ไม่พบตัวแบบในผลลบพื้นหลัง · เก็บวิดีโอเดิมไว้ กรุณาลองคลิปที่เห็นนักเตะชัดเจน');
  if(!removedFrames)throw new Error('ยังแยกพื้นหลังวิดีโอนี้ไม่ได้ · เก็บวิดีโอเดิมไว้ กรุณาลองคลิปที่ตัวนักเตะต่างจากพื้นหลังชัดเจน');
  return {frames,fps,duration:video.duration};
 } catch(error) { releaseCutout({frames});throw error; }
 finally { disposeVideo(video); }
}
