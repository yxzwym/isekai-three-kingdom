const test=require('node:test'),assert=require('node:assert/strict');
const {Battle,normalizeRule}=require('../js/engine.js'),D=require('../js/data.js');
const {sliderValue}=require('../js/presentation.js');
const {BattleEffects}=require('../js/canvas-effects.js');
const {CanvasBattle}=require('../js/canvas-battle.js');

test('输出技能移除血量条件：单体只开关，群体只检查人数',()=>{
  assert.deepEqual(normalizeRule({skill:'strike',when:'selfBelow',threshold:.2},D.SKILLS.strike),{skill:'strike',disabled:false,when:'always',threshold:0});
  const b=new Battle(D.createChibi());b.setPriorities('zhouyu',[{skill:'strike',when:'selfBelow',threshold:.01}]);assert.equal(b.autoCommand(b.unit('zhouyu')).skill,'strike');
  b.setPriorities('zhouyu',[{skill:'huoshen',when:'selfBelow',threshold:.01}]);assert.equal(b.autoCommand(b.unit('zhouyu')).skill,'huoshen');
  for(const u of b.units)for(const r of u.priorities)if(['physical','tactic'].includes(b.skills[r.skill].kind))assert.ok(['always','enemyCount'].includes(r.when));
});
test('滑条点击、连续拖动、两端越界都吸附到合法档位',()=>{
  assert.equal(sliderValue(10,10,300,101),0);assert.equal(sliderValue(310,10,300,101),101);assert.equal(sliderValue(160,10,300,4),2);
  assert.equal(sliderValue(-999,10,300,5),0);assert.equal(sliderValue(999,10,300,5),5);
  const values=Array.from({length:301},(_,i)=>sliderValue(10+i,10,300,101));assert.ok(values.every((v,i)=>i===0||v>=values[i-1]));assert.equal(new Set(values).size,102);
});
test('设置面板按1%保存治疗和嘲讽阈值，保留从不与始终两端',()=>{
  for(const id of ['lusu','huanggai']){
    const b=new Battle(D.createEffectsPreview());b.start();const u=b.unit(id),sliders=[],buttons=[];
    const view={battle:b,h:667,w:375,hits:[],ctx:{save(){},beginPath(){},rect(){},clip(){},restore(){}},
      panelFrame(){return{x:12,y:50,w:351,h:567};},box(){},drawSkillIcon(){},text(){},
      slider(label,x,y,w,value,max,change,format){sliders.push({label,value,max,change,format});},
      button(label,x,y,w,h,action){buttons.push({label,action});}};
    CanvasBattle.prototype.openTactics.call(view,u);CanvasBattle.prototype.drawTactics.call(view);
    const s=sliders.find(s=>s.max===101),rule=view.panel.rules.find(r=>id==='lusu'?b.skills[r.skill].kind==='heal':b.skills[r.skill].buff?.taunt);
    assert.ok(s);assert.equal(s.format(0),'从不施放');assert.equal(s.format(101),'始终');
    for(const percent of [1,37,100,101,0]){s.change(percent);assert.equal(id==='lusu'?rule.selfThreshold:rule.displayThreshold,percent/100);}
    s.change(37);buttons.find(button=>button.label==='确定').action();const saved=u.priorities.find(r=>r.skill===rule.skill);
    assert.equal(id==='lusu'?saved.selfThreshold:saved.threshold,.37);assert.equal(saved.disabled,false);
  }
});
test('十人同时群攻保留全部战斗结果，只合并重复视觉叠层',()=>{
  const b=new Battle(D.createStress());b.start();b.advance(2.5);const events=b.events.filter(e=>e.type==='action');assert.equal(events.length,10);assert.equal(events.reduce((n,e)=>n+e.results.length,0),50);
  const fx=new BattleEffects();for(const e of events)fx.action(e,b.skills[e.skill],1000);
  assert.equal(fx.items.length,20);assert.equal(fx.hits.length,10);assert.equal(fx.motions.length,20);assert.equal(new Set(fx.items.map(e=>e.id+':'+e.kind)).size,20);
  fx.beginFrame(2000);assert.equal(fx.items.length,0);assert.equal(fx.hits.length,0);assert.equal(fx.motions.length,0);
  assert.equal(b.actionCount,10);
});
test('满条无可用技能不会每个逻辑步重复排序，设置改变后立即重新判定',()=>{
  const s=D.createChibi();s.allies=s.allies.map(u=>({...u,initialMode:'manual'}));s.enemies=s.enemies.map(u=>({...u,initialMode:'manual'}));s.allies[0].initialMode='auto';
  const b=new Battle(s),u=b.units[0];b.setPriorities(u.id,[{skill:'huoshen',when:'enemyCount',threshold:10}]);let checks=0;const original=b.autoCommand.bind(b);b.autoCommand=unit=>{checks++;return original(unit);};
  b.start();b.advance(10);assert.equal(checks,1);b.advance(10);assert.equal(checks,1);assert.equal(u.ready,true);
  b.setPriorities(u.id,[{skill:'huoshen',when:'enemyCount',threshold:1}]);b.advance(.02);assert.equal(u.stats.actions,1);assert.equal(checks,2);
});
