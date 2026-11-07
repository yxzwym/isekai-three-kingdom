const test=require('node:test'),assert=require('node:assert/strict');
const {World}=require('../js/world.js'),G=require('../js/character-growth.js'),R=require('../js/game-rules.js'),P=require('../js/prologue.js');
const create=()=>new World({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},{nodeId:'camp',inside:true,weaponType:'sword',trainingWins:{'three-brothers':1}});
test('武将可观察真实等级、属性、潜力、装备和武器技能，通用村民没有观察数据',()=>{
 const w=create();for(const id of ['zhangjiao','zhangbao','zhangliang','zhaoyun']){const u=w.npcUnit(id);assert.ok(G.isGeneral(u));assert.equal(u.level,id==='zhaoyun'?3:10);assert.deepEqual(u.attributes,G.attributesAt(u.baseAttributes,u.potentials,u.level));assert.ok(u.weapon);assert.ok(u.skills.length);assert.ok(u.potentials);assert.ok(!u.passives?.includes('thunder-lord-tutorial'));}for(const id of ['grain-maiden','refugee-laborer','village-elder'])assert.equal(w.npcUnit(id),null);
});
test('同样有成长档案的杂兵不作为武将显示潜力，主角与命名武将可显示',()=>{
 assert.ok(G.isGeneral({id:'hero'}));assert.ok(G.isGeneral(P.general('zhangliang')));assert.ok(G.isGeneral({id:'training-zhangjiao',characterId:'zhangjiao'}));for(const id of ['thief','imperial-soldier','imperial-captain','yellow-militia','river-bandit','mountain-bandit','brigand'])assert.equal(G.isGeneral({id,characterId:id,...G.create('imperialSoldier',3)}),false);
});
test('观察已入队及离队武将保持实际成长与生命，读取不会修改原角色',()=>{
 const w=create();w.recruitZhangLiang();w.awardExperience(200);w.state.troops.zhangliang=25;const before=w.snapshot(),u=w.npcUnit('zhangliang');assert.equal(u.startSoldiers,25);assert.equal(u.level,w.state.companions[0].level);u.level=500;u.weapon.name='变更';assert.deepEqual(w.snapshot(),before);w.dismiss('zhangliang');assert.equal(w.npcUnit('zhangliang').level,before.companions[0].level);assert.equal(w.npcUnit('zhangliang').startSoldiers,25);
});
