/** Only embedded media and plain form values cross the studio boundary. */
export function validateIntroSnapshot(text:string):Record<string,unknown>{
 if(typeof text!=='string'||text.length>240_000_000)throw new Error('Intro project is too large.');
 const data=JSON.parse(text);
 if(!data||data.version!==1||!data.inputs||typeof data.inputs!=='object'||Array.isArray(data.inputs))throw new Error('Invalid intro project.');
 for(const [key,value] of Object.entries(data.inputs))if(key.length>80||!['string','boolean'].includes(typeof value)||(typeof value==='string'&&value.length>1000))throw new Error('Invalid intro settings.');
 const media=(src:unknown,video=false)=>{if(src===undefined||src==='')return;if(typeof src!=='string'||!(video?/^data:video\/(mp4|webm);base64,[A-Za-z0-9+/]+=*$/:/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/).test(src))throw new Error('Invalid embedded intro media.');};
 media(data.logo);media(data.photo);media(data.source);media(data.video,true);
 if(data.players!==undefined){if(!Array.isArray(data.players)||data.players.length>11)throw new Error('Invalid intro squad.');for(const p of data.players){if(!p||typeof p.name!=='string'||p.name.length>80||typeof p.number!=='string'||!/^\d{0,3}$/.test(p.number))throw new Error('Invalid intro player.');media(p.photo);media(p.source);}}
 if(data.cutout){const c=data.cutout;if(!Array.isArray(c.frames)||c.frames.length<1||c.frames.length>60||c.fps!==12||typeof c.duration!=='number'||!Number.isFinite(c.duration)||c.duration<=0||c.duration>5)throw new Error('Invalid video cutout.');c.frames.forEach((src:unknown)=>media(src));}
 return data;
}
