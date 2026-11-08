(function(root){
  'use strict';
  const S=typeof module!=='undefined'&&module.exports?require('./settings.js'):root.GameSettings;
  const RATE=22050,TAU=Math.PI*2,frequency=midi=>440*Math.pow(2,(midi-69)/12);
  const THEMES={
    menu:{name:'初入异界',bpm:72,root:50,scale:[0,2,4,7,9],melody:[4,null,5,4,2,null,1,2,0,null,2,4,5,null,4,2,1,2,4,null,2,1,0,null,2,4,5,7,5,4,2,null]},
    story:{name:'陌路微光',bpm:70,root:50,scale:[0,2,5,7,10],melody:[2,null,1,0,null,2,3,null,4,3,2,null,1,0,null,null,0,1,2,4,3,null,2,1,2,null,0,null,1,0,null,null]},
    camp:{name:'灯火人间',bpm:78,root:48,scale:[0,2,4,7,9],melody:[0,2,3,null,4,3,2,null,1,2,4,3,2,null,0,null,2,3,4,5,4,2,1,null,0,1,2,null,1,0,null,null]},
    map:{name:'山河行旅',bpm:90,root:50,scale:[0,2,4,7,9],melody:[0,2,4,5,4,null,3,2,1,2,3,4,2,null,0,null,3,4,5,7,5,4,2,3,4,null,2,1,2,0,null,null]},
    dream:{name:'云外问道',bpm:60,root:50,scale:[0,2,5,7,10],melody:[4,null,null,3,2,null,0,null,1,null,2,null,4,null,null,null,5,null,4,null,3,null,2,1,0,null,null,1,2,null,null,null]},
    battle:{name:'风起战尘',bpm:112,root:50,scale:[0,3,5,7,10],combat:true,melody:[0,2,3,4,3,2,0,null,2,3,4,5,4,2,3,null,4,5,7,5,4,3,2,0,2,4,3,2,1,0,null,null]},
    boss:{name:'虎啸关山',bpm:124,root:43,scale:[0,3,5,7,10],combat:true,melody:[5,4,3,2,3,4,5,null,4,3,2,0,2,3,4,null,5,7,5,4,3,2,0,2,3,4,5,4,2,0,null,null]}
  };
  const EFFECT_KEYS=['ui','physical-single','physical-all','tactic-single','tactic-all','fire-single','fire-all','thunder-single','thunder-all','wood-single','wood-all','water-single','water-all','earth-single','earth-all','heal-single','heal-all','buff','debuff','taunt','dodge','critical','victory','defeat'];
  function effectFor(skill={},event={}){
    if(event.periodic)return null;if(EFFECT_KEYS.includes(skill.sound))return skill.sound;
    if(event.results?.length&&event.results.every(r=>r.miss))return 'dodge';
    const scope=(event.scope||skill.scope)==='all'?'all':'single';
    if(skill.kind==='heal')return 'heal-'+scope;
    if(skill.kind==='buff')return skill.buff?.taunt||skill.vfx==='taunt'?'taunt':skill.side==='enemy'?'debuff':'buff';
    if(skill.kind==='physical')return 'physical-'+scope;
    const element=({lightning:'thunder',stone:'earth'}[skill.element]||skill.element||skill.vfx);return(['fire','thunder','wood','water','earth'].includes(element)?element:'tactic')+'-'+scope;
  }
  function sceneKey(id){return THEMES[id]?id:id==='town'?'camp':'map';}
  function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
  const waveCache=new Map(),waveJobs=new Map();let musicPrimed=false,musicPriming;
  function* waveStream(key){
    if(waveCache.has(key))return waveCache.get(key);
    const all=key.endsWith('-all'),kind=key.split('-')[0],duration=key==='zheng'?2.6:key==='pipa'?1.6:key==='gong'?2.8:key==='drum'? .7:key==='rim'? .09:key==='ui'? .07:['victory','defeat'].includes(key)?2.1:kind==='heal'?all?1.3:1:kind==='physical'?all? .4:.24:kind==='thunder'?all? .8:.48:kind==='fire'?all? .95:.65:.8;
    let seed=1234567;for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619);const rng=random(seed),data=new Float32Array(Math.ceil(duration*RATE));let low=0;
    for(let i=0;i<data.length;i++){if(i%256===0)yield;const t=i/RATE,w=rng()*2-1;low+=.12*(w-low);const hiss=w-low,attack=Math.min(1,t*350);let v=0;
      if(key==='zheng'||key==='pipa'){for(let h=1;h<=8;h++)v+=Math.sin(TAU*220*h*t)*Math.exp(-t*((key==='zheng'?1.7:3)+h*.8))/Math.pow(h,1.5);v+=hiss*.08*Math.exp(-t*65);}
      else if(key==='gong'){for(const [f,a,d]of [[176,1,1.8],[279,.45,2],[437,.3,2.8],[613,.2,3.4],[941,.12,4]])v+=Math.sin(TAU*f*t)*a*Math.exp(-t*d);}
      else if(key==='drum'||kind==='earth'||key==='critical'){v=.9*Math.sin(TAU*(55*t+2.5*(1-Math.exp(-t*25))))*Math.exp(-t*9)+low*1.4*Math.exp(-t*17)+hiss*.14*Math.exp(-t*45);}
      else if(key==='rim'||key==='ui'){v=(Math.sin(TAU*(key==='ui'?920:1250)*t)+.3*Math.sin(TAU*1720*t)+hiss*.12)*Math.exp(-t*(key==='ui'?80:60));}
      else if(kind==='physical'){const sweep=Math.exp(-Math.pow((t-.055)/.05,2))+(all? .7*Math.exp(-Math.pow((t-.21)/.07,2)):0);v=hiss*.8*sweep+.45*Math.sin(TAU*1550*t)*Math.exp(-t*28)+.55*Math.sin(TAU*110*t)*Math.exp(-t*30);}
      else if(kind==='fire'){const env=Math.min(1,t*22)*Math.exp(-t*(all?3.5:5));v=(low*2+hiss*.22+Math.sin(TAU*(72*t+1.4*(1-Math.exp(-t*22))))*.25)*env;}
      else if(kind==='thunder'){const pulse=(Math.sin(t*210)>-.1?1:.18)*Math.exp(-t*(all?6:10));v=(hiss*.8+Math.sin(TAU*(1100*t+12*Math.sin(t*18)))*.14)*pulse+low*.8*Math.exp(-t*5);}
      else if(kind==='water'){v=low*1.2*Math.sin(Math.PI*t/duration)*Math.exp(-t*1.5)+Math.sin(TAU*(700*t-170*t*t))*.15*Math.exp(-t*5);}
      else if(kind==='wood'){v=hiss*.25*Math.exp(-t*7)+Math.sin(TAU*(560*t-150*t*t))*.4*Math.exp(-t*12)+low*.6*Math.exp(-t*4);}
      else if(kind==='heal'||kind==='tactic'||key==='buff'||key==='debuff'||key==='taunt'||['victory','defeat'].includes(key)){
        const tones=key==='defeat'?[587,523,440,293]:key==='taunt'?[147,220,294]:key==='debuff'?[660,554,440]:key==='victory'?[587,740,880,1174]:kind==='heal'?[784,988,1175,1568]:key==='buff'?[392,523,784]:[440,660,880];
        tones.slice(0,kind==='heal'&&!all?3:4).forEach((f,j)=>{const u=t-j*(key==='victory'||key==='defeat'? .17:.075);if(u>=0)v+=(Math.sin(TAU*f*u)+.2*Math.sin(TAU*f*2.01*u))*Math.exp(-u*(kind==='heal'?4.5:4))/tones.length;});if(kind==='tactic')v+=hiss*.15*Math.exp(-t*9);
      }else if(key==='dodge')v=hiss*.35*Math.sin(Math.PI*Math.min(1,t/.22))*Math.exp(-t*12);
      const fade=Math.min(1,(duration-t)*120);data[i]=Math.tanh(v*1.3)*.72*attack*Math.max(0,fade);
    }const result={data,sampleRate:RATE,duration};waveCache.set(key,result);return result;
  }
  function wave(key){const stream=waveStream(key);let result;do{result=stream.next();}while(!result.done);return result.value;}
  function prepareWave(key){if(waveCache.has(key))return Promise.resolve();if(waveJobs.has(key))return waveJobs.get(key);const job=(async()=>{const stream=waveStream(key);while(true){const start=performance.now();let result;do{result=stream.next();if(result.done)return;}while(performance.now()-start<3);await new Promise(resolve=>setTimeout(resolve,4));}})();waveJobs.set(key,job);return job;}
  function primeMusic(){return musicPriming||=(async()=>{for(const key of ['ui','zheng','pipa','gong','drum','rim'])await prepareWave(key);musicPrimed=true;})();}
  class Synth{
    constructor(context){this.context=context;this.buffers=new Map();this.voices=new Set();const real=new Float32Array([0,0,0,0,0]),imag=new Float32Array([0,1,.2,.055,.018]);this.flute=context.createPeriodicWave(real,imag);}
    sample(key){if(!this.buffers.has(key)){const w=wave(key),b=this.context.createBuffer(1,w.data.length,RATE);b.getChannelData(0).set(w.data);this.buffers.set(key,b);}return this.buffers.get(key);}
    voice(source,gain,panner,destination,at,end,volume,pan,bag){const c=this.context;gain.gain.setValueAtTime(volume,at);source.connect(gain);if(panner){panner.pan.value=pan;gain.connect(panner);panner.connect(destination);}else gain.connect(destination);
      const v={source,gain,nodes:[source,gain,...(panner?[panner]:[])],stop:(fade=.02)=>{try{gain.gain.cancelScheduledValues(c.currentTime);gain.gain.setTargetAtTime(0,c.currentTime,Math.max(.002,fade/3));source.stop(c.currentTime+fade);}catch{}}};this.voices.add(v);bag?.add(v);source.onended=()=>{this.voices.delete(v);bag?.delete(v);v.nodes.forEach(n=>n.disconnect());};source.start(at);source.stop(end);return v;}
    pluck(midi,at,destination,volume=.25,pan=0,pipa=false,bag){const c=this.context,source=c.createBufferSource();source.buffer=this.sample(pipa?'pipa':'zheng');source.playbackRate.value=frequency(midi)/220;return this.voice(source,c.createGain(),c.createStereoPanner?.(),destination,at,at+source.buffer.duration/source.playbackRate.value,volume,pan,bag);}
    wind(midi,at,duration,destination,volume=.16,pan=0,pad=false,bag){const c=this.context,source=c.createOscillator(),gain=c.createGain();if(pad)source.type='sine';else source.setPeriodicWave(this.flute);source.frequency.value=frequency(midi);const v=this.voice(source,gain,c.createStereoPanner?.(),destination,at,at+duration+.4,0,pan,bag);gain.gain.linearRampToValueAtTime(volume,at+(pad? .55:.07));gain.gain.setTargetAtTime(volume*.7,at+duration*.55,.15);gain.gain.setTargetAtTime(0,at+duration,pad? .15:.08);return v;}
    effect(key,at,destination,volume=.5,pan=0,bag){const c=this.context,source=c.createBufferSource();source.buffer=this.sample(key);return this.voice(source,c.createGain(),c.createStereoPanner?.(),destination,at,at+source.buffer.duration,volume,pan,bag);}
  }
  const degree=(n,t)=>t.root+t.scale[(n%5+5)%5]+Math.floor(n/5)*12;
  function score(synth,theme,step,at,destination,bag){const t=THEMES[sceneKey(theme)],eighth=30/t.bpm,bar=Math.floor(step/8)%16,chord=[0,0,3,3,4,4,0,0,2,3,1,4,3,4,0,0][bar],within=step%8;
    if(step%2===0){const i=Math.floor(step/2)%64,melody=t.melody[i%32],variation=i>=32&&i%16<8?1:0;if(Number.isFinite(melody)&&!(theme==='dream'&&step%4!==0))synth.wind(degree(melody,t)+12,at,eighth*(t.combat?1.5:2.4),destination,t.combat? .2:.17,-.12,false,bag);if(i>=32&&i%8===6)synth.pluck(degree(melody??0,t)+12+variation*12,at+.035,destination,.09,.38,false,bag);}
    if(t.combat||step%2===0){const n=chord+[0,2,4,2,3,2,4,2][within];synth.pluck(degree(n,t),at,destination,t.combat? .25:.24,within%4<2?-.35:.35,!!t.combat,bag);}
    if(within===0||t.combat&&within===4)synth.pluck(degree(chord-5,t),at,destination,.27,0,true,bag);
    if(within===0){synth.wind(degree(chord-5,t),at,eighth*7.1,destination,.035,-.3,true,bag);synth.wind(degree(chord-5,t)+7,at+.02,eighth*7.1,destination,.025,.3,true,bag);}
    if(t.combat){if([0,3,4,6].includes(within))synth.effect('drum',at,destination,within===0? .48:.28,0,bag);if([2,6,7].includes(within))synth.effect('rim',at,destination,.1,.2,bag);if(step%32===0)synth.effect('gong',at,destination,theme==='boss'? .19:.12,-.2,bag);}
    else if(theme==='map'&&[2,6].includes(within))synth.effect('rim',at,destination,.055,.3,bag);
  }
  function room(context,output){const input=context.createGain(),delay=context.createDelay(.5),feedback=context.createGain(),wet=context.createGain(),filter=context.createBiquadFilter();delay.delayTime.value=.23;feedback.gain.value=.19;wet.gain.value=.14;filter.type='lowpass';filter.frequency.value=2100;input.connect(output);input.connect(delay);delay.connect(filter);filter.connect(wet);wet.connect(output);filter.connect(feedback);feedback.connect(delay);return{input,nodes:[input,delay,feedback,wet,filter]};}
  function createAudio({contextFactory=()=>{const C=root.AudioContext||root.webkitAudioContext;return C?new C():null;},document:doc=root.document,setInterval:repeat=root.setInterval?.bind(root),clearInterval:cancel=root.clearInterval?.bind(root)}={}){
    let context,synth,musicGain,seGain,duck,musicRoom,seRoom,track,timer,desired='menu',unlocked=false,visible=true,settings=S.normalize({}),unsub,detach;const effects=new Set(),last=new Map(),stats={musicNotes:0,effects:0,trackChanges:0};
    function setup(){if(context)return true;try{context=contextFactory();if(!context)return false;synth=new Synth(context);const compressor=context.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.2;compressor.connect(context.destination);musicGain=context.createGain();musicGain.gain.value=settings.music? .2:0;duck=context.createGain();duck.gain.value=1;musicGain.connect(duck);duck.connect(compressor);seGain=context.createGain();seGain.gain.value=settings.soundEffects? .52:0;seGain.connect(compressor);musicRoom=room(context,musicGain);seRoom=room(context,seGain);return true;}catch{context=null;return false;}}
    function stopMusic(fade=.25){cancel?.(timer);timer=null;if(!track)return;const old=track;track=null;old.bus.gain.cancelScheduledValues(context.currentTime);old.bus.gain.setTargetAtTime(0,context.currentTime,Math.max(.005,fade/3));for(const voice of old.voices)voice.stop(fade);root.setTimeout?.(()=>old.bus.disconnect(),(fade+.1)*1000);}
    function tick(){if(!track||context?.state!=='running'||!visible||!settings.music)return;const current=track;if(current.next<context.currentTime-.3)current.next=context.currentTime+.03;while(current.next<context.currentTime+.25){score(synth,current.key,current.step,current.next,current.bus,current.voices);stats.musicNotes++;current.next+=30/THEMES[current.key].bpm;current.step=(current.step+1)%128;}if(synth.voices.size>80)for(const v of [...synth.voices].slice(0,synth.voices.size-80))v.stop(.03);}
    function startMusic(){if(!musicPrimed){primeMusic().then(startMusic);return;}if(!context||context.state!=='running'||!visible||!settings.music||track?.key===desired)return;stopMusic();const bus=context.createGain();bus.gain.setValueAtTime(0,context.currentTime);bus.gain.linearRampToValueAtTime(1,context.currentTime+.35);bus.connect(musicRoom.input);track={key:desired,bus,step:0,next:context.currentTime+.055,voices:new Set()};stats.trackChanges++;tick();timer=repeat?.(tick,50);}
    async function unlock(){unlocked=true;if(!visible||!settings.music&&!settings.soundEffects||!setup())return false;try{if(context.state==='suspended')await context.resume();if(!musicPrimed)await primeMusic();startMusic();return context.state==='running';}catch{return false;}}
    function configure(next){settings=S.normalize(next);if(!context){if(unlocked&&(settings.music||settings.soundEffects))unlock();return;}const at=context.currentTime;musicGain.gain.cancelScheduledValues(at);musicGain.gain.setTargetAtTime(settings.music? .2:0,at,.025);seGain.gain.cancelScheduledValues(at);seGain.gain.setTargetAtTime(settings.soundEffects? .52:0,at,.015);if(!settings.music)stopMusic(.08);else if(unlocked)unlock();if(!settings.soundEffects)for(const v of [...effects])v.stop(.015);}
    function setScene(id){const next=sceneKey(id);if(next===desired)return;desired=next;startMusic();}
    function play(key){if(!EFFECT_KEYS.includes(key)||!settings.soundEffects||!unlocked||!visible||context?.state!=='running')return false;const at=context.currentTime,gap=key==='ui'? .055:key==='critical'? .15:.055;if(at-(last.get(key)??-Infinity)<gap)return false;last.set(key,at);while(effects.size>=10){const oldest=effects.values().next().value;effects.delete(oldest);oldest.stop(.015);}synth.effect(key,at+.002,seRoom.input,key==='ui'? .13:key==='critical'? .42:key==='victory'||key==='defeat'? .48:.55,0,effects);duck.gain.cancelScheduledValues(at);duck.gain.setTargetAtTime(.7,at,.01);duck.gain.setTargetAtTime(1,at+.15,.12);stats.effects++;return true;}
    function skill(definition,event){const key=effectFor(definition,event);if(!key)return false;const played=play(key);if(event?.results?.some(r=>r.critical&&!r.healing&&!r.miss))play('critical');return played;}
    function visibility(value){visible=value;if(!context)return;if(!visible){stopMusic(.025);for(const v of [...effects])v.stop(.01);context.suspend?.().catch(()=>{});}else if(unlocked)unlock();}
    function bind(store){primeMusic().then(async()=>{for(const key of EFFECT_KEYS)await prepareWave(key);});unsub?.();detach?.();configure(store.settings());unsub=S.subscribe(configure);if(doc){const gesture=e=>{if(e.isTrusted&&!e.repeat)unlock();},change=()=>visibility(doc.visibilityState!=='hidden');doc.addEventListener('pointerdown',gesture,{capture:true,passive:true});doc.addEventListener('keydown',gesture,{capture:true,passive:true});doc.addEventListener('visibilitychange',change);visible=doc.visibilityState!=='hidden';detach=()=>{doc.removeEventListener('pointerdown',gesture,true);doc.removeEventListener('keydown',gesture,true);doc.removeEventListener('visibilitychange',change);};}return api;}
    function dispose(){detach?.();unsub?.();stopMusic(.01);for(const v of [...effects])v.stop(.01);context?.close?.().catch(()=>{});context=null;}
    const api={bind,unlock,configure,setScene,play,skill,visibility,dispose,snapshot:()=>({scene:desired,playing:track?.key||null,state:context?.state||'locked',music:settings.music,soundEffects:settings.soundEffects,voices:synth?.voices.size||0,...stats})};return api;
  }
  async function renderPreview(key,seconds=8){const C=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!C)throw new Error('当前浏览器不支持离线音频渲染');const c=new C(2,Math.ceil(seconds*RATE),RATE),synth=new Synth(c),gain=c.createGain();gain.gain.value=key.startsWith('se:')? .45:.2;gain.connect(c.destination);if(key.startsWith('se:'))synth.effect(key.slice(3),.02,gain,.7);else{const theme=sceneKey(key);for(let step=0,at=.02;at<seconds;step++,at+=30/THEMES[theme].bpm)score(synth,theme,step%128,at,gain);}return c.startRendering();}
  const api={...createAudio(),createAudio,THEMES,EFFECT_KEYS,effectFor,wave,renderPreview};root.GameAudio=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
