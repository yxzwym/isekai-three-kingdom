const test=require('node:test'),assert=require('node:assert/strict'),{World}=require('../js/world.js'),G=require('../js/character-growth.js'),E=require('../js/engine.js'),W=require('../js/weapon-skills.js'),R=require('../js/game-rules.js');
const create=()=>new World({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},{nodeId:'changshan',inside:true,introStep:2,weaponType:'sword',weaponCatalogVersion:1});
const win=(w,phase)=>{assert.ok(w.beginStoryBattle(phase));const b=new E.Battle(w.battleScenario());b.start();b.advance(180);assert.equal(b.status,'victory',phase);w.resolveBattle(b.export());w.state.pendingReward=null;w.state.afterBattle=null;if(phase==='grain')w.rest();return b;};
const freed=w=>{w.startChangshan();w.arrive('zhongshan');w.enter();win(w,'grain');win(w,'grain');assert.equal(w.state.quests.changshan.stage,'escort');assert.ok(!w.members().some(u=>u.id==='zhenji'));};
const join=w=>{freed(w);assert.ok(w.finishZhenStay(true));return w.members().find(u=>u.id==='zhenji');};
const escort=w=>{w.arrive('changshan');w.enter();w.rest();const b=win(w,'escort');assert.ok(w.advanceChangshan());return b;};

test('甄姬在粮仓救出后由玩家邀请，与主角同级、金针单奶，正式招募才计入魏国',()=>{
 const w=create(),u=join(w);assert.equal(u.level,w.character.level);assert.ok(G.isGeneral(u));assert.deepEqual(u.skills,W.forWeapon({type:'needle'}));assert.equal(W.skills[u.skills[1]].kind,'heal');assert.equal(W.skills[u.skills[1]].scope,'single');assert.equal(w.counts().wei,1);assert.equal(u.guest,undefined);assert.ok(w.state.activeIds.includes('zhaoyun'));assert.ok(w.state.activeIds.includes('zhenji'));assert.equal(w.recruitZhenJi(),false);assert.deepEqual(new World(w.character,w.snapshot()).counts(),w.counts());
});

test('赵云线完成后甄姬长期同行，离队去许昌，重邀保留成长生命且不重复计数',()=>{
 const w=create();join(w);escort(w);assert.ok(w.finishChangshan(false));assert.equal(w.counts().shu,1);assert.equal(w.counts().wei,1);const u=w.members().find(u=>u.id==='zhenji');w.state.troops.zhenji=11;assert.ok(w.dismiss('zhenji'));assert.equal(w.state.residents.zhenji.homeNode,'xuchang');const loaded=new World(w.character,w.snapshot());loaded.arrive('xuchang');loaded.enter();assert.ok(loaded.sceneNpcs().some(n=>n.id==='zhenji'&&n.role==='companion'));assert.ok(loaded.inviteResident('zhenji'));assert.equal(loaded.members().find(u=>u.id==='zhenji').startSoldiers,11);assert.equal(loaded.members().find(u=>u.id==='zhenji').experience,u.experience);assert.equal(loaded.counts().wei,1);
});

test('旧任务进度不强行补招募，旧获救记录改在许昌可邀请，旧救人关改在中山',()=>{
 for(const stage of ['rescue','return','decision','complete']){const w=create(),saved=w.snapshot();saved.quests.changshan={stage,grainWins:2};const loaded=new World(w.character,saved);assert.equal(loaded.counts().wei,0);assert.ok(!loaded.members().some(u=>u.id==='zhenji'));loaded.arrive(stage==='rescue'?'zhongshan':'xuchang');loaded.enter();assert.ok(loaded.sceneNpcs().some(n=>n.id==='zhenji'));if(stage==='rescue'){assert.equal(loaded.state.quests.changshan.stage,'escort');assert.ok(loaded.finishZhenStay(true));}else assert.ok(loaded.recruitZhenJi());assert.equal(loaded.counts().wei,1);assert.equal(loaded.members().find(u=>u.id==='zhenji').guest,undefined);}
});

test('六人队伍邀请甄姬保证主角赵云甄姬出战，旧同伴只进备战且最多四人',()=>{
 const w=create();for(let i=0;i<3;i++)w.recordRecruit('friend-'+i,'wu',{...G.create('zhangliang',2),id:'friend-'+i,name:'同伴'});join(w);assert.equal(w.state.activeIds.length,4);for(const id of ['hero','zhaoyun','zhenji'])assert.ok(w.state.activeIds.includes(id));assert.equal(w.members().length,6);
});

test('战后保存重伤阵亡区别，读档不回满，休整后才清除状态',()=>{
 const w=create();join(w);w.arrive('changshan');w.beginStoryBattle('escort');w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:0,wounded:true},{id:'zhaoyun',side:'ally',soldiers:0,dead:true},{id:'zhenji',side:'ally',soldiers:25}]});const loaded=new World(w.character,w.snapshot());assert.equal(loaded.members()[0].condition,'wounded');assert.equal(loaded.members().find(u=>u.id==='zhaoyun').dead,true);const battle=new E.Battle({allies:loaded.members(),enemies:[{...G.create('thief',1),id:'e'}]});assert.equal(battle.unit('hero').wounded,true);assert.equal(battle.unit('zhaoyun').dead,true);assert.ok(!battle.targetPool(battle.unit('zhenji'),W.skills['needle-heal']).some(u=>u.id==='zhaoyun'));loaded.rest();assert.ok(loaded.members().every(u=>u.startSoldiers===u.maxSoldiers&&!u.dead));
});

test('满队救人不能挤入第九人，选择去许昌后可完成护粮，有空位再邀请',()=>{
 let w=create();w.startChangshan();for(let i=0;i<6;i++)assert.ok(w.recordRecruit('friend-'+i,'wu',{...G.create('zhangliang',2),id:'friend-'+i,name:'旧友',homeNode:'camp'}));w.arrive('zhongshan');win(w,'grain');win(w,'grain');assert.equal(w.members().length,8);assert.equal(w.counts().wei,0);assert.equal(w.state.quests.changshan.healerRescued,true);assert.equal(w.finishZhenStay(true),false);assert.match(w.lastRecruitError,/队伍已满/);assert.ok(w.finishZhenStay(false));w=new World(w.character,w.snapshot());assert.equal(w.state.quests.changshan.stage,'escort');assert.equal(w.state.residents.zhenji.homeNode,'xuchang');escort(w);w.finishChangshan(true);w.arrive('xuchang');assert.ok(w.sceneNpcs().some(n=>n.id==='zhenji'));assert.ok(w.dismiss('friend-0'));assert.ok(w.recruitZhenJi());assert.equal(w.members().length,8);assert.equal(w.counts().wei,1);assert.equal(w.recruitZhenJi(),false);assert.ok(!w.sceneNpcs().some(n=>n.id==='zhenji'));
});

test('首次救人只有同行选项，满队可先整理队伍，腾位后继续入队',()=>{
 require('../js/ui-theme.js');const {CanvasWorld}=require('../js/canvas-world.js'),w=create();w.startChangshan();for(let i=0;i<6;i++)w.recordRecruit('friend-'+i,'wu',{...G.create('zhangliang',2),id:'friend-'+i,name:'旧友',homeNode:'camp'});w.arrive('zhongshan');win(w,'grain');win(w,'grain');const v=Object.assign(Object.create(CanvasWorld.prototype),{model:w,character:w.character,save(){},invalidate(){},notify(text){this.notice=text;}});v.showZhenRescue();while(v.dialogue&&!v.dialogue.choices)v.advanceDialogue();assert.deepEqual(v.dialogue.choices.map(c=>c.label),['与甄姬同行']);const accept=v.dialogue.choices[0].action;accept();assert.match(v.notice,/队伍已满/);assert.equal(v.panel.type,'party');assert.ok(w.dismiss('friend-0'));v.panel=null;accept();assert.ok(w.members().some(u=>u.id==='zhenji'));assert.equal(w.counts().wei,1);assert.equal(w.state.quests.changshan.healerDecision,false);
});

test('旧档按已入队夺粮或救援结算恢复获救，不替玩家招募；新档夺粮不误判获救',()=>{
 for(const evidence of ['joined','grain','reward','complete']){const w=create(),saved=w.snapshot();saved.quests.changshan={stage:evidence==='complete'?'complete':'supplies',healerJoined:evidence==='joined',grainWins:evidence==='grain'?1:0};if(evidence==='reward')saved.afterBattle={kind:'story',phase:'rescue'};const loaded=new World(w.character,saved);assert.equal(loaded.state.quests.changshan.healerRescued,true,evidence);assert.equal(loaded.counts().wei,0);assert.ok(!loaded.members().some(u=>u.id==='zhenji'));}const fresh=create();fresh.state.quests.changshan.grainWins=1;assert.equal(new World(fresh.character,fresh.snapshot()).state.quests.changshan.healerRescued,false);
});
