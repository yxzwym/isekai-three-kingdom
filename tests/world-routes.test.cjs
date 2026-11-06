const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/world-data.js'),{World,shortestRoute,neighbors}=require('../js/world.js'),R=require('../js/game-rules.js');
const make=()=>new World({name:'行客',...R.rollHero('normal',()=>.4)});

test('地图地标落在对应陆地，辽东不落海中，大陆道路全程不跨海',()=>{
  for(const p of D.places){assert.ok(D.geography.isLand(p,p.landmass||'mainland'),p.name);assert.ok(p.x>0&&p.x<D.bounds.width&&p.y>0&&p.y<D.bounds.height,p.name);}
  for(const [a,b]of D.roads)for(let i=0;i<=80;i++)assert.ok(D.geography.isLand(D.roadPosition(a,b,i/80),'mainland'),a+' → '+b+' '+i);
  const p=D.placeMap['xiangping-county'];assert.equal(p.name,'辽隧');assert.ok(D.geography.isLand(p,'mainland',18));
});
test('朝鲜半岛与无双大蛇据点保留，水路未开放时不能移动或进入',()=>{
  const w=make(),before=w.snapshot();for(const id of ['lelang','hanseong','geumseong','yamatai','itsukushima','odawara','edo','osaka','odani']){
    assert.equal(D.placeMap[id].requiresWater,true);assert.equal(w.findRoute(id),null);assert.equal(w.planRoute(id).ok,false);assert.equal(w.beginTravel(id).ok,false);assert.deepEqual(neighbors(id),[]);assert.deepEqual(w.snapshot(),before);
  }
  w.state.nodeId='yamatai';assert.equal(w.enter(),false);assert.equal(w.state.inside,false);
});
test('自动寻路按道路总长度最短而非经过地标数，正反路径及每一段道路合法',()=>{
  // 独立的全边松弛校验，避免把待验证的寻路算法当作预期结果。
  for(const from of ['camp','xiangping','jiaozhi','yongchang']){
    const distances=Object.fromEntries(D.places.map(p=>[p.id,p.id===from?0:Infinity]));for(let i=1;i<D.places.length;i++){let changed=false;for(const [a,b]of D.roads){const len=D.roadLength(a,b);for(const [u,v]of [[a,b],[b,a]])if(distances[u]+len<distances[v]){distances[v]=distances[u]+len;changed=true;}}if(!changed)break;}
    for(const to of D.cityIds){const route=shortestRoute(from,to);assert.equal(route.nodes[0],from);assert.equal(route.nodes.at(-1),to);assert.ok(Math.abs(route.distance-distances[to])<1e-7);assert.ok(Math.abs(shortestRoute(to,from).distance-route.distance)<1e-7);assert.equal(new Set(route.nodes).size,route.nodes.length);for(let i=1;i<route.nodes.length;i++)assert.ok(neighbors(route.nodes[i-1]).includes(route.nodes[i]));}
  }
});
test('连续赶路逐段结算，风闻和路遇胜利后保留终点，抵达后自动结束',()=>{
  const w=make(),route=w.planRoute('chengdu');assert.ok(route.ok);assert.ok(route.nodes.length>3);let index=0;
  while(w.state.routeTarget){assert.equal(w.beginNextLeg({eventRoll:index===0?.1:index===1?0:.8}).ok,true);assert.equal(w.journey.to,route.nodes[index+1]);const event=w.travelEvent();
    if(index===0)assert.equal(event.kind,'rumor');if(index===1){assert.equal(event.kind,'battle');assert.equal(w.beginNextLeg().ok,false);assert.equal(w.finishTravel(),false);assert.equal(w.resolveBattle({result:'victory',units:[{id:'hero',side:'ally',soldiers:37}]}),true);assert.equal(w.state.nodeId,route.nodes[index]);assert.equal(w.state.routeTarget,'chengdu');}
    assert.equal(w.finishTravel(),true);assert.equal(w.state.nodeId,route.nodes[++index]);assert.equal(w.state.inside,false);
  }
  assert.equal(w.location().id,'chengdu');assert.equal(w.state.steps,route.nodes.length-1);assert.equal(w.state.troops.hero,Math.floor(37*w.members()[0].maxSoldiers/100));assert.equal(w.beginNextLeg().ok,false);assert.equal(w.state.routeTarget,null);
});
test('远程行程存档可重现下一段事件，战败取消行程并恢复该段出发状态',()=>{
  const w=make();w.planRoute('chengdu');w.beginNextLeg({eventRoll:.8});w.travelEvent();w.finishTravel();const snapshot=w.snapshot(),loaded=new World(w.character,snapshot);assert.deepEqual(loaded.findRoute(loaded.state.routeTarget),w.findRoute(w.state.routeTarget));w.beginNextLeg();loaded.beginNextLeg();assert.deepEqual(w.travelEvent(),loaded.travelEvent());
  const failed=new World(w.character,snapshot);failed.beginNextLeg({eventRoll:0});const checkpoint=failed.journey.checkpoint;failed.travelEvent();failed.resolveBattle({result:'defeat'});assert.deepEqual(failed.snapshot(),{...checkpoint,routeTarget:null});assert.equal(failed.journey,null);assert.equal(failed.pending,null);
});
test('停止行路仅取消后续路线，仍走完当前路段，刷新后不再恢复已取消行程',()=>{
  const w=make();w.planRoute('chengdu');w.beginNextLeg({eventRoll:.8});const destination=w.journey.to;w.cancelRoute();assert.equal(w.state.nodeId,'camp');assert.equal(w.journey.checkpoint.routeTarget,null);assert.equal(w.travelEvent().kind,'quiet');assert.equal(w.finishTravel(),true);assert.equal(w.state.nodeId,destination);assert.equal(w.state.routeTarget,null);assert.equal(new World(w.character,w.snapshot()).state.routeTarget,null);
});
