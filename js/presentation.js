(function(root){
  'use strict';
  const formatNumber=n=>String(Math.floor(Number(n)||0));
  const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
  const mix=(a,b,t)=>a+(b-a)*ease(t);
  class HealthTrack{
    constructor(value,max,now=0){this.max=Math.max(1,max);this.target=value;this.from=value;this.trailFrom=value;this.started=now;this.healing=false;}
    set(value,now){const current=this.sample(now);this.from=current.value;this.target=Math.max(0,Math.min(this.max,value));this.healing=this.target>this.from;this.trailFrom=Math.max(current.trail,current.value,this.target);this.started=now;}
    sample(now){const elapsed=Math.max(0,now-this.started),value=mix(this.from,this.target,elapsed/(this.healing?420:125));
      const trail=this.healing?this.target:mix(this.trailFrom,this.target,(elapsed-160)/420);
      return {value,trail:Math.max(value,trail),healing:this.healing&&elapsed<420,settled:elapsed>=580};}
  }
  function idlePose(unit,now){
    if(unit.mode!=='auto'||unit.soldiers<=0)return{x:0,y:0,angle:0,scale:1};
    const phase=now*.0016+(unit.order||0)*.77;
    return{x:Math.sin(phase*.7)*.65,y:Math.sin(phase)*1.5,angle:Math.sin(phase*.65)*.003,scale:1+Math.sin(phase)*.003};
  }
  class FrameStats {
    constructor(){this.samples=[];this.count=0;this.last=0;}
    add(total,logic,paint,gap,now){this.samples.push({total,logic,paint,gap});if(this.samples.length>600)this.samples.shift();this.count++;if(now-this.last<1000)return null;this.last=now;const pick=key=>this.samples.map(s=>s[key]).sort((a,b)=>a-b),p=(a,q)=>Number(a[Math.min(a.length-1,Math.floor(a.length*q))].toFixed(2));const cpu=pick('total'),draw=pick('paint'),gaps=pick('gap');return{frames:this.count,samples:cpu.length,cpuP50:p(cpu,.5),cpuP95:p(cpu,.95),paintP95:p(draw,.95),gapP95:p(gaps,.95),slowFrames:this.samples.filter(s=>s.total>16.7).length};}
  }
  const sliderValue=(x,left,width,max)=>Math.max(0,Math.min(max,Math.round((x-left)/Math.max(1,width)*max)));
  const api={formatNumber,HealthTrack,idlePose,FrameStats,sliderValue};root.BattlePresentation=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
