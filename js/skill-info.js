(function(root){
  'use strict';
  const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.BattleEngine;
  const S=typeof module!=='undefined'&&module.exports?require('./statuses.js'):root.BattleStatuses;
  const n=value=>String(Number(Number(value||0).toFixed(1)));
  const attributes={war:'武力',intelligence:'智力',speed:'速度',technique:'技巧',attack:'攻击',armor:'护甲',resistance:'抗性'};
  function statusText(effect,actor){
    const s={...S.definitions[effect.id],...effect},name=s.name||effect.id;
    const amount=Math.abs(Number(s.amount??((s.base||0)+(s.coefficient||0)*(actor[s.stat||'technique']||1)))),duration=s.duration?'，持续'+n(s.duration)+'秒':'',multipliers=Object.keys(attributes).filter(key=>s[key+'Multiplier']!==undefined);
    let detail='';
    if(s.period)detail='每'+n(s.period)+'秒'+(s.healing?'回复':'损失')+Math.max(1,Math.floor(amount))+'点兵力';
    else if(s.stun)detail='使目标无法行动';
    else if(s.attribute)detail=(s.negative||s.amount<0?'减少':'提升')+'目标'+n(amount)+'点'+(attributes[s.attribute]||s.attribute);
    else if(multipliers.length)detail=multipliers.map(key=>{const value=s[key+'Multiplier'];return(value<1?'降低':'提升')+'目标'+n(Math.abs(value-1)*100)+'%'+attributes[key];}).join('，');
    else if(s.reflect)detail='反弹'+n(s.reflect*100)+'%所受物理伤害';
    return name+'：'+(detail||'附加此状态')+duration+'。';
  }
  function describe(b,u,skill){
    const actor=b.effective(u),all=skill.scope==='all',heal=skill.kind==='heal',buff=skill.kind==='buff',role=buff?(skill.buff?.taunt?'嘲讽':skill.side==='enemy'?'削弱状态':'增益状态'):(all?'群体':'单体')+(heal?'治疗':skill.kind==='physical'?'物理伤害':'计策伤害'),lines=[role];
    const effects=[...(skill.effects||[])];
    if(skill.buff&&!skill.buff.taunt&&(skill.buff.attribute||skill.buff.reflect||Object.keys(attributes).some(key=>skill.buff[key+'Multiplier']!==undefined)))effects.unshift(skill.buff);
    const target=skill.side==='self'?'自身':(skill.side==='enemy'?'敌方':'我方')+(all?'全体':'单体');
    let action;
    if(buff)action='对'+target+'施放'+(skill.buff?.name||skill.name);
    else {
      const value=skill.kind==='physical'?E.physical({attacker:{...actor,attack:actor.attack*(skill.power||1)},target:{armor:0},level:u.level,mitigationScale:b.config.mitigationScale}).amount:E.tactic({skill,intelligence:actor.intelligence,target:{resistance:0},mitigationScale:b.config.mitigationScale}).amount;
      action=heal?'为'+target+'回复'+n(value)+'点兵力':'对'+target+'造成'+n(value)+'点'+(skill.kind==='physical'?'物理':'计策')+'伤害';
    }
    const attached=effects.filter(e=>e.id!==skill.buff?.id).map(e=>(e.chance===undefined?'附加':n(e.chance*100)+'%几率附加')+(S.definitions[e.id]?.name||e.name||e.id));
    lines.push(action+(attached.length?'，'+attached.join('，'):'')+'。');
    if(skill.buff?.taunt)lines.push('嘲讽：成为敌方单体技能的攻击目标，持续'+n(skill.buff.duration)+'秒。');
    for(const effect of effects)lines.push(statusText(effect,actor));
    if(skill.kind==='physical'){
      lines.push('基础命中率：'+n(skill.alwaysHit||!b.config.hit?100:(u.side==='ally'?244:235)/256*100)+'%');
      const critical=u.guaranteedCritical?1:b.config.critical?Math.min(1,E.criticalChance(actor,b.config)+(skill.criticalBonus||0)):0;
      lines.push('基础暴击率：'+n(critical*100)+'%');
    }
    if(skill.lifesteal)lines.push('将伤害的'+n(skill.lifesteal*100)+'%转化为自身兵力。');
    if(skill.ignoreTaunt)lines.push('无视嘲讽。');
    const delay=b.config.skillDelays?.[skill.id]??skill.cooldown??0;
    if(delay)lines.push('冷却时间'+(delay<0?'减少':'增加')+n(Math.abs(delay))+'秒。');
    return {name:skill.name,role,lines};
  }
  const api={describe};root.BattleSkillInfo=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
