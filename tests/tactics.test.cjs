const test=require('node:test'),assert=require('node:assert/strict');
const {Battle}=require('../js/engine.js'),D=require('../js/data.js');
const {idlePose}=require('../js/presentation.js');
const {CanvasBattle}=require('../js/canvas-battle.js');
const make=()=>new Battle(D.createChibi({random:false,hit:false}));
function ready(b,id){const u=b.unit(id);u.ready=true;u.progress=1;return u;}

test('群攻达到设置人数时优先于单体，不足人数才使用单体',()=>{
  const b=make(),u=b.unit('zhouyu');b.setPriorities(u.id,[{skill:'strike',when:'always',threshold:0},{skill:'huoshen',when:'enemyCount',threshold:3}]);
  assert.equal(b.autoCommand(u).skill,'huoshen');b.unit('caocao').soldiers=0;b.unit('zhangliao').soldiers=0;b.unit('xuhuang').soldiers=0;
  assert.equal(b.autoCommand(u).skill,'strike');
});
test('两个始终施放的单体伤害技能轮流释放',()=>{
  const b=make(),u=b.unit('zhouyu');b.setPriorities(u.id,[{skill:'strike',when:'always',threshold:0},{skill:'dare',when:'always',threshold:0}]);b.start();
  for(const expected of ['strike','dare','strike']){ready(b,u.id);const cmd=b.autoCommand(u);assert.equal(cmd.skill,expected);b.unit(cmd.target).soldiers=1e6;assert.equal(b.act(u.id,cmd.skill,cmd.target,cmd.scope).ok,true);}
});
test('治疗分别判断自身和队友阈值，队友选最低兵力比例；满兵自身不遮蔽队友治疗',()=>{
  const b=make(),u=b.unit('lusu'),a=b.unit('ganning'),c=b.unit('zhouyu');a.soldiers=Math.floor(a.maxSoldiers*.2);c.soldiers=Math.floor(c.maxSoldiers*.3);
  b.setPriorities(u.id,[{skill:'yinxian',when:'healThresholds',selfThreshold:.5,allyThreshold:.8}]);assert.equal(b.autoCommand(u).target,a.id);
  u.soldiers=Math.floor(u.maxSoldiers*.4);assert.equal(b.autoCommand(u).target,u.id);
  u.soldiers=u.maxSoldiers;b.setPriorities(u.id,[{skill:'yinxian',when:'healThresholds',selfThreshold:1.01,allyThreshold:1.01}]);assert.equal(b.autoCommand(u).target,a.id);
});
test('输出目标的四个设置实际影响施法目标',()=>{
  const b=make(),u=b.unit('ganning'),foes=b.living('enemy');b.setPriorities(u.id,[{skill:'strike',when:'always',threshold:0}]);
  foes.forEach((t,i)=>{t.soldiers=1000+i*100;t.maxSoldiers=6000-i*100;});
  for(const [targetRule,index]of[['lowestCurrent',0],['highestCurrent',4],['highestMax',0]]){b.setTactics(u.id,{rules:u.priorities,targetRule});assert.equal(b.autoCommand(u).target,foes[index].id);}
  b.rng=()=>.99;b.setTactics(u.id,{rules:u.priorities,targetRule:'random'});assert.equal(b.autoCommand(u).target,foes[4].id);
});
test('自动嘲讽在状态存在时不重复施放，到期后重新补充',()=>{
  const b=new Battle(D.createEffectsPreview()),u=b.unit('huanggai');b.setTactics(u.id,{rules:[{skill:'fx_taunt',when:'always',threshold:0}],targetRule:'lowestCurrent'});b.start();ready(b,u.id);assert.equal(b.autoCommand(u).skill,'fx_taunt');b.act(u.id,'fx_taunt',u.id);assert.equal(b.autoCommand(u),null);b.advance(11);assert.equal(b.autoCommand(u).skill,'fx_taunt');
});
test('自动头像有轻微待机变化，手动与溃退头像保持静止待机',()=>{
  const auto={mode:'auto',soldiers:100,order:1};assert.notDeepEqual(idlePose(auto,0),idlePose(auto,1000));
  const still={x:0,y:0,angle:0,scale:1};assert.deepEqual(idlePose({...auto,mode:'manual'},1000),still);assert.deepEqual(idlePose({...auto,soldiers:0},1000),still);
});
test('长按设置使用草稿，保存前不改施法规则和手动状态，保存后生效',()=>{
  const b=make(),u=b.unit('zhouyu'),view={battle:b,panel:null,aim:null};b.start();const before=JSON.stringify(u.priorities),mode=u.mode;
  CanvasBattle.prototype.openTactics.call(view,u);assert.equal(view.panel.type,'tactics');view.panel.rules.forEach(r=>r.disabled=true);assert.equal(JSON.stringify(u.priorities),before);assert.equal(u.mode,mode);
  b.setTactics(u.id,{rules:view.panel.rules,targetRule:'highestCurrent'});assert.equal(b.autoCommand(u),null);assert.equal(u.targetRule,'highestCurrent');assert.equal(b.status,'running');
});
