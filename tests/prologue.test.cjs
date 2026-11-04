const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),P=require('../js/prologue.js'),R=require('../js/game-rules.js');
const character=()=>({name:'无名氏',appearance:'wanderer',difficulty:'normal',...R.rollHero('normal',()=>.4)});
const ready=u=>{u.progress=1;u.ready=true;};

test('序章第一战所有难度均为1兵、无武器、仅拳击，先显示完整读条再被官兵击败',()=>{
  for(const difficulty of R.DIFFICULTIES){const c={...character(),difficulty:difficulty.id,...R.rollHero(difficulty.id)},s=P.createBattle('first-fight',c),b=new E.Battle(s);b.start();b.advance(2);assert.equal(b.status,'running');assert.equal(b.actionCount,0);b.advance(2);assert.equal(b.status,'defeat');assert.equal(b.unit('hero').maxSoldiers,1);assert.equal(b.unit('hero').weapon,null);assert.deepEqual(b.unit('hero').skills,['punch']);assert.equal(b.actionCount,1);assert.equal(b.events.find(e=>e.type==='action').actor,'soldier-1');assert.equal(c.attributes.war>=1,true);}
});
test('手动教学战强制手动，尝试自动产生角色飘字事件，仍继续计时',()=>{
  const b=new E.Battle(P.createBattle('manual-fight',character()));b.start();const u=b.unit('zhangjiao');assert.equal(u.mode,'manual');assert.equal(b.setMode(u.id,'auto'),false);assert.equal(b.events.at(-1).type,'modeblocked');assert.equal(b.events.at(-1).text,'无法自动战斗');b.advance(2.5);assert.ok(b.time>=2);assert.equal(u.stats.actions,0);assert.ok(u.ready);const before=b.unit('soldier-1').soldiers;assert.ok(b.manual(u.id,'staff-shock','soldier-1').ok);const damage=before-b.unit('soldier-1').soldiers;assert.ok(damage>=20&&damage<=30);assert.equal(b.status,'running');assert.deepEqual(u.skills,['staff-shock','staff-storm']);assert.deepEqual(u.passives,['thunder-lord-tutorial']);
});
test('三兄弟对五官兵的普通准备方案能取胜，准备规则与模式不会丢失',()=>{
  const b=new E.Battle(P.createBattle('prepare',character()));assert.equal(b.status,'ready');b.advance(100);assert.equal(b.time,0);assert.equal(b.units.length,8);b.setMode('zhangbao','manual');b.setTactics('zhangjiao',{rules:[{skill:'staff-storm',when:'enemyCount',threshold:3}],targetRule:'highestCurrent'});const config=P.preparationOf(b),restored=new E.Battle(P.createBattle('squad-fight',character(),config));assert.equal(restored.unit('zhangbao').mode,'manual');assert.equal(restored.unit('zhangjiao').priorities[0].threshold,3);assert.equal(restored.unit('zhangjiao').targetRule,'highestCurrent');const auto=new E.Battle(P.createBattle('squad-fight',character()));auto.start();auto.advance(150);assert.equal(auto.status,'victory');assert.ok(auto.living('ally').length===3);assert.ok(auto.events.some(e=>e.skill==='talisman-rain'));const first=auto.events.find(e=>e.actor==='captain'&&e.skill==='blade-cut');assert.ok(first.results[0].actual>=60);assert.ok(auto.events.filter(e=>e.skill==='shield-taunt').length>=2);
});
test('雷公助我增加25个百分点闪避；物理与计策闪避都即时电击攻击者且不耗读条',()=>{
  for(const kind of ['physical','tactic']){
    const s=P.createBattle('manual-fight',character());s.allies[0].passives=['thunder-lord'];const b=new E.Battle(s);b.start();const j=b.unit('zhangjiao'),enemy=b.unit('soldier-1');j.dodge=.1;assert.equal(b.dodgeChance(j,'physical'),.35);assert.equal(b.dodgeChance(j,'tactic'),.25);j.progress=.37;j.ready=false;b.rng=()=>.01;ready(enemy);if(kind==='tactic'){b.skills.test={id:'test',name:'试法',kind:'tactic',base:100,side:'enemy',scope:'single',cost:0};enemy.skills.push('test');}const before=j.soldiers,foe=enemy.soldiers;b.act(enemy.id,kind==='physical'?'spear-cut':'test',j.id);assert.equal(j.soldiers,before);assert.ok(enemy.soldiers<foe);assert.equal(j.progress,.37);assert.equal(j.ready,false);assert.equal(j.stats.actions,0);const events=b.events.filter(e=>e.type==='action');assert.equal(events.length,2);assert.equal(events[0].results[0].miss,'闪避');assert.equal(events[1].passive,'thunder-lord');assert.equal(events[1].skill,'thunder-retaliation');assert.equal(events[1].results[0].target,enemy.id);assert.equal(b.allySp,0);
  }
});
test('被动不占主动栏、可扩展多个专属被动，反应不会互相递归',()=>{
  const s=P.createBattle('manual-fight',character());s.passives={extra:{id:'extra',name:'自定义',stats:{dodgeBonus:.1},triggers:[]}};s.allies[0].passives=['thunder-lord','extra'];s.enemies[0].passives=['thunder-lord'];s.enemies[0].dodge=1;const b=new E.Battle(s);b.start();const j=b.unit('zhangjiao'),e=b.unit('soldier-1');b.rng=()=>0;ready(e);b.act(e.id,'spear-cut',j.id);assert.equal(j.passives.length,2);assert.equal(j.skills.length,2);assert.equal(b.events.filter(e=>e.reaction).length,1);assert.equal(b.validate(j,'thunder-retaliation',e.id).ok,false);assert.equal(b.export().passives.extra.name,'自定义');
});
test('正常受击、治疗与增益不触发电击；被动击杀正常结算',()=>{
  const b=new E.Battle(P.createBattle('manual-fight',character()));b.start();const j=b.unit('zhangjiao'),e=b.unit('soldier-1');ready(e);b.rng=()=>.8;const hp=j.soldiers;b.act(e.id,'spear-cut',j.id);assert.ok(j.soldiers<hp);assert.equal(b.events.filter(e=>e.reaction).length,0);ready(j);b.skills.heal={id:'heal',name:'治疗',kind:'heal',scope:'single',side:'ally',cost:0,base:50};j.skills.push('heal');assert.ok(b.manual(j.id,'heal',j.id).ok);assert.equal(b.events.filter(e=>e.reaction).length,0);ready(e);e.soldiers=1;b.rng=()=>0;b.act(e.id,'spear-cut',j.id);assert.equal(b.status,'victory');assert.equal(j.stats.kills,1);assert.equal(e.soldiers,0);
});
test('进度存档往返保留对话位置、准备设置，旧玉熟练度迁移至琴',()=>{
  const memory={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}},store=new R.SaveStore(memory),c=character();c.weaponProficiencies.jade=199;delete c.weaponProficiencies.qin;store.save(0,c,{stage:'camp',index:6,preparation:{_reviewed:true}});const saved=store.slots()[0];assert.equal(saved.character.weaponProficiencies.qin,199);assert.equal(saved.character.weaponProficiencies.jade,undefined);assert.equal(saved.progress.index,6);assert.equal(saved.progress.preparation._reviewed,true);assert.equal(P.checkpoint({stage:'bad'}).stage,'arrival');assert.equal(P.checkpoint({stage:'camp',index:999}).index,P.chapters.camp.lines.length-1);store.save(0,c,{stage:'complete',index:0});assert.equal(store.slots()[0].chapter,'prologue-complete');
});
test('两个雷公助我同名，只有教程版能濒死回满，正常张角作为敌人可击败',()=>{
  const PDef=require('../js/passives.js').definitions;
  assert.equal(PDef['thunder-lord'].name,PDef['thunder-lord-tutorial'].name);
  assert.equal(PDef['thunder-lord'].triggers.some(t=>t.on==='lethal'),false);
  for(const tutorial of [false,true]){
    const s=P.createBattle('manual-fight',character());s.allies[0].passives=[tutorial?'thunder-lord-tutorial':'thunder-lord'];
    const b=new E.Battle(s);b.start();const j=b.unit('zhangjiao'),e=b.unit('soldier-1');e.attack=100000;b.rng=()=>.99;
    for(let i=0;i<2;i++){ready(e);b.act(e.id,'spear-cut',j.id);if(tutorial){assert.equal(j.soldiers,j.maxSoldiers);assert.equal(b.status,'running');assert.equal(e.stats.kills,0);}else{assert.equal(j.soldiers,0);assert.equal(b.status,'defeat');break;}}
    assert.equal(b.events.filter(e=>e.passive==='thunder-lord-tutorial'&&e.skill==='thunder-renewal').length,tutorial?2:0);
  }
  assert.deepEqual(P.general('zhangjiao').passives,['thunder-lord']);
  const enemy=P.general('zhangjiao'),s={skills:P.createBattle('manual-fight',character()).skills,allies:[{...P.general('zhangliang'),attack:100000}],enemies:[enemy],rules:{random:false,hit:false,critical:false}},b=new E.Battle(s);b.start();b.rng=()=>.99;ready(b.units[0]);b.act(b.units[0].id,'spear-stun',enemy.id);assert.equal(b.status,'victory');
});
test('群攻的自动条件最低两人，偶尔单体进入随机技能池',()=>{
  const s=P.createBattle('manual-fight',character()),b=new E.Battle(s),u=b.unit('zhangjiao');b.setPriorities(u.id,[{skill:'staff-storm',when:'enemyCount',threshold:1},{skill:'staff-shock',when:'always'}]);assert.equal(u.priorities[0].threshold,2);assert.equal(b.autoCommand(u).skill,'staff-shock');
  const p={...s,allies:[{...s.allies[0],skills:['staff-shock','spear-cut'],priorities:[{skill:'staff-shock',when:'always',frequency:'sometimes'},{skill:'spear-cut',when:'always'}]}]},random=new E.Battle(p),j=random.unit('zhangjiao');random.rng=()=>0;assert.equal(random.autoCommand(j).skill,'staff-shock');random.rng=()=>.99;assert.equal(random.autoCommand(j).skill,'spear-cut');assert.equal(j.priorities[0].frequency,'sometimes');
});
