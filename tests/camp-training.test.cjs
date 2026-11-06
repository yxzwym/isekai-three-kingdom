const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/world-data.js'),{World}=require('../js/world.js'),G=require('../js/character-growth.js'),R=require('../js/game-rules.js'),E=require('../js/engine.js'),P=require('../js/prologue.js'),X=require('../js/experience.js'),Q=require('../js/timed-choice.js');
const character=(level=1)=>G.characterAt({name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},level);
const camp=(level=1)=>new World(character(level),{version:3,nodeId:'camp',inside:true,weaponType:'sword',introStep:2});

test('随机事件单选10秒自动执行，多选只自动离开，不因配置优先级而迎战',()=>{
  const single=new Q.Decision(Q.choicesFor({kind:'battle'}),1000);assert.equal(single.remaining(1000),10);assert.equal(single.remaining(1001),10);assert.equal(single.remaining(2000),9);assert.equal(single.tick(10999),null);assert.equal(single.tick(11000).action,'battle');assert.equal(single.tick(12000),null);assert.equal(single.choose('battle'),null);
  const multiple=new Q.Decision([{id:'fight',label:'迎战',action:'battle',default:true},{id:'look',label:'查看',action:'continue'}],0);assert.equal(multiple.defaultId,'leave');assert.equal(multiple.tick(10000).action,'leave');assert.equal(multiple.tick(20000),null);
  const manual=new Q.Decision(Q.choicesFor({kind:'rumor'}),0);assert.ok(manual.choose('continue'));assert.equal(manual.tick(11000),null);
});
test('事件离开解除路遇战，不发经验且继续原路线，迎战才保留待战状态',()=>{
  const w=camp();w.leave();w.planRoute('chengdu');w.beginNextLeg({eventRoll:0});w.journey.event.choices=[{id:'fight',label:'迎战',action:'battle'},{id:'leave',label:'离开',action:'leave'}];w.travelEvent();assert.ok(w.pending);const before=w.character.experience||0;assert.equal(w.chooseRoadEvent('leave').battle,false);assert.equal(w.pending,null);assert.equal(w.character.experience||0,before);assert.equal(w.finishTravel(),true);assert.equal(w.state.routeTarget,'chengdu');
});
test('未开放的城村拒绝进入，常山剧情开放，旧城内存档回到城外，营地三人有明确功能',()=>{
  assert.deepEqual(Object.keys(D.townNpcs),['camp']);assert.deepEqual(D.townNpcs.camp.map(n=>n.role),['advice','heal','training']);assert.equal(D.gateGuard.art,'imperial-soldier');
  const w=camp();for(const p of D.places.filter(p=>!['camp','changshan','zhongshan','zhongshan-county','julu','julu-county'].includes(p.id))){w.arrive(p.id);assert.equal(w.enter(),false,p.name);assert.equal(w.state.inside,false);}
  assert.equal(new World(character(),{version:3,nodeId:'jianye',inside:true}).state.inside,false);w.arrive('camp');assert.ok(w.enter());assert.equal(w.state.inside,true);
});
test('五档训练使用真实成长、通用技能及普通被动，训练敌人跟随主角等级',()=>{
  const w=camp();assert.deepEqual(D.trainingOptions.map(t=>t.id),['militia-one','militia-two','militia-five','zhangliang','three-brothers']);for(const t of D.trainingOptions){assert.ok(w.beginTraining(t.id).ok);const b=new E.Battle(w.battleScenario());assert.equal(b.status,'ready');assert.equal(b.living('enemy').length,t.count||t.rivals.length);assert.ok(b.living('enemy').every(u=>u.targetRule==='random'));for(const u of b.units){assert.deepEqual(u.attributes,G.attributesAt(u.baseAttributes,u.potentials,u.level));assert.equal(u.maxSoldiers,u.constitution*10);}if(t.rivals){assert.ok(b.living('enemy').every(u=>u.level===15));assert.ok(b.living('enemy').every(u=>!u.passives.includes('thunder-lord-tutorial')));}w.resolveBattle({result:'defeat'});}
  assert.equal(P.general('zhangjiao').level,5);assert.equal(P.createBattle('manual-fight',character()).allies[0].passives[0],'thunder-lord-tutorial');
});
test('真实训练战能够结算胜利与成长；失败不发经验并恢复战前生命、进度和配置',()=>{
  const w=camp();for(let i=0;i<20;i++){w.beginTraining('militia-one');const b=new E.Battle(w.battleScenario());b.start();b.advance(90);assert.equal(b.status,'victory');assert.ok(w.resolveBattle({result:b.status,units:b.units}));}assert.equal(w.character.level,2);assert.equal(w.character.experience,0);assert.equal(w.lastReward.gains[0].amount,.5);assert.equal(w.state.trainingWins['militia-one'],20);assert.equal(w.state.inside,true);
  const before=w.snapshot(),xp=w.character.experience,level=w.character.level;w.beginTraining('three-brothers');w.resolveBattle({result:'defeat'});assert.deepEqual(w.snapshot(),before);assert.equal(w.character.level,level);assert.equal(w.character.experience,xp);assert.equal(w.lastReward,null);
});
test('同级队友包括候补与倒下成员均获完整经验；操练结束张宝统一恢复',()=>{
  const w=camp();for(const [id,profile]of [['a','zhangbao'],['b','zhangliang'],['c','zhangjiao'],['bench','zhangbao']])w.recordRecruit(id,'wei',{...P.general(profile,1),id});w.state.troops.bench=0;w.beginTraining('militia-one');w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:50}]});
  assert.equal(w.lastReward.gains.length,5);for(const gain of w.lastReward.gains){assert.deepEqual([gain.before,gain.after],[1,1]);assert.equal(gain.amount,.5);}for(const u of w.members()){assert.equal(u.experience,.5);assert.equal(u.level,1);assert.equal(u.maxSoldiers,u.constitution*10);}assert.equal(w.state.troops.bench,w.members().find(u=>u.id==='bench').maxSoldiers);assert.equal(w.character.level,1);assert.equal(w.state.activeIds.length,4);w.rest();assert.ok(w.members().every(u=>u.startSoldiers===u.maxSoldiers));
});
test('首次击败三兄弟解锁张梁，邀请才入队，不重复也不占魏蜀吴的名额',()=>{
  const w=camp(50);w.character=G.characterAt({...w.character,potentials:{war:100,intelligence:100,constitution:100,speed:100,technique:100}},50);w.rest();assert.equal(w.recruitZhangLiang(),false);w.beginTraining('three-brothers');const b=new E.Battle(w.battleScenario());b.start();b.advance(300);assert.equal(b.status,'victory');w.resolveBattle({result:'victory',units:b.units});assert.equal(w.state.companions.length,0);assert.equal(w.recruitZhangLiang(),true);assert.equal(w.recruitZhangLiang(),false);const z=w.members().find(u=>u.id==='zhangliang');assert.equal(z.level,15);assert.equal(z.experience,0);assert.deepEqual(w.counts(),{wei:0,shu:0,wu:0});assert.ok(w.state.activeIds.includes('zhangliang'));assert.ok(w.beginTraining('three-brothers').ok);assert.ok(!w.battleScenario().allies.some(u=>u.id==='zhangliang'));
});
test('阵容满员时张梁进入候补，入队条件和等级经验存档往返不丢失',()=>{
  const w=camp();for(let i=0;i<3;i++)w.recordRecruit('member-'+i,'wei',{...P.general('zhangbao',1),id:'member-'+i});w.state.trainingWins['three-brothers']=1;assert.ok(w.recruitZhangLiang());assert.equal(w.state.activeIds.length,4);assert.ok(!w.state.activeIds.includes('zhangliang'));w.awardExperience(250);const expected=w.state.companions.find(u=>u.id==='zhangliang'),loaded=new World(w.character,w.snapshot());assert.equal(loaded.state.companions.find(u=>u.id==='zhangliang').experience,expected.experience);assert.equal(loaded.state.companions.find(u=>u.id==='zhangliang').level,expected.level);assert.equal(loaded.recruitZhangLiang(),false);assert.equal(loaded.state.trainingWins['three-brothers'],1);
});
test('胜利经验只结算一次，路途保存恢复到已处理事件之后，不重复战斗或领取',()=>{
  const w=camp();w.leave();w.planRoute('chengdu');w.beginNextLeg({eventRoll:0});w.travelEvent();w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:60}]});const level=w.character.level,xp=w.character.experience;assert.equal(w.resolveBattle({result:'victory'}),false);assert.equal(w.character.level,level);assert.equal(w.character.experience,xp);const loaded=new World(w.character,w.journey.checkpoint);assert.ok(loaded.journey?.checked);assert.equal(loaded.travelEvent(),null);assert.equal(loaded.pending,null);assert.equal(loaded.finishTravel(),true);assert.equal(loaded.state.resolvedLeg,null);assert.equal(loaded.state.routeTarget,'chengdu');assert.equal(loaded.character.experience,xp);
});
test('经验支持一次跨多级，原有基础与潜力不变，损坏经验值不会导致死循环',()=>{
  const c=character(),before=JSON.stringify(c);let next=X.grant(c,90).record;assert.equal(next.level,10);assert.equal(next.experience,0);assert.equal(JSON.stringify(c),before);assert.deepEqual(next.baseAttributes,c.baseAttributes);assert.deepEqual(next.potentials,c.potentials);next=X.grant(next,642).record;assert.equal(next.level,39);assert.equal(next.experience,0);assert.equal(X.grant({...c,experience:Infinity},Infinity).record.level,1);
});
