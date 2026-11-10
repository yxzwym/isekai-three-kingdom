(function(root){
 'use strict';
 function plan(width,top,bottom,count,page=0){
  if(count<=0)return {page:0,pages:1,start:0,shown:0,columns:0,rows:0,rects:[],more:null,pager:null};
  const gap=12,columns=Math.max(1,Math.min(count,count<=6?3:4,Math.floor((width-20)/(104+gap)))),space=Math.max(1,bottom-top),minH=124;
  let capacity=columns*Math.max(1,Math.floor((space+gap)/(minH+gap))),paged=count>capacity;
  if(paged)capacity=columns*Math.max(1,Math.floor((space-40+gap)/(minH+gap)));
  const pages=Math.max(1,Math.ceil(count/capacity)),current=Math.max(0,Math.min(pages-1,Math.floor(page)||0)),start=current*capacity,shown=Math.min(capacity,count-start),rows=Math.ceil(shown/columns),cardWidth=Math.min(142,(width-32-gap*(columns-1))/columns),rowHeight=Math.max(1,Math.min(cardWidth*1.15+26,(space-(paged?40:0)-gap*(rows-1))/rows)),gridWidth=columns*cardWidth+gap*(columns-1);
  return {page:current,pages,start,shown,columns,rows,rects:Array.from({length:shown},(_,i)=>({index:start+i,x:(width-gridWidth)/2+i%columns*(cardWidth+gap),y:top+Math.floor(i/columns)*(rowHeight+gap),w:cardWidth,h:rowHeight})),more:null,pager:paged?{y:bottom-32}:null};
 }
 const api={plan};root.TownLayout=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
