const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),W=require('../js/weapon-skills.js'),C=require('../js/weapon-catalog.js'),R=require('../js/game-rules.js'),I=require('../js/skill-info.js');
const unit=(id,extra={})=>({id,name:id,war:100,intelligence:50,constitution:1000,speed:80,technique:200,attack:20,armor:0,resistance:0,skills:[],priorities:[],initialMode:'manual',...extra});
const ready=u=>{u.ready=true;u.progress=1;};
const battle=(skills,foes=1)=>new E.Battle({allies:[unit('a',{skills})],enemies:Array.from({length:foes},(_,i)=>unit('e'+i)),rules:{hit:false,critical:false}});
test('18个武器方向和六个职业齐全，月阶与日阶技能各54条且不会互相覆盖',()=>{
 assert.equal(C.types.length,18);assert.deepEqual(C.groups.map(g=>C.types.filter(t=>t.group===g.id).length),[4,5,2,2,3,2]);const ids=new Set();for(const type of C.types){assert.equal(type.skills.length,3);assert.equal(type.daySkills.length,3);assert.deepEqual(W.forWeapon({type:type.id}),type.skills.map(s=>s.id));for(const skill of [...type.skills,...type.daySkills]){assert.ok(!ids.has(skill.id));ids.add(skill.id);assert.ok(Number.isFinite(skill.cooldown));assert.ok([3,4].includes(Array.from(skill.name).length));}}assert.equal(ids.size,108);
});
test('剑豪、剑宗、火术和治疗各自按原始系数加武器威力计算',()=>{
 const a=unit('a');assert.equal(E.skillValue(a,W.skills['sword-eagle']),595);assert.equal(E.skillValue(a,W.skills['spear-break']),100);assert.equal(E.calculate({attacker:a,target:{resistance:50},skill:W.skills['staff-fire']}).amount,73);assert.equal(E.calculate({attacker:a,target:{resistance:999},skill:W.skills['talisman-rain']}).amount,62);
});
test('命中使用技巧速度比，暴击使用每20技巧1%，不再使用旧阵营概率',()=>{
 const a=unit('a'),target=unit('e');assert.equal(E.hitChance(a,target,{hitChance:.4}),1);assert.equal(E.hitChance({...a,technique:80},target,{hitChance:.4}),.7);assert.ok(Math.abs(E.hitChance({...a,technique:80},target,{hitChance:.4},.2)-.5)<1e-12);assert.equal(E.criticalChance(a,{},W.skills['spear-break']),.18);assert.equal(E.criticalChance({...a,technique:2000},{},W.skills['spear-break']),1);
});
test('物理和魔法暴击均为固定1.5倍，治疗不会暴击',()=>{
 for(const id of ['spear-stun','staff-fire']){const b=battle([id]);b.unit('a').guaranteedCritical=true;b.start();ready(b.unit('a'));b.manual('a',id,'e0');const result=b.events.find(e=>e.type==='action').results[0],base=E.skillValue(b.unit('a'),b.skills[id]);assert.equal(result.multiplier,1.5);assert.equal(result.amount,Math.floor(base*1.5));}
});
test('夜莺流血与瘟疫独立跳伤，夜魇不会借用夜莺的高持续系数',()=>{
 const ids=W.forWeapon({type:'hook'}),b=battle(ids);b.rng=()=>0;b.start();for(const id of [ids[0],ids[2]]){ready(b.unit('a'));assert.ok(b.manual('a',id,'e0').ok);}const target=b.unit('e0');assert.deepEqual(target.statuses.map(s=>s.id),['bleed','plague']);assert.ok(target.statuses.every(s=>s.amount===91&&s.duration===8));const before=target.soldiers;b.advance(1);assert.equal(before-target.soldiers,182);assert.equal(W.skills['dagger-bleed'].effects[0].coefficient,.25);assert.equal(W.skills[ids[0]].effects[0].coefficient,.45);assert.equal(W.skills['dagger-fast'].cooldown,-1.2);
});
test('群攻附加自身加速只作用于施法者一次，不给敌人加速',()=>{
 const id='throwingKnife-2',b=battle([id],3);b.rng=()=>0;b.start();ready(b.unit('a'));b.manual('a',id);assert.equal(b.effective(b.unit('a')).speed,135);assert.ok(b.living('enemy').every(u=>u.statuses.length===0));assert.equal(b.events.filter(e=>e.type==='status'&&e.status.id==='speedUp').length,1);
});
test('黑骑方向嘲讽使用体质；武力智力衰减按实际属性参与后续伤害',()=>{
 const id=W.forWeapon({type:'greatShield'})[1],b=battle([id]);b.start();ready(b.unit('a'));b.manual('a',id);assert.equal(b.effective(b.unit('a')).armor,258);b.addStatus(b.unit('e0'),b.unit('a'),{id:'intelligenceDown',attribute:'intelligence',amount:-20,duration:5});assert.equal(E.skillValue(b.effective(b.unit('a')),W.skills['staff-fire']),96.5);
});
test('反伤动态使用技巧比例，对物理和魔法生效且以真实伤害返回',()=>{
 const b=battle(['sword-cut','staff-fire']);b.start();const a=b.unit('a'),target=b.unit('e0');b.addStatus(target,target,{...W.skills['shield-reflect'].buff},W.skills['shield-reflect']);assert.equal(target.statuses[0].reflect,.4);for(const id of a.skills){ready(a);b.manual(a.id,id,target.id);const event=b.events.filter(e=>e.skill==='status-reflect').at(-1);assert.equal(event.results[0].damageType,'true');assert.equal(event.results[0].amount,Math.floor(Math.floor(E.skillValue(a,b.skills[id]))*.4));}
});
test('种族加成有真实标签判定，普通人型不会获得猎龙加成',()=>{
 const a=unit('a'),skill=W.skills['crossbow-shot'];assert.equal(E.calculate({attacker:a,target:{species:'humanoid'},skill}).amount,915);assert.equal(E.calculate({attacker:a,target:{species:'beast'},skill}).amount,305);const dragon=W.skills['greatBow-2'];assert.equal(E.raceMultiplier(dragon,{species:'humanoid'}),1);assert.equal(E.raceMultiplier(dragon,{species:'dragon'}),3);
});
test('旧统御存档只迁移到体质，不丢失原数值、姓名和武器熟练度',()=>{
 const memory={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}},store=new R.SaveStore(memory),c={name:'旧人物',appearance:'wanderer',difficulty:'normal',...R.rollHero('normal',()=>.4)};c.attributes.leadership=c.attributes.constitution;delete c.attributes.constitution;memory.value=JSON.stringify([{version:3,character:c,savedAt:'2026-11-05T00:00:00.000Z'}]);const result=store.slots()[0].character;assert.equal(result.attributes.constitution,c.attributes.leadership);assert.equal(result.attributes.leadership,undefined);assert.deepEqual(result.weaponProficiencies,c.weaponProficiencies);assert.equal(result.name,c.name);
});
test('技能详情与同一计算函数一致，正确展示月阶概率和冷却',()=>{
 const b=battle(['spear-break']),u=b.unit('a'),skill=b.skills['spear-break'],info=I.describe(b,u,skill);assert.ok(info.lines.includes('对敌方全体造成100（武力×0.8＋武器威力）点物理伤害，65%几率附加破甲。'));assert.ok(info.lines.includes('基础命中率：40%'));assert.ok(info.lines.includes('基础暴击率：8%'));assert.ok(info.lines.includes('冷却时间增加2秒。'));
});
test('全部月阶与日阶技能均可实战释放，状态、伤害和详情没有无效数值',()=>{
 for(const type of C.types)for(const skill of [...type.skills,...type.daySkills]){
  const b=new E.Battle({allies:[unit('a',{skills:[skill.id],startSoldiers:5000}),unit('friend',{startSoldiers:5000})],enemies:[unit('e'),unit('e2')],rules:{hit:false,critical:false}});b.rng=()=>0;b.start();ready(b.unit('a'));const target=skill.side==='self'?'a':skill.side==='ally'?'friend':'e';
  assert.ok(b.manual('a',skill.id,target).ok,skill.id);const action=b.events.find(e=>e.type==='action');assert.ok(action.results.length);assert.ok(action.results.every(r=>Number.isFinite(r.amount)&&Number.isFinite(r.after)),skill.id);assert.ok(b.units.every(u=>u.statuses.every(s=>Number.isFinite(s.amount)&&Number.isFinite(s.expiresAt))),skill.id);assert.ok(I.describe(b,b.unit('a'),skill).lines.every(s=>!s.includes('NaN')&&!s.includes('undefined')),skill.id);
 }
});
test('反伤技能详情展示动态技巧比例及持续时间，不漏掉只有公式的状态',()=>{
 const b=battle(['shield-reflect']),info=I.describe(b,b.unit('a'),b.skills['shield-reflect']);assert.ok(info.lines.includes('反伤：反弹40（20＋技巧×0.1）%所受伤害，持续45秒。'));
});
test('读条使用速度加1和卸负，下限0.5秒；战斗中的属性削减可到0',()=>{
 assert.equal(E.ratio(100,100),.9);assert.equal(E.ratio(0,0),1);assert.equal(E.ratio(100,100,100),0);assert.equal(E.interval({war:1,speed:999},undefined,-1.2),.5);
 const b=battle(['sword-cut']),a=b.unit('a');b.addStatus(b.unit('e0'),a,{id:'warDown',attribute:'war',amount:-1000,duration:5});b.addStatus(b.unit('e0'),a,{id:'speedDown',attribute:'speed',amount:-1000,duration:5});assert.equal(b.effective(a).war,0);assert.equal(b.effective(a).speed,0);assert.equal(E.ratio(b.effective(a).war,b.effective(a).speed),1);
});
