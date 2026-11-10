(function(root){
  'use strict';
  const COLORS={fire:'#ff9b37',thunder:'#b3a0ff',wood:'#8bd468',water:'#52cafa',earth:'#c9a16d',heal:'#69ee98',buff:'#f4d987',taunt:'#f4bc65',debuff:'#d296f4',physical:'#e0ecf2'};
  const kindOf=skill=>skill.kind==='heal'?'heal':skill.kind==='buff'?(skill.vfx||skill.buff?.visual||(skill.side==='enemy'?'debuff':'buff')):skill.vfx||({stone:'earth',lightning:'thunder'}[skill.element]||skill.element)||'physical';
  const FRAME_COUNT=24,textureCache=new Map(),styles=new Set(['physical','fire','thunder','wood','water','earth','heal','buff','debuff','impact']);
  const style=kind=>kind==='taunt'?'buff':styles.has(kind)?kind:'physical';
  const TAU=Math.PI*2;
  const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function light(c,x,y,rx,ry,color,alpha){
    c.save();c.globalAlpha*=Math.max(0,alpha);c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);
    if(g?.addColorStop){g.addColorStop(0,color);g.addColorStop(.25,color+'a0');g.addColorStop(1,color+'00');c.fillStyle=g;}else c.fillStyle=color;
    c.beginPath();c.arc(0,0,rx,0,TAU);c.fill();c.restore();
  }
  function debris(c,p,color,count=12,spread=34,ground=false){
    c.fillStyle=color;for(let i=0;i<count;i++){const a=hash(i+4)*TAU,speed=.45+hash(i+37),distance=spread*Math.pow(p,.55)*speed,x=64+Math.cos(a)*distance,y=80+Math.sin(a)*distance*(ground?.3:.8)+(ground?15:0)+p*p*13,len=(1-p)*(1.5+hash(i+72)*4);c.save();c.globalAlpha*=Math.pow(1-p,1.3);c.translate(x,y);c.rotate(a);c.fillRect(-len/2,-.55,len,1.1);c.restore();}
  }
  function ribbon(c,p,reverse=false){
    const head=Math.min(1,.45+p*3),tail=Math.max(0,head-.7*(1-p)),point=t=>({x:-43*(1-t)**2+2*(1-t)*t*(-2)+46*t*t,y:-32*(1-t)**2+2*(1-t)*t*(-27)+34*t*t}),points=[];
    for(let i=0;i<=16;i++){const t=tail+(head-tail)*i/16,pt=point(t),dx=82*(1-t)+96*t,dy=10*(1-t)+122*t,length=Math.hypot(dx,dy),width=Math.sin(Math.PI*i/16)*(4.6*(1-p)+.4);points.push({x:pt.x,y:pt.y,nx:-dy/length*width,ny:dx/length*width});}
    c.save();c.translate(64,80);if(reverse)c.scale(-1,1);c.rotate(-.18);c.globalAlpha*=Math.pow(1-p,1.35);c.fillStyle='#dad8bd';c.beginPath();points.forEach((pt,i)=>i?c.lineTo(pt.x+pt.nx,pt.y+pt.ny):c.moveTo(pt.x+pt.nx,pt.y+pt.ny));for(const pt of [...points].reverse())c.lineTo(pt.x-pt.nx*.12,pt.y-pt.ny*.12);c.closePath();c.fill();c.strokeStyle='#fff1d1';c.lineWidth=.8;c.beginPath();points.forEach((pt,i)=>i?c.lineTo(pt.x,pt.y):c.moveTo(pt.x,pt.y));c.stroke();c.restore();
  }
  function paintEffect(c,kind,p,critical){
    const x=64,y=80,life=Math.pow(1-p,1.4),bloom=Math.sin(Math.PI*Math.min(1,p*2));c.save();c.globalAlpha=1;c.lineCap='round';c.lineJoin='round';
    if(kind==='physical'){
      light(c,x,y,29,19,'#d1af77',life*.22);ribbon(c,p);if(critical)ribbon(c,Math.min(1,p+.12),true);debris(c,p,'#d7bf87',14,40);
    }else if(kind==='impact'){
      light(c,x,y,critical?35:23,critical?24:16,'#e5c78d',life*.38);
      c.globalAlpha=life*.6;c.strokeStyle='#d1b382';c.lineWidth=(critical?2.2:1.4)*(1-p)+.2;c.beginPath();c.ellipse(x,y+15,Math.max(.1,8+p*39),3+p*6,0,0,TAU);c.stroke();
      c.globalAlpha=Math.pow(1-p,4);c.fillStyle='#fff4d7';c.beginPath();c.ellipse(x,y,2+life*6,1+life*3,-.55,0,TAU);c.fill();debris(c,p,'#b9aa8d',critical?19:11,critical?51:34,true);
    }else if(kind==='fire'){
      light(c,x,y+7,38,47,'#de5928',life*.62);light(c,x,y+18,36,8,'#b55a2a',life*.5);
      for(let i=0;i<10;i++){const z=hash(i+1),rise=(p*(.75+z*.45)+i*.17)%1,xx=x+(hash(i+12)-.5)*43+Math.sin(p*5+i)*4,base=y+27-rise*22,height=18+hash(i+28)*35;c.globalAlpha=life*(1-rise*.7);const flame=c.createLinearGradient(xx,base,xx,base-height);if(flame?.addColorStop){flame.addColorStop(0,'#b54c2600');flame.addColorStop(.22,'#b45b3090');flame.addColorStop(.55,'#efbd78b0');flame.addColorStop(1,'#c5884500');c.fillStyle=flame;}else c.fillStyle='#cb874f';c.beginPath();c.moveTo(xx-5,base);c.bezierCurveTo(xx-11,base-height*.3,xx+8,base-height*.6,xx+Math.sin(i+p*8)*6,base-height);c.bezierCurveTo(xx+13,base-height*.25,xx+9,base+2,xx-5,base);c.fill();}
      c.globalAlpha=life*.4;debris(c,p,'#e8b176',17,39);
    }else if(kind==='thunder'){
      const pulse=Math.floor(p*7),flash=Math.exp(-p*6)*(.65+.35*Math.abs(Math.sin(p*25)));light(c,x,y,32,50,'#9cadbd',flash*.55);
      const points=Array.from({length:10},(_,i)=>[x+(hash(i+pulse*17)-.5)*(i?28:12),7+i*9]);
      const bolt=(points,width,color,alpha)=>{c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.stroke();};
      bolt(points,6,'#3a4a63',flash);bolt(points,2.8,'#98aeb9',flash);bolt(points,.9,'#eef2dc',flash);
      for(let i=3;i<9;i+=2){const pt=points[i],dir=i%4===1?-1:1;bolt([pt,[pt[0]+dir*13,pt[1]+5],[pt[0]+dir*20,pt[1]+2],[pt[0]+dir*29,pt[1]+17]],.9,'#b9cbd0',flash*.7);}
      c.globalAlpha=life*.48;c.strokeStyle='#a0b2b6';c.lineWidth=1;c.beginPath();c.ellipse(x,y+17,6+p*34,2+p*8,0,0,TAU);c.stroke();debris(c,p,'#bdc8c2',10,30,true);
    }else if(kind==='earth'){
      light(c,x,y+18,45,13,'#9c8260',life*.32);
      for(let i=0;i<11;i++){const a=hash(i+3)*TAU,spread=(9+p*29)*(.5+hash(i+13)),xx=x+Math.cos(a)*spread,yy=y+18+Math.sin(a)*spread*.25-Math.sin(Math.PI*p)*(8+hash(i+31)*24),r=(3+hash(i+64)*7)*(1-p*.6);c.globalAlpha=life;c.fillStyle=i%2?'#8e7c62':'#b7a78b';c.beginPath();for(let j=0;j<5;j++){const angle=j*TAU/5,rr=r*(.7+hash(i*6+j)*.4);j?c.lineTo(xx+Math.cos(angle)*rr,yy+Math.sin(angle)*rr):c.moveTo(xx+Math.cos(angle)*rr,yy+Math.sin(angle)*rr);}c.closePath();c.fill();}
      debris(c,p,'#93836b',18,46,true);
    }else if(kind==='water'){
      light(c,x,y,29,29,'#568b92',life*.3);c.save();c.translate(x,y);c.rotate(-.65+p*.5);const radius=22+p*10;c.globalAlpha=life*.65;c.fillStyle='#769f9e';c.beginPath();c.moveTo(-radius,15);c.bezierCurveTo(-radius-13,-30,radius+4,-37,radius+7,9);c.bezierCurveTo(radius-5,-21,-radius-3,-19,-radius,15);c.fill();c.globalAlpha=life*.8;c.strokeStyle='#c0d3c3';c.lineWidth=.8;c.beginPath();c.moveTo(-radius-1,6);c.bezierCurveTo(-radius-3,-27,radius-3,-28,radius+5,7);c.stroke();c.restore();
      for(let i=0;i<14;i++){const a=hash(i+10)*TAU,d=8+p*30;c.globalAlpha=life*(.4+hash(i+4)*.5);c.fillStyle='#9bbcb5';c.beginPath();c.ellipse(x+Math.cos(a)*d,y+Math.sin(a)*d*.75+p*p*10,1,1.5+hash(i)*2,a,0,TAU);c.fill();}
    }else if(kind==='wood'){
      light(c,x,y,27,38,'#739b65',life*.25);for(let i=0;i<11;i++){const a=i*2.399+p*2,dist=9+p*26,xx=x+Math.cos(a)*dist,yy=y+Math.sin(a)*dist*.7-p*16;c.save();c.translate(xx,yy);c.rotate(a);c.globalAlpha=life;c.fillStyle=i%2?'#a3ba79':'#688d5a';c.beginPath();c.moveTo(-5,0);c.quadraticCurveTo(0,-5,6,0);c.quadraticCurveTo(0,3,-5,0);c.fill();c.restore();}
    }else if(kind==='heal'){
      light(c,x,y+10,29,43,'#6b9e83',Math.sin(Math.PI*p)*.37);c.globalAlpha=Math.sin(Math.PI*p)*.6;c.strokeStyle='#9bbba0';c.lineWidth=1;c.beginPath();c.ellipse(x,y+24,20+p*9,6,0,0,TAU);c.stroke();
      for(let i=0;i<13;i++){const t=(p+i/13)%1,xx=x+Math.sin(i*2.4+p*2)*25,yy=y+27-t*73,alpha=Math.sin(Math.PI*t)*life;c.globalAlpha=alpha;c.fillStyle=i%3?'#b8cfb0':'#e5d6a7';c.beginPath();c.ellipse(xx,yy,1,2.5,0,0,TAU);c.fill();}
    }else if(kind==='buff'||kind==='taunt'){
      light(c,x,y,29,38,'#b19a65',life*.24);c.globalAlpha=Math.sin(Math.PI*p)*.75;c.strokeStyle='#c7b58a';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-27);c.lineTo(x+18,y-18);c.lineTo(x+15,y+9);c.quadraticCurveTo(x+10,y+22,x,y+28);c.quadraticCurveTo(x-10,y+22,x-15,y+9);c.lineTo(x-18,y-18);c.closePath();c.stroke();c.lineWidth=.7;c.beginPath();c.moveTo(x,y-17);c.lineTo(x,y+16);c.moveTo(x-8,y-7);c.lineTo(x+8,y-7);c.stroke();debris(c,p,'#b9ac86',9,30);
    }else{
      light(c,x,y,30,43,'#766379',life*.34);for(let i=0;i<7;i++){c.globalAlpha=life*.5;c.strokeStyle='#a594aa';c.lineWidth=.8;c.beginPath();c.moveTo(x+(i-3)*7,y-25+p*16);c.quadraticCurveTo(x+(i-3)*10,y,x+(i-3)*6,y+24+p*10);c.stroke();}debris(c,p,'#9c8d9e',10,27);
    }
    c.restore();
  }
  function texture(kind,critical,frame){
    frame=Math.max(0,Math.min(FRAME_COUNT-1,Math.floor(Number(frame)||0)));
    kind=style(kind);critical=['impact','physical'].includes(kind)&&!!critical;const key=kind+':'+Number(critical)+':'+frame;
    if(textureCache.has(key))return textureCache.get(key);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const c=canvas.getContext('2d');c.scale(2,2);paintEffect(c,kind,(frame+.5)/FRAME_COUNT,critical);if(textureCache.size>=192)textureCache.delete(textureCache.keys().next().value);textureCache.set(key,canvas);return canvas;
  }
  class BattleEffects{
    constructor(){this.items=[];this.hits=[];this.motions=[];this.shakeUntil=0;this.shakeStart=0;this.shakePower=0;this.shakeDuration=310;this.preparedAt=-1;this.poses=new Map();this.red=new Map();this.warmJobs=[];this.warmCursor=0;}
    prepare(kinds){const types=[...new Set([...kinds.map(style),'impact'])];this.warmJobs=[];this.warmCursor=0;for(let frame=0;frame<FRAME_COUNT;frame++){for(const kind of types)this.warmJobs.push([kind,false,frame]);this.warmJobs.push(['impact',true,frame]);}}
    prewarm(budget=2){for(let n=0;n<budget&&this.warmCursor<this.warmJobs.length;n++){texture(...this.warmJobs[this.warmCursor++]);}}
    addEffect(id,kind,now,duration,critical=false){kind=style(kind);const prior=this.items.find(e=>e.id===id&&e.kind===kind);if(prior){prior.born=now;prior.duration=duration;prior.critical=prior.critical||critical;}else this.items.push({id,kind,born:now,duration,critical});}
    addMotion(motion){const prior=this.motions.find(m=>m.id===motion.id&&m.role===motion.role);if(prior)Object.assign(prior,motion,{critical:prior.critical||motion.critical});else this.motions.push(motion);}
    action(event,skill,now){
      const kind=kindOf(skill);if(!event.periodic)this.addMotion({id:event.actor,born:now,role:'cast',physical:skill.kind==='physical'});
      for(const r of event.results){if(event.periodic&&!r.healing)continue;
        if(!r.miss)this.addEffect(r.target,kind,now,kind==='physical'?330:kind==='thunder'?650:850,r.critical);
        if(!r.healing&&!r.buff&&!r.miss&&r.actual>0){const hit=this.hits.find(f=>f.id===r.target);if(hit){hit.born=now;hit.critical=hit.critical||r.critical;}else this.hits.push({id:r.target,born:now,critical:r.critical});this.addMotion({id:r.target,born:now,role:'hit',critical:r.critical});if(kind!=='thunder')this.addEffect(r.target,'impact',now,190,r.critical);if(now>=this.shakeUntil){this.shakePower=1.3;this.shakeDuration=85;this.shakeStart=now;this.shakeUntil=now+85;}}
        if(r.critical&&!r.miss){this.shakeStart=now;this.shakePower=4.5;this.shakeDuration=170;this.shakeUntil=now+170;}
      }this.preparedAt=-1;
    }
    beginFrame(now){
      if(this.preparedAt===now)return;this.preparedAt=now;this.items=this.items.filter(e=>now-e.born<e.duration);this.hits=this.hits.filter(e=>now-e.born<300);this.motions=this.motions.filter(e=>now-e.born<320);this.poses.clear();this.red.clear();
      for(const hit of this.hits){const elapsed=Math.max(0,now-hit.born);this.red.set(hit.id,Math.exp(-elapsed/65)*(hit.critical?.34:.23));}
      for(const motion of this.motions){let pose=this.poses.get(motion.id);if(!pose){pose={cast:0,hit:0,hitX:0,angle:0,scale:1};this.poses.set(motion.id,pose);}const t=Math.max(0,Math.min(1,(now-motion.born)/300)),pulse=motion.role==='cast'?Math.sin(Math.PI*t)*(1-t):(1-Math.exp(-t*45))*Math.exp(-t*7);if(motion.role==='cast'){pose.cast=pulse*(motion.physical?22:8);pose.scale+=pulse*.04;}else{pose.hit=pulse*7;pose.hitX=Math.sin(t*24)*pulse*(motion.critical?11:6);pose.angle=Math.sin(t*18)*pulse*.035;pose.scale+=pulse*.02;}}
    }
    offset(now){if(now<this.shakeStart||now>=this.shakeUntil)return{x:0,y:0};const a=this.shakePower*(this.shakeUntil-now)/this.shakeDuration;return{x:Math.sin((now-this.shakeStart)*.14)*a,y:Math.cos((now-this.shakeStart)*.19)*a*.65};}
    pose(id,side,now){this.beginFrame(now);const p=this.poses.get(id);if(!p)return{x:0,y:0,angle:0,scale:1};const dir=side==='ally'?-1:1;return{x:p.hitX,y:dir*(p.cast-p.hit),angle:p.angle,scale:p.scale};}
    redAlpha(id,now){this.beginFrame(now);return this.red.get(id)||0;}
    draw(c,rects,now){this.beginFrame(now);const lookup=rects instanceof Map?rects:new Map(rects.map(r=>[r.id,r]));for(const e of this.items){const r=lookup.get(e.id);if(!r)continue;const p=Math.max(0,Math.min(1,(now-e.born)/e.duration)),frame=Math.min(FRAME_COUNT-1,Math.floor(p*FRAME_COUNT)),scale=Math.max(16,Math.min(52,(r.effectWidth??r.w)*.58))/32;c.drawImage(texture(e.kind,e.critical,frame),r.x+r.w/2-64*scale,(r.effectY??r.y+(r.h-50)*.58)-80*scale,128*scale,160*scale);}}
    cacheInfo(){return{textures:textureCache.size,maximumTextures:192,warmRemaining:this.warmJobs.length-this.warmCursor};}
  }
  const api={BattleEffects,kindOf,COLORS};root.BattleVFX=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
