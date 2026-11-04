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
  const info=I.describe(b,u,skill);assert.ok(info.lines.includes('回复：42 / 人'));
  b.setMode(u.id,'manual');ready(u);assert.ok(b.manual(u.id,skill.id).ok);
  const event=b.events.find(e=>e.type==='action'&&e.skill===skill.id);
  assert.deepEqual(event.results.map(r=>r.actual),[42,42,42]);assert.ok(b.living('ally').every(a=>a.soldiers===142));
});
test('双方技能详情读取当前属性及通用技能定义，伤害、恢复及状态值一致',()=>{
  const b=battle();
  for(const u of b.units)for(const id of u.skills){const info=I.describe(b,u,b.skills[id]);assert.ok(info.name);assert.ok(info.role);assert.ok(info.lines.length>=3);assert.ok(info.lines.every(s=>!s.includes('NaN')&&!s.includes('undefined')));}
  const c=b.unit('captain'),skill=b.skills['blade-cut'],info=I.describe(b,c,skill),expected=E.physical({attacker:b.effective(c),target:b.effective(b.unit('zhangjiao')),level:1,mitigationScale:b.config.mitigationScale}).amount;
  assert.ok(info.lines.includes(`伤害：${expected}`));
  assert.ok(info.lines.includes(`使用后下次出手：${E.interval(c,b.config,skill.cooldown)}秒`));
  const taunt=I.describe(b,c,b.skills['shield-taunt']);assert.equal(taunt.lines.filter(s=>s.startsWith('护甲提升')).length,1);assert.ok(taunt.lines.some(s=>s.includes('18.5')&&s.includes('30秒')));
  assert.ok(I.describe(b,b.unit('zhangliang'),b.skills['spear-break']).lines.some(s=>s.includes('护甲−25.5')&&s.includes('40%')));
});
