const test=require('node:test');
const assert=require('node:assert/strict');
const {Battle}=require('../js/engine.js');
const {layout,fitImage}=require('../js/canvas-battle.js');
const D=require('../js/data.js');
const unit=(id,changes={})=>({...D.ALLIES[0],id,name:id,skills:[],priorities:[],...changes});
const scenario=(changes={})=>({id:'custom',title:'独立测试战斗',allies:[unit('hero')],enemies:[unit('foe')],rules:{level:10,enemyLevel:10,random:false,hit:false},scene:{color:'#345'},...changes});

test('通用引擎只生成传入阵容，不注入赤壁武将，不修改调用数据',()=>{
  const input=scenario();const before=JSON.stringify(input),b=new Battle(input);
  assert.deepEqual(b.units.map(u=>u.id),['hero','foe']);assert.equal(JSON.stringify(input),before);
  assert.equal(b.export().scenario.title,'独立测试战斗');assert.equal(b.export().scenario.scene.color,'#345');
  assert.ok(b.events.every(e=>!e.text?.includes('赤壁')));
  assert.throws(()=>new Battle({}),/阵容/);assert.throws(()=>new Battle(scenario({enemies:[unit('hero')]})),/唯一/);
});
test('两场不同阵容、等级、技能和场地的战斗相互独立',()=>{
  const a=new Battle(D.createChibi());const b=new Battle(scenario({allies:Array.from({length:7},(_,i)=>unit('hero'+i,{level:i+1})),skills:{flame:{id:'flame',name:'自定义火计',kind:'tactic',element:'fire',base:50,cost:0,side:'enemy'}},scene:{allowedElements:['stone']}}));
  assert.equal(a.units.length,10);assert.equal(b.units.length,8);assert.equal(b.units[6].level,7);assert.equal(a.unit('hero0'),undefined);
  b.unit('hero0').skills=['flame'];assert.equal(b.validate(b.unit('hero0'),'flame','foe').ok,false);
  b.scenario.scene.allowedElements.push('fire');b.start();const u=b.unit('hero0');u.ready=true;u.progress=1;
  assert.equal(b.act(u.id,'flame','foe').ok,true);assert.ok(b.events.some(e=>e.skillName==='自定义火计'));
});
test('撤退由场景配置控制，默认隐藏且禁止，允许时产生结束事件',()=>{
  const a=new Battle(scenario());a.start();assert.equal(a.retreat(),false);assert.equal(a.status,'running');
  const b=new Battle(scenario({allowRetreat:true}));b.start();assert.equal(b.retreat(),true);assert.equal(b.status,'retreated');assert.equal(b.events.at(-1).type,'end');const t=b.time;b.advance(5);assert.equal(b.time,t);
});
test('Canvas 布局在小屏和七人剧情阵容下不越界、不相互重叠',()=>{
  for(const [w,h]of[[320,568],[375,667],[390,844],[844,390]])for(const count of[1,5,7,12]){
    const rects=layout(w,h,count,5);assert.equal(rects.length,count+5);
    for(const r of rects){assert.ok(r.x>=0&&r.y>=70);assert.ok(r.x+r.w<=w+.01&&r.y+r.h<=h);}
    const enemies=rects.filter(r=>r.side==='enemy'),allies=rects.filter(r=>r.side==='ally');
    assert.ok(Math.max(...enemies.map(r=>r.y+r.h))<Math.min(...allies.map(r=>r.y)));
  }
});
test('头像以原比例等比缩放，宽屏、窄屏均不拉伸',()=>{
  for(const box of[{x:0,y:0,w:65,h:130},{x:10,y:20,w:130,h:70}]){const fit=fitImage(256,440,box);assert.ok(Math.abs(fit.w/fit.h-256/440)<1e-10);assert.ok(fit.w<=box.w&&fit.h<=box.h);}
});

test('手动技能只在满条时执行；单体选目标，群体直接命中全部',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();const u=b.units[0];
  assert.equal(b.manual(u.id,'fx_fire','caocao').ok,false);assert.equal(u.queued,null);
  b.advance(4.5);assert.ok(u.ready);const enemy=b.unit('caocao').soldiers;
  assert.equal(b.manual(u.id,'fx_fire','caocao').ok,true);assert.ok(b.unit('caocao').soldiers<enemy);assert.equal(b.events.at(-1).results.length,1);
  b.advance(4.5);assert.equal(b.manual(u.id,'fx_fire_all').ok,true);assert.equal(b.events.at(-1).results.length,5);
  assert.equal(u.ready,false);assert.equal(u.mode,'manual');
});
test('单奶、群奶、自身Buff、友军Buff、敌军状态直接作用且到期消失',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();b.advance(4.5);
  const healer=b.unit('lusu'),before=b.unit('ganning').soldiers;
  assert.equal(b.manual(healer.id,'fx_heal','ganning').ok,true);assert.ok(b.unit('ganning').soldiers>before);
  assert.equal(b.manual('zhugeliang','fx_heal_all').ok,true);assert.equal(b.events.at(-1).results.length,5);
  assert.equal(b.manual('huanggai','fx_taunt').ok,true);assert.ok(b.unit('huanggai').statuses.some(s=>s.taunt));
  assert.equal(b.manual('ganning','fx_boost','zhouyu').ok,true);assert.equal(b.unit('zhouyu').statuses[0].attackMultiplier,1.2);
  b.advance(4.5);assert.equal(b.manual('zhugeliang','fx_weaken','caocao').ok,true);assert.equal(b.unit('caocao').statuses[0].armorMultiplier,.8);
  b.advance(11);assert.equal(b.unit('caocao').statuses.length,0);assert.equal(b.unit('huanggai').statuses.length,0);
});
test('恢复自动会正常出手，其他角色不因手动待命停止行动',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();b.advance(4.5);const count=b.actionCount;
  b.advance(4.5);assert.ok(b.actionCount>count);assert.equal(b.unit('zhouyu').stats.actions,0);
  b.setMode('zhouyu','auto');b.advance(.02);assert.ok(b.unit('zhouyu').stats.actions>0);
});

test('同一技能的单体或群体范围在自动和手动时一致',()=>{
  const b=new Battle(D.createChibi());
  b.setPriorities('zhouyu',[{skill:'huoshen',when:'always',threshold:0,scope:'single'}]);
  assert.equal(b.autoCommand(b.unit('zhouyu')).scope,'all');
  b.setPriorities('huanggai',[{skill:'dare',when:'always',threshold:0,scope:'all'}]);
  assert.equal(b.autoCommand(b.unit('huanggai')).scope,'single');
});
