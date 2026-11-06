const test=require('node:test'),assert=require('node:assert/strict'),D=require('../js/world-data.js'),{World}=require('../js/world.js'),R=require('../js/game-rules.js');require('../js/ui-theme.js');const {CanvasWorld}=require('../js/canvas-world.js');
const hero=()=>({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)});
const view=model=>Object.assign(Object.create(CanvasWorld.prototype),{model,character:model.character,disposed:false,battle:null,journey:null,panel:null,dialogue:null,save(){},invalidate(){},animate(){},boundCamera(){}});
test('可离开的对话共用离开动作，强制剧情与必须作出的选择不可关闭',()=>{
 const w=new World(hero(),{nodeId:'camp',inside:true}),v=view(w),npc={id:'guest',name:'过路人',art:'villager'};let left=0;
 v.speak(npc,{lines:['路上小心。'],choices:[{label:'对话',action(){}},{label:'离开',action(){left++;v.closeDialogue();}}]});assert.equal(typeof v.dialogueExit(),'function');v.dialogueExit()();assert.equal(left,1);assert.equal(v.dialogue,null);
 v.speak(npc,{lines:['先听我说完。'],forced:true});assert.equal(v.dialogueExit(),null);v.speak(npc,{lines:['选一把兵器吧。'],choices:[{label:'剑',action(){}},{label:'枪',action(){}}]});assert.equal(v.dialogueExit(),null);
});
test('广宗运粮在目标地点生成盗匪入口，战胜两轮后必须返回巨鹿交付',()=>{
 const w=new World(hero(),{nodeId:'julu',inside:true}),v=view(w);w.acceptSide('grain-escort');assert.equal(w.beginSideBattle('grain-escort'),false);w.arrive('julu-county');const npc=w.sceneNpcs().find(n=>n.questId==='grain-escort');assert.ok(npc);v.speak(npc);assert.ok(v.dialogue.choices.some(c=>c.label==='剿匪'));
 for(let i=0;i<2;i++){assert.ok(w.beginSideBattle('grain-escort'));w.resolveBattle({result:'victory'});w.state.pendingReward=null;w.state.afterBattle=null;}assert.equal(w.state.quests.side['grain-escort'].paid,false);assert.equal(w.sceneNpcs().some(n=>n.questId==='grain-escort'),false);assert.equal(w.turnInSide('grain-escort'),false);w.arrive('julu');assert.ok(w.turnInSide('grain-escort'));assert.equal(w.turnInSide('grain-escort'),false);
});
test('甄姬离队后在毋极的对话仍能重新邀请，不被普通疗伤对话截走',()=>{
 const w=new World(hero(),{nodeId:'zhongshan-county',quests:{changshan:{stage:'complete'}}});w.recruitZhenJi();w.state.troops.zhenji=11;assert.ok(w.dismiss('zhenji'));const npc=w.sceneNpcs().find(n=>n.id==='zhenji'),v=view(w);assert.equal(npc.role,'companion');v.speak(npc);const invite=v.dialogue.choices.find(c=>c.label==='请你同行');assert.ok(invite);invite.action();assert.equal(v.dialogue,null);assert.equal(w.members().find(u=>u.id==='zhenji').startSoldiers,11);assert.equal(w.counts().wei,1);
});
test('在路遇战奖励界面读档，确认后继续剩余路程，不停在半路也不重复加钱',()=>{
 const w=new World(hero(),{introStep:2,weaponType:'sword'});w.beginTravel('changshan',{eventRoll:0});w.travelEvent();w.resolveBattle({result:'victory'});const loaded=new World(w.character,w.snapshot()),v=view(loaded),money=loaded.state.money;assert.ok(loaded.journey);v.panel={type:'reward',reward:loaded.state.pendingReward};v.finishReward();assert.equal(loaded.state.pendingReward,null);assert.ok(v.journey);assert.equal(v.journey.progress,.5);assert.equal(loaded.state.money,money);assert.equal(loaded.journey.checkpoint.pendingReward,null);
});
test('新的救人阶段存档保留粮仓0%，旧救人存档按已筹粮迁移，完成阶段不回退',()=>{
 const w=new World(hero(),{nodeId:'zhongshan-county',quests:{changshan:{stage:'rescue',grainWins:0}}});assert.equal(new World(w.character,w.snapshot()).state.quests.changshan.grainWins,0);assert.equal(new World(hero(),{quests:{changshan:{stage:'rescue'}}}).state.quests.changshan.grainWins,2);assert.equal(new World(hero(),{quests:{changshan:{stage:'complete'}}}).state.quests.changshan.stage,'complete');
});
test('没有观察项的村民直接对话，仍可反复交谈；附近任务和商店在同一入口',()=>{
 const w=new World(hero(),{nodeId:'changshan',quests:{changshan:{stage:'complete'}}}),v=view(w),npc=w.sceneNpcs().find(n=>n.id==='changshan-maiden');v.interact(npc);assert.ok(v.dialogue);assert.equal(v.panel,null);const first=v.dialogue.lines[0];v.closeDialogue();v.interact(npc);assert.notEqual(v.dialogue.lines[0],first);w.arrive('zhongshan');v.closeDialogue();v.interact(w.sceneNpcs().find(n=>n.id==='road-merchant'));assert.ok(v.dialogue.choices.some(c=>c.label==='购买'));assert.ok(v.dialogue.choices.some(c=>c.label==='出售'));assert.ok(v.dialogue.choices.some(c=>c.label.includes('商路肃清')));
});
