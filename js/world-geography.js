(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,data=node?require('./world-land.js'):root.WorldLandData;
  // 地点保留地理参考坐标，地图布局在投影后小幅避让；地形不随缩放改变。
  const project=(lon,lat)=>({x:100+(lon-90)*105,y:100+(47-lat)*125}),unproject=({x,y})=>({lon:90+(x-100)/105,lat:47-(y-100)/125});
  const landmasses=data.landmasses.map(({id,outline})=>{const points=outline.map(([lon,lat])=>project(lon,lat));return {id,outline,points,bounds:{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))}};});
  function contains(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
  function edgeDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function isLand(p,id,margin=0){
    if(id==='korea')id='mainland';
    return landmasses.some(m=>(!id||m.id===id)&&p.x>=m.bounds.minX&&p.x<=m.bounds.maxX&&p.y>=m.bounds.minY&&p.y<=m.bounds.maxY&&contains(p,m.points)&&(!margin||m.points.every((a,i)=>edgeDistance(p,a,m.points[(i+1)%m.points.length])>=margin)));
  }
  const api={project,unproject,landmasses,isLand,rivers:data.rivers,rasterScale:.6,bounds:{width:6200,height:4000},source:data.source};root.WorldGeography=api;if(node)module.exports=api;
})(globalThis);
