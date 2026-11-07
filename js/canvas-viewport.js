(function(root){
 'use strict';
 const width=540,height=960,maxPixelWidth=1440;
 function logicalSize(rect){return rect.width<480?{w:405,h:720}:{w:width,h:height};}
 function measure(rect,deviceRatio=1,maxDpr=2){
  const {w,h}=logicalSize(rect),scale=Math.max(.001,Math.min(Math.max(1,Number(rect.width)||1)/w,Math.max(1,Number(rect.height)||1)/h));
  const ratio=Math.max(.1,Math.min(Number(deviceRatio)||1,Number(maxDpr)||2)),dpr=Math.min(maxPixelWidth/w,scale*ratio);
  return {w,h,scale,dpr,pixelWidth:Math.max(1,Math.round(w*dpr)),pixelHeight:Math.max(1,Math.round(h*dpr))};
 }
 function resize(canvas,ctx,{maxDpr=2}={}){
  const view=measure(canvas.getBoundingClientRect(),root.devicePixelRatio||root.window?.devicePixelRatio||1,maxDpr);
  if(canvas.width!==view.pixelWidth)canvas.width=view.pixelWidth;if(canvas.height!==view.pixelHeight)canvas.height=view.pixelHeight;
  ctx.setTransform(view.dpr,0,0,view.dpr,0,0);return view;
 }
 function clientRect(bounds,rect){const {w,h}=logicalSize(bounds),scaleX=bounds.width/w,scaleY=bounds.height/h;return {left:bounds.left+rect.x*scaleX,top:bounds.top+rect.y*scaleY,width:rect.w*scaleX,height:rect.h*scaleY,scaleX,scaleY};}
 function point(bounds,event){const {w,h}=logicalSize(bounds);return {x:(event.clientX-bounds.left)*w/bounds.width,y:(event.clientY-bounds.top)*h/bounds.height};}
 const api={width,height,logicalSize,measure,resize,clientRect,point};root.CanvasViewport=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
