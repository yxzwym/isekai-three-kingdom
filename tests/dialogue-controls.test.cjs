const test=require('node:test'),assert=require('node:assert/strict');require('../js/ui-theme.js');const {CanvasWorld}=require('../js/canvas-world.js');
function draw(dialogue){
 const saved=global.PengpaiStory;global.PengpaiStory={CanvasStory:{prototype:{bust(){}}}};
 try{const v=Object.assign(Object.create(CanvasWorld.prototype),{w:390,h:844,dialogue,hits:[],ctx:{measureText:s=>({width:[...s].length*16}),createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}},text(){},button(label,x,y,w,h,action){this.hits.push({label,x,y,w,h,action});}});v.drawDialogue();return v;}finally{global.PengpaiStory=saved;}
}
test('底部对话始终不显示叉，只有继续时任意位置点击都推进；功能弹窗不受影响',()=>{
 const d={npc:{id:'guest',name:'路人',art:'villager',side:'left'},lines:['先说第一句。','再说第二句。'],index:0},v=draw(d);assert.equal(v.hits.some(h=>h.label==='×'),false);assert.deepEqual([v.hits[0].x,v.hits[0].y,v.hits[0].w,v.hits[0].h],[0,0,390,844]);v.hits[0].action();assert.equal(d.index,1);
 const forced=draw({...d,index:0,forced:true});assert.equal(forced.hits.some(h=>h.label==='×'),false);
});
test('未来有离开选项的多句对话，在选择出现前仍保持全屏继续，最后才可离开',()=>{
 let left=false;const d={npc:{name:'路人',art:'villager',side:'right'},lines:['第一句。','第二句。'],index:0,choices:[{label:'对话',action(){}},{label:'离开',action(){left=true;}}]},first=draw(d);assert.equal(first.hits.some(h=>h.label==='点击空白离开'),false);first.hits[0].action();const last=draw(d);assert.equal(last.hits.some(h=>h.label==='×'),false);last.hits.find(h=>h.label==='离开').action();assert.ok(left);
});

test('多选对话只有选项按钮有效，空白不会离开；单个选项仍覆盖全屏',()=>{
 const npc={name:'来客',art:'villager'},v=draw({npc,lines:['你准备怎么办？'],index:0,choices:[{label:'迎战',action(){}},{label:'离开',action(){}}]});assert.equal(v.hits.length,2);assert.ok(!v.hits.some(h=>h.x===0&&h.y===0));const single=draw({npc,lines:['继续往前走。'],index:0,choices:[{label:'继续',action(){}}]});assert.ok(single.hits.some(h=>h.x===0&&h.y===0&&h.w===390&&h.h===844));
});
