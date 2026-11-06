(function(root){
  'use strict';
  function choicesFor(event){
    let choices=Array.isArray(event.choices)&&event.choices.length?event.choices.map((c,i)=>({...c,id:String(c.id||'choice-'+i)})):[{id:event.kind==='battle'?'battle':'continue',label:event.kind==='battle'?'迎战':'继续赶路',action:event.kind==='battle'?'battle':'continue'}];
    if(choices.length>1&&!choices.some(c=>c.action==='leave'))choices.push({id:'leave',label:'离开',action:'leave'});return choices;
  }
  class Decision{
    constructor(choices,now,seconds=10){this.choices=choicesFor({choices});choices=this.choices;this.deadline=now+seconds*1000;this.defaultId=(choices.length===1?choices[0]:choices.find(c=>c.action==='leave')).id;this.resolved=false;}
    remaining(now){return Math.max(0,Math.ceil((this.deadline-now)/1000));}
    choose(id){if(this.resolved)return null;const choice=this.choices.find(c=>c.id===id);if(!choice)return null;this.resolved=true;return choice;}
    tick(now){return this.remaining(now)===0?this.choose(this.defaultId):null;}
  }
  const api={choicesFor,Decision};root.TimedChoice=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
