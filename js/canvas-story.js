(function(root){
  'use strict';
  const P=root.PengpaiPrologue,UI=root.PengpaiUI,FONT=UI.font;
  const Viewport=typeof module!=='undefined'&&module.exports?require('./canvas-viewport.js'):root.CanvasViewport;
  class CanvasStory{
    constructor(canvas,options){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.character=options.character;this.store=options.store;this.slot=options.slot;this.progress=P.checkpoint(options.progress);this.images=new Map();this.busts=new Map();this.hits=[];this.disposed=false;
      this.resize=this.resize.bind(this);this.up=e=>{if(this.view||this.transition)return;if(this.detailPress){const press=this.detailPress;if(press.id!==e.pointerId)return;this.detailPress=null;if(press.moved)return;}const r=canvas.getBoundingClientRect(),x=Viewport.point(r,e).x,y=Viewport.point(r,e).y;[...this.hits].reverse().find(a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h)?.action();};
      this.key=e=>{if(this.view||this.transition||e.repeat)return;if(this.panel){if(e.key==='Escape')this.closePanel();else if(['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key)){e.preventDefault();this.scrollSkill((e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:e.key==='PageDown'?8:-8)*24);}return;}if(this.progress.stage==='departure'&&e.key==='Enter'){e.preventDefault();this.depart();return;}if([' ','Enter'].includes(e.key)){e.preventDefault();this.next();}if(e.key==='Escape')this.leave();};
      this.down=e=>{if(this.transition||!this.panel||e.button!==0)return;this.detailPress={id:e.pointerId,y:Viewport.point(canvas.getBoundingClientRect(),e).y,scroll:this.panel.scroll||0,panel:this.panel,moved:false};};this.move=e=>{const p=this.detailPress;if(!p||p.id!==e.pointerId||p.panel!==this.panel)return;const dy=Viewport.point(canvas.getBoundingClientRect(),e).y-p.y;if(Math.abs(dy)>7)p.moved=true;if(p.moved){this.panel.scroll=Math.max(0,Math.min(this.panel.maxScroll||0,p.scroll-dy));this.draw();}};this.cancel=()=>{this.detailPress=null;};this.wheel=e=>{if(this.panel){e.preventDefault();this.scrollSkill(e.deltaY);}};
      root.GameAssetLoader?.track?.(this);
      canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointercancel',this.cancel);canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.addEventListener('pointerup',this.up);canvas.addEventListener('keydown',this.key);this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);canvas.focus({preventScroll:true});this.enter(this.progress.stage,this.progress.index);
    }
    image(src){if(!src)return null;if(root.GameAssetLoader)return root.GameAssetLoader.get(src,this)||null;if(!this.images.has(src)){const i=new Image();i.onload=()=>{if(!this.disposed&&!this.view)this.draw();};i.src=root.BattleEmbeddedAssets?.[src]||src;this.images.set(src,i);}const i=this.images.get(src);return i.complete&&i.naturalWidth?i:null;}
    resize(){if(this.disposed||this.view)return;Object.assign(this,Viewport.resize(this.canvas,this.ctx));this.draw();}
    rememberLine(){
      const row=P.linesFor(this.progress.stage,this.progress)?.[this.progress.index];if(!row)return;
      const names={hero:this.character.name,narrator:'旁白',zhangjiao:'张角',zhangbao:'张宝',zhangliang:'张梁',simayi:'司马懿',zhugeliang:'诸葛亮',zhouyu:'周瑜',nanhua:'南华',yuji:'于吉',zuoci:'左慈','imperial-soldier':'官兵',villager:'老人'};
      this.progress.history=root.ConversationJournal.append(this.progress.history,{name:names[row.speaker]||row.speaker,text:row.text.replaceAll('{name}',this.character.name),chapter:P.chapters[this.progress.stage]?.title});
    }
    openHistory(){this.panel={type:'history',scroll:null};this.draw();}
    save(){this.rememberLine();try{this.store.save(this.slot,this.character,this.progress);this.saveError=false;}catch{this.saveError=true;}}
    sceneOf(stage){return P.chapters[stage]?.scene||(['first-fight','manual-fight','prepare','squad-fight'].includes(stage)?'village':stage==='departure'?'camp':null);}
    enter(stage,index=0){
      if(this.disposed||this.transition)return;
      const from=this.sceneOf(this.progress.stage),to=this.sceneOf(stage);
      if(this.hasDrawn&&from&&to&&from!==to){
        const snapshot=document.createElement('canvas');snapshot.width=this.canvas.width;snapshot.height=this.canvas.height;snapshot.getContext('2d').drawImage(this.canvas,0,0);this.view?.destroy();this.view=null;clearTimeout(this.timer);cancelAnimationFrame(this.fogRaf);this.fogRaf=0;
        this.transition={phase:'out',start:performance.now(),duration:280,snapshot,stage,index};this.hits=[];this.detailPress=null;this.resize();this.transitionStep(this.transition.start);return;
      }
      this.mountStage(stage,index);
    }
    transitionStep(now){
      this.transitionRaf=0;const t=this.transition;if(!t||this.disposed)return;
      if(t.phase==='out'&&now-t.start>=t.duration){t.phase='in';t.start+=t.duration;t.duration=360;this.mountStage(t.stage,t.index);}
      if(t.phase==='in'&&now-t.start>=t.duration){this.transition=null;this.draw();return;}
      this.draw(now);this.transitionRaf=requestAnimationFrame(time=>this.transitionStep(time));
    }
    draw(now=performance.now()){
      if(this.disposed||!this.w)return;const t=this.transition,c=this.ctx;
      if(t?.phase==='out'){c.clearRect(0,0,this.w,this.h);c.drawImage(t.snapshot,0,0,this.w,this.h);}
      else {this.drawScene();if(this.panel?.type==='history')root.ConversationJournal.draw(this,this.progress.history,this.panel,()=>this.closePanel());this.hasDrawn=true;}
      if(t){const progress=Math.max(0,Math.min(1,(now-t.start)/t.duration)),smooth=progress*progress*(3-2*progress);c.save();c.globalAlpha=t.phase==='out'?smooth:1-smooth;c.fillStyle='#000';c.fillRect(0,0,this.w,this.h);c.restore();}
    }
    mountStage(stage,index=0){
      clearTimeout(this.timer);this.panel=null;this.detailPress=null;cancelAnimationFrame(this.fogRaf);this.fogRaf=0;this.view?.destroy();this.view=null;this.failure=false;this.progress=P.checkpoint({...this.progress,stage,index});this.save();this.canvas.dataset.storyStage=stage;if(!['first-fight','manual-fight','prepare','squad-fight'].includes(stage))root.GameAudio?.setScene(stage==='dream'?'dream':P.chapters[stage]?.scene==='village'?'story':'camp');const upcoming=stage==='camp'?['camp','dream']:stage==='dream'||stage==='dawn'||stage==='departure'?['camp','interface','map']:['road','interface',...(['first-fight','aftermath','manual-fight','reinforcements','prepare','squad-fight'].includes(stage)?['camp']:[])];root.GameAssetLoader?.warmGroups?.(upcoming).catch(()=>{});if(stage==='departure')root.GameAssetLoader?.warmMap?.();
      if(stage==='world'){Promise.resolve().then(()=>{if(!this.disposed)this.options.onWorld?.(this.progress);});return;}
      if(['first-fight','manual-fight','prepare','squad-fight'].includes(stage)){
        const prepare=stage==='prepare',scenario=P.createBattle(stage,this.character,this.progress.preparation),settings=this.store.settings();
        const update=view=>{this.progress.preparation={...P.preparationOf(view.battle),_reviewed:!!view.prepared};this.save();};
        this.view=root.BattleSystem.mount(this.canvas,scenario,{...settings,autoStart:!prepare,hideResult:true,tutorialActor:'zhangjiao',
          onTacticsSave:(unit,view)=>update(view),onPrepareChange:update,
          onPrepared:view=>{update(view);this.progress.stage='squad-fight';this.save();this.canvas.dataset.storyStage='squad-fight';},
          onComplete:result=>{const expected=stage==='first-fight'?'defeat':'victory';this.timer=setTimeout(()=>{if(this.disposed)return;if(result.result!==expected){this.view?.destroy();this.view=null;this.failure=true;this.resize();return;}this.enter(stage==='first-fight'?'aftermath':stage==='manual-fight'?'reinforcements':'camp');},900);}
        });
        this.view.prepared=!!this.progress.preparation._reviewed;return;
      }
      const actors=[...new Set((P.linesFor(stage,this.progress)||[]).map(row=>row.speaker==='hero'?'hero':row.partner).filter(Boolean))],portraits=actors.map(id=>P.assets(id,this.character.appearance,true).fullbody?.src).filter(Boolean);root.GameAssetLoader?.preload?.(portraits,{priority:1}).catch(()=>{});
      this.resize();
    }
    text(value,x,y,size=16,color='#f1ece2',align='left'){size=UI.textSize(size);const c=this.ctx;c.font=`${size}px ${FONT}`;c.fillStyle=color;c.textBaseline='middle';c.textAlign=align;c.fillText(value,x,y);}
    box(x,y,w,h,fill='#18201fed',stroke='#877958'){UI.surface(this.ctx,x,y,w,h,fill,stroke,3);}
    button(label,x,y,w,h,action){UI.button(this,label,x,y,w,h,action);}
    bust(id,side,top,active){
      if(!id)return;const early=this.progress&&typeof this.progress==='object'&&!['departure','world','complete'].includes(this.progress.stage)&&(this.progress.stage!=='dawn'||this.progress.index<3),art=P.assets(id,this.character.appearance,early).fullbody,img=this.image(art?.src);if(!img)return;
      if(!this.busts.has(art.src)){const crop=art.dialogueCrop||root.CharacterAssets.bustCrop(img.naturalWidth,img.naturalHeight),cache=document.createElement('canvas');cache.width=Math.round(crop.width);cache.height=Math.round(crop.height);const c=cache.getContext('2d');c.drawImage(img,crop.x,crop.y,crop.width,crop.height,0,0,cache.width,cache.height);const fade=c.createLinearGradient(0,0,0,cache.height);fade.addColorStop(0,'#000');fade.addColorStop(.65,'#000');fade.addColorStop(1,'#0000');c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,cache.width,cache.height);this.busts.set(art.src,cache);}
      const bust=this.busts.get(art.src),height=Math.min(330,this.h*.42),width=height*bust.width/bust.height,x=side==='left'?-width*.1:this.w-width*.9,c=this.ctx;c.save();c.globalAlpha=active?1:.55;c.drawImage(bust,x,top-height+70,width,height);c.restore();
    }
    wrap(value,x,y,width){const c=this.ctx,size=16,line=25;c.font=`${size}px ${FONT}`;const rows=UI.wrapLines(c,value,width);rows.forEach((row,i)=>this.text(row,x,y+i*line,size));return y+Math.max(0,rows.length-1)*line;}
    backdrop(scene){const c=this.ctx;if(scene==='dream'){
        const t=performance.now()/1000;c.fillStyle='#000';c.fillRect(0,0,this.w,this.h);
        this.fogTexture||=this.makeFog();
        for(let i=0;i<7;i++){const width=this.w*(1.4+i*.09),height=90+i*24,x=((t*(8+i*2)*(i%2?-1:1)+i*117)%(this.w+width)+this.w+width)%(this.w+width)-width,y=this.h*(.22+i*.085)+Math.sin(t*.18+i)*18;c.globalAlpha=.22+i*.018;c.drawImage(this.fogTexture,x,y,width,height);c.drawImage(this.fogTexture,x+this.w+width*.3,y,width,height);}c.globalAlpha=1;
        if(!this.fogRaf&&!this.transition)this.fogRaf=requestAnimationFrame(()=>{this.fogRaf=0;if(!this.disposed&&!this.view&&this.progress.stage==='dream')this.draw();});return;
      }const img=this.image(scene==='camp'?'./assets/story/yellow-camp.webp':'./assets/story/village-road-v3.webp');c.fillStyle='#172a2c';c.fillRect(0,0,this.w,this.h);if(img){const s=Math.max(this.w/img.naturalWidth,this.h/img.naturalHeight);c.drawImage(img,(this.w-img.naturalWidth*s)/2,(this.h-img.naturalHeight*s)/2,img.naturalWidth*s,img.naturalHeight*s);}const g=c.createLinearGradient(0,0,0,this.h);g.addColorStop(0,'#06131b66');g.addColorStop(.45,'#06131b00');g.addColorStop(1,'#06131baa');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
    makeFog(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const c=canvas.getContext('2d');for(let i=0;i<9;i++){const x=70+i*45,y=96+Math.sin(i*2)*12,g=c.createRadialGradient(x,y,0,x,y,64);g.addColorStop(0,'#d9e9e7b0');g.addColorStop(1,'#c2dbdf00');c.fillStyle=g;c.fillRect(x-64,y-64,128,128);}return canvas;}
    drawScene(){
      if(this.disposed||this.view||!this.w)return;const c=this.ctx,w=this.w,h=this.h,chapter=P.chapters[this.progress.stage],line=P.linesFor(this.progress.stage,this.progress)?.[this.progress.index];this.hits=[];this.backdrop(chapter?.scene||'camp');
      if(this.progress.stage==='departure'){this.drawDeparture();if(this.panel){root.BattleSystem.CanvasBattle.prototype.drawSkillInfo.call(this);this.canvas.setAttribute('aria-label','技能详情：'+this.battle.skills[this.panel.skill].name+'。'+root.BattleSkillInfo.describe(this.battle,this.battle.unit('hero'),this.battle.skills[this.panel.skill]).lines.join('')+'关闭后返回选择兵器。');}return;}
      if(this.failure){this.box(24,h/2-92,w-48,184);this.text('未能守住村口',w/2,h/2-46,20,'#f0dfbc','center');this.button('再试一次',48,h/2+12,w-96,42,()=>this.enter(this.progress.stage));return;}
      if(!line){this.canvas.setAttribute('aria-label','序章结束，未完待续。返回主菜单。');this.text('序章 · 黄天之下',w/2,h*.36,25,'#f4dfb3','center');this.text('未完待续',w/2,h*.36+46,16,'#dfd7c8','center');this.button('返回主菜单',w/2-100,h*.66,200,42,()=>this.leave());return;}
      this.text(chapter.title,w/2,33,20,'#f2e4cb','center');if(!line.choices)this.button('跳过',w-64,56,48,32,()=>this.skip());
      const content=line.text.replaceAll('{name}',this.character.name);c.font=`16px ${FONT}`;const rows=UI.wrapLines(c,content,w-52),panelH=Math.max(208,112+rows.length*25+(line.choices?100:0)),top=h-panelH,partner=line.partner;
      if(line.speaker==='hero')this.bust('hero','right',top,true);else if(line.speaker!=='narrator')this.bust(partner,line.side||'left',top,true);
      const fade=c.createLinearGradient(0,top-24,0,top+panelH);fade.addColorStop(0,'#081b2600');fade.addColorStop(.25,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,w,panelH+24);c.strokeStyle='#bcab8644';c.beginPath();c.moveTo(24,top+45);c.lineTo(w-24,top+45);c.stroke();
      const names={zhangjiao:'张角',zhangbao:'张宝',zhangliang:'张梁',simayi:'司马懿',zhugeliang:'诸葛亮',zhouyu:'周瑜',nanhua:'南华',zuoci:'左慈',yuji:'于吉','imperial-soldier':'官兵',villager:'老人',narrator:'',hero:this.character.name};
      const right=(line.side|| (line.speaker==='hero'?'right':'left'))==='right';this.text(line.speaker==='hero'?names.hero:UI.dialogueName(names[line.speaker]||''),right?w-26:26,top+24,16,'#ead1a2',right?'right':'left');
      rows.forEach((row,i)=>this.text(row,26,top+73+i*25,16));
      if(line.choices){line.choices.forEach((choice,i)=>this.button(choice.label,26,h-108+i*49,w-52,41,()=>this.chooseDream(choice.id)));}else{this.text('›',w-32,h-30,24,'#c7b386','center');UI.singleChoiceHit(this.hits,w,h,[{action:()=>this.next()}]);}
      if(this.saveError)this.text('存档写入失败',w/2,65,12,'#edaa92','center');
      this.canvas.setAttribute('aria-label',`${chapter.title}。${names[line.speaker]||'旁白'}：${line.text.replaceAll('{name}',this.character.name)} ${line.choices?line.choices.map(choice=>choice.label).join('。'):'点击继续。'}`);
    }
    chooseWeapon(id,persist=true){
      const type=root.PengpaiRules.WEAPON_TYPES.find(t=>t.id===id);if(!type)return false;
      this.weaponChoice=id;this.weaponGroup=type.group;if(this.departureWorld.state.weaponType!==id)this.departureWorld.chooseWeapon(id);this.progress.world=this.departureWorld.snapshot();if(persist)this.save();return true;
    }
    drawDeparture(){
      const R=root.PengpaiRules,W=root.WeaponSkills,w=this.w,h=this.h,compact=h<640,c=this.ctx;this.departureWorld||=new root.WorldModel.World(this.character,this.progress.world);this.weaponChoice??=this.departureWorld.state.weaponType;
      this.weaponGroup??=R.WEAPON_TYPES.find(t=>t.id===this.weaponChoice)?.group||R.WEAPON_GROUPS[0].id;if(!this.weaponChoice)this.chooseWeapon(R.WEAPON_TYPES.find(t=>t.group===this.weaponGroup).id,false);
      c.fillStyle='#071923d9';c.fillRect(0,0,w,h);this.text('选择兵器',w/2,35,20,'#edddbc','center');this.button('‹',16,18,30,34,()=>this.leave());
      const left=16,inner=w-32,statTop=62,statH=compact?38:42,cellW=inner/R.ATTRIBUTES.length,actor=this.departureWorld.members()[0];this.box(left,statTop,inner,statH,'#10262edc','#49666c');
      R.ATTRIBUTES.forEach(([key,label],i)=>{const x=left+i*cellW;if(i){c.strokeStyle='#3e5b62';c.beginPath();c.moveTo(x,statTop);c.lineTo(x,statTop+statH);c.stroke();}this.text(label,x+cellW/2,statTop+10,14,'#aebfc2','center');this.text('潜力'+String(actor.potentials?.[key]??'—'),x+cellW/2,statTop+statH-10,14,'#efddba','center');});
      const groupTop=compact?110:116,groupH=compact?38:44,groupGap=compact?4:6,groupW=(inner-groupGap*5)/6;
      R.WEAPON_GROUPS.forEach((group,i)=>{const x=left+i*(groupW+groupGap),active=group.id===this.weaponGroup;this.box(x,groupTop,groupW,groupH,active?'#4b402b':'#112a34',active?'#dfc18b':'#4b6872');this.text(group.name,x+groupW/2,groupTop+groupH/2,14,active?'#ffe4b0':'#c5d5d6','center');this.hits.push({x,y:groupTop,w:groupW,h:groupH,label:group.name,action:()=>{if(this.weaponGroup!==group.id)this.chooseWeapon(R.WEAPON_TYPES.find(t=>t.group===group.id).id);this.draw();}});});
      const group=R.WEAPON_GROUPS.find(g=>g.id===this.weaponGroup);c.font=`14px ${FONT}`;UI.wrapLines(c,group.description,inner).forEach((line,i)=>this.text(line,left,(compact?167:180)+i*20,14,'#b8cbd0'));
      const gap=compact?4:6,bw=(inner-gap*2)/3,weaponTop=compact?208:222,bh=compact?26:32,types=R.WEAPON_TYPES.filter(t=>t.group===this.weaponGroup);
      types.forEach((type,i)=>{const x=left+(i%3)*(bw+gap),y=weaponTop+Math.floor(i/3)*(bh+gap),active=this.weaponChoice===type.id;this.box(x,y,bw,bh,active?'#674c2c':'#102b35',active?'#dfc18b':'#577681');this.text(type.name,x+bw/2,y+bh/2,14,active?'#ffe7b5':'#e2e9e7','center');this.hits.push({x,y,w:bw,h:bh,label:type.name,action:()=>{this.chooseWeapon(type.id);this.draw();}});});
      const selected=R.WEAPON_TYPES.find(t=>t.id===this.weaponChoice),flowY=weaponTop+Math.ceil(types.length/3)*(bh+gap)+10;this.text(selected.name+' · '+selected.style,left,flowY,14,'#e2d0aa');
      const skillTop=flowY+18,ids=W.forWeapon({type:this.weaponChoice}),cardGap=compact?6:8,cardW=(inner-cardGap*(ids.length-1))/ids.length,cardH=compact?128:152,proto=root.BattleSystem.CanvasBattle.prototype;
      ids.forEach((id,i)=>{const skill=W.skills[id],x=left+i*(cardW+cardGap),role=proto.skillRole.call(this,skill),prefix=/^(单体|群体|自身)/.exec(role),scope=prefix?prefix[0]:skill.side==='self'?'自身':skill.scope==='all'?'群体':'单体',effect=prefix?role.slice(prefix[0].length):role,color=skill.kind==='heal'?'#91ddb1':skill.kind==='buff'?'#d9c084':skill.kind==='tactic'?'#c7a6e7':'#dbb39c',icon=compact?38:44;
        this.box(x,skillTop,cardW,cardH,'#102832ee','#54757c');this.box(x+(cardW-icon)/2,skillTop+10,icon,icon,'#0b222d','#719199');proto.drawSkillIcon.call(this,skill,x+(cardW-icon)/2,skillTop+10,icon);this.text(skill.name,x+cardW/2,skillTop+icon+28,14,'#e5e9e5','center');this.text(scope,x+cardW/2,skillTop+icon+51,14,'#b4c9cc','center');this.text(effect,x+cardW/2,skillTop+icon+71,14,color,'center');this.hits.push({x,y:skillTop,w:cardW,h:cardH,label:'查看'+skill.name+'详情',action:()=>this.openWeaponSkill(id)});
      });
      const fy=h-64;this.text('后续可随意切换武器',w/2,fy-22,14,'#b6cbd0','center');this.button(this.departureConfirmLabel||'启程',16,fy,inner,44,()=>this.depart());this.canvas.setAttribute('aria-label','选择初始兵器。'+R.ATTRIBUTES.map(([key,label])=>label+'潜力'+actor.potentials?.[key]).join('，')+'。'+group.name+'：'+group.description+'。已选'+selected.name+'，'+selected.style+'。'+ids.map(id=>W.skills[id].name).join('、')+'。技能可点击查看详情。后续可随意切换武器。启程。');
    }
    openWeaponSkill(id){
      const unit=this.departureWorld?.members()[0];if(!unit?.skills.includes(id))return false;
      this.battle=new root.BattleEngine.Battle({allies:[unit],enemies:[],rules:{level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true}});this.panel={type:'skillInfo',id:'hero',skill:id,scroll:0};this.draw();return true;
    }
    panelFrame(...args){return root.BattleSystem.CanvasBattle.prototype.panelFrame.apply(this,args);}
    drawSkillIcon(...args){return root.BattleSystem.CanvasBattle.prototype.drawSkillIcon.apply(this,args);}
    wrapInfo(...args){return root.BattleSystem.CanvasBattle.prototype.wrapInfo.apply(this,args);}
    closePanel(){this.panel=null;this.detailPress=null;this.draw();}
    scrollSkill(delta){if(!this.panel)return;this.panel.scroll=Math.max(0,Math.min(this.panel.maxScroll||0,(this.panel.scroll||0)+delta));this.draw();}
    depart(){if(!this.weaponChoice)return;this.departureWorld.chooseWeapon(this.weaponChoice);this.departureWorld.state.journal=root.ConversationJournal.normalize(this.progress.history);this.departureWorld.state.departurePractice='offer';this.departureWorld.state.inside=true;this.progress.world=this.departureWorld.snapshot();this.enter('world');}
    skip(){if(this.transition)return;const chapter=P.chapters[this.progress.stage];if(this.progress.stage==='dream'&&!this.progress.dreamChoice){this.progress.index=chapter.lines.length-1;this.save();this.draw();return;}if(chapter)this.enter(chapter.next);}
    chooseDream(id){const next=P.chooseDream(this.progress,id);if(!next)return;this.progress=next;this.save();this.draw();}
    next(){if(this.transition)return;if(this.failure){this.enter(this.progress.stage);return;}const chapter=P.chapters[this.progress.stage],lines=P.linesFor(this.progress.stage,this.progress);if(!chapter||lines[this.progress.index]?.choices)return;if(this.progress.index+1<lines.length){this.progress.index++;this.save();this.draw();}else this.enter(chapter.next);}
    leave(){this.save();this.options.onExit?.();}
    destroy(){this.disposed=true;clearTimeout(this.timer);cancelAnimationFrame(this.transitionRaf);this.transitionRaf=0;this.transition=null;cancelAnimationFrame(this.fogRaf);this.fogRaf=0;this.view?.destroy();this.observer.disconnect();for(const [type,fn]of [['pointerdown',this.down],['pointermove',this.move],['pointercancel',this.cancel],['wheel',this.wheel]])this.canvas.removeEventListener(type,fn);this.canvas.removeEventListener('pointerup',this.up);this.canvas.removeEventListener('keydown',this.key);}
  }
  root.PengpaiStory={CanvasStory,mount:(canvas,options)=>new CanvasStory(canvas,options)};
})(globalThis);
