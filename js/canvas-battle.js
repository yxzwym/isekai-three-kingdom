(function (root) {
  'use strict';
  const font = '-apple-system,"PingFang SC","Microsoft Yahei",sans-serif';
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const clock = time => `${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
  const Presentation=typeof module!=='undefined'&&module.exports?require('./presentation.js'):root.BattlePresentation;
  const number=Presentation.formatNumber;
  function fitImage(sourceWidth,sourceHeight,box) {
    const scale=Math.min(box.w/sourceWidth,box.h/sourceHeight);
    return {x:box.x+(box.w-sourceWidth*scale)/2,y:box.y+box.h-sourceHeight*scale,w:sourceWidth*scale,h:sourceHeight*scale};
  }
  function modalLayout(width,height,desiredHeight) {
    const w=Math.max(1,Math.min(width-24,460)),h=Math.max(1,Math.min(height-24,desiredHeight));
    return {x:(width-w)/2,y:(height-h)/2,w,h};
  }
  function layout(width,height,allies,enemies) {
    const rects=[];
    for (const [side,count] of [['enemy',enemies],['ally',allies]]) {
      if (!count) continue;
      const rows=Math.ceil(count/5),cols=Math.ceil(count/rows),gap=3;
      const groupWidth=Math.min(width-12,cols*128),cw=(groupWidth-gap*(cols-1))/cols;
      const ch=Math.min((height*.33-gap*(rows-1))/rows,cw*440/256+54);
      const groupHeight=rows*ch+gap*(rows-1);
      const start=side==='enemy'?(height<450?73:88):height-14-groupHeight;
      for(let i=0;i<count;i++) rects.push({side,index:i,x:(width-groupWidth)/2+(i%cols)*(cw+gap),y:start+Math.floor(i/cols)*(ch+gap),w:cw,h:ch});
    }
    return rects;
  }
  class CanvasBattle {
    constructor(canvas,scenario,options={}) {
      if (!canvas?.getContext) throw new TypeError('需要传入 canvas 元素');
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.visuals=new Map();this.textTextures=new Map();this.spriteBuilds=0;this.dpr=1;this.background=null;this.ariaLabel='';this.metrics=options.profile?new Presentation.FrameStats():null;this.images=new Map();this.imageIds=new WeakMap();this.imageSerial=0;this.sprites=new Map();this.hits=[];this.floats=[];this.vfx=new root.BattleVFX.BattleEffects();this.aim=null;this.panel=null;this.focus=-1;this.disposed=false;
      this.click=this.click.bind(this);this.key=this.key.bind(this);this.resize=this.resize.bind(this);this.frame=this.frame.bind(this);
      this.down=this.down.bind(this);this.up=this.up.bind(this);this.move=this.move.bind(this);this.cancel=this.cancel.bind(this);this.context=e=>e.preventDefault();this.wheel=e=>{if(this.panel?.type==='tactics'){e.preventDefault();this.panel.scroll=clamp(this.panel.scroll+e.deltaY,0,this.panel.maxScroll||0);}};
      canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointercancel',this.cancel);canvas.addEventListener('contextmenu',this.context);canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.addEventListener('keydown',this.key);
      this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);
      this.load(scenario);this.resize();this.lastTime=performance.now();this.raf=requestAnimationFrame(this.frame);
    }
    load(scenario) {
      this.battle=new root.BattleEngine.Battle(scenario);this.scenario=scenario;this.seen=0;this.ended=false;this.panel=null;this.floats=[];this.aim=null;this.activeManual=null;this.health=new Map(this.battle.units.map(u=>[u.id,new Presentation.HealthTrack(u.soldiers,u.maxSoldiers)]));this.vfx=new root.BattleVFX.BattleEffects();
      const urls=[scenario.scene?.background,...this.battle.units.map(u=>u.portrait?.src)].filter(Boolean);
      urls.forEach(src=>this.image(src));this.visuals.clear();this.vfx.prepare(this.battle.units.flatMap(u=>u.skills.map(id=>root.BattleVFX.kindOf(this.battle.skills[id]))));this.updateLayout();this.buildBackground();this.preparePortraits();this.battle.start();return this;
    }
    image(src) {
      if(!src) return null;
      if(!this.images.has(src)){const img=new Image();this.imageIds.set(img,++this.imageSerial);img.onload=()=>{if(!this.disposed){this.buildBackground();this.preparePortraits();}};img.src=root.BattleEmbeddedAssets?.[src]||src;this.images.set(src,img);}
      const img=this.images.get(src);return img.complete&&img.naturalWidth?img:null;
    }
    sprite(img,source,width,red=false){
      const w=Math.max(1,Math.min(source.width,Math.ceil(width))),h=Math.max(1,Math.ceil(w*source.height/source.width)),key=[this.imageIds.get(img),source.x,source.y,source.width,source.height,w,red?1:0].join(':');
      if(this.sprites.has(key))return this.sprites.get(key);
      const sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;const c=sprite.getContext('2d');
      if(red){c.drawImage(this.sprite(img,source,w),0,0);c.globalCompositeOperation='source-atop';c.fillStyle='#ff2520';c.fillRect(0,0,w,h);}
      else{c.drawImage(img,source.x,source.y,source.width,source.height,0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0000');g.addColorStop(.08,'#000');g.addColorStop(.88,'#000');g.addColorStop(1,'#0000');c.globalCompositeOperation='destination-in';c.fillStyle=g;c.fillRect(0,0,w,h);}
      this.spriteBuilds++;this.sprites.set(key,sprite);return sprite;
    }
    updateLayout(){
      if(!this.w||!this.battle)return;this.allies=this.battle.units.filter(u=>u.side==='ally');this.enemies=this.battle.units.filter(u=>u.side==='enemy');
      this.rects=layout(this.w,this.h,this.allies.length,this.enemies.length);for(const r of this.rects){r.unit=(r.side==='ally'?this.allies:this.enemies)[r.index];r.id=r.unit.id;}this.rectMap=new Map(this.rects.map(r=>[r.id,r]));this.allyTop=Math.min(...this.rects.filter(r=>r.side==='ally').map(r=>r.y));
    }
    preparePortraits(){
      if(!this.rects)return;
      for(const r of this.rects){const u=r.unit,img=this.image(u.portrait?.src);if(!img)continue;const source=u.portrait?.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight},dst=fitImage(source.width,source.height,{x:r.x,y:r.y,w:r.w,h:Math.max(0,r.h-50)}),width=Math.max(1,Math.ceil(dst.w*Math.max(2,this.dpr)));
        this.visuals.set(u.id,{sprite:this.sprite(img,source,width),red:this.sprite(img,source,width,true),dst});
      }
    }
    buildBackground(){
      if(!this.w)return;const w=this.w,h=this.h,bg=this.image(this.scenario.scene?.background),canvas=document.createElement('canvas');canvas.width=this.canvas.width;canvas.height=this.canvas.height;const c=canvas.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);
      c.fillStyle=this.scenario.scene?.color||'#10272d';c.fillRect(0,0,w,h);
      if(bg){const scale=Math.max(w/bg.naturalWidth,h/bg.naturalHeight);c.drawImage(bg,(w-bg.naturalWidth*scale)/2,(h-bg.naturalHeight*scale)/2,bg.naturalWidth*scale,bg.naturalHeight*scale);}
      else{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#04131d');g.addColorStop(.55,this.scenario.scene?.color||'#253b3c');g.addColorStop(1,'#09191d');c.fillStyle=g;c.fillRect(0,0,w,h);}
      const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#00101b66');shade.addColorStop(.5,'#00101b00');shade.addColorStop(1,'#00101b66');c.fillStyle=shade;c.fillRect(0,0,w,h);this.background=canvas;
    }
    resize(){
      const r=this.canvas.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.dpr=Math.min(this.options.maxDpr||2,window.devicePixelRatio||1);
      this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.sprites.clear();this.visuals.clear();this.textTextures.clear();this.updateLayout();this.buildBackground();this.preparePortraits();this.draw();
    }
    frame(now) {
      if(this.disposed) return;
      const delta=Math.max(0,(now-this.lastTime)/1000);this.lastTime=now;
      const started=this.metrics?performance.now():0;this.battle.advance(delta);
      this.processEvents(now);this.vfx.prewarm(2);const updated=this.metrics?performance.now():0;this.draw(now);if(this.metrics){const ended=performance.now(),report=this.metrics.add(ended-started,updated-started,ended-updated,delta*1000,now);if(report)this.canvas.dataset.frameStats=JSON.stringify({...report,actions:this.battle.actionCount,vfx:this.vfx.items.length,spritesBuilt:this.spriteBuilds,fxTextures:this.vfx.cacheInfo().textures});}this.raf=requestAnimationFrame(this.frame);
    }
    processEvents(now){
      const b=this.battle,events=b.events,totals=new Map(),health=new Map();
      for(let i=this.seen;i<events.length;i++){const e=events[i];if(e.type!=='action')continue;const skill=b.skills[e.skill];this.vfx.action(e,skill,now);
        this.floats.push({id:e.actor,text:e.skillName,color:root.BattleVFX.COLORS[root.BattleVFX.kindOf(skill)]||'#ead8a5',born:now,type:'skill'});
        for(const r of e.results){if(r.buff)continue;if(!r.miss)health.set(r.target,r.after);const key=r.target+':'+(r.miss||Number(!!r.healing)),old=totals.get(key);if(old){old.actual+=r.actual;old.critical=old.critical||r.critical;}else totals.set(key,{...r});}
        this.options.onAction?.(e,this);if(this.battle!==b)return;
      }this.seen=events.length;
      for(const [id,value]of health)this.health.get(id)?.set(value,now);
      for(const r of totals.values())this.floats.push({id:r.target,text:r.miss||`${r.healing?'+':'−'}${number(r.actual)}${r.critical?'!':''}`,color:r.healing?'#8ceba5':r.miss?'#d5dbcb':'#ff5b51',born:now,critical:r.critical});
      if(!this.ended&&b.status!=='running'){this.ended=true;this.panel={type:'result'};const result=b.export();this.canvas.dispatchEvent(new CustomEvent('battlecomplete',{detail:result}));this.options.onComplete?.(result,this);}
      this.floats=this.floats.filter(f=>now-f.born<1100);const limit=Math.max(48,b.units.length*6);if(this.floats.length>limit)this.floats.splice(0,this.floats.length-limit);
    }
    text(text,x,y,size=14,color='#dce6e5',align='center'){
      size=Math.round(size*10)/10;text=String(text);const key=size+'|'+color+'|'+text;let image=this.textTextures.get(key);
      if(!image){const canvas=document.createElement('canvas'),c=canvas.getContext('2d');c.font=`${size}px ${font}`;const w=Math.ceil(c.measureText(text).width+10),h=Math.ceil(size*1.8+6);canvas.width=Math.ceil(w*this.dpr);canvas.height=Math.ceil(h*this.dpr);c.setTransform(this.dpr,0,0,this.dpr,0,0);c.font=`${size}px ${font}`;c.textAlign='left';c.textBaseline='middle';c.fillStyle=color;c.shadowColor='#000';c.shadowBlur=3*this.dpr;c.fillText(text,5,h/2);image={canvas,w,h};if(this.textTextures.size>=384)this.textTextures.delete(this.textTextures.keys().next().value);this.textTextures.set(key,image);}
      const left=align==='left'?x-5:align==='right'?x-image.w+5:x-image.w/2;this.ctx.drawImage(image.canvas,Math.round(left*this.dpr)/this.dpr,Math.round((y-image.h/2)*this.dpr)/this.dpr,image.w,image.h);
    }
    box(x,y,w,h,fill='#0b222cf2',stroke='#507984',radius=3) {
      const c=this.ctx;c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),radius);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
    }
    button(label,x,y,w,h,action,active=false,disabled=false) {
      this.box(x,y,w,h,active?'#34565d':'#102b35',active?'#b1d7d8':'#486c77');this.text(label,x+w/2,y+h/2,Math.min(14,w/4),disabled?'#58747a':active?'#f1e2b3':'#c6e2e4');
      if(!disabled)this.hits.push({x,y,w,h,action,label});
    }
    draw(now=performance.now()) {
      if(!this.battle||!this.w)return;
      const c=this.ctx,w=this.w,h=this.h;c.save();c.clearRect(0,0,w,h);c.fillStyle=this.scenario.scene?.color||'#10272d';c.fillRect(0,0,w,h);this.vfx.beginFrame(now);const shake=this.vfx.offset(now);c.translate(shake.x,shake.y);if(this.background)c.drawImage(this.background,0,0,w,h);
      this.hits=[];this.text(this.scenario.title||'战斗',w/2,29,20);this.text(clock(this.battle.time),w/2,56,18);
      if(this.scenario.allowRetreat&&this.battle.status==='running')this.button('撤退',w-63,12,53,30,()=>this.battle.retreat());
      for(const r of this.rects)this.drawUnit(r.unit,r,now);
      this.drawTargeting(now);this.vfx.draw(c,this.rectMap,now);this.drawReadySkills(now);
      for(const f of this.floats){const r=this.rectMap.get(f.id);if(!r)continue;const progress=(now-f.born)/1100,pop=f.type==='skill'?1:1+.25*Math.sin(Math.PI*Math.min(1,progress*5));c.save();c.globalAlpha=1-progress;const x=r.x+r.w/2,y=r.y+(f.type==='skill'?-5:28)-progress*32;c.translate(x,y);c.scale(pop,pop);this.text(f.text,0,0,Math.min(f.type==='skill'?14:f.critical?25:22,r.w*(f.type==='skill'?.2:.33)),f.critical?'#ffe4ad':f.color);c.restore();}
      if(this.panel)this.drawPanel();
      if(this.notice?.until>now){this.box(12,h-55,w-24,36,'#112d36f5','#728d8d');this.text(this.notice.text,w/2,h-37,12,'#e8d7aa');}
      if(this.focus>=0&&this.hits.length){this.focus%=this.hits.length;const hit=this.hits[this.focus];c.strokeStyle='#f1d697';c.lineWidth=2;c.strokeRect(hit.x-2,hit.y-2,hit.w+4,hit.h+4);}
      c.restore();
      const label=`${this.scenario.title||'战斗'} ${clock(this.battle.time)}，${this.battle.status==='running'?'交战中':this.battle.status}。按Tab选择武将，回车操作。`;if(label!==this.ariaLabel){this.ariaLabel=label;this.canvas.setAttribute('aria-label',label);}
    }
    drawUnit(u,r,now) {
      const c=this.ctx;const footer=50,portraitBox={x:r.x,y:r.y,w:r.w,h:Math.max(0,r.h-footer)};
      c.save();if(u.soldiers<=0)c.globalAlpha=.3;
      const visual=this.visuals.get(u.id);
      if(visual){const dst=visual.dst,pose=this.vfx.pose(u.id,u.side,now),idle=Presentation.idlePose(u,now);c.save();c.translate(dst.x+dst.w/2+pose.x+idle.x,dst.y+dst.h/2+pose.y+idle.y);c.rotate(pose.angle+idle.angle);c.scale(pose.scale*idle.scale,pose.scale*idle.scale);c.drawImage(visual.sprite,-dst.w/2,-dst.h/2,dst.w,dst.h);const red=this.vfx.redAlpha(u.id,now);if(red>0){c.globalAlpha*=red;c.drawImage(visual.red,-dst.w/2,-dst.h/2,dst.w,dst.h);}c.restore();}
      else {this.text(u.name?.slice(0,1)||'将',r.x+r.w/2,r.y+portraitBox.h*.6,Math.min(40,r.w*.6),'#9aafb0');}
      let y=r.y+r.h-footer;
      const enemy=u.side==='enemy';
      if(enemy){this.text(u.name,r.x+r.w/2,y+10,Math.min(13,r.w/3.5),'#75dbe7');y+=21;}
      const hpHeight=enemy?17:22;
      this.box(r.x,y,r.w,hpHeight,'#10171d',u.side==='ally'&&u.mode==='manual'?'#f4f7f8':'#75a8b5',4);
      const g=c.createLinearGradient(0,y,0,y+hpHeight);g.addColorStop(0,'#f33b33');g.addColorStop(.55,'#ad0009');g.addColorStop(1,'#e5221c');
      const health=this.health.get(u.id)?.sample(now)||{value:u.soldiers,trail:u.soldiers};
      c.fillStyle=health.healing?'#bdfbd5':'#f3f1e4';c.fillRect(r.x+2,y+2,(r.w-4)*clamp(health.trail/u.maxSoldiers,0,1),hpHeight-4);
      c.fillStyle=g;c.fillRect(r.x+2,y+2,(r.w-4)*clamp(health.value/u.maxSoldiers,0,1),hpHeight-4);
      if(health.healing){c.fillStyle='#94f3ad';c.fillRect(r.x+2+(r.w-4)*clamp(health.value/u.maxSoldiers,0,1)-2,y+2,2,hpHeight-4);}
      this.text(number(u.soldiers),r.x+4,y+hpHeight/2,Math.min(enemy?12:15,r.w/4),'#fff0ec','left');
      y+=hpHeight+3;this.box(r.x+1,y,r.w-2,5,'#07141c','#527d89',1);c.fillStyle='#23c8d0';c.fillRect(r.x+2,y+1,(r.w-4)*clamp(u.progress,0,1),3);
      if(!enemy){y+=9;this.box(r.x,y,r.w,23,'#091e29',u.mode==='manual'?'#f4f7f8':'#75a8b5',3);this.text(u.name,r.x+r.w/2,y+11.5,Math.min(14,r.w/4),u.mode==='manual'?'#ffffff':'#75dbe7');}
      if(u.mode==='manual'){this.text('手',r.x+r.w-7,r.y+portraitBox.h-5,10,'#edd38b');}
      if(u.side==='ally'&&u.mode==='manual'&&u.soldiers>0){c.save();c.strokeStyle='#f5ffff';c.shadowColor='#a6d9ed';c.shadowBlur=5;c.lineWidth=1.5;c.globalAlpha=.8+.15*Math.sin(now*.004);const left=r.x+2,top=r.y+5,bottom=r.y+portraitBox.h-2,right=r.x+r.w-2,len=10;c.beginPath();for(const [x,y,dx,dy]of[[left,top,1,1],[right,top,-1,1],[left,bottom,1,-1],[right,bottom,-1,-1]]){c.moveTo(x+dx*len,y);c.lineTo(x,y);c.lineTo(x,y+dy*len);}c.stroke();c.restore();}
      c.restore();
      if(this.aim)this.hits.push({...r,kind:'unit',unitId:u.id,label:u.name,action:()=>this.selectUnit(u)});
      else if(u.side==='ally')this.hits.push({...r,kind:'unit',unitId:u.id,label:u.name,action:()=>this.toggleMode(u)});
      if(u.side==='ally')this.hits.push({x:r.x,y:y,w:r.w,h:23,kind:'unit',unitId:u.id,label:u.name,action:()=>this.toggleMode(u)});
    }
    toggleMode(u) {
      if(u.soldiers<=0||this.battle.status!=='running')return;
      this.battle.setMode(u.id,u.mode==='auto'?'manual':'auto');
      if(this.aim?.actor===u.id)this.aim=null;
      if(this.activeManual===u.id&&u.mode==='auto')this.activeManual=null;
    }
    selectUnit(u) {
      if(!this.aim)return;const a=this.aim;if(u.side!==a.side||u.soldiers<=0)return;
      const result=this.battle.manual(a.actor,a.skill,u.id);if(result.ok){this.aim=null;this.activeManual=null;}else this.notify(result.reason);
    }
    chooseSkill(u,id) {
      if(!u.ready||u.mode!=='manual')return;
      const skill=this.battle.skills[id];
      if(this.aim?.actor===u.id&&this.aim.skill===id){this.aim=null;return;}
      if(skill.side==='self'||skill.scope==='all'){
        const result=this.battle.manual(u.id,id,skill.side==='self'?u.id:undefined);if(!result.ok)this.notify(result.reason);else this.activeManual=null;this.aim=null;
      }else this.aim={actor:u.id,skill:id,side:skill.side==='enemy'?'enemy':'ally'};
    }
    skillRole(skill) {
      if(skill.functionLabel)return skill.functionLabel;
      const all=skill.scope==='all';
      if(skill.kind==='heal')return all?'群体治疗':'单体治疗';
      if(skill.kind==='buff')return skill.buff?.taunt?'嘲讽':skill.side==='enemy'?(all?'群体削弱':'单体削弱'):skill.side==='self'?'自身增益':all?'群体增益':'单体增益';
      return all?'群体伤害':'单体伤害';
    }
    drawSkillIcon(skill,x,y,size,color) {
      const c=this.ctx,kind=root.BattleVFX.kindOf(skill),cx=x+size/2,cy=y+size/2,k=size*.28;
      c.save();c.translate(cx,cy);c.fillStyle=color;c.strokeStyle=color;c.lineWidth=2;c.shadowColor=color;c.shadowBlur=7;
      if(kind==='fire'){c.beginPath();c.moveTo(0,-k*1.2);c.bezierCurveTo(k*.2,-k*.3,k*1.3,k*.4,k*.6,k);c.bezierCurveTo(-k*.2,k*1.6,-k*1.2,k*.6,-k*.65,0);c.bezierCurveTo(-k*.55,k*.3,-k*.2,k*.2,0,-k*1.2);c.fill();}
      else if(kind==='thunder'){c.beginPath();c.moveTo(k*.3,-k*1.2);c.lineTo(-k*.7,k*.15);c.lineTo(-k*.05,k*.15);c.lineTo(-k*.3,k*1.3);c.lineTo(k*.8,-k*.2);c.lineTo(k*.1,-k*.2);c.closePath();c.fill();}
      else if(kind==='wood'){c.beginPath();c.moveTo(-k*.7,k*.8);c.bezierCurveTo(-k*1.1,-k*.5,0,-k, k*.8,-k);c.bezierCurveTo(k*.9,0,k*.4,k,-k*.7,k*.8);c.stroke();c.beginPath();c.moveTo(-k,k*1.1);c.lineTo(k*.5,-k*.65);c.stroke();}
      else if(kind==='water'){c.beginPath();c.moveTo(0,-k*1.2);c.bezierCurveTo(k*.3,-k*.5,k*1.2,k*.4,k*.6,k);c.bezierCurveTo(0,k*1.4,-k,k*.8,-k*.65,k*.1);c.closePath();c.fill();}
      else if(kind==='earth'){for(const [dx,dy,a] of[[-.5,.4,.7],[.55,.55,.55],[.15,-.6,.6]]){c.beginPath();c.moveTo((dx-a)*k,(dy+.4)*k);c.lineTo((dx-a*.8)*k,(dy-.4)*k);c.lineTo((dx+a*.25)*k,(dy-.7)*k);c.lineTo((dx+a)*k,(dy+.15)*k);c.lineTo((dx+a*.4)*k,(dy+.6)*k);c.closePath();c.stroke();}}
      else if(kind==='heal'){c.fillRect(-k*.3,-k,k*.6,k*2);c.fillRect(-k,-k*.3,k*2,k*.6);}
      else if(kind==='buff'||kind==='debuff'){c.beginPath();c.moveTo(0,-k*1.1);c.lineTo(k*.8,-k*.6);c.lineTo(k*.65,k*.45);c.lineTo(0,k*1.15);c.lineTo(-k*.65,k*.45);c.lineTo(-k*.8,-k*.6);c.closePath();c.stroke();c.beginPath();c.moveTo(0,kind==='debuff'?-k*.5:k*.6);c.lineTo(0,kind==='debuff'?k*.5:-k*.6);c.moveTo(-k*.3,0);c.lineTo(0,kind==='debuff'?k*.5:-k*.6);c.lineTo(k*.3,0);c.stroke();}
      else{c.save();c.rotate(.6);c.beginPath();c.moveTo(0,-k*1.2);c.lineTo(k*.2,-k*.65);c.lineTo(k*.15,k*.55);c.lineTo(-k*.15,k*.55);c.lineTo(-k*.2,-k*.65);c.closePath();c.fill();c.fillRect(-k*.55,k*.45,k*1.1,k*.15);c.fillRect(-k*.12,k*.6,k*.24,k*.5);c.restore();}
      c.restore();
    }
    drawReadySkills(now) {
      if(this.battle.status!=='running')return;
      const ready=this.battle.units.filter(u=>u.side==='ally'&&u.soldiers>0&&u.mode==='manual'&&u.ready).sort((a,b)=>(a.readyTick??Infinity)-(b.readyTick??Infinity)||a.order-b.order);
      if(!ready.some(u=>u.id===this.activeManual))this.activeManual=ready[0]?.id||null;
      const u=this.battle.unit(this.activeManual);if(!u)return;
      const top=this.allyTop;
      const ids=u.skills,gap=8,cw=Math.min(88,(this.w-24-gap*(ids.length-1))/ids.length),total=ids.length*cw+(ids.length-1)*gap,x=(this.w-total)/2,y=top-100,icon=48;
      this.text(u.name,this.w/2,y-15,13,'#fff');
      ids.forEach((id,i)=>{
        const skill=this.battle.skills[id],kind=root.BattleVFX.kindOf(skill),color=skill.kind==='heal'?'#82e4a5':skill.kind==='buff'?(skill.side==='enemy'?'#c6a2ec':'#e5cb83'):'#edaa91';
        const left=x+i*(cw+gap),ix=left+(cw-icon)/2,chosen=this.aim?.actor===u.id&&this.aim.skill===id,disabled=this.battle.availableSp(u)<skill.cost,c=this.ctx;
        c.save();if(disabled)c.globalAlpha=.35;this.box(ix,y,icon,icon,chosen?'#284552':'#0a222ded',chosen?'#fff':'#cadadd',4);
        this.drawSkillIcon(skill,ix,y,icon,root.BattleVFX.COLORS[kind]||'#dfcf92');this.text(skill.name,left+cw/2,y+61,13,'#f0f4f5');this.text(this.skillRole(skill),left+cw/2,y+80,11,color);c.restore();
        if(!disabled)this.hits.push({x:left,y,w:cw,h:91,label:`${skill.name}，${this.skillRole(skill)}`,action:()=>this.chooseSkill(u,id)});
      });
    }
    drawTargeting(now) {
      if(!this.aim)return;const actor=this.battle.unit(this.aim.actor);if(!actor||actor.soldiers<=0||!actor.ready||actor.mode!=='manual'){this.aim=null;return;}
      const skill=this.battle.skills[this.aim.skill],color=skill.kind==='heal'?'#82ffac':skill.kind==='buff'?(skill.side==='enemy'?'#d3a0ff':'#f4db87'):'#ffcc76',c=this.ctx;
      for(const u of this.battle.living(this.aim.side)){const r=this.rectMap.get(u.id);c.save();c.strokeStyle=color;c.shadowColor=color;c.shadowBlur=10;c.lineWidth=1.5+Math.sin(now*.008)*.5;c.globalAlpha=.75+.2*Math.sin(now*.008);const len=Math.min(14,r.w*.25),x=r.x-1,y=r.y+4,w=r.w+2,h=r.h-4;c.beginPath();for(const [xx,yy,sx,sy]of[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){c.moveTo(xx+sx*len,yy);c.lineTo(xx,yy);c.lineTo(xx,yy+sy*len);}c.stroke();c.beginPath();c.ellipse(r.x+r.w/2,r.y+r.h-53,r.w*.46,7,0,now*.002,now*.002+Math.PI*1.6);c.stroke();c.restore();}
    }
    panelFrame(title,height) {
      const frame=modalLayout(this.w,this.h,height),{x,y,w,h}=frame;cOverlay(this.ctx,this.w,this.h);this.box(x,y,w,h,'#081e29fa','#52727c',7);this.hits=[];
      this.text(title,x+18,y+25,17,'#e0eaea','left');this.button('×',x+w-46,y+8,35,34,()=>{this.panel=null;});return frame;
    }
    drawPanel() {
      if(this.panel.type==='tactics')return this.drawTactics();
      if(this.battle.status==='running'){this.panel=null;return;}
      if(this.panel.type==='log')return this.drawLog();
      if(this.panel.type==='rules')return this.drawRules();
      this.drawResult();
    }
    drawResult() {
      const b=this.battle,{x,y:top,w}=this.panelFrame({victory:'战斗胜利',defeat:'战斗失利',draw:'两军俱溃',retreated:'已撤退'}[b.status]||'战斗结束',285);let y=top+65;
      this.text(`${clock(b.time)}  ·  剩余兵力 ${number(b.total('ally'))}`,x+w/2,y,15);y+=43;
      this.button('战报',x+14,y,(w-35)/2,39,()=>{this.panel={type:'log',page:0};});this.button('再战',x+21+(w-35)/2,y,(w-35)/2,39,()=>this.restart());y+=52;
      const mvp=[...b.units.filter(u=>u.side==='ally')].sort((a,b)=>b.stats.damage-a.stats.damage)[0];
      if(mvp)this.text(`${mvp.name}  ·  造成伤害 ${number(mvp.stats.damage)}`,x+w/2,y,13,'#a2bfc0');
    }
    drawLog() {
      const p=this.panel,events=this.battle.events.filter(e=>e.type==='action').slice().reverse(),{x,y:top,w,h}=this.panelFrame('战报',this.h*.75),perPage=Math.max(1,Math.floor((h-110)/56));
      let y=top+55;const rows=events.slice(p.page*perPage,(p.page+1)*perPage);
      rows.forEach(e=>{this.button(`${clock(e.time)} ${e.actorName} · ${e.skillName}`,x+12,y,w-24,27,()=>{this.panel={type:'rules',event:e,page:p.page};});this.text(e.results.map(r=>`${r.targetName}${r.miss||`${r.healing?'+':'−'}${r.actual}`}`).join('  '),x+16,y+41,10,'#a7bcbb','left');y+=56;});
      this.button('上一页',x+12,top+h-44,84,32,()=>{p.page=Math.max(0,p.page-1);},false,p.page===0);this.button('下一页',x+w-96,top+h-44,84,32,()=>{p.page++;},false,(p.page+1)*perPage>=events.length);
    }
    drawRules() {
      const e=this.panel.event,{x,y:top,w,h}=this.panelFrame(`${e.actorName} · ${e.skillName}`,this.h*.85);let y=top+57;
      const lines=[`策略 ${e.spBefore} → ${e.spAfter}`,`下次读条 ${e.nextInterval.toFixed(1)}秒`];
      for(const r of e.results){lines.push(`${r.targetName}：${r.before} → ${r.after}`);for(const [key,value] of r.factors)lines.push(`${key}：${Number(value.toFixed(4))}`);lines.push(`计算 ${r.raw.toFixed(2)}，实际 ${r.actual}`);}
      const page=this.panel.offset||0,capacity=Math.max(1,Math.floor((top+h-y-55)/21));
      lines.slice(page*capacity,(page+1)*capacity).forEach(line=>{this.text(line,x+16,y,12,'#b5cdcf','left');y+=21;});
      this.button('返回',x+12,top+h-44,76,32,()=>{this.panel={type:'log',page:this.panel.page||0};});this.button('下一页',x+w-96,top+h-44,84,32,()=>{this.panel.offset=(page+1)*capacity>=lines.length?0:page+1;});
    }
    point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*this.w/r.width,y:(e.clientY-r.top)*this.h/r.height};}
    down(e){
      if(e.button!==0)return;const point=this.point(e),hit=[...this.hits].reverse().find(r=>point.x>=r.x&&point.x<=r.x+r.w&&point.y>=r.y&&point.y<=r.y+r.h);
      this.press={...point,hit,pointer:e.pointerId,long:false,moved:false,scroll:this.panel?.scroll||0};this.canvas.setPointerCapture?.(e.pointerId);
      const unit=hit?.unitId?this.battle.unit(hit.unitId):null;
      if(unit?.side==='ally'&&unit.soldiers>0&&!this.panel)this.pressTimer=setTimeout(()=>{if(!this.press||this.press.moved)return;this.press.long=true;this.openTactics(unit);},1000);
    }
    move(e){
      if(!this.press)return;const p=this.point(e),dx=p.x-this.press.x,dy=p.y-this.press.y;
      if(!this.press.axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)this.press.axis=this.press.hit?.kind==='slider'&&Math.abs(dx)>Math.abs(dy)?'slider':'scroll';
      if(this.press.axis==='slider'){clearTimeout(this.pressTimer);this.press.moved=true;this.press.hit.change(p.x);}
      else if(this.press.axis==='scroll'){clearTimeout(this.pressTimer);this.press.moved=true;if(this.panel?.type==='tactics')this.panel.scroll=clamp(this.press.scroll-dy,0,this.panel.maxScroll||0);}
    }
    up(e){if(!this.press)return;const press=this.press,p=this.point(e);this.cancel();if(press.hit?.kind==='slider'&&press.axis!=='scroll')press.hit.change(p.x);else if(!press.long&&!press.moved&&press.hit){press.hit.action();this.focus=-1;}}
    cancel(){clearTimeout(this.pressTimer);this.press=null;}
    openTactics(u){
      if(!u||u.side!=='ally'||u.soldiers<=0||this.battle.status!=='running')return;
      const rules=u.skills.map(id=>JSON.parse(JSON.stringify(u.priorities.find(r=>r.skill===id)||{skill:id,when:'always',threshold:0,disabled:true})));
      for(const r of rules){const skill=this.battle.skills[r.skill];
        if(skill.kind==='heal'){
          if(r.when!=='healThresholds'){const t=r.when==='always'?1.01:Number(r.threshold)||0;r.selfThreshold=r.when==='selfBelow'?t:r.when==='allyBelow'||r.when==='always'?t:0;r.allyThreshold=r.when==='selfBelow'?0:t;}
          if(r.disabled){r.selfThreshold=0;r.allyThreshold=0;}r.when='healThresholds';
        }else if(['physical','tactic'].includes(skill.kind)){r.when=skill.scope==='all'?'enemyCount':'always';r.threshold=skill.scope==='all'?Math.max(1,Math.floor(r.threshold)||1):0;}
        else if(skill.kind==='buff')r.displayThreshold=r.disabled?0:r.when==='always'?1.01:Number(r.threshold)||0;
      }
      this.aim=null;this.panel={type:'tactics',id:u.id,rules,targetRule:u.targetRule,scroll:0,maxScroll:0};
    }
    slider(label,x,y,width,value,max,onChange,format){
      const c=this.ctx,trackX=x+8,trackW=width-16,trackY=y+33,ratio=clamp(value/Math.max(1,max),0,1),thumb=trackX+trackW*ratio;
      this.text(label,x,y+8,12,'#a9c4ca','left');this.text(format(value),x+width,y+8,12,'#e4d5a7','right');
      this.box(trackX,trackY-3,trackW,6,'#06131d','#3e6672',3);if(value>0){c.fillStyle='#4abfcd';c.fillRect(trackX,trackY-2,Math.max(0,trackW*ratio),4);}
      for(let i=0;i<=max&&max<=7;i++){c.fillStyle='#6a909a';c.fillRect(trackX+trackW*i/max-1,trackY+7,2,3);}
      c.beginPath();c.arc(thumb,trackY,7,0,Math.PI*2);c.fillStyle='#d4edf1';c.fill();c.strokeStyle='#6ca9b6';c.lineWidth=1;c.stroke();
      const change=px=>onChange(Presentation.sliderValue(px,trackX,trackW,max));
      this.hits.push({x,y:y+17,w:width,h:33,kind:'slider',label:`${label}，${format(value)}`,change,step:direction=>onChange(clamp(value+direction,0,max))});
    }
    drawTactics(){
      const p=this.panel,u=this.battle.unit(p.id);if(!u||this.battle.status!=='running'){this.panel=null;return;}
      const contentHeight=p.rules.reduce((height,r)=>height+(this.battle.skills[r.skill].kind==='heal'?154:102),70);
      const c=this.ctx,{x,y:top,w,h}=this.panelFrame(`${u.name} · 施法设置`,contentHeight+115),pad=17,left=x+pad,bottom=top+h-66;
      const start=top+49,viewHeight=bottom-start;let y=start-p.scroll;
      p.maxScroll=Math.max(0,contentHeight-viewHeight);p.scroll=clamp(p.scroll,0,p.maxScroll);y=start-p.scroll;
      c.save();c.beginPath();c.rect(x,start,w,viewHeight);c.clip();const before=this.hits.length;
      const thresholdLabel=value=>value===0?'从不施放':value===101?'始终':`低于 ${value}%`;
      const percent=(r,key,label,row)=>{const value=clamp(Math.round((Number(r[key])||0)*100),0,101);this.slider(label,left+9,row,w-(pad+9)*2,value,101,value=>{r[key]=value/100;r.disabled=(Number(r.selfThreshold)||0)===0&&(Number(r.allyThreshold)||0)===0;},thresholdLabel);};
      p.rules.forEach(r=>{
        const skill=this.battle.skills[r.skill],heal=skill.kind==='heal',group=skill.scope==='all'&&['physical','tactic'].includes(skill.kind),height=heal?154:102;
        this.box(left-5,y,w-pad*2+10,height-8,'#102a32','#2d4a54',4);this.drawSkillIcon(skill,left+3,y+6,25,root.BattleVFX.COLORS[root.BattleVFX.kindOf(skill)]||'#d9c48c');this.text(skill.name,left+37,y+18,14,'#d9e9e9','left');
        if(heal){percent(r,'selfThreshold','治疗自己',y+37);percent(r,'allyThreshold','治疗队友',y+91);}
        else if(group){const count=Math.max(1,this.battle.units.filter(t=>t.side==='enemy').length,Math.floor(r.threshold)||1);this.slider('施放条件',left+9,y+37,w-(pad+9)*2,r.disabled?0:Math.min(count,r.threshold),count,v=>{r.disabled=v===0;r.when='enemyCount';r.threshold=Math.max(1,v);},v=>v===0?'从不施放':`敌军至少 ${v} 人`);}
        else if(skill.buff?.taunt){const value=clamp(Math.round((r.displayThreshold||0)*100),0,101);this.slider('施放条件',left+9,y+37,w-(pad+9)*2,value,101,value=>{r.displayThreshold=value/100;r.disabled=value===0;},value=>value>0&&value<101?`自身兵力低于 ${value}%`:thresholdLabel(value));}
        else this.slider('施放频率',left+9,y+37,w-(pad+9)*2,r.disabled?0:1,1,v=>{r.disabled=v===0;r.when='always';r.threshold=0;},v=>v?'始终施放':'从不施放');
        y+=height;
      });
      const targets=[['lowestCurrent','剩余兵力最少'],['highestCurrent','剩余兵力最多'],['highestMax','最大兵力最多'],['random','随机目标']];
      this.slider('优先攻击目标',left+9,y+6,w-(pad+9)*2,Math.max(0,targets.findIndex(t=>t[0]===p.targetRule)),3,index=>{p.targetRule=targets[index][0];},index=>targets[index][1]);
      c.restore();this.hits=this.hits.filter((hit,i)=>i<before||(hit.y>=start&&hit.y+hit.h<=bottom));
      this.text('横向拖动设置 · 战斗持续进行',x+w/2,top+h-54,10,'#8eaab1');
      this.button('确定',left,top+h-39,w-pad*2,31,()=>{for(const r of p.rules)if(this.battle.skills[r.skill].kind==='buff'){if(this.battle.skills[r.skill].buff?.taunt){const t=r.displayThreshold??1.01;r.when=t>=1.01?'always':'selfBelow';r.threshold=t;}else{r.when='always';r.threshold=0;}delete r.displayThreshold;}this.battle.setTactics(u.id,{rules:p.rules,targetRule:p.targetRule});this.panel=null;});
    }
    notify(text){this.notice={text,until:performance.now()+2000};}
    click(e){const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*this.w/r.width,y=(e.clientY-r.top)*this.h/r.height;const hit=[...this.hits].reverse().find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);this.focus=-1;if(hit)hit.action?.();}
    key(e){if(e.key==='Escape'){this.panel=null;this.aim=null;}if(e.key.toLowerCase()==='t'&&this.focus>=0){const hit=this.hits[this.focus];if(hit?.unitId)this.openTactics(this.battle.unit(hit.unitId));}if(e.key==='Tab'){e.preventDefault();this.focus=(this.focus+(e.shiftKey?-1:1)+this.hits.length)%this.hits.length;}if(['ArrowLeft','ArrowRight'].includes(e.key)&&this.focus>=0&&this.hits[this.focus]?.kind==='slider'){e.preventDefault();this.hits[this.focus].step(e.key==='ArrowRight'?1:-1);}if(e.key==='Enter'&&this.focus>=0){e.preventDefault();this.hits[this.focus]?.action?.();this.focus=-1;}}
    restart(){return this.load({...this.scenario,rules:JSON.parse(JSON.stringify(this.battle.config))});}
    export(){return this.battle.export();}
    destroy(){this.disposed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();this.cancel();this.canvas.removeEventListener('pointerdown',this.down);this.canvas.removeEventListener('pointerup',this.up);this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointercancel',this.cancel);this.canvas.removeEventListener('contextmenu',this.context);this.canvas.removeEventListener('wheel',this.wheel);this.canvas.removeEventListener('keydown',this.key);}
  }
  function cOverlay(c,w,h){c.fillStyle='#010b14b8';c.fillRect(0,0,w,h);}
  const api={mount:(canvas,scenario,options)=>new CanvasBattle(canvas,scenario,options),CanvasBattle,layout,fitImage,modalLayout};root.BattleSystem=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
