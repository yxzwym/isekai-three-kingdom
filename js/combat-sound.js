(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,F=node?require('./battle-foley.js'):root.BattleFoley,RATE=22050,TAU=Math.PI*2;
 function random(key){let n=5917;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296*2-1;};}
 function tail(wave,kind){const physical=['physical','pierce','blunt','arrow','critical','earth'].includes(kind),extra=physical?.78:1.05,src=wave.data,data=new Float32Array(src.length+Math.ceil(extra*RATE)),taps=physical?[[.043,.12],[.079,.1],[.131,.075],[.197,.06],[.293,.045],[.419,.03],[.613,.02]]:[[.061,.12],[.109,.11],[.173,.09],[.257,.075],[.367,.06],[.503,.045],[.701,.032],[.907,.02]];data.set(src);let low=0;const alpha=1-Math.exp(-TAU*(physical?1900:2800)/RATE);for(let i=0;i<data.length;i++){let wet=0;for(const [delay,gain]of taps)wet+=(src[i-Math.round(delay*RATE)]||0)*gain;low+=alpha*(wet-low);data[i]=Math.tanh((data[i]+low)*.88)*Math.min(1,(data.length-i)/250);}return {data,sampleRate:RATE,duration:data.length/RATE};}
 function effect(key){const kind=key.split('-')[0],all=key.endsWith('-all'),foley=F.effect(key);if(foley)return tail(foley,kind);if(!['heal','thunder'].includes(kind))return null;
  const rng=random(key),duration=kind==='heal'?(all?1.85:1.65):(all?1.65:1.4),data=new Float32Array(Math.ceil(duration*RATE));let low=0,rumble=0;
  for(let i=0;i<data.length;i++){const t=i/RATE,noise=rng();low+=.22*(noise-low);rumble+=.024*(noise-rumble);let value=0;
   if(kind==='heal'){const attack=1-Math.exp(-t*9),env=attack*Math.exp(-t*2.1),breathe=1+.045*Math.sin(TAU*3.7*t);for(const [f,g]of [[220,.31],[277.18,.25],[329.63,.23],[440,.12],[554.37,.07],[659.26,.055]]){const phase=TAU*f*t+.012*Math.sin(TAU*4.1*t);value+=(Math.sin(phase)+.12*Math.sin(phase*2)+.035*Math.sin(phase*3))*g*env*breathe;}value+=(noise-low)*.014*env;value+=Math.sin(TAU*1318.5*t)*.035*(1-Math.exp(-t*5))*Math.exp(-t*3);}
   else{const arc=Math.exp(-Math.pow((t-.025)/.019,2))+.72*Math.exp(-Math.pow((t-.118)/.041,2))+.48*Math.exp(-Math.pow((t-.267)/.059,2));const zap=Math.sin(TAU*(780*t+490*t*t)+2.2*Math.sin(TAU*63*t));value=(noise-low)*arc*.38+zap*arc*.15+low*.8*arc;const envelope=(1-Math.exp(-t*28))*Math.exp(-t*3.1);value+=(rumble*3.6+.13*Math.sin(TAU*57*t)*Math.exp(-t*5))*envelope;if(all)value+=low*.3*Math.exp(-Math.pow((t-.39)/.11,2));}
   data[i]=Math.tanh(value)*.78*Math.min(1,t*800)*Math.min(1,(duration-t)*60);
  }return tail({data,sampleRate:RATE,duration},kind);
 }
 const api={effect,tail};root.CombatSound=api;if(node)module.exports=api;
})(globalThis);
