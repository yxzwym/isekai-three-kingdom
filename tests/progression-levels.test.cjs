const test=require('node:test'),assert=require('node:assert/strict'),{World}=require('../js/world.js'),G=require('../js/character-growth.js'),R=require('../js/game-rules.js'),E=require('../js/engine.js'),N=require('../js/nearby-content.js'),I=require('../js/items.js'),X=require('../js/experience.js');
const hero=level=>G.characterAt({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},level);
test('剧情和委托固定关卡等级，只有路遇敌人随玩家成长并封顶20',()=>{
 for(const level of [1,3,9,10,19,20,21,30]){
  for(const [phase,data]of Object.entries(N.storyBattles)){
   const w=new World(hero(level),{nodeId:data.place,weaponType:'sword',quests:{changshan:{stage:phase==='entry'?'available':phase==='rescue'?'rescue':phase==='escort'?'escort':'supplies',healerJoined:phase==='grain',grainWins:0}}});assert.ok(w.beginStoryBattle(phase));const b=new E.Battle(w.battleScenario());for(const u of b.living('enemy')){assert.equal(u.level,data.fixedCombatLevel);assert.equal(u.potentials,undefined);assert.equal(u.maxSoldiers,u.constitution*10);}assert.equal(w.character.level,level);
  }
  const w=new World(hero(level),{nodeId:'changshan',weaponType:'sword'});w.acceptSide('clear-mountain');w.arrive('zhongshan');w.beginSideBattle('clear-mountain');assert.ok(w.battleScenario().enemies.every(u=>u.level===N.sideQuests.find(t=>t.id==='clear-mountain').fixedCombatLevel));
  const road=new World(hero(level),{weaponType:'sword'});road.move('julu',{eventRoll:0});assert.ok(road.battleScenario().enemies.every(u=>u.level===Math.min(level,20)));
 }
});
test('旧档直接开放路遇20级上限，重载后不恢复旧10级限制',()=>{const w=new World(hero(30),{enemyLevelCap:10});assert.equal(w.enemyLevel(),20);assert.equal(new World(w.character,w.snapshot()).enemyLevel(),20);assert.equal(w.unlockEnemyLevelCap(25),false);});
test('旧十场剿匪进度按比例迁移，五场完成且不会漏发或重复发奖',()=>{
 const w=new World(hero(1),{nodeId:'changshan',weaponType:'sword',quests:{side:{'clear-mountain':{accepted:true,wins:8,paid:false}}}});assert.equal(w.state.quests.side['clear-mountain'].wins,4);assert.equal(new World(w.character,w.snapshot()).state.quests.side['clear-mountain'].wins,4);w.arrive('zhongshan');assert.ok(w.beginSideBattle('clear-mountain'));w.resolveBattle({result:'victory'});assert.equal(w.lastReward.progress.value,1);assert.equal(w.state.quests.side['clear-mountain'].paid,false);w.arrive('changshan');assert.ok(w.turnInSide('clear-mountain'));assert.equal(w.turnInSide('clear-mountain'),false);assert.equal(w.character.level,1);assert.equal(w.beginSideBattle('clear-mountain'),false);
});
test('白蜡枪旧档及旧背包补齐10点威力，卸下、换人装备和战斗数值保持一致',()=>{
 const w=new World(hero(1),{nodeId:'changshan',inventory:[{uid:'old-spear',name:'白蜡枪',type:'spear',slot:'weapon'}]});assert.equal(w.state.inventory[0].power,10);w.changeEquipment('hero','weapon','old-spear');assert.equal(new E.Battle({allies:w.members(),enemies:[]}).unit('hero').attack,10);w.changeEquipment('hero','weapon',null);assert.equal(w.state.inventory[0].power,10);assert.equal(I.apply({weapon:{name:'专武',type:'sword',attack:18},war:1,intelligence:1,constitution:1,speed:1,technique:1}).attack,18);
});
test('十名同级敌人升一级，低级敌人的经验会衰减；五轮剿匪不会直升10级',()=>{
 let c={...hero(1),experienceVersion:2,experience:0};for(let i=0;i<9;i++)c=X.grant(c,X.rewardForEnemy({level:1},c)).record;assert.equal(c.level,1);assert.equal(c.experience,18);c=X.grant(c,2).record;assert.equal(c.level,2);assert.equal(c.experience,0);assert.equal(X.rewardForEnemy({level:1},c),2.8);assert.equal(X.required(2),40);const w=new World(hero(1),{nodeId:'changshan',weaponType:'sword'});w.acceptSide('clear-mountain');w.arrive('zhongshan');for(let i=0;i<5;i++){w.beginSideBattle('clear-mountain');w.resolveBattle({result:'victory'});}assert.ok(w.character.level>=2&&w.character.level<=3);const loaded=new World(w.character,w.snapshot());assert.equal(loaded.character.experience,w.character.experience);assert.equal(loaded.character.level,w.character.level);
});
