const encoded=new WeakMap();
export async function serializeImage(image){
 if(!image)return '';
 if(encoded.has(image))return encoded.get(image);
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);
 const result=c.toDataURL('image/png');encoded.set(image,result);return result;
}
export async function serializeBlob(blob){
 if(!blob)return '';if(encoded.has(blob))return encoded.get(blob);
 const result=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});encoded.set(blob,result);return result;
}
export async function dataBlob(data){
 if(!/^data:(image\/(png|jpeg|webp)|video\/(mp4|webm));base64,/.test(data))throw new Error('Invalid saved media');
 return (await fetch(data)).blob();
}
export function inputValues(){return Object.fromEntries([...document.querySelectorAll('input[id]:not([type=file]),select[id],textarea[id]')].filter(e=>!e.id.includes('timeline')).map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));}
export function restoreInputs(values={}){
 for(const [id,value] of Object.entries(values)){const e=document.getElementById(id);if(!e||e.type==='file')continue;if(e.type==='checkbox')e.checked=!!value;else e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
}
export function connectHost(kind,{snapshot,restore,busy}){
 if(window.parent===window)return;
 document.body.classList.add(`embedded-${kind}`);
 document.querySelectorAll('.topbar,.studio-nav,footer').forEach(e=>e.hidden=true);
 let loading=false,ready=false,last='',sampling=false,revision=0;
 const send=(type,payload={})=>window.parent.postMessage({type,kind,...payload},location.origin);
 window.addEventListener('message',async event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='kickoff:load'||event.data.kind!==kind)return;
  if(loading||busy())return;loading=true;send('kickoff:busy',{busy:true});
  try{await restore(event.data.snapshot);last='';ready=true;send('kickoff:loaded');}
  catch(error){send('kickoff:error',{message:error.message||'Unable to load intro'});}
  finally{loading=false;send('kickoff:busy',{busy:busy()});}
 });
 const sample=async()=>{
  send('kickoff:busy',{busy:loading||busy()||sampling});
  if(!ready||loading||busy()||sampling)return;sampling=true;
  send('kickoff:busy',{busy:true});
  try{let captured;do{captured=revision;const data=await snapshot(),json=JSON.stringify(data);if(json!==last){last=json;send('kickoff:snapshot',{snapshot:json});}}while(captured!==revision);}
  catch(error){send('kickoff:error',{message:error.message});}
  finally{sampling=false;send('kickoff:busy',{busy:loading||busy()});}
 };
 for(const event of ['input','change','click'])document.addEventListener(event,()=>{revision++;void sample();});
 setInterval(sample,350);
 send('kickoff:ready');
}
