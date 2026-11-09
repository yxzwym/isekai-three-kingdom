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

test('任务目标与回报根据窄屏行数排版，前往按钮不压住长目标文字',()=>{
 for(const width of [320,375,540]){
  const w=new World(hero(),{introStep:2});w.state.quests.side['clear-mountain'].accepted=true;w.state.quests.side['clear-mountain'].heard=true;
  const texts=[],buttons=[],cards=[],view={w:width,h:720,hits:[],panel:{type:'tasks',category:'side',scroll:0},model:w,ctx:{measureText:s=>({width:[...String(s)].length*14}),save(){},restore(){},beginPath(){},rect(){},clip(){}},frame(){return{x:14,y:18,w:width-28,h:684};},box(x,y,w,h){if(h>80)cards.push({x,y,w,h});},text(text,x,y){texts.push({text,x,y});},button(label,x,y,w,h){const b={label,x,y,w,h};this.hits.push(b);buttons.push(b);},image(){return null;}};
  const old=global.RpgIcons;global.RpgIcons={draw(){}};try{Panels.draw(view);}finally{global.RpgIcons=old;}
  const first=cards[0],button=buttons.find(b=>b.label.startsWith('前往 '));assert.ok(first&&button);const rewards=texts.filter(t=>t.y>first.y&&t.y<button.y&&t.text.includes('文'));assert.ok(rewards.length);assert.ok(button.y>=rewards[0].y+16);assert.ok(button.y+button.h<=first.y+first.h);
 }
});

test('城内不遮挡人物，窗口切换产生的极小像素比例也能安全绘制背景',()=>{
 const {CanvasWorld}=require('../js/canvas-world.js'),w=new World(hero(),{introStep:2,nodeId:'changshan',inside:true});
 const view=Object.assign(Object.create(CanvasWorld.prototype),{model:w,box(){throw Error('objective must not cover town NPCs');}});view.drawCurrentObjective();
 const oldDocument=global.document,oldLoader=global.GameAssetLoader;let rendered=false;
 const ctx={scale(){},fillRect(){}};global.document={createElement(){return {getContext:()=>ctx};}};global.GameAssetLoader={get:()=>null};
 try{Object.assign(view,{w:540,h:960,dpr:.001,ctx:{fillRect(){},drawImage(canvas){assert.ok(canvas.width>=1&&canvas.height>=1);rendered=true;}}});view.drawTownBackdrop();assert.ok(rendered);}
 finally{global.document=oldDocument;global.GameAssetLoader=oldLoader;}
});

test('阶段回报在320和375窄屏正常换行，继续按钮与奖励内容区域保持可用',()=>{
 for(const [w,h]of [[320,568],[375,667],[540,960]]){
  const texts=[],rects=[],v={w,h,hits:[],panel:{type:'reward',reward:{story:{title:'祠堂的门打开了',text:'伤者登上了车。甄姬带着金针加入队伍，往后有人替你照看伤势。',next:'返回中山，夺回前后两院的粮车。'},gains:[],money:20},started:performance.now(),scroll:0},model:{members:()=>[],state:{}},ctx:{measureText:s=>({width:[...String(s)].length*14}),save(){},restore(){},beginPath(){},rect(...r){rects.push(r);},clip(){}},frame(title,height){texts.push(title);return{x:14,y:18,w:w-28,h:Math.min(height,h-36)};},box(){},text(s){texts.push(s);},button(label,x,y,bw,bh){this.hits.push({label,x,y,w:bw,h:bh});},image(){return null;}};
  const old=global.RpgIcons;global.RpgIcons={draw(){}};try{Panels.draw(v);}finally{global.RpgIcons=old;}
  assert.ok(texts.includes('祠堂的门打开了'));assert.ok(texts.some(t=>t.includes('接下来')));const next=v.hits.find(h=>h.label==='继续');assert.ok(next&&next.y+next.h<=h);assert.ok(rects.at(-1)[3]>=44,'money reward remains visible');
 }
});
