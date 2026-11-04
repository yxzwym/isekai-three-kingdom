const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {HealthTrack,formatNumber}=require('../js/presentation.js');
const Assets=require('../js/character-assets.js');
const {Battle}=require('../js/engine.js');
const D=require('../js/data.js');
test('剧情半身像按原图比例裁切，缩小素材后仍保持同一部位且不越界',()=>{
  const original=Assets.bustCrop(1024,1536);assert.deepEqual(original,{x:150,y:0,width:724,height:830});
  for(const [width,height]of [[384,576],[512,768],[2048,3072]]){const crop=Assets.bustCrop(width,height);assert.equal(crop.x/width,original.x/1024);assert.equal(crop.width/width,original.width/1024);assert.equal(crop.height/height,original.height/1536);assert.ok(crop.x+crop.width<=width);assert.ok(crop.y+crop.height<=height);}
});
test('所有显示数字均为无分隔符的整数',()=>{assert.equal(formatNumber(1234567),'1234567');assert.equal(formatNumber(9999.8),'9999');assert.equal(formatNumber(0),'0');});
test('扣兵先变化主条，白条延迟追赶，并最终收敛真实值',()=>{
  const h=new HealthTrack(1000,1000);h.set(600,100);
  assert.equal(h.sample(100).value,1000);assert.equal(h.sample(200).trail,1000);assert.ok(h.sample(200).value<1000);assert.ok(h.sample(200).value>=600);
  assert.ok(h.sample(400).trail>600);assert.equal(h.sample(800).value,600);assert.equal(h.sample(800).trail,600);
});
test('治疗从当前条平滑上升，连续受击不会跳回原始满血',()=>{
  const h=new HealthTrack(1000,1000);h.set(500,0);h.set(300,200);const snapshot=h.sample(200);assert.ok(snapshot.value<=500);assert.ok(snapshot.trail>snapshot.value);
  h.set(800,900);assert.equal(h.sample(900).value,300);assert.ok(h.sample(1050).value>300&&h.sample(1050).value<800);assert.equal(h.sample(1500).value,800);
});
test('角色素材按角色和版本解析，不会因场景内改名而串用别人的头像',()=>{
  const c=D.createEncounter();assert.equal(c.allies[0].characterId,'ganning');assert.deepEqual(c.allies[0].portrait,Assets.resolve('ganning').portrait);
  for(const [id,c]of Object.entries(Assets.manifest.characters)){const art=Assets.resolve(id);assert.equal(art.variant,c.defaultVariant);assert.ok(art.portrait);for(const role of ['portrait','fullbody']){const record=c.variants[c.defaultVariant][role];if(record?.status==='pending-generation'){assert.equal(art[role],null);assert.ok(art.pending.includes(role));}else if(art[role])assert.ok(fs.existsSync(path.resolve(__dirname,'..',art[role].src)));}}
  assert.throws(()=>Assets.resolve('unknown'),/未登记/);assert.throws(()=>Assets.resolve('zhouyu','bad-version'),/未登记/);
});
test('没有通用物理指令或兜底动作，只能执行角色明确配置的技能',()=>{
  const s=D.createChibi(),b=new Battle(s);b.start();const u=b.unit('zhouyu');u.ready=true;u.progress=1;
  assert.equal(b.skills.attack,undefined);assert.equal(b.skills.defend,undefined);assert.equal(b.act(u.id,'attack','caocao').ok,false);
  u.skills=[];u.priorities=[];const count=b.actionCount;b.advance(1);assert.equal(u.stats.actions,0);assert.ok(b.actionCount>=count);assert.equal(u.ready,true);assert.equal(b.autoCommand(u),null);
  u.skills=['strike'];b.setPriorities(u.id,[{skill:'strike',when:'always',threshold:0}]);b.advance(.02);assert.equal(u.stats.actions,1);
});
