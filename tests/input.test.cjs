const test=require('node:test'),assert=require('node:assert/strict');
const {Battle}=require('../js/engine.js'),{CanvasBattle}=require('../js/canvas-battle.js');
function view(){
  const unit=(id,side)=>({id,name:id,war:100,intelligence:100,leadership:100,speed:100,technique:100,attack:20,maxSoldiers:1000,skills:side==='ally'?['staff-shock','spear-stun']:[],initialMode:'manual'});
  const b=new Battle({allies:[unit('a','ally')],enemies:[unit('e','enemy')],rules:{random:false,critical:false,hit:false}});
  const v=Object.assign(Object.create(CanvasBattle.prototype),{battle:b,scenario:{},w:390,h:844,panel:null,aim:null,hits:[],visuals:new Map(),health:new Map(),canvas:{setPointerCapture(){}},ctx:{save(){},restore(){},fillRect(){},createLinearGradient(){return{addColorStop(){}};}},box(){},text(){},drawStatuses(){},point:e=>e});
  v.updateLayout();return v;
}
function render(v){v.hits=[];const r=v.rectMap.get('e');v.drawUnit(r.unit,r,0);return{x:r.figure.x+r.figure.w/2,y:r.figure.y+r.figure.h/2};}
const event=(p,id=1)=>({...p,button:0,pointerId:id});
function tap(v,p){v.down(event(p));v.up(event(p));}
function armed(v){v.battle.start();v.battle.advance(2.5);v.chooseSkill(v.battle.unit('a'),'staff-shock');return render(v);}

test('战前短按敌人查看属性，交战后连续短按不打开面板',()=>{
  const v=view();tap(v,render(v));assert.equal(v.panel.type,'inspect');v.closePanel();v.battle.start();
  for(let i=0;i<200;i++)tap(v,render(v));assert.equal(v.panel,null);assert.equal(v.battle.actionCount,0);
});
test('战斗中敌人长按满1秒才显示属性，松手不会顺便施法，面板不暂停战斗',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const v=view(),p=armed(v);v.down(event(p));t.mock.timers.tick(999);assert.equal(v.panel,null);
  t.mock.timers.tick(1);assert.equal(v.panel.type,'inspect');v.up(event(p));assert.equal(v.battle.actionCount,0);
  const before=v.battle.time;v.battle.advance(.2);assert.ok(v.battle.time>before);v.closePanel();tap(v,render(v));assert.equal(v.battle.actionCount,1);
});
test('狂点已选技能保持选中，狂点目标只消耗一次就绪，不误开敌人面板',()=>{
  const v=view(),p=armed(v),a=v.battle.unit('a'),intent=v.aim;
  for(let i=0;i<100;i++)v.chooseSkill(a,'staff-shock');assert.equal(v.aim,intent);
  for(let i=0;i<200;i++)tap(v,render(v));assert.equal(v.battle.actionCount,1);assert.equal(a.ready,false);assert.equal(v.panel,null);
});
test('按下后改选技能，旧的目标点击不会转交给新技能',()=>{
  const v=view(),p=armed(v);v.down(event(p));v.chooseSkill(v.battle.unit('a'),'spear-stun');const next=v.aim;v.up(event(p));
  assert.equal(v.battle.actionCount,0);assert.equal(v.aim,next);assert.equal(v.aim.skill,'spear-stun');
});
test('选技能后立刻点目标，即使尚未重新绘制也能响应当次点击',()=>{
  const v=view();v.battle.start();v.battle.advance(2.5);const p=render(v);v.chooseSkill(v.battle.unit('a'),'staff-shock');tap(v,p);assert.equal(v.battle.actionCount,1);assert.equal(v.panel,null);
});
test('滑出目标、拖动和非当前触点松手均不造成误操作',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const v=view(),p=armed(v);v.down(event(p));v.move(event({x:p.x+20,y:p.y}));t.mock.timers.tick(1000);v.up(event({x:p.x+20,y:p.y}));assert.equal(v.panel,null);assert.equal(v.battle.actionCount,0);
  v.down(event(p));v.up(event(p,2));assert.ok(v.press);assert.equal(v.battle.actionCount,0);v.up(event(p));assert.equal(v.battle.actionCount,1);
});
test('按下后弹出面板，旧的松手事件不能穿透面板攻击',()=>{
  const v=view(),p=armed(v);v.down(event(p));v.openInspect(v.battle.unit('e'));v.up(event(p));assert.equal(v.panel.type,'inspect');assert.equal(v.battle.actionCount,0);
});
