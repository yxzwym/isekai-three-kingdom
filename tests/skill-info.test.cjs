const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),P=require('../js/prologue.js'),I=require('../js/skill-info.js');
const battle=()=>new E.Battle(P.createBattle('squad-fight',{name:'无名氏'}));
const ready=u=>{u.progress=1;u.ready=true;};

test('官兵装备长枪且从零读条，不同武力速度自然错开首次施法',()=>{
  const b=battle(),soldiers=b.units.filter(u=>u.id.startsWith('soldier-'));
  assert.ok(soldiers.every(u=>u.weapon.type==='spear'&&u.skills.every(id=>id.startsWith('spear-'))));
  assert.ok(b.units.every(u=>u.progress===0));for(const ally of b.units.filter(u=>u.side==='ally'))b.setMode(ally.id,'manual');b.start();b.advance(3.1);
  const first=soldiers.map(u=>b.events.find(e=>e.type==='action'&&e.actor===u.id));
  assert.ok(first.every(Boolean));assert.equal(new Set(first.map(e=>e.time)).size,4);
  for(let i=0;i<soldiers.length;i++)assert.ok(Math.abs(first[i].time-E.interval(soldiers[i],b.config))<.021);
  const captain=b.unit('captain');assert.equal(captain.weapon.type,'spear');assert.equal(captain.equipment.offhand,undefined);assert.deepEqual(Object.keys(captain.equipment),['armor','accessory1','accessory2']);
});
test('群疗按智力与武器威力计算，直接按装备威力恢复生命，不会一次回满',()=>{
  const b=battle(),u=b.unit('zhangbao'),skill=b.skills['scripture-2'];b.start();
  for(const ally of b.living('ally'))ally.soldiers=100;
  const value=E.skillValue(b.effective(u),skill),amount=E.calculate({attacker:b.effective(u),skill}).amount,info=I.describe(b,u,skill);assert.ok(info.lines.some(l=>l.startsWith('为我方全体回复'+amount+'（（智力×0.85＋武器威力）')&&l.includes('）×1.15）点生命')));
  b.setMode(u.id,'manual');ready(u);assert.ok(b.manual(u.id,skill.id).ok);
  const event=b.events.find(e=>e.type==='action'&&e.skill===skill.id);
  assert.deepEqual(event.results.map(r=>r.actual),[amount,amount,amount]);assert.ok(b.living('ally').every(a=>a.soldiers===100+amount));
});
test('双方技能详情读取当前属性及通用技能定义，伤害、恢复及状态值一致',()=>{
  const b=battle();
  for(const u of b.units)for(const id of u.skills){const info=I.describe(b,u,b.skills[id]);assert.ok(info.name);assert.ok(info.role);assert.ok(info.lines.length>=3);assert.ok(info.lines.every(s=>!s.includes('NaN')&&!s.includes('undefined')));}
  const c=b.unit('captain'),skill=b.skills['blade-cut'],info=I.describe(b,c,skill),expected=E.physical({attacker:b.effective(c),target:{armor:0},skill,mitigationScale:b.config.mitigationScale}).amount;
  assert.ok(info.lines.some(l=>l.startsWith(`对敌方单体造成${expected}（武力×2＋武器威力`)));assert.ok(!info.lines.some(l=>l.includes('武器威力×1.1')));
  assert.ok(info.lines.includes(`冷却时间增加${skill.cooldown}秒。`));
  const taunt=I.describe(b,c,b.skills['shield-taunt']);assert.equal(taunt.lines.filter(s=>s.startsWith('护甲提升')).length,1);assert.ok(taunt.lines.some(s=>s.includes('9.9')&&s.includes('30秒')));
  const armorBreak=I.describe(b,b.unit('zhangliang'),b.skills['spear-break']);assert.ok(armorBreak.lines.includes('破甲：减少目标10.25（3＋技巧×0.25）点护甲，持续8秒。'));assert.ok(armorBreak.lines.some(s=>s.includes('65%几率附加破甲')));
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
  assert.ok(captain.maxSoldiers>standard.maxSoldiers&&captain.maxSoldiers<=standard.maxSoldiers*1.5);assert.ok(captain.armor>standard.armor);
  const damage=u=>E.physical({attacker:u,target:{armor:0},level:1}).amount;
  assert.ok(damage(captain)<=damage(standard)*1.25);assert.ok(captain.skills.includes('shield-taunt'));
});
test('技能详情把被动的实际增伤增疗计入括号算法，计策名称统一',()=>{const u={id:'hero',name:'行客',war:100,intelligence:100,constitution:100,speed:100,technique:10,passives:['renewal','heavenly'],skills:['heal','spell']},skills={heal:{id:'heal',name:'疗伤',kind:'heal',scope:'single',side:'ally',scaling:{intelligence:1},weaponCoefficient:0},spell:{id:'spell',name:'电击',kind:'tactic',scope:'single',side:'enemy',scaling:{intelligence:1},weaponCoefficient:0}},b=new E.Battle({allies:[u],enemies:[],skills});for(const id of ['heal','spell'])assert.match(I.describe(b,b.unit('hero'),b.skills[id]).lines[1],/125（（智力×1）×1.25）/);assert.equal(I.describe(b,b.unit('hero'),b.skills.spell).role,'单体计策伤害');assert.ok(I.describe(b,b.unit('hero'),b.skills.spell).lines[1].endsWith('点计策伤害。'));});
