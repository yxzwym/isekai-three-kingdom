const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {World}=require('../js/world.js'),R=require('../js/game-rules.js'),G=require('../js/character-growth.js'),H=require('../js/hero-quests.js'),C=require('../js/recruitment-content.js'),J=require('../js/hero-professions.js'),I=require('../js/items.js'),W=require('../js/weapon-skills.js'),Catalog=require('../js/weapon-catalog.js'),P=require('../js/passives.js'),A=require('../js/character-assets.js'),E=require('../js/engine.js');
const ids=['guanlu','huangyueying','zhurong'];
const make=()=>new World({name:'行客',appearance:'scholar',difficulty:'normal',...G.characterAt(R.rollHero('normal',()=>.5),8)},{introStep:2,quests:{changshan:{stage:'complete'}}});
test('可招募队友覆盖全部18种兵器方向，不以敌将或主角补数',()=>{
 const ids=[...Object.keys(H.definitions),'zhaoyun','zhenji','zhangliang'],covered=new Set(ids.map(id=>J.definitions[id]?.weaponType));
 assert.equal(covered.size,18);assert.deepEqual([...covered].sort(),Catalog.types.map(t=>t.id).sort());
 for(const id of ids)assert.ok(H.definitions[id]||['zhaoyun','zhenji','zhangliang'].includes(id));
});
test('旧存档补入三条未开始的路线，不重置已有任务、背包和招募记录',()=>{
 const w=make();w.state.heroQuests.xuchu.stage='freed';w.addItem('fine-sword','green');const snapshot=w.snapshot();for(const id of ids)delete snapshot.heroQuests[id];const restored=new World(w.character,snapshot);
 for(const id of ids){assert.equal(restored.state.heroQuests[id].stage,H.definitions[id].start);assert.equal(!!restored.state.heroQuests[id].accepted,false);}
 assert.equal(restored.state.heroQuests.xuchu.stage,'freed');assert.deepEqual(restored.state.inventory,snapshot.inventory);assert.deepEqual(restored.state.recruits,snapshot.recruits);
});
test('三名新队友使用实际职业技能、成长和三项有效特质，图像完整登记',()=>{
 const expected={guanlu:['whisk',5],huangyueying:['cannon',8],zhurong:['dagger',12]};
 for(const id of ids){const d=H.definitions[id],u=C.companion(id,8),[type,level]=expected[id];assert.equal(d.recommendedLevel,level);assert.equal(u.weapon.type,type);assert.ok(I.canEquip(u,u.weapon));assert.equal(I.canEquip(u,I.create('weapon-sword')),false);assert.ok(G.isGeneral(u));assert.ok(u.passives.length>=3);for(const p of u.passives)assert.ok(P.definitions[p],p);assert.ok(u.passives.some(p=>P.definitions[p].exclusive));assert.deepEqual(u.skills,W.forWeapon(u.weapon));
  const art=A.resolve(id);assert.ok(art.fullbody&&art.portrait);assert.ok(fs.existsSync(path.join(__dirname,'..',art.fullbody.src)));assert.ok(!art.fullbody.src.includes('pending'));
 }
 const frost=C.companion('guanlu',8).skills.map(id=>W.skills[id]);assert.ok(frost.some(s=>s.effects.some(e=>e.id==='stun')));
 const cuts=C.companion('zhurong',8).skills.map(id=>W.skills[id]);assert.ok(cuts.some(s=>s.effects.some(e=>e.id==='bleed')));assert.ok(cuts.some(s=>s.effects.some(e=>e.id==='plague')));
 const shots=C.companion('huangyueying',8).skills.map(id=>W.skills[id]);assert.ok(shots.some(s=>s.effects.some(e=>e.id==='armorDown')));
});
test('新招募路线只在当前步骤展示，可存取、拒绝、重邀，归处不复制在队人物',()=>{
 for(const id of ids){let w=make();for(const ally of ['machao','zhouyu','huatuo'])w.recordRecruit(ally,H.definitions[ally].country,C.companion(ally,20));w.state.chapterOne.stage='gather';let steps=0,battles=0;
  while(w.state.heroQuests[id].stage!=='freed'&&steps++<20){const q=w.state.heroQuests[id],d=H.definitions[id],stage=q.stage;w.arrive(H.place(id,q));const c=d.stages[stage].npc.choices[0];assert.ok(w.chooseHeroQuest(id,0,stage));if(c.battle){battles++;const scenario=w.battleScenario();assert.ok(scenario.enemies.every(u=>u.level===d.recommendedLevel));const b=new E.Battle(scenario);b.start();b.advance(295);assert.equal(b.status,'victory',id+':'+stage);w.resolveBattle(b.export());w.state.pendingReward=null;w.state.afterBattle=null;w.rest();}w=new World(w.character,w.snapshot());}
  assert.equal(battles,2);assert.equal(w.state.heroQuests[id].stage,'freed');assert.ok(w.finishHeroQuest(id,false));assert.equal(w.state.heroQuests[id].stage,'complete');assert.ok(w.state.recruits[H.definitions[id].country].includes(id));assert.ok(w.state.residents[id]);w.arrive(H.definitions[id].home);assert.ok(w.sceneNpcs().some(n=>n.id===id));assert.ok(w.inviteResident(id));assert.equal(w.members().find(u=>u.id===id).level,w.character.level);assert.ok(!w.sceneNpcs().some(n=>n.id===id));assert.ok(w.dismiss(id));assert.ok(w.inviteResident(id));assert.equal(w.state.recruits[H.definitions[id].country].filter(v=>v===id).length,1);assert.equal(w.state.chapterOne.stage,'gather');
 }
});
