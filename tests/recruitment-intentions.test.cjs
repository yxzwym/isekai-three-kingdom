const test=require('node:test'),assert=require('node:assert/strict');
const {World}=require('../js/world.js'),H=require('../js/hero-quests.js'),D=require('../js/world-data.js'),R=require('../js/game-rules.js'),{CanvasWorld}=require('../js/canvas-world.js'),Intent=require('../js/recruitment-intentions.js');
test('每条正式招募线由主角提出去向，保留同行和安顿两种决定与原有目的地',()=>{
 assert.deepEqual(Object.keys(Intent.endings).sort(),Object.keys(H.definitions).sort());
 for(const d of Object.values(H.definitions)){
  const ending=Object.values(d.stages).find(s=>s.npc?.choices?.some(c=>Object.hasOwn(c,'recruit')));assert.ok(ending,d.id);const rows=ending.npc.turns;assert.equal(rows[0].speaker,'npc');assert.equal(rows[1].speaker,'hero');assert.ok(rows[1].text.includes(D.placeMap[d.home||(d.id==='ganning'?'jianye':d.place)].name.slice(0,2)),d.id);assert.ok(ending.npc.choices.some(c=>c.recruit===true));assert.ok(ending.npc.choices.some(c=>c.recruit===false));assert.doesNotMatch(rows[0].text,/我本来就准备去|我准备去建业|我想去许昌|之后想去建业|我想去成都|然后想去成都/);
 }
 const departure=H.definitions.taishici.stages['depart-for-wu'].npc.turns;assert.equal(departure[1].speaker,'hero');assert.match(departure[1].text,/建业/);assert.match(departure[2].text,/比一场/);
});
test('赵云先谈为天下万民择主，主角建议成都刘备，收尾只保留同行',()=>{
 const w=new World({name:'行舟',...R.rollHero('normal',()=>.5)},{nodeId:'changshan',quests:{changshan:{stage:'decision'}}});w.state.companions.push(w.zhaoYunUnit());const v=Object.assign(Object.create(CanvasWorld.prototype),{model:w,character:w.character,save(){},invalidate(){}}),seen=[];v.questDialogue(D.questNpcs.zhaoyun);let count=0;while(!v.dialogue.choices&&count++<20){seen.push([v.dialogue.npc.id,v.dialogue.lines[v.dialogue.index]]);v.advanceDialogue();}assert.ok(seen.some(([id,text])=>id==='zhaoyun'&&text.includes('天下万民')));assert.ok(seen.some(([id,text])=>id==='hero'&&text.includes('成都')&&text.includes('刘备')));assert.equal(v.dialogue.choices.length,1);v.dialogue.choices[0].action();assert.equal(w.members().find(u=>u.id==='zhaoyun').homeNode,'chengdu');assert.equal(w.state.quests.changshan.stage,'complete');
});
