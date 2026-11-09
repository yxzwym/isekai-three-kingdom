const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/game-rules.js'),P=require('../js/passives.js'),E=require('../js/engine.js');
require('../js/chapter-traits.js');
const rates={white:.05,green:.1,blue:.15,gold:.2,red:.25};

test('通用特质的增益幅度按品质固定为5%、10%、15%、20%、25%，条件阈值独立保留',()=>{
  for(const p of Object.values(P.definitions)){
    if(p.exclusive||p.temporary||p.enemyOnly||p.quality==='rainbow')continue;
    const rate=rates[p.quality];assert.ok(rate,p.id);
    for(const [stat,value]of Object.entries(p.stats)){
      if(['executeThreshold','lowTroopsThreshold'].includes(stat)){assert.equal(value,.3,p.id);assert.match(p.description,/低于30%/,p.id);continue;}
      assert.equal(typeof value,'number',p.id+':'+stat);
      const magnitude=stat.endsWith('Multiplier')&&stat!=='counterMultiplier'?Math.abs(value-1):value;
      assert.ok(Math.abs(magnitude-rate)<1e-9,`${p.id}: ${stat}=${value}`);
    }
  }
});

test('开局各品质伤害天赋的面板与实际技能伤害一致，不再出现翻倍的通用红色加成',()=>{
  for(const [id,expected]of [['steady',1050],['brave',1100],['unstoppable',1150],['mastermind',1200],['heavenly',1250]]){
    const skill={id:'strike',name:'试招',kind:id==='mastermind'||id==='heavenly'?'tactic':'physical',side:'enemy',scope:'single',scaling:{war:1},weaponCoefficient:0};
    const b=new E.Battle({allies:[{id:'hero',war:1000,intelligence:1000,constitution:100,skills:['strike'],passives:[id]}],enemies:[{id:'foe',constitution:100,armor:0,resistance:0}],skills:{strike:skill}});
    const actor=b.effective(b.unit('hero')),result=E.calculate({attacker:actor,target:b.unit('foe'),skill});
    assert.equal(result.amount,expected,id);assert.match(R.PASSIVE_MAP[id].description,new RegExp(rates[R.PASSIVE_MAP[id].quality]*100+'%'));
  }
});

test('英雄专属与敌方临时规则保留独立数值和机制',()=>{
  assert.deepEqual(P.definitions['lvbu-peerless'].stats,{guaranteedCritical:true,ignoreArmor:true});
  assert.equal(P.definitions['zhuge-eight-trigrams'].stats.physicalDodgeBonus,.5);
  assert.equal(P.definitions['zhaoyun-courage'].stats.missingHealthDamageBonus,.5);
  assert.equal(P.definitions['thunder-lord'].triggers[0].on,'dodge');
  assert.equal(P.definitions['enemy-healing-suppression'].stats.opponentHealingMultiplier,.25);
  assert.equal(P.definitions['enemy-stun-resistance'].stats.immuneStun,true);
  assert.equal(P.definitions['luoyang-possession'].stats.healthMultiplier,3);
});


test('通用与专属同名时按被动ID独立生效，随机特质不会获得英雄专属机制',()=>{
  const b=new E.Battle({allies:[{id:'random',name:'诸葛亮',constitution:100,passives:['guishen','bagua']},{id:'lvbu',constitution:100,passives:['lvbu-peerless']},{id:'zhugeliang',constitution:100,passives:['zhuge-eight-trigrams']}],enemies:[]}),random=b.effective(b.unit('random')),lvbu=b.effective(b.unit('lvbu'));
  assert.equal(random.guaranteedCritical,false);assert.equal(random.criticalBonus,.25);assert.equal(random.ignoreArmor,false);
  assert.equal(b.dodgeChance(b.unit('random'),'physical'),.25);assert.equal(b.dodgeChance(b.unit('zhugeliang'),'physical'),.5);
  assert.equal(lvbu.guaranteedCritical,true);assert.equal(lvbu.ignoreArmor,true);
});
