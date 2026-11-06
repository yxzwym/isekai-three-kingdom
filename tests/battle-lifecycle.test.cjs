const test=require('node:test'),assert=require('node:assert/strict'),E=require('../js/engine.js'),P=require('../js/prologue.js'),Presentation=require('../js/presentation.js'),R=require('../js/game-rules.js'),{World}=require('../js/world.js');
const healer=id=>({id,name:id,war:10,intelligence:10,constitution:10,speed:10,technique:10,skills:['heal'],priorities:[{skill:'heal',when:'healThresholds',selfThreshold:1,allyThreshold:1}]}),heal={id:'heal',name:'回春',kind:'heal',scope:'single',side:'ally',cost:0,scaling:{intelligence:1},cooldown:0};
test('默认僵持战斗到5分钟才开放撤退，不强制结束，并保留即时撤退和禁用覆盖',()=>{
 const b=new E.Battle({allies:[healer('a')],enemies:[healer('e')],skills:{heal}});assert.equal(b.canRetreat(),false);b.start();b.unit('a').soldiers=50;b.unit('e').soldiers=50;b.advance(299.98);assert.equal(b.time,299.98);assert.equal(b.status,'running');assert.equal(b.canRetreat(),false);assert.equal(b.retreat(),false);b.advance(.02);assert.equal(b.canRetreat(),true);assert.ok(b.retreat());assert.equal(b.status,'retreated');assert.equal(b.canRetreat(),false);
 const instant=new E.Battle({allies:[healer('a')],enemies:[healer('e')],skills:{heal},allowRetreat:true});instant.start();assert.ok(instant.canRetreat());
});
test('张角手动教学超过5分钟仍不能撤退，显式即时撤退也不能越过教程锁',()=>{
 const scenario=P.createBattle('manual-fight',{name:'行客'}),b=new E.Battle({...scenario,allowRetreat:true,enemies:scenario.enemies.map(u=>({...u,healthOverride:1000000}))});b.start();b.advance(301);assert.equal(b.status,'running');assert.ok(b.time>=301);assert.equal(b.canRetreat(),false);assert.equal(b.retreat(),false);for(const stage of ['first-fight','squad-fight'])assert.equal(P.createBattle(stage,{name:'行客'}).control.retreatDisabled,true);
});
test('敌人始终没有重伤救起阶段，显式传入重伤开关也不生效',()=>{
 const b=new E.Battle({allies:[healer('a')],enemies:[{...healer('e'),woundsEnabled:true},healer('enemy-healer')],skills:{heal}});b.start();const e=b.unit('e');assert.equal(e.woundsEnabled,false);b.damageUnit(b.unit('a'),e,10000);assert.equal(e.soldiers,0);assert.equal(e.dead,true);assert.equal(e.wounded,false);assert.equal(b.validate(b.unit('enemy-healer'),'heal','e').ok,false);
});
test('敌人消失动画连续淡出并轻微下沉，500毫秒后完全隐藏',()=>{
 assert.deepEqual(Presentation.enemyDefeatPose(0),{alpha:1,sink:0,scale:1,finished:false});const middle=Presentation.enemyDefeatPose(250),end=Presentation.enemyDefeatPose(500);assert.ok(middle.alpha>0&&middle.alpha<1);assert.ok(middle.sink>0&&middle.sink<12);assert.ok(middle.scale<1);assert.equal(end.alpha,0);assert.equal(end.finished,true);
});
test('撤退恢复进入战斗前存档，不增加经验、掉落或金钱',()=>{
 const w=new World({name:'行客',...R.rollHero('normal',()=>.4)},{weaponType:'sword',introStep:2}),before=w.snapshot(),experience=w.character.experience;w.move('julu',{eventRoll:0});assert.ok(w.pending);assert.equal(w.resolveBattle({result:'retreated'}),false);assert.deepEqual(w.snapshot(),before);assert.equal(w.character.experience,experience);assert.equal(w.pending,null);
});
