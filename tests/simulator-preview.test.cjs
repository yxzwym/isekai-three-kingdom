const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const BattleSystem=require('../js/canvas-battle.js'),Scenes=require('../js/battle-scenes.js');
const context=vm.createContext({WorldMap:{CanvasWorld:class{}},BattleSystem,BattleScenes:Scenes});
vm.runInContext(fs.readFileSync(require.resolve('../js/canvas-simulator.js'),'utf8'),context);
const proto=context.BattleSimulationUI.CanvasSimulator.prototype;
test('模拟预览血条贴近实际缩放后的模型，读条位于血条下方，两排均不碰到控制区',()=>{
 for(const [w,h] of [[405,720],[540,960]])for(const count of [1,2,3,4,5,10]){
  const enemies=Array.from({length:count},(_,i)=>({id:'enemy-'+i,fullbody:{src:'art-'+i,width:i%2?768:400,height:i%2?1152:1200},formationRow:count>4?(i<Math.ceil(count/2)?'back':'front'):undefined}));
  const partySlots=count===10?10:5,view={w,h,preview:()=>({living:()=>enemies}),session:{activeIds:()=>Array(partySlots).fill('ally'),boss:()=>({limit:partySlots,sceneId:'farmland'})},image:src=>{const a=enemies.find(u=>u.fullbody.src===src).fullbody;return{naturalWidth:a.width,naturalHeight:a.height};}};
  view.partyTop=()=>proto.partyTop.call(view);const previews=proto.enemyPreviews.call(view);
  assert.equal(previews.length,count);
  for(const {dst,hud,above,source} of previews){
   assert.ok(Math.abs(dst.w/dst.h-source.width/source.height)<1e-8);
   assert.ok(Math.abs(dst.x+dst.w/2-hud.x-hud.w/2)<1e-8);
   assert.ok(Math.abs((above?dst.y-hud.y:hud.y-dst.y-dst.h)-(above?36:20))<1e-8);
   assert.ok(hud.y>=172&&hud.y+25<view.partyTop()-72);
  }
 }
});
test('模拟预览按素材裁切区域保持模型比例，不把整张图集当作人物',()=>{
 const unit={id:'atlas-unit',fullbody:{src:'atlas',crop:{x:200,y:40,width:256,height:440}}},view={w:405,h:720,preview:()=>({living:()=>[unit]}),session:{activeIds:()=>['ally'],boss:()=>({limit:4,sceneId:'farmland'})},image:()=>({naturalWidth:2048,naturalHeight:1024})};
 view.partyTop=()=>proto.partyTop.call(view);const [{source,dst}]=proto.enemyPreviews.call(view);assert.equal(source,unit.fullbody.crop);assert.ok(Math.abs(dst.w/dst.h-256/440)<1e-8);
});
