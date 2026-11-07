(function(root){
  'use strict';
  const COLORS={fire:'#ff9b37',thunder:'#b3a0ff',wood:'#8bd468',water:'#52cafa',earth:'#c9a16d',heal:'#69ee98',buff:'#f4d987',taunt:'#f4bc65',debuff:'#d296f4',physical:'#e0ecf2'};
  const kindOf=skill=>skill.kind==='heal'?'heal':skill.kind==='buff'?(skill.vfx||skill.buff?.visual||(skill.side==='enemy'?'debuff':'buff')):skill.vfx||({stone:'earth',lightning:'thunder'}[skill.element]||skill.element)||'physical';
  const FRAME_COUNT=24,textureCache=new Map(),styles=new Set(['physical','fire','thunder','wood','water','earth','heal','buff','debuff','impact']);
  const style=kind=>kind==='taunt'?'buff':styles.has(kind)?kind:'physical';
  function paintEffect(c,kind,p,critical){const e={kind,critical},x=64,y=80,size=32;c.save();c.globalAlpha=Math.sin(Math.PI*Math.min(.99,p))*.9;c.strokeStyle=COLORS[kind]||COLORS.buff;c.fillStyle=c.strokeStyle;c.lineWidth=2;c.shadowColor=c.strokeStyle;c.shadowBlur=10;
        if(e.kind==='impact'){
          c.globalAlpha=Math.max(0,1-p);c.strokeStyle=e.critical?'#fff4bb':'#fff6e9';c.lineWidth=e.critical?3:2;c.shadowBlur=18;
          for(let i=0;i<10;i++){const a=i*Math.PI/5+p*.2,inner=size*(.08+p*.25),outer=size*(.35+p*.7)*(i%2?1:.65);c.beginPath();c.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);c.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);c.stroke();}
          c.beginPath();c.arc(x,y,size*(.08+p*.7),0,Math.PI*2);c.stroke();
        }else if(e.kind==='fire'){
          for(let i=0;i<7;i++){const dx=(i-3)*size*.2,heat=size*(.55+.3*Math.sin(i*2+p*9)),base=y+size*.55-p*10;c.beginPath();c.moveTo(x+dx-7,base);c.bezierCurveTo(x+dx-size*.16,base-heat*.4,x+dx+12,base-heat*.65,x+dx+Math.sin(p*9+i)*7,base-heat);c.bezierCurveTo(x+dx+19,base-heat*.3,x+dx+10,base,x+dx-7,base);c.fillStyle=i%2?'#ffc967':'#f95c22';c.fill();}
          for(let i=0;i<9;i++){c.fillStyle='#ffdc8a';c.fillRect(x+Math.sin(i*7)*size*.6,y+size*.4-((p+i/9)%1)*size*1.8,2,3);}
        }else if(e.kind==='thunder'){
          c.globalAlpha=(1-p)*(.65+.35*Math.abs(Math.cos(p*28)));const pulse=Math.floor(p*18),points=[];
          for(let i=0;i<9;i++)points.push([x+Math.sin(i*7+pulse*2)*size*(i===0?.13:.36),8+i*14]);
          const bolt=(path,width,color)=>{c.beginPath();c.moveTo(...path[0]);for(const point of path.slice(1))c.lineTo(...point);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
          bolt(points,7,'#6c63df');bolt(points,3.2,'#b7ccff');bolt(points,1.3,'#ffffff');
          for(let i=2;i<8;i+=2){const a=points[i],dir=i%4?-1:1,branch=[a,[a[0]+dir*12,a[1]+6],[a[0]+dir*7,a[1]+15],[a[0]+dir*27,a[1]+23]];bolt(branch,2.2,'#aebcff');bolt(branch,.8,'#f5fbff');}
          for(let i=0;i<5;i++){const dir=i%2?1:-1,yy=y+(i-2)*9,xx=x+Math.sin(i*5+pulse)*12;bolt([[xx,yy],[xx+dir*10,yy-7],[xx+dir*18,yy+2]],1.2,'#eff8ff');}
        }else if(e.kind==='wood'){
          for(let j=0;j<4;j++){c.beginPath();for(let i=0;i<25;i++){const t=i/24,xx=x+(j-1.5)*size*.3+Math.sin(t*8+p*4+j)*size*.25,yy=y+size*.7-t*size*1.6; i?c.lineTo(xx,yy):c.moveTo(xx,yy);if(i%5===0){c.save();c.translate(xx,yy);c.rotate(t*5+j);c.fillStyle='#94d76d';c.fillRect(0,0,8,3);c.restore();}}c.strokeStyle='#77b34f';c.stroke();}
        }else if(e.kind==='water'){
          for(let j=0;j<4;j++){c.beginPath();for(let i=0;i<=24;i++){const xx=x-size+i*size/12,yy=y+(j-1.5)*size*.28+Math.sin(i*.4-p*9+j)*size*.13;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle=j%2?'#a6f0ff':'#3bb7ed';c.lineWidth=3;c.stroke();}for(let i=0;i<7;i++){c.beginPath();c.arc(x+Math.sin(i*3)*size*.7,y+size*.5-((p+i/7)%1)*size*1.3,2+i%3,0,Math.PI*2);c.stroke();}
        }else if(e.kind==='earth'){
          for(let i=0;i<5;i++){const xx=x+Math.sin(i*6)*size*.65,yy=y-size*.7+Math.min(1,p*1.8)*size*1.1+(i%2)*8,a=6+i%3*3;c.beginPath();for(let j=0;j<6;j++){const angle=j*Math.PI/3,px=xx+Math.cos(angle)*a,py=yy+Math.sin(angle)*a;(j?c.lineTo(px,py):c.moveTo(px,py));}c.closePath();c.fillStyle=i%2?'#a37f53':'#dcc299';c.fill();}c.beginPath();c.ellipse(x,y+size*.7,size*(p+.2),size*.2,0,0,Math.PI*2);c.stroke();
        }else if(e.kind==='heal'){
          for(let i=0;i<7;i++){const xx=x+Math.sin(i*9)*size*.65,yy=y+size*.7-((p+i/7)%1)*size*1.8;c.fillStyle=i%2?'#6af28b':'#d1ffd6';c.fillRect(xx-4,yy-1,8,2);c.fillRect(xx-1,yy-4,2,8);}c.beginPath();c.ellipse(x,y+size*.65,size*(.7+p*.3),size*.23,0,0,Math.PI*2);c.strokeStyle='#7bffad';c.stroke();
        }else if(e.kind==='buff'||e.kind==='taunt'){
          c.translate(x,y);c.rotate(Math.sin(p*2)*.07);c.beginPath();c.moveTo(0,-size*.7);c.lineTo(size*.5,-size*.4);c.lineTo(size*.42,size*.25);c.quadraticCurveTo(size*.25,size*.55,0,size*.75);c.quadraticCurveTo(-size*.25,size*.55,-size*.42,size*.25);c.lineTo(-size*.5,-size*.4);c.closePath();c.stroke();c.beginPath();c.arc(0,0,size*(.5+p),0,Math.PI*2);c.globalAlpha*=.5;c.stroke();
        }else if(e.kind==='debuff'){
          for(let j=0;j<3;j++){c.beginPath();c.ellipse(x,y+(j-1)*size*.35,size*.7,size*.18,p*2+j*.4,0,Math.PI*2);c.stroke();}c.beginPath();c.moveTo(x,y-size*.6);c.lineTo(x,y+size*.5);c.moveTo(x-7,y+size*.3);c.lineTo(x,y+size*.5);c.lineTo(x+7,y+size*.3);c.stroke();
        }else{
          c.globalAlpha=Math.max(0,1-p*.9);c.strokeStyle='#f0fbff';c.lineWidth=6*(1-p)+1;c.beginPath();c.moveTo(x-size*.8,y-size*.65);c.quadraticCurveTo(x+size*.12,y-size*.2,x+size*.8,y+size*.65);c.stroke();
          c.strokeStyle='#b5e8ff';c.lineWidth=2;c.beginPath();c.moveTo(x-size*.62,y-size*.72);c.quadraticCurveTo(x-size*.05,y+size*.05,x+size*.58,y+size*.8);c.stroke();
          for(let i=0;i<8;i++){const a=i*2.4,d=size*(.2+p*.8);c.fillStyle=i%2?'#ffdb92':'#f0faff';c.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,2.5,2.5);}
        }
    c.restore();
  }
  function texture(kind,critical,frame){
    frame=Math.max(0,Math.min(FRAME_COUNT-1,Math.floor(Number(frame)||0)));
    kind=style(kind);critical=kind==='impact'&&!!critical;const key=kind+':'+Number(critical)+':'+frame;
    if(textureCache.has(key))return textureCache.get(key);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;paintEffect(canvas.getContext('2d'),kind,(frame+.5)/FRAME_COUNT,critical);textureCache.set(key,canvas);return canvas;
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
        if(!r.healing&&!r.buff&&!r.miss&&r.actual>0){const hit=this.hits.find(f=>f.id===r.target);if(hit){hit.born=now;hit.critical=hit.critical||r.critical;}else this.hits.push({id:r.target,born:now,critical:r.critical});this.addMotion({id:r.target,born:now,role:'hit',critical:r.critical});if(kind!=='thunder')this.addEffect(r.target,'impact',now,190,r.critical);if(now>=this.shakeUntil){this.shakePower=1.7;this.shakeDuration=110;this.shakeStart=now;this.shakeUntil=now+110;}}
        if(r.critical&&!r.miss){this.shakeStart=now;this.shakePower=8;this.shakeDuration=310;this.shakeUntil=now+310;}
      }this.preparedAt=-1;
    }
    beginFrame(now){
      if(this.preparedAt===now)return;this.preparedAt=now;this.items=this.items.filter(e=>now-e.born<e.duration);this.hits=this.hits.filter(e=>now-e.born<300);this.motions=this.motions.filter(e=>now-e.born<320);this.poses.clear();this.red.clear();
      for(const hit of this.hits){const elapsed=Math.max(0,now-hit.born);this.red.set(hit.id,Math.max(0,1-elapsed/300)*(.48+.5*Math.abs(Math.sin(elapsed*.04))));}
      for(const motion of this.motions){let pose=this.poses.get(motion.id);if(!pose){pose={cast:0,hit:0,hitX:0,angle:0,scale:1};this.poses.set(motion.id,pose);}const t=Math.max(0,Math.min(1,(now-motion.born)/300)),pulse=Math.sin(Math.PI*t)*(1-t);if(motion.role==='cast'){pose.cast=pulse*(motion.physical?22:8);pose.scale+=pulse*.09;}else{pose.hit=pulse*7;pose.hitX=Math.sin(t*24)*pulse*(motion.critical?11:6);pose.angle=Math.sin(t*18)*pulse*.08;pose.scale+=pulse*.06;}}
    }
    offset(now){if(now<this.shakeStart||now>=this.shakeUntil)return{x:0,y:0};const a=this.shakePower*(this.shakeUntil-now)/this.shakeDuration;return{x:Math.sin((now-this.shakeStart)*.14)*a,y:Math.cos((now-this.shakeStart)*.19)*a*.65};}
    pose(id,side,now){this.beginFrame(now);const p=this.poses.get(id);if(!p)return{x:0,y:0,angle:0,scale:1};const dir=side==='ally'?-1:1;return{x:p.hitX,y:dir*(p.cast-p.hit),angle:p.angle,scale:p.scale};}
    redAlpha(id,now){this.beginFrame(now);return this.red.get(id)||0;}
    draw(c,rects,now){this.beginFrame(now);const lookup=rects instanceof Map?rects:new Map(rects.map(r=>[r.id,r]));for(const e of this.items){const r=lookup.get(e.id);if(!r)continue;const p=Math.max(0,Math.min(1,(now-e.born)/e.duration)),frame=Math.min(FRAME_COUNT-1,Math.floor(p*FRAME_COUNT)),scale=Math.max(20,Math.min(64,r.w*.65))/32;c.drawImage(texture(e.kind,e.critical,frame),r.x+r.w/2-64*scale,(r.effectY??r.y+(r.h-50)*.58)-80*scale,128*scale,160*scale);}}
    cacheInfo(){return{textures:textureCache.size,maximumTextures:(styles.size+1)*FRAME_COUNT,warmRemaining:this.warmJobs.length-this.warmCursor};}
  }
  const api={BattleEffects,kindOf,COLORS};root.BattleVFX=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
