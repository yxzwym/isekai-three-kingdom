const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../js/prologue.js'),E=require('../js/engine.js'),I=require('../js/skill-info.js'),W=require('../js/weapon-skills.js');
global.PengpaiUI=require('../js/ui-theme.js');require('../js/canvas-story.js');const proto=global.PengpaiStory.CanvasStory.prototype;
function transitionHarness(){
 const previous={document:global.document,performance:global.performance,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame},cancelled=[];let nextId=10;
 global.performance={now:()=>1000};global.document={createElement:()=>({getContext:()=>({drawImage(){}})})};global.requestAnimationFrame=()=>nextId++;global.cancelAnimationFrame=id=>cancelled.push(id);
 const v=Object.assign(Object.create(proto),{canvas:{width:375,height:667,dataset:{},removeEventListener(){}},observer:{disconnect(){}},ctx:{},progress:{storyVersion:2,stage:'camp',index:0},hasDrawn:true,hits:[{action(){}}],mounts:[],resize(){},draw(){},save(){},mountStage(stage,index){this.mounts.push(stage);this.progress={...this.progress,stage,index};}});
 return {v,cancelled,restore(){for(const [k,value]of Object.entries(previous)){if(value===undefined)delete global[k];else global[k]=value;}}};
}
test('入梦先淡出，黑场交接时才提交场景，淡入结束前忽略连点',()=>{
 const h=transitionHarness(),v=h.v;try{v.enter('dream');const start=v.transition.start;assert.equal(v.transition.phase,'out');assert.equal(v.progress.stage,'camp');assert.equal(v.hits.length,0);v.next();assert.equal(v.progress.index,0);v.transitionStep(start+279);assert.deepEqual(v.mounts,[]);v.transitionStep(start+280);assert.equal(v.progress.stage,'dream');assert.equal(v.transition.phase,'in');v.enter('dawn');v.next();assert.equal(v.progress.stage,'dream');assert.equal(v.progress.index,0);v.transitionStep(start+640);assert.equal(v.transition,null);assert.deepEqual(v.mounts,['dream']);v.enter('dawn');const wake=v.transition.start;v.transitionStep(wake+640);assert.equal(v.progress.stage,'dawn');assert.equal(v.transition,null);assert.deepEqual(v.mounts,['dream','dawn']);}finally{h.restore();}
});
test('同一场景的对白段落不插黑场，销毁后不会迟到切换或写入存档',()=>{
 const h=transitionHarness(),v=h.v;try{v.enter('dawn');assert.equal(v.transition,undefined);assert.deepEqual(v.mounts,['dawn']);v.enter('dream');const start=v.transition.start,raf=v.transitionRaf;v.destroy();assert.ok(h.cancelled.includes(raf));v.transitionStep(start+1000);assert.deepEqual(v.mounts,['dawn']);assert.equal(v.transition,null);}finally{h.restore();}
});
test('教程官兵按8级真实成长提高强度，保留治疗空间和队长同档输出',()=>{
 const scenario=P.createBattle('squad-fight',{name:'测试'}),strong=new E.Battle(scenario),normal=strong.unit('soldier-1'),captain=strong.unit('captain');assert.ok(strong.living('enemy').every(u=>u.level===8));assert.equal(normal.maxSoldiers,220);assert.equal(captain.maxSoldiers,330);assert.equal(normal.war,captain.war);assert.equal(normal.speed,captain.speed);assert.equal(normal.attack,captain.attack);
 const weak=new E.Battle({...scenario,enemies:scenario.enemies.map(u=>({...u,level:5}))});for(const b of [weak,strong]){b.start();b.advance(150);assert.equal(b.status,'victory');}assert.ok(strong.time>weak.time);assert.equal(strong.living('ally').length,3);assert.ok(strong.events.filter(e=>e.skill==='scripture-2').length>=3);assert.ok(strong.events.filter(e=>e.type==='action'&&e.side==='enemy').some(e=>e.results.some(r=>r.after/strong.unit(r.target).maxSoldiers<.85)));
});
test('技能算法保留小数系数、武器威力与状态原公式，零属性不被当成1',()=>{
 assert.equal(I.skillFormula(W.skills['sword-eagle']),'武力×3.75＋技巧×1＋武器威力');assert.equal(I.skillFormula(W.skills['punch']),'武力×1');const skill=W.skills['spear-break'],effect=skill.effects[0];assert.equal(I.statusText(effect,{technique:15}),'破甲：减少目标6.75（3＋技巧×0.25）点护甲，持续8秒。');assert.equal(I.statusText(effect,{technique:0}),'破甲：减少目标3（3＋技巧×0.25）点护甲，持续8秒。');
 const b=new E.Battle(P.createBattle('squad-fight',{name:'测试'}));b.unit('zhangliang').technique=0;b.rng=()=>0;b.addStatus(b.unit('zhangliang'),b.unit('captain'),effect,skill);assert.equal(b.unit('captain').statuses[0].amount,-3);
});
test('序章必败与旁观援战均不给主角经验，胜负只推进对应剧情，主角仍为1级',()=>{
 const before={BattleSystem:global.BattleSystem,setTimeout:global.setTimeout,cancelAnimationFrame:global.cancelAnimationFrame};let completed,callback;
 try{global.cancelAnimationFrame=()=>{};global.setTimeout=fn=>{callback=fn;return 1;};global.BattleSystem={mount(canvas,scenario,options){completed=options.onComplete;return {battle:new E.Battle(scenario),destroy(){}};}};
  for(const stage of ['first-fight','manual-fight','squad-fight']){const character={name:'行客',level:1,experience:0},v=Object.assign(Object.create(proto),{canvas:{dataset:{}},character,progress:{storyVersion:2,stage,index:0,preparation:{}},store:{settings:()=>({})},save(){},resize(){},enter(next){this.nextStage=next;}});v.mountStage(stage);completed({result:stage==='first-fight'?'defeat':'victory'});callback();assert.equal(v.character.level,1);assert.equal(v.character.experience,0);assert.equal(v.nextStage,stage==='first-fight'?'aftermath':stage==='manual-fight'?'reinforcements':'camp');}
 }finally{Object.assign(global,before);}
});
