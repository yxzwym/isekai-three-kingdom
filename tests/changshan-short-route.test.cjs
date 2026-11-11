const test=require('node:test'),assert=require('node:assert/strict'),{World}=require('../js/world.js'),E=require('../js/engine.js'),R=require('../js/game-rules.js');
test('新常山全程只走常山中山，先夺两仓再救人，两场夺粮即救人，读档后确认同行',()=>{
 {
  let w=new World({name:'行舟',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.5)},{introStep:2,nodeId:'changshan',weaponType:'sword',roadSeed:'short-route'});
  for(const [place,phase]of [['changshan','entry'],['zhongshan','grain'],['zhongshan','grain'],['changshan','escort']]){
   w.arrive(place);assert.ok(w.beginStoryBattle(phase),phase);const b=new E.Battle(w.battleScenario());b.start();b.advance(180);assert.equal(b.status,'victory',phase);w.resolveBattle(b.export());w.state.pendingReward=null;w.state.afterBattle=null;
   if(phase==='entry'){assert.ok(w.startChangshan());w.rest();}
   if(phase==='grain'&&w.state.quests.changshan.grainWins===1){assert.equal(w.state.quests.changshan.healerRescued,false);w.rest();}
   if(phase==='grain'&&w.state.quests.changshan.grainWins===2){assert.ok(w.state.quests.changshan.healerDecision);assert.ok(!w.members().some(u=>u.id==='zhenji'));assert.ok(w.finishZhenStay(true));w.rest();assert.ok(w.members().some(u=>u.id==='zhenji'));}
   w=new World(w.character,w.snapshot());
  }
  assert.ok(w.advanceChangshan());assert.ok(w.finishChangshan(true));assert.equal(w.state.quests.changshan.stage,'complete');
 }
});

test('常山返回战头目保持三级完整体质与五百生命，不因赵云甄姬同行而削弱',()=>{
 const w=new World({name:'行舟',...R.rollHero('normal',()=>.5)},{introStep:2,nodeId:'changshan',weaponType:'sword',quests:{changshan:{stage:'escort',grainWins:2,healerRescued:true,healerStayDecided:true}}});
 w.recordRecruit('zhaoyun','shu',{...w.zhaoYunUnit(),guest:false});w.recordRecruit('zhenji','wei',{...w.zhenJiUnit(),guest:false});assert.ok(w.beginStoryBattle('escort'));const b=new E.Battle(w.battleScenario()),leader=b.units.find(u=>u.side==='enemy');assert.equal(leader.level,3);assert.equal(leader.constitution,50);assert.equal(leader.maxSoldiers,500);assert.equal(b.living('ally').length,3);
});
