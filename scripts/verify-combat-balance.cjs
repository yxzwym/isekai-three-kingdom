const assert=require('node:assert/strict');
const {general,rescueTeam,fight,Chapter,I}=require('../tests/helpers/balance.cjs');
const Audit=require('../tests/helpers/enemy-audit.cjs');
const groups=Audit.groups(),units=groups.flatMap(group=>Audit.inspect(group)),attacks=units.flatMap(unit=>unit.skills.filter(s=>['physical','tactic'].includes(s.kind)));
const report={audit:{groups:groups.length,units:units.length,skills:attacks.length,maxOffensiveAttribute:Math.max(...units.flatMap(u=>['war','intelligence','speed','technique'].map(k=>u.attributes[k]))),maxNormalDamage:Math.max(...attacks.map(s=>s.normal)),maxCriticalDamage:Math.max(...attacks.map(s=>s.critical)),maxPeriodicTick:Math.max(...attacks.flatMap(s=>s.periodic.map(e=>e.amount)))},ordinary:{attempts:0,victories:0},rescue:{attempts:40,victories:0,longestSeconds:0},questEquipment:{attempts:12,victories:0}};
assert.ok(report.audit.maxOffensiveAttribute<=150);assert.ok(report.audit.maxNormalDamage<=700);assert.ok(report.audit.maxCriticalDamage<=1000);assert.ok(report.audit.maxPeriodicTick<=25);
for(let seed=0;seed<40;seed++){
 const b=fight(rescueTeam(),Chapter.enemies('dongzhuo'),'boss-seed-'+seed);
 if(b.status==='victory')report.rescue.victories++;
 report.rescue.longestSeconds=Math.max(report.rescue.longestSeconds,Number(b.time.toFixed(2)));
 assert.equal(b.status,'victory','rescue seed '+seed);assert.ok(b.time<300);assert.ok(b.units.filter(u=>u.side==='ally').every(u=>!u.dead));
}
for(let seed=0;seed<12;seed++){
 const team=rescueTeam();team[0].equipment.accessory1=I.create('cloud-pendant','blue');
 const b=fight(team,Chapter.enemies('dongzhuo'),'quest-equipment-'+seed);
 if(b.status==='victory')report.questEquipment.victories++;
 assert.equal(b.status,'victory','quest speed equipment '+seed);
}
// Record a broad roster sample without imposing a predetermined losing result.
const ids=['zhaoyun','zhenji','zhangbao','zhangliang','zhangjiao','guanyu','zhangfei','lvbu','ganning','huatuo','zhouyu','zhugeliang'];
for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)for(let c=b+1;c<ids.length;c++)for(let d=c+1;d<ids.length;d++){
 const names=[ids[a],ids[b],ids[c],ids[d]],battle=fight(names.map(id=>general(id,20)),Chapter.enemies('dongzhuo'),'ordinary-'+report.ordinary.attempts);
 report.ordinary.attempts++;if(battle.status==='victory')report.ordinary.victories++;
 assert.ok(['victory','defeat'].includes(battle.status),names.join(','));
}
console.log(JSON.stringify(report));
