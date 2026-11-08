const test=require('node:test'),assert=require('node:assert/strict'),{general,rescueTeam,fight,E,G,C,Chapter,RC,H,W,I,World,R}=require('./helpers/balance.cjs'),Catalog=require('../js/enemy-catalog.js'),N=require('../js/nearby-content.js');
test('任务战固定在各自推荐等级，单挑免晕与压制回复，招募后重新按主角等级计算',()=>{
 let duels=0;for(const d of Object.values(H.definitions))for(const [phase,f]of Object.entries(d.battles||{})){
  const a=RC.enemies(d.id,phase,1),b=RC.enemies(d.id,phase,20);assert.deepEqual(a,b,d.id+':'+phase);assert.ok(a.every(u=>u.level>=1&&u.level<=20));
  if(f.solo&&f.duel){duels++;for(const id of ['enemy-stun-resistance','enemy-healing-suppression'])assert.ok(a[0].passives.includes(id));const model=new World({name:'行客',appearance:'scholar',difficulty:'normal',...G.characterAt(R.rollHero('normal',()=>.4),3)}),recruit=model.prepareRecruit(a[0]);assert.equal(recruit.level,3);assert.ok(!recruit.passives.some(id=>require('../js/passives.js').definitions[id]?.enemyOnly));}
 }assert.equal(duels,5);assert.equal(Chapter.enemies('dongzhuo')[0].level,25);
});
test('杂兵独立数值、单体攻击和法系混编，护卫更耐打，普通突袭者仍可控制',()=>{
 for(const level of [1,5,10,20])for(const role of Object.keys(Catalog.profiles)){const u=Catalog.unit(role,level);assert.equal(u.potentials,undefined);assert.equal(u.baseAttributes,undefined);const b=new E.Battle({allies:[general('huatuo',level)],enemies:[u]});assert.equal(b.living('enemy')[0].maxSoldiers,u.constitution*10);}
 assert.ok(Catalog.unit('captain',20).constitution>2*Catalog.unit('infantry',20).constitution);
 const b=new E.Battle({allies:[general('huatuo',10)],enemies:Catalog.roster(10,4,'ambush')});b.start();b.rng=()=>0;assert.ok(b.addStatus(b.living('ally')[0],b.living('enemy')[0],{id:'stun',chance:1,duration:3}));
 for(const id of ['ganning','xuchu','dianwei','maliang'])assert.ok(Object.keys(H.definitions[id].battles).some(phase=>RC.enemies(id,phase).some(u=>u.skills.some(id=>W.skills[id].kind==='tactic'))),id);
});
test('追袭无视嘲讽时仍按最低当前生命选目标，通用随机目标不受影响',()=>{
 const a=general('zhaoyun',10),weak=general('zhenji',10),b=new E.Battle({allies:[a,weak],enemies:[Catalog.unit('raider',10)]});b.start();const enemy=b.living('enemy')[0];b.addStatus(b.unit(a.id),b.unit(a.id),{id:'taunt',taunt:true,duration:20});for(let i=0;i<10;i++)assert.equal(b.autoCommand(enemy).target,weak.id);
});
test('地狱沿用求生开局，并由通用临时特质提高敌方生命与伤害20%，旧极端档可继续培养',()=>{
 assert.deepEqual(R.rollHero('hell',()=>.4),R.rollHero('survival',()=>.4));const scenario={allies:[general('zhaoyun',5)],enemies:[Catalog.unit('infantry',5)]},plain=new E.Battle(scenario),hard=new E.Battle({...scenario,rules:{difficulty:'hell'}}),p=plain.living('enemy')[0],h=hard.living('enemy')[0];assert.equal(h.maxSoldiers,Math.floor(p.maxSoldiers*1.2));assert.ok(h.passives.includes('enemy-hell-strength'));assert.equal(hard.effective(h).damageMultiplier,1.2);assert.ok(!hard.living('ally')[0].passives.includes('enemy-hell-strength'));
 const c={name:'旧档',appearance:'scholar',difficulty:'hell',...R.rollHero('normal',()=>.4),potentials:Object.fromEntries(G.KEYS.map(k=>[k,1]))},m=new World(c);assert.ok(Object.values(m.character.potentials).every(n=>n===40));assert.deepEqual(new World(m.character,m.snapshot()).character.potentials,m.character.potentials);
});
test('董卓保留生命与追击，攻击降至当前属性量级，不再附加生命流失',()=>{
 const enemy=Chapter.enemies('dongzhuo')[0],b=new E.Battle({allies:rescueTeam(),enemies:[enemy]}),d=b.living('enemy')[0],skill=b.skills[d.skills[0]];assert.equal(d.level,25);assert.equal(E.skillValue(b.effective(d),skill),648);assert.equal(d.interval,2.3);assert.ok(Math.abs(E.interval(d,b.config,skill.cooldown)-1.8)<1e-9);assert.ok(skill.ignoreTaunt);assert.equal(d.maxSoldiers,7200);assert.equal(d.war,108);assert.ok(!(skill.effects||[]).some(e=>e.id==='lifeLoss'));assert.ok(!b.passives['dongzhuo-pursuit'].description.includes('生命流失'));
 for(const threshold of [.5,1.01])assert.ok(['victory','defeat'].includes(fight(rescueTeam(threshold),[enemy],'wound-test').status));
 for(let seed=0;seed<12;seed++){const battle=fight(rescueTeam(),[enemy],'boss-seed-'+seed);assert.equal(battle.status,'victory');assert.ok(battle.time<240);assert.ok(battle.events.filter(e=>e.type==='action').flatMap(e=>e.results).filter(r=>r.wounded).length>20);assert.equal(battle.units.some(u=>u.side==='ally'&&u.dead),false);}
});
test('同级伏兵仍有击倒压力，针对编成换装能明显减少伤亡和战斗时长',()=>{
 const initial=['zhaoyun','zhenji','zhangliang','zhangbao'].map(id=>general(id,15)),unprepared=fight(initial,Catalog.roster(15,4,'ambush'),'balance');assert.ok(unprepared.units.some(u=>u.side==='ally'&&u.stats.received>0));
 const tuned=['zhaoyun','zhenji','zhugeliang','huatuo'].map((id,i)=>general(id,15,['spear','needle','fan','gourd'][i]));const battle=fight(tuned,Catalog.roster(15,4,'ambush'),'counter');assert.equal(battle.status,'victory');assert.ok(battle.time<unprepared.time);assert.ok(battle.units.filter(u=>u.side==='ally').every(u=>!u.dead));
 for(const ids of [['guanyu','zhangfei','zhaoyun','zhenji'],['zhaoyun','zhangbao','zhenji','huatuo'],['lvbu','ganning','zhangfei','guanyu']])assert.equal(fight(ids.map(id=>general(id,20)),Chapter.enemies('dongzhuo')).status,'defeat');
});
test('替补可直接离队且回原驻地，上阵者顺序、生命与携带装备不改变',()=>{
 const m=new World({name:'主角',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},{introStep:2});for(const id of ['xuchu','dianwei','maliang','huatuo','ganning'])m.recordRecruit(id,H.definitions[id].country,RC.companion(id,1));const before=m.partyGroups().active.map(u=>u.id),reserve=m.partyGroups().reserve[0],weapon=reserve.weapon;m.state.troops[reserve.id]=23;assert.ok(m.dismiss(reserve.id));assert.deepEqual(m.partyGroups().active.map(u=>u.id),before);assert.deepEqual(m.state.residents[reserve.id].weapon,weapon);assert.equal(m.state.residents[reserve.id].startSoldiers,23);m.arrive(reserve.homeNode);assert.ok(m.inviteResident(reserve.id));assert.ok(m.partyGroups().reserve.some(u=>u.id===reserve.id));
});
test('机关提示分帧搜索，不阻塞主循环，旧搜索结果不能覆盖新选择',async()=>{const P=require('../js/minigames.js'),state=P.fresh();let frames=0;const first=await P.hintAsync(state,{yieldFrame:async()=>{frames++;}});assert.ok(first);assert.ok(frames>0);assert.equal(P.valid(state,first.id,first.dx,first.dy),true);assert.equal(await P.hintAsync(state,{cancelled:()=>true}),null);});

test('机关动画帧复用同一局状态，持续呼吸刷新后点击仍移动当前棋盘',()=>{const P=require('../js/minigames.js'),state={puzzle:P.fresh()},v={w:390,h:844,panel:{type:'slidingPuzzle',questId:'dianwei'},model:{state:{heroQuests:{dianwei:state}}},hits:[],frame(){this.hits=[];return{x:10,y:100,w:370,h:500};},text(){},box(){},button(label,x,y,w,h,action,opts={}){if(!opts.disabled)this.hits.push({label,action});},save(){},invalidate(){}};P.draw(v);const game=state.puzzle,step=P.hint(game);v.panel.selected=step.id;P.draw(v);const action=v.hits.find(h=>h.label===({'0,1':'↓','0,-1':'↑','1,0':'→','-1,0':'←'})[step.dx+','+step.dy]).action;P.draw(v);assert.equal(state.puzzle,game);action();assert.equal(state.puzzle.moves,1);assert.equal(state.puzzle,game);});
