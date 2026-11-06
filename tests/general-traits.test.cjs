const test=require('node:test'),assert=require('node:assert/strict'),E=require('../js/engine.js'),P=require('../js/passives.js'),Prologue=require('../js/prologue.js'),R=require('../js/game-rules.js'),W=require('../js/weapon-skills.js'),{World}=require('../js/world.js');
test('赵云两红两金、张梁一绿一白，旧存档迁移保留其他被动且不重复添加',()=>{
 const hero={name:'行客',...R.rollHero('normal',()=>.4)},w=new World(hero,{nodeId:'changshan'});w.startChangshan();const z=w.members().find(u=>u.id==='zhaoyun');assert.deepEqual(R.sortPassives(z.passives,P.definitions).map(id=>P.definitions[id].quality),['red','red','gold','gold']);
 const liang=Prologue.general('zhangliang',15);assert.deepEqual(liang.passives.map(id=>P.definitions[id].quality),['green','white']);
 const old={...z,passives:['thunder-lord']},once=W.migrateWeaponPlan(old),twice=W.migrateWeaponPlan(once);assert.deepEqual(once.passives,twice.passives);assert.ok(once.passives.includes('thunder-lord'));assert.equal(once.passives.length,5);
 assert.deepEqual(W.migrateWeaponPlan({...liang,passives:[]}).passives,liang.passives);
});
test('金绿白被动参与通用物理增伤、减伤，计策与反击真实伤害不受物理减伤影响',()=>{
 const unit=(id,passives)=>({id,war:10,intelligence:10,constitution:10,speed:10,technique:10,maxSoldiers:100,skills:[],passives}),b=new E.Battle({allies:[unit('zhao',['zhaoyun-ever-victorious','zhaoyun-loyal-guard']),unit('liang',['zhangliang-might','zhangliang-hardy'])],enemies:[unit('enemy',[])]}),flat={kind:'physical',flat:100,scaling:{},weaponCoefficient:0},enemy=b.effective(b.unit('enemy'));
 assert.equal(E.calculate({attacker:b.effective(b.unit('zhao')),target:enemy,skill:flat}).amount,110);assert.equal(E.calculate({attacker:b.effective(b.unit('liang')),target:enemy,skill:flat}).amount,105);
 for(const [id,expected]of [['zhao',92],['liang',98]]){const target=b.effective(b.unit(id));assert.equal(E.calculate({attacker:enemy,target,skill:flat}).amount,expected);assert.equal(E.calculate({attacker:enemy,target,skill:{...flat,kind:'tactic'}}).amount,100);assert.equal(E.calculate({attacker:enemy,target,skill:flat,damageType:'true'}).amount,100);}
});
