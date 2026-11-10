const test=require('node:test'),assert=require('node:assert/strict');
require('../js/ui-theme.js');require('../js/presentation.js');require('../js/character-assets.js');require('../js/hero-quests.js');require('../js/trophy-panels.js');
const R=require('../js/game-rules.js'),C=require('../js/courts.js'),T=require('../js/trophies.js'),Panels=require('../js/world-panels.js'),{World}=require('../js/world.js'),{CanvasWorld}=require('../js/canvas-world.js');
const hero=()=>({name:'行舟',appearance:'armored',difficulty:'normal',...R.rollHero('normal',()=>.5)});
const make=s=>new World(hero(),{introStep:2,weaponType:'sword',...s});
function view(model){const texts=[],v=Object.assign(Object.create(CanvasWorld.prototype),{model,character:model.character,w:540,h:960,hits:[],ctx:new Proxy({measureText:t=>({width:Array.from(String(t)).length*14})},{get:(o,k)=>o[k]||(()=>{})}),text(t){texts.push(String(t));},box(){},frame(title,height){this.hits=[];texts.push(title);return{x:40,y:40,w:460,h:Math.min(800,height)};},button(label,x,y,w,h,action,options={}){if(!options.disabled)this.hits.push({label,x,y,w,h,action});},image(){return null;},portrait(){},save(){},notify(){},invalidate(){}});return{v,texts};}

test('复命委托须当面拜访各国宰相才开放，招募和到达城门不算接受',()=>{
 const w=make({nodeId:'xuchang',recruits:{wei:['zhenji']}});
 assert.deepEqual(w.state.recruitAssignments,{wei:false,shu:false,wu:false});
 assert.ok(!w.quests().some(q=>q.id.startsWith('report-')));assert.ok(!w.questMarkers().some(q=>q.questId.startsWith('report-')));assert.equal(w.npcQuestStatus(C.npc('wei')),null);
 assert.equal(w.acceptRecruitAssignment('wei'),false);assert.ok(w.enter());assert.equal(w.claimRecruitReward('wei'),null);
 assert.ok(w.acceptRecruitAssignment('wei'));assert.equal(w.quests().find(q=>q.id==='report-wei').taskStatus,'ready');assert.equal(w.acceptRecruitAssignment('shu'),false);
 const loaded=new World(w.character,w.snapshot());assert.deepEqual(loaded.state.recruitAssignments,{wei:true,shu:false,wu:false});assert.equal(loaded.claimRecruitReward('wei').money,500);
 loaded.state.pendingReward=null;assert.equal(loaded.claimRecruitReward('wei'),null);assert.equal(loaded.quests().find(q=>q.id==='report-wei').taskStatus,'active');
});

test('常山结束提示北海太史慈，自动加入人物任务并迁移已有旧档',()=>{
 const w=make({nodeId:'changshan',inside:true,quests:{changshan:{stage:'decision'}}});w.state.companions.push(w.zhaoYunUnit());const {v}=view(w);v.speak=(npc,data)=>{v.dialogue={npc,...data};};v.finishZhaoQuest(true);
 assert.ok(v.dialogue.lines.some(t=>t.includes('北海')&&t.includes('太史慈')));assert.equal(w.state.heroQuests.taishici.accepted,true);assert.equal(w.questDestination(),'beihai');assert.ok(w.quests().some(q=>q.id==='taishici'&&q.accepted&&q.target==='beihai'));
 const old=w.snapshot();old.heroQuests.taishici.accepted=false;const loaded=new World(w.character,old);assert.equal(loaded.state.heroQuests.taishici.accepted,true);assert.equal(loaded.state.heroQuests.taishici.stage,w.state.heroQuests.taishici.stage);
});

test('拜访三府逐项计数，第三次拜访授予满级命中8%遗物且重载不重复',()=>{
 const w=make({quests:{changshan:{stage:'complete'}},trophyClaims:{changshan:true}}),quest=()=>w.quests().find(q=>q.id==='visit-courts'),money=w.state.money;
 assert.equal(quest().category,'main');assert.equal(quest().objective.split('\n').length,3);assert.equal((quest().objective.match(/0\/1/g)||[]).length,3);
 for(const [i,country]of ['wu','wei','shu'].entries()){w.arrive(C.definitions[country].place);w.enter();assert.ok(w.acceptRecruitAssignment(country));assert.equal((quest().objective.match(/1\/1/g)||[]).length,i+1);assert.equal(quest().complete,i===2);if(i<2)assert.equal(w.state.trophies.length,0);}
 assert.equal(w.state.money,money);assert.equal(w.state.trophies.length,1);const item=w.state.trophies[0];assert.equal(item.templateId,'three-courts-seal');assert.equal(item.level,8);assert.deepEqual(T.totals([item]),{hitBonus:8});assert.ok(w.state.pendingReward.items.some(t=>t.uid===item.uid));assert.ok(w.state.questCompletions['visit-courts']);assert.ok(!w.questMarkers().some(m=>m.questId==='visit-courts'));
 assert.ok(w.equipTrophy('hero',0,item.uid));assert.equal(w.members()[0].hitBonus,.08);
 const loaded=new World(w.character,w.snapshot());assert.deepEqual(loaded.state.trophies,[item]);assert.equal(loaded.state.pendingReward.items.filter(t=>t.uid===item.uid).length,1);loaded.state.pendingReward=null;loaded.acceptRecruitAssignment('shu');assert.equal(loaded.state.pendingReward,null);assert.equal(loaded.state.trophies.length,1);
});

test('旧档已拜访三府也补发一次奖励，未完成常山不提前完成',()=>{
 const assignments={wei:true,shu:true,wu:true},w=make({recruitAssignments:assignments,trophyClaims:{changshan:true}});assert.ok(!w.quests().some(q=>q.id==='visit-courts'));assert.ok(!w.state.trophies.some(t=>t.templateId==='three-courts-seal'));
 const loaded=new World(w.character,{...w.snapshot(),quests:{changshan:{stage:'complete'}}});assert.equal(loaded.state.trophies.filter(t=>t.templateId==='three-courts-seal').length,1);assert.ok(loaded.quests().find(q=>q.id==='visit-courts').complete);
});

test('第三府谢礼可从宰相对话领取，关闭对话同样展示，领完再复命不丢赏钱',()=>{
 const w=make({nodeId:'jianye',inside:true,quests:{changshan:{stage:'complete'}},trophyClaims:{changshan:true},equipmentRewards:{'story:escort':true},recruitAssignments:{wei:true,shu:true,wu:false}}),{v}=view(w);w.state.recruits.wu.push('taishici');v.speak=(npc,data)=>{v.dialogue={npc,...data};};v.rememberDialogue=()=>{};v.showReward=reward=>{v.panel={type:'reward',reward};};v.afterBattle=()=>{};
 v.courtDialogue(C.npc('wu'));assert.ok(v.dialogue.choices.some(c=>c.label==='查看拜访谢礼'));assert.ok(!v.dialogue.choices.some(c=>c.label.startsWith('领取赏钱')));v.dialogue.choices.find(c=>c.label==='告辞').action();assert.equal(v.dialogue,null);assert.ok(v.panel.reward.items.some(t=>t.templateId==='three-courts-seal'));
 v.finishReward();v.courtDialogue(C.npc('wu'));v.dialogue.choices.find(c=>c.label.startsWith('领取赏钱')).action();assert.equal(v.panel.reward.money,500);assert.equal(w.state.trophies.filter(t=>t.templateId==='three-courts-seal').length,1);
});

test('任务详情分别展示三条拜访进度与满级奖励，结算物品只能查看，背包仍可装备',()=>{
 const w=make({quests:{changshan:{stage:'complete'}},trophyClaims:{changshan:true}}),{v,texts}=view(w),old=global.RpgIcons;global.RpgIcons={draw(){},resolveItem(){return 'sword';}};
 try{
  v.panel={type:'taskDetail',questId:'visit-courts'};Panels.draw(v);for(const name of ['司马懿','诸葛亮','周瑜'])assert.ok(texts.some(t=>t.includes(name)&&t.includes('0/1')));
  v.hits.find(h=>h.label==='奖励详情 三府信符').action();assert.equal(v.panel.item.level,8);assert.equal(v.panel.readonly,true);assert.deepEqual(T.totals([v.panel.item]),{hitBonus:8});Panels.draw(v);assert.ok(!v.hits.some(h=>/装备给|升级至/.test(h.label)));
  const armor=w.addItem('iron-armor','green'),trophy=w.addTrophy('fang'),parent={type:'reward',reward:{items:[armor,trophy],gains:[],money:0},started:0,scroll:0};
  for(const item of [armor,trophy]){v.panel=parent;Panels.draw(v);v.hits.find(h=>h.label.endsWith(' '+item.name)).action();assert.equal(v.panel.readonly,true);Panels.draw(v);assert.ok(!v.hits.some(h=>/^(装备|更换|升级)/.test(h.label)));assert.equal(v.panel.previous,parent);v.closeWorldPanel();assert.equal(v.panel,parent);}
  v.openItemDetail(armor,{previous:{type:'inventory'}});Panels.draw(v);assert.ok(v.hits.some(h=>h.label==='装备'));
 }finally{global.RpgIcons=old;}
});
