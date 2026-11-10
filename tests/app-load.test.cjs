const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),R=require('../js/game-rules.js'),WorldModel=require('../js/world.js');
function load(world){
 let menuOptions,mounted,story;const character={name:'行客',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.4)},canvas={},input={hidden:false};
 const context=vm.createContext({URLSearchParams,location:{search:''},window:{localStorage:{getItem(){return null;},setItem(){}}},document:{getElementById(id){return id==='heroName'?input:canvas;}},GameAssetManifest:[],GameAssetLoader:{mount(c,manifest,start){start();}},PengpaiRules:R,WorldModel,PengpaiMenu:{mount(c,options){menuOptions=options;return {destroy(){}};}},WorldMap:{mount(c,options){mounted=options;return {destroy(){}};}},PengpaiStory:{mount(c,options){story=options;return {destroy(){}};}}});vm.runInContext(fs.readFileSync(require.resolve('../js/app.js'),'utf8'),context);menuOptions.onLoad({character,progress:{stage:'world',world}},0);return {mounted,story};
}
test('从真实启动入口加载专武存档，不因武器模型未列在普通18方向而退回初始选兵器',()=>{
 const weapon={id:'fangtian-halberd',type:'halberd',attack:18},result=load({nodeId:'camp',introStep:2,weaponCatalogVersion:1,weaponType:'halberd',weapon});assert.ok(result.mounted);assert.equal(result.story,undefined);assert.equal(result.mounted.model.members()[0].skills.length,1);assert.equal(require('../js/weapon-skills.js').skills[result.mounted.model.members()[0].skills[0]].scope,'all');
});
test('启动时先迁移已退休的普通武器，再进入原地图进度，不重复出营选择',()=>{
 const result=load({nodeId:'changshan',introStep:2,weaponType:'qin'});assert.ok(result.mounted);assert.equal(result.story,undefined);assert.equal(result.mounted.model.state.nodeId,'changshan');assert.equal(result.mounted.model.state.weaponType,'fan');
});
test('主角主动卸下武器后可正常读档，以拳击继续游戏，不强制重选初始武器',()=>{
 const result=load({nodeId:'camp',introStep:2,weaponCatalogVersion:1,weaponType:null,weapon:null,outfitted:true});assert.ok(result.mounted);assert.equal(result.story,undefined);assert.deepEqual(result.mounted.model.members()[0].skills,['punch']);
});
