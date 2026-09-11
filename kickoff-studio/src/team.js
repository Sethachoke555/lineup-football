import {connectHost,serializeImage,serializeBlob,dataBlob,inputValues,restoreInputs} from './host-bridge.js';
import './style.css';
import './team.css';
import {formations,chapters,groupsFor,makeTeamStadium,renderTeam} from './team-render.js';
import {enhancePhoto} from './enhance.js';

const team={name:'YOUR CLUB',coach:'',formation:'4-3-3',color:'#5be7ed',panel:'#1436aa',duration:26,substitutes:'',logo:null,
 players:Array.from({length:11},(_,i)=>({name:'',number:String([1,3,4,5,2,8,6,10,7,9,11][i]),image:null,source:null,version:0}))};
let time=0,playing=true,exporting=false,pending=0,removing=false,logoVersion=0;
const $=s=>document.querySelector(s);
document.querySelector('#app').innerHTML=`
 <header class="topbar"><a class="brand" href="/">⚽ KICKOFF<span class="brand-dot">●</span></a><span class="product-label">TEAM INTRO STUDIO</span><span class="local-badge">สร้างสรรค์บนเครื่องคุณ</span></header>
 <nav class="studio-nav" aria-label="เมนูสตูดิโอ"><a href="/">เปิดตัวนักเตะ</a><a href="/team.html" aria-current="page">เปิดตัวทีม</a></nav>
 <main class="team-main"><div class="page-title"><div><div class="eyebrow">ELEVEN PLAYERS. ONE TEAM.</div><h1>เปิดตัวทีม<span>พร้อมลงสนาม.</span></h1><p>เปิดตัวทีละตำแหน่ง แล้วรวมตัวจริงทั้งทีมในแผนการเล่น</p></div></div>
 <div class="workspace team-workspace"><aside class="editor team-editor">
  <section><div class="section-heading"><h2><span>01</span> สโมสรและแผนการเล่น</h2></div>
   <label class="field">ชื่อทีม<input id="team-name" value="YOUR CLUB" maxlength="40"></label>
   <div class="field-grid"><label class="field">แผนการเล่น<select id="team-formation">${Object.keys(formations).map(f=>`<option ${f===team.formation?'selected':''}>${f}</option>`).join('')}</select></label><label class="field">ความยาว<select id="team-duration"><option value="20">20 วินาที</option><option value="26" selected>26 วินาที</option><option value="32">32 วินาที</option></select></label></div>
   <div class="team-colors"><label>สีแถบชื่อ <input id="team-color" type="color" value="#5be7ed"></label><label>สีฉาก <input id="team-panel" type="color" value="#1436aa"></label></div>
   <label class="field team-logo-field">โลโก้สโมสร<input id="team-logo" type="file" accept="image/png,image/jpeg,image/webp"></label><button id="team-logo-clear" class="secondary" disabled>ล้างโลโก้</button>
  </section>
  <section><div class="section-heading"><h2><span>02</span> ตัวจริง 11 คน</h2><span class="small-label">STARTING XI</span></div>
   <label class="enhance-control"><input id="team-auto-remove" type="checkbox" checked> ลบพื้นหลังรูปนักเตะอัตโนมัติ</label>
   <p class="helper">PNG, JPG, WebP สูงสุด 20 MB · แต่งแสงและสีอัตโนมัติ · ลบพื้นหลังทีละรูปตามคิว ครั้งแรกต้องดาวน์โหลดโมเดล · รูปที่โปร่งใสแล้วใช้ได้ทันที</p>
   <div id="team-roster"></div>
  </section>
  <section><div class="section-heading"><h2><span>03</span> สำรองและผู้ฝึกสอน</h2></div>
   <label class="field">รายชื่อสำรอง (สูงสุด 12 คน)<textarea id="team-subs" rows="6" maxlength="600" placeholder="12 ชื่อนักเตะ&#10;14 ชื่อนักเตะ"></textarea></label>
   <p class="helper">ใส่เบอร์และชื่อ หนึ่งคนต่อบรรทัด</p>
   <label class="field">หัวหน้าผู้ฝึกสอน<input id="team-coach" maxlength="40" placeholder="ชื่อผู้ฝึกสอน"></label>
  </section>
 </aside>
 <div class="team-preview-column"><section class="preview-panel"><div class="preview-heading"><div><i></i> TEAM LIVE PREVIEW</div><span>1280 × 720</span></div>
  <div class="stage team-stage"><canvas id="team-preview" width="1280" height="720" aria-label="ตัวอย่างคลิปเปิดตัวทีม"></canvas></div>
  <div class="team-chapters">${chapters.map((ch,i)=>`<button data-chapter="${i}">${ch.label}</button>`).join('')}</div>
  <div class="playback"><button id="team-play" class="play-button" aria-label="เล่นหรือหยุดตัวอย่างทีม">Ⅱ</button><span id="team-current">00:00</span><input id="team-timeline" type="range" min="0" max="26" step=".01" value="0" aria-label="เลื่อนเวลาคลิปทีม"><span id="team-end">00:26</span></div>
  <div class="preview-footer"><span>ตัวจริง → เปิดตัวทีละกลุ่ม → แผนการเล่น</span><span>720p / 30 FPS</span></div>
 </section><div class="team-export"><button id="team-snapshot" class="secondary">บันทึกภาพทีม</button><button id="team-export" class="primary">สร้างและดาวน์โหลดคลิปทีม ↗</button></div>
 <p id="team-status" role="status" aria-live="polite">คลิปแนวนอน MP4 หรือ WebM ตามเบราว์เซอร์ · ไม่มีเสียง · ประมวลผลบนเครื่องคุณ</p></div>
 </div></main><footer><span>© KICKOFF STUDIO</span><span>ONE BADGE. ONE TEAM.</span></footer>`;

$('#team-roster').innerHTML=team.players.map((p,i)=>`<div class="team-player" data-player="${i}">
 <div class="team-player-top"><span class="team-position"></span><label class="team-photo-label" title="อัปโหลดรูปนักเตะ ${i+1}"><img alt="" hidden><span>+ รูป</span><input type="file" data-photo="${i}" accept="image/png,image/jpeg,image/webp" aria-label="รูปนักเตะ ${i+1}"></label><label class="team-number-label">เบอร์<input type="number" min="1" max="99" value="${p.number}" data-number="${i}" aria-label="เบอร์นักเตะ ${i+1}"></label><input class="team-player-name" data-name="${i}" maxlength="26" placeholder="ชื่อนักเตะ" aria-label="ชื่อนักเตะ ${i+1}"></div>
 <div class="team-player-actions"><button data-remove="${i}" disabled>ลบพื้นหลัง</button><button data-clear="${i}" disabled>ล้างรูป</button></div></div>`).join('');
const canvas=$('#team-preview'),ctx=canvas.getContext('2d'),stadium=makeTeamStadium();
function status(s){$('#team-status').textContent=s;}
function positions(){groupsFor(team).flat().forEach(p=>{$(`[data-player="${p.index}"] .team-position`).textContent=p.position;});}
function sync(){
 $('#team-timeline').value=time;$('#team-current').textContent='00:'+String(Math.floor(time)).padStart(2,'0');$('#team-play').textContent=playing?'Ⅱ':'▶';
 const normalized=time/team.duration*26;document.querySelectorAll('[data-chapter]').forEach((b,i)=>{const active=normalized>=chapters[i].at&&(i===5||normalized<chapters[i+1].at);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function locks(){
 $('#team-export').disabled=exporting||pending>0||removing;$('#team-snapshot').disabled=exporting||pending>0||removing;
 document.querySelectorAll('[data-remove]').forEach(b=>b.disabled=exporting||removing||!team.players[+b.dataset.remove].source);
}
let last=performance.now();function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!exporting){if(playing)time=(time+dt)%team.duration;renderTeam(ctx,team,time,stadium);sync();}requestAnimationFrame(tick);}positions();requestAnimationFrame(tick);
for(const [id,key] of [['team-name','name'],['team-coach','coach'],['team-subs','substitutes'],['team-color','color'],['team-panel','panel']])$('#'+id).oninput=e=>team[key]=e.target.value;
$('#team-formation').onchange=e=>{team.formation=e.target.value;positions();};
$('#team-duration').onchange=e=>{time=time/team.duration*Number(e.target.value);team.duration=+e.target.value;$('#team-timeline').max=team.duration;$('#team-end').textContent='00:'+team.duration;};
$('#team-play').onclick=()=>playing=!playing;$('#team-timeline').oninput=e=>{time=+e.target.value;playing=false;};
document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{time=(chapters[+b.dataset.chapter].at+1.5)/26*team.duration;playing=false;});
document.querySelectorAll('[data-name]').forEach(el=>el.oninput=e=>team.players[+el.dataset.name].name=e.target.value);
document.querySelectorAll('[data-number]').forEach(el=>el.oninput=e=>team.players[+el.dataset.number].number=String(Math.max(1,Math.min(99,+e.target.value||1))));
async function decode(file){const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();return image;}finally{URL.revokeObjectURL(url);}}
function valid(file){return ['image/png','image/jpeg','image/webp'].includes(file.type)&&file.size<=20*1024*1024;}
let removalQueue=Promise.resolve();
function hasTransparentBackground(image){
 const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.drawImage(image,0,0,64,64);
 const pixels=x.getImageData(0,0,64,64).data;let transparent=0;
 for(let i=3;i<pixels.length;i+=4)if(pixels[i]<16)transparent++;
 return transparent>pixels.length/4*.05;
}
function queueRemoval(i){
 const p=team.players[i],version=p.version,source=p.source;if(!source||p.queuedVersion===version)return Promise.resolve();
 p.queuedVersion=version;pending++;locks();$(`[data-remove="${i}"]`).textContent='รอลบพื้นหลัง…';
 const job=removalQueue.then(async()=>{
  if(version!==p.version)return;
  removing=true;locks();$(`[data-remove="${i}"]`).textContent='กำลังลบ…';status(`กำลังลบพื้นหลังนักเตะ ${i+1} · ครั้งแรกต้องดาวน์โหลดโมเดล`);
  try{const {removeBackground}=await import('@imgly/background-removal');const blob=await removeBackground(source,{device:'cpu',model:'isnet_quint8'});const image=await decode(blob);if(version!==p.version)return;p.image=enhancePhoto(image);thumbnail(i);status(`ลบพื้นหลังนักเตะ ${i+1} เรียบร้อยแล้ว`);}
  catch{if(version===p.version)status(`ลบพื้นหลังนักเตะ ${i+1} ไม่สำเร็จ · เก็บรูปเดิมไว้ กดลบพื้นหลังเพื่อลองอีกครั้ง`);}
  finally{removing=false;}
 }).finally(()=>{pending--;if(p.queuedVersion===version){p.queuedVersion=null;$(`[data-remove="${i}"]`).textContent='ลบพื้นหลัง';}locks();});
 removalQueue=job.catch(()=>{});return job;
}
function thumbnail(i){const p=team.players[i],root=$(`[data-player="${i}"]`),img=root.querySelector('img');img.hidden=!p.image;root.querySelector('.team-photo-label span').hidden=!!p.image;
 if(p.image)img.src=p.image.toDataURL();else img.removeAttribute('src');root.querySelector('[data-clear]').disabled=!p.image;locks();}
document.querySelectorAll('[data-photo]').forEach(input=>input.onchange=async()=>{
 const file=input.files[0],i=+input.dataset.photo,p=team.players[i];if(!file)return;if(!valid(file)){status('กรุณาเลือก PNG, JPG หรือ WebP ไม่เกิน 20 MB');return;}
 const version=++p.version;pending++;locks();
 try{const img=await decode(file);if(version!==p.version)return;p.image=enhancePhoto(img);p.source=file;thumbnail(i);status(`เพิ่มรูปนักเตะ ${i+1} และแต่งภาพแล้ว`);if($('#team-auto-remove').checked&&!hasTransparentBackground(img))queueRemoval(i);}
 catch{if(version===p.version)status('เปิดรูปนี้ไม่ได้ กรุณาลองไฟล์อื่น');}finally{pending--;locks();}
});
document.querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{const i=+b.dataset.clear,p=team.players[i];p.version++;p.image=p.source=null;$(`[data-photo="${i}"]`).value='';thumbnail(i);status('ล้างรูปนักเตะแล้ว');});
document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(!exporting)queueRemoval(+b.dataset.remove);});
$('#team-logo').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!valid(file)){status('กรุณาเลือกโลโก้ PNG, JPG หรือ WebP ไม่เกิน 20 MB');return;}
 const version=++logoVersion;pending++;locks();try{const img=await decode(file);if(version!==logoVersion)return;const c=document.createElement('canvas'),ratio=Math.min(1,1024/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*ratio));c.height=Math.max(1,Math.round(img.height*ratio));c.getContext('2d').drawImage(img,0,0,c.width,c.height);team.logo=c;$('#team-logo-clear').disabled=false;status('เพิ่มโลโก้สโมสรแล้ว');}catch{status('เปิดโลโก้นี้ไม่ได้');}finally{pending--;locks();}};
$('#team-logo-clear').onclick=()=>{logoVersion++;team.logo=null;$('#team-logo').value='';$('#team-logo-clear').disabled=true;};
function download(blob,ext){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`kickoff-team-${team.name.replace(/[^\p{L}\p{N}_-]/gu,'_')||'club'}.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('#team-snapshot').onclick=()=>{if(exporting||pending||removing)return;playing=false;time=team.duration*23/26;renderTeam(ctx,team,time,stadium);sync();canvas.toBlob(blob=>{if(blob){download(blob,'png');status('บันทึกภาพแผนตัวจริงแล้ว');}else status('บันทึกภาพไม่สำเร็จ');});};
$('#team-export').onclick=async()=>{
 if(exporting||pending||removing)return;
 if(!window.MediaRecorder||!canvas.captureStream){status('เบราว์เซอร์นี้ไม่รองรับการสร้างคลิป กรุณาใช้ Chrome หรือ Edge');return;}
 const mime=['video/mp4;codecs=avc1.42001E','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime){status('ไม่พบรูปแบบวิดีโอที่รองรับ');return;}
 exporting=true;const wasPlaying=playing;playing=false;const controls=[...document.querySelectorAll('input,textarea,select,button')],disabled=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);
 let stream,recorder;const navigation=e=>{if(e.target.closest('a'))e.preventDefault();};document.addEventListener('click',navigation,true);
 try{
  renderTeam(ctx,team,0,stadium);stream=canvas.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});const chunks=[];
  let failure;const result=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{failure=new Error('Video encoder failed');resolve(null);};recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}));});
  recorder.start(250);const start=performance.now();
  await new Promise(resolve=>{function frame(now){time=Math.min(team.duration,(now-start)/1000);renderTeam(ctx,team,time,stadium);sync();status(`กำลังสร้างคลิปทีม ${Math.round(time/team.duration*100)}% · เปิดแท็บนี้ค้างไว้`);if(time<team.duration&&!failure)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  if(recorder.state==='recording')recorder.stop();const blob=await result;if(failure||!blob?.size)throw failure||new Error('Empty video');download(blob,mime.startsWith('video/mp4')?'mp4':'webm');status('ดาวน์โหลดคลิปเปิดตัวทีมแล้ว · ไม่มีเสียง สามารถเพิ่มเพลงในโปรแกรมตัดต่อได้');
 }catch{status('สร้างคลิปทีมไม่สำเร็จ กรุณาลองอีกครั้ง');}
 finally{if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());exporting=false;playing=wasPlaying;time=0;controls.forEach((c,i)=>c.disabled=disabled[i]);document.removeEventListener('click',navigation,true);locks();}
};

connectHost('team',{
 busy:()=>exporting||pending>0||removing,
 snapshot:async()=>({version:1,inputs:inputValues(),logo:await serializeImage(team.logo),players:await Promise.all(team.players.map(async p=>({name:p.name,number:p.number,photo:await serializeImage(p.image),source:await serializeBlob(p.source)})))}),
 restore:async data=>{
  restoreInputs(data.inputs);team.logo=data.logo?await decode(await dataBlob(data.logo)):null;$('#team-logo-clear').disabled=!team.logo;
  for(let i=0;i<11;i++){const saved=data.players?.[i]||{},p=team.players[i];p.version++;p.name=saved.name||'';p.number=saved.number||String(i+1);p.image=saved.photo?await decode(await dataBlob(saved.photo)):null;p.source=saved.source?await dataBlob(saved.source):saved.photo?await dataBlob(saved.photo):null;
   if(p.image){const c=document.createElement('canvas');c.width=p.image.width;c.height=p.image.height;c.getContext('2d').drawImage(p.image,0,0);p.image=c;}
   $(`[data-name="${i}"]`).value=p.name;$(`[data-number="${i}"]`).value=p.number;thumbnail(i);
  }
  positions();time=team.duration*7/26;playing=false;
 }
});
