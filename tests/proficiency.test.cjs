const test=require('node:test'),assert=require('node:assert/strict'),F=require('../js/proficiency.js'),E=require('../js/engine.js'),G=require('../js/character-growth.js'),R=require('../js/game-rules.js'),{World}=require('../js/world.js');
const hero=()=>({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)});
test('武器熟练经验逐级线性增加，超过100仍能继续成长并保留余数',()=>{
 let record={weaponProficiencies:{sword:0,blade:7}};for(let i=0;i<4;i++)record=F.grant(record,'sword',1).record;assert.equal(record.weaponProficiencies.sword,1);assert.equal(record.weaponExperience.sword,0);assert.equal(F.required(1),5);
 const gain=F.grant(record,'sword',F.total(103)-F.total(1)+2.5);assert.equal(gain.after,103);assert.equal(gain.experienceAfter,2.5);assert.equal(gain.record.weaponProficiencies.blade,7);assert.equal(F.required(103),107);assert.equal(record.weaponProficiencies.sword,1);
});
test('熟练收益按敌我等级差：低5级不增长、高等级最多按高5级计算',()=>{
 assert.equal(F.multiplier(5,10),0);assert.equal(F.multiplier(6,10),.1);assert.equal(F.multiplier(10,10),1);assert.equal(F.multiplier(15,10),2);assert.equal(F.multiplier(100,10),2);
});
test('群体技能算一次练习，未命中、反击和持续伤害不刷熟练，治疗必须实际回复',()=>{
 const units=[{id:'a',side:'ally',level:5,weapon:{type:'sword'}},...Array.from({length:4},(_,i)=>({id:'e'+i,side:'enemy',level:5}))],hit={target:'e0',amount:30,actual:20},heal={target:'a',healing:true,amount:30,actual:0},cast={type:'action',actor:'a',skill:'slash',time:1,results:[hit]};
 const result={units,skills:{slash:{kind:'physical'},heal:{kind:'heal'}},events:[{...cast,results:units.slice(1).map(u=>({...hit,target:u.id}))},{...cast,time:2,results:[{...hit,miss:'未命中'}]},{...cast,time:3,reaction:true},{...cast,time:4,periodic:true},{...cast,time:5,skill:'heal',results:[heal]},{...cast,time:6,skill:'heal',results:[{...heal,actual:4}]}]};
 assert.deepEqual(F.rewards(result),[{id:'a',type:'sword',amount:2,uses:2}]);
 result.units[0].weapon=null;assert.deepEqual(F.rewards(result),[]);
});
test('增益有效施放才计入熟练，持续期间提前重复刷新不增长',()=>{
 const result={units:[{id:'a',side:'ally',level:5,weapon:{type:'spear'}},{id:'e',side:'enemy',level:5}],skills:{buff:{kind:'buff'}},events:[0,1,31].map(time=>({type:'action',actor:'a',skill:'buff',time,results:[{target:'a',buff:true,status:{id:'taunt',expiresAt:time+30}}]}))};
 assert.equal(F.rewards(result)[0].uses,2);
});
test('实际战斗按武器熟练度增加武器威力，空手无武器加成',()=>{
 const b=new E.Battle({allies:[{id:'a',war:10,intelligence:10,constitution:10,speed:10,technique:10,weapon:{type:'sword',power:10},weaponProficiencies:{sword:100}}],enemies:[]});assert.equal(b.effective(b.unit('a')).weaponPower,12);b.unit('a').weapon=null;b.unit('a').attack=0;assert.equal(b.effective(b.unit('a')).weaponPower,0);
});
test('专武可沿用基础武器熟练方向，增长不会存进一个无法查看的专武类型',()=>{
 const record={weapon:{type:'halberd',proficiencyType:'spear'},weaponProficiencies:{spear:100}};assert.equal(F.power(10,record),12);
 const result={units:[{...record,id:'a',side:'ally',level:5},{id:'e',side:'enemy',level:5}],skills:{strike:{kind:'physical'}},events:[{type:'action',actor:'a',skill:'strike',time:1,results:[{target:'e',amount:20}]}]};assert.equal(F.rewards(result)[0].type,'spear');
});
test('熟练度只结算胜利中的真实施法并随存档保留，重复结算与失败不增长',()=>{
 const w=new World(hero(),{weaponType:'sword',introStep:2});assert.equal(w.beginTraining('militia-one').ok,false);assert.equal(w.pending,null);w.state.inside=true;assert.ok(w.beginTraining('militia-one').ok);const scenario=w.battleScenario(),battle=new E.Battle({...scenario,allies:scenario.allies.map(u=>({...u,war:100,baseAttributes:null,potentials:null})),rules:{...scenario.rules,hit:false}});battle.start();battle.advance(180);assert.equal(battle.status,'victory');assert.ok(F.rewards(battle.export()).length);w.resolveBattle(battle.export());assert.ok(w.character.weaponExperience.sword>0||w.character.weaponProficiencies.sword>0);assert.ok(w.lastReward.proficiencies.length);const before=JSON.stringify(w.character.weaponExperience);assert.equal(w.resolveBattle(battle.export()),false);assert.equal(JSON.stringify(w.character.weaponExperience),before);const loaded=new World(w.character,w.snapshot());assert.deepEqual(loaded.character.weaponExperience,w.character.weaponExperience);loaded.state.pendingReward=null;loaded.state.afterBattle=null;loaded.beginTraining('militia-one');loaded.resolveBattle({...battle.export(),result:'defeat'});assert.equal(JSON.stringify(loaded.character.weaponExperience),before);
});
