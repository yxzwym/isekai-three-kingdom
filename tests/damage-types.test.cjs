const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),P=require('../js/presentation.js'),{CanvasBattle}=require('../js/canvas-battle.js');
require('../js/canvas-effects.js');
const unit=(id,extra={})=>({id,name:id,war:100,intelligence:100,leadership:100,speed:100,technique:100,maxSoldiers:1000,attack:100,armor:100,resistance:100,skills:['spear-cut','staff-shock'],priorities:[],initialMode:'manual',...extra});
const make=()=>new E.Battle({allies:[unit('a')],enemies:[unit('e')],rules:{random:false,hit:false,critical:false}});
const ready=u=>{u.ready=true;u.progress=1;};

test('物理与计策的伤害结果带独立类型，暴击仍沿用本类型颜色',()=>{
  const b=make(),a=b.unit('a');b.start();for(const [skill,type]of [['spear-cut','physical'],['staff-shock','tactic']]){ready(a);b.act(a.id,skill,'e');const result=b.events.filter(e=>e.type==='action').at(-1).results[0];assert.equal(result.damageType,type);assert.equal(P.resultColor(result),P.DAMAGE_COLORS[type]);assert.equal(P.resultColor({...result,critical:true}),P.DAMAGE_COLORS[type]);}
  assert.equal(P.resultColor({damageType:'true'}),'#ffffff');assert.equal(P.resultColor({healing:true,damageType:'tactic'}),'#8ceba5');assert.equal(P.resultColor({miss:'闪避',damageType:'physical'}),'#d5dbcb');
});
test('反伤以实际受伤比例产生真实伤害，不再受攻击者护甲或抗性减免',()=>{
  const run=protection=>{const b=make(),a=b.unit('a'),enemy=b.unit('e');a.armor=protection;a.resistance=protection;b.start();b.addStatus(enemy,enemy,{id:'reflectDamage',reflect:.5});ready(a);b.act(a.id,'spear-cut',enemy.id);const actions=b.events.filter(e=>e.type==='action'),hit=actions[0].results[0],counter=actions[1].results[0];assert.equal(counter.damageType,'true');assert.equal(counter.actual,Math.floor(hit.actual*.5));return counter.actual;};assert.equal(run(0),run(9999));
});
test('同帧同目标的三种伤害不混色合并，飘字分行且血条取最终结果',()=>{
  const b=make(),e=b.unit('e');b.start();let before=e.soldiers;for(const [skill,damageType,actual]of [['spear-cut','physical',10],['staff-shock','tactic',20],['status-reflect','true',5]]){b.events.push({type:'action',actor:'a',skill,skillName:'测试',results:[{target:'e',before,after:before-actual,actual,damageType,critical:true}]});before-=actual;}
  let health;const view={battle:b,seen:0,floats:[],options:{},ended:false,vfx:{action(){}},health:new Map([['e',{set(value){health=value;}}]])};CanvasBattle.prototype.processEvents.call(view,100);
  const floats=view.floats.filter(f=>f.type!=='skill');assert.deepEqual(floats.map(f=>f.color),Object.values(P.DAMAGE_COLORS));assert.equal(new Set(floats.map(f=>f.lane)).size,3);assert.deepEqual(floats.map(f=>f.text),['−10!','−20!','−5!']);assert.equal(health,before);
});

function floatsFor(b){const v={battle:b,seen:0,floats:[],options:{},ended:true,vfx:{action(){}},health:new Map()};CanvasBattle.prototype.processEvents.call(v,100);return v.floats.filter(f=>f.type!=='skill');}
test('致命物理和计策飘字显示减伤后完整伤害，扣兵和统计只记录实际扣除量',()=>{
  for(const skill of ['spear-cut','staff-shock']){const b=make(),a=b.unit('a'),e=b.unit('e');e.soldiers=2;b.start();ready(a);b.act(a.id,skill,e.id);const r=b.events.find(e=>e.type==='action').results[0];assert.ok(r.amount>2);assert.equal(r.actual,2);assert.equal(e.soldiers,0);assert.equal(a.stats.damage,2);assert.equal(e.stats.received,2);assert.equal(floatsFor(b)[0].text,'−'+r.amount);}
});
test('吸血按命中后的完整伤害计算，敌人残血不削减吸血，回复受最大兵力限制',()=>{
  for(const missing of [200,1]){const b=make(),a=b.unit('a'),e=b.unit('e');a.soldiers=a.maxSoldiers-missing;e.soldiers=2;b.skills['spear-cut'].lifesteal=.5;b.start();ready(a);const before=a.soldiers;b.act(a.id,'spear-cut',e.id);const [hit,heal]=b.events.find(e=>e.type==='action').results;assert.equal(hit.actual,2);assert.ok(hit.amount>2);assert.equal(heal.amount,Math.floor(hit.amount*.5));assert.equal(heal.actual,Math.min(missing,heal.amount));assert.equal(a.soldiers,before+heal.actual);assert.equal(floatsFor(b).find(f=>f.id===a.id).text,'+'+heal.actual);}
  const b=make(),a=b.unit('a');a.soldiers=800;b.unit('e').dodge=1;b.skills['spear-cut'].lifesteal=.5;b.start();ready(a);b.act(a.id,'spear-cut','e');assert.equal(a.soldiers,800);assert.equal(b.events.find(e=>e.type==='action').results.length,1);
});
test('持续伤害、闪避电击和真实反伤在致命时同样保留完整伤害飘字',()=>{
  const dot=make();dot.unit('e').soldiers=2;dot.start();dot.addStatus(dot.unit('a'),dot.unit('e'),{id:'burn',amount:20,duration:3});dot.advance(1);assert.equal(floatsFor(dot)[0].text,'−20');
  const lightning=make(),a=lightning.unit('a'),e=lightning.unit('e');a.passives=['thunder-lord'];e.soldiers=2;lightning.start();lightning.rng=()=>0;ready(e);lightning.act(e.id,'spear-cut',a.id);const counter=lightning.events.find(e=>e.reaction).results[0];assert.ok(counter.amount>2);assert.equal(counter.actual,2);assert.equal(floatsFor(lightning).find(f=>f.id===e.id).text,'−'+counter.amount);
  const reflect=make(),attacker=reflect.unit('a'),defender=reflect.unit('e');attacker.soldiers=3;attacker.attack=1000000;defender.soldiers=defender.maxSoldiers=10000000;reflect.start();reflect.addStatus(defender,defender,{id:'reflectDamage',reflect:.5});ready(attacker);reflect.act(attacker.id,'spear-cut',defender.id);const r=reflect.events.find(e=>e.skill==='status-reflect').results[0];assert.ok(r.amount>3);assert.equal(r.actual,3);assert.equal(floatsFor(reflect).find(f=>f.id===attacker.id).text,'−'+r.amount);
});

test('持续伤害只更新生命与飘字，不产生受击、施法、闪红、震屏；持续治疗仍有绿色回复特效',()=>{
 const fx=new global.BattleVFX.BattleEffects(),skill={kind:'tactic',element:'fire'},event={actor:'a',periodic:true,results:[{target:'e',actual:7,damageType:'tactic'}]};fx.action(event,skill,100);assert.equal(fx.items.length,0);assert.equal(fx.hits.length,0);assert.equal(fx.motions.length,0);assert.equal(fx.shakeUntil,0);const b=make();b.start();b.events.push({type:'action',skill:'staff-shock',skillName:'着火',...event,results:[{...event.results[0],before:1000,after:993,amount:7}]});let hp;const v={battle:b,seen:0,floats:[],options:{},ended:false,vfx:fx,health:new Map([['e',{set(value){hp=value;}}]])};CanvasBattle.prototype.processEvents.call(v,100);assert.equal(hp,993);assert.deepEqual(v.floats.map(f=>f.text),['−7']);fx.action({actor:'a',periodic:true,results:[{target:'a',healing:true,actual:7}]},{kind:'heal'},110);assert.ok(fx.items.length);
});
test('我方受击未命中显示闪避，敌方受击未命中显示未命中，不改变底层闪避判定',()=>{
 const b=make();b.start();for(const [target,miss]of [['a','未命中'],['a','闪避'],['e','未命中'],['e','闪避']])b.events.push({type:'action',actor:target==='a'?'e':'a',skill:'spear-cut',skillName:'直刺',results:[{target,miss,actual:0}]});const v={battle:b,seen:0,floats:[],options:{},ended:false,vfx:{action(){}},health:new Map()};CanvasBattle.prototype.processEvents.call(v,100);assert.deepEqual(v.floats.filter(f=>f.type!=='skill').map(f=>f.text),['闪避','闪避','未命中','未命中']);
});
