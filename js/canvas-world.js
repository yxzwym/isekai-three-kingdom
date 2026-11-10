(function(root){
  'use strict';
  const Journal=typeof module!=='undefined'&&module.exports?require('./conversation-journal.js'):root.ConversationJournal;
  const Panels=typeof module!=='undefined'&&module.exports?require('./world-panels.js'):root.WorldPanels;
  const PartyInput=typeof module!=='undefined'&&module.exports?require('./party-controls.js'):root.PartyControls;
  const Motion=typeof module!=='undefined'&&module.exports?require('./travel-motion.js'):root.TravelMotion;
  const Viewport=typeof module!=='undefined'&&module.exports?require('./canvas-viewport.js'):root.CanvasViewport;
  const D=root.WorldData,M=root.WorldModel,UI=root.PengpaiUI,Q=root.TimedChoice,X=root.CharacterExperience,copy=x=>JSON.parse(JSON.stringify(x)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const leaveLabels=new Set(['离开','告辞','改日再会','改日再请','暂不劳烦','稍后再来','先整顿一下']);
  class CanvasWorld{
    constructor(canvas,options){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.character=options.character;this.model=options.model||new M.World(this.character,options.progress?.world);this.hits=[];this.busts=new Map();this.panel=this.model.state.pendingReward?{type:'reward',reward:copy(this.model.state.pendingReward),started:performance.now(),scroll:0}:!this.model.state.departurePractice&&!this.model.pending&&this.model.state.introStep===0?{type:'mapIntro'}:!this.model.state.departurePractice&&this.model.state.introStep===1?{type:'mapGuide'}:null;this.knownCompanions=new Set([...this.model.state.companions.map(u=>u.id),...Object.keys(this.model.state.residents)]);this.selected=null;this.zoom=this.model.state.mapZoom;this.camera={x:0,y:0};this.revision=0;this.drawnRevision=-1;this.disposed=false;this.raf=0;this.battle=null;
      this.resize=this.resize.bind(this);this.down=this.down.bind(this);this.move=this.move.bind(this);this.up=this.up.bind(this);this.cancel=()=>{PartyInput.cancel(this);this.invalidate();};this.key=e=>{if(this.advanceWithKeyboard(e))return;if(e.key==='Escape'&&!this.battle){if(this.panel?.type==='journal'){this.closeWorldPanel();this.invalidate();return;}if(this.panel?.type==='event'){const leave=this.panel.decision.choices.find(c=>['leave','continue'].includes(c.action));if(leave)this.finishEvent(leave.id);return;}if(this.dialogue){if(this.dialogue.choices?.length>1)return;this.dialogueExit()?.();this.invalidate();return;}if(this.journey)return;if(this.panel?.type==='mapIntro'){this.advanceIntroduction();return;}if(this.panel?.type==='mapGuide'){this.finishIntroduction();return;}this.closeWorldPanel();this.dialogue=null;this.selected=null;this.invalidate();}};this.wheel=e=>{if(PartyInput.wheel(this,e))return;const p=this.scrollPanel();if(p&&['character','characterDetails','party','formation','npcObserve','npcSkill','passiveInfo','inventory','inventoryFilter','inventorySort','shop','reward','tasks','taskDetail','taskOffer','trackerOrder','journal','itemDetail','trophyDetail','trophyTarget','tactics','skillInfo','tavern'].includes(p.type)){e.preventDefault();p.scroll=clamp((p.scroll||0)+e.deltaY,0,p.maxScroll||0);this.invalidate();}};
      root.GameAssetLoader?.track?.(this,{onReady:src=>{this.townBackdrop=null;this.mapLayer=null;if(src===root.WorldMapArt?.textureSource)root.WorldMapArt.prepare(D,root.GameAssetLoader.peek);}});
      for(const [event,fn]of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['keydown',this.key],['wheel',this.wheel]])canvas.addEventListener(event,fn,{passive:false});
      this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);canvas.dataset.storyStage='world';this.resize();if(options.standalone)return;this.save(this.model.pending?.checkpoint);if(this.model.pending)Promise.resolve().then(()=>{if(!this.disposed)this.startBattle();});else if(this.panel?.type==='reward')this.animate();else if(this.model.state.departurePractice&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.resumeDeparturePractice();});else if(this.model.state.inside&&this.model.state.nodeId==='changshan'&&['available','entry'].includes(this.model.state.quests.changshan.stage)&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.startChangshanArrival();});else if(this.model.state.inside&&this.model.state.nodeId==='changshan'&&this.model.state.quests.changshan.stage==='escort'&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.startEscortArrival();});else if(this.model.state.quests.changshan.healerDecision&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.offerZhenStay();});else if(this.model.state.inside&&this.model.state.nodeId==='changshan'&&this.model.state.quests.changshan.stage==='return'&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.nearbyDialogue(this.model.sceneNpcs().find(n=>n.id==='changshan-elder'));});else if(this.model.state.quests.changshan.stage==='decision'&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.questDialogue(D.questNpcs.zhaoyun);});else if(this.model.state.chapterOne.stage==='aftermath'&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.showChapterEnding();});else if(this.requiredHeroScene()&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.resumeForcedHeroScene();});else if((this.model.journey||this.model.state.routeTarget)&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.startNextLeg();});
    }
    notify(text){this.notice={text,until:performance.now()+1700};clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>{this.notice=null;this.invalidate();},1700);this.noticeTimer?.unref?.();this.invalidate();}
    drawMainControls(){
      this.text(this.model.locationHeading(),18,34,16,'#eddcb5');
      const actions=[['人物',()=>{this.model.state.showParty=!this.model.state.showParty;this.save();this.boundCamera();}],['队伍',()=>{this.panel={type:'party',scroll:0};}],['任务',()=>{this.model.readQuests();this.panel={type:'tasks',category:this.model.state.questTab,scroll:0};this.save();}],['背包',()=>{this.panel={type:'inventory',scroll:0};}],['设置',()=>{this.panel={type:'menu'};}]];
      actions.forEach(([name,action],i)=>{const x=this.w-208+i*40;Panels.iconButton(this,name,x,17,34,action,name==='人物'&&this.model.state.showParty);if(name==='任务'&&this.model.state.questNotice?.unread){const c=this.ctx;c.save();c.globalAlpha=.55+.4*Math.sin(performance.now()*.004)**2;this.box(x-2,15,38,38,'#0000','#f1d083',5);c.globalAlpha=1;c.fillStyle='#edc56e';c.strokeStyle='#10242a';c.lineWidth=2;c.beginPath();c.arc(x+31,20,5,0,Math.PI*2);c.fill();c.stroke();c.restore();}});
    }
    drawQuestArrows(){
      const seen=new Set(),placed=[];
      for(const mark of this.frameCache?.markers||this.model.questMarkers()){
        if(seen.has(mark.place))continue;seen.add(mark.place);const node=D.placeMap[mark.place],p=this.screen(node);
        if(p.x>=18&&p.x<=this.w-18&&p.y>=76&&p.y<=this.partyTop()-135&&this.mapEntries?.some(e=>e.node.id===node.id))continue;
        let x=clamp(p.x,22,this.w-22),y=clamp(p.y,85,this.partyTop()-135);if(x>this.w-80&&y<210)x=this.w-100;
        for(let i=0;i<8&&placed.some(a=>Math.hypot(a.x-x,a.y-y)<38);i++)y=clamp(y+38,85,this.partyTop()-135);placed.push({x,y});
        const c=this.ctx;c.fillStyle=Panels.questColors[mark.taskStatus]||'#d7b864';c.beginPath();c.arc(x,y,13,0,7);c.fill();this.text('!',x,y,16,'#172c38','center');
        this.hits.push({x:x-17,y:y-17,w:34,h:34,label:'任务地点 '+node.name,action:()=>{this.selected=node.id;this.camera={x:node.x,y:node.y};this.boundCamera();}});
      }
    }
    openCharacter(id,previous=null){this.panel={type:'character',unitId:id,previous};}
    openItemDetail(item,options={}){this.notice=null;this.panel={type:item?.slot==='trophy'?'trophyDetail':'itemDetail',item,previous:this.panel,...options};}
    memberPreview(id){const unit=typeof id==='object'?id:this.model.members().find(u=>u.id===id)||this.model.npcUnit(id);return new root.BattleEngine.Battle({allies:unit.observationEnemy||unit.side==='enemy'?[]:[unit],enemies:unit.observationEnemy||unit.side==='enemy'?[unit]:[],rules:{tacticsEnemyCount:5,difficulty:this.model.character.difficulty},passives:root.WorldModel.heroPassives?.()});}
    openMemberTactics(id,previous){
      const proto=root.BattleSystem.CanvasBattle.prototype,editor=Object.assign(Object.create(proto),{canvas:this.canvas,ctx:this.ctx,image:src=>this.image(src),w:this.w,h:this.h,hits:[],textTextures:new Map(),dpr:this.dpr||1,panel:null,aim:null,battle:this.memberPreview(id),options:{onTacticsSave:unit=>{this.model.saveTactics(unit);this.save();}}});
      const unit=editor.battle.unit(id);unit.soldiers=Math.max(1,unit.soldiers);editor.openTactics(unit);const outer={type:'tacticsEditor',editor,previous};editor.closePanel=()=>{proto.closePanel.call(editor);if(!editor.panel)this.panel=previous||null;};this.panel=outer;
    }
    nearbyDialogue(npc){
      if(npc.role==='companion')return false;if(npc.dungeonRumor){this.speak(npc,{lines:npc.lines,choices:[{label:'记下地点',action:()=>{this.openQuestOffer(npc.dungeonRumor,{onAccept:()=>{if(this.model.acceptSide(npc.dungeonRumor)){this.save();this.panel=null;}}});}},{label:'告辞',dismiss:true,action:()=>this.closeDialogue()}]});return true;}
      if(npc.questId){const data=root.NearbyContent.sideQuests.find(t=>t.id===npc.questId);this.speak(npc,{lines:[data.id==='grain-escort'?'粮车就在我们这里。你们想把粮带走，先看看能不能从我们手里抢回去，别站在这里说废话！':'这段路现在由我们守着，想过去就把东西留下。要是不肯交，那就别怪我们动手了！'],choices:[{label:data.dungeon?'继续探索':'剿匪',action:()=>{if(this.model.beginSideBattle(data.id))this.startBattle();}},{label:'离开',dismiss:true,action:()=>this.closeDialogue()}]});return true;}const N=root.NearbyContent,q=this.model.state.quests.changshan;
      if(npc.id==='changshan-elder'&&q.stage==='return'){this.speak(npc,{lines:['你们总算回来了！刚才村口又闹起来，我还怕伤着车上的人。先把粮车推进院里吧，我叫乡亲们来帮忙卸。','这一趟让你们费心了，今晚就在村里歇着吧。住处已经收拾好了，乡亲们也想请大家吃顿饭，当面说声谢谢。'],onComplete:()=>{this.model.advanceChangshan();this.save();this.questDialogue(D.questNpcs.zhaoyun);}});return true;}
      if(npc.id==='grain-steward'&&q.stage==='supplies'){
        if(!q.healerRescued&&!q.healerJoined)this.speak(npc,{lines:['赵将军，你们来了，我正愁找不到人帮忙。贼不光占了粮仓，还把甄姑娘和几个伤者抓走了，说要让甄家拿粮来换人。','他们把人带到了毋极，赶车的跟过去打听了消息。你们先去找他，仓里的粮暂时搬不完，我留在这里看着，有变化就叫人通知你们。'],choices:[{label:'赶往毋极救人',action:()=>{q.stage='rescue';this.save();this.closeDialogue();}}]});
        else this.speak(npc,{lines:[q.grainWins?'前院剩下的人都退到后仓去了，我看见他们在往门口堆东西。里面全是粮袋，你们进去时慢一点，别让灯火碰上了。':this.model.members().some(u=>u.id==='zhenji')?'甄姑娘也回来了，救出来的伤者都安顿好了吗？仓里还有人守着，前院人数少一点，可以先从这边进去，再想办法进后仓。':'听说甄姑娘和伤者都平安了，我也放心了。仓里还有人守着，前院人数少一点，可以先从这边进去，再想办法进后仓。'],choices:[{label:q.grainWins?'夺取后仓':'夺取前仓',action:()=>{if(this.model.beginStoryBattle('grain'))this.startBattle();}},{label:'稍后再来',action:()=>this.closeDialogue()}]});return true;
      }
      if(npc.id==='refugee-laborer'&&q.stage==='rescue'){this.speak(npc,{lines:['是中山的仓守叫你们来的吧？甄姑娘就在祠堂后院，跟几个伤者关在一起。我刚才还听见她在跟守卫争，要他们拿水进去。','车停在墙后，等你们把门口的人拦住，我就进去接伤者。先让他们上车，我们再一起走，免得一直留在院子里被人抓住。'],choices:[{label:'救出甄姑娘',action:()=>{if(this.model.beginStoryBattle('rescue'))this.startBattle();else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'先整顿一下',action:()=>this.closeDialogue()}]});return true;}
      if(npc.id==='zhenji'){
        if(!q.healerJoined&&(q.healerRescued||['return','decision','complete'].includes(q.stage)))this.speak(npc,{lines:['这边的伤者已经有人接着照顾，我也能放心出门了。你们还缺人手吗？我学过些医术，若能同行，路上也好照看大家。'],choices:[{label:'请同行',action:()=>{if(this.model.recruitZhenJi()){this.save();this.closeDialogue();}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'改日再会',action:()=>this.closeDialogue()}]});
        else this.speak(npc,{lines:['让我看看手上的伤，好些了吗？你们在外面赶路，伤口容易磨开，觉得疼就告诉我，别等布条全湿了才想起来换。'],choices:[{label:'请她疗伤',action:()=>{this.model.rest();this.save();this.speak(npc,{lines:['已经重新包好了，你轻轻动一下，看看还有没有特别疼的地方。晚上要是又发热或者肿起来，记得来找我。']});}},{label:'聊聊药箱',action:()=>this.speak(npc,{lines:['这药箱是从家里带出来的，扣子坏过两回，我又找人修好了。里面的针和医书都用了很多年，哪样放在哪层，我已经很熟悉，换个新的反倒不习惯。']})},{label:'告辞',action:()=>this.closeDialogue()}]});return true;
      }
      const definition=N.npcs.find(n=>n.id===npc.id);if(!definition)return false;
      const variants=N.conversations?.[npc.id],lines=(['return','decision','complete'].includes(q.stage)&&variants?.afterReturn)||((q.healerRescued||q.healerJoined)&&variants?.afterRescue)||definition.lines;
      const talks=this.model.state.npcTalks[npc.id]||0;this.model.state.npcTalks[npc.id]=talks+1;const choices=[];
      if(npc.role==='healer'){const service=N.services.healing;choices.push({label:'疗伤 · '+service.price+service.currency,action:()=>{if(this.model.state.money>=service.price){this.model.state.money-=service.price;this.model.rest();this.save();this.speak(npc,{lines:['伤口都清理好了，你慢慢站起来试试。今天先别跑得太急，刚包扎的地方很容易又裂开，实在不舒服就回来找我。']});}else this.notify('铜钱不够，可以回黄巾营地找张宝治疗。');}});}
      if(npc.role==='merchant')for(const mode of ['buy','sell'])choices.push({label:mode==='buy'?'购买':'出售',action:()=>{this.dialogue=null;this.panel={type:'shop',shopMode:mode,scroll:0};}});
      for(const data of N.sideQuests.filter(t=>t.giver===npc.id)){const side=this.model.state.quests.side[data.id];if(!side.accepted)choices.push({label:(data.repeatable?'委托':'支线')+' · '+data.title,action:()=>{this.openQuestOffer(data.id,{onAccept:()=>{if(this.model.acceptSide(data.id)){this.save();this.speak(npc,{lines:[data.accept+' 他们就在'+D.placeMap[data.place].name+'那边。']});}}});}});else if(side.wins<data.rounds)choices.push({label:'询问'+data.title,action:()=>this.speak(npc,{lines:['他们还在'+D.placeMap[data.place].name+'那边。到了以后找找拦路的那伙人，把路上的麻烦处理好，再回来跟我说一声，我也好通知大家可以走了。']})});else if(!side.paid)choices.push({label:data.repeatable?'交付委托':'完成支线',action:()=>{const reward=this.model.turnInSide(data.id);if(reward){this.dialogue=null;this.save();this.showReward(reward);}}});else if(data.repeatable)choices.push({label:'再次探索',action:()=>{this.openQuestOffer(data.id,{onAccept:()=>{if(this.model.repeatSide(data.id)){this.save();this.panel=null;}}});}});else if(!choices.some(c=>c.label==='聊聊近况'))choices.push({label:'聊聊近况',action:()=>this.speak(npc,{lines:['这几天已经有人敢出门做事了，前阵子可是谁都不放心。你们替大家清了路，乡亲们一直惦记着这件事。']})});}
      if(choices.length){if(!choices.some(c=>c.label==='聊聊近况'))choices.push({label:'聊聊近况',action:()=>this.speak(npc,{lines:[lines[(talks+1)%lines.length]]})});choices.push({label:'告辞',action:()=>this.closeDialogue()});}
      const service=npc.role==='civilian'&&talks>0&&!this.model.state.serviceRumors.tavern?this.model.tavernRumor():null;if(service)this.model.hearRumor(service.id,service.place);this.save();this.speak(npc,{lines:[service?.text||lines[talks%lines.length]],choices:choices.length?choices:undefined});return true;
    }
    image(src){return root.GameAssetLoader?.get(src,this)||null;}
    advanceIntroduction(){this.model.state.introStep=1;this.panel={type:'mapGuide'};this.save();this.invalidate();}
    finishIntroduction(){this.model.state.introStep=2;this.panel=null;this.save();this.invalidate();if(this.model.state.routeTarget)this.startNextLeg();}
    suggestedDestination(){return this.model.questDestination();}
    closeWorldPanel(){if(this.renameInput)this.renameInput.hidden=true;if(['party','trackerOrder','tasks'].includes(this.panel?.type))PartyInput.cancel(this);if(this.panel?.type==='reward'){this.finishReward();return;}if(this.panel?.type==='practiceWeapons'){if(this.panel.editor.panel)this.panel.editor.closePanel();else this.showDepartureTrainer();return;}if(this.panel?.type==='tacticsEditor'){this.panel.editor.closePanel();return;}const previous=this.panel?.previous||null;if(previous?.type==='npcDialogue'){this.dialogue=previous.dialogue;this.panel=null;}else this.panel=previous;}
    interact(npc){if(npc.role==='tavern'){this.model.visitTavern();this.dialogue=null;this.panel={type:'tavern'};this.save();this.invalidate();return;}const court=Object.values(root.FactionCourts.definitions).find(d=>d.id===(npc.courtId||npc.id));if(court&&!this.model.state.courtDreams[court.id]&&!npc.delegate){this.showCourtDream(npc,court);return;}this.dialogue=null;this.npcInteraction={id:npc.id,offered:false};this.speak(npc);}
    observeNpc(npc){const unit=this.model.npcUnit(npc.id);if(!unit)return;const previous=this.dialogue?{type:'npcDialogue',dialogue:this.dialogue}:null,preview=this.memberPreview(unit);this.dialogue=null;this.panel={type:'character',unitId:unit.id,unit:preview.unit(unit.id),readonly:true,previous};}
    progress(state=this.model.snapshot()){return {storyVersion:2,stage:'world',index:0,dreamChoice:root.PengpaiPrologue.checkpoint(this.options.progress).dreamChoice,preparation:{},world:copy(state)};}
    celebrateCompanions(){
      if(!this.knownCompanions)return;
      const added=this.model.state.companions.filter(u=>!this.knownCompanions.has(u.id));
      for(const u of added)this.knownCompanions.add(u.id);
      if(!added.length)return;
      const u=added[added.length-1],unit=this.model.members().find(m=>m.id===u.id),type=root.WeaponCatalog.classification(unit.weapon)?.type.name||'徒手';
      this.recruitNotice={unit,names:added.map(u=>u.name).join('、'),detail:type+' · '+(this.model.state.activeIds.includes(u.id)?'已加入出战阵容':'已加入候补，可在队伍中上阵'),perks:root.AdventureFeedback.companionPerks(unit),until:performance.now()+4200};
      root.GameAudio?.play('victory');clearTimeout(this.recruitTimer);this.recruitTimer=setTimeout(()=>{this.recruitNotice=null;this.invalidate();},4200);this.recruitTimer?.unref?.();this.invalidate();
    }
    drawRecruitNotice(){
      const n=this.recruitNotice;if(!n||n.until<=performance.now()||this.panel)return;
      const x=16,y=58,w=this.w-32;this.box(x,y,w,78,'#202824f5','#998354',3);if(n.unit.portrait)this.portrait(n.unit.portrait,x+10,y+12,54);
      this.text(n.names+' · 同行',x+80,y+39,18,'#e6d5ad');this.text('›',x+w-20,y+39,24,'#af9a72','center');this.hits.push({x,y,w,h:78,label:'查看同伴能力',action:()=>{this.openCharacter(n.unit.id);this.recruitNotice=null;clearTimeout(this.recruitTimer);this.invalidate();}});
    }
    trackerBounds(){const count=this.model.trackedQuests().length,collapsed=this.model.state.trackerCollapsed;return {x:18,y:79,w:Math.min(250,this.w-36),h:36*(collapsed?1:Math.max(1,Math.min(3,count)))};}
    townContentTop(){return 79+36*3+22;}
    toggleTracker(){this.model.state.trackerCollapsed=!this.model.state.trackerCollapsed;this.save();this.invalidate();}
    drawCurrentObjective(){
      if(this.panel||this.dialogue||this.journey||this.recruitNotice?.until>performance.now()){this.trackerDragPanel=null;return;}const quests=this.model.trackedQuests(),f=this.trackerBounds(),collapsed=this.model.state.trackerCollapsed,canExpand=quests.length>1,draggable=!collapsed&&canExpand,c=this.ctx;
      this.box(f.x,f.y,f.w,f.h,'#18211fdf','#6f6b554d',2);if(!quests.length){this.trackerDragPanel=null;this.text('暂无追踪任务',f.x+12,f.y+18,14,'#89988b');return;}
      let scroll=0,p=null;if(draggable){p=this.trackerDragPanel||={type:'trackerHud',scrolls:{tracked:0},lastOffset:0};const max=Math.max(0,quests.length-3);this.trackerOffset=clamp(this.trackerOffset||0,0,max);if(this.trackerOffset!==p.lastOffset)p.scrolls.tracked=this.trackerOffset*36;p.scrolls.tracked=clamp(p.scrolls.tracked||0,0,max*36);scroll=p.scrolls.tracked;p.lastOffset=this.trackerOffset=Math.floor(scroll/36);p.rowHeight=36;p.scrollLimits={tracked:max*36};p.partyColumns=[{group:'tracked',x:f.x,y:f.y,w:f.w,h:f.h}];}else this.trackerDragPanel=null;
      const offset=Math.floor(scroll/36),shown=collapsed?quests.slice(0,1):quests.slice(offset,offset+3+(scroll%36?1:0)),before=this.hits.length;
      const row=(q,index,y,ghost=false)=>{const control=canExpand?32:0,grip=draggable?32:0,badgeX=f.x+f.w-50-control-grip,titleWidth=badgeX-(f.x+14)-10,titleSize=index===0?16:14;c.font=titleSize+'px '+UI.font;let title=q.title;while(title.length>1&&c.measureText(title+'…').width>titleWidth)title=title.slice(0,-1);if(title!==q.title)title+='…';if(ghost)this.box(f.x+2,y,f.w-4,36,'#343b2d','#c3aa70',2);if(index===0)this.box(f.x+1,y+8,2,20,'#b7a16d',null);this.text(title,f.x+13,y+18,titleSize,index===0?'#e4d7b7':'#b4bfac');this.text(q.recommendedLevel+'级',badgeX+17,y+18,14,'#94a28b','center');if(index&&!ghost)this.box(f.x+12,y,f.w-24,1,'#8c80531c',null);const handle={x:f.x+f.w-64,y,w:28,h:36};if(draggable)UI.dragGrip(this,handle.x,handle.y,handle.w,handle.h);if(ghost)return;this.hits.push({x:f.x+4,y,w:f.w-8-control,h:36,kind:draggable?'trackedQuest':undefined,unitId:q.id,cardX:f.x,cardY:y,cardW:f.w,dragHandle:handle,label:'任务详情 '+q.title+' 推荐'+q.recommendedLevel+'级',action:()=>{this.panel={type:'taskDetail',questId:q.id,previous:null,scroll:0};this.invalidate();}});};
      if(draggable){c.save();c.beginPath();c.rect(f.x,f.y,f.w,f.h);c.clip();}shown.forEach((q,i)=>{const index=collapsed?0:offset+i,y=f.y+(collapsed?0:index*36-scroll);if(p?.drag?.id===q.id){c.save();c.globalAlpha=.25;row(q,index,y);c.restore();}else row(q,index,y);});if(p?.drag?.overGroup==='tracked')this.box(f.x+5,f.y+p.drag.slot*36-scroll-2,f.w-10,2,'#ddc38a',null);if(draggable)c.restore();
      this.hits=this.hits.filter((h,i)=>{if(i<before)return true;const bottom=Math.min(f.y+f.h,h.y+h.h);h.y=Math.max(f.y,h.y);h.h=bottom-h.y;return h.h>0;});if(p?.drag){const index=quests.findIndex(q=>q.id===p.drag.id);if(index>=0)row(quests[index],index,clamp(p.drag.y-p.drag.offsetY,f.y,f.y+f.h-36),true);}
      if(!collapsed&&quests.length>3)for(const [r,direction,label]of [[1,-1,'上一项追踪'],[2,1,'下一项追踪']]){const x=f.x+f.w-32,y=f.y+r*36,enabled=direction<0?offset>0:offset+3<quests.length;UI.chevron(this,x,y,32,36,direction<0,enabled?'#c0b38f':'#54614d');if(enabled)this.hits.push({x,y,w:32,h:36,label,action:()=>{this.trackerOffset=offset+direction;this.invalidate();}});}
      if(canExpand){const x=f.x+f.w-32,label=collapsed?'展开任务追踪':'收起任务追踪';if(this.press?.hit?.label===label)this.box(x+3,f.y+5,26,26,'#41432c88',null,3);UI.chevron(this,x,f.y,32,36,!collapsed);this.hits.push({x,y:f.y,w:32,h:36,label,action:()=>this.toggleTracker()});}
    }
    rememberDialogue(){
      const d=this.dialogue;if(!this.model||!d?.lines[d.index])return;
      this.model.state.journal=Journal.append(this.model.state.journal,{name:d.npc.name,text:d.lines[d.index],chapter:this.model.location().name});
    }
    openJournal(previous=this.panel){this.rememberDialogue();this.panel={type:'journal',previous,scroll:null};this.invalidate();}
    save(state){this.rememberDialogue();this.character=this.model.character;this.celebrateCompanions();try{this.options.store.save(this.options.slot,this.character,this.progress(state));this.saveError=false;}catch{this.saveError=true;}}
    viewMembers(){const s=this.model.state,key=JSON.stringify([this.model.character,s.companions,s.weapon,s.weaponType,s.heroEquipment,s.troops,s.conditions,s.tactics]);if(this.memberSnapshot?.key!==key)this.memberSnapshot={key,units:this.model.members()};return this.memberSnapshot.units;}
    partyRects(){const key=[this.w,this.h,this.model.state.activeIds.length,this.model.activeLimit()].join('|');if(this.partyLayout?.key===key)return this.partyLayout.rects;const rects=root.BattleSystem.layout(this.w,this.h,this.model.state.activeIds.length,0,null,this.model.activeLimit());this.partyLayout={key,rects};return rects;}
    occupiedPartyRects(){
      const key=[this.w,this.h,this.model.state.showParty,this.character.appearance,this.model.state.activeIds.join(',')].join('|');if(this.occupiedLayout?.key===key)return this.occupiedLayout.rects;if(this.model.state.showParty===false)return [];const members=this.frameCache?.members||this.viewMembers(),rects=this.partyRects().map(r=>{const u=members.find(u=>u.id===this.model.state.activeIds[r.index]),art=u?.portrait||(root.CharacterAssets?.manifest.characters[u?.characterId||u?.id]?root.CharacterAssets.resolve(u.characterId||u.id).portrait:null),img=this.image(art?.src),source=art?.crop||{width:img?.naturalWidth||1,height:img?.naturalHeight||1},dst=img?root.BattleSystem.fitImage(source.width,source.height,{x:r.x,y:r.y,w:r.w,h:r.h-54}):null,top=Math.min(dst?.y??r.y+r.h-50,r.y+r.h-50);return {...r,y:top,h:r.y+r.h-top};});this.occupiedLayout={key,rects};return rects;
    }
    partyTop(){return Math.min(this.h-12,...this.occupiedPartyRects().map(r=>r.y));}
    resize(){if(this.disposed||this.battle)return;Object.assign(this,Viewport.resize(this.canvas,this.ctx));this.mapRect={x:0,y:0,w:this.w,h:this.h};this.zoom=Math.max(this.minimumZoom(),this.zoom);this.model.state.mapZoom=this.zoom;if(this.zoomAnimation)this.zoomAnimation.to=Math.max(this.minimumZoom(),this.zoomAnimation.to);if(!this.journey)this.focusLocation();this.invalidate();}
    panelAnimating(){if(this.trackerDragPanel?.drag)return true;if(this.panel?.type==='tasks'&&this.model.quests().some(q=>q.category===(this.panel.category||'story')&&['available','ready'].includes(q.taskStatus)))return true;if(this.model.state.inside&&!this.panel&&!this.dialogue&&this.townQuestAnimating)return true;if(!this.panel&&!this.dialogue&&!this.battle&&this.model.state.questNotice?.unread)return true;if(['party','trackerOrder','tasks'].includes(this.panel?.type)&&this.panel.drag)return true;if(this.zoomAnimation)return true;if(this.panel?.type==='character'){const u=this.panel.unit||this.model.members().find(u=>u.id===this.panel.unitId);return !!u&&!u.dead&&(u.startSoldiers??u.soldiers??u.maxSoldiers)>0;}return this.panel?.type==='reward'&&performance.now()-this.panel.started<(this.panel.animationDuration??1700);}
    idleVisible(){return this.model.state.showParty!==false&&!this.dialogue&&(!this.panel||['event','slidingPuzzle'].includes(this.panel.type))&&!this.battle&&!this.disposed&&this.viewMembers().some(u=>this.model.state.activeIds.includes(u.id)&&u.startSoldiers>0);}
    invalidate({visualOnly=false}={}){if(this.disposed)return;if(!visualOnly)this.revision++;if(this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;if(!this.battle){this.tickZoom(performance.now());this.tickJourney();this.draw();if((this.journey&&!this.journey.paused)||this.idleVisible()||this.panelAnimating())this.animate();}});}
    animate(){
      if(this.disposed||this.raf||this.battle)return;
      this.raf=requestAnimationFrame(()=>{
        this.raf=0;if(this.disposed||this.battle)return;const now=performance.now();
        // 交互后的重绘不能被待机限帧丢弃，否则动画停止后点击区域会一直过期。
        if(this.drawnRevision===this.revision&&(!this.journey||this.journey.paused)&&now-(this.idleFrameAt||0)<33){if(this.idleVisible()||this.panelAnimating())this.animate();return;}
        this.idleFrameAt=now;this.tickZoom(performance.now());this.tickJourney();this.draw();if((this.journey&&!this.journey.paused)||this.idleVisible()||this.panelAnimating())this.animate();
      });
    }
    minimumZoom(){return Math.max(.18,((this.h||this.mapRect.h)+160)/(D.bounds.height-260),((this.w||this.mapRect.w)+160)/(D.bounds.width-200));}
    changeZoom(factor){
      const now=performance.now(),target=clamp((this.zoomAnimation?.to??this.zoom)*factor,this.minimumZoom(),3.6);this.tickZoom(now);this.zoomAnimation={from:this.zoom,to:target,started:now,duration:220};this.model.state.mapZoom=target;this.save();this.invalidate();
    }
    tickZoom(now){const tween=this.zoomAnimation;if(!tween)return;const t=clamp((now-tween.started)/tween.duration,0,1);this.zoom=tween.from+(tween.to-tween.from)*(1-(1-t)**3);this.boundCamera();if(t>=1)this.zoomAnimation=null;}
    focusLocation(){const p=this.model.location();this.camera.x=p.x;this.camera.y=p.y;this.boundCamera();}
    boundCamera(){const a=this.mapAnchor(),r=this.mapRect,left=(a.x-r.x)/this.zoom,right=(r.x+r.w-a.x)/this.zoom,top=(a.y-r.y)/this.zoom,bottom=(r.y+r.h-a.y)/this.zoom;this.camera.x=left+right>=D.bounds.width-200?D.bounds.width/2:clamp(this.camera.x,left+100,D.bounds.width-right-100);this.camera.y=top+bottom>=D.bounds.height-260?D.bounds.height/2:clamp(this.camera.y,top+110,D.bounds.height-bottom-150);}

    point(e){return Viewport.point(this.canvas.getBoundingClientRect(),e);}
    mapAnchor(){if(this.frameCache?.anchor)return this.frameCache.anchor;const r=this.mapRect,anchor={x:r.x+r.w/2,y:this.w&&this.h&&D.bounds.height*this.zoom>r.h?Math.min(this.h/2,(68+this.destinationBounds().y)/2):r.y+r.h/2};if(this.frameCache)this.frameCache.anchor=anchor;return anchor;}
    screen(p){const a=this.mapAnchor();return{x:a.x+(p.x-this.camera.x)*this.zoom,y:a.y+(p.y-this.camera.y)*this.zoom};}
    text(value,x,y,size=14,color='#e3e9e5',align='left'){const c=this.ctx;c.font=`${UI.textSize(size)}px ${UI.font}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(String(value),x,y);}
    box(x,y,w,h,fill='#151e20f5',stroke='#746d58',radius=3){UI.surface(this.ctx,x,y,w,h,fill,stroke,radius);}
    button(label,x,y,w,h,action,options={}){UI.button(this,label,x,y,w,h,action,options);}
    wrap(value,x,y,width,{size=14,line=22,color='#bdcdd0'}={}){this.ctx.font=`${UI.textSize(size)}px ${UI.font}`;const rows=UI.wrapLines(this.ctx,value,width);rows.forEach((row,i)=>this.text(row,x,y+i*line,size,color));return y+rows.length*line;}
    down(e){
      if(PartyInput.down(this,e))return;
      if(this.battle||e.button!==0||this.press)return;const p=this.point(e),matches=[...this.hits].reverse().filter(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h);let hit=matches[0];if(hit?.placeId)hit=matches.filter(h=>h.placeId).sort((a,b)=>Math.hypot(p.x-a.center.x,p.y-a.center.y)-Math.hypot(p.x-b.center.x,p.y-b.center.y))[0];const r=this.mapRect;
      // 第二次点同一地图节点可在下一帧之前到达；只有选点这一种原地变化能沿用命中区域。
      const repeatNode=!!hit?.placeId&&!this.panel&&!this.dialogue&&!this.journey&&!this.model.state.inside&&hit?.placeId===this.lastTap?.id&&hit?.placeId===this.selected;
      if(this.drawnRevision!==this.revision&&!repeatNode)return;
      this.press={id:e.pointerId,...p,hit,revision:this.revision,moved:false,camera:{...this.camera},townScroll:this.townScroll||0,scroll:this.scrollPanel()?{panel:this.scrollPanel(),start:this.scrollPanel().scroll||0}:null,pan:(!hit||!!hit.placeId)&&!this.panel&&!this.dialogue&&!this.journey&&!this.model.state.inside&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h};this.canvas.setPointerCapture?.(e.pointerId);
    }
    move(e){if(PartyInput.move(this,e))return;const press=this.press;if(!press||press.id!==e.pointerId)return;const p=this.point(e),dx=p.x-press.x,dy=p.y-press.y;if(Math.hypot(dx,dy)>7)press.moved=true;if(press.hit?.kind==='puzzle'){press.hit.drag(dx,dy,false);return;}if(!this.panel&&this.model.state.inside&&press.moved){this.townScroll=Math.max(0,(press.townScroll||0)-dy);this.invalidate();}else if(press.hit?.kind==='slider'&&Math.abs(dx)>Math.abs(dy)){press.moved=true;press.hit.change(p.x);this.invalidate();}else if(press.scroll&&press.moved){press.scroll.panel.scroll=clamp(press.scroll.start-dy,0,press.scroll.panel.maxScroll||0);this.invalidate();}else if(press.pan&&press.moved){this.camera.x=press.camera.x-dx/this.zoom;this.camera.y=press.camera.y-dy/this.zoom;this.boundCamera();this.invalidate();}}
    up(e){if(PartyInput.up(this,e))return;const p=this.press;if(!p||p.id!==e.pointerId)return;this.press=null;if(p.hit?.kind==='puzzle'){const end=this.point(e);p.hit.drag(end.x-p.x,end.y-p.y,true);return;}if(this.battle||p.moved||p.revision!==this.revision||!p.hit)return;const q=this.point(e),h=p.hit;if(q.x<h.x||q.x>h.x+h.w||q.y<h.y||q.y>h.y+h.h)return;if(h.kind==='slider')h.change(q.x);else h.action?.();this.invalidate();}
    draw(){
      if(this.disposed||this.battle)return;root.GameAudio?.setScene(this.model.state.nodeId==='camp'||this.model.state.inside?'camp':'map');PartyInput.tick(this,performance.now());this.model.refreshQuestNotice();this.frameCache={members:this.viewMembers()};const c=this.ctx,w=this.w,h=this.h;c.fillStyle='#071923';c.fillRect(0,0,w,h);this.hits=[];
      if(!this.model.state.inside&&this.dialogue?.npc.role!=='guard'&&root.GameAssetLoader&&root.WorldMapArt){const texture=this.image(root.WorldMapArt.textureSource),buildings=this.image(root.WorldMapArt.buildingSource);if(!texture||!buildings){this.frameCache=null;return;}}
      if(this.model.state.inside)this.drawTown();else if(this.dialogue?.npc.role==='guard')this.drawTownBackdrop();else this.drawMap();
      if(!this.journey&&!this.dialogue)this.drawMainControls();
      if(!this.dialogue&&this.panel?.type!=='mapIntro'&&this.model.state.showParty!==false)this.drawPartyBar();
      this.drawCurrentObjective();if(this.dialogue)this.drawDialogue();if(this.panel)this.drawPanel();this.drawRecruitNotice();if(this.notice?.until>performance.now()){this.box(20,this.h/2-28,this.w-40,56,'#102b36f5','#b7a279');this.text(this.notice.text,this.w/2,this.h/2,14,'#efdfb9','center');}if(this.saveError)this.text('存档写入失败',w/2,h-12,14,'#e5a17d','center');this.drawnRevision=this.revision;
      this.canvas.setAttribute('aria-label',`大地图，${this.model.location().name}，${this.model.state.inside?'城镇内':'城镇外'}。附近：${this.model.neighbors().map(p=>p.name).join('、')}。${this.journey?'正在前往'+D.placeMap[this.journey.to].name:''}${this.panel?({tavern:'酒肆招募',tavernOffer:'招募详情',tavernRefresh:'批量刷新',tasks:'行旅手记',taskDetail:'任务详情',taskOffer:'任务邀请',trackerOrder:'追踪',journal:'行旅回顾',itemDetail:'装备详情',trophyDetail:'遗物详情',trophyFilter:'遗物筛选',trophySort:'遗物排序',trophyTarget:'选择佩戴者',inventory:'背包',menu:'菜单',party:'队伍',mapIntro:this.character.name+'：这里离常山很近，可以先去那里看看。',mapGuide:'点击地点选中，双击自动沿最短路线前往。',notice:this.panel.title,reward:[this.panel.reward?.title||(this.panel.reward?.completedQuest?'任务完成':'战斗胜利'),...(this.panel.reward?.gains||[]).map(g=>g.name+'经验增加'+g.amount+(g.after>g.before?'，升至'+g.after+'级':''))].filter(Boolean).join('。'),event:this.panel.event?.title}[this.panel.type]||''):''}${this.dialogue?'。'+this.dialogue.npc.name+'：'+this.dialogue.lines[this.dialogue.index]:''}`);this.frameCache=null;
    }
    terrain(){return root.WorldMapArt.terrain(this,D);}
    selectPlace(id,now=performance.now()){
      if(this.journey)return;const previous=this.lastTap;this.selected=id;this.lastTap={id,time:now};
      if(previous?.id===id&&now-previous.time<450&&id!==this.model.state.nodeId&&this.model.findRoute(id)){this.lastTap=null;this.travel(id);}
    }
    drawMap(){
      const c=this.ctx,r=this.mapRect,marks=this.model.questMarkers();if(this.frameCache)this.frameCache.markers=marks;
      let entries;if(this.zoomAnimation)entries=this.drawMapRegion(r,marks);else{
        const pad=192,anchor=this.mapAnchor(),key=JSON.stringify([this.w,this.h,this.dpr,this.zoom,anchor.x,anchor.y,this.model.state.nodeId,this.selected,this.model.state.routeTarget,marks.map(m=>[m.place,m.taskStatus])]);
        let layer=this.mapLayer,dx=layer?(layer.camera.x-this.camera.x)*this.zoom:0,dy=layer?(layer.camera.y-this.camera.y)*this.zoom:0;
        if(!layer||layer.key!==key||Math.abs(dx)>pad-48||Math.abs(dy)>pad-48){
          const canvas=layer?.canvas||document.createElement('canvas'),w=this.w+pad*2,h=this.h+pad*2,dpr=this.dpr||1,pw=Math.ceil(w*dpr),ph=Math.ceil(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}const lc=canvas.getContext('2d');lc.setTransform(1,0,0,1,0,0);lc.clearRect(0,0,pw,ph);lc.setTransform(dpr,0,0,dpr,pad*dpr,pad*dpr);const previous=this.ctx;this.ctx=lc;
          try{entries=this.drawMapRegion({x:-pad,y:-pad,w,h},marks);}finally{this.ctx=previous;}
          layer=this.mapLayer={canvas,key,camera:{...this.camera},entries,w,h};this.mapLayerBuilds=(this.mapLayerBuilds||0)+1;dx=dy=0;
        }
        c.drawImage(layer.canvas,-pad+dx,-pad+dy,layer.w,layer.h);
        const shift=box=>({...box,x:box.x+dx,y:box.y+dy});entries=layer.entries.map(e=>({...e,p:shift(e.p),icon:shift(e.icon),label:shift(e.label)})).filter(e=>[e.icon,e.label].some(box=>box.x<r.x+r.w&&box.x+box.w>r.x&&box.y<r.y+r.h&&box.y+box.h>r.y));
      }
      this.mapEntries=entries;c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
      for(const {node,p,icon,label}of entries){for(const [box,center]of [[icon,p],[label,{x:label.x+label.w/2,y:label.y+label.h/2}]]){const x=Math.max(r.x,box.x),y=Math.max(r.y,box.y),w=Math.min(r.x+r.w,box.x+box.w)-x,h=Math.min(r.y+r.h,box.y+box.h)-y;if(w>0&&h>0)this.hits.push({x,y,w,h,center,placeId:node.id,action:()=>this.selectPlace(node.id)});}}
      this.drawTraveler();c.restore();if(this.dialogue)return;const shade=c.createLinearGradient(0,0,0,76);shade.addColorStop(0,'#07192390');shade.addColorStop(1,'#07192300');c.fillStyle=shade;c.fillRect(0,0,this.w,76);
      this.button('+',this.w-52,118,34,34,()=>this.changeZoom(D.mapRules.zoomStep));this.button('−',this.w-52,160,34,34,()=>this.changeZoom(1/D.mapRules.zoomStep));Panels.iconButton(this,'定位',this.w-52,204,34,()=>this.focusLocation());this.drawQuestArrows();if(this.panel?.type!=='mapIntro')this.drawDestination();
    }
    drawMapRegion(r,marks){
      const c=this.ctx,near=new Set(this.model.neighbors().map(p=>p.id));c.fillStyle='#6eabb8';c.fillRect(r.x,r.y,r.w,r.h);const terrain=this.terrain(),viewport=this.terrainViewport(r);if(viewport[0]<0||viewport[1]<0||viewport[0]+viewport[2]>terrain.width||viewport[1]+viewport[3]>terrain.height)root.WorldMapArt.ocean(this,r);c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.imageSmoothingQuality='high';c.drawImage(terrain,...viewport);
      const markerByPlace=new Map();for(const mark of marks)if(!markerByPlace.has(mark.place))markerByPlace.set(mark.place,mark);const context={current:this.model.state.nodeId,selected:this.selected,suggested:this.suggestedDestination(),quests:new Set(marks.map(q=>q.place)),near},route=this.model.findRoute(this.model.state.routeTarget||this.selected),routeEdges=new Set((route?.nodes||[]).slice(1).map((id,i)=>[route.nodes[i],id].sort().join('|')));
      c.font=`14px ${UI.font}`;const entries=D.mapLayout.planView(D.places,{...context,zoom:this.zoom,toScreen:p=>this.screen(p),viewport:r,textWidth:name=>c.measureText(name).width,obstacles:[this.trackerBounds(),{x:0,y:0,w:this.w,h:68},{x:this.w-74,y:110,w:64,h:140},...this.occupiedPartyRects(),this.destinationBounds()]});
      this.mapRoads||=D.roads.map(([a,b])=>{const points=D.roadPath(a,b);return {a,b,points,minX:Math.min(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxX:Math.max(...points.map(p=>p.x)),maxY:Math.max(...points.map(p=>p.y))};});const scale=D.geography.rasterScale,west=viewport[0]/scale-10/this.zoom,north=viewport[1]/scale-10/this.zoom,east=(viewport[0]+viewport[2])/scale+10/this.zoom,south=(viewport[1]+viewport[3])/scale+10/this.zoom;
      for(const {a,b,points,minX,minY,maxX,maxY}of this.mapRoads){if(maxX<west||minX>east||maxY<north||minY>south)continue;const available=a===this.model.state.nodeId||b===this.model.state.nodeId,planned=routeEdges.has([a,b].sort().join('|'));
        if(!planned&&(!D.mapLayout.visibleAt(D.placeMap[a],this.zoom,context)||!D.mapLayout.visibleAt(D.placeMap[b],this.zoom,context)))continue;
        c.strokeStyle=planned?'#efd19b':available?'#c0b08d':'#5c513e66';c.lineWidth=planned?3:available?2.4:1;c.setLineDash(planned||available?[]:[4,5]);c.beginPath();points.forEach((point,i)=>{const p=this.screen(point);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.stroke();
      }c.setLineDash([]);
      // 缩放只决定地点层级；标签固定在建筑旁，屏幕边缘直接裁切。
      for(const {node,p,icon,label,important,size}of [...entries].reverse()){
        const current=node.id===this.model.state.nodeId,selected=node.id===this.selected,available=near.has(node.id),suggested=context.quests.has(node.id);c.save();c.globalAlpha=important?1:.8;
        this.drawPlaceIcon(node,p,{current,selected,available,suggested,size});if(suggested){this.ctx.fillStyle=Panels.questColors[markerByPlace.get(node.id)?.taskStatus]||'#d5ad63';this.ctx.beginPath();this.ctx.arc(p.x+size*.55,p.y-size,7,0,7);this.ctx.fill();this.text('!',p.x+size*.55,p.y-size,14,'#283245','center');}
        this.box(label.x,label.y,label.w,label.h,'#1b2c27e8',current?'#e9cb88':suggested?'#b7a2ca':'#96896b99',3);this.text(node.name,label.x+label.w/2,label.y+label.h/2,14,current?'#ffe3a0':suggested?'#e2c9ff':'#ece0c7','center');c.restore();

      }
      c.restore();return entries;
    }
    drawPlaceIcon(node,p,options){root.WorldMapArt.settlement(this,node,p,options);}
    terrainViewport(r=this.mapRect){const a=this.mapAnchor(),scale=D.geography.rasterScale;return [(this.camera.x+(r.x-a.x)/this.zoom)*scale,(this.camera.y+(r.y-a.y)/this.zoom)*scale,r.w/this.zoom*scale,r.h/this.zoom*scale,r.x,r.y,r.w,r.h];}

    artSprite(art,width,height){
      const img=this.image(art?.src);if(!img)return null;const source=art.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight},dst=root.BattleSystem.fitImage(source.width,source.height,{x:0,y:0,w:width,h:height}),dpr=this.dpr||1,key=[art.src,source.x,source.y,source.width,source.height,Math.ceil(dst.w*dpr),Math.ceil(dst.h*dpr)].join('|');this.artSprites||=new Map();let sprite=this.artSprites.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=Math.max(1,Math.ceil(dst.w*dpr));sprite.height=Math.max(1,Math.ceil(dst.h*dpr));const c=sprite.getContext('2d');c.imageSmoothingQuality='high';c.drawImage(img,source.x,source.y,source.width,source.height,0,0,sprite.width,sprite.height);if(this.artSprites.size>=40)this.artSprites.delete(this.artSprites.keys().next().value);this.artSprites.set(key,sprite);}return {sprite,w:dst.w,h:dst.h};
    }
    warmTravelArt(){if(!this.ctx||!this.w||!this.h)return;const members=this.viewMembers();for(const r of this.partyRects()){const u=members.find(u=>u.id===this.model.state.activeIds[r.index]);if(u?.portrait)this.artSprite(u.portrait,r.w,r.h-54);}const leader=members.find(u=>u.id===this.model.state.activeIds[0]);if(leader)this.artSprite(leader.fullbody||leader.portrait,36,52);}
    travelerPose(){
      const j=this.journey,anchor=this.screen(j?D.roadPosition(j.from,j.to,j.progress):this.model.location()),unit=(this.frameCache?.members||this.viewMembers()).find(u=>u.id===this.model.state.activeIds[0]);return {anchor,unit,art:unit?.fullbody||unit?.portrait};
    }
    drawTraveler(){
      const {anchor,unit,art}=this.travelerPose(),c=this.ctx,img=this.image(art?.src);if(!unit)return;
      root.WorldMapArt.locator(this,anchor,performance.now());const box={x:anchor.x-18,y:anchor.y-52,w:36,h:52};
      if(img){const cached=this.artSprite(art,box.w,box.h),dst={x:box.x+(box.w-cached.w)/2,y:box.y+box.h-cached.h,w:cached.w,h:cached.h};root.BattleSystem.CanvasBattle.prototype.drawGroundShadow.call(this,dst);c.drawImage(cached.sprite,dst.x,dst.y,dst.w,dst.h);}
      else{c.fillStyle='#152a3680';c.beginPath();c.ellipse(anchor.x,anchor.y,10,3,0,0,7);c.fill();this.text(unit.name.slice(0,1),anchor.x,anchor.y-16,16,'#edddbb','center');}
    }
    destinationBounds(){return {x:(this.w-Math.min(460,this.w-28))/2,y:Math.max(78,this.partyTop()-120),w:Math.min(460,this.w-28),h:106};}
    destinationRect(){return this.journey||D.placeMap[this.selected]?this.destinationBounds():null;}

    drawDestination(){
      const f=this.destinationRect();if(!f)return;const node=D.placeMap[this.selected],x=f.x+14,w=f.w-28,y=f.y;this.box(f.x,y,f.w,f.h,'#09212bed','#6b898b');this.hits.push({...f,label:'地点信息',action:()=>{}});
      if(this.journey){const target=D.placeMap[this.model.state.routeTarget||this.journey.to];this.text('前往 '+target.name,x,y+20,16,'#ead8ad');this.text('途经 '+D.placeMap[this.journey.to].name,x,y+44,14,'#bdcdd0');this.text('行速 '+Number((1/D.travelTimeFactor(this.journey.speedPotential??50)).toFixed(2))+'倍',x+w,y+44,14,'#bdcdd0','right');if(this.model.state.routeTarget)this.button('停止行路',x,y+66,w,30,()=>{this.model.cancelRoute();this.save(this.model.journey?.checkpoint);});else this.text('到下个地点停下',x,y+80,14,'#bdcdd0');return;}
      const current=node.id===this.model.state.nodeId,route=this.model.findRoute(node.id),kind={city:'城池',village:'村县',port:'渡口',pass:'关隘',camp:'营地'}[node.kind];this.text(node.name,x,y+20,16,'#ead8ad');this.text(node.requiresWater?'水路尚未开通':current?kind:route?kind+' · 途经 '+(route.nodes.length-1)+' 段道路':'暂无可通行道路',x,y+44,14,'#bdcdd0');
      this.button('×',f.x+f.w-38,y+7,28,28,()=>{this.selected=null;});
      if(current&&!node.requiresWater){this.button(this.entering?'正在进入':node.kind==='city'?'进城':node.kind==='camp'?'入营':node.kind==='village'?'进村':'查看',x,y+66,(w-8)/2,30,()=>this.tryEnter(),{disabled:!!this.entering});this.button('路过',x+(w+8)/2,y+66,(w-8)/2,30,()=>{this.selected=null;});}
      else this.button(node.requiresWater?'水路未开通':route?'前往':'无法到达',x,y+66,w,30,()=>this.travel(node.id),{disabled:!route||node.requiresWater});
    }

    drawPartyBar(){
      const c=this.ctx,members=this.frameCache?.members||this.viewMembers(),rects=this.partyRects();this.partyBarRects=rects;
      for(const r of rects){const u=members.find(u=>u.id===this.model.state.activeIds[r.index]);if(!u)continue;let drawnPortrait=null;const art=u.portrait||(root.CharacterAssets?.manifest.characters[u.characterId||u.id]?root.CharacterAssets.resolve(u.characterId||u.id).portrait:null),img=this.image(art?.src),hp=u.startSoldiers??u.maxSoldiers,y=r.y+r.h-50;
        c.save();if(hp<=0)c.globalAlpha=.4;if(img){const source=art.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight},dst=root.BattleSystem.fitImage(source.width,source.height,{x:r.x,y:r.y,w:r.w,h:r.h-54});drawnPortrait=dst;const dpr=this.dpr||1;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(img,source.x,source.y,source.width,source.height,Math.round(dst.x*dpr)/dpr,Math.round(dst.y*dpr)/dpr,Math.round(dst.w*dpr)/dpr,Math.round(dst.h*dpr)/dpr);}c.restore();
        this.box(r.x,y,r.w,22,'#10171d','#75a8b5');const g=c.createLinearGradient(0,y,0,y+22);g.addColorStop(0,'#f33b33');g.addColorStop(.55,'#ad0009');g.addColorStop(1,'#e5221c');c.fillStyle=g;c.fillRect(r.x+2,y+2,(r.w-4)*clamp(hp/u.maxSoldiers,0,1),18);this.text(hp<=0?(u.dead?'濒死':'重伤'):Math.floor(hp),r.x+4,y+11,14,'#fff0ec');this.box(r.x,y+27,r.w,23,'#091e29','#75a8b5');this.text(u.name,r.x+r.w/2,y+38.5,14,'#75dbe7','center');
        if(!this.journey&&!this.dialogue&&!this.panel)this.hits.push({x:r.x,y:Math.min(drawnPortrait?.y??y,y),w:r.w,h:r.y+r.h-Math.min(drawnPortrait?.y??y,y),label:u.name+' · 状态',action:()=>this.openCharacter(u.id)});
      }
    }

    portrait(art,x,y,size,{frame=true}={}){const image=root.GameAssetLoader?.get(art?.src);if(frame)this.box(x,y,size,size,'#19343a','#668995');if(!image)return;const crop=art.crop||{x:0,y:0,width:image.naturalWidth,height:image.naturalHeight},c=this.ctx;c.save();c.beginPath();c.rect(x,y,size,size);c.clip();const scale=Math.max(size/crop.width,size/crop.height);c.drawImage(image,crop.x,crop.y,crop.width,crop.height,x+(size-crop.width*scale)/2,y+(size-crop.height*scale)/2,crop.width*scale,crop.height*scale);c.restore();}
    npcRole(npc){
      if(['healer','heal','training','merchant','companion','tavern'].includes(npc.role))return npc.role;
      if(this.model.npcQuestStatus(npc))return 'story';
      return ['civilian','rumor'].includes(npc.role)||npc.dungeonRumor?'rumor':null;
    }
    roleIcon(role,x,y,size=25,status=null){if(status){Panels.questIcon(this,status,x,y,size);return;}
      if(!role)return;const ids={training:'shortBlade',merchant:'背包',companion:'人物',tavern:'人物',story:'任务'};
      if(!ids[role]&&!['rumor','heal','healer'].includes(role))return;this.box(x,y,size,size,'#10232bee',null,3);
      if(role==='heal'||role==='healer'){const c=this.ctx,thick=Math.max(5,Math.round(size*.28)),length=Math.round(size*.76),cx=x+size/2,cy=y+size/2;c.save();c.fillStyle='#74bf73';c.fillRect(cx-thick/2,cy-length/2,thick,length);c.fillRect(cx-length/2,cy-thick/2,length,thick);c.restore();return;}
      if(ids[role])root.RpgIcons.draw(this.ctx,ids[role],x+1,y+1,size-2,{image:src=>this.image(src)});
      else{const c=this.ctx;c.save();c.beginPath();c.roundRect(x+3,y+4,size-6,size-11,3);c.moveTo(x+8,y+size-7);c.lineTo(x+5,y+size-2);c.lineTo(x+14,y+size-7);c.fillStyle='#c1d6cf';c.fill();c.fillStyle='#355461';for(let i=0;i<3;i++){c.beginPath();c.arc(x+8+i*4,y+10,1,0,7);c.fill();}c.restore();}
    }
    tryEnter(){
      if(this.disposed||this.battle||this.dialogue||this.entering||this.journey||this.model.journey||this.model.pending)return false;
      const nodeId=this.model.state.nodeId,scene=D.townScenes[nodeId]||D.townScenes.default,loader=root.GameAssetLoader;
      if(scene?.background&&loader?.preload&&!(loader.peek?loader.peek(scene.background):loader.get(scene.background))){
        const request=this.entryRequest={nodeId};this.entering=true;this.invalidate();
        loader.preload([scene.background],{priority:0}).then(()=>{if(this.disposed||this.entryRequest!==request)return;this.entryRequest=null;this.entering=false;if(this.model.state.nodeId===nodeId&&!this.journey&&!this.model.journey)this.tryEnter();this.invalidate();}).catch(()=>{if(this.disposed||this.entryRequest!==request)return;this.entryRequest=null;this.entering=false;this.notify('场景未能加载，请重试。');this.invalidate();});return true;
      }
      if(this.model.enter()){this.dialogue=null;this.selected=null;this.save();if(nodeId==='changshan'&&['available','entry'].includes(this.model.state.quests.changshan.stage))this.startChangshanArrival();else if(nodeId==='changshan'&&this.model.state.quests.changshan.stage==='escort')this.startEscortArrival();else if(!this.resumeForcedHeroScene()){const npc=this.model.entryQuestNpc();if(npc)this.interact(npc.heroQuest?{...npc,selectedQuest:true}:npc);}this.invalidate();return true;}
      const node=this.model.location(),text=node.kind==='village'?'村里正在查问外来的人，今天不许进去。你们先到路边等着，别把门口堵住，有了吩咐再说。':'你们有通行文书吗？没有就先退开，现在不放人进城。别一直站在这里，再拦着路，我就叫人把你们赶出去。';this.speak(D.gateGuard,{lines:[text]});this.invalidate();return false;
    }
    questDialogue(npc){
      const q=this.model.state.quests.changshan,stage=q.stage;
      if(npc.id==='zhaoyun'&&['available','entry'].includes(stage)){this.startChangshanArrival();return;}
      if(npc.id==='zhaoyun'&&q.zhaoInvitation){this.offerZhaoJourney();return;}
      if(npc.id==='zhaoyun'&&stage==='decision'){this.speak(npc,{lines:['粮食分下去了，伤者也都安顿好了，乡亲们终于能安心歇几天。这次要不是你帮忙，救人和运粮赶在一起，我一个人确实照顾不过来。','我一直想去成都看看，听说玄德公在那里安置了不少流民。现在村里的事安排好了，如果你还缺人，我可以先陪你走一段，等到了那边再一起去见他。'],choices:[{label:'留下同行（推荐）',action:()=>this.finishZhaoQuest(true)},{label:'先去成都',action:()=>this.finishZhaoQuest(false)}]});return;}
      if(npc.id==='zhaoyun'){this.speak(npc,{lines:[{supplies:'中山有座粮仓，之前答应送粮到常山，后来却一直没有消息。我想过去问问，你愿不愿意一起？路上多个人，也能互相照应。',rescue:'仓守说，赶车的人已经跟到毋极去了，知道甄姑娘被关在哪里。我们先去找他，把人救出来，粮仓那边再回来处理。',escort:'粮都装好了，伤者也坐上了车。你在前面带路，我在后面照看，要是有人喊停，就等一等，别让车夫为了赶路把伤者颠坏了。',return:'乡亲们出来迎接了，我们先把粮车推进院子。里正知道哪几户急着用粮，让他安排分发，别全堵在村口。',complete:'这几天已经有人在修农具，商量着什么时候回田里看看了。能重新种地，大家就不用总靠别人送粮，我也能放心一些。'}[stage]||'稍等我一会儿，我去问问乡亲们还缺什么，确认都安排好就回来。']});return;}
      this.nearbyDialogue(npc);
    }
    startChangshanArrival(){
      const q=this.model.state.quests.changshan;if(this.disposed||this.battle||this.dialogue||this.model.pending||this.model.journey||this.model.state.nodeId!=='changshan'||!['available','entry'].includes(q.stage))return false;
      const fight=()=>{if(!this.disposed&&this.model.beginStoryBattle('entry'))this.startBattle();};if(q.arrivalSeen){fight();return true;}
      const turns=root.NearbyContent.storyConversations.changshanEntry,speakers={villager:{id:'entry-villager',name:'村民',art:'villager',side:'left'},hero:{id:'hero',name:this.character.name,art:'hero',side:'right'},thief:{id:'entry-thief',name:'盗贼',art:'thief',side:'left'},zhaoyun:{...D.questNpcs.zhaoyun,name:'青年枪客'}};
      const show=()=>{if(this.disposed)return;const line=turns[q.arrivalIndex];this.speak(speakers[line.speaker],{lines:[line.text],forced:true,onComplete:()=>{if(this.disposed)return;if(q.arrivalIndex+1<turns.length){q.arrivalIndex++;show();}else{q.arrivalSeen=true;q.arrivalIndex=0;this.save();fight();}}});this.save();this.invalidate();};show();return true;
    }
    startEscortArrival(){
      const q=this.model.state.quests.changshan;if(this.disposed||this.battle||this.dialogue||!this.model.canBeginStoryBattle('escort'))return false;
      const fight=()=>{if(!this.disposed&&this.model.beginStoryBattle('escort'))this.startBattle();};if(q.escortIntroSeen){fight();return true;}
      const turns=root.NearbyContent.storyConversations.escortArrival,speakers={villager:{id:'escort-villager',name:'村民',art:'villager',side:'left'},hero:{id:'hero',name:this.character.name,art:'hero',side:'right'},thief:{id:'escort-thief',name:'盗匪头目',art:'brigand',side:'left'},zhaoyun:D.questNpcs.zhaoyun};
      const show=()=>{const turn=turns[q.escortIntroIndex];this.speak(speakers[turn.speaker],{lines:[turn.text],forced:true,onComplete:()=>{if(this.disposed)return;if(q.escortIntroIndex+1<turns.length){q.escortIntroIndex++;show();}else{q.escortIntroSeen=true;q.escortIntroIndex=0;this.save();fight();}}});this.save();this.invalidate();};show();return true;
    }
    requiredHeroScene(){return Object.values(root.HeroQuests.definitions).find(d=>root.HeroQuests.place(d.id,this.model.state.heroQuests[d.id])===this.model.state.nodeId&&d.stages[this.model.state.heroQuests[d.id]?.stage]?.strictDialogue);}
    resumeForcedHeroScene(){if(this.disposed||this.dialogue||this.panel||this.battle||this.model.pending||this.journey)return false;const d=this.requiredHeroScene();if(!d)return false;this.heroQuestDialogue(root.HeroQuests.npc(d.id,this.model.state.heroQuests[d.id]));this.invalidate();return true;}
    heroQuestDialogue(npc){
      if(!npc)return;const alternatives=Object.values(root.HeroQuests.definitions).filter(d=>this.model.heroQuestVisible(d)&&root.HeroQuests.place(d.id,this.model.state.heroQuests[d.id])===this.model.state.nodeId&&root.HeroQuests.npc(d.id,this.model.state.heroQuests[d.id])?.id===npc.id);if(alternatives.length>1&&!npc.selectedQuest){this.speak(npc,{lines:['正好你们来了，这几件事我都记着。你想先问哪一件，我们坐下来慢慢说。'],choices:[...alternatives.map(d=>({label:d.title,action:()=>this.heroQuestDialogue({...root.HeroQuests.npc(d.id,this.model.state.heroQuests[d.id]),selectedQuest:true})})),{label:'告辞',dismiss:true,action:()=>this.closeDialogue()}]});return;}const id=npc.heroQuest,d=root.HeroQuests.definitions[id],stage=this.model.state.heroQuests[id].stage,data=d.stages[stage].npc;if(!data)return;
      const forced=!!d.stages[stage].strictDialogue,turns=data.turns||data.lines.map(text=>({speaker:'npc',text}));
      const choices=[...data.choices.map((choice,index)=>({label:choice.label+(choice.price?' · '+choice.price+'文':''),action:()=>{
        if(!this.model.chooseHeroQuest(id,index,stage)){this.notify(this.model.lastQuestError||'暂时不能进行。');return;}
        this.dialogue=null;this.save();if(choice.puzzle){this.panel={type:'slidingPuzzle',questId:id};return;}if(this.model.pending){this.startBattle();return;}
        if(this.model.state.heroQuests[id].stage==='complete')this.speak({...npc,name:d.name||'甘宁',art:id},{lines:[choice.recruit?'我把东西收拾好就来。你们在门口歇一会儿，不用急着先走，有什么要带的也可以一起检查。':((d.home||'jianye')===this.model.state.nodeId?'我就留在':'我先回')+D.placeMap[d.home||'jianye'].name+'等你们。路上多保重，以后还需要人帮忙，来找我就好。'],onComplete:()=>{if(this.model.state.pendingReward)this.showReward(this.model.state.pendingReward);}});
        else if(root.HeroQuests.place(id,this.model.state.heroQuests[id])===this.model.state.nodeId)this.heroQuestDialogue({...root.HeroQuests.npc(id,this.model.state.heroQuests[id]),selectedQuest:true});
      }})),...(forced?[]:[{label:'暂且离开',dismiss:true,action:()=>this.closeDialogue()}])];
      if(!forced&&this.npcInteraction?.id===npc.id&&!this.npcInteraction.offered&&this.model.npcUnit(npc.id)){this.npcInteraction.offered=true;choices.splice(Math.max(0,choices.length-1),0,{label:'观察',action:()=>this.observeNpc(npc)});}
      const show=index=>{if(this.disposed||this.model.state.heroQuests[id].stage!==stage)return;const turn=turns[index],actor=turn.speaker==='hero'?{id:'hero',name:this.character.name,art:'hero',side:'right',sceneId:npc.sceneId}:turn.speaker==='npc'?npc:{...(root.RecruitmentContent.actors[turn.speaker]||npc),sceneId:npc.sceneId},last=index===turns.length-1;this.speak(actor,{lines:[turn.text],forced,choices:last?choices:undefined,onComplete:last?undefined:()=>show(index+1)});this.invalidate();};show(0);
    }
    openQuestOffer(questId,options={}){this.dialogue=null;this.panel={type:'taskOffer',questId,scroll:0,previous:null,...options};this.invalidate();}
    offerZhaoJourney(){this.openQuestOffer('changshan',{offerObjective:'前往中山打听粮车下落，帮助常山取回乡粮。',offerDescription:'村里的粮快吃完了，中山答应送来的也一直没到。我想过去问问，可这边还需要人照看，正好你来了，我也想问问你愿不愿意帮忙。\n你能不能陪我去一趟中山？先把粮车的情况问清楚，办完这件事，乡亲们才能有饭吃，我也能放心考虑以后的安排。',onAccept:()=>{if(this.model.startChangshan()){this.save();this.speak(D.questNpcs.zhaoyun,{lines:['那我们一起去中山。先找那里的仓守，他认得送粮的人，应该知道粮车为什么一直没有出发。']});}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}});}

    offerZhenStay(){this.speak(D.questNpcs.zhenji,{lines:['药箱和粮食都找回来了，这一趟我也总算帮上了忙。看着那些伤者都坐上车，我才觉得能安心离开这里。','之前救出来的人已经有人照顾，我想继续跟你们同行，不知道你们方不方便？暂时人手够了，我就先回毋极，有需要再来找我。'],choices:[{label:'留下同行（推荐）',action:()=>{if(this.model.finishZhenStay(true)){this.save();this.speak(D.questNpcs.zhenji,{lines:['那我就跟大家一起走。药箱我会带着，路上谁觉得不舒服，早点告诉我，也好在严重之前处理。']});}}},{label:'先回毋极',action:()=>{if(this.model.finishZhenStay(false)){this.save();this.speak(D.questNpcs.zhenji,{lines:['好，我先回毋极照顾那边的伤者。你们以后要找我，问问甄家的侍女就知道我在哪里，她会带你们过来。']});}}}]});}

    finishZhaoQuest(stay){if(!this.model.finishChangshan(stay))return;this.save();this.speak(D.questNpcs.zhaoyun,{lines:[stay?'我愿意继续跟你走。村里的事情已经安顿好，我们先把你手里的事办完，以后有机会再一起去成都。':'我先去成都看看那边的情况。你以后经过成都，记得来找我，需要一起出门帮忙的话，也不用再客气。','你说想找些愿意出来做事的人，我倒听过一点消息。前些天有北海来的乡亲，说那里有人替百姓解了围。是谁我也没问清，你若往东走，不妨去那边问问。','不过北海离这儿可不近，沿路什么情形，我也没摸清。常山的樵夫正为山道上的贼发愁，巨鹿那边也有人在找失了消息的粮车。不妨先去帮帮他们，添些盘缠，把兵器使顺手了，再走这趟远路。']});}
    scrollPanel(){return ['tacticsEditor','practiceWeapons'].includes(this.panel?.type)?this.panel.editor.panel:this.panel;}
    resumeDeparturePractice(){
      if(this.model.state.departurePractice==='training'){this.showDepartureTrainer();return;}
      const npc=D.townNpcs.camp.find(n=>n.id==='zhangliang');this.speak(npc,{lines:['兵器挑好了？要不要先在这儿试试手？我陪你练练，免得上了路才发现使不顺。','那边有个稻草人，不会还手，正好先试试招式。觉得顺手了，再找个人陪你过几招；不急这一会儿。'],choices:[{label:'先练练手',action:()=>{this.model.state.departurePractice='training';this.save();this.showDepartureTrainer();}},{label:'先赶路',dismiss:true,action:()=>this.finishDeparturePractice()}]});this.invalidate();
    }
    showDepartureTrainer(){
      this.panel=null;this.speak(D.townNpcs.camp.find(n=>n.id==='zhangliang'),{lines:['想先试哪样？兵器用着不顺就再换一件，多试几下。等你说走，我送你到营门口。'],choices:this.trainerChoices()});this.invalidate();
    }
    finishDeparturePractice(){
      this.model.state.departurePractice=null;this.model.leave();this.dialogue=null;this.panel=this.model.state.introStep===0?{type:'mapIntro'}:this.model.state.introStep===1?{type:'mapGuide'}:null;this.selected=null;this.focusLocation();this.save();this.invalidate();
    }
    openPracticeWeapons(){
      if(this.model.state.departurePractice!=='training'||this.model.pending||this.battle)return false;
      const editor=Object.assign(Object.create(root.PengpaiStory.CanvasStory.prototype),{canvas:this.canvas,ctx:this.ctx,options:this.options,character:this.model.character,departureWorld:this.model,progress:{stage:'departure',world:this.model.snapshot()},weaponChoice:this.model.state.weaponType,departureConfirmLabel:'继续操练',hits:[],busts:new Map(),image:src=>this.image(src),save:()=>this.save(),draw:()=>this.invalidate(),leave:()=>this.showDepartureTrainer(),depart:()=>{this.save();this.showDepartureTrainer();}});
      this.dialogue=null;this.panel={type:'practiceWeapons',editor};this.invalidate();return true;
    }
    trainerChoices(){
      const npc=D.townNpcs.camp.find(n=>n.id==='zhangliang'),practice=this.model.state.departurePractice==='training',choices=D.trainingOptions.filter(t=>!practice||['straw-dummy','militia-one'].includes(t.id)).map(t=>({label:t.label,action:()=>this.startTraining(t.id)}));
      if(practice){choices.push({label:'重选兵器',action:()=>this.openPracticeWeapons()},{label:'结束操练，出营',dismiss:true,action:()=>this.finishDeparturePractice()});return choices;}
      choices.push({label:'聊聊操练',action:()=>this.speak(npc,{lines:['刚开始练，不用一下叫太多人上来。你还在看眼前这个，旁边的人已经出手了，先把自己的兵器使顺手，再慢慢学着照看周围。','先找一个人陪你练，熟悉以后再多叫几个。受了伤也不用怕，我二哥就在旁边照看，总比出了营门才发现自己不会应付强。']})});
      if(this.model.state.trainingWins['three-brothers']&&!this.model.state.companions.some(u=>u.id==='zhangliang'))choices.push({label:'请你同行',action:()=>this.inviteZhangLiang()});
      choices.push({label:'告辞',dismiss:true,action:()=>this.closeDialogue()});return choices;
    }
    speak(npc,{lines,choices,onComplete,forced=false}={}){
      if(!lines&&npc.role==='chapter'){this.chapterDialogue(npc);return;}
      if(!lines&&npc.role==='court'){this.courtDialogue(npc);return;}
      if(!lines&&npc.role==='rumor'){const rumor=this.model.townRumor();if(rumor)this.model.hearRumor(rumor.id,rumor.place);this.save();this.speak(npc,{lines:rumor?[rumor.text]:npc.lines});return;}
      if(!lines&&npc.heroQuest){this.heroQuestDialogue(npc);return;}
      if(!lines&&this.nearbyDialogue(npc))return;
      if(!lines&&npc.id==='zhenji'&&npc.role!=='companion'){this.questDialogue(npc);return;}
      if(!lines&&npc.role==='story'){this.questDialogue(npc);return;}
      if(!lines&&npc.role==='companion'){this.speak(npc,{lines:[{zhangliang:'你们回来了？我在营里待了好几天，正想出去走走。这回准备去哪儿，要不要也带上我？',zhaoyun:'这一路还顺利吗？我这里已经安排好了，你们如果又准备出门，可以叫上我一起，不用特意绕去别处找人。',zhenji:'正好你们回来，我想看看上次的伤养好了没有。如果接下来还要赶路，也可以带上我，有人照顾大家会方便一些。'}[npc.id]||'我这边的事情已经忙完了。你们下一站准备去哪里？需要我帮忙的话，我随时都能跟着走。'],choices:[{label:'请你同行',action:()=>{if(this.model.inviteResident(npc.id)){this.save();this.dialogue=null;}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},...this.serviceQuestChoices(npc),{label:'改日再会',action:()=>this.closeDialogue()}]});return;}
      if(!lines){if(npc.role==='advice')lines=this.model.campAdvice();else if(npc.role==='heal'){lines=['身上又添了新伤？来这边坐，我替你们一个个看看。伤重的先把外衣松开，别等着等着又把伤口磨破了。'];choices=[{label:'请先生医治',action:()=>{this.model.rest();this.save();this.speak(npc,{lines:['都处理好了，先喝口水歇一会儿吧。你们一直在外头走，身体也得缓缓，没必要刚包好伤就急着动身。']});}},{label:'暂不劳烦',action:()=>{this.dialogue=null;}}];}else if(npc.role==='training'){lines=['想来练练吗？教场这会儿正空着。我找几个人陪你，或者你想直接跟我比一场，也可以自己挑。'];choices=this.trainerChoices();}else lines=npc.lines||[];}
      if(!forced&&!onComplete&&!this.model.state.departurePractice&&['advice','heal','training'].includes(npc.role)){const topics=this.serviceQuestChoices(npc);if(topics.length)choices=[...(choices||[]).filter(c=>!leaveLabels.has(c.label)),...topics,{label:'告辞',dismiss:true,action:()=>this.closeDialogue()}];}
      const initialInteraction=this.npcInteraction?.id===npc.id&&!this.npcInteraction.offered;if(initialInteraction&&!forced&&!onComplete)this.npcInteraction.offered=true;
      if(initialInteraction&&!forced&&!onComplete&&(!choices?.length||choices.some(c=>c.dismiss||leaveLabels.has(c.label)))&&this.model.npcUnit(npc.id)){choices=[...(choices||[])];const exit=choices.findIndex(c=>c.dismiss||leaveLabels.has(c.label));choices.splice(exit<0?choices.length:exit,0,{label:'观察',action:()=>this.observeNpc(npc)});if(exit<0)choices.push({label:'离开',dismiss:true,action:()=>this.closeDialogue()});}
      this.panel=null;this.dialogue={npc,lines,index:0,choices:choices||null,onComplete,forced:forced||!!onComplete||!!(choices?.length&&!choices.some(c=>c.dismiss||leaveLabels.has(c.label)))};
    }
    serviceQuestChoices(npc){return Object.values(root.HeroQuests.definitions).filter(d=>{const q=this.model.state.heroQuests[d.id];return this.model.heroQuestVisible(d,q)&&!['locked','complete'].includes(q.stage)&&root.HeroQuests.place(d.id,q)===this.model.state.nodeId&&root.HeroQuests.npc(d.id,q)?.id===(npc.courtId||npc.id);}).map(d=>({label:d.title,action:()=>this.heroQuestDialogue({...root.HeroQuests.npc(d.id,this.model.state.heroQuests[d.id]),selectedQuest:true})}));}
    chapterDialogue(npc){
      const q=this.model.state.chapterOne,C=root.ChapterOne;
      if(q.stage==='aftermath'){this.showChapterEnding();return;}
      if(!this.model.coalitionReady()){this.speak(npc,{lines:['各路人还没有到齐，守关的兵也没有撤。你们如果还有同伴在外面，就先去接应，别只带这几个人急着闯关。']});return;}
      const stage=['gather','rally'].includes(q.stage)?'vanguard':q.stage==='gate'&&this.model.state.story.flags.lvbuConvinced?'street':q.stage,phase=C.phases[stage];if(!phase)return;
      const begin=()=>{if(this.model.beginChapterBattle()){this.save(this.model.pending.checkpoint);this.startBattle();}};
      const introduction=stage==='dongzhuo'?'府里的伤兵说，董卓一直盯着伤得最重的人砍，拿盾挡在前面也没用。你们最好多带几位能治伤的人，先商量好谁接着救人，别一见人倒下，就把所有治疗都用在同一个时候。':stage==='vanguard'?'魏、蜀、吴来接应的人都到了，城外的百姓也已经从西边撤走。前面是华雄守的关口，我们可以准备过去了，进城以后还有守军，得一段一段看清楚再往前走。':'前面就是'+phase.title+'。受伤的人先留在这里包扎，你们准备出战的也把兵器检查一下。后面有我们接应，安排妥当以后再过去。';
      if(!q.accepted){this.openQuestOffer('chapter-one',{offerDescription:introduction,offerObjective:'与联军合力打通虎牢关，攻入洛阳，查明董卓异变。',onAccept:()=>{this.panel=null;this.playConversation([{npc:{id:phase.speaker,name:root.ChapterCast.definitions[phase.speaker].name,art:phase.speaker,side:'left'},lines:phase.lines}],begin);}});return;}
      this.speak(npc,{lines:[introduction],choices:[{label:'前往接战',action:()=>this.playConversation([{npc:{id:phase.speaker,name:root.ChapterCast.definitions[phase.speaker].name,art:phase.speaker,side:'left'},lines:phase.lines}],begin)},{label:'先整顿一下',dismiss:true,action:()=>this.closeDialogue()}]});
    }
    showChapterEnding(){
      if(this.model.state.chapterOne.stage!=='aftermath')return;this.panel=null;const rows=root.ChapterOne.ending;
      const show=()=>{const index=this.model.state.chapterOne.endingIndex;if(index>=rows.length){this.model.completeChapterOne();this.save();this.dialogue=null;this.panel={type:'notice',title:'第一章结束',text:'洛阳的战事已经停下来了。其他还没办完的事情可以继续，董卓也会留在太师府，你可以再去找他谈谈。'};this.invalidate();return;}
        const row=rows[index];this.speak({...row,name:row.id==='hero'?this.character.name:row.name},{lines:[row.text],forced:true,onComplete:()=>{this.model.state.chapterOne.endingIndex=index+1;this.save();show();}});this.invalidate();};show();
    }
    showCourtDream(npc,data){
      this.dialogue=null;this.panel=null;const hero={id:'hero',name:this.character.name,art:'hero',side:'right'},rows={
        simayi:[[npc,['之前有人请你到'+D.placeMap[data.place].name+'找我吗？我昨晚做了一场很奇怪的梦，有人特意告诉我，会有一位从很远的地方来的客人。我想先确认一下，是不是说的你。']],[hero,['他们也去过你的梦里？那真是太好了。我本来还在发愁，该怎么跟你解释自己的来历，怕你听完以后觉得我在胡说。']],[npc,['我起初也没当回事，可你今天真的来了，就不能再只当成普通的梦。既然你想找人一起处理眼前的麻烦，我们可以从手头的事情开始商量。']]],
        zhugeliang:[[npc,['你就是那位从未来来的客人吧？昨晚三位先生托梦给我，说你会到这里来，还让我留意一下你的消息。我原先还在想，该怎么认出你。']],[hero,['他们也没给我能证明身份的东西，我自己都怕说不清楚。这一路遇到的很多事情，跟我知道的历史又不一样，我还在慢慢弄明白。']],[npc,['不用急着证明，你先坐下，把一路的事情告诉我。三位先生只说了你为什么来，具体要怎么做，我们还得一起商量，能帮的我会尽量帮。']]],
        zhouyu:[[npc,['昨晚我做了个梦，三位先生说会有个远来的客人，帮江东寻找愿意做事的人。我还以为是这几天想招人的事想多了，没想到你今天就来了。']],[hero,['他们倒是替我先介绍过了。不过有件事得说在前面，我只是知道一些人的经历，不是到哪里都能把事情办好，很多地方还得请你们帮忙。']],[npc,['你愿意先把这些说明白，往后合作就方便多了。你在外面打听人，我替你联系江东的住处和人手，遇到难办的事情，咱们再一起商量。']]]
      }[data.id];this.playConversation(rows.map(([npc,lines])=>({npc,lines})),()=>{this.model.state.courtDreams[data.id]=true;this.save();this.interact(npc);});
    }
    courtDialogue(npc){
      const data=root.FactionCourts.definitions[npc.country],ruler=root.FactionCourts.rulerStatus(this.model,npc.country),pending=this.model.pendingReports(npc.country),visits=this.model.state.npcTalks[npc.id]||0,lines=npc.delegate?['先生已经跟我交代过了，你们介绍来的人，由我负责登记。赏钱和需要的文书也都准备好了，有什么事情直接来找我就行。']:pending.length?[data.thanks]:ruler.complete?[ruler.restored]:visits?[data.idle]:data.welcome,choices=[],topics=this.serviceQuestChoices(npc);
      this.model.state.npcTalks[npc.id]=visits+1;
      if(pending.length)choices.push({label:'领取赏钱 · '+pending.length*root.FactionCourts.rewardPerHero+'文',action:()=>{const reward=this.model.claimRecruitReward(npc.country);if(reward){this.dialogue=null;this.save();this.showReward(reward);}else this.notify('这份赏钱已经领过了。');}});
      choices.push({label:'询问'+ruler.name+'下落',action:()=>{
        if(ruler.complete){this.speak(npc,{lines:[this.model.state.companions.some(u=>u.id===ruler.id)?ruler.name+'正与你们同行。府里的交接已经办好，你们放心出门，有急事我会托人送信。':ruler.restored],choices:[{label:'还有别的事',action:()=>this.courtDialogue(npc)}]});return;}
        if(!ruler.ready){this.speak(npc,{lines:ruler.before,choices:[{label:'我再去打听人选',action:()=>this.courtDialogue(npc)}]});return;}
        const q=this.model.state.heroQuests[ruler.id];q.accepted=true;this.save();const at=root.HeroQuests.place(ruler.id,q);if(at===this.model.state.nodeId)this.heroQuestDialogue({...root.HeroQuests.npc(ruler.id,q),selectedQuest:true});else this.speak(npc,{lines:['你们上次说的事，我已经让人去安排了。眼下的线索还在'+D.placeMap[at].name+'，先去那里看看。要是路上受了伤，就回来歇一歇，不必硬撑着赶路。'],choices:[{label:'那我们先去看看',action:()=>this.closeDialogue()}]});
      }});
      if(topics.length)choices.unshift(...topics);
      if(this.model.state.residents[npc.id])choices.push({label:'请你同行',action:()=>{if(this.model.inviteResident(npc.id)){this.save();this.closeDialogue();}else this.notify(this.model.lastRecruitError);}});
      choices.push({label:'打听消息',action:()=>{const rumor=this.model.townRumor();if(rumor)this.model.hearRumor(rumor.id,rumor.place);this.save();this.speak(npc,{lines:rumor?[rumor.text]:['最近还没有收到新的消息。你们要是准备出门，可以去附近的村子多问问，过路的人常在那里歇脚，说不定有人知道。']});}},{label:'告辞',dismiss:true,action:()=>this.closeDialogue()});
      this.save();this.speak(npc,{lines,choices});
    }
    playConversation(turns,onComplete){const next=index=>{if(index>=turns.length){onComplete?.();return;}const turn=turns[index];this.speak(turn.npc,{lines:turn.lines,onComplete:()=>next(index+1)});};next(0);}
    advanceWithKeyboard(e){
      if(!['Enter',' '].includes(e.key)||e.repeat||this.battle||this.panel||this.journey||!this.dialogue)return false;
      const d=this.dialogue,last=d.index===d.lines.length-1;if(last&&d.choices?.length!==undefined&&d.choices.length!==1)return false;
      e.preventDefault();if(last&&d.choices?.length===1)d.choices[0].action();else this.advanceDialogue();this.invalidate();return true;
    }
    dialogueExit(){const d=this.dialogue;if(!d||d.forced)return null;return d.choices?.find(c=>c.dismiss||leaveLabels.has(c.label))?.action||(()=>this.closeDialogue());}
    closeDialogue(){const d=this.dialogue;this.rememberDialogue();this.dialogue=null;if(this.model)this.save();d?.onComplete?.();}
    advanceDialogue(){const d=this.dialogue;if(!d)return;this.rememberDialogue();if(d.index<d.lines.length-1){d.index++;this.rememberDialogue();if(this.model)this.save();}else if(!d.choices)this.closeDialogue();}
    inviteZhangLiang(){
      const npc=D.townNpcs.camp.find(n=>n.id==='zhangliang');if(!this.model.recruitZhangLiang()){if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);return;}this.save();this.speak(npc,{lines:['我去跟大哥说一声，再拿上自己的东西。你们在营门口等我一会儿，我很快就来，这回可别忘了带我。']});
    }
    drawTownBackdrop(){
      const w=this.w,h=this.h,c=this.ctx,node=this.model.location(),scene=D.townScenes[node.id]||D.townScenes.default,imageReady=root.GameAssetLoader?.get(scene.background),key=[scene.background,!!imageReady,w,h,this.dpr].join('|');if(this.townBackdrop?.key!==key){const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(w*this.dpr));canvas.height=Math.max(1,Math.ceil(h*this.dpr));const ctx=canvas.getContext('2d'),img=root.GameAssetLoader?.get(scene.background);ctx.scale(this.dpr,this.dpr);ctx.fillStyle='#152b2d';ctx.fillRect(0,0,w,h);if(img){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);ctx.drawImage(img,(w-img.naturalWidth*scale)/2,(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}ctx.fillStyle='#06192335';ctx.fillRect(0,0,w,h);this.townBackdrop={key,canvas};}c.drawImage(this.townBackdrop.canvas,0,0,w,h);if(!this.dialogue){c.fillStyle='#071923ed';c.fillRect(0,0,w,68);}
    }
    drawTown(){
      this.drawTownBackdrop();if(this.dialogue)return;const source=this.model.sceneNpcs(),c=this.ctx,key=this.model.state.nodeId;
      if(this.npcPageNode!==key){this.npcPageNode=key;this.npcPage=0;this.npcQuestOnly=false;}
      const npcs=this.npcQuestOnly?source.filter(n=>this.model.npcQuestStatus(n)):source,tracking=this.trackerBounds(),gridTop=this.townContentTop();this.button(this.npcQuestOnly?'全部人物':'任务人物',this.w-118,tracking.y,100,30,()=>{this.npcQuestOnly=!this.npcQuestOnly;this.npcPage=0;this.invalidate();});const grid=root.TownLayout.plan(this.w,gridTop,this.partyTop()-61,npcs.length,this.npcPage);this.npcPage=grid.page;this.townQuestAnimating=false;
      for(const r of grid.rects){c.font=`14px ${UI.font}`;const npc=npcs[r.index],art=npc.art?root.CharacterAssets.resolve(npc.art).portrait:null,img=art?this.image(art.src):null,nameLines=UI.wrapLines(c,npc.name,r.w-6),nameH=nameLines.length>1?34:26,pictureH=Math.max(12,r.h-nameH),status=this.model.npcQuestStatus(npc);
        this.box(r.x,r.y,r.w,r.h,'#0b2530','#5c7d88');if(img){const a=art.crop,dst=root.BattleSystem.fitImage(a.width,a.height,{x:r.x+1,y:r.y+1,w:r.w-2,h:pictureH-2});c.drawImage(img,a.x,a.y,a.width,a.height,dst.x,dst.y,dst.w,dst.h);}else if(npc.icon)root.RpgIcons.draw(c,npc.icon,r.x+8,r.y+8,Math.min(r.w-16,pictureH-12),{image:src=>this.image(src)});
        nameLines.slice(0,2).forEach((line,i)=>this.text(line,r.x+r.w/2,r.y+pictureH+(nameLines.length>1?9+i*15:13),14,'#e0dfc8','center'));const iconSize=Math.min(25,r.w*.28);this.roleIcon(this.npcRole(npc),r.x+r.w-iconSize-3,r.y+pictureH-iconSize-3,iconSize);if(status)Panels.questIcon(this,status,r.x+r.w-29,r.y+4,25);this.hits.push({...r,label:npc.name+' · '+npc.roleLabel,action:()=>this.interact(npc)});
      }
      if(grid.pager){const p=grid.pager;this.button('上一页',18,p.y,86,32,()=>{this.npcPage=Math.max(0,grid.page-1);this.invalidate();},{disabled:grid.page===0});this.text((grid.page+1)+' / '+grid.pages,this.w/2,p.y+16,14,'#cbbd9c','center');this.button('下一页',this.w-104,p.y,86,32,()=>{this.npcPage=Math.min(grid.pages-1,grid.page+1);this.invalidate();},{disabled:grid.page===grid.pages-1});}
      if(!npcs.length)this.text('这里暂无待办人物',this.w/2,gridTop+64,14,'#a5b3a0','center');
      this.button(this.model.state.nodeId==='camp'?'出营':'离开',18,this.partyTop()-48,this.w-36,36,()=>{this.model.leave();this.dialogue=null;this.save();this.focusLocation();});
    }
    drawDialogue(){
      this.rememberDialogue();
      const d=this.dialogue,w=this.w,h=this.h,c=this.ctx,last=d.index===d.lines.length-1,choices=last&&d.choices?d.choices:[{label:'继续',action:()=>this.advanceDialogue()}],columns=choices.length>3?2:1,rows=Math.ceil(choices.length/columns),buttonH=choices.length>3?36:40,gap=7;
      const textLeft=26,textWidth=w-textLeft*2;c.font=`16px ${UI.font}`;const textRows=UI.wrapLines(c,d.lines[d.index],textWidth),panelH=Math.min(h-114,90+textRows.length*25+rows*(buttonH+gap)+22),top=h-panelH,side=d.npc.side||'left';
      if(d.npc.art)root.PengpaiStory.CanvasStory.prototype.bust.call(this,d.npc.art,side,top,true);
      const fade=c.createLinearGradient(0,top-24,0,h);fade.addColorStop(0,'#081b2600');fade.addColorStop(.2,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,w,panelH+24);c.strokeStyle='#bcab8644';c.beginPath();c.moveTo(24,top+45);c.lineTo(w-24,top+45);c.stroke();this.text(d.npc.name,side==='right'?w-26:26,top+24,16,'#ead1a2',side==='right'?'right':'left');
      textRows.forEach((text,i)=>this.text(text,textLeft,top+71+i*25,16,'#e4e7de'));this.hits=[];
      const y=h-20-rows*(buttonH+gap),bw=(textWidth-gap*(columns-1))/columns;choices.forEach((choice,i)=>{const full=columns===2&&i===choices.length-1&&choices.length%2===1;this.button(choice.label,textLeft+(i%columns)*(bw+gap),y+Math.floor(i/columns)*(buttonH+gap),full?textWidth:bw,buttonH,choice.action);});UI.singleChoiceHit(this.hits,w,h,choices);
    }
    drawNpcObserve(){
      const p=this.panel,b=p.preview,u=b.unit(p.unitId),c=this.ctx,f=this.frame('观察',620),left=f.x+20,right=f.x+f.w-20,inner=f.w-40,compact=this.h<640,art=root.CharacterAssets.resolve(p.npc.art).portrait,proto=root.BattleSystem.CanvasBattle.prototype;
      this.portrait(art,left,f.y+51,52);this.text(u.name,left+65,f.y+65,18,'#ead8b6');this.text(u.level+'级',left+65,f.y+91,14,'#c0d0d0');const type=root.PengpaiRules.WEAPON_TYPES.find(t=>t.id===u.weapon?.type);if(type)this.text(type.style,right,f.y+91,14,'#b4c7ce','right');
      const tabs=[['attributes','属性'],['equipment','装备'],['skills','技能']],tabW=(inner-12)/3;tabs.forEach(([id,label],i)=>this.button(label,left+i*(tabW+6),f.y+118,tabW,34,()=>{p.tab=id;p.scroll=0;},{active:p.tab===id}));
      const start=f.y+166,bottom=f.y+f.h-17,headerHits=this.hits.length;let y=start-(p.scroll||0);c.save();c.beginPath();c.rect(left,start,inner,bottom-start);c.clip();
      const section=title=>{this.text(title,left,y+12,16,'#e6ca94');c.strokeStyle='#38565d';c.beginPath();c.moveTo(left,y+30);c.lineTo(right,y+30);c.stroke();y+=compact?36:43;};
      const display=value=>Math.floor(Number(value)||0);
      const pair=(label,value)=>{this.text(label,left,y+11,14,'#aebfc4');this.text(typeof value==='number'?display(value):value,right,y+11,14,'#e4e5d7','right');y+=compact?27:31;};
      if(p.tab==='attributes'){
        section('基础属性');const potential=root.CharacterGrowth.isGeneral(u)&&u.potentials;this.text('属性',left,y+9,14,'#92aeb7');this.text('当前',potential?left+inner*.55:right,y+9,14,'#92aeb7','right');if(potential)this.text('潜力(每级)',right,y+9,14,'#d7bb88','right');y+=compact?26:29;
        for(const [key,label]of root.PengpaiRules.ATTRIBUTES){this.box(left,y-3,inner,28,'#102b34',null);this.text(label,left+9,y+10,14,'#d8e4e4');this.text(display(u[key]),potential?left+inner*.55:right-9,y+10,14,'#eae4cb','right');if(potential)this.text(u.potentials[key]+'(+'+Number(root.CharacterGrowth.growthPerLevel(u.potentials[key]).toFixed(2))+')',right-9,y+10,14,'#d8be8a','right');y+=compact?30:33;}
        y+=compact?6:10;section('战斗能力');pair('生命',display(u.soldiers)+' / '+display(u.maxSoldiers));pair('护甲',b.effective(u).armor);pair('抗性',b.effective(u).resistance);
      }else if(p.tab==='equipment'){
        section('当前装备');pair('武器',u.weapon?.name||'未持兵器');pair('武器威力',u.attack);pair('防具',u.equipment?.armor?.name||'未装备');pair('饰品',u.equipment?.accessory1?.name||'未装备');pair('饰品',u.equipment?.accessory2?.name||'未装备');
      }else{
        section('武器技能');const columns=Math.max(1,u.skills.length),colW=(inner-8*(columns-1))/columns,cardH=142;
        u.skills.forEach((id,i)=>{const skill=b.skills[id],x=left+i*(colW+8),icon=40;this.box(x,y,colW,cardH,'#102a34','#385a65');this.box(x+(colW-icon)/2,y+12,icon,icon,'#0b222d','#688b98');proto.drawSkillIcon.call(this,skill,x+(colW-icon)/2,y+12,icon);this.text(skill.name,x+colW/2,y+76,14,'#e4e6d9','center');const role=proto.skillRole.call(this,skill),scope=/^(单体|群体|自身)/.exec(role)?.[0]||'';this.text(scope||role,x+colW/2,y+101,14,'#b0c8ce','center');if(scope)this.text(role.slice(scope.length),x+colW/2,y+123,14,skill.kind==='heal'?'#87d7a6':'#c7b5da','center');this.hits.push({x,y,w:colW,h:cardH,label:'查看'+skill.name+'详情',action:()=>{this.panel={type:'npcSkill',preview:b,unitId:u.id,skill:id,scroll:0,previous:p};}});});y+=cardH+21;section('特质');
        if(!u.passives.length){this.text('暂无被动',left,y+9,14,'#9fb6bd');y+=30;}
        y+=UI.passiveButtons(this,root.PengpaiRules.sortPassives(u.passives,b.passives).map(id=>b.passives[id]).filter(Boolean),left,y,inner,passive=>this.openPassiveInfo(passive,p));
      }
      c.restore();p.maxScroll=Math.max(0,y+(p.scroll||0)-bottom);p.scroll=clamp(p.scroll||0,0,p.maxScroll);this.hits=this.hits.filter((hit,i)=>i<headerHits||(hit.y>=start&&hit.y+hit.h<=bottom));
    }
    drawNpcSkill(){
      const p=this.panel,b=p.preview,u=b.unit(p.unitId),skill=b.skills[p.skill],info=root.BattleSkillInfo.describe(b,u,skill),c=this.ctx,inner=Math.min(460,this.w-28)-40;
      c.font=`14px ${UI.font}`;const contentH=info.lines.slice(1).reduce((n,line)=>n+UI.wrapLines(c,line,inner).length*23+8,66),f=this.frame(skill.name,58+contentH+18),left=f.x+20,start=f.y+58,bottom=f.y+f.h-18;
      p.maxScroll=Math.max(0,contentH-(bottom-start));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=start-p.scroll;
      c.save();c.beginPath();c.rect(left,start,inner,bottom-start);c.clip();this.box(left,y,40,40,'#102a34','#688b98');root.BattleSystem.CanvasBattle.prototype.drawSkillIcon.call(this,skill,left,y,40);this.text(info.role,left+54,y+20,14,'#e4d5b3');y+=66;
      for(const line of info.lines.slice(1))y=this.wrap(line,left,y,inner,{size:14,line:23,color:'#d4e1df'})+8;c.restore();
    }
    openPassiveInfo(passive,previous=this.panel){this.panel={type:'passiveInfo',passive,previous,scroll:0};}
    drawPassiveInfo(){
      const p=this.panel,passive=p.passive,inner=Math.min(460,this.w-28)-44,c=this.ctx;c.font=`14px ${UI.font}`;
      const lines=UI.wrapLines(c,passive.description,inner),f=this.frame(passive.name,112+lines.length*24),top=f.y+54,bottom=f.y+f.h-16;let y=top+15-(p.scroll||0);
      c.save();c.beginPath();c.rect(f.x,top,f.w,bottom-top);c.clip();this.text(UI.passiveLabel(passive),f.x+22,y,14,UI.passiveColor(passive));y+=32;
      for(const line of lines){this.text(line,f.x+22,y,14,'#d2e0df');y+=24;}c.restore();p.maxScroll=Math.max(0,y+(p.scroll||0)-bottom);p.scroll=clamp(p.scroll||0,0,p.maxScroll);
    }
    showReward(reward){if(reward?.completedQuest)root.GameAudio?.play('victory');this.panel={type:'reward',reward:copy(reward),started:performance.now(),scroll:0};this.animate();}
    finishReward(continueQuest){const context=this.model.state.afterBattle;this.model.state.pendingReward=null;this.model.state.afterBattle=null;if(this.model.journey)this.model.journey.checkpoint=this.model.snapshot();this.panel=null;this.save();if(continueQuest){if(this.model.beginSideBattle(continueQuest))this.startBattle();return;}this.afterBattle(context,true);this.invalidate();}
    frame(title,height,{closable=true,titleAlign='left',maxWidth=460,inset=14,verticalInset=16}={}){const c=this.ctx,w=Math.min(maxWidth,this.w-inset*2),h=Math.min(height,this.h-verticalInset*2),x=(this.w-w)/2,y=(this.h-h)/2;c.fillStyle='#050909c9';c.fillRect(0,0,this.w,this.h);this.box(x,y,w,h,'#171f20','#756b52',3);this.hits=[];c.font=`20px ${UI.serif}`;c.textAlign=titleAlign;c.textBaseline='middle';c.fillStyle='#e4d7b7';c.fillText(title,titleAlign==='center'?x+w/2:x+22,y+27);if(title){c.strokeStyle='#b09b6d44';c.beginPath();c.moveTo(x+22,y+49);c.lineTo(x+w-22,y+49);c.stroke();}if(closable)this.button('×',x+w-44,y+9,30,30,()=>{if(this.panel?.type==='event')this.finishEvent(this.panel.decision.defaultId);else if(this.panel?.type==='mapGuide')this.finishIntroduction();else this.closeWorldPanel();});return{x,y,w,h};}
    dismissOutside(frame,action){const {x,y,w,h}=frame;this.hits.unshift(...[{x:0,y:0,w:this.w,h:y},{x:0,y:y+h,w:this.w,h:this.h-y-h},{x:0,y,w:x,h},{x:x+w,y,w:this.w-x-w,h}].filter(r=>r.w>0&&r.h>0).map(r=>({...r,label:'点击空白离开',action})));}
    drawPanel(){
      const panel=this.panel;if(panel.type==='journal'){Journal.draw(this,this.model.state.journal,panel,()=>{this.closeWorldPanel();this.invalidate();});return;}if(panel.type==='practiceWeapons'){const editor=panel.editor;editor.w=this.w;editor.h=this.h;editor.dpr=this.dpr;editor.hits=[];if(editor.panel)root.BattleSystem.CanvasBattle.prototype.drawSkillInfo.call(editor);else editor.drawDeparture();this.hits=editor.hits;return;}if(root.TavernUI?.draw(this))return;if(panel.type==='slidingPuzzle')return root.SlidingPuzzle.draw(this);if(Panels.draw(this))return;if(panel.type==='tacticsEditor'){const editor=panel.editor;editor.w=this.w;editor.h=this.h;editor.drawPanel();this.hits=editor.hits;return;}
      if(panel.type==='npcMenu'){
        const npc=panel.npc,canObserve=!!this.model.npcUnit(npc.id),f=this.frame(npc.name,canObserve?256:208),choices=[{label:'对话',action:()=>this.speak(npc)},...(canObserve?[{label:'观察',action:()=>this.observeNpc(npc)}]:[]),{label:'离开',action:()=>{this.panel=null;}}];choices.forEach((choice,i)=>this.button(choice.label,f.x+22,f.y+62+i*52,f.w-44,40,choice.action));this.dismissOutside(f,()=>{this.panel=null;});return;
      }
      if(panel.type==='npcObserve')return this.drawNpcObserve();
      if(panel.type==='npcSkill')return this.drawNpcSkill();
      if(panel.type==='passiveInfo')return this.drawPassiveInfo();
      if(panel.type==='mapIntro'){
        const top=this.h-208,c=this.ctx;root.PengpaiStory.CanvasStory.prototype.bust.call(this,'hero','right',top,true);const fade=c.createLinearGradient(0,top-24,0,this.h);fade.addColorStop(0,'#081b2600');fade.addColorStop(.25,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,this.w,232);this.text(this.character.name,this.w-26,top+24,16,'#ead1a2','right');this.wrap('这里离常山很近，可以先去那里看看。',26,top+73,this.w-52,{size:16,line:25,color:'#f1ece2'});this.text('›',this.w-32,this.h-30,24,'#c7b386','center');this.hits=[];UI.singleChoiceHit(this.hits,this.w,this.h,[{action:()=>this.advanceIntroduction()}]);return;
      }
      if(panel.type==='mapGuide'){const f=this.frame('行路',240);this.wrap('点击地点选中，双击自动沿最短路线前往。',f.x+22,f.y+78,f.w-44,{size:16,line:26,color:'#e4e7de'});this.button('知道了',f.x+22,f.y+f.h-62,f.w-44,42,()=>this.finishIntroduction());UI.singleChoiceHit(this.hits,this.w,this.h,[{action:()=>this.finishIntroduction()}]);return;}
      if(panel.type==='menu'){const f=this.frame('设置',root.GameSettingsPanel.HEIGHT+96),settings=this.options.store.settings(),bottom=root.GameSettingsPanel.draw(this,f,settings,patch=>{try{this.options.store.setSettings(patch);}catch{this.notify('设置未能保存');}});this.button('保存',f.x+20,bottom+12,f.w-40,36,()=>{this.save();this.panel={type:'notice',title:'存档',text:this.saveError?'存档未能写入。':'已保存当前行程。'};});this.button('返回主菜单',f.x+20,bottom+56,f.w-40,36,()=>{this.save();this.options.onExit?.();});return;}
      if(panel.type==='notice'){this.ctx.font=`14px ${UI.font}`;const rows=UI.wrapLines(this.ctx,panel.text,Math.min(460,this.w-28)-44),f=this.frame(panel.title,138+rows.length*25);this.wrap(panel.text,f.x+22,f.y+70,f.w-44,{line:25});this.button('继续',f.x+22,f.y+f.h-55,f.w-44,36,()=>this.closeWorldPanel());UI.singleChoiceHit(this.hits,this.w,this.h,[{action:()=>this.closeWorldPanel()}]);return;}
      if(panel.type==='tasks'){
        const f=this.frame('任务',450),tabs=[['main','主线'],['side','支线'],['story','剧情']],category=panel.category||'story',bw=(f.w-44-12)/3;tabs.forEach(([id,label],i)=>this.button(label,f.x+22+i*(bw+6),f.y+58,bw,34,()=>{panel.category=id;},{active:category===id}));
        let y=f.y+115;const quests=this.model.quests().filter(q=>q.category===category);if(!quests.length)this.text('暂无支线任务',f.x+22,y+22,16,'#9db5ba');
        for(const quest of quests){this.box(f.x+16,y-4,f.w-32,category==='main'?236:164,'#102a34','#375763');this.text(quest.title,f.x+28,y+18,16,'#ead8b6');this.text(quest.complete?'已完成':'推荐'+quest.recommendedLevel+'级',f.x+f.w-28,y+18,14,quest.complete?'#81d39c':'#c6be9d','right');this.wrap(quest.objective,f.x+28,y+53,f.w-56,{size:16,line:25});if(category==='main'){let row=y+102;for(const country of M.countries){this.text(D.factions[country].name+'国',f.x+28,row,16,D.factions[country].color);this.text('招募到 '+this.model.counts()[country]+'/3',f.x+f.w-28,row,16,'#e5e8dc','right');row+=40;}}y+=category==='main'?250:178;}return;
      }
      if(panel.type==='event'){this.ctx.font=`14px ${UI.font}`;const choices=panel.decision.choices,rows=UI.wrapLines(this.ctx,panel.event.text,Math.min(460,this.w-28)-44),f=this.frame(panel.event.title,96+rows.length*25+choices.length*48,{closable:choices.some(c=>['leave','continue'].includes(c.action))}),remaining=panel.decision.remaining(performance.now());this.wrap(panel.event.text,f.x+22,f.y+76,f.w-44,{line:25});const y=f.y+f.h-20-choices.length*48;for(const [i,choice]of choices.entries()){const label=choice.label+(choice.id===panel.decision.defaultId?'（'+remaining+'）':'');this.button(label,f.x+22,y+i*48,f.w-44,40,()=>this.finishEvent(choice.id));}UI.singleChoiceHit(this.hits,this.w,this.h,choices.map(choice=>({action:()=>this.finishEvent(choice.id)})));return;}
      if(panel.type==='party'){
        const members=this.model.members(),f=this.frame('队伍',Math.min(610,150+members.length*112)),top=f.y+98,bottom=f.y+f.h-18,c=this.ctx,initialHits=this.hits.length;this.text('出战 '+this.model.state.activeIds.length+'/'+root.PengpaiRules.PARTY_LIMIT,f.x+20,f.y+68,14,'#c3d0cd');panel.maxScroll=Math.max(0,members.length*112-(bottom-top));panel.scroll=clamp(panel.scroll||0,0,panel.maxScroll);c.save();c.beginPath();c.rect(f.x+12,top,f.w-24,bottom-top);c.clip();let y=top-panel.scroll;
        for(const unit of members){const active=this.model.state.activeIds.includes(unit.id);if(y+112>top&&y<bottom){this.text(unit.name+' · '+(unit.level||1)+'级'+(unit.guest?' · 同行':''),f.x+20,y+12,16,'#e5dfce');this.text('生命 '+Math.floor(unit.startSoldiers??unit.maxSoldiers)+'/'+unit.maxSoldiers,f.x+20,y+38,14,'#b6c9cd');this.text(X.required(unit.level||1)===Infinity?'已达当前等级上限':'经验 '+(unit.experience||0)+' / '+X.required(unit.level||1),f.x+20,y+62,14,'#93b5bd');
          this.button(active?'出战':'候补',f.x+f.w-80,y,60,32,()=>{const ids=active?this.model.state.activeIds.filter(id=>id!==unit.id):[...this.model.state.activeIds,unit.id];if(this.model.setActive(ids))this.save();},{active});
          if(unit.id!=='hero'&&!unit.guest&&(unit.homeNode||unit.id==='zhangliang'))this.button('离队',f.x+f.w-80,y+42,60,32,()=>{const home=unit.homeNode||'camp';if(this.model.dismiss(unit.id)){this.save();this.panel={type:'notice',title:'辞别',text:unit.name+'返回了'+D.placeMap[home].name+'，你可以去那里再次邀请他同行。'};}});
          this.text(unit.weapon?.name||'未持兵器',f.x+20,y+86,14,'#93b5bd');}y+=112;
        }c.restore();this.hits=this.hits.filter((hit,i)=>i<initialHits||(hit.y>=top&&hit.y+hit.h<=bottom));return;
      }
    }
    travel(to,options={}){
      const plan=this.model.planRoute(to);if(!plan.ok)return;this.entryRequest=null;this.entering=false;this.panel=null;this.selected=null;this.warmTravelArt();this.travelRate=1;this.startNextLeg(options);
    }
    startNextLeg(options={}){
      if(this.disposed||this.journey||this.battle||this.model.pending)return;const result=this.model.journey?{ok:true,from:this.model.journey.from,to:this.model.journey.to}:this.model.beginNextLeg(options);if(!result.ok)return;
      this.selected=null;this.journey={from:result.from,to:result.to,progress:this.model.journey.checked ? .5 : 0,last:performance.now(),paused:false,speedPotential:(this.model.state.activeIds[0]==='hero'?this.model.character:this.model.state.companions.find(u=>u.id===this.model.state.activeIds[0]))?.potentials?.speed??50};this.save(this.model.journey.checkpoint);this.animate();
    }
    tickJourney(){
      if(this.assetsLoading){if(this.journey)this.journey.last=performance.now();return;}
      let j=this.journey;if(!j||j.paused)return;const now=performance.now(),delta=Math.min(80,Math.max(0,now-j.last));j.last=now;const motion=Motion.advance(this.travelRate,delta,true);this.travelRate=motion.rate;let remaining=motion.distanceMs;
      for(let leg=0;leg<8&&this.journey&&!this.journey.paused;leg++){
        j=this.journey;const potential=j.speedPotential??(this.model.state.activeIds[0]==='hero'?this.model.character:this.model.state.companions.find(u=>u.id===this.model.state.activeIds[0]))?.potentials?.speed??50,duration=D.travelDurationMs(j.from,j.to,potential),stop=this.model.journey.checked?1:.5,cost=Math.max(0,(stop-j.progress)*duration),advance=Math.min(remaining,cost);j.progress+=advance/duration;remaining=Math.max(0,remaining-advance);this.camera=D.roadPosition(j.from,j.to,j.progress);this.boundCamera();
        if(j.progress+1e-9<stop)break;j.progress=stop;
        if(stop===.5){const event=this.model.travelEvent();if(event.kind!=='quiet'){j.paused=true;this.openEvent(event);break;}if(remaining<=0)break;continue;}
        const destination=this.model.state.routeTarget;this.model.finishTravel();this.journey=null;this.selected=this.model.state.nodeId;this.save();if(this.model.state.routeTarget)this.startNextLeg();else{this.travelRate=1;if(destination===this.model.state.nodeId)this.tryEnter();break;}if(remaining<=0)break;
      }
    }
    resumeJourney(){if(!this.journey){this.startNextLeg();return;}this.journey.paused=false;this.journey.last=performance.now();this.animate();}
    openEvent(event){
      clearTimeout(this.eventTimer);const decision=new Q.Decision(Q.choicesFor(event),performance.now(),10),panel={type:'event',event,decision};this.panel=panel;this.scheduleEventTick(panel);
    }
    scheduleEventTick(panel){
      clearTimeout(this.eventTimer);this.eventTimer=setTimeout(()=>{if(this.disposed||this.panel!==panel)return;const choice=panel.decision.tick(performance.now());if(choice)this.finishEvent(choice.id,{chosen:choice});else{this.invalidate({visualOnly:true});this.scheduleEventTick(panel);}},Math.max(1,Math.min(1000,panel.decision.deadline-performance.now())));this.eventTimer?.unref?.();
    }
    finishEvent(id,{chosen}={}){
      const panel=this.panel;if(panel?.type!=='event')return;const choice=chosen||panel.decision.choose(id);if(!choice)return;clearTimeout(this.eventTimer);this.panel=null;this.press=null;const outcome=this.model.chooseRoadEvent(choice.id);if(!outcome.ok){this.invalidate();return;}this.save(this.model.journey?.checkpoint);if(outcome.battle)this.startBattle();else this.resumeJourney();this.invalidate();
    }
    startTraining(id){
      const result=this.model.beginTraining(id);if(!result.ok){this.panel={type:'notice',title:'教场',text:result.reason};this.dialogue=null;return;}this.dialogue=null;this.save(this.model.pending.checkpoint);this.startBattle();
    }
    startBattle({continuous=false}={}){
      if(this.disposed||this.battle||!this.model.pending)return false;this.press=null;this.hits=[];
      const scenario=this.model.battleScenario(),settings=this.options.store.settings(),autoStart=continuous||this.model.pending.kind==='story'&&this.model.pending.phase==='entry';clearTimeout(this.eventTimer);this.panel=null;this.dialogue=null;
      const save=view=>{for(const unit of view.battle.units.filter(u=>u.side==='ally'))this.model.saveTactics(unit);this.save(this.model.pending?.checkpoint);};
      this.save(this.model.pending.checkpoint);this.battle=root.BattleSystem.mount(this.canvas,scenario,{...settings,autoStart,hideResult:true,onTacticsSave:(unit,view)=>save(view),onPrepareChange:save,onPrepared:save,onComplete:result=>{this.timer=setTimeout(()=>{if(this.disposed)return;const context={...this.model.pending};this.battle.destroy();this.battle=null;const victory=this.model.resolveBattle(result);if(!victory)this.journey=null;this.selected=null;this.resize();this.save(this.model.journey?.checkpoint);if(victory)this.showReward(this.model.lastReward);else this.afterBattle(context,false);this.invalidate();},600);}});if(this.model.pending.kind==='story'&&this.model.pending.phase==='entry')this.battle.notify('赵云赶来助阵');
    }
    afterBattle(context,victory){
      if(context?.kind==='quest-turn-in')return;
      if(!context)return;
      if(context.kind==='chapter'){if(victory&&this.model.state.chapterOne.stage==='aftermath')this.showChapterEnding();else if(victory)this.chapterDialogue(root.ChapterOne.npc(this.model));else this.speak({id:'luoyang-scout',name:'联军斥候',art:'imperial-soldier',side:'left'},{lines:['先退到这边来，伤者我会叫人去接！你们先把伤处理好，再商量该怎么打，前面那些守军不是只靠硬冲就能过去的。']});return;}
      if(context.kind==='heroQuest'){const d=root.HeroQuests.definitions[context.questId],fight=d.battles[context.phase];if(victory){const npc=root.HeroQuests.npc(context.questId,this.model.state.heroQuests[context.questId]);if(npc&&root.HeroQuests.place(context.questId,this.model.state.heroQuests[context.questId])===this.model.state.nodeId)this.heroQuestDialogue({...npc,selectedQuest:true});}else if(fight.duel||fight.friendly){const id=fight.duel||context.questId;this.speak({id,name:root.RecruitmentContent.actors[id]?.name||d.name,art:id,side:'left'},{lines:fight.failureLines||['先停一下，别带着伤硬撑。今天没赢，改天再试就是了，我会在这里等。你回去想想刚才哪里没应付好，准备妥当再来。']});}else this.speak({id:'hero',name:this.character.name,art:'hero',side:'right'},{lines:['先退出来把伤养好。这次不能照原来的办法再冲了，等大家缓过来，把对面的招式和我们手里的兵器重新合计一下。']});return;}
      if(context.kind==='training'){const followup=()=>{if(this.model.state.departurePractice==='training'){this.showDepartureTrainer();return;}if(victory&&context.trainingId==='three-brothers'&&!this.model.state.companions.some(u=>u.id==='zhangliang'))this.speak(D.townNpcs.camp.find(n=>n.id==='zhangliang'),{lines:['好家伙，你们连我们三个都打赢了！我在营里也待得闷，你们以后出门能不能叫上我？比起天天在教场练，我更想出去看看。'],choices:[{label:'请同行',action:()=>this.inviteZhangLiang()},{label:'改日再请',action:()=>this.closeDialogue()}]});};if(context.trainingId==='straw-dummy'){this.speak(D.townNpcs.camp.find(n=>n.id==='zhangliang'),{lines:['这几下总算顺手些了吧？稻草人不会躲，也不会还手。要是还想试试怎么应付别人的招式，就叫个人来陪你练。'],onComplete:followup});return;}this.speak(D.townNpcs.camp.find(n=>n.id==='zhangbao'),{lines:['过来坐，我替你们看看伤。刚才那几下打得不轻，已经重新包扎好了，再歇一会儿。想接着练也不用急，我三弟下手总不知道轻重。'],onComplete:followup});return;}
      if(context.kind==='story'){
        if(!victory){this.speak(D.questNpcs.zhaoyun,{lines:['先别追了，都退回来！大家身上都有伤，再打下去只会越来越难照顾。等包扎好，我们再想想该从哪边过去。']});return;}
        if(context.phase==='entry'){
          this.playConversation([{npc:D.questNpcs.zhaoyun,lines:['刚才有没有伤着？让我看看。一直顾着把他们赶走，还没问你的名字。我叫赵云，字子龙。最近在村里帮着照顾那些逃难来的乡亲。']},{npc:{id:'hero',name:this.character.name,art:'hero',side:'right'},lines:['你就是赵子龙？我叫'+this.character.name+'，从黄巾营地来的，本来就是想来找你。刚进村就听见这边吵起来，正想打听怎么回事，他们就拦着不让走了。']},{npc:D.questNpcs.zhaoyun,lines:['原来你是来找我的，那正好留下坐坐。先到乡医那里，让他把伤检查一下，等大家都安顿好，我们再慢慢聊。']}],()=>{this.model.rest();this.save();if(this.model.state.quests.changshan.zhaoInvitation)this.offerZhaoJourney();});return;
        }
        if(context.phase==='rescue'&&!this.model.members().some(u=>u.id==='zhenji')){
          this.speak(D.questNpcs.zhenji,{lines:['谢谢你们把我们救出来。我姓甄，原本在中山给伤者看病，那伙人听说我家里有粮，就把我扣下，逼我写信回家，让家里送粮来换人。','我先留在毋极照顾这些伤者。你们还得去夺粮，别在这里耽搁了；等安排好同行的人，再来找我，我也想帮你们一把。'],forced:true,onComplete:()=>this.notify('队伍已满（'+this.model.rosterLimit()+'/'+this.model.rosterLimit()+'），甄姬暂留毋极，可空位后邀请。')});return;
        }
        if(context.phase==='grain'&&this.model.state.quests.changshan.healerJoined){this.model.rest();this.save();}
        if(context.phase==='grain'&&this.model.state.quests.changshan.healerDecision){this.offerZhenStay();return;}
        const followup=root.NearbyContent.storyBattles[context.phase]?.followup;if(followup&&this.model.canBeginStoryBattle(followup.phase)){this.speak(D.questNpcs[followup.speaker],{lines:followup.lines,onComplete:()=>{if(this.model.beginStoryBattle(followup.phase)){this.save(this.model.pending.checkpoint);this.startBattle({continuous:true});}}});return;}
        const lines={grain:this.model.state.quests.changshan.grainWins<2?['前院的粮袋都还在，我已经请仓守来清点。其他贼跑进了后仓，我们先在这里缓口气，别让他们趁着这会儿又把粮搬出去。']:['前后都清点过了，只少了几袋，剩下的够乡亲们吃一阵。我去帮着装车，你也歇一会儿，等装好就一起回常山。'],rescue:['谢谢你们把我们救出来。我姓甄，原本在中山给伤者看病，那伙人听说我家里有粮，就把我扣下，逼我写信回家，让家里送粮来换人。','还有几个伤者需要继续换药，可我的药箱留在中山粮仓了。听说你们也要回去夺粮，能不能带我一起？取回药以后，我也能在路上照顾大家。'],escort:['他们退了，粮车也没事。把车停在院门口吧，乡亲们已经过来帮忙了。里正在那边，我叫他一声。']}[context.phase];this.speak(context.phase==='rescue'?D.questNpcs.zhenji:D.questNpcs.zhaoyun,{lines:lines||['我去看看乡亲们和伤者怎么样了。你也先坐下来歇歇，等大家都到齐，我们再商量下一步的安排。'],forced:true,onComplete:context.phase==='escort'?()=>this.nearbyDialogue(this.model.sceneNpcs().find(n=>n.id==='changshan-elder')):undefined});return;
      }
      if(!victory)this.panel={type:'notice',title:'战败',text:'已读取战前存档，准备好后可以再次挑战。'};else if(this.journey||this.model.journey||this.model.state.routeTarget)this.resumeJourney();
    }
    destroy(){this.renameInput?.remove();this.disposed=true;PartyInput.cancel(this);clearTimeout(this.timer);clearTimeout(this.eventTimer);clearTimeout(this.rewardTimer);clearTimeout(this.noticeTimer);clearTimeout(this.recruitTimer);cancelAnimationFrame(this.raf);this.battle?.destroy();this.observer.disconnect();for(const [event,fn]of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['keydown',this.key],['wheel',this.wheel]])this.canvas.removeEventListener(event,fn);}
  }
  root.WorldMap={CanvasWorld,mount:(canvas,options)=>new CanvasWorld(canvas,options)};if(typeof module!=='undefined'&&module.exports)module.exports={CanvasWorld};
})(globalThis);
