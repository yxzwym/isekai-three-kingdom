const test=require('node:test'),assert=require('node:assert/strict');
const {Battle,physical}=require('../js/engine.js'),W=require('../js/weapon-skills.js'),S=require('../js/statuses.js'),{layout,CanvasBattle}=require('../js/canvas-battle.js');
const unit=(id,more={})=>({id,name:id,war:100,intelligence:100,speed:100,technique:100,leadership:100,maxSoldiers:1000,attack:100,armor:60,resistance:0,skills:['sword-cut','sword-sweep','staff-shock','shield-taunt'],priorities:[],initialMode:'manual',...more});
const battle=()=>new Battle({allies:[unit('a'),unit('b')],enemies:[unit('x'),unit('y'),unit('z')],rules:{hit:false,critical:false,random:false}});
const ready=u=>{u.progress=1;u.ready=true;};

test('任何角色的始终嘲讽都正常读条、持续30秒、到期补放，未预设开局状态',()=>{
  const b=battle(),u=b.unit('x');b.setPriorities(u.id,[{skill:'shield-taunt',when:'always'},{skill:'sword-cut',when:'always'}]);u.mode='auto';b.start();b.advance(2);assert.equal(u.statuses.length,0);b.advance(.6);assert.ok(u.statuses.some(s=>s.taunt));const first=b.events.find(e=>e.skill==='shield-taunt');assert.ok(first.time>=2.5);b.advance(30);assert.equal(b.events.filter(e=>e.skill==='shield-taunt').length,1);b.advance(6);assert.ok(b.events.filter(e=>e.skill==='shield-taunt').length>=2);
});
test('物理和计策单体只能选择嘲讽者，群体不受影响，敌人随机选择多个嘲讽者',()=>{
  const b=battle();b.start();const a=b.unit('a'),x=b.unit('x'),y=b.unit('y'),z=b.unit('z');b.addStatus(x,x,{id:'taunt'});b.addStatus(y,y,{id:'taunt'});
  for(const id of ['sword-cut','staff-shock']){assert.deepEqual(b.targetPool(a,b.skills[id]).map(u=>u.id),['x','y']);assert.equal(b.validate(a,id,z.id).ok,false);assert.equal(b.validate(a,id,y.id).ok,true);}
  assert.equal(b.validate(a,'sword-sweep',z.id,'all').targets.length,3);
  const c=b.unit('b');b.addStatus(a,a,{id:'taunt'});b.addStatus(c,c,{id:'taunt'});b.setPriorities(x.id,[{skill:'sword-cut',when:'always'}]);b.rng=()=>0;assert.equal(b.autoCommand(x).target,a.id);b.rng=()=>.99;assert.equal(b.autoCommand(x).target,c.id);
});
test('通用破甲按技巧结算、实际增加物理伤害并在8秒后恢复；免疫阻止附加',()=>{
  const b=battle();b.start();const a=b.unit('a'),x=b.unit('x'),base=physical({attacker:{...a,soldiers:a.soldiers},target:x}).amount;b.rng=()=>0;
  b.addStatus(a,x,W.effects.armorDown,b.skills['spear-break']);assert.equal(b.effective(x).armor,32);assert.ok(physical({attacker:a,target:b.effective(x)}).amount>base);b.advance(8.02);assert.equal(b.effective(x).armor,60);
  x.statusImmunities=['armorDown'];assert.equal(b.addStatus(a,x,W.effects.armorDown),null);
});
test('流血、中毒、灼烧逐秒跳伤，包含到期最后一跳，不消耗施法进度',()=>{
  for(const id of ['bleed','poison','burn']){const b=battle();b.start();const a=b.unit('a'),x=b.unit('x');b.addStatus(a,x,{id,amount:7,duration:3});b.advance(.98);assert.equal(x.soldiers,1000);b.advance(.02);assert.equal(x.soldiers,993);b.advance(2.02);assert.equal(x.soldiers,979);assert.equal(x.statuses.length,0);assert.equal(a.stats.actions,0);assert.equal(a.stats.damage,21);assert.equal(b.events.filter(e=>e.periodic).length,3);}
});
test('刷新持续伤害更新计时，默认不叠加；显式层数可叠加，死亡结算正常',()=>{
  const b=battle();b.start();const a=b.unit('a'),x=b.unit('x');b.addStatus(a,x,{id:'poison',amount:10,duration:3},{id:'poison-skill'});b.advance(.5);b.addStatus(a,x,{id:'poison',amount:10,duration:3},{id:'poison-skill'});b.advance(.5);assert.equal(x.soldiers,1000);b.advance(.5);assert.equal(x.soldiers,990);assert.equal(x.statuses.length,1);
  b.addStatus(a,x,{id:'poison',amount:10,duration:3,maxStacks:2},{id:'poison-skill'});assert.equal(x.statuses[0].stacks,2);x.soldiers=5;b.advance(1);assert.equal(x.soldiers,0);assert.equal(x.statuses.length,0);assert.equal(a.stats.kills,1);
});
test('眩晕暂停原读条和施法，到期续读；麻痹降低速度但仍读条和行动',()=>{
  const b=battle();b.start();const a=b.unit('a'),x=b.unit('x');b.advance(.5);const progress=x.progress;b.addStatus(a,x,{id:'stun',duration:2});b.advance(1);assert.equal(x.progress,progress);ready(x);assert.equal(b.manual(x.id,'sword-cut',a.id).ok,false);x.progress=progress;x.ready=false;b.advance(1.1);assert.ok(x.progress>progress);
  const before=x.progress;b.addStatus(a,x,{id:'paralysis',duration:2});assert.equal(b.effective(x).speed,50);b.advance(.5);assert.ok(x.progress>=before);assert.equal(b.stunned(x),false);b.advance(2);assert.equal(b.effective(x).speed,100);
});
test('技能恢复由共用技能定义决定，群攻长于单体，枪有实际破甲及眩晕效果',()=>{
  const b=battle(),u=b.unit('a');b.start();ready(u);b.manual(u.id,'sword-cut','x');const single=u.interval;ready(u);b.manual(u.id,'sword-sweep');assert.ok(u.interval>single);assert.equal(u.lastManualSkill,'sword-sweep');assert.ok(W.skills['spear-break'].effects.some(e=>e.id==='armorDown'));assert.ok(W.skills['spear-stun'].effects.some(e=>e.id==='stun'));assert.equal(W.skills['shield-taunt'].buff.duration,30);assert.equal(W.skills['shield-taunt'].cooldown,1);
});
test('技能配置关闭即保存，教学战点头像不能打开配置；状态都有图标元数据',()=>{
  const b=battle();b.start();const view={battle:b,panel:null};CanvasBattle.prototype.openTactics.call(view,b.unit('a'));view.panel.rules[0].disabled=true;CanvasBattle.prototype.commitTactics.call(view);assert.equal(view.panel,null);assert.equal(b.unit('a').priorities[0].disabled,true);
  b.scenario.control.lockTactics=true;let notice='';view.notify=s=>notice=s;CanvasBattle.prototype.openTactics.call(view,b.unit('a'));assert.equal(view.panel,null);assert.equal(notice,'本场无法配置技能');for(const id of ['taunt','armorDown','bleed','poison','burn','stun','paralysis']){assert.ok(S.definitions[id].icon);assert.ok(S.definitions[id].color);}
});
test('阵型由场景配置决定，前排队长在四个后排前方，缺省仍横排',()=>{
  const rects=layout(390,844,3,5,{back:[1,2,3,4],front:[0]}).filter(r=>r.side==='enemy'),front=rects.find(r=>r.index===0);assert.ok(rects.filter(r=>r.index!==0).every(r=>r.y<front.y));assert.ok(Math.abs(front.x+front.w/2-195)<.01);assert.equal(new Set(layout(390,844,3,5).filter(r=>r.side==='enemy').map(r=>r.y)).size,1);
});
test('状态提示实时显示剩余时间，时间推进和刷新状态后都会更新',()=>{
  const b=battle(),source=b.unit('a'),target=b.unit('x'),texts=[],view={battle:b,w:390,h:844,box(){},text:value=>texts.push(value)};b.start();
  const status=b.addStatus(source,target,{id:'taunt',duration:30});CanvasBattle.prototype.notifyStatus.call(view,target,status);
  const draw=()=>{texts.length=0;CanvasBattle.prototype.drawNotice.call(view,performance.now());return [...texts];};
  assert.deepEqual(draw(),['嘲讽','剩余30秒']);b.advance(7.25);assert.deepEqual(draw(),['嘲讽','剩余23秒']);
  b.addStatus(source,target,{id:'taunt',duration:30});assert.deepEqual(draw(),['嘲讽','剩余30秒']);b.advance(31);assert.deepEqual(draw(),['嘲讽','剩余0秒']);
});
