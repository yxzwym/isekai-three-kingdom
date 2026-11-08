const test=require('node:test'),assert=require('node:assert/strict');
const X=require('../js/experience.js'),G=require('../js/character-growth.js'),R=require('../js/game-rules.js'),{World}=require('../js/world.js');
const hero=level=>G.characterAt({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},level);
test('前期升级需求线性递增，后期保留较高阶曲线，边界单调且连续等级不重置',()=>{
 assert.deepEqual(X.stages.map(s=>s.total),[900,13920,45240,99960,184080,1020000,10987500]);assert.deepEqual(X.stages.map(s=>s.startLevel),[1,10,39,78,127,186,285]);assert.equal(X.cumulative.at(-1),12351600);assert.equal(X.maxLevel,434);for(const s of X.stages){assert.ok(s.costs.every(Number.isSafeInteger));assert.ok(s.costs.every((n,i,a)=>n>0&&(!i||n>=a[i-1])));}
 assert.equal(X.required(1),20);assert.equal(X.required(9),180);assert.equal(X.required(78),1560);assert.equal(X.required(126),2520);assert.equal(X.required(186),5000);assert.equal(X.required(210),9800);assert.equal(X.required(211),10000);assert.equal(X.required(275),15000);assert.equal(X.required(284),24000);assert.equal(X.required(285),25000);assert.equal(X.required(433),110500);assert.equal(X.required(434),Infinity);
});
test('同级每名敌人约十分之一级，1级黄巾军为2经验；逐敌经验严格累加',()=>{
 for(const level of [1,5,10,15,38,39,77,78,126,127,185,186,284,285,432]){const member=hero(level),enemy={level},amount=X.rewardForEnemy(enemy,member),kills=Math.ceil(X.required(level)/amount);assert.ok(kills===10,[level,amount,kills]);assert.equal(X.reward(Array(5).fill(enemy),member),Number((amount*5).toFixed(2)));assert.equal(X.grant(member,amount*(kills-1)).record.level,level);assert.ok(X.grant(member,amount*kills).record.level>level);}
});
test('按每个收经验者的等级计算；低五级零经验，高五级封顶，混合敌人分别计价',()=>{
 const member={level:30},same=X.rewardForEnemy({level:30},member);assert.equal(X.rewardForEnemy({level:25},member),0);assert.equal(X.rewardForEnemy({level:1},member),0);assert.ok(X.rewardForEnemy({level:26},member)<same);assert.equal(X.rewardForEnemy({level:35},member),same*1.2);assert.equal(X.rewardForEnemy({level:35},member),X.rewardForEnemy({level:5000},member));assert.equal(X.reward([{level:25},{level:30},{level:35}],member),Number((same+X.rewardForEnemy({level:35},member)).toFixed(2)));
});
test('候补与倒下成员按自身等级正常领取，不按人数分摊；离队人物不领取',()=>{
 const w=new World(hero(10),{nodeId:'camp',inside:true,introStep:2,weaponType:'sword'});for(const [id,l]of [['low',1],['same',10],['high',15],['bench',2]])w.recordRecruit(id,'wei',{...G.create('zhangliang',l),id,name:id,homeNode:'camp',experienceVersion:2,experience:0});for(const [id,level]of [['low',1],['same',10],['high',15],['bench',2]]){const u=w.state.companions.find(u=>u.id===id),attributes=G.attributesAt(u.baseAttributes,u.potentials,level);Object.assign(u,{level,attributes},attributes);}w.state.troops.bench=0;w.dismiss('low');w.beginTraining('militia-one');w.resolveBattle({result:'victory',units:[]});const gains=Object.fromEntries(w.lastReward.gains.map(g=>[g.id,g]));assert.equal(gains.hero.amount,0);assert.equal(gains.same.amount,0);assert.equal(gains.high.amount,0);assert.equal(gains.bench.amount,2.8);assert.ok(!gains.low);assert.equal(w.state.residents.low.experience,0);assert.equal(w.state.companions.find(u=>u.id==='bench').experience,2.8);
});
test('训练小兵分1、3、5级，三兄弟固定10级；我方队友和序章等级不随之改写',()=>{
 for(const level of [1,3,7,10,11,50]){const w=new World(hero(level),{nodeId:'camp',inside:true,weaponType:'sword'});for(const training of require('../js/world-data.js').trainingOptions){const enemies=w.trainingRoster(training);assert.ok(enemies.every(u=>u.level===(training.rivals?10:({'militia-one':1,'militia-two':3,'militia-five':5})[training.id])));assert.ok(enemies.every(u=>u.constitution*10>0));}assert.equal(w.character.level,level);}assert.equal(require('../js/prologue.js').general('zhangjiao').level,10);
});
test('旧经验余额按原升级进度迁移一次，保留人物等级与潜力；大额奖励不会死循环',()=>{
 const before={...hero(20),experience:500},migrated=X.normalizeRecord(before);assert.equal(migrated.level,20);assert.equal(migrated.experience,Math.floor(X.required(20)*.5));assert.deepEqual(X.normalizeRecord(migrated),migrated);const full=X.grant(hero(1),12351600).record;assert.equal(full.level,434);assert.equal(full.experience,0);assert.deepEqual(full.potentials,hero(1).potentials);assert.equal(X.grant(full,1000).record.level,434);assert.equal(X.grant({...hero(1),experience:Infinity},Infinity).record.level,1);
});
