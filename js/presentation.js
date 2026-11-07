(function(root){
  'use strict';
  const formatNumber=n=>String(Math.floor(Number(n)||0));
  const DAMAGE_COLORS={physical:'#ff5b51',tactic:'#c28aff',true:'#ffffff'};
  const resultColor=result=>result.healing?'#8ceba5':result.miss?'#d5dbcb':DAMAGE_COLORS[result.damageType]||DAMAGE_COLORS.physical;
  const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
  const mix=(a,b,t)=>a+(b-a)*ease(t);
  class HealthTrack{
    constructor(value,max,now=0){this.max=Math.max(1,max);this.target=value;this.from=value;this.trailFrom=value;this.started=now;this.healing=false;}
    set(value,now){const current=this.sample(now);this.from=current.value;this.target=Math.max(0,Math.min(this.max,value));this.healing=this.target>this.from;this.trailFrom=Math.max(current.trail,current.value,this.target);this.started=now;}
    sample(now){const elapsed=Math.max(0,now-this.started),value=mix(this.from,this.target,elapsed/(this.healing?420:125));
      const trail=this.healing?this.target:mix(this.trailFrom,this.target,(elapsed-160)/420);
      return {value,trail:Math.max(value,trail),healing:this.healing&&elapsed<420,settled:elapsed>=580};}
  }
  class ExperienceTrack{
    constructor(gain,{required,maxLevel=Infinity}={}){
      this.segments=[];this.duration=0;this.required=required;this.maxLevel=maxLevel;this.before=gain.before;
      const add=(level,from,to,duration,phase)=>{this.segments.push({level,from,to,start:this.duration,duration,phase});this.duration+=duration;};
      let level=gain.before,xp=Number(gain.experienceBefore)||0;
      while(level<gain.after&&level<maxLevel){const need=required(level);add(level,xp,need,620,'fill');add(level,need,need,180,'full');level++;xp=0;add(level,0,0,100,'reset');}
      const final=Number(gain.experienceAfter)||0;add(level,xp,final,xp===final?0:620,'fill');
      this.final={level,xp:final,need:required(level)};
    }
    sample(elapsed){
      elapsed=Math.max(0,elapsed);const segment=this.segments.find(s=>elapsed<s.start+s.duration);
      if(!segment){const {level,xp,need}=this.final;return{level,xp,need,fraction:need===Infinity?1:xp/need,trail:need===Infinity?1:xp/need,phase:'done',done:true};}
      const t=(elapsed-segment.start)/segment.duration,xp=mix(segment.from,segment.to,t),need=this.required(segment.level),fraction=need===Infinity?1:xp/need;
      return{level:segment.level,xp,need,fraction,trail:need===Infinity?1:Math.min(1,(xp+(segment.to-xp)*.4)/need),phase:segment.phase,done:false};
    }
  }
  function idlePose(unit,now){
    if(unit.mode!=='auto'||unit.soldiers<=0)return{x:0,y:0,angle:0,scale:1};
    const phase=now*.0016+(unit.order||0)*.77;
    return{x:Math.sin(phase*.7)*.65,y:Math.sin(phase)*1.5,angle:Math.sin(phase*.65)*.003,scale:1+Math.sin(phase)*.003};
  }
  function enemyDefeatPose(elapsed){const t=Math.max(0,Math.min(1,elapsed/500)),progress=ease(t);return{alpha:1-progress,sink:12*progress,scale:1-.035*progress,finished:t>=1};}
  class FrameStats {
    constructor(){this.samples=[];this.count=0;this.last=0;}
    add(total,logic,paint,gap,now){this.samples.push({total,logic,paint,gap});if(this.samples.length>600)this.samples.shift();this.count++;if(now-this.last<1000)return null;this.last=now;const pick=key=>this.samples.map(s=>s[key]).sort((a,b)=>a-b),p=(a,q)=>Number(a[Math.min(a.length-1,Math.floor(a.length*q))].toFixed(2));const cpu=pick('total'),draw=pick('paint'),gaps=pick('gap');return{frames:this.count,samples:cpu.length,cpuP50:p(cpu,.5),cpuP95:p(cpu,.95),paintP95:p(draw,.95),gapP95:p(gaps,.95),slowFrames:this.samples.filter(s=>s.total>16.7).length};}
  }
  const sliderValue=(x,left,width,max)=>Math.max(0,Math.min(max,Math.round((x-left)/Math.max(1,width)*max)));
  function addFloat(floats,entry){const used=new Set(floats.filter(f=>f.id===entry.id&&entry.born-f.born<1100).map(f=>f.lane));let lane=0;while(used.has(lane))lane++;const next={...entry,lane};floats.push(next);return next;}
  const api={addFloat,formatNumber,DAMAGE_COLORS,resultColor,HealthTrack,ExperienceTrack,idlePose,enemyDefeatPose,FrameStats,sliderValue};root.BattlePresentation=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
