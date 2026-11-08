(function(root){
  'use strict';
  const S=root.BattleSimulator,UI=root.PengpaiUI,Panels=root.WorldPanels;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const clock=time=>String(Math.floor(time/60)).padStart(2,'0')+':'+String(Math.floor(time%60)).padStart(2,'0');
  class CanvasSimulator extends root.WorldMap.CanvasWorld{
    constructor(canvas,options){
      const session=new S.Session(options.store.storage);
      super(canvas,{...options,standalone:true,model:session.world,character:session.world.character,allowDismiss:false,showExperience:false,
        memberAction:{label:'更换武将',action:(view,u,p)=>view.chooseRoster(view.session.activeIds().indexOf(u.id),p)},
        drawCharacterControls:(view,{unit:u,left,inner,slotSize,y})=>view.button('等级',left+inner-slotSize,y+8,slotSize,30,()=>{view.panel={type:'simLevel',unitId:u.id,previous:view.panel};})});
      this.session=session;this.panel=null;this.canvas.dataset.storyStage='simulator';this.canvas.dataset.menuScreen='simulator';
      const previousWheel=this.wheel;this.canvas.removeEventListener('wheel',previousWheel);this.wheel=e=>{if(['simRoster','simBoss','simResult'].includes(this.panel?.type)){e.preventDefault();this.panel.scroll=clamp((this.panel.scroll||0)+e.deltaY,0,this.panel.maxScroll||0);this.invalidate();}else previousWheel(e);};this.canvas.addEventListener('wheel',this.wheel,{passive:false});this.save();this.invalidate();
    }
    resize(){if(this.disposed||this.battle)return;Object.assign(this,root.CanvasViewport.resize(this.canvas,this.ctx));this.mapRect={x:0,y:0,w:this.w,h:this.h};this.backdropCache=null;this.invalidate();}
    save(){if(!this.session)return;this.session.save();this.character=this.model.character;this.previewRevision=-1;this.saveError=this.session.saveError;}
    partyTop(){return Math.min(...root.BattleSystem.layout(this.w,this.h,root.PengpaiRules.PARTY_LIMIT,0).map(r=>r.y));}
    idleVisible(){return !this.disposed&&!this.battle;}
    preview(){if(this.previewRevision!==this.session.revision){this.previewBattle=new root.BattleEngine.Battle(this.session.scenario('simulation-preview'));this.previewRevision=this.session.revision;}return this.previewBattle;}
    chooseRoster(slot=null,previous=null){this.panel={type:'simRoster',slot,previous,filter:'all',scroll:0};}
    drawBackdrop(){
      const src=this.session.boss().sceneId,scene=root.BattleScenes.get(src),img=this.image(scene.background),key=[this.w,this.h,scene.background,img?.naturalWidth].join('|');
      if(this.backdropCache?.key!==key){const canvas=document.createElement('canvas');canvas.width=this.canvas.width;canvas.height=this.canvas.height;const c=canvas.getContext('2d');c.scale(this.dpr,this.dpr);c.fillStyle='#091d28';c.fillRect(0,0,this.w,this.h);if(img){const scale=Math.max(this.w/img.naturalWidth,this.h/img.naturalHeight);c.drawImage(img,(this.w-img.naturalWidth*scale)/2,(this.h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}const fade=c.createLinearGradient(0,0,0,this.h);fade.addColorStop(0,'#071722d9');fade.addColorStop(.5,'#07172255');fade.addColorStop(1,'#071722b8');c.fillStyle=fade;c.fillRect(0,0,this.w,this.h);this.backdropCache={key,canvas};}this.ctx.drawImage(this.backdropCache.canvas,0,0,this.w,this.h);
    }
    draw(){
      if(this.disposed||this.battle||!this.session)return;root.GameAudio?.setScene('camp');this.hits=[];this.drawBackdrop();
      this.button('返回',14,12,60,32,()=>{this.save();this.options.onExit?.();});this.text('战斗模拟',this.w/2,28,20,'#eddbb6','center');Panels.iconButton(this,'设置',this.w-48,12,34,()=>{this.panel={type:'simSettings'};});
      const boss=this.session.boss(),enemy=this.preview().living('enemy'),levels=[...new Set(enemy.map(u=>u.level))];
      this.box(14,61,this.w-28,48,'#0d2733ef','#a58d61');this.text(boss.title,28,85,16,'#f0dab1');this.text(levels.join('/')+'级　›',this.w-28,85,14,'#bccfd5','right');this.hits.push({x:14,y:61,w:this.w-28,h:48,label:'选择Boss',action:()=>{this.panel={type:'simBoss',filter:'all',scroll:0};}});
      const teamLevels=[...new Set(this.model.members().map(u=>u.level))];this.button('队伍等级 '+(teamLevels.length===1?teamLevels[0]:teamLevels.length?'自定':this.session.level),14,120,this.w*.57,32,()=>{this.panel={type:'simLevel'};});this.button(this.session.difficulty==='hell'?'地狱难度':'常规难度',this.w*.57+24,120,this.w*.43-38,32,()=>{this.session.setDifficulty(this.session.difficulty==='hell'?'normal':'hell');this.save();});
      this.drawEnemies();const top=this.partyTop();this.button('选择武将',14,top-72,105,40,()=>this.chooseRoster());this.button('进入战斗',131,top-72,this.w-145,40,()=>this.startSimulation(),{active:true,disabled:!this.session.activeIds().length});
      this.text('出战 '+this.session.activeIds().length+'/'+boss.limit,16,top-18,14,'#d7c59e');this.text('点击武将配装',this.w-16,top-18,14,'#b6c8cd','right');this.drawPartyBar();
      if(this.panel)this.drawPanel();if(this.notice?.until>performance.now()){this.box(18,this.h/2-28,this.w-36,56,'#102b36fa','#b7a279');this.text(this.notice.text,this.w/2,this.h/2,14,'#efdfb9','center');}if(this.saveError)this.text('模拟配置未能保存',this.w/2,this.h-5,14,'#e6a47e','center');this.drawnRevision=this.revision;
      this.canvas.setAttribute('aria-label','战斗模拟 '+boss.title+' 队伍等级'+this.session.level+' 出战'+this.session.activeIds().length+'/'+boss.limit+(this.panel?' '+this.panel.type:''));
    }
    drawEnemies(){
      const b=this.preview(),enemies=b.living('enemy'),top=172,bottom=this.partyTop()-88,h=bottom-top;
      const rects=root.BattleSystem.layout(this.w,this.h,root.PengpaiRules.PARTY_LIMIT,enemies.length,root.BattleScenes.arrange(root.BattleScenes.get(this.session.boss().sceneId),enemies).enemyFormation).filter(r=>r.side==='enemy');
      const first=Math.min(...rects.map(r=>r.y)),last=Math.max(...rects.map(r=>r.y+r.h)),scale=h/Math.max(1,last-first);
      for(const rect of rects){const u=enemies[rect.index],art=u.fullbody||u.portrait,img=this.image(art?.src),rowTop=top+(rect.y-first)*scale,above=rect.boss||rect.hudAbove,headroom=above?(rect.boss?22:36):0,box={x:rect.x,y:rowTop+headroom,w:rect.w,h:Math.max(12,rect.h*scale-headroom-(above?0:30))},dst=img?root.BattleSystem.fitImage(img.naturalWidth,img.naturalHeight,box):box,c=this.ctx;
        c.save();c.fillStyle='#02080c88';c.beginPath();c.ellipse(dst.x+dst.w/2,dst.y+dst.h-2,Math.min(dst.w*.36,58),Math.min(10,dst.w*.1),0,0,Math.PI*2);c.fill();if(img)c.drawImage(img,dst.x,dst.y,dst.w,dst.h);c.restore();
        const width=enemies.length===1?Math.min(180,this.w*.6):Math.min(rect.w-4,150),x=rect.x+(rect.w-width)/2,y=above?rowTop+(rect.boss?0:16):dst.y+dst.h+2;Panels.bar(this,x,y,width,15,1,'#b72731');this.text(u.maxSoldiers,x+width/2,y+7.5,14,'#fff3e4','center');if(!rect.boss)this.text(u.name,x+width/2,above?rowTop+5:y+27,14,'#e4e5da','center');this.hits.push({x:rect.x,y:rowTop,w:rect.w,h:rect.h*scale+14,label:'查看敌人 '+u.name,action:()=>{this.panel={type:'character',unit:u,unitId:u.id,readonly:true};}});
      }
    }
    drawPanel(){
      const p=this.panel;if(p.type==='simRoster')return this.drawRoster();if(p.type==='simBoss')return this.drawBosses();if(p.type==='simLevel')return this.drawLevel();if(p.type==='simResult')return this.drawResult();
      if(p.type==='simSettings'){const f=this.frame('设置',root.GameSettingsPanel.HEIGHT);root.GameSettingsPanel.draw(this,f,this.options.store.settings(),patch=>{this.options.store.setSettings(patch);this.invalidate();});return;}
      super.drawPanel();
    }
    drawRoster(){
      const p=this.panel,f=this.frame(p.slot==null?'选择武将 '+this.session.activeIds().length+'/'+this.session.boss().limit:'更换武将',600),left=f.x+16,w=f.w-32,tabs=[['all','全部'],['wei','魏'],['shu','蜀'],['wu','吴'],['other','群雄']];
      tabs.forEach(([id,name],i)=>this.button(name,left+i*w/5,f.y+55,w/5-4,30,()=>{p.filter=id;p.scroll=0;},{active:p.filter===id}));
      const heroes=S.heroes.filter(u=>p.filter==='all'||(p.filter==='other'?['other','yellow','dong'].includes(u.country):u.country===p.filter)),cols=4,gap=8,cw=(w-gap*3)/cols,rowH=105,top=f.y+97,bottom=f.y+f.h-16,c=this.ctx;
      p.maxScroll=Math.max(0,Math.ceil(heroes.length/cols)*rowH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
      heroes.forEach((u,i)=>{const x=left+i%cols*(cw+gap),y=top+Math.floor(i/cols)*rowH-p.scroll,index=this.session.activeIds().indexOf(u.id);if(y+97<top||y>bottom)return;this.box(x,y,cw,97,index>=0?'#344332':'#112d37',index>=0?'#e4c77d':'#536f77',4);const art=u.id==='hero'?root.PengpaiAssets.protagonists.scholar:root.CharacterAssets.resolve(u.id).portrait;const avatar=Math.min(70,cw-10),px=x+(cw-avatar)/2;if(u.id==='hero')this.portrait({src:art.src,crop:art.portrait},px,y+5,avatar,{frame:false});else this.portrait(art,px,y+5,avatar,{frame:false});this.text(u.name,x+cw/2,y+83,14,'#eddfc2','center');if(index>=0){this.box(x+cw-20,y+3,17,19,'#70572d',null);this.text(index+1,x+cw-11.5,y+12.5,14,'#fff0c6','center');}
        this.hits.push({x,y,w:cw,h:97,label:'选择武将 '+u.name,action:()=>{const okay=p.slot==null?this.session.toggle(u.id):this.session.replace(p.slot,u.id);if(!okay){this.notify('最多出战'+this.session.boss().limit+'人');return;}this.save();if(p.slot!=null)this.panel=null;}});
      });c.restore();this.clipHits(before,top,bottom);this.scrollTrack(f,top,bottom);
    }
    drawBosses(){
      const p=this.panel,f=this.frame('选择Boss',590),left=f.x+16,w=f.w-32,tabs=[['all','全部'],['boss','首领'],['duel','单挑'],['luoyang','洛阳']];tabs.forEach(([id,name],i)=>this.button(name,left+i*w/4,f.y+55,w/4-5,30,()=>{p.filter=id;p.scroll=0;},{active:p.filter===id}));
      const list=S.bosses.filter(b=>p.filter==='all'||b.group===p.filter),top=f.y+96,bottom=f.y+f.h-16,rowH=65,c=this.ctx;p.maxScroll=Math.max(0,list.length*rowH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
      list.forEach((b,i)=>{const y=top+i*rowH-p.scroll;if(y+58<top||y>bottom)return;const active=b.id===this.session.bossId;this.box(left,y,w,57,active?'#3f3b2a':'#112d37',active?'#d8bc77':'#4b6871',4);const info=this.bossDetails(b),art=info.portrait;this.portrait(art,left+7,y+6,44,{frame:false});this.text(b.title,left+62,y+17,16,'#e9d6ad');this.text(info.levels+'级 · '+(b.limit===1?'单人切磋':info.count+'名敌人'),left+62,y+40,14,'#b1c8cc');this.hits.push({x:left,y,w,h:57,label:'挑战 '+b.title,action:()=>{this.session.chooseBoss(b.id);this.save();this.panel=null;this.backdropCache=null;}});});c.restore();this.clipHits(before,top,bottom);this.scrollTrack(f,top,bottom);
    }
    bossDetails(b){const cache=this.bossDetailsCache||=(new Map());if(!cache.has(b.id)){const enemies=b.roster(),first=enemies.find(u=>u.formationRow==='front')||enemies[0];cache.set(b.id,{levels:[...new Set(enemies.map(u=>u.level))].join('/'),count:enemies.length,portrait:root.CharacterAssets.resolve(first.characterId||first.id).portrait});}return cache.get(b.id);}
    scrollTrack(f,top,bottom){const p=this.panel;if(!p.maxScroll)return;const height=bottom-top,thumb=Math.max(20,height*height/(height+p.maxScroll));this.box(f.x+f.w-8,top,2,height,'#18343e',null);this.box(f.x+f.w-8,top+(height-thumb)*(p.scroll||0)/p.maxScroll,2,thumb,'#8ba9ad',null);}
    clipHits(before,top,bottom){this.hits=this.hits.filter((h,i)=>{if(i<before)return true;const end=Math.min(bottom,h.y+h.h);h.y=Math.max(top,h.y);h.h=end-h.y;return h.h>0;});}
    drawLevel(){
      const p=this.panel,id=p.unitId,teamLevels=[...new Set(this.model.members().map(u=>u.level))],current=id?this.session.record(id).unit.level:teamLevels.length===1?teamLevels[0]:this.session.level,f=this.frame(id?S.heroMap[id].name+' · 等级':'队伍等级',220),left=f.x+24,w=f.w-48,y=f.y+132;
      this.button('−',left,f.y+64,48,36,()=>{this.session.setLevel(current-1,id);this.save();},{disabled:current===1});this.text(current,f.x+f.w/2,f.y+82,24,'#e9d5a8','center');this.button('+',left+w-48,f.y+64,48,36,()=>{this.session.setLevel(current+1,id);this.save();},{disabled:current===S.MAX_LEVEL});
      this.box(left,y,w,5,'#122f39','#5f7f88',2);this.box(left,y,w*(current-1)/(S.MAX_LEVEL-1),5,'#55bec8',null,2);this.ctx.fillStyle='#caedf0';this.ctx.beginPath();this.ctx.arc(left+w*(current-1)/(S.MAX_LEVEL-1),y+2.5,7,0,Math.PI*2);this.ctx.fill();this.text(1,left,y+28,14,'#b1c4c9');this.text(S.MAX_LEVEL,left+w,y+28,14,'#b1c4c9','right');
      this.hits.push({x:left-5,y:y-13,w:w+10,h:32,label:'调整等级',kind:'slider',change:x=>{this.session.setLevel(Math.round(1+clamp((x-left)/w,0,1)*(S.MAX_LEVEL-1)),id);this.save();}});
    }
    startSimulation(){
      if(!this.session.activeIds().length)return;this.panel=null;this.notice=null;this.save();const scenario=this.session.scenario(),settings=this.options.store.settings();
      const save=view=>{for(const u of view.battle.units.filter(u=>u.side==='ally'))this.model.saveTactics(u);this.save();};
      const view=this.battle=root.BattleSystem.mount(this.canvas,scenario,{...settings,autoStart:false,hideResult:true,onTacticsSave:(unit,v)=>save(v),onPrepareChange:save,onPrepared:save,onComplete:result=>{clearTimeout(this.resultTimer);this.resultTimer=setTimeout(()=>{if(this.disposed||this.battle!==view)return;save(view);view.destroy();this.battle=null;this.session.rebuild();this.resize();this.panel={type:'simResult',result,scroll:0};this.invalidate();},650);}});
      const draw=view.draw;view.draw=function(now){draw.call(this,now);if(!this.disposed&&!this.assetsLoading&&!this.panel)this.button('返回配置',12,12,88,30,()=>host.stopSimulation());};const host=this;view.draw();
    }
    stopSimulation(){if(!this.battle)return;clearTimeout(this.resultTimer);for(const u of this.battle.battle.units.filter(u=>u.side==='ally'))this.model.saveTactics(u);this.save();this.battle.destroy();this.battle=null;this.session.rebuild();this.panel=null;this.resize();}
    drawResult(){
      const p=this.panel,r=p.result,units=r.units.filter(u=>u.side==='ally'),f=this.frame(({victory:'模拟胜利',defeat:'模拟失利',draw:'双方倒下',retreated:'已撤退'})[r.result]||'模拟结束',390),left=f.x+20,w=f.w-40;this.text(clock(r.time),f.x+f.w/2,f.y+61,16,'#d9c49b','center');this.text('武将',left,f.y+92,14,'#a9c1c9');this.text('伤害',left+w*.52,f.y+92,14,'#a9c1c9','right');this.text('治疗',left+w*.79,f.y+92,14,'#a9c1c9','right');this.text('行动',left+w,f.y+92,14,'#a9c1c9','right');
      units.forEach((u,i)=>{const y=f.y+114+i*41;this.box(left,y,w,34,'#112c36',null);this.text(u.name,left+7,y+17,14,'#e4d9bd');this.text(Math.floor(u.stats.damage),left+w*.52,y+17,14,'#e0b2ab','right');this.text(Math.floor(u.stats.healing),left+w*.79,y+17,14,'#93d4a5','right');this.text(u.stats.actions,left+w-4,y+17,14,'#c4d6dc','right');});
      this.button('调整配置',left,f.y+f.h-55,(w-10)/2,36,()=>{this.panel=null;});this.button('再次挑战',left+(w+10)/2,f.y+f.h-55,(w-10)/2,36,()=>this.startSimulation(),{active:true});
    }
    destroy(){clearTimeout(this.resultTimer);this.save();super.destroy();}
  }
  root.BattleSimulationUI={CanvasSimulator,mount:(canvas,options)=>new CanvasSimulator(canvas,options)};
})(globalThis);
