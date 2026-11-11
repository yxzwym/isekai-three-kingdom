const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/game-rules.js'),E=require('../js/engine.js');
const weights={white:1,green:1,blue:1,gold:1,red:1},profile=(war,intelligence,constitution=40)=>({war,intelligence,constitution,speed:40,technique:40});
const physical=p=>['physicalMultiplier','physicalLifesteal','armorPierce','physicalHitBonus','counterChance'].some(k=>p.effects[k]!=null),tactic=p=>['tacticMultiplier','resistancePierce','tacticCriticalBonus','tacticCriticalDamageBonus','tacticHitBonus','healingMultiplier','overhealShield'].some(k=>p.effects[k]!=null),defense=p=>['constitutionMultiplier','armorMultiplier','resistanceMultiplier','takenMultiplier','tacticTakenMultiplier','lowTroopsTakenMultiplier','openingShield','actionRegen'].some(k=>p.effects[k]!=null);
test('高武低智与高智低武不会抽到相反流派专用被动，品质抽取独立且每次三项不重复',()=>{
 for(const potentials of [profile(100,10),profile(10,100)]){const rng=E.seededRandom('build');let aligned=0,aims=0;for(let i=0;i<1000;i++){const ids=R.rollPassives(rng,3,weights,potentials);assert.equal(new Set(ids).size,3);for(const id of ids){const p=R.PASSIVE_MAP[id];assert.ok(!(potentials.war>potentials.intelligence?tactic(p):physical(p)),id);if(potentials.war>potentials.intelligence?physical(p):tactic(p))aligned++;if(p.effects.physicalHitBonus||p.effects.tacticHitBonus)aims++;}}assert.ok(aligned>1700);assert.ok(aims>300);}
 for(const difficulty of R.DIFFICULTIES)for(const potentials of [profile(100,10),profile(10,100),profile(40,40,100)])assert.ok(R.rollPassives(()=>1,3,difficulty.passiveWeights,potentials).every(id=>R.PASSIVE_MAP[id].quality==='red'));
});
test('高体质更容易出现抗伤与生存被动，偏好不影响原有的难度品质权重',()=>{
 function sample(potentials){const rng=E.seededRandom('constitution');let count=0;for(let i=0;i<1000;i++)for(const id of R.rollPassives(rng,3,weights,potentials))if(defense(R.PASSIVE_MAP[id]))count++;return count;}
 assert.ok(sample(profile(40,40,100))>sample(profile(40,40,10))*1.8);
 const rng=E.seededRandom('red-chance');let previous=0;for(const difficulty of R.DIFFICULTIES){let reds=0;for(let i=0;i<5000;i++)for(const id of R.rollHero(difficulty.id,rng).passives)if(R.PASSIVE_MAP[id].quality==='red')reds++;assert.ok(reds>previous,difficulty.id);previous=reds;}
});
test('开局武力智力优先互补，潜力仍为整数且总量不变，实际初值仍为10',()=>{
 const rng=E.seededRandom('complement');let opposed=0,physicalBuilds=0,tacticBuilds=0;for(let i=0;i<4000;i++){const c=R.rollHero('normal',rng),p=c.potentials;assert.equal(Object.values(p).reduce((a,b)=>a+b),300);assert.ok(Object.values(p).every(v=>Number.isInteger(v)&&v>=1&&v<=100));assert.ok(Object.values(c.attributes).every(v=>v===10));if(Math.abs(p.war-p.intelligence)>=15)opposed++;if(p.war>=90){physicalBuilds++;assert.ok(p.intelligence<p.war);}if(p.intelligence>=90){tacticBuilds++;assert.ok(p.war<p.intelligence);}}
 assert.ok(opposed>2800);assert.ok(physicalBuilds>50&&tacticBuilds>50);
});
test('物理与计策命中被动仅提升对应攻击，原来的通用命中与命中公式继续生效',()=>{
 for(const [kind,id]of [['physical','physical-aim-gold'],['tactic','tactic-aim-gold']]){const b=new E.Battle({allies:[{id:'hero',constitution:10,technique:100,passives:[id]}],enemies:[{id:'enemy',constitution:10,speed:100}]}),actor=b.effective(b.unit('hero')),target=b.effective(b.unit('enemy'));assert.ok(Math.abs(E.hitChance(actor,target,{kind,hitChance:.4})-.9)<1e-9);assert.ok(Math.abs(E.hitChance(actor,target,{kind:kind==='physical'?'tactic':'physical',hitChance:.4})-.7)<1e-9);assert.equal(E.hitChance(actor,target,{kind,alwaysHit:true}),1);}
 assert.ok(Math.abs(E.hitChance({technique:100,hitBonus:.1,physicalHitBonus:.1},{speed:100},{kind:'physical',hitChance:.4},.2)-.7)<1e-9);
});
