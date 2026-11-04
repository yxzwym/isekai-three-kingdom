(function(root){
  'use strict';
  const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.BattleEngine;
  const S=typeof module!=='undefined'&&module.exports?require('./statuses.js'):root.BattleStatuses;
  const n=value=>String(Number(Number(value||0).toFixed(1)));
  function describe(b,u,skill){
    const actor=b.effective(u),all=skill.scope==='all',lines=[],heal=skill.kind==='heal',buff=skill.kind==='buff';
    const role=buff?(skill.buff?.taunt?'嘲讽':skill.side==='enemy'?'削弱状态':'增益状态'):(all?'群体':'单体')+(heal?'治疗':skill.kind==='physical'?'物理伤害':'计策伤害');lines.push(role);
    const side=skill.side==='enemy'?(u.side==='ally'?'enemy':'ally'):u.side,pool=skill.side==='self'?[u]:b.living(side),targets=all?pool:pool.slice(0,1);
    if(!buff&&targets.length){const values=targets.map(t=>skill.kind==='physical'?E.physical({attacker:{...actor,attack:actor.attack*(skill.power||1)},target:b.effective(t),level:u.side==='ally'?u.level:t.level,mitigationScale:b.config.mitigationScale}).amount:E.tactic({skill,intelligence:actor.intelligence,scope:skill.scope,count:all?pool.length:1,target:b.effective(t),mitigationScale:b.config.mitigationScale}).amount),lo=Math.min(...values),hi=Math.max(...values);lines.push(`${heal?'回复':'伤害'}：${lo===hi?n(lo):n(lo)+'～'+n(hi)}${all?' / 人':''}`);lines.push(`按当前属性及${all?'存活目标':targets[0].name}计算`);}
    const delay=b.config.skillDelays?.[skill.id]??skill.cooldown??0;lines.push(`恢复时间增加：${n(delay)}秒`);lines.push(`使用后下次出手：${n(E.interval(actor,b.config,delay))}秒`);
    if(skill.buff?.taunt)lines.push(`嘲讽：持续${n(skill.buff.duration)}秒，单体攻击优先选择嘲讽者`);
    for(const effect of skill.effects||[]){const base=S.definitions[effect.id]||{},duration=effect.duration??base.duration,amount=effect.amount??((effect.base||0)+(effect.coefficient||0)*(actor[effect.stat||'technique']||1)),chance=effect.chance===undefined?'':`，基础附加率${n(effect.chance*100)}%`;let text=base.name||effect.id;
      if(base.period)text+=`：每秒${base.healing?'回复':'损失'}${n(Math.floor(Math.abs(amount)))}兵力`;
      else if(effect.attribute)text+=`：${{armor:'护甲',resistance:'抗性',technique:'技巧',speed:'速度'}[effect.attribute]||effect.attribute}${effect.negative?'−':'＋'}${n(amount)}`;
      else if(base.stun)text+='：暂停读条与行动';else if(effect.id==='paralysis')text+=`：速度降低${n((1-(effect.speedMultiplier??base.speedMultiplier))*100)}%`;
      if(duration)text+=`，持续${n(duration)}秒`;lines.push(text+chance);
    }
    if(skill.lifesteal)lines.push(`吸血：实际伤害的${n(skill.lifesteal*100)}%`);
    if(skill.criticalBonus)lines.push(`暴击率增加${n(skill.criticalBonus*100)}个百分点`);
    return {name:skill.name,role,lines};
  }
  const api={describe};root.BattleSkillInfo=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
