(function(root){
  'use strict';
  const majorCities=['luoyang','changan','chengdu','jianye','xuchang','ye','xiangyang','hanzhong','jinyang','wuwei','changsha','jiangzhou','nanhai','xiangping','yongchang','jiaozhi','jianning','shouchun','kuaiji','beiping','yamatai','edo','osaka'];
  const rank=p=>{const i=majorCities.indexOf(p.id);return i>=0?100-i:p.kind==='city'?40:p.kind==='camp'?30:p.kind==='pass'?20:p.kind==='port'?15:10;};
  const minZoom=p=>majorCities.includes(p.id)?0:p.kind==='city'?.34:p.kind==='village'?1.12:.86;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  function arrange(places,geography){
    const placed=[],segments=geography.rivers.flatMap(r=>r.points.slice(1).map((p,i)=>[geography.project(...r.points[i]),geography.project(...p)]));
    const lineClear=(a,b,id)=>{const steps=Math.max(1,Math.ceil(distance(a,b)/6));for(let i=0;i<=steps;i++)if(!geography.isLand({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},id))return false;return true;};
    const riverDistance=p=>Math.min(...segments.map(([a,b])=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}));
    for(const p of [...places].sort((a,b)=>rank(b)-rank(a)||(a.id<b.id?-1:1))){
      const anchor=geography.project(p.lon,p.lat),preferred=p.id==='jianye'?{x:anchor.x,y:anchor.y+32}:anchor,maxShift=p.kind==='city'?48:72,land=p.landmass||'mainland';
      const candidates=[preferred];for(let radius=4;radius<=maxShift;radius+=4)for(let i=0;i<32;i++){const angle=i*Math.PI/16;candidates.push({x:anchor.x+Math.cos(angle)*radius,y:anchor.y+Math.sin(angle)*radius});}
      candidates.sort((a,b)=>distance(a,preferred)-distance(b,preferred));
      let best=null,bestClearance=-Infinity;
      for(const q of candidates){
        if(p.id==='jianye'&&(q.y<anchor.y+28||riverDistance(q)<24))continue;
        if(!lineClear(anchor,q,land))continue;
        const clearance=Math.min(Infinity,...placed.map(other=>distance(q,other)-(p.kind==='city'&&other.kind==='city'?72:46)));
        if(clearance>bestClearance){best=q;bestClearance=clearance;}
        if(clearance>=0){best=q;break;}
      }
      Object.assign(p,best||anchor,{anchorX:anchor.x,anchorY:anchor.y});placed.push(p);
    }
    return places;
  }

  function visibleAt(p,zoom,{current,selected,quests=new Set(),near=new Set()}={}){
    return quests.has(p.id)||p.id===current||p.id===selected||zoom>=minZoom(p)||(zoom>=.55&&near.has(p.id));
  }
  function planView(places,{zoom,toScreen,viewport,current,selected,suggested,quests=new Set(),near=new Set(),textWidth}){
    const priority=p=>p.id===current?1000:p.id===selected?900:p.id===suggested?800:quests.has(p.id)?750:near.has(p.id)?500+rank(p):rank(p),intersects=b=>b.x<viewport.x+viewport.w&&b.x+b.w>viewport.x&&b.y<viewport.y+viewport.h&&b.y+b.h>viewport.y;
    return places.filter(p=>visibleAt(p,zoom,{current,selected,quests,near})).map(node=>{
      const p=toScreen(node),important=quests.has(node.id)||node.id===current||node.id===selected||near.has(node.id),size=node.kind==='city'?40:node.kind==='camp'?44:34,icon={x:p.x-size/2-4,y:p.y-size-4,w:size+8,h:size+8},width=textWidth(node.name)+12,label={x:p.x-width/2,y:icon.y-27,w:width,h:22};
      return {node,p,priority:priority(node),important,size,icon,label};
    }).filter(e=>intersects(e.icon)||intersects(e.label)).sort((a,b)=>b.priority-a.priority||(a.node.id<b.node.id?-1:1));
  }
  const api={arrange,visibleAt,planView,minZoom,majorCities};root.WorldMapLayout=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
