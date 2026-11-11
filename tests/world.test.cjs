const test=require('node:test'),assert=require('node:assert/strict');
const {World,neighbors}=require('../js/world.js'),D=require('../js/world-data.js'),R=require('../js/game-rules.js'),E=require('../js/engine.js'),P=require('../js/prologue.js');
const character=(difficulty='normal')=>({name:'无名氏',appearance:'wanderer',difficulty,...R.rollHero(difficulty,()=>.4)});
const world=()=>{const w=new World(character());w.chooseWeapon('sword');return w;};

test('大陆全部地标沿路连通，单段移动仍受相邻限制，没有体力和路费字段',()=>{
 const reached=new Set(['camp']),queue=['camp'];while(queue.length)for(const id of neighbors(queue.shift()))if(!reached.has(id)){reached.add(id);queue.push(id);}assert.equal(reached.size,D.places.filter(p=>!p.requiresWater).length);for(const [a,b]of D.roads){assert.ok(D.placeMap[a]&&D.placeMap[b]);assert.notEqual(a,b);}
 const w=world(),before=w.snapshot();assert.equal(w.move('chengdu',{eventRoll:.8}).ok,false);assert.deepEqual(w.snapshot(),before);assert.equal(w.move('julu',{eventRoll:.8}).ok,true);assert.equal(w.state.nodeId,'julu');for(const key of ['stamina','fare','gold'])assert.equal(w.state[key],undefined);
});
test('出营按体质恢复正常生命，主角独行，18类武器均有1至3个可用技能',()=>{
 for(const difficulty of R.DIFFICULTIES){const c={...character(difficulty.id),passives:[]},w=new World(c);assert.deepEqual(w.state.activeIds,['hero']);assert.equal(w.state.companions.length,0);assert.equal(w.members()[0].startSoldiers,E.maxHealth(c.attributes.constitution));
  for(const type of R.WEAPON_TYPES){assert.equal(w.chooseWeapon(type.id),true);const u=w.members()[0];assert.equal(u.weapon.type,type.id);assert.ok(u.skills.length>=1&&u.skills.length<=3);assert.ok(u.skills.some(id=>['physical','tactic'].includes(require('../js/weapon-skills.js').skills[id].kind)));}}
});
test('路遇战复用通用战斗，敌人默认随机，战前保持正常未满读条与可配置模式',()=>{
 const w=world(),before=w.snapshot();w.move('julu',{eventRoll:0});assert.equal(w.state.nodeId,before.nodeId);const b=new E.Battle(w.battleScenario());assert.equal(b.status,'ready');assert.ok(b.units.every(u=>u.progress===0));assert.ok(b.living('enemy').every(u=>u.targetRule==='random'));assert.equal(b.living('ally').length,1);assert.deepEqual(b.living('ally')[0].skills,w.members()[0].skills);
 const extras=Array.from({length:6},(_,i)=>({...w.members()[0],id:'story-'+i}));assert.equal(w.battleScenario({extraAllies:extras}).allies.length,7);
});
test('战败恢复完整战前状态，胜利后才抵达地标并保留队伍剩余兵力',()=>{
 const w=world();w.state.troops.hero=35;const before=w.snapshot();w.move('julu',{eventRoll:0});w.state.troops.hero=0;assert.equal(w.resolveBattle({result:'defeat',units:[]}),false);assert.deepEqual(w.snapshot(),before);assert.equal(w.pending,null);
 w.move('julu',{eventRoll:0});assert.equal(w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:17}]}),true);assert.equal(w.state.nodeId,'julu');assert.equal(w.state.troops.hero,Math.floor(17*w.members()[0].maxSoldiers/100));assert.ok(w.state.visited.includes('julu'));assert.equal(w.state.steps,before.steps+1);
});
test('战前调整的自动手动和施法设置写入战前快照，战败不丢配置',()=>{
 const w=world();w.move('julu',{eventRoll:0});const u=w.members()[0];u.mode='manual';u.targetRule='highestCurrent';w.saveTactics(u);w.resolveBattle({result:'defeat'});assert.equal(w.members()[0].initialMode,'manual');assert.equal(w.members()[0].targetRule,'highestCurrent');
});
test('招募按国家计数，七人满队阻止继续招募；离队后仍保留国家目标',()=>{
 const w=world();for(const country of ['wei','shu','wu'])for(let i=0;i<3;i++){const id=country+'-'+i;assert.ok(w.recordRecruit(id,country,{name:id,homeNode:'camp',maxSoldiers:100,skills:['punch']}));assert.equal(w.recordRecruit(id,'wei'),false);if(w.members().length===7)assert.ok(w.dismiss(w.state.companions[0].id));}
 assert.deepEqual(w.counts(),{wei:3,shu:3,wu:3});assert.ok(w.coalitionReady());assert.ok(w.members().length<=7);assert.equal(w.setActive([]),false);
});
test('正常四人上阵、携带八人，未来可开放五人上阵；战斗接口仍支持额外友军',()=>{
 const w=world();for(let i=0;i<7;i++)assert.ok(w.recordRecruit('unit-'+i,'wei',{name:'人'+i,homeNode:'camp',maxSoldiers:120,skills:['punch']}));assert.equal(w.members().length,8);assert.equal(w.recordRecruit('overflow','wei',{name:'溢出'}),false);assert.ok(w.lastRecruitError.includes('队伍已满'));assert.equal(w.counts().wei,7);assert.equal(w.setActive(w.members().slice(0,5).map(u=>u.id)),false);assert.ok(w.setActive(['unit-5']));assert.equal(w.state.activeIds.includes('hero'),false);assert.equal(w.setActive(['unit-5','unit-5']),false);
 assert.ok(w.unlockActiveLimit(5));assert.ok(w.setActive(w.members().slice(0,5).map(u=>u.id)));assert.equal(new World(w.character,w.snapshot()).activeLimit(),5);w.move('julu',{eventRoll:0});assert.equal(w.battleScenario().rules.partySlots,5);assert.equal(w.battleScenario({extraAllies:[{...w.members()[0],id:'story-extra'}]}).allies.length,6);
});
test('未开发城村拒入，附近村落开放、营地可休整；风闻不假装完成英雄招募',()=>{
 const w=world(),result=w.move('julu',{eventRoll:.1});assert.equal(result.kind,'rumor');assert.equal(w.state.inside,false);assert.ok(w.enter());assert.equal(w.state.inside,true);w.leave();w.arrive('camp');w.enter();assert.equal(w.state.inside,true);w.state.troops.hero=1;w.rest();assert.equal(w.state.troops.hero,w.members()[0].maxSoldiers);w.leave();assert.equal(w.state.inside,false);assert.deepEqual(w.counts(),{wei:0,shu:0,wu:0});assert.equal(D.clues.length,9);for(const id of ['wei','shu','wu'])assert.equal(D.clues.filter(c=>c.faction===id).length,3);
});
test('路线事件可以按存档重现，不通过主角难度改变敌方配置',()=>{
 const a=world(),b=new World(a.character,a.snapshot());assert.deepEqual(a.move('julu'),b.move('julu'));const h=new World(character('hell')),easy=new World(character('protagonist'));h.chooseWeapon('sword');easy.chooseWeapon('sword');for(const w of [h,easy])w.move('julu',{eventRoll:0});assert.deepEqual(h.battleScenario().enemies,easy.battleScenario().enemies);
});
test('新剧情接到梦境与出营，旧完成存档重接新营地，不再询问年号',()=>{
 assert.equal(P.chapters.camp.next,'dream');assert.equal(P.chapters.dream.next,'dawn');assert.equal(P.chapters.dawn.next,'departure');assert.equal(P.checkpoint({stage:'complete'}).stage,'camp');assert.equal(P.checkpoint({stage:'camp',index:20}).index,0);assert.equal(P.checkpoint({storyVersion:2,stage:'camp',index:20}).index,20);const text=['camp','dream','dawn'].flatMap(id=>P.chapters[id].lines.map(l=>l.text)).join('');assert.ok(!text.includes('光和七年')&&!text.includes('是哪一年'));for(const names of [['董卓'],['魏'],['蜀'],['吴'],['南华'],['左慈','左元放'],['于吉'],['许褚','许仲康'],['甘宁','甘兴霸']])assert.ok(names.some(name=>text.includes(name)),names.join('/'));
});
test('大地图存档往返保留位置、队伍、兵器、招募和兵力，旧人物五维不被改写',()=>{
 const memory={value:null,getItem(){return this.value;},setItem(key,value){this.value=value;}},store=new R.SaveStore(memory),w=world();w.move('julu',{eventRoll:.8});w.state.troops.hero=23;w.recordRecruit('xuchu','wei');const c=character(),before=JSON.stringify(c);store.save(0,c,{storyVersion:2,stage:'world',world:w.snapshot()});const slot=store.slots()[0];assert.equal(slot.chapter,'world-map');assert.deepEqual(new World(c,slot.progress.world).snapshot(),w.snapshot());assert.equal(JSON.stringify(c),before);assert.deepEqual(P.checkpoint(slot.progress).world,w.snapshot());
});

test('地图含三国志13完整60城，周边村县与关港全连通且ID唯一',()=>{
 assert.equal(D.cityIds.length,60);assert.equal(new Set(D.places.map(p=>p.id)).size,D.places.length);assert.equal(D.places.filter(p=>p.kind==='city'&&!p.requiresWater).length,60);assert.ok(D.places.length>=130);for(const city of D.cityIds){assert.equal(D.placeMap[city].kind,'city');assert.ok(D.places.some(p=>p.parent===city)||D.placeAliases[city+'-county']===city);}for(const id of ['xiangping','jiaozhi','yongchang','nanhai','zangke'])assert.ok(D.placeMap[id]);
});
test('分段行路未抵达不改变所在地，半途处理事件后才能到达',()=>{
 const w=world(),before=w.snapshot();assert.equal(w.beginTravel('julu',{eventRoll:.8}).ok,true);assert.deepEqual(w.snapshot(),before);assert.equal(w.finishTravel(),false);assert.equal(w.beginTravel('ye').ok,false);assert.equal(w.travelEvent().kind,'quiet');assert.equal(w.state.nodeId,'camp');assert.equal(w.travelEvent(),null);assert.equal(w.finishTravel(),true);assert.equal(w.state.nodeId,'julu');assert.equal(w.state.steps,before.steps+1);
});
test('半途战斗获胜后仍须赶完剩余路程，战败恢复出发快照',()=>{
 const w=world(),before=w.snapshot();w.beginTravel('julu',{eventRoll:0});assert.equal(w.travelEvent().kind,'battle');assert.equal(w.finishTravel(),false);w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:14}]});assert.equal(w.state.nodeId,'camp');assert.equal(w.state.troops.hero,Math.floor(14*w.members()[0].maxSoldiers/100));assert.equal(w.finishTravel(),true);assert.equal(w.state.nodeId,'julu');
 const a=new World(w.character,before);a.beginTravel('julu',{eventRoll:0});a.travelEvent();a.resolveBattle({result:'defeat'});assert.deepEqual(a.snapshot(),before);assert.equal(a.journey,null);
});
test('梦中先答应回家，再让玩家选择追加报酬或留下，三仙分左右',()=>{
 const dream=P.chapters.dream.lines,text=dream.map(l=>l.text).join('');assert.ok(text.includes('知晓三国往事'));assert.ok(!text.includes('十万两黄金'));assert.ok(text.includes('送你回家'));assert.ok(P.dreamBranches.gold.some(l=>l.text.includes('十万两黄金')));assert.ok(P.dreamBranches.stay.some(l=>l.speaker==='nanhua'&&l.text.includes('你自己选')));assert.notEqual(dream.find(l=>l.speaker==='zuoci').side,dream.find(l=>l.speaker==='nanhua').side);
});

test('四人上阵限制迁移旧阵容，第五人保留候补；旧九江位置迁往柴桑',()=>{
 const w=world();for(let i=0;i<5;i++)w.recordRecruit('extra-'+i,'wei',{name:'将'+i,maxSoldiers:100,skills:['spear-cut']});const saved=w.snapshot();saved.activeIds=['hero','extra-0','extra-1','extra-2','extra-3'];saved.nodeId='jiujiang';saved.visited.push('jiujiang');const next=new World(w.character,saved);assert.equal(next.state.activeIds.length,4);assert.equal(next.members().length,6);assert.equal(next.setActive(saved.activeIds),false);assert.equal(next.location().name,'柴桑');assert.ok(next.state.visited.includes('chaisang'));assert.ok(!D.places.some(p=>p.name==='九江'||p.name==='建瓯'||p.name==='临漳'));
});
test('前两段路平安，事件后至少两段路不插事件，存档保留间隔',()=>{
 const w=world();for(const to of ['changshan','camp']){w.beginTravel(to);assert.equal(w.travelEvent().kind,'quiet');w.finishTravel();}w.beginTravel('julu',{eventRoll:0});w.travelEvent();w.resolveBattle({result:'victory'});w.finishTravel();assert.equal(w.state.lastEventStep,3);const loaded=new World(w.character,w.snapshot());for(const to of ['camp','julu']){loaded.beginTravel(to);assert.equal(loaded.travelEvent().kind,'quiet');loaded.finishTravel();}assert.equal(loaded.state.steps,5);assert.equal(D.roadEvents.filter(e=>e.kind!=='quiet').reduce((n,e)=>n+e.weight,0),12);
});
test('常山引导阶段存档可恢复，走过地图的旧存档不反复教学',()=>{
 const w=world();assert.equal(w.state.introStep,0);w.state.introStep=1;assert.equal(new World(w.character,w.snapshot()).state.introStep,1);w.state.introStep=2;assert.equal(new World(w.character,w.snapshot()).state.introStep,2);const old=w.snapshot();delete old.introStep;old.steps=4;assert.equal(new World(w.character,old).state.introStep,2);assert.ok(!P.chapters.dawn.lines.some(l=>l.text.includes('拨一支小队')));
});

test('旧地图兵力按剩余比例迁到体质生命，重复载入不二次放大',()=>{
 const character={name:'旧旅人',appearance:'wanderer',difficulty:'normal',...R.rollHero('normal',()=>.4)};character.baseAttributes.constitution=100;character.attributes.constitution=100;
 const old={version:1,nodeId:'camp',weaponType:'sword',troops:{hero:39},introStep:2},first=new World(character,old),expected=Math.floor(1000*39/Math.round(200*100/255));
 assert.equal(first.members()[0].maxSoldiers,1000);assert.equal(first.state.troops.hero,expected);assert.equal(first.state.version,3);assert.equal(new World(character,first.snapshot()).state.troops.hero,expected);
});
