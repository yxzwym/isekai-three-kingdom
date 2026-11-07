const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');
const D = require('../js/data.js');
const makeBattle = (rules = {}) => new E.Battle(D.createChibi(rules));
const sample = { side: 'ally', war: 200, intelligence: 210, soldiers: 2000, maxSoldiers:2000, attack: 100, armor:120,resistance:0 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function ready(b, id) { const u = b.unit(id); u.ready = true; u.progress = 1; return u; }
function simulate(config = {}) { const b = makeBattle(config); b.start(); while (b.status === 'running' && b.time < 360) b.advance(.1); return b; }

test('五维潜力采用100基准，等级通过成长属性影响战斗',()=>{
 assert.equal(D.REINFORCEMENTS.find(u=>u.id==='lvbu').potentials.war,100);assert.equal(D.ENEMIES.find(u=>u.id==='caocao').potentials.constitution,96);assert.equal(E.attr(0),1);assert.equal(E.attr(-1),1);assert.equal(E.attr(300),300);
});
test('每点体质提供十点生命，突破初始范围仍保持相同公式',()=>{
 for(const con of [1,20,100,255,300,3000])assert.equal(E.maxHealth(con),con*10);assert.equal(E.maxSoldiers(1,100),E.maxSoldiers(99,100));
});
test('技能伤害按属性系数加武器威力，不再乘兵力、等级或阵营系数',()=>{
 const args={attacker:sample,target:sample},full=E.physical(args).raw;close(full,(200+100)*50/170);for(const soldiers of [2000,1000,1])close(E.physical({...args,attacker:{...sample,soldiers,maxSoldiers:4000,side:'enemy'},level:99}).raw,full);close(E.physical({...args,attacker:{...sample,war:100}}).raw,200*50/170);close(E.physical({...args,attacker:{...sample,attack:200}}).raw,400*50/170);assert.equal(E.physical({...args,attacker:{...sample,soldiers:0}}).amount,0);
});
test('护甲和抗性使用原作50系数减伤曲线',()=>{
 for(const protection of [0,50,100,200,999]){const p=E.physical({attacker:sample,target:{armor:protection}}),m=E.tactic({skill:D.SKILLS.dare,intelligence:200,target:{resistance:protection}});close(p.raw/p.beforeMitigation,m.raw/m.beforeMitigation);close(p.mitigation,50/(50+protection));}
});
test('护甲不影响计策，抗性不影响物理，无视护甲能真正穿透到0',()=>{
  const args={attacker:sample,target:sample};
  close(E.physical({...args,target:{...sample,resistance:999}}).raw,E.physical(args).raw);
  const m={skill:D.SKILLS.dare,intelligence:200,target:{armor:0,resistance:100}};
  close(E.tactic(m).raw,E.tactic({...m,target:{armor:999,resistance:100}}).raw);
  const attacker={...sample,ignoreArmor:true};
  close(E.physical({attacker,target:{...sample,armor:999}}).raw,E.physical({attacker,target:{...sample,armor:0}}).raw);
  assert.ok(Number.isFinite(E.physical({attacker:sample,target:{...sample,armor:0}}).raw));
});
test('计策及治疗逐目标独立结算，单体、群体和目标人数不改变同一技能数值', () => {
  for(const kind of ['tactic','heal']){
    const args = { skill: {...D.SKILLS.huoshen,kind}, intelligence: 255, random: 1,target:{resistance:100} };
    const expected=1.3*255*(kind==='heal'?1:1/3);close(E.tactic(args).raw,expected);
    for(const count of [1,2,3,5,6,12])close(E.tactic({ ...args, count, scope: 'all' }).raw,expected);
  }
});
test('群体物理、计策及治疗实战中对1至7个同属性目标逐个结算相同数值',()=>{
  const unit=id=>({id,name:id,war:100,intelligence:90,speed:90,technique:80,leadership:90,attack:80,armor:50,resistance:50,maxSoldiers:1000,startSoldiers:500,skills:[]});
  for(const kind of ['physical','tactic','heal']){
    let expected;
    for(const count of [1,2,3,5,7]){
      const caster={...unit('caster'),initialMode:'manual',skills:['area']},targets=Array.from({length:kind==='heal'?count-1:count},(_,i)=>unit('target-'+i));
      const b=new E.Battle({allies:kind==='heal'?[caster,...targets]:[caster],enemies:kind==='heal'?[unit('enemy')]:targets,skills:{area:{id:'area',name:'群体技能',kind,side:kind==='heal'?'ally':'enemy',scope:'all',all:true,base:120,cost:0,cooldown:2}},rules:{level:1,random:false,critical:false,hit:false}});
      b.start();ready(b,'caster');assert.ok(b.manual('caster','area').ok);const event=b.events.find(e=>e.type==='action');
      expected??=event.results[0].actual;assert.equal(event.results.length,count);assert.ok(event.results.every(r=>r.actual===expected));
    }
  }
});
test('力速比封顶3，武力高允许慢，读条不会无界增加', () => {
  assert.equal(E.ratio(255, 1), 3); assert.equal(E.ratio(255, 255), .9);
  assert.equal(E.interval({ war: 255, speed: 1 }), 4.5);
  assert.equal(E.ratio(100, 100, 'modern'), .9);
});
test('手动预备不绕过读条，仅满条时执行技能', () => {
  const b = makeBattle({ random: false, hit: false }); b.start();
  const z = b.unit('zhouyu');
  assert.equal(b.queue(z.id, 'huoshen', 'caocao').queued, true);
  assert.equal(b.allySp, 64);
  b.advance(1); assert.equal(z.stats.actions, 0);
  b.advance(z.interval-1+.02); assert.equal(z.stats.actions, 1); assert.equal(b.allySp, 64);
  assert.equal(z.mode, 'manual'); assert.equal(z.queued, null);
});
test('技能时间修正作用于下一次读条，物理技能恢复基础间隔', () => {
  const b = makeBattle({ random: false, hit: false }); b.start(); const u = ready(b, 'zhouyu');
  b.act(u.id, 'huoshen', 'caocao'); close(u.interval, E.interval(u, b.config) + D.SKILLS.huoshen.cooldown);
  assert.equal(b.events.at(-1).nextInterval, u.interval);
  ready(b, 'zhouyu'); b.act(u.id, 'strike', 'caocao'); close(u.interval, E.interval(u, b.config)+D.SKILLS.strike.cooldown);
  assert.equal(E.interval(u, b.config, -100), .5);
});
test('目标无效不消耗读条', () => {
  const b = makeBattle({ allySp: 2 }); b.start(); const z = ready(b, 'zhouyu');
  assert.equal(b.act(z.id, 'yinxian', 'caocao').ok, false);
  assert.equal(z.ready, true); assert.equal(b.allySp, 2);
  assert.equal(b.act(z.id, 'strike', 'lusu').ok, false);
  assert.equal(b.events.filter(e => e.type === 'action').length, 0);
});
test('失效的预备目标不会复活或被攻击，其他人继续行动', () => {
  const b = makeBattle(); b.start(); b.queue('zhouyu', 'strike', 'caocao');
  b.unit('caocao').soldiers = 0; b.advance(2.5);
  assert.equal(b.unit('caocao').soldiers, 0); assert.equal(b.unit('zhouyu').stats.actions, 0);
  assert.ok(b.actionCount > 0); assert.ok(b.events.some(e => e.type === 'notice'));
});
test('回复有容量上限且不能复活，统计只计有效回复', () => {
  const b = makeBattle({ random: false }); b.start(); const healer = ready(b, 'lusu'), target = b.unit('ganning'); target.soldiers -= 10;
  assert.equal(b.act(healer.id, 'yinxian', target.id).ok, true);
  assert.equal(target.soldiers, target.maxSoldiers); assert.equal(healer.stats.healing, 10);
  ready(b, 'lusu'); target.soldiers = 0;
  assert.equal(b.act(healer.id, 'yinxian', target.id).ok, false); assert.equal(target.soldiers, 0);
});
test('诸葛亮闪避产生0损失，不被最低伤害覆盖', () => {
  const b = makeBattle({ hit: false, random: false }); b.start(); b.rng = () => 0;
  ready(b, 'zhangliao'); const target = b.unit('zhugeliang'), before = target.soldiers;
  b.act('zhangliao', 'strike', target.id);
  assert.equal(target.soldiers, before); assert.equal(target.stats.dodges, 1);
  assert.equal(b.events.at(-1).results[0].actual, 0);
});
test('吕布必会心独立于普通会心开关，暴击固定1.5倍且无视高防', () => {
  const b = makeBattle({ reinforcements: ['lvbu'], hit: false, random: false, critical: false }); b.start();
  for (let n = 0; n < 5; n++) { ready(b, 'lvbu'); b.unit('caocao').soldiers = 1e8; b.act('lvbu', 'strike', 'caocao'); const e = b.events.at(-1); assert.equal(e.results[0].critical, true); assert.equal(e.results[0].armor,0); }
  assert.equal(b.events.at(-1).results[0].multiplier, 1.5);
});
test('遗留策略字段兼容存档，现有技能不消耗策略', () => {
  const b = makeBattle({ random: false }); b.start(); ready(b, 'zhouyu'); b.act('zhouyu', 'huoshen', 'caocao');
  assert.equal(b.availableSp(b.unit('lusu')), 64);
  ready(b, 'caocao'); const other = b.unit('yujin').sp; b.act('caocao', 'dare', 'huanggai');
  assert.equal(b.unit('caocao').sp, 30); assert.equal(b.unit('yujin').sp, other);
});
test('超过五人的剧情单位均参战，不被固定槽位截掉', () => {
  const b = simulate({ reinforcements: ['sunquan', 'lvbu'] });
  assert.equal(b.units.filter(u => u.side === 'ally').length, 7);
  assert.ok(b.unit('sunquan').stats.actions > 0); assert.ok(b.unit('lvbu').stats.actions > 0);
});
test('同种子与同输入可复现，帧长不同不改变结算', () => {
  const a = makeBattle(), b = makeBattle(); a.start(); b.start();
  a.advance(12); for (let n = 0; n < 120; n++) b.advance(.1);
  assert.deepEqual(a.events, b.events); assert.deepEqual(a.units, b.units);
});
test('保存优先级后立即生效，无可用技能时保持待命', () => {
  const b = makeBattle(); b.start();
  b.setPriorities('zhouyu', [{ skill: 'huoshen', when: 'always', threshold: 0, scope: 'all', disabled: true }]);
  assert.equal(b.autoCommand(b.unit('zhouyu')),null);
  assert.equal(b.config.rosterOverrides.zhouyu.priorities[0].disabled, true);
});
test('默认完整战斗有攻、计、回复、溃退和真实结算，记录守恒', () => {
  const b = simulate(); assert.ok(['victory','defeat'].includes(b.status)); assert.ok(b.time>0&&b.time<360); assert.equal(b.actionCount,b.events.filter(e=>e.type==='action').length); assert.ok(b.actionCount>0);
  assert.ok(b.units.some(u => u.stats.healing > 0));
  assert.ok(b.events.some(e => e.type === 'action' && e.skill === 'strike'));
  assert.ok(b.events.some(e => e.type === 'action' && e.scope === 'all'));
  assert.equal(b.total(b.status==='victory'?'enemy':'ally'),0);
  for (const side of ['ally', 'enemy']) {
    const received = b.units.filter(u => u.side === side).reduce((n, u) => n + u.stats.received, 0);
    const healed = b.units.filter(u => u.side === side).reduce((n, u) => n + u.stats.healing, 0);
    assert.equal(b.initialTroops[side] + healed - received, b.total(side));
  }
  for (const u of b.units) { assert.ok(u.soldiers >= 0 && u.soldiers <= u.maxSoldiers); assert.ok(u.sp >= 0); }
});
test('没有脚本锁定胜利，强敌可以击败联军，0兵不会变回1兵', () => {
  const hard = simulate({ enemyLevel: 80,rosterOverrides:Object.fromEntries(D.ENEMIES.map(u=>[u.id,{attack:1000,armor:1000,resistance:1000}])) }); assert.equal(hard.status, 'defeat');
  const overrides = Object.fromEntries(D.ALLIES.map(u => [u.id, { startSoldiers: 0 }]));
  const b = makeBattle({ rosterOverrides: overrides }); b.start(); assert.equal(b.status, 'defeat'); assert.equal(b.actionCount, 0);
});
