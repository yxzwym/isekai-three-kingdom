const test=require('node:test'),assert=require('node:assert/strict'),{World}=require('../js/world.js'),R=require('../js/game-rules.js'),I=require('../js/items.js');
const create=()=>new World({name:'行客',...R.rollHero('normal',()=>.4)},{nodeId:'camp',weaponType:'sword',money:200});
test('按白色品质批量出售只结算背包筛选结果，保留绿色及已穿戴装备',()=>{
 const w=create(),a=w.addItem('weapon-sword'),b=w.addItem('cloth-armor'),green=w.addItem('weapon-sword','green'),equipped=w.equipped('hero','weapon'),items=I.select(w.state.inventory,{qualities:['white']}),total=I.sellPrice(a)+I.sellPrice(b);
 assert.deepEqual(w.sellItems(items.map(i=>i.uid)),{count:2,money:total});assert.equal(w.state.money,200+total);assert.deepEqual(w.state.inventory,[green]);assert.deepEqual(w.equipped('hero','weapon'),equipped);assert.equal(w.sellItems(items.map(i=>i.uid)),false);assert.equal(w.state.money,200+total);
});
test('所有剑与白色的剑使用同一筛选规则，品质和武器类型取交集',()=>{
 const w=create(),white=w.addItem('weapon-sword'),green=w.addItem('weapon-sword','green'),blade=w.addItem('weapon-blade');assert.deepEqual(I.select(w.state.inventory,{slot:'weapon',types:['sword']}).map(i=>i.uid),[green.uid,white.uid]);const items=I.select(w.state.inventory,{qualities:['white'],slot:'weapon',types:['sword']});assert.deepEqual(items,[white]);assert.equal(w.sellItems(items.map(i=>i.uid)).count,1);assert.deepEqual(w.state.inventory,[green,blade]);
});
test('批量交易整批校验，过期选择、已穿戴装备和战斗中操作均不能部分出售',()=>{
 const w=create(),a=w.addItem('weapon-sword'),before=w.snapshot();assert.equal(w.sellItems([a.uid,'missing-item']),false);assert.deepEqual(w.snapshot(),before);assert.equal(w.sellItems([w.equipped('hero','weapon').uid]),false);assert.equal(w.sellItems([]),false);w.pending={kind:'training'};assert.equal(w.sellItems([a.uid]),false);w.pending=null;w.journey={from:'camp',to:'changshan'};assert.equal(w.sellItems([a.uid]),false);w.journey=null;assert.deepEqual(w.sellItems([a.uid,a.uid]),{count:1,money:I.sellPrice(a)});assert.equal(w.state.money,200+I.sellPrice(a));
});
