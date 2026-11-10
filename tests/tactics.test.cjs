const test=require('node:test'),assert=require('node:assert/strict');
const {Battle}=require('../js/engine.js'),D=require('../js/data.js');
const {idlePose}=require('../js/presentation.js');
const {CanvasBattle}=require('../js/canvas-battle.js');
const make=()=>new Battle(D.createChibi({random:false,hit:false}));
function ready(b,id){const u=b.unit(id);u.ready=true;u.progress=1;return u;}

test('没有始终技能时，群攻达到设置人数优先于偶尔单体',()=>{
  const b=make(),u=b.unit('zhouyu');b.setPriorities(u.id,[{skill:'strike',when:'always',frequency:'sometimes'},{skill:'huoshen',when:'enemyCount',threshold:3}]);
  assert.equal(b.autoCommand(u).skill,'huoshen');b.unit('caocao').soldiers=0;b.unit('zhangliao').soldiers=0;b.unit('xuhuang').soldiers=0;
  assert.equal(b.autoCommand(u).skill,'strike');
});
test('多个始终技能只释放界面最上面的技能，不轮流、不受规则数组顺序影响',()=>{
  const b=make(),u=b.unit('zhouyu');b.setPriorities(u.id,[{skill:'strike',when:'always',threshold:0},{skill:'dare',when:'always',threshold:0}]);b.start();
  for(let i=0;i<3;i++){ready(b,u.id);const cmd=b.autoCommand(u);assert.equal(cmd.skill,'dare');b.unit(cmd.target).soldiers=1e6;assert.equal(b.act(u.id,cmd.skill,cmd.target,cmd.scope).ok,true);}
  u.skills=['strike','dare','huoshen'];assert.equal(b.autoCommand(u).skill,'strike');
});
test('始终输出优先于满足人数的群攻、条件治疗和偶尔技能',()=>{
  const b=make(),u=b.unit('zhouyu');b.setPriorities(u.id,[{skill:'huoshen',when:'enemyCount',threshold:2},{skill:'strike',when:'always',frequency:'sometimes'},{skill:'dare',when:'always'}]);assert.equal(b.autoCommand(u).skill,'dare');
  const healer=b.unit('lusu');healer.soldiers=Math.floor(healer.maxSoldiers*.1);b.setPriorities(healer.id,[{skill:'yinxian',when:'healThresholds',selfThreshold:.8,allyThreshold:.8},{skill:'strike',when:'always'}]);assert.equal(b.autoCommand(healer).skill,'strike');
});
test('治疗只在实际匹配始终阈值时取得始终优先级，满兵不能占用出手',()=>{
  const b=make(),u=b.unit('lusu'),ally=b.unit('ganning');ally.soldiers=Math.floor(ally.maxSoldiers*.2);
  const rules=[{skill:'yinxian',when:'healThresholds',selfThreshold:1.01,allyThreshold:.8},{skill:'strike',when:'always'}];b.setPriorities(u.id,rules);assert.equal(b.autoCommand(u).skill,'strike');
  u.soldiers--;assert.equal(b.autoCommand(u).skill,'yinxian');u.soldiers=u.maxSoldiers;rules[0].allyThreshold=1.01;b.setPriorities(u.id,rules);assert.equal(b.autoCommand(u).skill,'yinxian');ally.soldiers=ally.maxSoldiers;assert.equal(b.autoCommand(u).skill,'strike');
});
test('状态缺失时优先维护，存在时让位给始终输出；减益只选择缺失状态的敌人',()=>{
  const b=new Battle(D.createEffectsPreview()),u=b.unit('huanggai');u.skills.push('strike');b.setPriorities(u.id,[{skill:'strike',when:'always'},{skill:'fx_taunt',when:'always'}]);b.start();ready(b,u.id);assert.equal(b.autoCommand(u).skill,'fx_taunt');b.act(u.id,'fx_taunt',u.id);assert.equal(b.autoCommand(u).skill,'strike');b.advance(11);assert.equal(b.autoCommand(u).skill,'fx_taunt');
  const caster=b.unit('zhugeliang'),skill=b.skills.fx_weaken,foes=b.living('enemy');b.setPriorities(caster.id,[{skill:'fx_weaken',when:'always'}]);const first=b.autoCommand(caster);b.addStatus(caster,b.unit(first.target),{...skill.buff,id:skill.buff.id||skill.id},skill);const next=b.autoCommand(caster);assert.notEqual(next.target,first.target);for(const target of foes)b.addStatus(caster,target,{...skill.buff,id:skill.buff.id||skill.id},skill);assert.equal(b.autoCommand(caster),null);
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

test('施法设置的属性入口在关闭左侧，观察返回保留草稿，关闭设置才保存',()=>{
 const b=make(),u=b.unit('zhouyu'),texts=[],v=Object.assign(Object.create(CanvasBattle.prototype),{battle:b,w:540,h:960,hits:[],ctx:{save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){}},button(label,x,y,w,h,action){this.hits.push({label,x,y,w,h,action});},text(t){texts.push(String(t));},box(){},slider(){},drawSkillIcon(){},skillRole(){return '';}});global.BattleVFX=require('../js/canvas-effects.js');
 v.openTactics(u);const draft=v.panel;draft.rules[0].disabled=true;draft.scroll=17;const before=JSON.stringify(u.priorities);v.drawTactics();const scroll=draft.scroll,button=v.hits.find(h=>h.label==='属性'),close=v.hits.find(h=>h.label==='×');assert.ok(button);assert.ok(button.x+button.w<close.x);assert.equal(button.y,close.y+1);button.action();assert.equal(v.panel.type,'inspect');assert.equal(v.panel.previous,draft);v.closePanel();assert.equal(v.panel,draft);assert.equal(v.panel.scroll,scroll);assert.equal(JSON.stringify(u.priorities),before);v.closePanel();assert.equal(v.panel,null);assert.equal(u.priorities[0].disabled,true);
});

test('敌方单体物理和计策默认随机选存活目标，不集火最低兵力；己方默认不变',()=>{
  const b=make(),u=b.unit('zhangliao'),allies=b.living('ally');assert.ok(b.living('enemy').every(e=>e.targetRule==='random'));assert.ok(allies.every(a=>a.targetRule==='lowestCurrent'));
  allies.forEach((a,i)=>a.soldiers=100+i*100);
  for(const skill of ['strike','dare']){if(!u.skills.includes(skill))u.skills.push(skill);b.setPriorities(u.id,[{skill,when:'always'}]);for(let i=0;i<allies.length;i++){b.rng=()=>(i+.5)/allies.length;assert.equal(b.autoCommand(u).target,allies[i].id);}}
  allies[0].soldiers=0;b.rng=()=>0;assert.equal(b.autoCommand(u).target,allies[1].id);b.rng=()=>.99;assert.equal(b.autoCommand(u).target,allies.at(-1).id);
});
test('明确配置的特殊敌人保留指定目标规则，序章官兵全部采用通用随机默认',()=>{
  const b=new Battle(D.createChibi({rosterOverrides:{zhangliao:{targetRule:'highestCurrent'}}})),u=b.unit('zhangliao'),allies=b.living('ally');allies.forEach((a,i)=>a.soldiers=100+i*100);b.setPriorities(u.id,[{skill:'strike',when:'always'}]);b.rng=()=>0;assert.equal(u.targetRule,'highestCurrent');assert.equal(b.autoCommand(u).target,allies.at(-1).id);
  const P=require('../js/prologue.js');for(const stage of ['first-fight','manual-fight','squad-fight']){const battle=new Battle(P.createBattle(stage,{name:'无名氏',attributes:{}}));assert.ok(battle.living('enemy').every(e=>e.targetRule==='random'));}
});
