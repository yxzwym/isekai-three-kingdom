const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Scenes=require('../js/battle-scenes.js'),D=require('../js/world-data.js'),N=require('../js/nearby-content.js'),{World}=require('../js/world.js'),R=require('../js/game-rules.js'),E=require('../js/engine.js');
const character=()=>({name:'行客',...R.rollHero('normal',()=>.4)});
test('十五类场景都有独立本地素材，场景实例互不污染并可直接传入战斗系统',()=>{
 assert.equal(Object.keys(Scenes.definitions).length,15);const paths=new Set();for(const id of Object.keys(Scenes.definitions)){const scene=Scenes.get(id);paths.add(scene.background);assert.ok(fs.existsSync(path.join(__dirname,'..',scene.background)));scene.background='changed';assert.notEqual(Scenes.get(id).background,'changed');const b=new E.Battle({allies:[],enemies:[],scene:Scenes.get(id)});assert.equal(b.scenario.scene.id,id);}assert.equal(paths.size,15);assert.throws(()=>Scenes.get('unknown'),/未登记/);
});
test('路遇巡兵、盗贼、水贼、山贼与强盗使用对应场景，通用遭遇不会全回退到村道',()=>{
 for(const [id,scene]of Object.entries({patrol:'rural-road',thieves:'forest-path','river-bandits':'river-dock','mountain-bandits':'bandit-camp',brigands:'bandit-camp'})){const w=new World(character(),{weaponType:'sword'});w.move('julu',{eventRoll:0});w.pending.encounterId=id;assert.deepEqual(w.battleScenario().scene,Scenes.get(scene));}
});
test('主线与支线从配置读取场地，农田和街市实际进入战斗',()=>{
 for(const data of N.sideQuests){const w=new World(character(),{nodeId:data.place,weaponType:'sword'});w.acceptSide(data.id);w.beginSideBattle(data.id);assert.equal(w.battleScenario().scene.id,data.sceneId);}
 const w=new World(character(),{nodeId:'changshan',weaponType:'sword'});w.beginStoryBattle('entry');assert.equal(w.battleScenario().scene.id,'farmland');assert.equal(D.encounters['changshan-rescue'].scene.id,'market-street');
});
