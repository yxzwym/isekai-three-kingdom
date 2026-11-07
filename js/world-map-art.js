(function(root){
 'use strict';
 const textureSource='./assets/map/terrain-v1.webp',buildingSource='./assets/map/settlements-v1.webp';
 function texture(atlas,index,size=512){const tile=document.createElement('canvas');tile.width=tile.height=size;const c=tile.getContext('2d'),half=size/2;for(let row=0;row<2;row++)for(let col=0;col<2;col++){c.save();c.translate(col?size:0,row?size:0);c.scale(col?-1:1,row?-1:1);c.drawImage(atlas,index%3*atlas.naturalWidth/3,Math.floor(index/3)*atlas.naturalHeight/2,atlas.naturalWidth/3,atlas.naturalHeight/2,0,0,half,half);c.restore();}return tile;}
 function ocean(view,region={x:0,y:0,w:view.w,h:view.h}){const atlas=view.image(textureSource),c=view.ctx;if(!atlas)return;c.save();const tile=view.oceanTile||(view.oceanTile=texture(atlas,5)),origin=view.screen({x:0,y:0});c.translate(origin.x,origin.y);c.scale(view.zoom,view.zoom);c.fillStyle=c.createPattern(tile,'repeat');c.fillRect((region.x-origin.x)/view.zoom,(region.y-origin.y)/view.zoom,region.w/view.zoom,region.h/view.zoom);c.restore();}
 function terrain(view,D){
  if(view.terrainCache)return view.terrainCache;const atlas=view.image(textureSource),scale=D.geography.rasterScale,canvas=document.createElement('canvas');canvas.width=D.bounds.width*scale;canvas.height=D.bounds.height*scale;const c=canvas.getContext('2d');c.scale(scale,scale);
  if(!atlas){c.fillStyle='#345f62';c.fillRect(0,0,D.bounds.width,D.bounds.height);return canvas;}
  const tiles=Array.from({length:6},(_,i)=>texture(atlas,i)),patterns=tiles.map(t=>c.createPattern(t,'repeat')),land=()=>{c.beginPath();for(const mass of D.geography.landmasses){mass.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}};
  c.fillStyle=patterns[5];c.fillRect(0,0,D.bounds.width,D.bounds.height);
  land();c.save();c.shadowColor='#061f24';c.shadowBlur=18;c.shadowOffsetY=5;c.fillStyle='#9f9669';c.fill();c.restore();
  c.save();land();c.clip();c.fillStyle=patterns[0];c.fillRect(0,0,D.bounds.width,D.bounds.height);
  const patch=(index,lon,lat,r,opacity=1)=>{
   const p=D.geography.project(lon,lat),layer=document.createElement('canvas');layer.width=layer.height=Math.ceil(r*2*scale);const lc=layer.getContext('2d');lc.scale(scale,scale);lc.fillStyle=lc.createPattern(tiles[index],'repeat');lc.fillRect(0,0,r*2,r*2);lc.globalCompositeOperation='destination-in';const g=lc.createRadialGradient(r,r,r*.22,r,r,r);g.addColorStop(0,'#000');g.addColorStop(1,'#0000');lc.fillStyle=g;lc.fillRect(0,0,r*2,r*2);c.save();c.globalAlpha=opacity;c.drawImage(layer,p.x-r,p.y-r,r*2,r*2);c.restore();
  };
  patch(2,96,40,1250);patch(2,103,41,950);patch(4,101,32,850);patch(4,105,31,720,.85);patch(4,110,36,500,.55);patch(4,118,28,650,.48);
  patch(1,107,26,800,.65);patch(1,115,27,1000,.7);patch(1,121,30,600,.5);patch(1,128,39,600,.6);patch(1,135,35,850,.65);patch(1,140,39,800,.7);
  patch(3,115,46,1200);patch(3,124,45,900);patch(3,143,44,650,.8);
  for(const river of D.geography.rivers){const points=river.points.map(p=>D.geography.project(...p));c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineJoin=c.lineCap='round';c.save();c.shadowBlur=5;c.shadowColor='#182d28';c.strokeStyle='#777e5b90';c.lineWidth=river.name==='Yangtze'?9:6;c.stroke();c.restore();c.strokeStyle='#527d7e';c.lineWidth=river.name==='Yangtze'?4.5:2.5;c.stroke();}
  c.restore();view.terrainCache=canvas;return canvas;
 }
 function settlement(view,node,p,{current,selected,available,suggested,size=36}){
  const c=view.ctx,img=view.image(buildingSource),index=node.kind==='city'?0:node.kind==='camp'?3:node.kind==='pass'?4:node.kind==='port'?5:node.kind==='village'?2:1,x=p.x-size/2,y=p.y-size;
  if(current||selected||available){c.save();const g=c.createRadialGradient(p.x,p.y-3,0,p.x,p.y-3,size*.7);g.addColorStop(0,current?'#ffda7c80':selected?'#d0b5ed80':'#f8e2a94d');g.addColorStop(1,'#ffda7c00');c.fillStyle=g;c.fillRect(x-size*.25,y-size*.1,size*1.5,size*1.5);c.restore();}
  if(img)c.drawImage(img,index%4*img.naturalWidth/4,Math.floor(index/4)*img.naturalHeight/2,img.naturalWidth/4,img.naturalHeight/2,x,y,size,size);
 }
 function locator(view,p,now){
  if(!view.locatorSprite){const canvas=document.createElement('canvas');canvas.width=160;canvas.height=176;const c=canvas.getContext('2d');c.scale(2,2);c.translate(40,72);const glow=c.createRadialGradient(0,0,2,0,0,30);glow.addColorStop(0,'#ffe2a075');glow.addColorStop(1,'#ffe2a000');c.fillStyle=glow;c.fillRect(-32,-32,64,64);c.strokeStyle='#172b2b';c.lineWidth=5;c.beginPath();c.ellipse(0,0,24,9,0,0,Math.PI*2);c.stroke();c.strokeStyle='#f9d886';c.lineWidth=2;c.stroke();c.strokeStyle='#fff0b9';c.lineWidth=1;c.beginPath();c.ellipse(0,0,18,6,0,0,Math.PI*2);c.stroke();for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){c.beginPath();c.moveTo(Math.cos(angle)*25,Math.sin(angle)*9);c.lineTo(Math.cos(angle)*30,Math.sin(angle)*12);c.stroke();}c.translate(0,-64);c.shadowColor='#fff0aa';c.shadowBlur=8;c.fillStyle='#ffe3a0';c.strokeStyle='#122b31';c.lineWidth=2;c.beginPath();c.moveTo(0,8);c.lineTo(-8,-3);c.lineTo(0,0);c.lineTo(8,-3);c.closePath();c.fill();c.stroke();view.locatorSprite=canvas;}
  const c=view.ctx;c.save();c.globalAlpha=.82+.15*Math.sin(now*.003);c.drawImage(view.locatorSprite,p.x-40,p.y-72,80,88);c.restore();
 }
 const api={textureSource,buildingSource,terrain,settlement,ocean,locator};root.WorldMapArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
