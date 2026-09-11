import {connectHost,serializeImage,serializeBlob,dataBlob,inputValues,restoreInputs} from './host-bridge.js';
import './style.css';
import { removeVideoBackground, releaseCutout } from './video-background.js';
import { decodeVideo, disposeVideo, seekVideo } from './video.js';
import { enhancePhoto } from './enhance.js';

const icons = {
 ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6zM12 3v4M3 10l4 1m10 0 4-1M7 20l2-3m6 0 2 3"/>',
 upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 play: '<path d="m9 5 11 7-11 7z"/>',
 download: '<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 wand: '<path d="m4 20 12-12 4 4L8 24M15 3v4m-2-2h4M5 4v6M2 7h6m11 10v5m-2-2h4"/>',
 check: '<path d="m5 12 4 4L19 6"/>',
 image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="8" r="2"/><path d="m3 17 6-5 4 4 3-3 5 5"/>',
 reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.ball}</svg>`;
document.querySelector('#app').innerHTML = `
 <header class="topbar"><a class="brand" href="/">${icon('ball')} KICKOFF<span class="brand-dot">●</span></a><span class="product-label">PLAYER INTRO STUDIO</span><span class="local-badge"><i></i> สร้างสรรค์บนเครื่องคุณ</span></header>
 <nav class="studio-nav" aria-label="เมนูสตูดิโอ"><a href="/" aria-current="page">เปิดตัวนักเตะ</a><a href="/team.html">เปิดตัวทีม</a></nav>
 <main>
  <div class="page-title"><div><div class="eyebrow">MAKE YOUR ENTRANCE</div><h1>เปิดตัวนักเตะ<span>ในแบบของคุณ.</span></h1><p>จากรูปหนึ่งใบ สู่โมเมนต์ก่อนลงสนาม</p></div><div class="step-indicator"><b>01 <span>ปรับแต่ง</span></b><i>—</i><span>02 ดูตัวอย่าง</span><i>—</i><span>03 ดาวน์โหลด</span></div></div>
  <div class="workspace">
   <aside class="editor">
    <section><div class="section-heading"><h2><span>01</span> รูป / วิดีโอนักเตะ</h2><span class="small-label">PLAYER MEDIA</span></div>
     <label class="upload-zone" id="drop-zone" tabindex="0"><input type="file" id="photo" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" hidden><span class="upload-icon">${icon('upload')}</span><strong id="upload-title">คลิกหรือลากรูป / วิดีโอมาวางที่นี่</strong><span>PNG, JPG, WebP, MP4 หรือ WebM · สูงสุด 20 MB</span><span class="upload-hint">วิดีโอไม่เกิน 5 วินาที · เล่นวนแบบไม่มีเสียง</span></label>
     <div class="photo-actions"><button id="remove-bg" class="secondary" disabled>${icon('wand')} ลบพื้นหลังอัตโนมัติ</button><button id="clear-photo" class="icon-button" title="ล้างรูป" aria-label="ล้างรูป" disabled>${icon('reset')}</button></div>
     <label class="enhance-control"><input id="auto-enhance" type="checkbox" checked> แต่งภาพอัตโนมัติ <span>แสง · คอนทราสต์ · สี</span></label>
     <button id="cancel-removal" class="secondary" hidden>ยกเลิกการลบพื้นหลัง</button>
     <p class="helper" id="photo-help">ลบพื้นหลังได้ทั้งรูปและวิดีโอ · วิดีโอใช้เวลาประมวลผลและเล่นที่ 12 เฟรม/วินาทีหลังลบพื้นหลัง · ครั้งแรกต้องดาวน์โหลดโมเดล · แต่งภาพใช้เฉพาะรูป</p>
     <div class="range-row"><label for="scale">ขนาดนักเตะ</label><input id="scale" type="range" min="70" max="150" value="100"><output id="scale-value">100%</output></div>
     <div class="range-row"><label for="offset">เลื่อนแนวตั้ง</label><input id="offset" type="range" min="-150" max="150" value="0"><output id="offset-value">0</output></div>
    </section>
    <section><div class="section-heading"><h2><span>02</span> ข้อมูลนักเตะ</h2><span class="small-label">THE LINEUP</span></div>
     <label class="field">ชื่อนักเตะ <input id="player-name" maxlength="28" value="YOUR NAME" placeholder="เช่น THANAWAT"></label>
     <div class="field-grid"><label class="field">หมายเลขเสื้อ<input id="number" type="number" min="1" max="99" value="10"></label><label class="field">ตำแหน่ง<select id="position"><option value="ST">ST · กองหน้า</option><option value="LW">LW · ปีกซ้าย</option><option value="RW">RW · ปีกขวา</option><option value="CM" selected>CM · กองกลาง</option><option value="LB">LB · แบ็คซ้าย</option><option value="CB">CB · กองหลัง</option><option value="RB">RB · แบ็คขวา</option><option value="GK">GK · ผู้รักษาประตู</option></select></label></div>
     <label class="field">ชื่อทีม<input id="team" maxlength="32" value="KICKOFF UNITED" placeholder="ชื่อสโมสรของคุณ"></label>
    </section>
    <section><div class="section-heading"><h2><span>03</span> โลโก้สโมสร</h2><span class="small-label">CLUB IDENTITY</span></div>
     <label class="upload-zone" id="logo-zone" tabindex="0"><input id="club-logo" type="file" accept="image/png,image/jpeg,image/webp" hidden><span class="upload-icon">${icon('upload')}</span><strong id="logo-title">อัปโหลดโลโก้สโมสร</strong><span>PNG, JPG หรือ WebP · สูงสุด 10 MB</span></label>
     <p class="helper">แนะนำ PNG โปร่งใส · โลโก้ใหญ่ด้านหลังนักเตะ พร้อมตราเล็กมุมบน</p>
     <div class="range-row"><label for="logo-scale">ขนาดโลโก้</label><input id="logo-scale" type="range" min="50" max="150" value="100"><output id="logo-scale-value">100%</output></div>
     <div class="range-row"><label for="logo-opacity">ความชัด</label><input id="logo-opacity" type="range" min="0" max="60" value="20"><output id="logo-opacity-value">20%</output></div>
     <label class="enhance-control"><input id="logo-glow" type="checkbox" checked> แสงเรืองตามสีทีม</label>
     <label class="enhance-control"><input id="logo-corner" type="checkbox" checked> แสดงตราเล็กมุมบน</label>
     <button id="clear-logo" class="secondary" disabled>ล้างโลโก้</button>
    </section>
    <section><div class="section-heading"><h2><span>04</span> สไตล์คลิป</h2><span class="small-label">SET THE MOOD</span></div>
     <label class="field">สีประจำทีม</label><div class="swatches"><button class="swatch selected" data-color="#d9fc60" style="--swatch:#d9fc60" aria-label="สีเขียว" aria-pressed="true"></button><button class="swatch" data-color="#ff474f" style="--swatch:#ff474f" aria-label="สีแดง" aria-pressed="false"></button><button class="swatch" data-color="#53b6ff" style="--swatch:#53b6ff" aria-label="สีฟ้า" aria-pressed="false"></button><button class="swatch" data-color="#c1a0ff" style="--swatch:#c1a0ff" aria-label="สีม่วง" aria-pressed="false"></button><button class="swatch" data-color="#ffca68" style="--swatch:#ffca68" aria-label="สีทอง" aria-pressed="false"></button><label class="custom-color" title="เลือกสีเอง"><input id="color" type="color" value="#d9fc60" aria-label="เลือกสีประจำทีมเอง">+</label></div>
     <div class="field-grid"><label class="field">สัดส่วน<select id="aspect"><option value="portrait">9:16 · Reels / TikTok</option><option value="landscape">16:9 · YouTube</option><option value="square">1:1 · โพสต์</option></select></label><label class="field">ความยาว<select id="duration"><option value="6">6 วินาที</option><option value="10" selected>10 วินาที</option><option value="15">15 วินาที</option></select></label></div>
    </section>
   </aside>
   <section class="preview-panel"><div class="preview-heading"><div><i></i> LIVE PREVIEW</div><span id="resolution">720 × 1280</span></div><div class="stage"><div class="stage-caption">THE NEXT NAME.<br>THE NEXT CHAPTER.</div><canvas id="preview" width="720" height="1280" aria-label="ตัวอย่างคลิปเปิดตัวนักเตะ"></canvas><span class="stage-side">BUILT FOR THE BEAUTIFUL GAME</span></div>
    <div class="playback"><button class="play-button" id="play" aria-label="เล่นหรือหยุดตัวอย่าง">${icon('play')}</button><span id="time-current">00:00</span><input id="timeline" type="range" min="0" max="10" step="0.01" value="0" aria-label="เลื่อนเวลาตัวอย่าง"><span id="time-end">00:10</span><button class="icon-button" id="replay" title="เล่นใหม่" aria-label="เล่นใหม่">${icon('reset')}</button></div>
    <div class="preview-footer"><span>${icon('check')} ไม่มีลายน้ำ <span class="separator">/</span> 720p <span class="separator">/</span> 30 FPS</span><span>YOUR MOMENT STARTS HERE ↗</span></div>
   </section>
  </div>
  <div class="export-bar"><div class="export-description"><span class="export-symbol">${icon('ball')}</span><div><strong>พร้อมสำหรับเสียงเชียร์แล้วหรือยัง?</strong><p>ดาวน์โหลดคลิป แล้วนำไปเพิ่มเพลงใน CapCut ได้เลย</p></div></div><div class="export-actions"><button id="snapshot" class="secondary">${icon('image')} บันทึกภาพ</button><button id="export" class="primary">${icon('download')} สร้างและดาวน์โหลดคลิป <span>↗</span></button></div></div>
  <p id="status" role="status" aria-live="polite">ไฟล์วิดีโอ MP4 หรือ WebM ตามที่เบราว์เซอร์รองรับ · คลิปไม่มีเสียง</p>
 </main><footer><span>© KICKOFF STUDIO</span><span>EVERY PLAYER DESERVES A GRAND ENTRANCE.</span><span>MADE FOR YOUR TEAM</span></footer>`;

const $ = (s) => document.querySelector(s);
const canvas = $('#preview'), ctx = canvas.getContext('2d');
const state = { name:'YOUR NAME', team:'KICKOFF UNITED', number:'10', position:'CM', color:'#d9fc60', duration:10, scale:1, offset:0, video:null, videoSource:null, cutout:null, loading:false, photo:null, originalPhoto:null, enhancedPhoto:null, source:null, time:0, playing:true, exporting:false, photoVersion:0 };
const dimensions = { portrait:[720,1280], landscape:[1280,720], square:[720,720] };
const clubLogo={image:null,scale:1,opacity:.2,glow:true,corner:true,version:0};
const positionNames = { ST:'STRIKER', LW:'LEFT WINGER', RW:'RIGHT WINGER', CM:'MIDFIELDER', LB:'LEFT BACK', CB:'DEFENDER', RB:'RIGHT BACK', GK:'GOALKEEPER' };
const positionPoints = { ST:[.5,.2],LW:[.22,.3],RW:[.78,.3],CM:[.5,.5],LB:[.22,.73],CB:[.5,.73],RB:[.78,.73],GK:[.5,.9] };
const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
const ease = (n) => 1-Math.pow(1-clamp(n),3);
function text(c, str,x,y,size,color='#fff',weight=700,align='left') { c.font=`${weight} ${size}px Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(str,x,y); }
function fitText(c,str,x,y,size,maxWidth,color,weight=800) { c.font=`${weight} ${size}px Arial, sans-serif`;while(c.measureText(str).width>maxWidth && size>10){size--;c.font=`${weight} ${size}px Arial, sans-serif`;}text(c,str,x,y,size,color,weight); }
let scenery;
function makeScenery() {
 scenery=document.createElement('canvas');scenery.width=canvas.width;scenery.height=canvas.height;
 const c=scenery.getContext('2d'),w=scenery.width,h=scenery.height;
 let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#07111b');g.addColorStop(.53,'#122b35');g.addColorStop(1,'#071811');c.fillStyle=g;c.fillRect(0,0,w,h);
 // Stadium tiers and deterministic crowd lights remain steady while the camera moves.
 for(let tier=0;tier<6;tier++) {c.beginPath();c.ellipse(w/2,h*.32,w*.85,h*(.18+tier*.035),0,0,Math.PI);c.lineWidth=h*.028;c.strokeStyle=tier%2?'#10202b':'#172e3a';c.stroke();}
 let seed=83;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<2400;i++){const x=random()*w,y=h*(.25+random()*.35);if(y<h*(.32+.12*Math.sin(x/w*Math.PI)))continue;c.fillStyle=['#6a8e98','#b5c7ca','#324958','#365c71'][i%4];c.globalAlpha=.15+random()*.45;c.fillRect(x,y,1+random()*2,1+random()*2);}c.globalAlpha=1;
 for(let side=0;side<2;side++){const x=side?w*.96:w*.04,y=h*.23;g=c.createRadialGradient(x,y,0,x,y,w*.6);g.addColorStop(0,'#c5f4ff85');g.addColorStop(.08,'#8bd9ff35');g.addColorStop(1,'#559fff00');c.fillStyle=g;c.fillRect(0,0,w,h);c.save();c.translate(x,y);c.rotate(side?-.2:.2);for(let j=0;j<7;j++){c.shadowColor='#9ce6ff';c.shadowBlur=18;c.fillStyle='#efffff';c.fillRect((j-3)*15,-4,10,6);}c.restore();}
 c.fillStyle='#163c2c';c.beginPath();c.moveTo(-w*.4,h);c.lineTo(w*.24,h*.59);c.lineTo(w*.76,h*.59);c.lineTo(w*1.4,h);c.fill();
 for(let j=0;j<10;j++){const a=j/10,b=(j+1)/10;c.fillStyle=j%2?'#20503a':'#194630';c.beginPath();c.moveTo(w*(.24-.64*a),h*(.59+.41*a));c.lineTo(w*(.76+.64*a),h*(.59+.41*a));c.lineTo(w*(.76+.64*b),h*(.59+.41*b));c.lineTo(w*(.24-.64*b),h*(.59+.41*b));c.fill();}
 c.strokeStyle='#bcdfbc35';c.lineWidth=2;c.beginPath();c.moveTo(w*.27,h*.6);c.lineTo(-w*.18,h);c.moveTo(w*.73,h*.6);c.lineTo(w*1.18,h);c.moveTo(w*.5,h*.6);c.lineTo(w*.5,h);c.moveTo(w*.1,h*.73);c.lineTo(w*.9,h*.73);c.ellipse(w*.5,h*.73,w*.16,h*.045,0,0,Math.PI*2);c.stroke();
 g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#04070b55');g.addColorStop(.5,'#04070b00');g.addColorStop(1,'#04070bf2');c.fillStyle=g;c.fillRect(0,0,w,h);
}
function drawPitch(c,x,y,w,h,t) {
 c.save();c.globalAlpha=ease((t-.65)/.7);c.translate(x-(1-ease((t-.65)/.7))*80,y);c.fillStyle='#0b271ec9';c.fillRect(0,0,w,h);c.strokeStyle=state.color+'80';c.lineWidth=1.5;c.strokeRect(0,0,w,h);c.strokeStyle='#d4e7cd90';const p=w*.1;c.strokeRect(p,p,w-2*p,h-2*p);c.beginPath();c.moveTo(p,h/2);c.lineTo(w-p,h/2);c.arc(w/2,h/2,w*.16,0,Math.PI*2);c.stroke();c.strokeRect(w*.28,p,w*.44,h*.15);c.strokeRect(w*.28,h-p-h*.15,w*.44,h*.15);c.strokeRect(w*.4,p,w*.2,h*.065);c.strokeRect(w*.4,h-p-h*.065,w*.2,h*.065);
 const [px,py]=positionPoints[state.position];c.fillStyle=state.color+'25';c.beginPath();c.arc(px*w,py*(h-2*p)+p,14+Math.sin(t*3)*3,0,Math.PI*2);c.fill();c.fillStyle=state.color;c.shadowColor=state.color;c.shadowBlur=15;c.beginPath();c.arc(px*w,py*(h-2*p)+p,5,0,Math.PI*2);c.fill();c.restore();
}
function silhouette(c,x,y,w,h) {
 c.save();c.translate(x,y);const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#8c9eab');g.addColorStop(.45,'#334958');g.addColorStop(1,'#142430');c.fillStyle=g;
 c.beginPath();c.ellipse(w*.5,h*.14,w*.13,h*.115,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(w*.43,h*.23);c.lineTo(w*.41,h*.29);c.lineTo(w*.22,h*.34);c.quadraticCurveTo(w*.14,h*.39,w*.1,h*.67);c.lineTo(w*.18,h*.72);c.lineTo(w*.29,h*.48);c.lineTo(w*.25,h);c.lineTo(w*.75,h);c.lineTo(w*.71,h*.48);c.lineTo(w*.82,h*.72);c.lineTo(w*.9,h*.67);c.quadraticCurveTo(w*.86,h*.39,w*.78,h*.34);c.lineTo(w*.59,h*.29);c.lineTo(w*.57,h*.23);c.closePath();c.fill();
 c.strokeStyle=state.color;c.lineWidth=4;c.beginPath();c.moveTo(w*.41,h*.3);c.lineTo(w*.5,h*.35);c.lineTo(w*.59,h*.3);c.stroke();text(c,state.number,w*.5,h*.61,w*.24,'#ffffffaa',800,'center');text(c,'YOUR PHOTO',w*.5,h*.72,w*.035,'#c2d0d8',600,'center');c.restore();
}
function drawClubLogo(c,t) {
 if(!clubLogo.image)return;
 const w=c.canvas.width,h=c.canvas.height,unit=Math.min(w,h),pad=unit*.065;
 const img=clubLogo.image,fade=ease((t-.25)/1.1),size=unit*.65*clubLogo.scale;
 const ratio=size/Math.max(img.width,img.height),iw=img.width*ratio,ih=img.height*ratio;
 c.save();c.globalAlpha=clubLogo.opacity*fade;
 if(clubLogo.glow){c.shadowColor=state.color;c.shadowBlur=unit*.035;}
 c.drawImage(img,w*(w>h?.67:.59)-iw/2,h*.43-ih/2,iw,ih);
 c.restore();
 if(clubLogo.corner){
  const small=unit*.095/Math.max(img.width,img.height);
  c.save();c.globalAlpha=fade;c.drawImage(img,w-pad-img.width*small,pad+unit*.035,img.width*small,img.height*small);c.restore();
 }
}
function render(t=state.time,target=ctx) {
 const c=target,w=c.canvas.width,h=c.canvas.height,wide=w>h,unit=Math.min(w,h),pad=unit*.065;
 c.clearRect(0,0,w,h);c.drawImage(scenery,0,0,w,h);
 const intro=ease(t/.9);c.save();c.globalAlpha=.12*intro;text(c,state.number,w*.52,h*.65,unit*(wide?.7:1.02),state.color,900,'center');c.restore();
 drawClubLogo(c,t);
 c.fillStyle=state.color;c.fillRect(pad,pad,25,3);text(c,'PLAYER INTRODUCTION',pad+38,pad+6,unit*.019,'#e1ebec',600);text(c,'SEASON 2026 / 27',w-pad,pad+6,unit*.015,'#9faeb5',500,'right');
 c.save();c.globalAlpha=intro;c.translate(0,(1-intro)*-25);text(c,'MEET YOUR',pad,h*(wide?.2:.16),unit*.045,'#edf2f4',700);text(c,'NEXT STAR.',pad,h*(wide?.3:.215),unit*.088,state.color,900);c.restore();
 const reveal=ease((t-1.2)/1.1),pw=unit*(wide?.76:.94)*state.scale,ph=h*(wide?.89:.61)*state.scale,px=w*(wide?.65:.59)-pw/2,py=h*.82-ph+state.offset;
 c.save();c.globalAlpha=reveal;c.translate(0,(1-reveal)*65);
 if(state.video && state.cutout){
  const cutout=state.cutout,frame=cutout.frames[Math.min(cutout.frames.length-1,Math.floor((t%cutout.duration)*cutout.fps))];
  state.video.pause();
  const ratio=Math.min(pw/frame.width,ph/frame.height),iw=frame.width*ratio,ih=frame.height*ratio;
  c.drawImage(frame,px+(pw-iw)/2,py+ph-ih,iw,ih);
 }else if(state.video){
  const video=state.video, target=t%video.duration;
  if(!video.seeking && Math.abs(video.currentTime-target)>((state.playing||state.exporting)?.2:.001))video.currentTime=target;
  if(state.playing||state.exporting){if(video.paused)video.play().catch(()=>{});}else video.pause();
  const ratio=Math.min(pw/video.videoWidth,ph/video.videoHeight),iw=video.videoWidth*ratio,ih=video.videoHeight*ratio;
  if(video.readyState>=2)c.drawImage(video,px+(pw-iw)/2,py+ph-ih,iw,ih);
 }else if(state.photo){const ratio=Math.min(pw/state.photo.width,ph/state.photo.height);const iw=state.photo.width*ratio,ih=state.photo.height*ratio;c.shadowColor='#080e1480';c.shadowBlur=25;c.drawImage(state.photo,px+(pw-iw)/2,py+ph-ih,iw,ih);}else silhouette(c,px,py,pw,ph);
 c.restore();
 drawPitch(c,pad,h*(wide?.39:.405),unit*.19,unit*.29,t);
 c.save();c.globalAlpha=ease((t-.8)/.7);text(c,state.position,pad+unit*.095,h*(wide?.39:.405)+unit*.325,unit*.025,state.color,700,'center');c.restore();
 const lower=ease((t-.85)/.8),by=h*.79,bh=unit*.105;c.save();c.translate((1-lower)*-w,0);c.globalAlpha=lower;
 c.fillStyle=state.color;c.beginPath();c.moveTo(pad,by);c.lineTo(w-pad,by);c.lineTo(w-pad-18,by+bh);c.lineTo(pad,by+bh);c.fill();
 const badge=unit*.088;c.fillStyle='#10171a';c.fillRect(pad+8,by+8,badge-16,bh-16);text(c,state.number,pad+badge/2,by+bh*.7,unit*.044,'#fff',800,'center');fitText(c,state.name.trim()||'YOUR NAME',pad+badge+12,by+bh*.7,unit*.055,w-2*pad-badge-40,'#10171a');
 c.fillStyle='#ecf1ed';c.fillRect(pad,by+bh,w-2*pad-18,unit*.047);fitText(c,`${positionNames[state.position]}  /  ${state.team.trim()||'YOUR TEAM'}`,pad+14,by+bh+unit*.032,unit*.02,w-2*pad-45,'#182224',600);c.restore();
 c.globalAlpha=.6;text(c,'THE GAME STARTS WITH YOU.',pad,h-pad*.7,unit*.015,'#dbe7e4',600);text(c,'✦',w-pad,h-pad*.7,unit*.025,state.color,600,'right');c.globalAlpha=1;
}
function status(message){$('#status').textContent=message;}
function sync(){ $('#time-current').textContent=`00:${String(Math.floor(state.time)).padStart(2,'0')}`;$('#timeline').value=state.time;$('#play').innerHTML=state.playing?'Ⅱ':icon('play');}
let last=performance.now();
function tick(now){const dt=Math.min((now-last)/1000,.1);last=now;if(state.playing&&!state.exporting)state.time=(state.time+dt)%state.duration;if(!state.exporting){render();sync();}requestAnimationFrame(tick);}makeScenery();requestAnimationFrame(tick);
for(const [id,key] of [['player-name','name'],['team','team'],['number','number'],['position','position']])$('#'+id).addEventListener('input',e=>{state[key]=key==='number'?String(clamp(Number(e.target.value)||1,1,99)):e.target.value;});
$('#scale').oninput=e=>{state.scale=+e.target.value/100;$('#scale-value').value=e.target.value+'%';};
$('#offset').oninput=e=>{state.offset=+e.target.value;$('#offset-value').value=e.target.value;};
function setColor(color){state.color=color;$('#color').value=color;document.querySelectorAll('.swatch').forEach(b=>{b.classList.toggle('selected',b.dataset.color===color);b.setAttribute('aria-pressed',String(b.dataset.color===color));});}
document.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>setColor(b.dataset.color));$('#color').oninput=e=>setColor(e.target.value);
$('#duration').onchange=e=>{state.duration=+e.target.value;state.time=Math.min(state.time,state.duration);$('#timeline').max=state.duration;$('#time-end').textContent='00:'+String(state.duration).padStart(2,'0');};
$('#aspect').onchange=e=>{[canvas.width,canvas.height]=dimensions[e.target.value];$('#resolution').textContent=`${canvas.width} × ${canvas.height}`;makeScenery();};
$('#play').onclick=()=>state.playing=!state.playing;$('#replay').onclick=()=>{state.time=0;state.playing=true;};$('#timeline').oninput=e=>{state.time=+e.target.value;state.playing=false;};
async function decode(blob){const url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}}
async function loadLogo(file){
 if(!file||state.exporting)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){status('กรุณาเลือกโลโก้ PNG, JPG หรือ WebP ขนาดไม่เกิน 10 MB');return;}
 const version=++clubLogo.version;state.logoLoading=true;$('#export').disabled=true;
 try{
  const img=await decode(file);if(version!==clubLogo.version)return;
  const resized=document.createElement('canvas'),ratio=Math.min(1,1024/Math.max(img.width,img.height));
  resized.width=Math.max(1,Math.round(img.width*ratio));resized.height=Math.max(1,Math.round(img.height*ratio));
  resized.getContext('2d').drawImage(img,0,0,resized.width,resized.height);
  clubLogo.image=resized;$('#logo-title').textContent=file.name;$('#logo-zone').classList.add('has-photo');$('#clear-logo').disabled=false;
  status('เพิ่มโลโก้สโมสรแล้ว · ปรับขนาด ความชัด และแสงเรืองได้');
 }catch{if(version===clubLogo.version)status('เปิดโลโก้นี้ไม่ได้ กรุณาลองไฟล์อื่น');}
 finally{if(version===clubLogo.version){state.logoLoading=false;$('#export').disabled=state.loading||removing;}}
}
$('#club-logo').onchange=e=>loadLogo(e.target.files[0]);
$('#logo-zone').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#club-logo').click();}};
for(const type of ['dragover','dragleave','drop'])$('#logo-zone').addEventListener(type,e=>{
 e.preventDefault();$('#logo-zone').classList.toggle('dragging',type==='dragover');if(type==='drop')loadLogo(e.dataTransfer.files[0]);
});
$('#logo-scale').oninput=e=>{clubLogo.scale=+e.target.value/100;$('#logo-scale-value').value=e.target.value+'%';};
$('#logo-opacity').oninput=e=>{clubLogo.opacity=+e.target.value/100;$('#logo-opacity-value').value=e.target.value+'%';};
$('#logo-glow').onchange=e=>clubLogo.glow=e.target.checked;
$('#logo-corner').onchange=e=>clubLogo.corner=e.target.checked;
$('#clear-logo').onclick=()=>{
 clubLogo.version++;clubLogo.image=null;state.logoLoading=false;$('#export').disabled=state.loading||removing;
 $('#club-logo').value='';$('#logo-title').textContent='อัปโหลดโลโก้สโมสร';$('#logo-zone').classList.remove('has-photo');$('#clear-logo').disabled=true;status('ล้างโลโก้สโมสรแล้ว');
};
function setPhoto(image) {
 state.originalPhoto=image;
 try { state.enhancedPhoto=enhancePhoto(image); }
 catch { state.enhancedPhoto=null; }
 state.photo=$('#auto-enhance').checked && state.enhancedPhoto ? state.enhancedPhoto : image;
}
$('#auto-enhance').onchange=()=>{
 state.photo=$('#auto-enhance').checked && state.enhancedPhoto ? state.enhancedPhoto : state.originalPhoto;
 if(state.photo)status($('#auto-enhance').checked && state.enhancedPhoto ? 'แต่งภาพอัตโนมัติแล้ว · ปรับแสง คอนทราสต์ และสี' : 'แสดงภาพก่อนแต่ง');
};
async function loadImage(file){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){status('กรุณาเลือกไฟล์ PNG, JPG หรือ WebP ขนาดไม่เกิน 20 MB');return;}const version=++state.photoVersion;try{const img=await decode(file);if(version!==state.photoVersion)return;resetCutout();disposeVideo(state.video);state.video=null;state.videoSource=null;$('#auto-enhance').disabled=false;setPhoto(img);state.source=file;$('#upload-title').textContent=file.name;$('#drop-zone').classList.add('has-photo');$('#remove-bg').disabled=false;$('#clear-photo').disabled=false;state.time=2.8;$('#auto-enhance').onchange();}catch{status('เปิดรูปนี้ไม่ได้ กรุณาลองไฟล์อื่น');}}
let loadRequest=0;
async function loadPhoto(file) {
 if(!file || state.exporting)return;
 const request=++loadRequest;
 state.loading=true;
 $('#export').disabled=true;$('#snapshot').disabled=true;
 try {
  if(!file.type.startsWith('video/')) { await loadImage(file);return; }
  if(!['video/mp4','video/webm'].includes(file.type)||file.size>20*1024*1024) {
   status('กรุณาเลือก MP4 หรือ WebM ขนาดไม่เกิน 20 MB');return;
  }
  const version=++state.photoVersion;
  status('กำลังตรวจสอบวิดีโอ…');
  const video=await decodeVideo(file);
  if(version!==state.photoVersion){disposeVideo(video);return;}
  resetCutout();disposeVideo(state.video);state.video=video;state.videoSource=file;
  state.photo=state.originalPhoto=state.enhancedPhoto=state.source=null;
  $('#upload-title').textContent=file.name;
  $('#drop-zone').classList.add('has-photo');
  $('#remove-bg').disabled=removing;$('#auto-enhance').disabled=true;$('#clear-photo').disabled=false;
  state.time=2.8;
  status(`เพิ่มวิดีโอแล้ว · ${video.duration.toFixed(2)} วินาที · เล่นวนแบบไม่มีเสียง`);
 } catch(error) { if(request===loadRequest)status(error.message); }
 finally {
  if(request===loadRequest){state.loading=false;$('#export').disabled=removing;$('#snapshot').disabled=false;}
 }
}
$('#photo').onchange=e=>loadPhoto(e.target.files[0]);$('#drop-zone').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#photo').click();}};
for(const type of ['dragover','dragleave','drop'])$('#drop-zone').addEventListener(type,e=>{e.preventDefault();$('#drop-zone').classList.toggle('dragging',type==='dragover');if(type==='drop'&&!state.exporting)loadPhoto(e.dataTransfer.files[0]);});
$('#clear-photo').onclick=()=>{state.photoVersion++;resetCutout();disposeVideo(state.video);state.video=null;state.videoSource=null;$('#auto-enhance').disabled=false;state.photo=null;state.originalPhoto=null;state.enhancedPhoto=null;state.source=null;$('#photo').value='';$('#upload-title').textContent='คลิกหรือลากรูปมาวางที่นี่';$('#drop-zone').classList.remove('has-photo');$('#remove-bg').disabled=true;$('#clear-photo').disabled=true;status('ล้างรูปแล้ว');};
let removing=false,removalController=null;
function resetCutout(){removalController?.abort();releaseCutout(state.cutout);state.cutout=null;}

async function removePhotoBackground(){if(!state.source||removing)return;removing=true;const version=state.photoVersion;$('#remove-bg').disabled=true;$('#export').disabled=true;status('กำลังเตรียมลบพื้นหลัง… ครั้งแรกอาจใช้เวลาสักครู่เพื่อดาวน์โหลดโมเดล');try{const {removeBackground}=await import('@imgly/background-removal');const blob=await removeBackground(state.source,{device:'cpu',model:'isnet_quint8',progress:(key,current,total)=>{if(version===state.photoVersion)status(`กำลังลบพื้นหลัง · ${total?Math.round(current/total*100):0}% (${key.includes('fetch')?'ดาวน์โหลดโมเดล':'ประมวลผล'})`);}});const img=await decode(blob);if(version===state.photoVersion){setPhoto(img);status('ลบพื้นหลังเรียบร้อยแล้ว');}}catch(error){console.error(error);status('ลบพื้นหลังไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง หรือใช้ PNG โปร่งใส');}finally{removing=false;$('#remove-bg').disabled=!(state.source||state.videoSource)||state.loading;$('#export').disabled=state.loading;}};
$('#cancel-removal').onclick=()=>{
 removalController?.abort();$('#cancel-removal').disabled=true;status('กำลังยกเลิก… รอเฟรมที่กำลังประมวลผล');
};
$('#remove-bg').onclick=async()=>{
 if(removing||state.loading||state.exporting)return;
 if(!state.videoSource){await removePhotoBackground();return;}
 removing=true;
 const version=state.photoVersion,controller=new AbortController();removalController=controller;
 $('#remove-bg').disabled=true;$('#export').disabled=true;$('#snapshot').disabled=true;
 $('#cancel-removal').hidden=false;$('#cancel-removal').disabled=false;
 status('กำลังเตรียมลบพื้นหลังวิดีโอ… ครั้งแรกต้องดาวน์โหลดโมเดล');
 const started=performance.now();let progressText='กำลังเตรียมโมเดล · อาจใช้เวลาหลายนาที',completed=0,total=0;
 const progressTimer=setInterval(()=>{
  if(version!==state.photoVersion||controller.signal.aborted)return;
  const elapsed=Math.round((performance.now()-started)/1000);
  const remaining=completed?` · เหลือประมาณ ${Math.ceil(elapsed/completed*(total-completed)/60)} นาที`:'';
  status(`${progressText} · ผ่านไป ${elapsed} วินาที${remaining}`);
 },1000);
 try {
  const result=await removeVideoBackground(state.videoSource,{
   signal:controller.signal,
   onProgress:progress=>{
    if(version!==state.photoVersion)return;
    if(progress.completed!==undefined){completed=progress.completed;total=progress.total;}
    progressText=progress.download!==undefined?`กำลังดาวน์โหลดโมเดล · ${progress.download}%`:`กำลังลบพื้นหลังวิดีโอ · ${completed}/${total} เฟรม (${Math.round(completed/total*100)}%)`;
    status(progressText);
   }
  });
  if(version!==state.photoVersion||controller.signal.aborted){releaseCutout(result);return;}
  releaseCutout(state.cutout);state.cutout=result;
  status('ลบพื้นหลังวิดีโอเรียบร้อยแล้ว · พร้อมบันทึกภาพและดาวน์โหลดคลิป');
 } catch(error) {
  if(version===state.photoVersion)status(controller.signal.aborted?'ยกเลิกการลบพื้นหลังแล้ว':`ลบพื้นหลังวิดีโอไม่สำเร็จ · ${error.message || 'กรุณาลองอีกครั้ง'} · ยังเก็บวิดีโอเดิมไว้`);
 } finally {
  clearInterval(progressTimer);
  removing=false;removalController=null;$('#cancel-removal').hidden=true;
  $('#remove-bg').disabled=!(state.source||state.videoSource)||state.loading;
  $('#export').disabled=state.loading;$('#snapshot').disabled=state.loading;
 }
};
function download(blob,extension){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`kickoff-${state.name.replace(/[^\p{L}\p{N}_-]/gu,'_')||'player'}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('#snapshot').onclick=async()=>{if(state.video&&!state.cutout){state.playing=false;state.time=Math.max(3,state.time);try{await seekVideo(state.video,state.time%state.video.duration);}catch{status('Video frame unavailable');return;}}render(Math.max(3,state.time));canvas.toBlob(blob=>{if(blob){download(blob,'png');status('บันทึกภาพ PNG แล้ว');}else status('บันทึกภาพไม่สำเร็จ');},'image/png');};
$('#export').onclick=async()=>{
 if(state.exporting||state.loading||state.logoLoading||removing)return;
 if(!window.MediaRecorder||!canvas.captureStream){status('เบราว์เซอร์นี้ไม่รองรับการสร้างคลิป กรุณาใช้ Chrome หรือ Edge รุ่นปัจจุบัน');return;}
 const mime=['video/mp4;codecs=avc1.42001E','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
 if(!mime){status('ไม่พบรูปแบบวิดีโอที่รองรับ กรุณาใช้ Chrome หรือ Edge');return;}
 state.exporting=true;const wasPlaying=state.playing;state.playing=false;const controls=[...document.querySelectorAll('input,select,button')],disabled=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);
 let stream,recorder;
 try{
  if(state.video&&!state.cutout)await seekVideo(state.video,0);
  render(0);stream=canvas.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});const chunks=[];
  const result=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}));recorder.onerror=()=>reject(new Error('Video encoder failed'));});
  recorder.start(250);const start=performance.now();status('กำลังสร้างคลิป 0% · กรุณาเปิดแท็บนี้ค้างไว้');
  await new Promise(resolve=>{function frame(now){state.time=Math.min((now-start)/1000,state.duration);render();sync();const percentage=Math.round(state.time/state.duration*100);$('#export').textContent=`กำลังสร้างคลิป ${percentage}%`;if(state.time<state.duration)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  recorder.stop();const blob=await result;if(!blob.size)throw new Error('Empty video');const ext=mime.startsWith('video/mp4')?'mp4':'webm';download(blob,ext);status(`ดาวน์โหลดคลิป ${ext.toUpperCase()} แล้ว · ${state.duration} วินาที · ไม่มีเสียง สามารถเพิ่มเพลงในโปรแกรมตัดต่อได้`);
 }catch(error){console.error(error);status('สร้างคลิปไม่สำเร็จ กรุณาลองอีกครั้งใน Chrome หรือ Edge');}
 finally{if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());state.exporting=false;state.playing=wasPlaying;state.time=0;controls.forEach((c,i)=>c.disabled=disabled[i]);$('#export').innerHTML=`${icon('download')} สร้างและดาวน์โหลดคลิป <span>↗</span>`;}
};

connectHost('player',{
 busy:()=>state.exporting||state.loading||state.logoLoading||removing,
 snapshot:async()=>({version:1,inputs:inputValues(),photo:await serializeImage(state.originalPhoto),source:await serializeBlob(state.source),video:await serializeBlob(state.videoSource),logo:await serializeImage(clubLogo.image),cutout:state.cutout?{fps:state.cutout.fps,duration:state.cutout.duration,frames:await Promise.all(state.cutout.frames.map(serializeImage))}:null}),
 restore:async data=>{
  $('#clear-photo').click();$('#clear-logo').click();restoreInputs(data.inputs);
  if(data.video){await loadPhoto(new File([await dataBlob(data.video)],'saved-video.mp4',{type:data.video.startsWith('data:video/webm')?'video/webm':'video/mp4'}));}
  else if(data.photo){const blob=await dataBlob(data.photo);setPhoto(await decode(blob));state.source=data.source?await dataBlob(data.source):blob;$('#upload-title').textContent='Project photo';$('#remove-bg').disabled=false;$('#clear-photo').disabled=false;$('#drop-zone').classList.add('has-photo');}
  if(data.logo)await loadLogo(new File([await dataBlob(data.logo)],'club-logo.png',{type:'image/png'}));
  if(data.cutout&&state.video){state.cutout={fps:data.cutout.fps,duration:data.cutout.duration,frames:await Promise.all(data.cutout.frames.map(async src=>createImageBitmap(await dataBlob(src))))};}
  state.time=3;state.playing=false;
 }
});
