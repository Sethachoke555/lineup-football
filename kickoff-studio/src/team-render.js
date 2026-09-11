export const formations={
 '4-1-4-1':[['GK'],['LB','CB','CB','RB'],['DM','LM','CM','CM','RM'],['ST']],
 '4-1-2-1-2':[['GK'],['LB','CB','CB','RB'],['DM','CM','CM','AM'],['ST','ST']],
 '3-4-2-1':[['GK'],['CB','CB','CB'],['LM','CM','CM','RM'],['AM','AM','ST']],
 '5-3-2':[['GK'],['LWB','CB','CB','CB','RWB'],['CM','CM','CM'],['ST','ST']],
 '5-4-1':[['GK'],['LWB','CB','CB','CB','RWB'],['LM','CM','CM','RM'],['ST']],
 '4-3-3':[['GK'],['LB','CB','CB','RB'],['CM','CM','CM'],['LW','ST','RW']],
 '4-4-2':[['GK'],['LB','CB','CB','RB'],['LM','CM','CM','RM'],['ST','ST']],
 '4-2-3-1':[['GK'],['LB','CB','CB','RB'],['CDM','CDM','LAM','CAM','RAM'],['ST']],
 '3-5-2':[['GK'],['CB','CB','CB'],['LM','CM','CM','CM','RM'],['ST','ST']],
 '3-4-3':[['GK'],['CB','CB','CB'],['LM','CM','CM','RM'],['LW','ST','RW']],
};
export const chapters=[{at:0,label:'เปิดทีม'},{at:2,label:'ผู้รักษาประตู'},{at:5,label:'กองหลัง'},{at:10,label:'กองกลาง'},{at:15,label:'กองหน้า'},{at:20,label:'แผนตัวจริง'}];
const titles=['GOALKEEPER','DEFENDERS','MIDFIELDERS','FORWARDS'];
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>1-(1-clamp(n))**3;
function label(c,s,x,y,size,color='#fff',align='left',max=1200){
 c.textAlign=align;c.fillStyle=color;c.font=`700 ${size}px Arial, sans-serif`;
 while(c.measureText(s).width>max&&size>9)c.font=`700 ${--size}px Arial, sans-serif`;
 c.fillText(s,x,y);
}
function contained(c,img,x,y,w,h){const scale=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*scale)/2,y+h-img.height*scale,img.width*scale,img.height*scale);}
function shirt(c,x,y,size,color,number){
 c.save();c.translate(x,y);c.scale(size/100,size/100);c.fillStyle=color;
 c.beginPath();c.moveTo(-20,0);c.lineTo(-45,12);c.lineTo(-33,40);c.lineTo(-22,34);c.lineTo(-22,88);c.lineTo(22,88);c.lineTo(22,34);c.lineTo(33,40);c.lineTo(45,12);c.lineTo(20,0);c.quadraticCurveTo(0,20,-20,0);c.fill();
 label(c,number,0,57,32,'#102136','center');c.restore();
}
export function groupsFor(team){let index=0;return formations[team.formation].map(row=>row.map(position=>({...team.players[index],index:index++,position})));}
export function makeTeamStadium(){
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d');
 const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#06111e');g.addColorStop(1,'#123c35');c.fillStyle=g;c.fillRect(0,0,1280,720);
 for(let tier=0;tier<9;tier++){c.strokeStyle=tier%2?'#304254':'#192c42';c.lineWidth=22;c.beginPath();c.ellipse(640,270,810,180+tier*25,0,0,Math.PI);c.stroke();}
 let seed=93;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<3800;i++){c.globalAlpha=.15+random()*.5;c.fillStyle=i%3?'#a1c5db':'#fff';c.fillRect(random()*1280,180+random()*320,2,2);}c.globalAlpha=1;
 c.fillStyle='#235b40';c.beginPath();c.moveTo(350,410);c.lineTo(930,410);c.lineTo(1450,720);c.lineTo(-170,720);c.fill();
 c.strokeStyle='#9dceaf70';c.lineWidth=2;c.beginPath();c.moveTo(640,410);c.lineTo(640,720);c.moveTo(350,410);c.lineTo(-170,720);c.moveTo(930,410);c.lineTo(1450,720);c.ellipse(640,550,160,50,0,0,Math.PI*2);c.stroke();
 for(const x of [90,1190]){const glow=c.createRadialGradient(x,145,0,x,145,360);glow.addColorStop(0,'#c4eaff99');glow.addColorStop(1,'#c4eaff00');c.fillStyle=glow;c.fillRect(0,0,1280,720);c.fillStyle='#fff';c.fillRect(x-65,138,130,6);}
 return canvas;
}
function pitch(c,groups,active,x,y,w,h,color,large=false,formation=''){
 c.save();c.fillStyle='#04173166';c.fillRect(x,y,w,h);c.strokeStyle='#b1d5e970';c.lineWidth=1.5;c.strokeRect(x+8,y+8,w-16,h-16);
 c.beginPath();c.moveTo(x+8,y+h/2);c.lineTo(x+w-8,y+h/2);c.ellipse(x+w/2,y+h/2,w*.14,h*.09,0,0,Math.PI*2);c.stroke();
 for(const edge of [0,1])c.strokeRect(x+w*.3,y+8+edge*(h-16-h*.12),w*.4,h*.12);
 groups.forEach((row,group)=>row.forEach((p,i)=>{
  let px=x+w*(i+1)/(row.length+1),py=y+h*(.88-group*.245);
  if(formation==='4-2-3-1'&&group===2){const back=i<2;px=x+w*((back?i:i-2)+1)/(back?3:4);py=y+h*(back?.49:.29);}
  if(large){shirt(c,px,py-26,46,group===0?'#ffcd62':'#eef6ff',p.number);label(c,p.name||p.position,px,py+27,12,'#fff','center',w/Math.max(3,row.length)-8);}
  else{c.fillStyle=group===active?color:'#0d2b64';c.fillRect(px-13,py-10,26,20);label(c,p.number,px,py+5,12,group===active?'#07172b':'#fff','center');}
 }));c.restore();
}
export function renderTeam(c,team,t,stadium){
 const time=t/team.duration*26,groups=groupsFor(team),color=team.color;
 c.clearRect(0,0,1280,720);c.drawImage(stadium,0,0);c.fillStyle='#01071545';c.fillRect(0,0,1280,720);
 if(time<2){
  c.save();c.globalAlpha=ease(time/.6);if(team.logo)contained(c,team.logo,560,155,160,160);
  label(c,'THE STARTING ELEVEN',640,375,18,color,'center');label(c,team.name||'YOUR CLUB',640,452,64,'#fff','center',1100);label(c,`${team.formation}  /  TEAM INTRODUCTION`,640,505,20,'#d1e8e5','center');c.restore();return;
 }
 const active=time<5?0:time<10?1:time<15?2:time<20?3:4;
 c.fillStyle=team.panel;c.globalAlpha=.94;c.fillRect(32,50,1216,620);c.globalAlpha=1;
 c.strokeStyle=color+'45';c.lineWidth=1;c.beginPath();c.arc(960,190,310,0,Math.PI*2);c.arc(960,190,245,0,Math.PI*2);c.stroke();
 if(team.logo){c.save();c.globalAlpha=.09;contained(c,team.logo,610,130,480,440);c.restore();contained(c,team.logo,1150,70,60,60);}
 label(c,team.name||'YOUR CLUB',640,100,28,'#fff','center',930);label(c,team.formation,64,104,18,color);
 label(c,'STARTING XI',64,642,12,'#b7c9f1');label(c,'KICKOFF • TEAM INTRO',1218,642,12,'#b7c9f1','right');
 if(active<4){
  pitch(c,groups,active,62,200,190,355,color,false,team.formation);label(c,titles[active],300,159,17,color);
  const row=groups[active],slot=880/row.length,local=time-[2,5,10,15][active];
  row.forEach((p,i)=>{
   const reveal=ease((local-i*.2)/.65),width=Math.min(255,slot-12),x=290+slot*i+(slot-width)/2;
   c.save();c.globalAlpha=reveal;c.translate(0,(1-reveal)*35);
   if(p.image)contained(c,p.image,x,185,width,375);else{shirt(c,x+width/2,285,Math.min(width*.9,195),active===0?'#ffcd62':'#eef6ff',p.number);label(c,p.position,x+width/2,500,14,'#bed0ff','center');}
   c.fillStyle=color;c.fillRect(x,557,width,35);label(c,`${p.number}  ${p.name||p.position}`,x+width/2,580,17,'#09203b','center',width-12);c.restore();
  });
 }else{
  label(c,'SUBSTITUTES',70,158,18,color);
  const subs=team.substitutes.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,12);
  if(!subs.length)label(c,'—',70,198,18,'#c1d3ed');
  subs.forEach((s,i)=>label(c,s,70,194+i*28,16,'#fff','left',380));
  label(c,'HEAD COACH',70,568,12,color);label(c,team.coach||'—',70,597,21,'#fff','left',375);
  pitch(c,groups,-1,510,139,660,466,color,true,team.formation);
 }
}
