// Offline combat verification using the same units, equipment and engine as the game.
const assert=require('node:assert/strict'),{general,rescueTeam,fight,Chapter}=require('../tests/helpers/balance.cjs');
const report={ordinary:{attempts:0,victories:0},rescue:{attempts:40,victories:0,longestSeconds:0}};
for(let seed=0;seed<40;seed++){const b=fight(rescueTeam(),Chapter.enemies('dongzhuo'),'boss-seed-'+seed);if(b.status==='victory')report.rescue.victories++;report.rescue.longestSeconds=Math.max(report.rescue.longestSeconds,Number(b.time.toFixed(2)));assert.equal(b.status,'victory','rescue seed '+seed);}
const ids=['zhaoyun','zhenji','zhangbao','zhangliang','zhangjiao','guanyu','zhangfei','lvbu','ganning','huatuo','zhouyu','zhugeliang'];
for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)for(let c=b+1;c<ids.length;c++)for(let d=c+1;d<ids.length;d++){const names=[ids[a],ids[b],ids[c],ids[d]],battle=fight(names.map(id=>general(id,20)),Chapter.enemies('dongzhuo'),'ordinary-'+report.ordinary.attempts);report.ordinary.attempts++;if(battle.status==='victory')report.ordinary.victories++;assert.notEqual(battle.status,'victory',names.join(','));}
console.log(JSON.stringify(report));
