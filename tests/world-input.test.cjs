const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/world-data.js');const {World}=require('../js/world.js');require('../js/ui-theme.js');const {CanvasWorld}=require('../js/canvas-world.js');
const base=()=>{let actions=0;const v=Object.assign(Object.create(CanvasWorld.prototype),{battle:null,panel:null,press:null,revision:0,drawnRevision:0,zoom:.95,mapRect:{x:12,y:92,w:366,h:574},camera:{x:740,y:150},model:new World({name:'无名氏',attributes:{leadership:100}}),canvas:{setPointerCapture(){}},hits:[{x:30,y:200,w:100,h:40,action(){actions++;}}],point:e=>({x:e.clientX,y:e.clientY}),invalidate(){this.revision++;}});return {v,count:()=>actions};};
const e=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,button:0});
test('新地图默认能看到乡县，缩放平滑过渡并保存目标缩放，连续点击不会丢失缩放档位',()=>{
 const previous=global.performance;let now=100;global.performance={now:()=>now};try{const {v}=base(),zoom=v.model.state.mapZoom;assert.equal(zoom,Math.max(...D.places.map(D.mapLayout.minZoom))*1.3**2);v.zoom=zoom;v.save=()=>{};v.changeZoom(1.3);assert.equal(v.zoom,zoom);now+=110;v.tickZoom(now);assert.ok(v.zoom>zoom&&v.zoom<zoom*1.3);v.changeZoom(1.3);const last=v.zoomAnimation;assert.ok(Math.abs(last.to-zoom*1.3*1.3)<1e-9);now+=220;v.tickZoom(now);assert.equal(v.zoomAnimation,null);assert.equal(v.zoom,last.to);assert.equal(new World(v.model.character,v.model.snapshot()).state.mapZoom,last.to);}finally{global.performance=previous;}
});
test('地图未接任务只在附近可见，接取后异地追踪，完成战斗后标记交付地点',()=>{
 const {v}=base(),w=v.model;w.arrive('chengdu');assert.equal(w.questMarkers().some(q=>q.title==='山道清剿'),false);w.arrive('changshan');assert.ok(w.questMarkers().some(q=>q.title==='山道清剿'&&!q.accepted));w.acceptSide('clear-mountain');w.arrive('chengdu');assert.ok(w.questMarkers().some(q=>q.place==='zhongshan'&&q.accepted));w.state.quests.side['clear-mountain'].wins=5;assert.ok(w.questMarkers().some(q=>q.place==='changshan'&&q.accepted));
});
test('地图拖动与点击互斥，拖过地标不会触发前往',()=>{const {v,count}=base();v.hits[0].placeId='julu';v.hits[0].center={x:80,y:220};v.down(e(50,220));v.move(e(150,300));v.up(e(150,300));assert.equal(count(),0);assert.notEqual(v.camera.x,740);});
test('地图与弹窗切换后拒绝旧点击，未绘制的新界面也不会穿透旧按钮',()=>{const {v,count}=base();v.down(e(50,220));v.panel={type:'menu'};v.invalidate();v.up(e(50,220));assert.equal(count(),0);v.down(e(50,220));v.up(e(50,220));assert.equal(count(),0);});
test('多个触点互不接管点击，狂点同一按钮不会在重绘前重复执行',()=>{const {v,count}=base();v.down(e(50,220));v.down(e(50,220,2));v.up(e(50,220,2));assert.equal(count(),0);v.up(e(50,220));assert.equal(count(),1);v.down(e(50,220));v.up(e(50,220));assert.equal(count(),1);v.drawnRevision=v.revision;v.down(e(50,220));v.up(e(50,220));assert.equal(count(),2);});
test('地图聚焦与缩放限制在地图边界，北方开局不会留下大片画外空白',()=>{const {v}=base();v.focusLocation();assert.ok(v.camera.y>=v.mapRect.h/(2*v.zoom));v.zoom=.12;v.camera={x:-9999,y:99999};v.boundCamera();assert.ok(v.camera.x>=0);assert.equal(v.camera.y,Math.max(D.bounds.height-v.mapRect.h/(2*v.zoom),D.bounds.height/2));});

test('相邻和远处可达地标都可双击启程，海外地点只能选中',()=>{
 const {v}=base();let target=null;v.travel=id=>{target=id;};v.selectPlace('julu',100);assert.equal(target,null);v.selectPlace('julu',300);assert.equal(target,'julu');target=null;v.selectPlace('chengdu',400);v.selectPlace('chengdu',500);assert.equal(target,'chengdu');assert.equal(v.selected,'chengdu');target=null;v.selectPlace('yamatai',600);v.selectPlace('yamatai',700);assert.equal(target,null);assert.equal(v.selected,'yamatai');
});
test('同一帧内的地图双击有效，但新弹窗不能沿用旧地图命中区',()=>{
 const {v}=base();let trips=0;v.hits=[{x:30,y:200,w:100,h:40,placeId:'julu',center:{x:50,y:220},action:()=>v.selectPlace('julu',performance.now())}];v.travel=()=>{trips++;};v.down(e(50,220));v.up(e(50,220));v.down(e(50,220));v.up(e(50,220));assert.equal(trips,1);
 v.panel={type:'tasks'};v.down(e(50,220));v.up(e(50,220));assert.equal(trips,1);
});

test('行路模型按出战首位选择，脚底锚定实际路线，不再绘制摇摆脚线',()=>{
 const {v}=base();v.journey={from:'camp',to:'changshan',progress:.4};const expected=v.screen(D.roadPosition('camp','changshan',.4));assert.deepEqual(v.travelerPose().anchor,expected);assert.equal(v.travelerPose().unit.id,'hero');const z=v.model.zhaoYunUnit();v.model.recordRecruit('zhaoyun','shu',z);v.model.setActive(['zhaoyun','hero']);assert.equal(v.travelerPose().unit.id,'zhaoyun');v.model.reorderParty('active','hero',0);assert.equal(v.travelerPose().unit.id,'hero');assert.deepEqual(v.travelerPose().anchor,expected);
});
test('营地到常山为1秒，不同路线统一按实际道路长度计算耗时',()=>{
 assert.equal(D.travelDurationMs('camp','changshan'),1000);assert.equal(D.travelDurationMs('changshan','camp'),1000);
 const list=D.roads.map(([a,b])=>({a,b,length:D.roadLength(a,b)})).sort((a,b)=>a.length-b.length),short=list[0],long=list.at(-1),previous=global.performance;global.performance={now:()=>80};
 try{for(const road of [short,long]){const {v}=base();v.journey={from:road.a,to:road.b,progress:0,last:0};v.model.journey={checked:true};v.boundCamera=()=>{};v.tickJourney();assert.ok(Math.abs(v.journey.progress*road.length-D.travelRules.speed*.08/D.travelTimeFactor(v.model.partyGroups().active[0]?.potentials?.speed??50))<1e-9);}assert.ok(Math.abs(D.travelDurationMs(long.a,long.b)/D.travelDurationMs(short.a,short.b)-long.length/short.length)<1e-9);
 const [a,b]=D.roads.find(([a,b])=>D.roadPath(a,b).length>2),path=D.roadPath(a,b),length=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);assert.ok(Math.abs(D.travelDurationMs(a,b)*D.travelRules.speed/1000-length)<1e-9);
 }finally{global.performance=previous;}
});
test('安静路段通过中点不损失本帧已行进的距离',()=>{
 const {v}=base(),previous=global.performance;let now=0;global.performance={now:()=>now};try{v.model.beginTravel('julu',{eventRoll:.8});v.journey={from:'camp',to:'julu',progress:0,last:0};v.boundCamera=()=>{};const duration=D.travelDurationMs('camp','julu',v.model.partyGroups().active[0]?.potentials?.speed??50),steps=Math.ceil(duration*.6/80);for(let i=0;i<steps;i++){now+=80;v.tickJourney();}assert.ok(v.model.journey.checked);assert.ok(Math.abs(v.journey.progress-now/duration)<1e-9);}finally{global.performance=previous;}
});

test('地图动画抵达中途地标后自动衔接下一段，途中仍逐段结算事件',()=>{
 const {v}=base(),previous=global.performance;let now=0,saves=0;global.performance={now:()=>now};
 try{v.save=()=>{saves++;};v.animate=()=>{};v.boundCamera=()=>{};v.model.state.steps=2;v.model.state.lastEventStep=2;const route=v.model.findRoute('chengdu');v.travel('chengdu');assert.equal(v.journey.from,'camp');let reached=0;
  for(let i=0;i<2000&&v.journey;i++){now+=80;v.tickJourney();if(v.panel?.type==='event'){assert.equal(v.journey.paused,true);if(v.panel.event.kind==='battle')v.model.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:50}]});v.panel=null;v.resumeJourney();}reached=v.model.state.steps-2;}
  assert.equal(v.model.state.nodeId,'chengdu');assert.equal(v.model.state.routeTarget,null);assert.equal(v.journey,null);assert.equal(reached,route.nodes.length-1);assert.ok(saves>=2*reached);assert.equal(v.selected,'chengdu');
 }finally{global.performance=previous;}
});

test('浮在地图上的UI拖动不接管地图，空白地图仍可拖动',()=>{
 const {v,count}=base(),before={...v.camera};v.down(e(50,220));v.move(e(150,300));v.up(e(150,300));assert.equal(count(),0);assert.deepEqual(v.camera,before);v.hits=[];v.drawnRevision=v.revision;v.down(e(160,320));v.move(e(210,360));v.up(e(210,360));assert.notEqual(v.camera.x,before.x);
});

function animationHarness(){
 const {v}=base(),previous={requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame,performance:global.performance},frames=new Map();let now=100,id=0,draws=0;
 global.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};global.cancelAnimationFrame=key=>frames.delete(key);global.performance={now:()=>now};
 Object.assign(v,{disposed:false,raf:0,idleFrameAt:100,dialogue:null,journey:null,invalidate:CanvasWorld.prototype.invalidate,tickJourney(){},draw(){draws++;this.hits=[{x:30,y:200,w:100,h:40,label:this.panel?'离开':this.dialogue?'继续':'赵云',action:()=>{if(this.panel)this.panel=null;else if(this.dialogue)this.dialogue=null;else this.interact({id:'zhaoyun',name:'赵云'});}}];this.drawnRevision=this.revision;}});v.draw();
 return {v,frames,draws:()=>draws,step(time){now=time;const next=frames.entries().next().value;assert.ok(next,'应有待处理的动画帧');frames.delete(next[0]);next[1](time);},restore(){for(const [key,value]of Object.entries(previous)){if(value===undefined)delete global[key];else global[key]=value;}}};
}
test('队伍待机的限帧不能吞掉打开赵云菜单或离开的重绘，后续点击仍然有效',()=>{
 const h=animationHarness(),{v}=h;try{v.animate();v.down(e(50,220));v.up(e(50,220));assert.equal(v.panel.type,'npcMenu');h.step(116);assert.equal(v.drawnRevision,v.revision);assert.equal(v.hits[0].label,'离开');v.down(e(50,220));v.up(e(50,220));h.step(120);assert.equal(v.panel,null);assert.equal(v.drawnRevision,v.revision);assert.equal(v.hits[0].label,'赵云');assert.ok(h.frames.size>0);v.down(e(50,220));v.up(e(50,220));h.step(128);assert.equal(v.hits[0].label,'离开');}finally{h.restore();}
});
test('从待机切入对话后，即使不足33毫秒也必须绘制，不能留下永远过期的点击区域',()=>{
 const h=animationHarness(),{v}=h;try{v.animate();v.dialogue={npc:{name:'赵云'}};v.invalidate();h.step(108);assert.equal(v.drawnRevision,v.revision);assert.equal(v.hits[0].label,'继续');assert.equal(h.frames.size,0);v.down(e(50,220));v.up(e(50,220));h.step(112);assert.equal(v.dialogue,null);assert.equal(v.drawnRevision,v.revision);}finally{h.restore();}
});
test('没有界面变化时仍限制待机重绘，33毫秒内只续订动画而不额外绘制',()=>{
 const h=animationHarness(),{v}=h;try{const before=h.draws();v.animate();h.step(116);assert.equal(h.draws(),before);assert.equal(h.frames.size,1);h.step(134);assert.equal(h.draws(),before+1);}finally{h.restore();}
});
test('路遇倒计时只刷新画面，跨秒按下抬起仍只执行一次迎战，不被刷新吞掉',()=>{
 const {v,count}=base(),saved={setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,requestAnimationFrame:global.requestAnimationFrame,performance:global.performance};let timer,now=0;global.performance={now:()=>now};global.setTimeout=fn=>{timer=fn;return 1;};global.clearTimeout=()=>{};global.requestAnimationFrame=()=>1;
 try{v.disposed=false;v.raf=0;v.invalidate=CanvasWorld.prototype.invalidate;v.panel={type:'event',decision:new (require('../js/timed-choice.js').Decision)([{id:'battle',label:'迎战',action:'battle'}],0)};v.down(e(50,220));const revision=v.revision;v.scheduleEventTick(v.panel);now=1000;timer();assert.equal(v.revision,revision);v.up(e(50,220));assert.equal(count(),1);v.up(e(50,220));assert.equal(count(),1);}finally{Object.assign(global,saved);}
});
test('事件暂停行路时，仍持续按约30帧刷新底部人物呼吸，而非每秒跳动一次',()=>{
 const h=animationHarness(),{v}=h;try{v.panel={type:'event'};v.journey={paused:true};assert.equal(v.idleVisible(),true);const before=h.draws();v.animate();for(let i=1;i<=60;i++)h.step(100+i*34);assert.equal(h.draws()-before,60);assert.equal(h.frames.size,1);v.model.state.showParty=false;assert.equal(v.idleVisible(),false);}finally{h.restore();}
});
