const test=require('node:test'),assert=require('node:assert/strict'),{World}=require('../js/world.js'),R=require('../js/game-rules.js'),Input=require('../js/party-controls.js');
const create=()=>{const w=new World({name:'行客',...R.rollHero('normal',()=>.4)},{nodeId:'camp',inside:true,weaponType:'sword'});for(let i=0;i<6;i++)w.recordRecruit('unit-'+i,'wei',{name:'队员'+i,homeNode:'camp',level:3,experience:0,experienceVersion:2,war:10,intelligence:10,constitution:10,speed:10,technique:10,skills:['punch']});return w;};
test('出战与替补分别排序并存档，快速上下场维持携带与出战上限',()=>{
 const w=create();assert.deepEqual(w.partyGroups().active.map(u=>u.id),['hero','unit-0','unit-1','unit-2']);assert.deepEqual(w.partyGroups().reserve.map(u=>u.id),['unit-3','unit-4','unit-5']);assert.ok(w.reorderParty('active','unit-2',0));assert.ok(w.reorderParty('reserve','unit-5',0));assert.ok(w.movePartyMember('unit-1','reserve',1));assert.deepEqual(w.partyGroups().reserve.map(u=>u.id),['unit-5','unit-1','unit-3','unit-4']);assert.ok(w.movePartyMember('unit-4','active',1));assert.equal(w.state.activeIds[1],'unit-4');const saved=w.snapshot(),loaded=new World(w.character,saved);assert.deepEqual(loaded.snapshot(),saved);assert.deepEqual(loaded.partyGroups(),w.partyGroups());assert.equal(new Set([...w.partyGroups().active,...w.partyGroups().reserve].map(u=>u.id)).size,7);
 assert.ok(w.beginTraining('militia-one').ok);assert.deepEqual(w.battleScenario().allies.map(u=>u.id),w.state.activeIds);
});
test('不能超出出战人数或让最后一人下场，开放五人后不受固定四人代码限制',()=>{
 const w=create(),before=w.snapshot();assert.equal(w.movePartyMember('unit-3','active',0),false);assert.deepEqual(w.snapshot(),before);assert.ok(w.lastPartyError.includes('4'));assert.ok(w.unlockActiveLimit(5));assert.ok(w.movePartyMember('unit-3','active',0));assert.equal(w.state.activeIds.length,5);assert.ok(w.setActive(['hero']));const one=w.snapshot();assert.equal(w.movePartyMember('hero','reserve',0),false);assert.deepEqual(w.snapshot(),one);assert.equal(w.partyGroups().reserve.length,6);
});
test('离队清理排序记录，重邀和新成员不会丢失或重复已有排序',()=>{
 const w=create();w.reorderParty('reserve','unit-5',0);w.dismiss('unit-5');assert.ok(!w.state.reserveOrder.includes('unit-5'));assert.ok(w.inviteResident('unit-5'));assert.deepEqual(w.partyGroups().reserve.map(u=>u.id),['unit-3','unit-4','unit-5']);assert.deepEqual(new World(w.character,w.snapshot()).partyGroups(),w.partyGroups());
});
function harness(w=create()){
 const p={type:'party',rowHeight:108,scrolls:{active:0,reserve:0},scrollLimits:{},partyColumns:[{group:'active',x:10,y:100,w:130,h:320},{group:'reserve',x:160,y:100,w:130,h:320}]},hits=[],groups=w.partyGroups();for(const col of p.partyColumns){p.scrollLimits[col.group]=Math.max(0,groups[col.group].length*108-col.h);groups[col.group].forEach((u,i)=>hits.push({x:col.x,y:100+i*108,w:126,h:100,kind:'partyMember',unitId:u.id,cardX:col.x,cardY:100+i*108,cardW:126,action(){v.opened++;}}));}
 const v={model:w,panel:p,hits,revision:0,drawnRevision:0,canvas:{setPointerCapture(){}},point:e=>({x:e.clientX,y:e.clientY}),invalidate(){this.revision++;},save(){this.saves++;},notify(s){this.message=s;},saves:0,opened:0};return v;
}
const event=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,button:0});
function holdTest(fn){const previous={setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};let callback;global.setTimeout=f=>{callback=f;return 1;};global.clearTimeout=()=>{};try{fn(()=>callback?.());}finally{Object.assign(global,previous);}}
test('列表分别滚动，普通滑动取消长按且不会误开人物状态',()=>holdTest(hold=>{
 const v=harness();Input.down(v,event(40,150));Input.move(v,event(40,120));hold();assert.equal(v.panel.scrolls.active,30);assert.equal(v.panel.scrolls.reserve,0);assert.equal(v.panel.drag,undefined);Input.up(v,event(40,120));assert.equal(v.opened,0);Input.wheel(v,{clientX:180,clientY:150,deltaY:3,preventDefault(){}});assert.equal(v.panel.scrolls.reserve,3);assert.equal(v.panel.scrolls.active,30);
}));
test('长按拖动修改顺序，靠近边缘会自动滚动，取消拖动不改变队伍',()=>holdTest(hold=>{
 const v=harness();Input.down(v,event(40,150));hold();assert.ok(v.panel.drag);Input.move(v,event(40,275));Input.up(v,event(40,275));assert.equal(v.model.state.activeIds[1],'hero');assert.equal(v.saves,1);assert.equal(v.opened,0);assert.equal(v.panel.drag,null);
 const e=harness();Input.down(e,event(40,150));hold();Input.move(e,event(40,419));Input.tick(e,e.panel.drag.lastTick+80);assert.ok(e.panel.scrolls.active>0);assert.equal(e.panel.scrolls.reserve,0);const before=e.model.snapshot();Input.cancel(e);assert.equal(e.panel.drag,null);assert.deepEqual(e.model.snapshot(),before);
}));
test('跨列拖动可以上阵，满员时拒绝并保留原顺序；其他触点不能结束拖动',()=>holdTest(hold=>{
 const full=harness(),before=full.model.snapshot();Input.down(full,event(190,150));hold();Input.up(full,event(40,150,2));assert.ok(full.press);Input.move(full,event(40,150));Input.up(full,event(40,150));assert.deepEqual(full.model.snapshot(),before);assert.ok(full.message.includes('4'));
 const w=create();w.movePartyMember('unit-2','reserve',3);const v=harness(w);Input.down(v,event(190,150));hold();Input.move(v,event(40,150));Input.up(v,event(40,150));assert.equal(w.state.activeIds[0],'unit-3');assert.equal(w.state.activeIds.length,4);assert.equal(v.saves,1);
}));
