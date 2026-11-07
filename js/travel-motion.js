(function(root){
 'use strict';
 const MIN=1,MAX=3,ACCELERATION=.5;
 // 返回本帧积分后的基础行路时间。到达上限的帧分两段积分，不随帧率改变路程。
 function advance(rate,elapsedMs,enabled=true){const ms=Math.max(0,Number(elapsedMs)||0);if(!enabled)return {rate:MIN,distanceMs:ms};const before=Math.max(MIN,Math.min(MAX,Number(rate)||MIN)),seconds=ms/1000,ramp=Math.min(seconds,(MAX-before)/ACCELERATION),after=Math.min(MAX,before+ACCELERATION*ramp);return {rate:after,distanceMs:1000*((before+after)*ramp/2+MAX*(seconds-ramp))};}
 const api={MIN,MAX,ACCELERATION,advance};root.TravelMotion=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
