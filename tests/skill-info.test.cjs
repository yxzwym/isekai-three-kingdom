const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),P=require('../js/prologue.js'),I=require('../js/skill-info.js');
const battle=()=>new E.Battle(P.createBattle('squad-fight',{name:'无名氏'}));
const ready=u=>{u.progress=1;u.ready=true;};

test('官兵装备长枪且从零读条，不同武力速度自然错开首次施法',()=>{
  const b=battle(),soldiers=b.units.filter(u=>u.id.startsWith('soldier-'));
  assert.ok(soldiers.every(u=>u.weapon.type==='spear'&&u.skills.every(id=>id.startsWith('spear-'))));
  assert.ok(b.units.every(u=>u.progress===0));b.start();b.advance(3.1);
  const first=soldiers.map(u=>b.events.find(e=>e.type==='action'&&e.actor===u.id));
  assert.ok(first.every(Boolean));assert.equal(new Set(first.map(e=>e.time)).size,4);
  for(let i=0;i<soldiers.length;i++)assert.ok(Math.abs(first[i].time-E.interval(soldiers[i],b.config))<.021);
  const captain=b.unit('captain');assert.equal(captain.weapon.type,'blade');assert.equal(captain.equipment.offhand.type,'shield');
});
test('群疗数值说明与实际结算一致，200兵力时每人42，不会一次回满',()=>{
  const b=battle(),u=b.unit('zhangbao'),skill=b.skills['talisman-rain'];b.start();
  for(const ally of b.living('ally'))ally.soldiers=100;
  const info=I.describe(b,u,skill);assert.ok(info.lines.includes('为我方全体回复42点兵力，附加抗性提升。'));
  b.setMode(u.id,'manual');ready(u);assert.ok(b.manual(u.id,skill.id).ok);
  const event=b.events.find(e=>e.type==='action'&&e.skill===skill.id);
  assert.deepEqual(event.results.map(r=>r.actual),[42,42,42]);assert.ok(b.living('ally').every(a=>a.soldiers===142));
});
test('双方技能详情读取当前属性及通用技能定义，伤害、恢复及状态值一致',()=>{
  const b=battle();
  for(const u of b.units)for(const id of u.skills){const info=I.describe(b,u,b.skills[id]);assert.ok(info.name);assert.ok(info.role);assert.ok(info.lines.length>=3);assert.ok(info.lines.every(s=>!s.includes('NaN')&&!s.includes('undefined')));}
  const c=b.unit('captain'),skill=b.skills['blade-cut'],info=I.describe(b,c,skill),expected=E.physical({attacker:b.effective(c),target:{armor:0},level:1,mitigationScale:b.config.mitigationScale}).amount;
  assert.ok(info.lines.includes(`对敌方单体造成${expected}点物理伤害。`));
  assert.ok(info.lines.includes(`冷却时间增加${skill.cooldown}秒。`));
  const taunt=I.describe(b,c,b.skills['shield-taunt']);assert.equal(taunt.lines.filter(s=>s.startsWith('护甲提升')).length,1);assert.ok(taunt.lines.some(s=>s.includes('18')&&s.includes('30秒')));
  const armorBreak=I.describe(b,b.unit('zhangliang'),b.skills['spear-break']);assert.ok(armorBreak.lines.includes('破甲：减少目标25.5点护甲，持续8秒。'));assert.ok(armorBreak.lines.some(s=>s.includes('40%几率附加破甲')));
});
test('技能介绍不假定任何受击角色，敌方护甲变化不改变减伤前基础伤害',()=>{
  const b=battle(),u=b.unit('captain'),skill=b.skills['blade-cut'],before=I.describe(b,u,skill);
  assert.ok(before.lines.every(s=>!s.includes('张角')&&!s.includes('按当前')&&!s.includes('伤害受目标')&&!s.includes('兵力越少')&&!s.includes('附加恢复')&&!s.includes('出手间隔')));
  b.unit('zhangjiao').armor=9999;assert.deepEqual(I.describe(b,u,skill),before);
  u.soldiers=Math.floor(u.soldiers/2);assert.equal(I.describe(b,u,skill).lines[1],before.lines[1]);
});
test('队长与普通官兵同档输出，仅耐久和通用嘲讽形成主要区别',()=>{
  const b=battle(),captain=b.unit('captain'),soldiers=b.units.filter(u=>u.id.startsWith('soldier-')),standard=soldiers[0];
  assert.ok(soldiers.every(u=>u.attack===captain.attack));assert.equal(captain.war,standard.war);assert.equal(captain.speed,standard.speed);
  assert.ok(captain.maxSoldiers>standard.maxSoldiers&&captain.maxSoldiers<=standard.maxSoldiers*1.25);assert.ok(captain.armor>standard.armor);
  const damage=u=>E.physical({attacker:u,target:{armor:0},level:1}).amount;
  assert.ok(damage(captain)<=damage(standard)*1.25);assert.ok(captain.skills.includes('shield-taunt'));
});
