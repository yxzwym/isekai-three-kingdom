const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/world-data.js'),L=require('../js/world-locations.js'),{World}=require('../js/world.js');

test('城池采用历史治所区域，玉门关、北平、天水等不再误用旧坐标',()=>{
  const regions={yumen:[93.8,94,40.3,40.4],beiping:[118,118.3,39.7,40],ji:[116.3,116.4,39.8,39.95],beihai:[118.7,118.9,36.6,36.8],langya:[118.25,118.5,35,35.25],tianshui:[105.3,105.5,34.65,34.85],wudu:[105.1,105.35,33.8,34.1],changshan:[114.4,114.65,38,38.2],hedong:[111.05,111.3,35.05,35.3],'jiangzhou-county':[107.9,108.2,30.2,30.4],hangu:[112,112.3,34.6,34.85]};
  for(const [id,[west,east,south,north]]of Object.entries(regions)){const p=D.placeMap[id];assert.ok(p.lon>=west&&p.lon<=east&&p.lat>=south&&p.lat<=north,p.name+'超出史迹所在区域');}
});
test('村县保持实际东西南北关系，辽隧不再生成于襄平以东',()=>{
  const p=D.placeMap;assert.ok(p['xiangping-county'].lon<p.xiangping.lon&&p['xiangping-county'].lat<p.xiangping.lat);
  assert.ok(p['beiping-county'].lat>p.beiping.lat);assert.ok(p['ji-county'].lat<p.ji.lat&&p['ji-county'].lon<p.ji.lon);
  assert.ok(p['jiangzhou-county'].lon>p.jiangzhou.lon+1);assert.ok(p.tianshui.lon<p['tianshui-county'].lon);assert.ok(p['hepu-county'].lat<p.hepu.lat-1);
  assert.ok(p['guiyang-county'].lat>p.guiyang.lat);assert.ok(p['yongan-county'].lon<p.yongan.lon);
});
test('参考经纬度保持不变，地图显示只做有界偏移，所有地点均有核对依据',()=>{
  for(const p of D.places){const recorded=L.locations[p.id];assert.ok(recorded?.source,p.id);assert.deepEqual({lon:p.lon,lat:p.lat},{lon:recorded.lon,lat:recorded.lat});assert.deepEqual({x:p.anchorX,y:p.anchorY},D.geography.project(p.lon,p.lat));assert.ok(Math.hypot(p.x-p.anchorX,p.y-p.anchorY)<=(p.kind==='city'?48:72)+1e-6);const back=D.geography.unproject({x:p.anchorX,y:p.anchorY});assert.ok(Math.abs(back.lon-p.lon)<1e-10&&Math.abs(back.lat-p.lat)<1e-10);}
  assert.ok(D.placeMap.yamatai.note.includes('有争议'));assert.ok(D.placeMap.camp.note.includes('虚构'));assert.ok(D.geography.bounds.width>D.placeMap.edo.x);assert.ok(D.placeMap.yumen.x>0);
});
test('同址附郭县合并后旧存档仍可载入，不丢生命、战术和连续行路终点',()=>{
  const character={name:'旧旅人'},w=new World(character,{version:3,nodeId:'yuexi-county',visited:['yuexi-county','jiaozhi-county'],routeTarget:'jiaozhi-county',introStep:2,troops:{hero:17},tactics:{hero:{targetRule:'random'}}});
  assert.equal(w.location().id,'yuexi');assert.equal(w.state.routeTarget,'jiaozhi');assert.ok(w.findRoute('jiaozhi'));assert.equal(w.state.troops.hero,17);assert.equal(w.state.tactics.hero.targetRule,'random');assert.ok(w.state.visited.includes('yuexi')&&w.state.visited.includes('jiaozhi'));
});
