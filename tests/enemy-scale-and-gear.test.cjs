const test=require('node:test'),assert=require('node:assert/strict');
const {E,G,I,W,H,RC,World,R,general,fight,Chapter}=require('./helpers/balance.cjs');
const Audit=require('./helpers/enemy-audit.cjs'),Field=require('../js/field-equipment.js'),N=require('../js/nearby-content.js'),S=require('../js/battle-simulator.js');
const character=()=>({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.5)});

test('全部敌军使用当前章节的攻击量级，地狱只增加约20%，不混入上千攻击属性',()=>{
 const groups=Audit.groups();assert.ok(groups.length>=190);
 for(const group of groups)for(const difficulty of ['normal','hell'])for(const unit of Audit.inspect(group,difficulty)){
  for(const key of ['war','intelligence','speed','technique'])assert.ok(unit.attributes[key]<=150,unit.group+':'+unit.name+':'+key);
  for(const skill of unit.skills.filter(s=>['physical','tactic'].includes(s.kind))){assert.ok(skill.normal<=(difficulty==='hell'?840:700),unit.group+':'+skill.name);assert.ok(skill.critical<=(difficulty==='hell'?1200:1000),unit.group+':'+skill.name);for(const effect of skill.periodic)assert.ok(effect.amount<=25,unit.group+':'+effect.id);}
 }
});

test('董卓攻击是明确的技能公式和实际护甲结算，不截断伤害；保留生命、撤退与追击机制',()=>{
 const b=new E.Battle({allies:[general('zhaoyun',20)],enemies:Chapter.enemies('dongzhuo')}),u=b.living('enemy')[0],skill=b.skills[u.skills[0]],actor=b.effective(u);
 assert.equal(u.maxSoldiers,7200);assert.equal(E.skillValue(actor,skill),648);assert.equal(E.calculate({attacker:actor,target:{armor:10},skill}).amount,540);
 assert.equal(E.calculate({attacker:actor,target:{armor:10},skill,critical:1.5}).amount,810);assert.equal(skill.effects?.length||0,0);assert.ok(skill.ignoreTaunt);assert.equal(u.targetRule,'lowestCurrent');
});

test('敌方吕布的必暴击叠加仍在本作量级，调整不改变入队吕布的武器和专属特质',()=>{
 for(const roster of [Chapter.enemies('gate'),RC.enemies('lvbu','trial')]){const b=new E.Battle({allies:[general('zhaoyun',20)],enemies:roster}),u=b.units.find(u=>u.characterId==='lvbu'),a=b.effective(u);assert.ok(a.guaranteedCritical&&a.ignoreArmor);for(const id of u.skills)assert.ok(E.calculate({attacker:a,target:{armor:0},skill:b.skills[id],critical:1.5}).amount<600);}
 const ally=general('lvbu',20),b=new E.Battle({allies:[ally],enemies:Chapter.enemies('dongzhuo')}),u=b.living('ally')[0];assert.ok(b.effective(u).guaranteedCritical);assert.equal(b.skills['sword-critical'].scaling.war,4.8);
});

test('女性战斗角色速度独立成长，旧队伍和驻地更新一次，不动等级、生命、经验或装备',()=>{
 for(const id of ['zhenji','diaochan','sunshangxiang']){const now=G.create(id,20);assert.ok(now.speed>=72);assert.ok(now.potentials.speed>=80);}
 const old={...general('zhenji',20),id:'zhenji',agilityRevision:undefined,experience:7};old.baseAttributes.speed=8;old.potentials.speed=8;old.speed=14;old.attributes.speed=14;
 const w=new World(character(),{introStep:2,companions:[old],activeIds:['hero','zhenji'],troops:{zhenji:67}}),u=w.members().find(u=>u.id==='zhenji');assert.equal(u.speed,72);assert.equal(u.startSoldiers,67);assert.equal(u.experience,7);assert.deepEqual(u.weapon,old.weapon);
 const trained={...old,potentials:{...old.potentials,speed:99}};assert.equal(G.normalizeKnownPotentials(trained).potentials.speed,99);
 w.state.companions[0].potentials.speed=99;const loaded=new World(w.character,w.snapshot());assert.equal(loaded.members().find(u=>u.id==='zhenji').potentials.speed,99);
});

test('独特防具饰品各有固定获取任务，品质和加成固定，不进入杂兵掉落和普通商店',()=>{
 const unique=Object.values(Field.templates).filter(t=>t.unique);assert.equal(unique.length,20);
 const rewarded=new Set(Object.values(I.rewards).flat().map(([id])=>id));for(const template of unique){assert.ok(rewarded.has(template.id));assert.ok(template.acquisition);assert.deepEqual(I.create(template.id,'red').attributes,template.attributes);assert.equal(I.create(template.id,'white').quality,template.quality);assert.ok(!I.shopTemplates().includes(template.id));}
 for(const key of Object.keys(I.rewards)){const [kind,id]=key.split(':');assert.ok(kind==='hero'?H.definitions[id]:kind==='side'?N.sideQuests.some(q=>q.id===id):N.storyBattles[id],key);}
 const loot=I.loot(Array.from({length:100},()=>({level:10})),E.seededRandom('loot'));assert.ok(loot.items.length);assert.ok(loot.items.every(item=>!I.templates[item.templateId].unique));
 const sim=new S.Session();for(const item of unique)assert.equal(sim.catalog().filter(i=>i.templateId===item.id).length,1);
});

test('旧档已完成的剧情和支线补领一次，重复读档、重复交付不会复制装备和金钱',()=>{
 const q=N.sideQuests.find(q=>q.id==='trade-road'),w=new World(character(),{introStep:2,questProgressVersion:2,quests:{changshan:{stage:'complete'},side:{[q.id]:{accepted:true,paid:true,wins:q.rounds,rounds:q.rounds}}},heroQuests:{taishici:{stage:'complete',accepted:true}},money:123});
 for(const id of ['travel-knot','cloud-pendant','feather-pendant'])assert.ok(w.state.inventory.some(i=>i.templateId===id));assert.equal(w.state.money,123);assert.equal(w.state.pendingReward.items.length,3);
 const first=w.snapshot(),loaded=new World(w.character,first);assert.deepEqual(loaded.snapshot(),first);loaded.state.pendingReward=null;const next=new World(loaded.character,loaded.snapshot());assert.equal(next.state.pendingReward,null);assert.equal(next.state.inventory.length,3);assert.deepEqual(next.claimEquipmentReward('hero:taishici'),[]);
});

test('剧情战和委托将配速装备放进正常奖励，背包可以换装并实际缩短行动间隔',()=>{
 const w=new World(character(),{introStep:2,weaponType:'sword',nodeId:'changshan',quests:{changshan:{stage:'escort'}}});w.pending={kind:'story',phase:'escort',to:'changshan',checkpoint:w.snapshot(),memberIds:['hero'],seed:'reward-escort'};
 assert.ok(w.resolveBattle({result:'victory',units:[]}));assert.ok(w.state.pendingReward.items.some(i=>i.templateId==='travel-knot'));
 const q=N.sideQuests.find(q=>q.id==='trade-road');w.state.pendingReward=null;w.arrive(q.giverPlace);Object.assign(w.state.quests.side[q.id],{accepted:true,wins:q.rounds});const reward=w.turnInSide(q.id),item=reward.items.find(i=>i.templateId==='cloud-pendant');assert.ok(item);const before=w.members()[0],interval=E.interval(before);assert.ok(w.changeEquipment('hero','accessory1',item.uid));assert.ok(E.interval(w.members()[0])<interval);assert.equal(w.turnInSide(q.id),false);
});

test('配装的回复、命中、穿甲和免疫真实生效，反复计算或卸下不会残留或重复叠加',()=>{
 const unit=general('zhenji',20),base=I.apply(unit),gear={...unit,equipment:{...unit.equipment,accessory1:I.create('water-pendant'),armor:I.create('healers-coat')}},a=I.apply(gear),again=I.apply(a);
 assert.ok(Math.abs(a.healingBonus-.23)<1e-9);assert.equal(again.healingBonus,a.healingBonus);assert.equal(again.speed,a.speed);
 const b=new E.Battle({allies:[gear],enemies:Chapter.enemies('dongzhuo')}),u=b.living('ally')[0],heal=b.skills[u.skills.find(id=>b.skills[id].kind==='heal')];assert.ok(E.calculate({attacker:b.effective(u),skill:heal}).amount>E.calculate({attacker:{...b.effective(u),healingBonus:b.effective(u).healingBonus-.23},skill:heal}).amount);
 const immune=I.apply({...unit,equipment:{accessory1:I.create('wind-ring')}});assert.ok(immune.statusImmunities.includes('paralysis'));const removed=I.apply({...immune,equipment:{accessory1:null}});assert.ok(!removed.statusImmunities.includes('paralysis'));assert.equal(removed.speed,base.speed);assert.equal(removed.dodge,0);
 const strike=general('zhaoyun',20),plain=new E.Battle({allies:[strike],enemies:Chapter.enemies('dongzhuo')}),equipped=new E.Battle({allies:[{...strike,equipment:{accessory1:I.create('breaker-ring')}}],enemies:Chapter.enemies('dongzhuo')});assert.equal(equipped.effective(equipped.living('ally')[0]).armorPenetration,8);assert.ok(E.hitChance({...plain.effective(plain.living('ally')[0]),hitBonus:.08},{speed:100},W.skills['spear-cut'])>E.hitChance(plain.effective(plain.living('ally')[0]),{speed:100},W.skills['spear-cut']));
});
