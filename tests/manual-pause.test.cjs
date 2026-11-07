const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/engine.js'),R=require('../js/game-rules.js'),{CanvasBattle}=require('../js/canvas-battle.js'),{World}=require('../js/world.js'),P=require('../js/prologue.js');
function view({difficulty='normal',enabled=true,count=1,mode='manual'}={}){
 const actor=id=>({id,name:id,war:10,intelligence:10,constitution:1000,speed:100,technique:10,skills:['strike'],priorities:[{skill:'strike',when:'always'}],initialMode:mode}),scenario={allies:Array.from({length:count},(_,i)=>actor('ally-'+i)),enemies:[{...actor('enemy'),war:100,speed:1,initialMode:'auto'}],skills:{strike:{id:'strike',name:'斩击',kind:'physical',side:'enemy',scope:'single',scaling:{war:1},cost:0}},rules:{difficulty,random:false,hit:false,critical:false}};
 const battle=new E.Battle(scenario);battle.start();const v=Object.assign(Object.create(CanvasBattle.prototype),{battle,scenario,options:{manualPause:enabled},lastTime:0,disposed:false,metrics:null,processEvents(){},vfx:{prewarm(){}},draw(){},notify(){}});return v;
}
function frames(run){const old=global.requestAnimationFrame;global.requestAnimationFrame=()=>1;try{run();}finally{if(old===undefined)delete global.requestAnimationFrame;else global.requestAnimationFrame=old;}}
test('手动满条立即时停，长帧也不越过就绪时刻，选技能与目标期间敌我及状态计时保持不变',()=>frames(()=>{
 const v=view(),b=v.battle,a=b.unit('ally-0'),e=b.unit('enemy');b.addStatus(a,e,{id:'armorDown',duration:10,attribute:'armor',amount:2},{id:'test',name:'试验'});v.frame(6000);assert.ok(a.ready);assert.ok(b.time<2);const snapshot=JSON.stringify(b.units),time=b.time,actions=b.actionCount;v.chooseSkill(a,'strike');assert.equal(v.aim.actor,a.id);for(const now of [16000,60000,120000])v.frame(now);assert.equal(b.time,time);assert.equal(b.actionCount,actions);assert.equal(JSON.stringify(b.units),snapshot);assert.ok(e.statuses.length);v.selectUnit(e);assert.equal(a.ready,false);v.frame(120020);assert.ok(b.time>time);assert.ok(b.time<=time+.021);
}));
test('多名手动角色同时就绪，逐人释放或切回自动后恢复；自动角色独立运行时不会时停',()=>frames(()=>{
 const v=view({count:2}),b=v.battle;v.frame(6000);assert.equal(v.manualReadyActors().length,2);const time=b.time;v.chooseSkill(b.unit('ally-0'),'strike');v.selectUnit(b.unit('enemy'));v.frame(10000);assert.equal(b.time,time);assert.equal(v.manualReadyActors().length,1);v.toggleMode(b.unit('ally-1'));v.frame(10020);assert.ok(b.time>time);const auto=view({mode:'auto'});auto.frame(6000);assert.equal(auto.battle.time,6);assert.ok(auto.battle.actionCount>0);
}));
test('所有难度与旧别名都能手动时停，关闭设置后均为实时战斗',()=>frames(()=>{
 for(const difficulty of [...R.DIFFICULTIES.map(d=>d.id),'worthless'])for(const enabled of [true,false]){const v=view({difficulty,enabled});v.frame(6000);assert.equal(v.manualPauseEnabled(),enabled);if(enabled){assert.ok(v.battle.time<2);assert.ok(v.battle.unit('ally-0').ready);}else{assert.equal(v.battle.time,6);assert.ok(v.battle.unit('enemy').stats.actions>0);}}
}));
test('时停偏好持久化、旧设置默认开启，序章与大地图所有战斗携带难度',()=>{
 const values=new Map(),store=new R.SaveStore({getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)});assert.equal(store.settings().manualPause,true);store.setSettings({...store.settings(),manualPause:false});assert.equal(store.settings().manualPause,false);assert.throws(()=>store.setSettings({manualPause:'yes'}),/无效/);
 const c={name:'行客',difficulty:'hell',...R.rollHero('hell',()=>.5)};assert.equal(P.createBattle('manual-fight',c).rules.difficulty,'hell');const w=new World(c,{nodeId:'camp',weaponType:'sword',inside:true});w.beginTraining('militia-one');assert.ok(w.pending);assert.equal(w.battleScenario().rules.difficulty,'hell');
});

test('预先排好的手动指令到时正常释放，不会被选技时停挡住',()=>frames(()=>{
 const v=view(),b=v.battle;assert.ok(b.queue('ally-0','strike','enemy').queued);v.frame(1600);assert.equal(b.unit('ally-0').stats.actions,1);assert.equal(b.unit('ally-0').queued,null);assert.equal(b.unit('ally-0').ready,false);assert.equal(b.time,1.6);
}));
