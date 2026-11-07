(function(root){
 'use strict';
 function plan(width,top,bottom,count,page=0){
  if(count<=0)return {page:0,pages:1,start:0,shown:0,columns:0,rows:0,rects:[],more:null};
  const paged=count>15,pages=paged?Math.ceil(count/14):1,current=((Math.floor(page)||0)%pages+pages)%pages,start=paged?current*14:0,shown=Math.min(paged?14:15,count-start),columns=count<=6?Math.min(3,count):count<=12?4:5,slots=paged?15:shown,rows=Math.max(1,Math.ceil(slots/Math.max(1,columns))),gap=columns>=4?8:12,cardWidth=Math.min((width-38)/4,(width-32-gap*(columns-1))/Math.max(1,columns)),rowHeight=Math.min(cardWidth*1.16+30,(bottom-top-gap*(rows-1))/rows),gridWidth=columns*cardWidth+(columns-1)*gap;
  const rect=index=>({x:(width-gridWidth)/2+index%columns*(cardWidth+gap),y:top+Math.floor(index/columns)*(rowHeight+gap),w:cardWidth,h:Math.max(36,rowHeight)});
  return {page:current,pages,start,shown,columns,rows,rects:Array.from({length:shown},(_,i)=>({...rect(i),index:start+i})),more:paged?rect(14):null};
 }
 const api={plan};root.TownLayout=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
