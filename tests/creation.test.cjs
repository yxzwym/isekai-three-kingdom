const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/game-rules.js');
const fs=require('node:fs'),path=require('node:path');
function random(seed=1){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const memory=()=>{const data=new Map();return{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
const hero=()=>({name:'澎湃',identity:'civilian',appearance:'wanderer',...R.rollHero('civilian',random(17))});
test('七种身份各有五维范围，主角每次同时获得三个被动，两个极端始终固定',()=>{
  const rng=random(2026);assert.equal(R.IDENTITIES.length,7);
  for(const identity of R.IDENTITIES)for(let n=0;n<80;n++){
    const roll=R.rollHero(identity.id,rng);assert.equal(roll.passives.length,3);
    for(const[key]of R.ATTRIBUTES){const value=roll.attributes[key],[min,max]=identity.ranges[key];assert.ok(Number.isInteger(value)&&value>=min&&value<=max);assert.ok(value>=1&&value<=255);if(identity.id==='worthless')assert.equal(value,1);if(identity.id==='overlord')assert.equal(value,255);}
  }
  assert.throws(()=>R.rollHero(null),/先选择难度/);assert.throws(()=>R.rollHero('unknown'),/先选择难度/);
});
test('同档智将与猛将互换武智范围，身份平均属性随难度降低而增加',()=>{
  const ids=Object.fromEntries(R.IDENTITIES.map(i=>[i.id,i]));
  for(const[a,b]of[['teacher','bully'],['strategist','warrior']]){assert.deepEqual(ids[a].ranges.war,ids[b].ranges.intelligence);assert.deepEqual(ids[a].ranges.intelligence,ids[b].ranges.war);}
  const average=id=>{const rng=random(84);let sum=0;for(let n=0;n<1000;n++)sum+=Object.values(R.rollHero(id,rng).attributes).reduce((a,b)=>a+b,0);return sum/1000;};
  const totals=Object.fromEntries(['worthless','civilian','teacher','strategist','overlord'].map(id=>[id,average(id)]));for(const[a,b]of[['worthless','civilian'],['civilian','teacher'],['teacher','strategist'],['strategist','overlord']])assert.ok(totals[a]<totals[b]);
});
test('老百姓多数属性为中低值，但单项能突破满值的60%',()=>{
  const rng=random(88);let common=0,exceptional=0,high=0;for(let n=0;n<1000;n++){const values=Object.values(R.rollHero('civilian',rng).attributes);for(const value of values){assert.ok(value>=40&&value<=195);if(value<=110)common++;else high++;if(value>255*.6)exceptional++;}}
  assert.ok(common>4000);assert.ok(high>250&&high<750);assert.ok(exceptional>100);assert.ok(Object.values(R.rollHero('civilian',()=>1).attributes).every(value=>value===195));
});
test('新建只提供五档难度，原身份模板不再作为职业选项',()=>{
  assert.deepEqual(R.DIFFICULTIES.map(d=>d.stars),[5,4,3,2,1]);assert.equal(new Set(R.DIFFICULTIES.map(d=>d.id)).size,5);
  for(const difficulty of R.DIFFICULTIES){const rng=random(43);for(let n=0;n<100;n++){const c={name:'无名氏',difficulty:difficulty.id,appearance:'wanderer',...R.rollHero(difficulty.id,rng)};assert.equal(R.validCharacter(c),true);for(const value of Object.values(c.attributes)){assert.ok(value>=1&&value<=255);if(difficulty.id==='hell')assert.equal(value,1);if(difficulty.id==='protagonist')assert.equal(value,255);}const allowed=R.IDENTITY_PASSIVE_WEIGHTS[difficulty.profiles[0]];for(const id of c.passives)assert.ok(allowed[R.PASSIVE_MAP[id].quality]>0);}}
});
test('旧身份存档映射五档难度，新存档兼容独立装备和武器熟练度字段',()=>{
  const storage=memory(),store=new R.SaveStore(storage);
  for(const [oldId,newId]of Object.entries({worthless:'hell',civilian:'survival',teacher:'normal',bully:'normal',strategist:'heroic',warrior:'heroic',overlord:'protagonist'})){const c=hero();c.identity=oldId;storage.setItem(store.key,JSON.stringify([{version:1,character:c,savedAt:'2026-11-03T00:00:00.000Z'}]));const loaded=store.slots()[0];assert.equal(loaded.version,2);assert.equal(loaded.character.difficulty,newId);assert.equal(loaded.character.identity,undefined);assert.deepEqual(loaded.character.attributes,c.attributes);}
  const c={...hero(),difficulty:'survival',equipment:{mainHand:'sample-fan'},weaponProficiencies:{blade:12,fan:83}};delete c.identity;const before=JSON.stringify(c);const saved=store.save(1,c);assert.equal(saved.version,2);assert.deepEqual(store.slots()[1].character,c);assert.equal(JSON.stringify(c),before);
});
test('武器种类使用独立ID，三种治疗器具包含在可扩展注册表内',()=>{
  assert.equal(new Set(R.WEAPON_TYPES.map(type=>type.id)).size,R.WEAPON_TYPES.length);for(const type of R.WEAPON_TYPES){assert.ok(type.id&&type.name);}
  for(const id of ['blade','sword','spear','staff','fan','qin','dagger','bow','crossbow','needle','talisman','gourd','halberd','shield'])assert.ok(R.WEAPON_TYPES.some(type=>type.id===id));
});
test('开局为每种武器独立重掷熟练度，地狱固定1、主角剧本固定255',()=>{
  const rng=random(3810);for(const difficulty of R.DIFFICULTIES){for(let n=0;n<80;n++){const roll=R.rollHero(difficulty.id,rng);assert.deepEqual(Object.keys(roll.weaponProficiencies),R.WEAPON_TYPES.map(type=>type.id));for(const value of Object.values(roll.weaponProficiencies)){assert.ok(Number.isInteger(value)&&value>=difficulty.proficiencyRange[0]&&value<=difficulty.proficiencyRange[1]);if(difficulty.id==='hell')assert.equal(value,1);if(difficulty.id==='protagonist')assert.equal(value,255);}}}
  const a=R.rollHero('survival',rng),b=R.rollHero('survival',rng);assert.notDeepEqual(a.weaponProficiencies,b.weaponProficiencies);
});
test('熟练度兼容旧存档及后续武器类型，缺项按1读取且不改原值',()=>{
  const c=hero();delete c.weaponProficiencies;assert.equal(R.validCharacter(c),true);assert.equal(R.getWeaponProficiency(c,'needle'),1);
  c.weaponProficiencies={blade:88,'future-weapon':157};const storage=memory(),store=new R.SaveStore(storage);store.save(0,c);const loaded=store.slots()[0].character;assert.equal(R.getWeaponProficiency(loaded,'blade'),88);assert.equal(R.getWeaponProficiency(loaded,'future-weapon'),157);assert.equal(R.getWeaponProficiency(loaded,'gourd'),1);assert.deepEqual(loaded.weaponProficiencies,c.weaponProficiencies);
  for(const invalid of[null,[],{blade:0},{blade:-1},{blade:1.5}]){c.weaponProficiencies=invalid;assert.equal(R.validCharacter(c),false);}
});
test('武器方案只保留本作技能与效果，每类最多三个且定位齐全',()=>{
  const ids=new Set(),roles=new Set();for(const type of R.WEAPON_TYPES){assert.ok(type.role);roles.add(type.role);const plan=R.WEAPON_SKILL_PLANS[type.skillPlanId];assert.equal(plan.status,'design');assert.equal(plan.source,undefined);assert.ok(plan.skills.length>=1&&plan.skills.length<=3);for(const skill of plan.skills){assert.ok(!ids.has(skill.id));ids.add(skill.id);assert.ok([3,4].includes(Array.from(skill.name).length));assert.ok(['physical','tactic','heal','buff'].includes(skill.kind));assert.ok(['ally','enemy','self'].includes(skill.side));assert.ok(['single','all'].includes(skill.scope));assert.equal(skill.sourceName,undefined);}}
  assert.equal(roles.size,R.WEAPON_TYPES.length);assert.ok(R.WEAPON_SKILL_PLANS.shield.skills.some(s=>s.effects.includes('taunt')));assert.ok(R.WEAPON_SKILL_PLANS.gourd.skills.some(s=>s.effects.includes('regeneration')));assert.ok(R.WEAPON_SKILL_PLANS.talisman.skills.some(s=>s.kind==='heal'&&s.scope==='all'));assert.ok(!R.WEAPON_SKILL_PLANS.talisman.skills.some(s=>s.effects.includes('dispel')));
});
test('药囊替换为符箓后迁移熟练度，有新字段时保留新值',()=>{
  const store=new R.SaveStore(memory()),c=hero();c.weaponProficiencies={'medicine-bag':137};assert.equal(R.getWeaponProficiency(c,'talisman'),137);store.save(0,c);assert.deepEqual(store.slots()[0].character.weaponProficiencies,{talisman:137});c.weaponProficiencies.talisman=188;store.save(1,c);assert.equal(store.slots()[1].character.weaponProficiencies.talisman,188);
});
test('重掷不重复被动，彩虹融合品质不会从任何身份开局出现',()=>{
  const rng=random(381);const seen=new Set();
  for(let n=0;n<2500;n++){const roll=R.rollHero(R.IDENTITIES[n%7].id,rng);assert.equal(new Set(roll.passives).size,3);for(const id of roll.passives){const p=R.PASSIVE_MAP[id];assert.equal(p.fusionOnly,false);assert.notEqual(p.quality,'rainbow');seen.add(p.quality);}}
  assert.deepEqual([...seen].sort(),['blue','gold','green','red','white']);
  assert.ok(R.rollPassives(()=>.999999,3).every(id=>R.PASSIVE_MAP[id].quality==='red'));
});
test('身份限制开局被动品质，两个极端始终只出白色或金红色，同档使用相同概率',()=>{
  const allowed={worthless:['white'],civilian:['white','green','blue'],teacher:['white','green','blue','gold'],bully:['white','green','blue','gold'],strategist:['blue','gold','red'],warrior:['blue','gold','red'],overlord:['gold','red']};
  for(const identity of R.IDENTITIES){const rng=random(20261103),seen=new Set();for(let n=0;n<600;n++){const result=R.rollHero(identity.id,n<2?()=>n?1:0:rng);assert.equal(result.passives.length,3);assert.equal(new Set(result.passives).size,3);for(const id of result.passives){const quality=R.PASSIVE_MAP[id].quality;assert.ok(allowed[identity.id].includes(quality),`${identity.id}抽到了${quality}`);seen.add(quality);}}assert.deepEqual([...seen].sort(),allowed[identity.id].sort());}
  assert.deepEqual(R.IDENTITY_PASSIVE_WEIGHTS.teacher,R.IDENTITY_PASSIVE_WEIGHTS.bully);assert.deepEqual(R.IDENTITY_PASSIVE_WEIGHTS.strategist,R.IDENTITY_PASSIVE_WEIGHTS.warrior);
  assert.throws(()=>R.rollPassives(random(1),99,{white:1}),/数量/);
});
test('被动名称为三到四字、品质颜色齐全，NPC不受主角三个被动的限制',()=>{
  assert.equal(new Set(R.PASSIVES.map(p=>p.name)).size,R.PASSIVES.length);
  for(const p of R.PASSIVES){assert.ok([3,4].includes(Array.from(p.name).length));assert.ok(R.QUALITIES[p.quality].color);}
  assert.deepEqual(R.rollPassives(random(1),0),[]);assert.equal(new Set(R.rollPassives(random(9),8)).size,8);
  for(const count of[0,1,6]){const c=hero();c.passives=R.rollPassives(random(12),count);assert.equal(R.validCharacter(c),true);}
  assert.throws(()=>R.rollPassives(random(1),999),/数量/);
  assert.equal(R.PASSIVE_MAP.guishen.effects.guaranteedCritical,true);assert.equal(R.PASSIVE_MAP.bagua.effects.physicalDodge,.5);
});
test('姓名最多四个字，中文输入结果、空白、Emoji和空名字均正确处理',()=>{
  assert.equal(R.sanitizeName('司马长风第五'),'司马长风');assert.equal(R.sanitizeName(' 张 三\n'),'张三');assert.equal(R.sanitizeName(''),'');
  assert.equal(R.nameLength(R.sanitizeName('😀甲乙丙丁')),4);assert.equal(R.sanitizeName('😀甲乙丙丁'),'😀甲乙丙');
  const c=hero();c.name='';assert.equal(R.validCharacter(c),false);c.name='一二三四五';assert.equal(R.validCharacter(c),false);
});
test('不填写姓名时使用无名氏，正常姓名仍限制四个字且可以保存',()=>{
  for(const value of['','  ','\n\t',null,undefined])assert.equal(R.heroName(value),'无名氏');assert.equal(R.heroName('张三'),'张三');assert.equal(R.heroName('司马长风第五'),'司马长风');
  const c=hero();c.name=R.heroName('');const store=new R.SaveStore(memory());store.save(0,c);assert.equal(store.slots()[0].character.name,'无名氏');
});
test('三个存档位彼此独立，保存与读取使用副本，支持后期突破255的属性',()=>{
  const store=new R.SaveStore(memory()),a=hero(),b=hero();b.name='子龙';b.attributes.war=300;
  const saved=store.save(0,a);store.save(2,b);a.name='变更';saved.character.attributes.war=1;
  assert.equal(store.slots()[0].character.name,'澎湃');assert.equal(store.slots()[1],null);assert.equal(store.slots()[2].character.attributes.war,300);
  const read=store.slots();read[0].character.passives.length=0;assert.equal(store.slots()[0].character.passives.length,3);
  assert.throws(()=>store.save(3,hero()),/无效/);const bad=hero();bad.attributes.speed=0;assert.throws(()=>store.save(1,bad),/无效/);
});
test('损坏存档不会导致读取崩溃，写入失败不会伪装成已保存',()=>{
  const storage=memory(),store=new R.SaveStore(storage);storage.setItem(store.key,'broken json');assert.deepEqual(store.slots(),[null,null,null]);
  const c=hero();storage.setItem(store.key,JSON.stringify([{version:99,character:c},null,{version:1,character:{...c,passives:['not-a-skill']}}]));assert.deepEqual(store.slots(),[null,null,null]);
  const unavailable=new R.SaveStore({getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}});assert.deepEqual(unavailable.slots(),[null,null,null]);assert.throws(()=>unavailable.save(0,c),/blocked/);
});
test('已删除的复生被动不再抽取，旧存档只移除该被动并保留人物',()=>{
  assert.equal(R.PASSIVE_MAP.revive,undefined);assert.ok(!R.PASSIVES.some(p=>p.id==='revive'));
  const storage=memory(),store=new R.SaveStore(storage),c=hero();c.passives=['healthy','revive','steady'];storage.setItem(store.key,JSON.stringify([{version:1,character:c,savedAt:'2026-11-03T00:00:00.000Z',chapter:'prologue-start'}]));
  const saved=store.slots()[0];assert.equal(saved.character.name,c.name);assert.deepEqual(saved.character.attributes,c.attributes);assert.deepEqual(saved.character.passives,['healthy','steady']);assert.equal(saved.chapter,'prologue-start');
});
test('设置持久化且容错，不影响主角属性、身份或被动',()=>{
  const storage=memory(),store=new R.SaveStore(storage),c=hero();store.save(0,c);const before=store.slots();
  store.setSettings({screenShake:false,effects:false,menuScale:1.1});assert.deepEqual(new R.SaveStore(storage).settings(),{screenShake:false,effects:false,menuScale:1.1});assert.deepEqual(store.slots(),before);
  storage.setItem(store.settingsKey,'null');assert.deepEqual(store.settings(),{screenShake:true,effects:true,menuScale:1});assert.throws(()=>store.setSettings({menuScale:99}),/无效/);
});
test('八种形象均可保存并兼容旧形象，独立立绘与头像区域都有对应素材',()=>{
  const manifest=require('../assets/game/manifest.json'),store=new R.SaveStore(memory());
  for(const id of ['wanderer','scholar','swordswoman','healer','armored','silverguard','beggar','warlord'])assert.ok(R.APPEARANCES.some(look=>look.id===id));
  assert.equal(new Set(R.APPEARANCES.map(look=>look.id)).size,8);
  const paths=new Set();
  for(const look of R.APPEARANCES){
    const c=hero(),before=JSON.stringify({identity:c.identity,attributes:c.attributes,passives:c.passives});c.appearance=look.id;store.save(0,c);assert.equal(store.slots()[0].character.appearance,look.id);assert.equal(JSON.stringify({identity:c.identity,attributes:c.attributes,passives:c.passives}),before);
    const art=manifest.protagonists[look.id];assert.equal(art.status,'ready');const file=path.resolve(__dirname,'..',art.src);assert.ok(fs.existsSync(file));paths.add(file);
    const bytes=fs.readFileSync(file),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(bytes.toString('ascii',1,4),'PNG');assert.equal(width,art.width);assert.equal(height,art.height);assert.ok(width>=1024&&height>=1536);
    const crop=art.portrait;assert.ok(crop.x>=0&&crop.y>=0&&crop.width>0&&crop.height>0);assert.ok(crop.x+crop.width<=width&&crop.y+crop.height<=height);
  }
  assert.equal(paths.size,8);
});
