(function(root){
  'use strict';
  const Panels=typeof module!=='undefined'&&module.exports?require('./world-panels.js'):root.WorldPanels;
  const PartyInput=typeof module!=='undefined'&&module.exports?require('./party-controls.js'):root.PartyControls;
  const D=root.WorldData,M=root.WorldModel,UI=root.PengpaiUI,Q=root.TimedChoice,X=root.CharacterExperience,copy=x=>JSON.parse(JSON.stringify(x)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const leaveLabels=new Set(['离开','告辞','改日再会','改日再请','暂不劳烦','稍后再来','先整顿一下']);
  class CanvasWorld{
    constructor(canvas,options){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.character=options.character;this.model=options.model||new M.World(this.character,options.progress?.world);this.hits=[];this.busts=new Map();this.panel=this.model.state.pendingReward?{type:'reward',reward:copy(this.model.state.pendingReward),started:performance.now(),scroll:0}:!this.model.pending&&this.model.state.introStep===0?{type:'mapIntro'}:this.model.state.introStep===1?{type:'mapGuide'}:null;this.selected=null;this.zoom=this.model.state.mapZoom;this.camera={x:0,y:0};this.revision=0;this.drawnRevision=-1;this.disposed=false;this.raf=0;this.battle=null;
      this.resize=this.resize.bind(this);this.down=this.down.bind(this);this.move=this.move.bind(this);this.up=this.up.bind(this);this.cancel=()=>{PartyInput.cancel(this);this.invalidate();};this.key=e=>{if(e.key==='Escape'&&!this.battle){if(this.panel?.type==='event'){const leave=this.panel.decision.choices.find(c=>['leave','continue'].includes(c.action));if(leave)this.finishEvent(leave.id);return;}if(this.dialogue){this.dialogueExit()?.();this.invalidate();return;}if(this.journey)return;if(this.panel?.type==='mapIntro'){this.advanceIntroduction();return;}if(this.panel?.type==='mapGuide'){this.finishIntroduction();return;}this.closeWorldPanel();this.dialogue=null;this.selected=null;this.invalidate();}};this.wheel=e=>{if(PartyInput.wheel(this,e))return;const p=this.panel?.type==='tacticsEditor'?this.panel.editor.panel:this.panel;if(p&&['character','characterDetails','party','formation','npcObserve','npcSkill','inventory','inventoryFilter','inventorySort','shop','reward','tasks','tactics','skillInfo'].includes(p.type)){e.preventDefault();p.scroll=clamp((p.scroll||0)+e.deltaY,0,p.maxScroll||0);this.invalidate();}};
      for(const [event,fn]of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['keydown',this.key],['wheel',this.wheel]])canvas.addEventListener(event,fn,{passive:false});
      this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);canvas.dataset.storyStage='world';this.resize();this.save(this.model.pending?.checkpoint);if(this.model.pending)Promise.resolve().then(()=>{if(!this.disposed)this.startBattle();});else if(this.panel?.type==='reward')this.animate();else if(this.model.state.inside&&this.model.state.nodeId==='changshan'&&['available','entry'].includes(this.model.state.quests.changshan.stage)&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.startChangshanArrival();});else if(this.model.state.quests.changshan.healerDecision&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.offerZhenStay();});else if(this.model.state.quests.changshan.stage==='decision'&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.questDialogue(D.questNpcs.zhaoyun);});else if(this.requiredHeroScene()&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.resumeForcedHeroScene();});else if((this.model.journey||this.model.state.routeTarget)&&!this.panel)Promise.resolve().then(()=>{if(!this.disposed)this.startNextLeg();});
    }
    notify(text){this.notice={text,until:performance.now()+1700};clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>{this.notice=null;this.invalidate();},1700);this.noticeTimer?.unref?.();this.invalidate();}
    drawMainControls(){
      this.text(this.model.location().name,14,28,16,'#eddcb5');
      const actions=[['人物',()=>{this.model.state.showParty=!this.model.state.showParty;this.save();this.boundCamera();}],['队伍',()=>{this.panel={type:'party',scroll:0};}],['任务',()=>{this.panel={type:'tasks',category:'story',scroll:0};}],['背包',()=>{this.panel={type:'inventory',scroll:0};}],['设置',()=>{this.panel={type:'menu'};}]];
      actions.forEach(([name,action],i)=>Panels.iconButton(this,name,this.w-208+i*40,13,34,action,name==='人物'&&this.model.state.showParty));
    }
    drawQuestArrows(){
      const seen=new Set(),placed=[];
      for(const mark of this.model.questMarkers()){
        if(seen.has(mark.place))continue;seen.add(mark.place);const node=D.placeMap[mark.place],p=this.screen(node);
        if(p.x>=18&&p.x<=this.w-18&&p.y>=76&&p.y<=this.partyTop()-135&&this.mapEntries?.some(e=>e.node.id===node.id))continue;
        let x=clamp(p.x,22,this.w-22),y=clamp(p.y,85,this.partyTop()-135);if(x>this.w-80&&y<210)x=this.w-100;
        for(let i=0;i<8&&placed.some(a=>Math.hypot(a.x-x,a.y-y)<38);i++)y=clamp(y+38,85,this.partyTop()-135);placed.push({x,y});
        const c=this.ctx;c.fillStyle=Panels.questColors[mark.taskStatus]||'#d7b864';c.beginPath();c.arc(x,y,13,0,7);c.fill();this.text('!',x,y,16,'#172c38','center');
        this.hits.push({x:x-17,y:y-17,w:34,h:34,label:'任务地点 '+node.name,action:()=>{this.selected=node.id;this.camera={x:node.x,y:node.y};this.boundCamera();}});
      }
    }
    openCharacter(id,previous=null){this.panel={type:'character',unitId:id,previous};}
    openItemDetail(item,options={}){this.notice=null;this.panel={type:'itemDetail',item,previous:this.panel,...options};}
    memberPreview(id){const unit=typeof id==='object'?id:this.model.members().find(u=>u.id===id)||this.model.npcUnit(id);return new root.BattleEngine.Battle({allies:[unit],enemies:[],rules:{tacticsEnemyCount:5},passives:root.WorldModel.heroPassives?.()});}
    openMemberTactics(id,previous){
      const proto=root.BattleSystem.CanvasBattle.prototype,editor=Object.assign(Object.create(proto),{canvas:this.canvas,ctx:this.ctx,image:src=>this.image(src),w:this.w,h:this.h,hits:[],textTextures:new Map(),dpr:this.dpr||1,panel:null,aim:null,battle:this.memberPreview(id),options:{onTacticsSave:unit=>{this.model.saveTactics(unit);this.save();}}});
      const unit=editor.battle.unit(id);unit.soldiers=Math.max(1,unit.soldiers);editor.openTactics(unit);const outer={type:'tacticsEditor',editor,previous};editor.closePanel=()=>{proto.closePanel.call(editor);if(!editor.panel)this.panel=previous||null;};this.panel=outer;
    }
    nearbyDialogue(npc){
      if(npc.role==='companion')return false;
      if(npc.questId){const data=root.NearbyContent.sideQuests.find(t=>t.id===npc.questId);this.speak(npc,{lines:[data.id==='grain-escort'?'粮车是我们扣下的。想带走，先问问我们手里的家伙答不答应！':'这条路现在归我们管。你们是留下东西，还是想动手？'],choices:[{label:'剿匪',action:()=>{if(this.model.beginSideBattle(data.id))this.startBattle();}},{label:'离开',dismiss:true,action:()=>this.closeDialogue()}]});return true;}const N=root.NearbyContent,q=this.model.state.quests.changshan;
      if(npc.id==='changshan-elder'&&q.stage==='return'){this.speak(npc,{lines:['你们可算回来了！刚才在村口听见动静，我还担心又出了什么事。车先停在院里吧，我叫人过来卸粮。','这一趟辛苦你们了。今夜别忙着走，乡亲们都想当面谢谢你们，我也让人把住处收拾好了。'],onComplete:()=>{this.model.advanceChangshan();this.save();this.questDialogue(D.questNpcs.zhaoyun);}});return true;}
      if(npc.id==='grain-steward'&&q.stage==='supplies'){
        if(!q.healerJoined)this.speak(npc,{lines:['子龙，你们来了就好。我正愁找谁帮忙呢。贼占了粮仓不说，还把给乡亲们看伤的甄姑娘带走了，说要拿她向甄家换粮。','人被带去了毋极，车夫跟在后头打听消息。你们先去找他吧，仓里的粮一时还搬不走，我在这儿盯着。'],choices:[{label:'赶往毋极救人',action:()=>{q.stage='rescue';this.save();this.closeDialogue();}}]});
        else this.speak(npc,{lines:[q.grainWins?'剩下那伙人退到后仓了，我看有人在搬东西堵门。后头堆的都是粮袋，你们进去时小心一点。':'甄姑娘也回来了，那几个伤者都没事吧？仓里的贼还没走，前后两院都有人。前门这边人少一些，可以先从这里进去。'],choices:[{label:q.grainWins?'夺取后仓':'夺取前仓',action:()=>{if(this.model.beginStoryBattle('grain'))this.startBattle();}},{label:'稍后再来',action:()=>this.closeDialogue()}]});return true;
      }
      if(npc.id==='refugee-laborer'&&q.stage==='rescue'){this.speak(npc,{lines:['是仓守让你们来的？甄姑娘和几个伤者都在祠堂后院，我刚才还听见她在跟守门的人争，要他们拿点水进去。','车我停在墙后了。你们把门口的人引开，我就进去接伤者，免得打起来伤着他们。等人上了车，咱们一起走。'],choices:[{label:'救出甄姑娘',action:()=>{if(this.model.beginStoryBattle('rescue'))this.startBattle();else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'先整顿一下',action:()=>this.closeDialogue()}]});return true;}
      if(npc.id==='zhenji'){
        if(!q.healerJoined&&['return','decision','complete'].includes(q.stage))this.speak(npc,{lines:['听说你们这一路帮了不少乡亲。我会些医术，若是你们还要出远门，我也想一起去，路上有人受伤总能照应一下。'],choices:[{label:'请同行',action:()=>{if(this.model.recruitZhenJi()){this.save();this.closeDialogue();}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'改日再会',action:()=>this.closeDialogue()}]});
        else this.speak(npc,{lines:['手上的伤好些了吗？让我看看。你们常在外头走动，伤口要是裂开了，可别一直拖着不说。'],choices:[{label:'请她疗伤',action:()=>{this.model.rest();this.save();this.speak(npc,{lines:['已经包扎好了，活动起来应该不怎么疼了。今晚要是还不舒服，再来找我看看。']});}},{label:'聊聊药箱',action:()=>this.speak(npc,{lines:['这药箱用了好些年，扣子坏过两回，我一直没舍得换。里头的针和医书都是家里带出来的，用惯了，放在哪一层我闭着眼都摸得到。']})},{label:'告辞',action:()=>this.closeDialogue()}]});return true;
      }
      const definition=N.npcs.find(n=>n.id===npc.id);if(!definition)return false;
      const variants=N.conversations?.[npc.id],lines=(['return','decision','complete'].includes(q.stage)&&variants?.afterReturn)||(q.healerJoined&&variants?.afterRescue)||definition.lines;
      const talks=this.model.state.npcTalks[npc.id]||0;this.model.state.npcTalks[npc.id]=talks+1;const choices=[];
      if(npc.role==='healer'){const service=N.services.healing;choices.push({label:'疗伤 · '+service.price+service.currency,action:()=>{if(this.model.state.money>=service.price){this.model.state.money-=service.price;this.model.rest();this.save();this.speak(npc,{lines:['伤都处理好了，站起来试试，还疼不疼？今天尽量少跑动，别又把刚包好的地方扯开了。']});}else this.notify('铜钱不足，可以回营请张宝疗伤。');}});}
      if(npc.role==='merchant')for(const mode of ['buy','sell'])choices.push({label:mode==='buy'?'购买':'出售',action:()=>{this.dialogue=null;this.panel={type:'shop',shopMode:mode,scroll:0};}});
      for(const data of N.sideQuests.filter(t=>t.giver===npc.id)){const side=this.model.state.quests.side[data.id];if(!side.accepted)choices.push({label:'委托 · '+data.title,action:()=>{this.model.acceptSide(data.id);this.save();this.speak(npc,{lines:[data.accept+' 他们就在'+D.placeMap[data.place].name+'那边。']});}});else if(side.wins<data.rounds)choices.push({label:'询问'+data.title,action:()=>this.speak(npc,{lines:['他们还在'+D.placeMap[data.place].name+'那边。你们去了以后找拦路的那伙人，路清出来了，再回来告诉我。']})});else if(!side.paid)choices.push({label:'交付委托',action:()=>{const reward=this.model.turnInSide(data.id);if(reward){this.dialogue=null;this.save();this.showReward(reward);}}});else choices.push({label:'聊聊近况',action:()=>this.speak(npc,{lines:['这几天路上安稳多了，乡亲们也敢出门了。上次的事，多亏你们帮忙。']})});}
      if(choices.length)choices.push({label:'聊聊近况',action:()=>this.speak(npc,{lines:[lines[(talks+1)%lines.length]]})},{label:'告辞',action:()=>this.closeDialogue()});
      this.save();this.speak(npc,{lines:[lines[talks%lines.length]],choices:choices.length?choices:undefined});return true;
    }
    image(src){return root.GameAssetLoader?.get(src)||null;}
    advanceIntroduction(){this.model.state.introStep=1;this.panel={type:'mapGuide'};this.save();this.invalidate();}
    finishIntroduction(){this.model.state.introStep=2;this.panel=null;this.save();this.invalidate();if(this.model.state.routeTarget)this.startNextLeg();}
    suggestedDestination(){return this.model.questDestination();}
    closeWorldPanel(){if(this.panel?.type==='party')PartyInput.cancel(this);if(this.panel?.type==='reward'){this.finishReward();return;}if(this.panel?.type==='tacticsEditor'){this.panel.editor.closePanel();return;}this.panel=this.panel?.previous||null;}
    interact(npc){this.dialogue=null;if(!this.model.npcUnit(npc.id)){this.speak(npc);return;}this.panel={type:'npcMenu',npc};}
    observeNpc(npc){const unit=this.model.npcUnit(npc.id);if(!unit)return;const preview=new root.BattleEngine.Battle({allies:[unit],enemies:[]});this.panel={type:'character',unitId:unit.id,unit:preview.unit(unit.id),readonly:true,previous:{type:'npcMenu',npc}};}
    progress(state=this.model.snapshot()){return {storyVersion:2,stage:'world',index:0,preparation:{},world:copy(state)};}
    save(state){this.character=this.model.character;try{this.options.store.save(this.options.slot,this.character,this.progress(state));this.saveError=false;}catch{this.saveError=true;}}
    partyRects(){return root.BattleSystem.layout(this.w,this.h,this.model.state.activeIds.length,0,null,this.model.activeLimit());}
    occupiedPartyRects(){
      if(this.model.state.showParty===false)return [];const members=this.model.members();return this.partyRects().map(r=>{const u=members.find(u=>u.id===this.model.state.activeIds[r.index]),art=u?.portrait||(root.CharacterAssets?.manifest.characters[u?.characterId||u?.id]?root.CharacterAssets.resolve(u.characterId||u.id).portrait:null),img=this.image(art?.src),source=art?.crop||{width:img?.naturalWidth||1,height:img?.naturalHeight||1},dst=img?root.BattleSystem.fitImage(source.width,source.height,{x:r.x,y:r.y,w:r.w,h:r.h-54}):null,top=Math.min(dst?.y??r.y+r.h-50,r.y+r.h-50);return {...r,y:top,h:r.y+r.h-top};});
    }
    partyTop(){return Math.min(this.h-12,...this.occupiedPartyRects().map(r=>r.y));}
    resize(){if(this.disposed||this.battle)return;const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.mapRect={x:0,y:0,w:this.w,h:this.h};this.zoom=Math.max(this.minimumZoom(),this.zoom);this.model.state.mapZoom=this.zoom;if(this.zoomAnimation)this.zoomAnimation.to=Math.max(this.minimumZoom(),this.zoomAnimation.to);if(!this.journey)this.focusLocation();this.invalidate();}
    panelAnimating(){if(this.panel?.type==='party'&&this.panel.drag)return true;if(this.zoomAnimation)return true;if(this.panel?.type==='character'){const u=this.panel.unit||this.model.members().find(u=>u.id===this.panel.unitId);return !!u&&!u.dead&&(u.startSoldiers??u.soldiers??u.maxSoldiers)>0;}return this.panel?.type==='reward'&&performance.now()-this.panel.started<(this.panel.animationDuration??1700);}
    idleVisible(){return this.model.state.showParty!==false&&!this.dialogue&&(!this.panel||this.panel.type==='event')&&!this.battle&&!this.disposed&&this.model.members().some(u=>this.model.state.activeIds.includes(u.id)&&u.startSoldiers>0);}
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

    point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*this.w/r.width,y:(e.clientY-r.top)*this.h/r.height};}
    mapAnchor(){const r=this.mapRect;return{x:r.x+r.w/2,y:this.w&&this.h&&D.bounds.height*this.zoom>r.h?Math.min(this.h/2,(68+this.destinationBounds().y)/2):r.y+r.h/2};}
    screen(p){const a=this.mapAnchor();return{x:a.x+(p.x-this.camera.x)*this.zoom,y:a.y+(p.y-this.camera.y)*this.zoom};}
    text(value,x,y,size=14,color='#e3e9e5',align='left'){const c=this.ctx;c.font=`${UI.textSize(size)}px ${UI.font}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(String(value),x,y);}
    box(x,y,w,h,fill='#102a34',stroke='#557784',radius=4){const c=this.ctx;c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,radius);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
    button(label,x,y,w,h,action,{active=false,disabled=false,suggested=false}={}){this.box(x,y,w,h,suggested?'#38274d':active?'#674d2d':'#102a34',disabled?'#344a51':suggested?'#bb8feb':active?'#dfc18b':'#577781');this.text(label,x+w/2,y+h/2,14,disabled?'#73868b':active?'#ffe8ba':'#e3e9e5','center');if(!disabled)this.hits.push({x,y,w,h,label,action});}
    wrap(value,x,y,width,{size=14,line=22,color='#bdcdd0'}={}){this.ctx.font=`${UI.textSize(size)}px ${UI.font}`;const rows=UI.wrapLines(this.ctx,value,width);rows.forEach((row,i)=>this.text(row,x,y+i*line,size,color));return y+rows.length*line;}
    down(e){
      if(PartyInput.down(this,e))return;
      if(this.battle||e.button!==0||this.press)return;const p=this.point(e),matches=[...this.hits].reverse().filter(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h);let hit=matches[0];if(hit?.placeId)hit=matches.filter(h=>h.placeId).sort((a,b)=>Math.hypot(p.x-a.center.x,p.y-a.center.y)-Math.hypot(p.x-b.center.x,p.y-b.center.y))[0];const r=this.mapRect;
      // 第二次点同一地图节点可在下一帧之前到达；只有选点这一种原地变化能沿用命中区域。
      const repeatNode=!!hit?.placeId&&!this.panel&&!this.dialogue&&!this.journey&&!this.model.state.inside&&hit?.placeId===this.lastTap?.id&&hit?.placeId===this.selected;
      if(this.drawnRevision!==this.revision&&!repeatNode)return;
      this.press={id:e.pointerId,...p,hit,revision:this.revision,moved:false,camera:{...this.camera},townScroll:this.townScroll||0,scroll:this.panel?{panel:this.panel.type==='tacticsEditor'?this.panel.editor.panel:this.panel,start:(this.panel.type==='tacticsEditor'?this.panel.editor.panel?.scroll:this.panel.scroll)||0}:null,pan:(!hit||!!hit.placeId)&&!this.panel&&!this.dialogue&&!this.journey&&!this.model.state.inside&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h};this.canvas.setPointerCapture?.(e.pointerId);
    }
    move(e){if(PartyInput.move(this,e))return;const press=this.press;if(!press||press.id!==e.pointerId)return;const p=this.point(e),dx=p.x-press.x,dy=p.y-press.y;if(Math.hypot(dx,dy)>7)press.moved=true;if(!this.panel&&this.model.state.inside&&press.moved){this.townScroll=Math.max(0,(press.townScroll||0)-dy);this.invalidate();}else if(press.hit?.kind==='slider'&&Math.abs(dx)>Math.abs(dy)){press.moved=true;press.hit.change(p.x);this.invalidate();}else if(press.scroll&&press.moved){press.scroll.panel.scroll=clamp(press.scroll.start-dy,0,press.scroll.panel.maxScroll||0);this.invalidate();}else if(press.pan&&press.moved){this.camera.x=press.camera.x-dx/this.zoom;this.camera.y=press.camera.y-dy/this.zoom;this.boundCamera();this.invalidate();}}
    up(e){if(PartyInput.up(this,e))return;const p=this.press;if(!p||p.id!==e.pointerId)return;this.press=null;if(this.battle||p.moved||p.revision!==this.revision||!p.hit)return;const q=this.point(e),h=p.hit;if(q.x<h.x||q.x>h.x+h.w||q.y<h.y||q.y>h.y+h.h)return;if(h.kind==='slider')h.change(q.x);else h.action?.();this.invalidate();}
    draw(){
      if(this.disposed||this.battle)return;PartyInput.tick(this,performance.now());const c=this.ctx,w=this.w,h=this.h;c.fillStyle='#071923';c.fillRect(0,0,w,h);this.hits=[];
      if(this.model.state.inside)this.drawTown();else if(this.dialogue?.npc.role==='guard')this.drawTownBackdrop();else this.drawMap();
      if(!this.journey&&!this.dialogue)this.drawMainControls();
      if(!this.dialogue&&this.panel?.type!=='mapIntro'&&this.model.state.showParty!==false)this.drawPartyBar();
      if(this.dialogue)this.drawDialogue();if(this.panel)this.drawPanel();if(this.notice?.until>performance.now()){this.box(20,this.h/2-28,this.w-40,56,'#102b36f5','#b7a279');this.text(this.notice.text,this.w/2,this.h/2,14,'#efdfb9','center');}if(this.saveError)this.text('存档写入失败',w/2,h-12,14,'#e5a17d','center');this.drawnRevision=this.revision;
      this.canvas.setAttribute('aria-label',`大地图，${this.model.location().name}，${this.model.state.inside?'城镇内':'城镇外'}。附近：${this.model.neighbors().map(p=>p.name).join('、')}。${this.journey?'正在前往'+D.placeMap[this.journey.to].name:''}${this.panel?({tasks:'任务',menu:'菜单',party:'队伍',mapIntro:this.character.name+'：这里离常山很近，可以先去那里看看。',mapGuide:'点击地点选中，双击自动沿最短路线前往。',notice:this.panel.title,event:this.panel.event?.title}[this.panel.type]||''):''}${this.dialogue?'。'+this.dialogue.npc.name+'：'+this.dialogue.lines[this.dialogue.index]:''}`);
    }
    terrain(){return root.WorldMapArt.terrain(this,D);}
    selectPlace(id,now=performance.now()){
      if(this.journey)return;const previous=this.lastTap;this.selected=id;this.lastTap={id,time:now};
      if(previous?.id===id&&now-previous.time<450&&id!==this.model.state.nodeId&&this.model.findRoute(id)){this.lastTap=null;this.travel(id);}
    }
    drawMap(){
      const c=this.ctx,r=this.mapRect,near=new Set(this.model.neighbors().map(p=>p.id));c.fillStyle='#6eabb8';c.fillRect(0,0,this.w,this.h);root.WorldMapArt.ocean(this);c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.imageSmoothingQuality='high';c.drawImage(this.terrain(),...this.terrainViewport());
      const markerByPlace=new Map();for(const mark of this.model.questMarkers())if(!markerByPlace.has(mark.place))markerByPlace.set(mark.place,mark);const context={current:this.model.state.nodeId,selected:this.selected,suggested:this.suggestedDestination(),quests:new Set(this.model.questMarkers().map(q=>q.place)),near},route=this.model.findRoute(this.model.state.routeTarget||this.selected),routeEdges=new Set((route?.nodes||[]).slice(1).map((id,i)=>[route.nodes[i],id].sort().join('|')));
      c.font=`14px ${UI.font}`;const entries=D.mapLayout.planView(D.places,{...context,zoom:this.zoom,toScreen:p=>this.screen(p),viewport:r,textWidth:name=>c.measureText(name).width,obstacles:[{x:0,y:0,w:this.w,h:68},{x:this.w-74,y:72,w:64,h:130},...this.occupiedPartyRects(),this.destinationBounds()]});this.mapEntries=entries;
      for(const [a,b]of D.roads){const available=a===this.model.state.nodeId||b===this.model.state.nodeId,planned=routeEdges.has([a,b].sort().join('|'));
        if(!planned&&(!D.mapLayout.visibleAt(D.placeMap[a],this.zoom,context)||!D.mapLayout.visibleAt(D.placeMap[b],this.zoom,context)))continue;
        c.strokeStyle=planned?'#efd19b':available?'#c0b08d':'#5c513e66';c.lineWidth=planned?3:available?2.4:1;c.setLineDash(planned||available?[]:[4,5]);c.beginPath();D.roadPath(a,b).forEach((point,i)=>{const p=this.screen(point);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.stroke();
      }c.setLineDash([]);
      // 缩放只决定地点层级；标签固定在建筑旁，屏幕边缘直接裁切。
      for(const {node,p,icon,label,important,size}of [...entries].reverse()){
        const current=node.id===this.model.state.nodeId,selected=node.id===this.selected,available=near.has(node.id),suggested=context.quests.has(node.id);c.save();c.globalAlpha=important?1:.8;
        this.drawPlaceIcon(node,p,{current,selected,available,suggested,size});if(suggested){this.ctx.fillStyle=Panels.questColors[markerByPlace.get(node.id)?.taskStatus]||'#d5ad63';this.ctx.beginPath();this.ctx.arc(p.x+size*.55,p.y-size,7,0,7);this.ctx.fill();this.text('!',p.x+size*.55,p.y-size,14,'#283245','center');}
        this.box(label.x,label.y,label.w,label.h,'#1b2c27e8',current?'#e9cb88':suggested?'#b7a2ca':'#96896b99',3);this.text(node.name,label.x+label.w/2,label.y+label.h/2,14,current?'#ffe3a0':suggested?'#e2c9ff':'#ece0c7','center');c.restore();
        const hit={x:Math.max(r.x,icon.x),y:Math.max(r.y,icon.y),w:icon.w,h:icon.h};hit.w=Math.min(hit.w,r.x+r.w-hit.x);hit.h=Math.min(hit.h,r.y+r.h-hit.y);
        this.hits.push({...hit,center:p,placeId:node.id,action:()=>this.selectPlace(node.id)});this.hits.push({...label,center:{x:label.x+label.w/2,y:label.y+label.h/2},placeId:node.id,action:()=>this.selectPlace(node.id)});
      }
      if(this.journey)this.drawTraveler();c.restore();
      const shade=c.createLinearGradient(0,0,0,76);shade.addColorStop(0,'#07192390');shade.addColorStop(1,'#07192300');c.fillStyle=shade;c.fillRect(0,0,this.w,76);
      this.button('+',this.w-52,78,34,34,()=>this.changeZoom(D.mapRules.zoomStep));this.button('−',this.w-52,120,34,34,()=>this.changeZoom(1/D.mapRules.zoomStep));Panels.iconButton(this,'定位',this.w-52,164,34,()=>this.focusLocation());this.drawQuestArrows();if(this.panel?.type!=='mapIntro')this.drawDestination();
    }
    drawPlaceIcon(node,p,options){root.WorldMapArt.settlement(this,node,p,options);}
    terrainViewport(){const r=this.mapRect,a=this.mapAnchor(),scale=D.geography.rasterScale;return [(this.camera.x+(r.x-a.x)/this.zoom)*scale,(this.camera.y+(r.y-a.y)/this.zoom)*scale,r.w/this.zoom*scale,r.h/this.zoom*scale,r.x,r.y,r.w,r.h];}

    travelerPose(){
      const j=this.journey,anchor=this.screen(D.roadPosition(j.from,j.to,j.progress)),unit=this.model.partyGroups().active[0];return {anchor,unit,art:unit?.fullbody||unit?.portrait};
    }
    drawTraveler(){
      const {anchor,unit,art}=this.travelerPose(),c=this.ctx,img=this.image(art?.src);if(!unit)return;
      const box={x:anchor.x-18,y:anchor.y-52,w:36,h:52};
      if(img){const src=art.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight},dst=root.BattleSystem.fitImage(src.width,src.height,box);root.BattleSystem.CanvasBattle.prototype.drawGroundShadow.call(this,dst);c.drawImage(img,src.x,src.y,src.width,src.height,dst.x,dst.y,dst.w,dst.h);}
      else{c.fillStyle='#152a3680';c.beginPath();c.ellipse(anchor.x,anchor.y,10,3,0,0,7);c.fill();this.text(unit.name.slice(0,1),anchor.x,anchor.y-16,16,'#edddbb','center');}
    }
    destinationBounds(){return {x:(this.w-Math.min(460,this.w-28))/2,y:Math.max(78,this.partyTop()-120),w:Math.min(460,this.w-28),h:106};}
    destinationRect(){return this.journey||D.placeMap[this.selected]?this.destinationBounds():null;}

    drawDestination(){
      const f=this.destinationRect();if(!f)return;const node=D.placeMap[this.selected],x=f.x+14,w=f.w-28,y=f.y;this.box(f.x,y,f.w,f.h,'#09212bed','#6b898b');this.hits.push({...f,label:'地点信息',action:()=>{}});
      if(this.journey){const target=D.placeMap[this.model.state.routeTarget||this.journey.to];this.text('前往 '+target.name,x,y+20,16,'#ead8ad');this.text('途经 '+D.placeMap[this.journey.to].name,x,y+44,14,'#bdcdd0');if(this.model.state.routeTarget)this.button('停止行路',x,y+66,w,30,()=>{this.model.cancelRoute();this.save(this.model.journey?.checkpoint);});else this.text('到下个地点停下',x,y+80,14,'#bdcdd0');return;}
      const current=node.id===this.model.state.nodeId,route=this.model.findRoute(node.id),kind={city:'城池',village:'村县',port:'渡口',pass:'关隘',camp:'营地'}[node.kind];this.text(node.name,x,y+20,16,'#ead8ad');this.text(node.requiresWater?'水路尚未开通':current?kind:route?kind+' · 途经 '+(route.nodes.length-1)+' 段道路':'暂无可通行道路',x,y+44,14,'#bdcdd0');
      this.button('×',f.x+f.w-38,y+7,28,28,()=>{this.selected=null;});
      if(current&&!node.requiresWater){this.button(node.kind==='city'?'进城':node.kind==='camp'?'入营':node.kind==='village'?'进村':'查看',x,y+66,(w-8)/2,30,()=>this.tryEnter());this.button('路过',x+(w+8)/2,y+66,(w-8)/2,30,()=>{this.selected=null;});}
      else this.button(node.requiresWater?'水路未开通':route?'前往':'无法到达',x,y+66,w,30,()=>this.travel(node.id),{disabled:!route||node.requiresWater});
    }

    drawPartyBar(){
      const c=this.ctx,members=this.model.members(),rects=this.partyRects();this.partyBarRects=rects;
      for(const r of rects){const u=members.find(u=>u.id===this.model.state.activeIds[r.index]);if(!u)continue;let drawnPortrait=null;const art=u.portrait||(root.CharacterAssets?.manifest.characters[u.characterId||u.id]?root.CharacterAssets.resolve(u.characterId||u.id).portrait:null),img=this.image(art?.src),hp=u.startSoldiers??u.maxSoldiers,y=r.y+r.h-50;
        c.save();if(hp<=0)c.globalAlpha=.4;if(img){const source=art.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight},dst=root.BattleSystem.fitImage(source.width,source.height,{x:r.x,y:r.y,w:r.w,h:r.h-54});drawnPortrait=dst;const pose=root.BattlePresentation.idlePose({mode:'auto',soldiers:hp,order:r.index},performance.now());c.translate(dst.x+dst.w/2+pose.x,dst.y+dst.h/2+pose.y);c.rotate(pose.angle);c.scale(pose.scale,pose.scale);c.drawImage(img,source.x,source.y,source.width,source.height,-dst.w/2,-dst.h/2,dst.w,dst.h);}c.restore();
        this.box(r.x,y,r.w,22,'#10171d','#75a8b5');const g=c.createLinearGradient(0,y,0,y+22);g.addColorStop(0,'#f33b33');g.addColorStop(.55,'#ad0009');g.addColorStop(1,'#e5221c');c.fillStyle=g;c.fillRect(r.x+2,y+2,(r.w-4)*clamp(hp/u.maxSoldiers,0,1),18);this.text(hp<=0?(u.dead?'濒死':'重伤'):Math.floor(hp),r.x+4,y+11,14,'#fff0ec');this.box(r.x,y+27,r.w,23,'#091e29','#75a8b5');this.text(u.name,r.x+r.w/2,y+38.5,14,'#75dbe7','center');
        if(!this.journey&&!this.dialogue&&!this.panel)this.hits.push({x:r.x,y:Math.min(drawnPortrait?.y??y,y),w:r.w,h:r.y+r.h-Math.min(drawnPortrait?.y??y,y),label:u.name+' · 状态',action:()=>this.openCharacter(u.id)});
      }
    }

    portrait(art,x,y,size,{frame=true}={}){const image=root.GameAssetLoader?.get(art?.src);if(frame)this.box(x,y,size,size,'#19343a','#668995');if(!image)return;const crop=art.crop||{x:0,y:0,width:image.naturalWidth,height:image.naturalHeight},c=this.ctx;c.save();c.beginPath();c.rect(x,y,size,size);c.clip();const scale=Math.max(size/crop.width,size/crop.height);c.drawImage(image,crop.x,crop.y,crop.width,crop.height,x+(size-crop.width*scale)/2,y+(size-crop.height*scale)/2,crop.width*scale,crop.height*scale);c.restore();}
    npcRole(npc){if(npc.heroQuest)return 'story';
      if(npc.questId)return 'story';
      const q=this.model.state.quests.changshan,sideTask=root.NearbyContent.sideQuests.some(t=>t.giver===npc.id&&!this.model.state.quests.side[t.id]?.paid),storyTask=(npc.id==='zhaoyun'&&q.stage!=='complete'&&npc.role!=='companion')||(npc.id==='changshan-elder'&&q.stage==='return')||(npc.id==='grain-steward'&&q.stage==='supplies')||(npc.id==='refugee-laborer'&&q.stage==='rescue');
      if(sideTask||storyTask)return 'story';
      return ['quest','story'].includes(npc.role)?'civilian':npc.role;
    }
    roleIcon(role,x,y,size=25,status=null){if(status){Panels.questIcon(this,status,x,y,size);return;}
      const ids={healer:'heal',heal:'heal',advice:'任务',training:'shortBlade',merchant:'背包',companion:'人物',story:'任务'};
      this.box(x,y,size,size,'#10232bee',null,3);
      if(ids[role])root.RpgIcons.draw(this.ctx,ids[role],x+1,y+1,size-2,{image:src=>this.image(src)});
      else{const c=this.ctx;c.save();c.beginPath();c.roundRect(x+3,y+4,size-6,size-11,3);c.moveTo(x+8,y+size-7);c.lineTo(x+5,y+size-2);c.lineTo(x+14,y+size-7);c.fillStyle='#c1d6cf';c.fill();c.fillStyle='#355461';for(let i=0;i<3;i++){c.beginPath();c.arc(x+8+i*4,y+10,1,0,7);c.fill();}c.restore();}
    }
    tryEnter(){
      if(this.battle||this.dialogue)return;
      if(this.model.enter()){this.dialogue=null;this.selected=null;this.save();if(this.model.state.nodeId==='changshan'&&['available','entry'].includes(this.model.state.quests.changshan.stage))this.startChangshanArrival();else if(this.model.state.nodeId==='changshan'&&this.model.state.quests.changshan.stage==='escort'&&this.model.beginStoryBattle('escort'))this.startBattle();else this.resumeForcedHeroScene();return;}
      const node=this.model.location(),text=node.kind==='village'?'站住，村里正在查人，现在不准进！问什么都没用，赶紧走，别堵在这儿。':'通行文书呢？没有就往后退，今天谁来都一样。还站着干什么，非得叫人把你叉出去？';this.speak(D.gateGuard,{lines:[text]});
    }
    questDialogue(npc){
      const q=this.model.state.quests.changshan,stage=q.stage;
      if(npc.id==='zhaoyun'&&['available','entry'].includes(stage)){this.startChangshanArrival();return;}
      if(npc.id==='zhaoyun'&&q.zhaoInvitation){this.offerZhaoJourney();return;}
      if(npc.id==='zhaoyun'&&stage==='decision'){this.speak(npc,{lines:['乡亲们有了粮，甄姑娘也在这里留了药，暂时不用担心了。这一趟若没有你帮忙，光凭我自己，还真顾不过来。','我听人说，刘玄德在成都收容了不少流民，一直想去看看。不过也不急这几日，你若还缺人手，我可以先跟你一起走。'],choices:[{label:'留下同行（推荐）',action:()=>this.finishZhaoQuest(true)},{label:'先去成都',action:()=>this.finishZhaoQuest(false)}]});return;}
      if(npc.id==='zhaoyun'){this.speak(npc,{lines:[{supplies:'中山有座粮仓，原先说好要给村里送粮，后来就断了消息。我想过去问问，你也一起吧，路上互相有个照应。',rescue:'仓守说车夫去了毋极，咱们到那边找他问路。祠堂里还有伤者，得尽快把人救出来。',escort:'车都装好了，我跟在最后，你在前头看路。要是听见后面喊停，别只顾着往前赶，伤者还坐在车上。',return:'乡亲们出来接了，咱们把车推到院里去吧。里正知道哪里有地方存粮，交给他安排。',complete:'这几天村里已经有人在修农具了，原先还担心春耕赶不上。等能重新下地，他们也就不必总等着别人送粮了。'}[stage]||'你等我一会儿，我看看乡亲们这边还缺什么，马上就好。']});return;}
      this.nearbyDialogue(npc);
    }
    startChangshanArrival(){
      const q=this.model.state.quests.changshan;if(this.disposed||this.battle||this.dialogue||this.model.pending||this.model.journey||this.model.state.nodeId!=='changshan'||!['available','entry'].includes(q.stage))return false;
      const fight=()=>{if(!this.disposed&&this.model.beginStoryBattle('entry'))this.startBattle();};if(q.arrivalSeen){fight();return true;}
      const turns=root.NearbyContent.storyConversations.changshanEntry,speakers={villager:{id:'entry-villager',name:'村民',art:'villager',side:'left'},hero:{id:'hero',name:this.character.name,art:'hero',side:'right'},thief:{id:'entry-thief',name:'盗贼',art:'thief',side:'left'},zhaoyun:{...D.questNpcs.zhaoyun,name:'青年枪客'}};
      const show=()=>{if(this.disposed)return;const line=turns[q.arrivalIndex];this.speak(speakers[line.speaker],{lines:[line.text],forced:true,onComplete:()=>{if(this.disposed)return;if(q.arrivalIndex+1<turns.length){q.arrivalIndex++;show();}else{q.arrivalSeen=true;q.arrivalIndex=0;this.save();fight();}}});this.save();this.invalidate();};show();return true;
    }
    requiredHeroScene(){return Object.values(root.HeroQuests.definitions).find(d=>d.place===this.model.state.nodeId&&d.stages[this.model.state.heroQuests[d.id]?.stage]?.strictDialogue);}
    resumeForcedHeroScene(){if(this.disposed||this.dialogue||this.panel||this.battle||this.model.pending||this.journey)return false;const d=this.requiredHeroScene();if(!d)return false;this.heroQuestDialogue(root.HeroQuests.npc(d.id,this.model.state.heroQuests[d.id]));this.invalidate();return true;}
    heroQuestDialogue(npc){const id=npc.heroQuest,d=root.HeroQuests.definitions[id],stage=this.model.state.heroQuests[id].stage,data=d.stages[stage].npc;if(!data)return;this.speak(npc,{lines:data.lines,forced:!!d.stages[stage].strictDialogue,choices:[...data.choices.map((choice,index)=>({label:choice.label+(choice.price?' · '+choice.price+'文':''),action:()=>{if(!this.model.chooseHeroQuest(id,index,stage)){this.notify(this.model.lastQuestError||'暂时不能进行。');return;}this.dialogue=null;this.save();if(this.model.pending){this.startBattle();return;}if(this.model.state.heroQuests[id].stage==='complete'){this.speak({...npc,name:'甘宁',art:'ganning'},{lines:[choice.recruit?'行，我跟你们走。往后有用得着我的地方，直接开口。':'那我先去建业。你们往后若是到了江东，记得来找我。']});}else{const next=root.HeroQuests.npc(id,this.model.state.heroQuests[id]);this.heroQuestDialogue(next);}}})),...(d.stages[stage].strictDialogue?[]:[{label:'暂且离开',dismiss:true,action:()=>this.closeDialogue()}])]});}
    offerZhaoJourney(){this.speak(D.questNpcs.zhaoyun,{lines:['村里快没粮了，原定从中山送来的粮也一直没到。我想过去问问，可乡亲们这边又放心不下，正缺个能搭把手的人。','你愿不愿意跟我一起去？办完这件事，我也好安顿好乡亲们，再考虑接下来的去处。'],choices:[{label:'一起前往',action:()=>{if(this.model.startChangshan()){this.save();this.speak(D.questNpcs.zhaoyun,{lines:['好，我跟你走。先到中山找仓守问问，他认得那些送粮的人。']});}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'暂不前往',dismiss:true,action:()=>this.closeDialogue()}]});}
    offerZhenStay(){this.speak(D.questNpcs.zhenji,{lines:['药箱找到了，粮也都装上了。这几天多亏你们照应，跟着你们走，我这点医术也总算能派上用场。','伤者已经安顿好了，我想问问，你们后面还需不需要人帮忙？如果愿意，我就继续同行；若是不方便，我先回毋极照顾那边的人。'],choices:[{label:'留下同行（推荐）',action:()=>{if(this.model.finishZhenStay(true)){this.save();this.speak(D.questNpcs.zhenji,{lines:['那我留下。药箱我会一直带着，路上谁不舒服，记得早些告诉我。']});}}},{label:'先回毋极',action:()=>{if(this.model.finishZhenStay(false)){this.save();this.speak(D.questNpcs.zhenji,{lines:['好，那我先回毋极。你们往后若是需要我，去那边找侍女，她知道我在哪儿。']});}}}]});}

    finishZhaoQuest(stay){if(!this.model.finishChangshan(stay))return;this.save();this.speak(D.questNpcs.zhaoyun,{lines:[stay?'好，那我跟你走。等你这边的事有了着落，咱们再找机会去成都。':'那我先去成都探探情况。你以后到了那边，记得来找我，这一趟并肩的交情，我可不会忘。','对了，前些日子有几个船户从南边过来，说新野最近多了不少往江东去的人。那边是南来北往的路口，消息也多。你若还想多知道些外头的事，可以先去新野查探消息。']});}
    trainerChoices(){
      const npc=D.townNpcs.camp.find(n=>n.id==='zhangliang'),choices=D.trainingOptions.map(t=>({label:t.label,action:()=>this.startTraining(t.id)}));
      choices.push({label:'聊聊操练',action:()=>this.speak(npc,{lines:['刚练的时候，别一下叫太多人。你光顾着看这个，旁边那个已经出手了，忙活半天，自己的招还没使出来。','先找一个人，把手里的兵器练顺了再加人。练岔了也别怕，在这儿挨一下，总比出门让贼捅一下强，我二哥就在边上呢。']})});
      if(this.model.state.trainingWins['three-brothers']&&!this.model.state.companions.some(u=>u.id==='zhangliang'))choices.push({label:'请你同行',action:()=>this.inviteZhangLiang()});
      choices.push({label:'告辞',action:()=>{this.dialogue=null;}});return choices;
    }
    speak(npc,{lines,choices,onComplete,forced=false}={}){
      if(!lines&&npc.heroQuest){this.heroQuestDialogue(npc);return;}
      if(!lines&&this.nearbyDialogue(npc))return;
      if(!lines&&npc.id==='zhenji'&&npc.role!=='companion'){this.questDialogue(npc);return;}
      if(!lines&&npc.role==='story'){this.questDialogue(npc);return;}
      if(!lines&&npc.role==='companion'){this.speak(npc,{lines:[{zhangliang:'回来了？我在营里待得正闷呢。你们这次准备去哪儿，要不要叫上我？',zhaoyun:'好久不见，这一路还顺利吗？我这边已经安顿好了，你若还要出门，我可以继续跟你走。',zhenji:'你们回来了，正好让我看看，上回那些伤都好了没有？若是还缺人照料，我可以跟你们一起去。'}[npc.id]||'我这边的事忙完了。你们接下来要去哪儿？需要的话，叫上我一起。'],choices:[{label:'请你同行',action:()=>{if(this.model.inviteResident(npc.id)){this.save();this.dialogue=null;}else if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);}},{label:'改日再会',action:()=>this.closeDialogue()}]});return;}
      if(!lines){if(npc.role==='advice')lines=this.model.campAdvice();else if(npc.role==='heal'){lines=['回来了？看你们身上又添了伤。都到这边坐吧，我一个个看，别着急。'];choices=[{label:'请先生医治',action:()=>{this.model.rest();this.save();this.speak(npc,{lines:['好了，伤口都替你们处理过了。先在营里歇一歇，喝点水，不用这么急着往外跑。']});}},{label:'暂不劳烦',action:()=>{this.dialogue=null;}}];}else if(npc.role==='training'){lines=['来练练？这会儿正好有地方。我叫几个人陪你，还是你想直接跟我比划比划？'];choices=this.trainerChoices();}else lines=npc.lines||[];}
      this.panel=null;this.dialogue={npc,lines,index:0,choices:choices||null,onComplete,forced:forced||!!onComplete||!!(choices?.length&&!choices.some(c=>c.dismiss||leaveLabels.has(c.label)))};
    }
    playConversation(turns,onComplete){const next=index=>{if(index>=turns.length){onComplete?.();return;}const turn=turns[index];this.speak(turn.npc,{lines:turn.lines,onComplete:()=>next(index+1)});};next(0);}
    dialogueExit(){const d=this.dialogue;if(!d||d.forced)return null;return d.choices?.find(c=>c.dismiss||leaveLabels.has(c.label))?.action||(()=>this.closeDialogue());}
    closeDialogue(){const d=this.dialogue;this.dialogue=null;d?.onComplete?.();}
    advanceDialogue(){const d=this.dialogue;if(!d)return;if(d.index<d.lines.length-1)d.index++;else if(!d.choices)this.closeDialogue();}
    inviteZhangLiang(){
      const npc=D.townNpcs.camp.find(n=>n.id==='zhangliang');if(!this.model.recruitZhangLiang()){if(this.model.lastRecruitError)this.notify(this.model.lastRecruitError);return;}this.save();this.speak(npc,{lines:['行，我去跟大哥说一声就来。你们在营门口等我，可别自己先走了。']});
    }
    drawTownBackdrop(){
      const w=this.w,h=this.h,c=this.ctx,node=this.model.location(),scene=(this.dialogue?.npc.sceneId&&root.BattleScenes.get(this.dialogue.npc.sceneId))||D.townScenes[node.id]||D.townScenes.default,img=root.GameAssetLoader?.get(scene.background);c.fillStyle='#152b2d';c.fillRect(0,0,w,h);if(img){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);c.drawImage(img,(w-img.naturalWidth*scale)/2,(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}c.fillStyle='#06192335';c.fillRect(0,0,w,h);c.fillStyle='#071923ed';c.fillRect(0,0,w,68);
    }
    drawTown(){
      this.drawTownBackdrop();if(this.dialogue)return;const npcs=this.model.sceneNpcs(),c=this.ctx,cardW=(this.w-38)/4,cols=Math.min(3,npcs.length),gap=12,top=91,bottom=this.partyTop()-61,rowH=cardW*1.16+33;this.townScroll=clamp(this.townScroll||0,0,Math.max(0,Math.ceil(npcs.length/3)*rowH-(bottom-top)));c.save();c.beginPath();c.rect(10,top,this.w-20,bottom-top);c.clip();npcs.forEach((npc,i)=>{const x=(this.w-(cols*cardW+(cols-1)*gap))/2+(i%3)*(cardW+gap),y=top+Math.floor(i/3)*rowH-this.townScroll,art=npc.art?root.CharacterAssets.resolve(npc.art).portrait:null,img=art?this.image(art.src):null,pictureH=cardW*1.16,cardH=pictureH+25;this.box(x,y,cardW,cardH,'#0b2530','#5c7d88');if(img){const a=art.crop,dst=root.BattleSystem.fitImage(a.width,a.height,{x:x+1,y:y+1,w:cardW-2,h:pictureH-2});c.drawImage(img,a.x,a.y,a.width,a.height,dst.x,dst.y,dst.w,dst.h);}else if(npc.icon)root.RpgIcons.draw(c,npc.icon,x+10,y+10,Math.min(cardW-20,pictureH-20),{image:src=>this.image(src)});this.text(npc.name,x+cardW/2,y+pictureH+12,14,'#e0dfc8','center');this.roleIcon(this.npcRole(npc),x+cardW-27,y+pictureH-25,25,this.model.npcQuestStatus(npc));if(y>=top&&y+cardH<=bottom)this.hits.push({x,y,w:cardW,h:cardH,label:npc.name+' · '+npc.roleLabel,action:()=>this.interact(npc)});});c.restore();this.button(this.model.state.nodeId==='camp'?'出营':'离开',28,this.partyTop()-48,this.w-56,36,()=>{this.model.leave();this.dialogue=null;this.save();this.focusLocation();});
    }
    drawDialogue(){
      const d=this.dialogue,w=this.w,h=this.h,c=this.ctx,last=d.index===d.lines.length-1,choices=last&&d.choices?d.choices:[{label:'继续',action:()=>this.advanceDialogue()}],columns=choices.length>3?2:1,rows=Math.ceil(choices.length/columns),buttonH=choices.length>3?36:40,gap=7;
      c.font=`16px ${UI.font}`;const textRows=UI.wrapLines(c,d.lines[d.index],w-52),panelH=Math.min(h-114,90+textRows.length*25+rows*(buttonH+gap)+22),top=h-panelH,side=d.npc.side||'left';
      if(d.npc.art)root.PengpaiStory.CanvasStory.prototype.bust.call(this,d.npc.art,side,top,true);
      const fade=c.createLinearGradient(0,top-24,0,h);fade.addColorStop(0,'#081b2600');fade.addColorStop(.2,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,w,panelH+24);c.strokeStyle='#bcab8644';c.beginPath();c.moveTo(24,top+45);c.lineTo(w-24,top+45);c.stroke();this.text(d.npc.name,side==='right'?w-26:26,top+24,16,'#ead1a2',side==='right'?'right':'left');
      textRows.forEach((text,i)=>this.text(text,26,top+71+i*25,16,'#e4e7de'));this.hits=[];
      const y=h-20-rows*(buttonH+gap),bw=(w-44-gap*(columns-1))/columns;choices.forEach((choice,i)=>{const full=columns===2&&i===choices.length-1&&choices.length%2===1;this.button(choice.label,22+(i%columns)*(bw+gap),y+Math.floor(i/columns)*(buttonH+gap),full?w-44:bw,buttonH,choice.action);});UI.singleChoiceHit(this.hits,w,h,choices);const exit=this.dialogueExit();if(exit){if(last&&d.choices?.length>1)this.hits.push({x:0,y:0,w,h:top,label:'点击空白离开',action:exit});}
    }
    drawNpcObserve(){
      const p=this.panel,b=p.preview,u=b.unit(p.unitId),c=this.ctx,f=this.frame('观察',620),left=f.x+20,right=f.x+f.w-20,inner=f.w-40,compact=this.h<640,art=root.CharacterAssets.resolve(p.npc.art).portrait,proto=root.BattleSystem.CanvasBattle.prototype;
      this.portrait(art,left,f.y+51,52);this.text(u.name,left+65,f.y+65,18,'#ead8b6');this.text(u.level+'级',left+65,f.y+91,14,'#c0d0d0');const type=root.PengpaiRules.WEAPON_TYPES.find(t=>t.id===u.weapon?.type);if(type)this.text(type.style,right,f.y+91,14,'#b4c7ce','right');
      const tabs=[['attributes','属性'],['equipment','装备'],['skills','技能']],tabW=(inner-12)/3;tabs.forEach(([id,label],i)=>this.button(label,left+i*(tabW+6),f.y+118,tabW,34,()=>{p.tab=id;p.scroll=0;},{active:p.tab===id}));
      const start=f.y+166,bottom=f.y+f.h-17,headerHits=this.hits.length;let y=start-(p.scroll||0);c.save();c.beginPath();c.rect(left,start,inner,bottom-start);c.clip();
      const section=title=>{this.text(title,left,y+12,16,'#e6ca94');c.strokeStyle='#38565d';c.beginPath();c.moveTo(left,y+30);c.lineTo(right,y+30);c.stroke();y+=compact?36:43;};
      const pair=(label,value)=>{this.text(label,left,y+11,14,'#aebfc4');this.text(value,right,y+11,14,'#e4e5d7','right');y+=compact?27:31;};
      if(p.tab==='attributes'){
        section('基础属性');const potential=root.CharacterGrowth.isGeneral(u)&&u.potentials;this.text('属性',left,y+9,14,'#92aeb7');this.text('当前',potential?left+inner*.55:right,y+9,14,'#92aeb7','right');if(potential)this.text('潜力',right,y+9,14,'#d7bb88','right');y+=compact?26:29;
        for(const [key,label]of root.PengpaiRules.ATTRIBUTES){this.box(left,y-3,inner,28,'#102b34',null);this.text(label,left+9,y+10,14,'#d8e4e4');this.text(u[key],potential?left+inner*.55:right-9,y+10,14,'#eae4cb','right');if(potential)this.text(u.potentials[key],right-9,y+10,14,'#d8be8a','right');y+=compact?30:33;}
        y+=compact?6:10;section('战斗能力');pair('生命',u.soldiers+' / '+u.maxSoldiers);pair('护甲',b.effective(u).armor);pair('抗性',b.effective(u).resistance);
      }else if(p.tab==='equipment'){
        section('当前装备');pair('武器',u.weapon?.name||'未持兵器');pair('武器威力',u.attack);pair('盔甲',u.equipment?.armor?.name||'未装备');pair('饰品',u.equipment?.accessory1?.name||'未装备');pair('饰品',u.equipment?.accessory2?.name||'未装备');y+=8;section('武器熟练度');for(const group of root.WeaponCatalog.groupedTypes()){section(group.name);for(const type of group.types)pair(type.name,u.weaponProficiencies?.[type.id]||0);}
      }else{
        section('武器技能');const columns=Math.max(1,u.skills.length),colW=(inner-8*(columns-1))/columns,cardH=142;
        u.skills.forEach((id,i)=>{const skill=b.skills[id],x=left+i*(colW+8),icon=40;this.box(x,y,colW,cardH,'#102a34','#385a65');this.box(x+(colW-icon)/2,y+12,icon,icon,'#0b222d','#688b98');proto.drawSkillIcon.call(this,skill,x+(colW-icon)/2,y+12,icon);this.text(skill.name,x+colW/2,y+76,14,'#e4e6d9','center');const role=proto.skillRole.call(this,skill),scope=/^(单体|群体|自身)/.exec(role)?.[0]||'';this.text(scope||role,x+colW/2,y+101,14,'#b0c8ce','center');if(scope)this.text(role.slice(scope.length),x+colW/2,y+123,14,skill.kind==='heal'?'#87d7a6':'#c7b5da','center');this.hits.push({x,y,w:colW,h:cardH,label:'查看'+skill.name+'详情',action:()=>{this.panel={type:'npcSkill',preview:b,unitId:u.id,skill:id,scroll:0,previous:p};}});});y+=cardH+21;section('被动技能');
        if(!u.passives.length){this.text('暂无被动',left,y+9,14,'#9fb6bd');y+=30;}
        for(const id of u.passives){const passive=b.passives[id];this.text(passive.name,left,y+9,14,root.PengpaiRules.QUALITIES[passive.quality]?.color||'#ef9389');y+=30;y=this.wrap(passive.description,left,y+8,inner,{size:14,line:24})+15;}
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
    showReward(reward){this.panel={type:'reward',reward:copy(reward),started:performance.now(),scroll:0};this.animate();}
    finishReward(continueQuest){const context=this.model.state.afterBattle;this.model.state.pendingReward=null;this.model.state.afterBattle=null;if(this.model.journey)this.model.journey.checkpoint=this.model.snapshot();this.panel=null;this.save();if(continueQuest){if(this.model.beginSideBattle(continueQuest))this.startBattle();return;}this.afterBattle(context,true);this.invalidate();}
    frame(title,height,{closable=true,titleAlign='left',maxWidth=460,inset=14,verticalInset=16}={}){const c=this.ctx,w=Math.min(maxWidth,this.w-inset*2),h=Math.min(height,this.h-verticalInset*2),x=(this.w-w)/2,y=(this.h-h)/2;c.fillStyle='#020b11bd';c.fillRect(0,0,this.w,this.h);this.box(x,y,w,h,'#0c222b','#7a8f8e',6);this.hits=[];this.text(title,titleAlign==='center'?x+w/2:x+18,y+25,20,'#ead8b6',titleAlign);if(closable)this.button('×',x+w-44,y+9,30,30,()=>{if(this.panel?.type==='event')this.finishEvent(this.panel.decision.defaultId);else if(this.panel?.type==='mapGuide')this.finishIntroduction();else this.closeWorldPanel();});return{x,y,w,h};}
    dismissOutside(frame,action){const {x,y,w,h}=frame;this.hits.unshift(...[{x:0,y:0,w:this.w,h:y},{x:0,y:y+h,w:this.w,h:this.h-y-h},{x:0,y,w:x,h},{x:x+w,y,w:this.w-x-w,h}].filter(r=>r.w>0&&r.h>0).map(r=>({...r,label:'点击空白离开',action})));}
    drawPanel(){
      const panel=this.panel;if(Panels.draw(this))return;if(panel.type==='tacticsEditor'){const editor=panel.editor;editor.w=this.w;editor.h=this.h;editor.drawPanel();this.hits=editor.hits;return;}
      if(panel.type==='npcMenu'){
        const npc=panel.npc,canObserve=!!this.model.npcUnit(npc.id),f=this.frame(npc.name,canObserve?256:208),choices=[{label:'对话',action:()=>this.speak(npc)},...(canObserve?[{label:'观察',action:()=>this.observeNpc(npc)}]:[]),{label:'离开',action:()=>{this.panel=null;}}];choices.forEach((choice,i)=>this.button(choice.label,f.x+22,f.y+62+i*52,f.w-44,40,choice.action));this.dismissOutside(f,()=>{this.panel=null;});return;
      }
      if(panel.type==='npcObserve')return this.drawNpcObserve();
      if(panel.type==='npcSkill')return this.drawNpcSkill();
      if(panel.type==='mapIntro'){
        const top=this.h-208,c=this.ctx;root.PengpaiStory.CanvasStory.prototype.bust.call(this,'hero','right',top,true);const fade=c.createLinearGradient(0,top-24,0,this.h);fade.addColorStop(0,'#081b2600');fade.addColorStop(.25,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,this.w,232);this.text(this.character.name,this.w-26,top+24,16,'#ead1a2','right');this.wrap('这里离常山很近，可以先去那里看看。',26,top+73,this.w-52,{size:16,line:25,color:'#f1ece2'});this.text('›',this.w-32,this.h-30,24,'#c7b386','center');this.hits=[];UI.singleChoiceHit(this.hits,this.w,this.h,[{action:()=>this.advanceIntroduction()}]);return;
      }
      if(panel.type==='mapGuide'){const f=this.frame('行路',240);this.wrap('点击地点选中，双击自动沿最短路线前往。',f.x+22,f.y+78,f.w-44,{size:16,line:26,color:'#e4e7de'});this.button('知道了',f.x+22,f.y+f.h-62,f.w-44,42,()=>this.finishIntroduction());UI.singleChoiceHit(this.hits,this.w,this.h,[{action:()=>this.finishIntroduction()}]);return;}
      if(panel.type==='menu'){const f=this.frame('设置',190);this.button('保存',f.x+20,f.y+62,f.w-40,40,()=>{this.save();this.panel={type:'notice',title:'存档',text:this.saveError?'存档未能写入。':'已保存当前行程。'};});this.button('返回主菜单',f.x+20,f.y+112,f.w-40,40,()=>{this.save();this.options.onExit?.();});return;}
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
          if(unit.id!=='hero'&&!unit.guest&&(unit.homeNode||unit.id==='zhangliang'))this.button('离队',f.x+f.w-80,y+42,60,32,()=>{const home=unit.homeNode||'camp';if(this.model.dismiss(unit.id)){this.save();this.panel={type:'notice',title:'辞别',text:unit.name+'返回了'+D.placeMap[home].name+'，可在那里再邀同行。'};}});
          this.text(unit.weapon?.name||'未持兵器',f.x+20,y+86,14,'#93b5bd');}y+=112;
        }c.restore();this.hits=this.hits.filter((hit,i)=>i<initialHits||(hit.y>=top&&hit.y+hit.h<=bottom));return;
      }
    }
    travel(to,options={}){
      const plan=this.model.planRoute(to);if(!plan.ok)return;this.panel=null;this.selected=null;this.startNextLeg(options);
    }
    startNextLeg(options={}){
      if(this.disposed||this.journey||this.battle||this.model.pending)return;const result=this.model.journey?{ok:true,from:this.model.journey.from,to:this.model.journey.to}:this.model.beginNextLeg(options);if(!result.ok)return;
      this.selected=null;this.journey={from:result.from,to:result.to,progress:this.model.journey.checked ? .5 : 0,last:performance.now(),paused:false};this.save(this.model.journey.checkpoint);this.animate();
    }
    tickJourney(){
      const j=this.journey;if(!j||j.paused)return;const now=performance.now(),delta=Math.min(80,Math.max(0,now-j.last)),leader=this.model.partyGroups().active[0];j.last=now;j.progress=Math.min(1,j.progress+delta/D.travelDurationMs(j.from,j.to,leader?.potentials?.speed??50));
      if(j.progress>=.5&&!this.model.journey.checked){const event=this.model.travelEvent();if(event.kind!=='quiet'){j.progress=.5;j.paused=true;this.openEvent(event);}}
      this.camera=D.roadPosition(j.from,j.to,j.progress);this.boundCamera();
      if(j.progress>=1){this.model.finishTravel();this.journey=null;this.selected=this.model.state.nodeId;this.save();if(this.model.state.routeTarget)this.startNextLeg();}
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
    startBattle(){
      const scenario=this.model.battleScenario(),settings=this.options.store.settings(),autoStart=this.model.pending.kind==='story'&&this.model.pending.phase==='entry';clearTimeout(this.eventTimer);this.panel=null;this.dialogue=null;
      const save=view=>{for(const unit of view.battle.units.filter(u=>u.side==='ally'))this.model.saveTactics(unit);this.save(this.model.pending?.checkpoint);};
      this.save(this.model.pending.checkpoint);this.battle=root.BattleSystem.mount(this.canvas,scenario,{...settings,autoStart,hideResult:true,onTacticsSave:(unit,view)=>save(view),onPrepareChange:save,onPrepared:save,onComplete:result=>{this.timer=setTimeout(()=>{if(this.disposed)return;const context={...this.model.pending};this.battle.destroy();this.battle=null;const victory=this.model.resolveBattle(result);if(!victory)this.journey=null;this.selected=null;this.resize();this.save(this.model.journey?.checkpoint);if(victory)this.showReward(this.model.lastReward);else this.afterBattle(context,false);this.invalidate();},600);}});if(autoStart)this.battle.notify('赵云赶来助阵');
    }
    afterBattle(context,victory){
      if(context?.kind==='quest-turn-in')return;
      if(!context)return;
      if(context.kind==='heroQuest'){if(victory){const npc=root.HeroQuests.npc(context.questId,this.model.state.heroQuests[context.questId]);this.heroQuestDialogue(npc);}else this.speak({id:'hero',name:this.character.name,art:'hero',side:'right'},{lines:['守卫比想的还难对付。先退出来，把伤养好，再找机会救人。']});return;}
      if(context.kind==='training'){const followup=()=>{if(victory&&context.trainingId==='three-brothers'&&!this.model.state.companions.some(u=>u.id==='zhangliang'))this.speak(D.townNpcs.camp.find(n=>n.id==='zhangliang'),{lines:['好家伙，连我们三个都让你们赢了！天天在营里练也没什么意思，你们下回出门，带上我怎么样？'],choices:[{label:'请同行',action:()=>this.inviteZhangLiang()},{label:'改日再请',action:()=>this.closeDialogue()}]});};this.speak(D.townNpcs.camp.find(n=>n.id==='zhangbao'),{lines:['过来让我看看，刚才那下打得不轻……好了，都替你们治过了。要接着练也先缓一缓，我三弟下手总是没个轻重。'],onComplete:followup});return;}
      if(context.kind==='story'){
        if(!victory){this.speak(D.questNpcs.zhaoyun,{lines:['别追了，先退回来！咱们这样带着伤再打，谁也顾不上谁。等处理好伤口，重新商量个办法再去。']});return;}
        if(context.phase==='entry'){
          this.playConversation([{npc:D.questNpcs.zhaoyun,lines:['怎么样，伤到没有？刚才顾着追他们，没来得及问你。我叫赵云，这些天一直在村里照看逃难来的乡亲。']},{npc:{id:'hero',name:this.character.name,art:'hero',side:'right'},lines:['你就是赵云？常山赵子龙？我叫'+this.character.name+'，从黄巾营地过来的，本来正想找你，没想到刚进村就碰上了。']},{npc:D.questNpcs.zhaoyun,lines:['是我。原来你是特意过来找我的，那先去乡医那边坐坐，等他替你看完伤，咱们再聊。']}],()=>{this.model.rest();this.save();if(this.model.state.quests.changshan.zhaoInvitation)this.offerZhaoJourney();});return;
        }
        if(context.phase==='grain'&&this.model.state.quests.changshan.healerJoined){this.model.rest();this.save();}
        if(context.phase==='grain'&&this.model.state.quests.changshan.healerDecision){this.offerZhenStay();return;}
        const lines={grain:this.model.state.quests.changshan.grainWins<2?['前仓的粮还在，我已经请仓守来点数了。剩下的人都退进了后院，咱们歇口气再过去，别让他们趁机把粮搬走。']:['两边都找过了，少了几袋，剩下的够村里吃一阵。我去搭把手装车，你也坐下来歇会儿，装好咱们就回常山。'],rescue:['多谢你们，我姓甄，原先在中山替乡亲们看伤。他们听说我家里有粮，就把我扣在这里，非要我写信回去要粮。','还有几个人伤得不轻，药箱却留在中山的粮仓里了。我听你们说要去夺粮，能不能带上我？取回药，路上我也能帮着照顾大家。'],escort:['到村口了，这回总算没再跟上来。你去告诉里正一声，我帮他们把车推进去。','乡亲们已经等了好几天，快去吧，见着粮车回来，他们也能放心了。']}[context.phase];this.speak(context.phase==='rescue'?D.questNpcs.zhenji:D.questNpcs.zhaoyun,{lines:lines||['我去看看乡亲们怎么样了。你也歇一会儿，等人都齐了，咱们再商量下一步。'],forced:true});return;
      }
      if(!victory)this.panel={type:'notice',title:'战败',text:'已恢复战前存档，整顿后可以再战。'};else if(this.journey||this.model.journey||this.model.state.routeTarget)this.resumeJourney();
    }
    destroy(){this.disposed=true;PartyInput.cancel(this);clearTimeout(this.timer);clearTimeout(this.eventTimer);clearTimeout(this.rewardTimer);clearTimeout(this.noticeTimer);cancelAnimationFrame(this.raf);this.battle?.destroy();this.observer.disconnect();for(const [event,fn]of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['keydown',this.key],['wheel',this.wheel]])this.canvas.removeEventListener(event,fn);}
  }
  root.WorldMap={CanvasWorld,mount:(canvas,options)=>new CanvasWorld(canvas,options)};if(typeof module!=='undefined'&&module.exports)module.exports={CanvasWorld};
})(globalThis);
