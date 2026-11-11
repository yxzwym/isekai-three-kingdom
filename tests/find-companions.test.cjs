const test=require('node:test'),assert=require('node:assert/strict');
require('../js/ui-theme.js');require('../js/character-assets.js');
const {World}=require('../js/world.js'),R=require('../js/game-rules.js'),C=require('../js/recruitment-content.js'),D=require('../js/world-data.js'),Panels=require('../js/world-panels.js'),{CanvasWorld}=require('../js/canvas-world.js');
const make=()=>new World({name:'行舟',appearance:'armored',difficulty:'normal',...R.rollHero('normal',()=>.5)},{introStep:2,nodeId:'xuchang',inside:true,weaponType:'sword'});
function join(w,id){const u=C.companion(id,3);assert.ok(w.recordRecruit(id,require('../js/hero-quests.js').definitions[id].country,u));return w.state.companions.find(u=>u.id===id);}
function view(w){const texts=[],v=Object.assign(Object.create(CanvasWorld.prototype),{model:w,character:w.character,panel:{type:'party'},w:540,h:960,hits:[],ctx:new Proxy({},{get:(o,k)=>o[k]||(()=>{})}),text(t){texts.push(String(t));},box(){},portrait(){},frame(title,height){this.hits=[];texts.push(title);return{x:40,y:100,w:460,h:Math.min(600,height)};},button(label,x,y,w,h,action,options={}){if(!options.disabled)this.hits.push({label,x,y,w,h,action});},save(){this.saved=true;},invalidate(){},notify(t){this.message=t;},warmTravelArt(){},startNextLeg(){this.started=true;},interact(npc){this.spoken=npc;},tryEnter(){this.entered=true;}});return {v,texts};}

test('寻人只列暂别武将，排除出战、备战、酒馆人物与未招募者，存读档保留归处',()=>{
 const w=make();for(const id of ['xuchu','dianwei','huangzhong','maliang'])join(w,id);
 assert.ok(w.partyGroups().reserve.some(u=>u.id==='maliang'));assert.deepEqual(w.absentCompanions(),[]);
 assert.ok(w.dismiss('huangzhong'));w.state.residents['retainer-test']={...C.companion('xuchu',2),id:'retainer-test',origin:'tavern',homeNode:'xuchang'};
 const before=w.snapshot(),rows=w.absentCompanions();assert.deepEqual(rows.map(u=>u.id),['huangzhong']);assert.equal(rows[0].place.id,'chengdu');assert.ok(rows[0].reachable);assert.ok(rows[0].portrait);assert.deepEqual(w.snapshot(),before);
 const loaded=new World(w.character,before);assert.deepEqual(loaded.absentCompanions(),rows);loaded.arrive('chengdu');assert.ok(loaded.inviteResident('huangzhong'));assert.deepEqual(loaded.absentCompanions(),[]);
});
test('旧档仅有招募记录也能找到武将，未开通水路保留位置并禁用前往',()=>{
 const w=new World(make().character,{introStep:2,nodeId:'xuchang',recruits:{shu:['zhaoyun'],wei:['zhenji']}}),rows=w.absentCompanions();assert.equal(rows.find(u=>u.id==='zhaoyun').place.id,'chengdu');assert.equal(rows.find(u=>u.id==='zhenji').place.id,'xuchang');
 w.state.residents.huatuo={...C.companion('huatuo',3),homeNode:D.places.find(p=>p.requiresWater).id};const blocked=w.absentCompanions().find(u=>u.id==='huatuo');assert.ok(blocked.place);assert.equal(blocked.reachable,false);assert.equal(blocked.reason,'水路未开通');const {v}=view(w);v.panel={type:'findCompanions'};Panels.draw(v);assert.ok(!v.hits.some(h=>h.label.startsWith('寻找 华佗')));
});
test('队伍顶部打开寻人，点击异地武将走原有寻路流程，同地直接接洽，关闭返回原队伍',()=>{
 const w=make();for(const id of ['xuchu','huangzhong']){join(w,id);w.dismiss(id);}const {v}=view(w),party=v.panel;Panels.draw(v);v.hits.find(h=>h.label==='寻人').action();assert.equal(v.panel.type,'findCompanions');assert.equal(v.panel.previous,party);Panels.draw(v);v.hits.find(h=>h.label==='寻找 许褚 · 许昌').action();assert.equal(v.spoken.id,'xuchu');assert.equal(v.panel,null);assert.ok(!v.started);
 v.panel={type:'findCompanions',previous:party};Panels.draw(v);v.hits.find(h=>h.label==='寻找 黄忠 · 成都').action();assert.equal(w.state.routeTarget,'chengdu');assert.equal(w.state.inside,false);assert.equal(v.panel,null);assert.ok(v.started&&v.saved);assert.ok(w.findRoute('chengdu').nodes.length>2);
 v.panel={type:'findCompanions',previous:party};v.closeWorldPanel();assert.equal(v.panel,party);
});
test('多人寻人列表支持滚动，裁剪的行不能误触，抵达本地城外会进城，行路中不会改道',()=>{
 const w=make();for(const id of ['xuchu','dianwei','huangzhong','maliang','taishici','lusu','jiaxu','zhangliao','guanyu','zhangfei']){join(w,id);assert.ok(w.dismiss(id));}
 const {v}=view(w);v.panel={type:'findCompanions',scroll:99999};Panels.draw(v);assert.ok(v.panel.maxScroll>0);assert.equal(v.panel.scroll,v.panel.maxScroll);const bottom=700;assert.ok(v.hits.every(h=>h.y>=188&&h.y+h.h<=bottom-18));assert.ok(v.hits.some(h=>h.label.startsWith('寻找 ')));
 w.state.inside=false;assert.ok(v.findCompanion('xuchu'));assert.ok(v.entered);w.planRoute('chengdu');w.beginNextLeg();const before=w.snapshot();assert.equal(v.findCompanion('huangzhong'),false);assert.deepEqual(w.snapshot(),before);
});
