const test=require('node:test'),assert=require('node:assert/strict'),{BattleEffects}=require('../js/canvas-effects.js');
test('输入事件时间稍晚于当前动画帧时，特效保持首帧，圆弧不出现负半径',()=>{
 const previous=global.document;let drawn=0;
 const paint=new Proxy({globalAlpha:1,arc(x,y,r){assert.ok(r>=0,'圆弧半径');},ellipse(x,y,rx,ry){assert.ok(rx>=0&&ry>=0,'椭圆半径');}},{get:(o,key)=>key in o?o[key]:()=>{}});
 global.document={createElement:()=>({getContext:()=>paint})};
 try{
  const fx=new BattleEffects();fx.action({actor:'a',results:[{target:'b',actual:20,critical:true}]},{kind:'physical'},100);
  fx.addEffect('b','buff',100,850);fx.addEffect('b','earth',100,850);
  assert.doesNotThrow(()=>fx.draw({drawImage(){drawn++;}},[{id:'b',x:0,y:0,w:70,h:120}],80));
  assert.ok(drawn>=3);const pose=fx.pose('a','ally',80);assert.ok(pose.x===0&&pose.y===0&&pose.angle===0&&pose.scale===1);assert.deepEqual(fx.offset(80),{x:0,y:0});
  fx.draw({drawImage(){}},[{id:'b',x:0,y:0,w:70,h:120}],950);assert.equal(fx.items.length,0);
 }finally{if(previous===undefined)delete global.document;else global.document=previous;}
});
