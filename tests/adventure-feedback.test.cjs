const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../js/adventure-feedback.js'),R=require('../js/game-rules.js'),G=require('../js/character-growth.js'),{World}=require('../js/world.js'),{Battle}=require('../js/engine.js');
require('../js/ui-theme.js');require('../js/presentation.js');const Panels=require('../js/world-panels.js');
const hero=()=>({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)});
const memory=()=>{const values=new Map();return new R.SaveStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)});};

test('真实常山五战逐段提供结果和下一步，奖励存读档不重复发放，失败保持战前任务',()=>{
 let w=new World(hero(),{introStep:2});w.chooseWeapon('sword');const store=memory();
 for(const [place,phase] of [['changshan','entry'],['zhongshan-county','rescue'],['zhongshan','grain'],['zhongshan','grain'],['changshan','escort']]){
  if(phase==='rescue'){w.arrive('zhongshan');assert.ok(w.advanceChangshan());}
  w.arrive(place);assert.ok(w.beginStoryBattle(phase));const checkpoint=w.pending.checkpoint;
  const failed=new World(w.character,w.snapshot());failed.pending=JSON.parse(JSON.stringify(w.pending));assert.equal(failed.resolveBattle({result:'defeat'}),false);assert.equal(failed.state.quests.changshan.stage,checkpoint.quests.changshan.stage);assert.equal(failed.state.money,checkpoint.money);
  const b=new Battle(w.battleScenario());b.start();b.advance(180);assert.equal(b.status,'victory');assert.ok(w.resolveBattle(b.export()));const reward=w.lastReward;
  assert.ok(reward.story.title);assert.ok(reward.story.next);if(phase==='rescue')assert.match(reward.story.text,/甄姬.*加入/);if(phase==='grain')assert.equal(reward.progress.value,w.state.quests.changshan.grainWins/2);
  if(phase==='entry'){assert.equal(w.character.level,2);assert.equal(reward.milestone.experience,20);assert.match(reward.story.text,/20经验/);}
  const money=w.state.money;store.save(0,w.character,{stage:'world',world:w.snapshot()});const slot=store.slots()[0];w=new World(slot.character,slot.progress.world);assert.deepEqual(w.state.pendingReward.story,reward.story);assert.equal(w.state.money,money);assert.equal(w.resolveBattle(b.export()),false);assert.equal(w.state.money,money);
  w.state.pendingReward=null;w.state.afterBattle=null;if(phase==='entry')assert.ok(w.startChangshan());if(phase==='grain'&&w.state.quests.changshan.healerDecision)w.finishZhenStay(true);w.rest();
 }
 assert.ok(w.advanceChangshan());assert.ok(w.finishChangshan(true));assert.equal(F.objective(w),null);assert.equal(w.counts().wei,1);assert.equal(w.counts().shu,1);
});

test('满队救人反馈明确甄姬留在毋极，不宣称加入，地图追踪匹配当前阶段',()=>{
 const w=new World(hero(),{introStep:2});w.state.quests.changshan.healerJoined=false;
 assert.match(F.battle({kind:'story',phase:'rescue'},w).text,/暂留毋极/);
 w.state.quests.changshan.stage='rescue';assert.match(F.objective(w)[1],/毋极/);w.state.quests.changshan.stage='decision';assert.match(F.objective(w)[1],/赵云/);
});

test('已经成长的旧档不领取初战补助，普通敌人经验公式保持不变',()=>{
 const X=require('../js/experience.js'),w=new World(G.characterAt(hero(),5),{introStep:2});w.chooseWeapon('sword');w.arrive('changshan');assert.ok(w.beginStoryBattle('entry'));const b=new Battle(w.battleScenario());b.start();b.advance(180);assert.equal(b.status,'victory');const expected=X.reward(b.units.filter(u=>u.side==='enemy'),w.character);w.resolveBattle(b.export());assert.equal(w.lastReward.milestone,undefined);assert.equal(w.lastReward.gains.find(g=>g.id==='hero').amount,expected);
});


test('升级面板显示由真实基础与潜力累计计算的属性增长，未升级不虚报',()=>{
 const u=G.create('hero',1);assert.equal(F.growth({before:1,after:1},u),0);
 const after=G.attributesAt(u.baseAttributes,u.potentials,4),before=G.attributesAt(u.baseAttributes,u.potentials,1);
 assert.equal(F.growth({before:1,after:4},u),G.KEYS.reduce((n,k)=>n+after[k]-before[k],0));assert.equal(F.growth({before:1,after:4},{}),0);
});


test('新同伴的并肩提示只播放一次，反复保存和载入不重复庆祝',()=>{
 const {CanvasWorld}=require('../js/canvas-world.js'),w=new World(hero(),{introStep:2});w.chooseWeapon('sword');w.arrive('changshan');
 const v=Object.assign(Object.create(CanvasWorld.prototype),{model:w,knownCompanions:new Set(),invalidate(){}});assert.ok(w.startChangshan());
 try{v.celebrateCompanions();assert.match(v.recruitNotice.names,/赵云/);assert.match(v.recruitNotice.detail,/出战/);assert.deepEqual(v.recruitNotice.perks,['一身是胆','七进七出']);const first=v.recruitNotice;v.celebrateCompanions();assert.equal(v.recruitNotice,first);
  const loaded=new World(w.character,w.snapshot()),other=Object.assign(Object.create(CanvasWorld.prototype),{model:loaded,knownCompanions:new Set(loaded.state.companions.map(u=>u.id)),invalidate(){}});other.celebrateCompanions();assert.equal(other.recruitNotice,undefined);
 }finally{clearTimeout(v.recruitTimer);}
});

test('任务回报预告读取真实钱物与阶段进度，不凭预览发奖、不提前泄露其他英雄任务',()=>{
 const w=new World(hero(),{introStep:2});w.state.quests.side['clear-mountain'].accepted=true;w.state.quests.side['clear-mountain'].wins=2;
 const before=JSON.stringify(w.snapshot()),data=global.NearbyContent.sideQuests.find(q=>q.id==='clear-mountain'),summary=F.questReward(w,{id:data.id});
 assert.ok(summary.includes(data.money+'文'));assert.ok(summary.includes(global.ItemCatalog.templates[data.item].name));assert.match(summary,/2\/5/);assert.equal(JSON.stringify(w.snapshot()),before);
 assert.match(F.questReward(w,{id:'changshan'}),/赵云/);assert.ok(!F.questReward(w,{id:'changshan'}).includes('董卓'));assert.equal(F.questReward(w,{id:'unknown'}),'');
});

test('任务列表只显示标题，详情展示图标奖励；查看奖励不改变进度、钱物',()=>{
 for(const width of [320,375,540]){
  const w=new World(hero(),{introStep:2});w.state.quests.side['clear-mountain'].accepted=true;w.state.quests.side['clear-mountain'].heard=true;w.readQuests();const before=JSON.stringify(w.snapshot());
  const texts=[],icons=[],view={w:width,h:720,hits:[],panel:{type:'tasks',category:'side',scroll:0},model:w,ctx:{measureText:s=>({width:[...String(s)].length*14}),save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},translate(){},scale(){},rotate(){},moveTo(){},lineTo(){},stroke(){},fill(){},closePath(){}},frame(){this.hits=[];return{x:14,y:18,w:width-28,h:684};},box(){},text(text){texts.push(String(text));},button(label,x,y,w,h,action){this.hits.push({label,x,y,w,h,action});},image(){return null;},invalidate(){},wrap(text,x,y,width,{line=24}={}){const rows=global.PengpaiUI.wrapLines(this.ctx,text,width);rows.forEach(t=>texts.push(t));return y+rows.length*line;},openItemDetail(item,options){this.preview={item,options};}};
  const old=global.RpgIcons;global.RpgIcons={draw(c,id){icons.push(id);},resolveItem:item=>item?.id||'empty'};
  try{Panels.draw(view);assert.ok(texts.includes('山道清剿'));assert.ok(!texts.some(t=>t.includes('180')||t.includes('回报')||t.includes('前往中山')));
   const parent=view.panel;view.hits.find(h=>h.label==='山道清剿').action();assert.equal(view.panel.type,'taskDetail');assert.equal(view.panel.previous,parent);texts.length=0;Panels.draw(view);assert.ok(texts.includes('任务奖励'));assert.ok(texts.includes('180 文'));assert.ok(icons.includes('金币'));const item=view.hits.find(h=>h.label==='奖励详情 皮甲');assert.ok(item);item.action();assert.equal(view.preview.options.readonly,true);assert.equal(view.preview.options.previous.type,'taskDetail');assert.equal(JSON.stringify(w.snapshot()),before);
  }finally{global.RpgIcons=old;}
 }
});

test('主菜单保留所有入口，继续旅程读取最新存档，手机按钮不越界、不重叠',()=>{
 const {CanvasMenu}=require('../js/canvas-menu.js'),old=global.MenuScene;global.MenuScene={draw(){}};
 try{for(const width of [320,405,540])for(const saved of [false,true]){
  const loaded=[],slots=saved?[{savedAt:'2026-11-01T00:00:00Z'},{savedAt:'2026-11-09T00:00:00Z'},null]:[null,null,null];
  const v=Object.assign(Object.create(CanvasMenu.prototype),{w:width,h:720,hits:[],ctx:new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),store:{slots:()=>slots},settings:{menuScale:1},options:{onLoad:(s,i)=>loaded.push(i)},text(){},startNew(){},go(){},focus:-1});
  v.drawMain(0);for(const hit of v.hits){assert.ok(hit.x>=0&&hit.x+hit.w<=width);assert.ok(hit.y>=0&&hit.y+hit.h<=720);}for(const label of ['新游戏','载入游戏','战斗模拟','设置','关于'])assert.ok(v.hits.some(h=>h.label===label));
  if(saved){v.hits.find(h=>h.label==='继续旅程').action();assert.deepEqual(loaded,[1]);}
 }}finally{global.MenuScene=old;}
});

test('城内不遮挡人物，窗口切换产生的极小像素比例也能安全绘制背景',()=>{
 const {CanvasWorld}=require('../js/canvas-world.js'),w=new World(hero(),{introStep:2,nodeId:'changshan',inside:true});
 const boxes=[],view=Object.assign(Object.create(CanvasWorld.prototype),{model:w,w:540,h:960,hits:[],partyTop:()=>760,ctx:{measureText:s=>({width:s.length*14})},text(){},box(...r){boxes.push(r);}});view.drawCurrentObjective();assert.equal(boxes[0][1],79);const tracked=view.trackerBounds(),Town=require('../js/town-layout.js');for(const count of [7,15,42]){const grid=Town.plan(540,tracked.y+tracked.h+53,760-61,count);assert.ok(grid.rects.every(r=>r.y>tracked.y+tracked.h&&r.y+r.h<=699));}view.model.state.trackerCollapsed=true;assert.equal(view.trackerBounds().h,36);
 const oldDocument=global.document,oldLoader=global.GameAssetLoader;let rendered=false;
 const ctx={scale(){},fillRect(){}};global.document={createElement(){return {getContext:()=>ctx};}};global.GameAssetLoader={get:()=>null};
 try{Object.assign(view,{w:540,h:960,dpr:.001,ctx:{fillRect(){},drawImage(canvas){assert.ok(canvas.width>=1&&canvas.height>=1);rendered=true;}}});view.drawTownBackdrop();assert.ok(rendered);}
 finally{global.document=oldDocument;global.GameAssetLoader=oldLoader;}
});

test('所有胜利奖励忽略旧存档剧情字段，窄屏继续按钮与奖励区域可用',()=>{
 for(const [w,h]of [[320,568],[375,667],[540,960]]){
  const texts=[],rects=[],v={w,h,hits:[],panel:{type:'reward',reward:{story:{title:'祠堂的门打开了',text:'伤者登上了车。甄姬带着金针加入队伍，往后有人替你照看伤势。',next:'返回中山，夺回前后两院的粮车。'},gains:[],money:20},started:performance.now(),scroll:0},model:{members:()=>[],state:{}},ctx:{measureText:s=>({width:[...String(s)].length*14}),save(){},restore(){},beginPath(){},rect(...r){rects.push(r);},clip(){}},frame(title,height){texts.push(title);return{x:14,y:18,w:w-28,h:Math.min(height,h-36)};},box(){},text(s){texts.push(s);},button(label,x,y,bw,bh){this.hits.push({label,x,y,w:bw,h:bh});},image(){return null;}};
  const old=global.RpgIcons;global.RpgIcons={draw(){}};try{Panels.draw(v);}finally{global.RpgIcons=old;}
  assert.ok(!texts.includes('祠堂的门打开了'));assert.ok(!texts.some(t=>String(t).includes('伤者登上了车')));assert.ok(!texts.some(t=>t.includes('接下来')||t.includes('返回中山')));const next=v.hits.find(h=>h.label==='继续');assert.ok(next&&next.y+next.h<=h);assert.ok(rects.at(-1)[3]>=44,'money reward remains visible');
 }
});
