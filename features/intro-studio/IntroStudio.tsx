'use client';
import { useEffect, useRef, useState } from 'react';
import type { Project, Player } from '@/types/project';
import { loadImage } from '@/lib/images';
import { drawCroppedPhoto, settingsForPlayer } from '@/lib/photo-crop';
import { validateIntroSnapshot } from '@/lib/intro-snapshot';

type Kind='player'|'team';
type Props={project:Project;kind:Kind;selectedId:string|null;onSave:(kind:Kind,snapshot:string)=>void;onBusy:(busy:boolean)=>void;onError:(message:string)=>void};
async function photo(player?:Player){
 if(!player?.photo)return '';
 const image=await loadImage(player.photo),canvas=document.createElement('canvas');canvas.width=600;canvas.height=750;
 drawCroppedPhoto(canvas.getContext('2d')!,image,settingsForPlayer(player,{width:image.naturalWidth,height:image.naturalHeight}),{x:0,y:0,width:600,height:750});
 return canvas.toDataURL('image/png');
}
async function fromProject(project:Project,kind:Kind,playerId:string|null){
 if(kind==='team')return {version:1,inputs:{'team-name':project.team.name,'team-coach':project.team.coach,'team-formation':project.formation,'team-duration':'26','team-color':project.colors.accent,'team-panel':project.colors.primary,'team-subs':project.players.filter(p=>p.status==='substitute').map(p=>`${p.number} ${p.name}`).join('\n')},logo:project.team.logo,players:await Promise.all(project.players.filter(p=>p.status==='starting').slice(0,11).map(async p=>({name:p.name,number:p.number,photo:await photo(p)})))};
 const player=project.players.find(p=>p.id===playerId)||project.players[0];
 const positions=['ST','LW','RW','CM','LB','CB','RB','GK'];
 return {version:1,inputs:{'player-name':player?.name||'YOUR NAME',number:player?.number||'10',position:positions.includes(player?.position||'')?player!.position:'CM',team:project.team.name,color:project.colors.accent,aspect:project.size==='landscape'?'landscape':project.size==='square'?'square':'portrait',duration:'10',scale:'100',offset:'0','auto-enhance':true,'logo-scale':'100','logo-opacity':'20','logo-glow':true,'logo-corner':true},photo:await photo(player),logo:project.team.logo};
}
export function IntroStudio(props:Props){
 const iframe=useRef<HTMLIFrameElement>(null),latest=useRef(props),last=useRef<string|undefined>(undefined),ready=useRef(false);
 const [playerId,setPlayerId]=useState(props.selectedId||props.project.players[0]?.id||'');
 const [message,setMessage]=useState('กำลังเปิดสตูดิโอ…');
 useEffect(()=>{latest.current=props;});
 useEffect(()=>{
  let disposed=false;
  const send=async(reset=false)=>{
   const p=latest.current,saved=reset?undefined:p.project.introStudio?.[p.kind];last.current=saved;
   try{const snapshot=saved?validateIntroSnapshot(saved):await fromProject(p.project,p.kind,p.selectedId);
    if(!disposed)iframe.current?.contentWindow?.postMessage({type:'kickoff:load',kind:p.kind,snapshot},location.origin);
   }catch(error){p.onError(error instanceof Error?error.message:'เปิดข้อมูลคลิปไม่สำเร็จ');}
  };
  const receive=(event:MessageEvent)=>{
   if(event.origin!==location.origin||event.source!==iframe.current?.contentWindow||event.data?.kind!==latest.current.kind)return;
   const p=latest.current;
   if(event.data.type==='kickoff:ready'){ready.current=true;void send();}
   if(event.data.type==='kickoff:loaded')setMessage('ใช้ข้อมูลทีมและรูปจากโปรเจ็กต์ · กด Save ด้านบนเพื่อเก็บการตั้งค่าคลิป');
   if(event.data.type==='kickoff:busy')p.onBusy(event.data.busy===true);
   if(event.data.type==='kickoff:error')p.onError(String(event.data.message));
   if(event.data.type==='kickoff:snapshot'&&typeof event.data.snapshot==='string'){
    try{validateIntroSnapshot(event.data.snapshot);last.current=event.data.snapshot;p.onSave(p.kind,event.data.snapshot);}catch(error){p.onError(error instanceof Error?error.message:'ข้อมูลคลิปไม่ถูกต้อง');}
   }
  };
  window.addEventListener('message',receive);
  return()=>{disposed=true;ready.current=false;window.removeEventListener('message',receive);latest.current.onBusy(false);};
 },[]);
 const saved=props.project.introStudio?.[props.kind];
 useEffect(()=>{
  if(!ready.current||saved===last.current)return;last.current=saved;
  let cancelled=false;
  void (async()=>{try{const data=saved?validateIntroSnapshot(saved):await fromProject(props.project,props.kind,props.selectedId);if(!cancelled)iframe.current?.contentWindow?.postMessage({type:'kickoff:load',kind:props.kind,snapshot:data},location.origin);}catch(error){props.onError(error instanceof Error?error.message:'เปิดข้อมูลไม่สำเร็จ');}})();
  return()=>{cancelled=true;};
 },[saved,props]);
 const refresh=async()=>{
  try{const snapshot=await fromProject(props.project,props.kind,playerId);iframe.current?.contentWindow?.postMessage({type:'kickoff:load',kind:props.kind,snapshot},location.origin);}catch(error){props.onError(error instanceof Error?error.message:'นำเข้าข้อมูลไม่สำเร็จ');}
 };
 return <section className="intro-studio" aria-label={props.kind==='team'?'เปิดตัวทีม':'เปิดตัวนักเตะ'}>
  <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',padding:'12px 24px'}}>
   {props.kind==='player'&&<select aria-label="เลือกนักเตะสำหรับคลิป" value={playerId} onChange={e=>setPlayerId(e.target.value)}>{props.project.players.map(p=><option key={p.id} value={p.id}>{p.number} · {p.name}</option>)}</select>}
   <button className="button" onClick={()=>void refresh()}>ใช้ข้อมูล{props.kind==='team'?'ทีมล่าสุด':'นักเตะที่เลือก'}</button><span style={{fontSize:12}}>{message}</span>
  </div>
  <iframe ref={iframe} title={props.kind==='team'?'Team Intro Studio':'Player Intro Studio'} src={`/kickoff/${props.kind==='team'?'team.html':'index.html'}`} allow="autoplay; fullscreen" />
 </section>;
}
