(function(root){
  'use strict';
  const DEFAULTS={screenShake:true,effects:true,manualPause:true,music:true,soundEffects:true,menuScale:1};
  const TOGGLES=[['screenShake','屏幕震动'],['effects','战斗特效'],['manualPause','手动时停'],['music','背景音乐'],['soundEffects','游戏音效']],SCALES=[['小',.9],['标准',1],['大',1.1]],listeners=new Set();
  function normalize(data){return{...Object.fromEntries(TOGGLES.map(([key])=>[key,typeof data?.[key]==='boolean'?data[key]:DEFAULTS[key]])),menuScale:SCALES.some(([,value])=>value===data?.menuScale)?data.menuScale:1};}
  function validate(data){if(TOGGLES.some(([key])=>typeof data?.[key]!=='boolean')||!SCALES.some(([,value])=>value===data?.menuScale))throw new TypeError('设置无效');return normalize(data);}
  const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);},changed=settings=>{for(const fn of [...listeners])fn({...settings});};
  const api={DEFAULTS,TOGGLES,SCALES,normalize,validate,subscribe,changed};root.GameSettings=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
