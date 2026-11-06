const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/world-data.js'),L=require('../js/world-locations.js'),{World}=require('../js/world.js'),layout=D.mapLayout;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

test('地图地点只小幅错开，建业落在长江南侧且避开河流笔画',()=>{
  const p=D.placeMap.jianye;assert.ok(p.y>p.anchorY+24);let distance=Infinity;
  for(const river of D.geography.rivers.filter(r=>r.name==='Yangtze'))for(let i=1;i<river.points.length;i++){const a=D.geography.project(...river.points[i-1]),b=D.geography.project(...river.points[i]),dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));distance=Math.min(distance,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}assert.ok(distance>20);
  for(let i=0;i<D.places.length;i++)for(let j=i+1;j<D.places.length;j++){const a=D.places[i],b=D.places[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=46-1e-6,a.name+'与'+b.name+'挤在一起');}
});
test('拉远只有主要城市，放大后依次出现其他城池和乡县，当前位置始终保留',()=>{
  assert.ok(layout.visibleAt(D.placeMap.luoyang,.15));assert.equal(layout.visibleAt(D.placeMap['luoyang-county'],.15),false);assert.equal(layout.visibleAt(D.placeMap.julu,.15),false);assert.ok(layout.visibleAt(D.placeMap.julu,.6));assert.equal(layout.visibleAt(D.placeMap['luoyang-county'],.6),false);assert.ok(layout.visibleAt(D.placeMap['luoyang-county'],1.3));
  assert.ok(layout.visibleAt(D.placeMap.camp,.1,{current:'camp'}));assert.ok(layout.visibleAt(D.placeMap.changshan,.82,{near:new Set(['changshan'])}));assert.equal(layout.visibleAt(D.placeMap.changshan,.15,{near:new Set(['changshan'])}),false);
});
test('中原多种尺寸和缩放只投影地点，名称保持固定锚点，遮挡不重排',()=>{
 const original=D.places.map(p=>[p.id,p.x,p.y]),center=D.geography.project(114.5,35.5);
 for(const width of [320,375,430,1000])for(const zoom of [.15,.4,.82,1.3,2.4,3.6]){
  const viewport={x:12,y:68,w:width-24,h:500},toScreen=p=>({x:width/2+(p.x-center.x)*zoom,y:318+(p.y-center.y)*zoom}),entries=layout.planView(D.places,{zoom,viewport,toScreen,textWidth:s=>s.length*14,obstacles:[viewport]});
  for(const e of entries){assert.deepEqual(e.p,toScreen(e.node));assert.equal(e.label.x+e.label.w/2,e.p.x);assert.equal(e.label.y,e.p.y-e.size-31);}
 }assert.deepEqual(D.places.map(p=>[p.id,p.x,p.y]),original);
});
test('缩放、平移和选中地点都不更换名称方位或相对偏移',()=>{
 const places=[{id:'luoyang',name:'洛阳',kind:'city',x:-160,y:0},{id:'ye',name:'邺城',kind:'city',x:160,y:0}],offsets=new Map();
 for(const zoom of [.4,.6,.82,1.119,1.12,1.3,2.4])for(const selected of [undefined,'ye']){
  const entries=layout.planView(places,{zoom,selected,current:'luoyang',viewport:{x:0,y:0,w:1600,h:1000},toScreen:p=>({x:800+p.x*zoom+zoom*10,y:500+p.y*zoom+zoom*7}),textWidth:s=>s.length*14});assert.equal(entries.length,2);
  for(const e of entries){const offset=[e.label.x+e.label.w/2-e.p.x,e.label.y-e.p.y,e.size];if(offsets.has(e.node.id))assert.deepEqual(offset,offsets.get(e.node.id));else offsets.set(e.node.id,offset);assert.ok(e.label.y+e.label.h<e.icon.y);}
 }
});
test('拥挤和界面遮挡不隐藏或搬移标签，屏幕边缘保留半个图标及名称',()=>{
 const places=[{id:'luoyang',name:'洛阳',kind:'city',x:250,y:250},{id:'ye',name:'邺城',kind:'city',x:250,y:180}],viewport={x:0,y:0,w:500,h:500},options={zoom:1,current:'luoyang',viewport,toScreen:p=>p,textWidth:s=>s.length*14,obstacles:[viewport]},entries=layout.planView(places,options);
 assert.deepEqual(entries.map(e=>e.node.id),['luoyang','ye']);assert.ok(overlap(entries[0].label,entries[1].icon));assert.equal(entries[0].label.y,179);
 for(const point of [{x:-1,y:180},{x:501,y:180},{x:250,y:61},{x:250,y:520}]){const edge=layout.planView([{...places[0],...point}],options);assert.equal(edge.length,1);assert.equal(edge[0].label.x,point.x-edge[0].label.w/2);assert.equal(edge[0].label.y,point.y-71);}
});
test('台湾海南只保留岛屿，无地点、点击入口或路线，旧无效岛屿位置回到营外',()=>{
  for(const id of ['taiwan','zhuya']){assert.equal(D.placeMap[id],undefined);assert.equal(L.locations[id],undefined);const w=new World({name:'旅人'},{version:3,nodeId:id,inside:true,troops:{hero:17},routeTarget:id});assert.equal(w.location().id,'camp');assert.equal(w.state.inside,false);assert.equal(w.state.routeTarget,null);assert.equal(w.state.troops.hero,17);assert.equal(w.planRoute(id).ok,false);}
  for(const id of ['taiwan','hainan'])assert.ok(D.geography.landmasses.some(m=>m.id===id));
});
