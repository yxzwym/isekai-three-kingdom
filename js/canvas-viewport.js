(function(root){
 'use strict';
 const width=360,height=640,maxRasterScale=4;
 function measure(rect,deviceRatio=1,maxDpr=2){
  const scale=Math.max(.001,Math.min(Math.max(1,Number(rect.width)||1)/width,Math.max(1,Number(rect.height)||1)/height));
  const ratio=Math.max(.1,Math.min(Number(deviceRatio)||1,Number(maxDpr)||2)),dpr=Math.min(maxRasterScale,scale*ratio);
  return {w:width,h:height,scale,dpr,pixelWidth:Math.max(1,Math.round(width*dpr)),pixelHeight:Math.max(1,Math.round(height*dpr))};
 }
 function resize(canvas,ctx,{maxDpr=2}={}){
  const view=measure(canvas.getBoundingClientRect(),root.devicePixelRatio||root.window?.devicePixelRatio||1,maxDpr);
  if(canvas.width!==view.pixelWidth)canvas.width=view.pixelWidth;if(canvas.height!==view.pixelHeight)canvas.height=view.pixelHeight;
  ctx.setTransform(view.dpr,0,0,view.dpr,0,0);return view;
 }
 function clientRect(bounds,rect){const scaleX=bounds.width/width,scaleY=bounds.height/height;return {left:bounds.left+rect.x*scaleX,top:bounds.top+rect.y*scaleY,width:rect.w*scaleX,height:rect.h*scaleY,scaleX,scaleY};}
 function point(bounds,event){return {x:(event.clientX-bounds.left)*width/bounds.width,y:(event.clientY-bounds.top)*height/bounds.height};}
 const api={width,height,measure,resize,clientRect,point};root.CanvasViewport=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
