(function(root){
  'use strict';
  const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.BattleEngine;
  const S=typeof module!=='undefined'&&module.exports?require('./statuses.js'):root.BattleStatuses;
  const n=value=>String(Number(Number(value||0).toFixed(4)));
  const attributes={war:'武力',intelligence:'智力',constitution:'体质',speed:'速度',technique:'技巧',attack:'武器威力',armor:'护甲',resistance:'抗性'};
  function expression(scaling={},flat=0,weaponCoefficient=0){
    const terms=[];if(flat)terms.push(n(flat));for(const [key,value]of Object.entries(scaling))if(value)terms.push((attributes[key]||key)+'×'+n(value));if(weaponCoefficient)terms.push('武器威力'+(weaponCoefficient===1?'':'×'+n(weaponCoefficient)));return terms.join('＋');
  }
  function skillFormula(skill){return expression(skill.scaling||{[skill.kind==='physical'?'war':'intelligence']:Number(skill.power)||1},Number(skill.flat)||0,skill.weaponCoefficient??1);}
  function effectFormula(s){return s.amount===undefined&&s.coefficient?expression({[s.stat||'technique']:s.coefficient},s.base||0):'';}
  const calculated=(value,formula)=>n(value)+(formula?'（'+formula+'）':'');
  function statusText(effect,actor){
    const s={...S.definitions[effect.id],...effect},name=s.name||effect.id;
    const healingFactor=s.healing&&s.period?(1+(actor.healingBonus||0))*(actor.healingReceivedMultiplier??1):1,amount=Math.abs(Number(s.amount??((s.base||0)+(s.coefficient||0)*(actor[s.stat||'technique']??0))))*healingFactor,duration=s.duration?'，持续'+n(s.duration)+'秒':'',multipliers=Object.keys(attributes).filter(key=>s[key+'Multiplier']!==undefined);
    let detail='';
    if(s.period)detail='每'+n(s.period)+'秒'+(s.healing?'回复':'损失')+calculated(Math.max(1,Math.floor(amount)),healingFactor===1?effectFormula(s):'（'+(effectFormula(s)||n(amount/healingFactor))+'）×'+n(healingFactor))+'点生命';
    else if(s.stun)detail='使目标无法行动';
    else if(s.attribute)detail=(s.negative||s.amount<0?'减少':'提升')+'目标'+calculated(amount,effectFormula(s))+'点'+(attributes[s.attribute]||s.attribute);
    else if(multipliers.length)detail=multipliers.map(key=>{const value=s[key+'Multiplier'];return(value<1?'降低':'提升')+'目标'+n(Math.abs(value-1)*100)+'%'+attributes[key];}).join('，');
    else if(s.reflect||s.reflectFormula){const f=s.reflectFormula;detail='反弹'+calculated((f?(f.base||0)+(f.coefficient||0)*(actor[f.stat||'technique']??0):s.reflect)*100,f?expression({[f.stat||'technique']:(f.coefficient||0)*100},(f.base||0)*100):'')+'%所受伤害';}
    return name+'：'+(detail||'附加此状态')+duration+'。'+(s.unresistable?'无法免疫。':'')+(s.uncleansable?'无法净除。':'');
  }
  function describe(b,u,skill){
    const actor=b.effective(u),all=skill.scope==='all',heal=skill.kind==='heal',buff=skill.kind==='buff',role=buff?(skill.buff?.taunt?'嘲讽':skill.buff?.reflect||skill.buff?.reflectFormula?'反伤':skill.side==='enemy'?'削弱状态':'增益状态'):(all?'群体':'单体')+(heal?'治疗':skill.kind==='physical'?'物理伤害':'计策伤害'),lines=[role];
    const effects=[...(skill.effects||[])];
    if(skill.buff&&!skill.buff.taunt&&(skill.buff.attribute||skill.buff.reflect||skill.buff.reflectFormula||Object.keys(attributes).some(key=>skill.buff[key+'Multiplier']!==undefined)))effects.unshift(skill.buff);
    const target=skill.side==='self'?'自身':(skill.side==='enemy'?'敌方':'我方')+(all?'全体':'单体');
    let action;
    if(buff)action='对'+target+'施放'+(skill.buff?.name||skill.name);
    else {
      const received=heal&&b.healingFactor?b.healingFactor(u):1,value=Math.floor(E.calculate({attacker:actor,target:{armor:0,resistance:0,species:'none'},skill}).amount*received);
      const factor=heal?(1+(actor.healingBonus||0))*received:(1+(actor[skill.kind==='physical'?'physicalBonus':'tacticBonus']||0))*(actor.damageMultiplier??1),formula=skillFormula(skill).replace('武器威力',actor.weaponPower!==undefined&&actor.weaponPower!==actor.attack?'武器威力×'+n(actor.weaponPower/Math.max(1,actor.attack)):'武器威力'),displayed=calculated(value,factor===1?formula:'（'+formula+'）×'+n(factor));action=heal?'为'+target+'回复'+displayed+'点生命':'对'+target+'造成'+displayed+'点'+(skill.kind==='physical'?(actor.physicalTrueDamage?'真实':'物理'):'计策')+'伤害';
    }
    const attached=effects.filter(e=>e.id!==skill.buff?.id).map(e=>(e.chance===undefined?'附加':n(e.chance*100)+'%几率附加')+(S.definitions[e.id]?.name||e.name||e.id));
    lines.push(action+(attached.length?'，'+attached.join('，'):'')+'。');
    if(skill.buff?.taunt)lines.push('嘲讽：成为敌方单体技能的攻击目标，持续'+n(skill.buff.duration)+'秒。');
    for(const effect of effects)lines.push(statusText(effect,{...actor,healingReceivedMultiplier:b.healingFactor?b.healingFactor(u):1}));
    if(['physical','tactic'].includes(skill.kind)){lines.push('基础命中率：'+n((skill.hitChance??.4)*100)+'%');lines.push('基础暴击率：'+n((skill.criticalChance||0)*100)+'%');}
    if(skill.lifesteal)lines.push('将伤害的'+n(skill.lifesteal*100)+'%转化为自身生命。');
    const races={humanoid:'人型生物',beast:'野兽',dragon:'龙',spirit:'灵体',dark:'妖物'};for(const [tag,value]of Object.entries(skill.raceBonuses||{}))lines.push('对'+(races[tag]||tag)+'额外造成'+n(value*100)+'%伤害。');
    if(skill.ignoreTaunt)lines.push('无视嘲讽。');
    const delay=b.config.skillDelays?.[skill.id]??skill.cooldown??0;
    if(delay)lines.push('冷却时间'+(delay<0?'减少':'增加')+n(Math.abs(delay))+'秒。');
    return {name:skill.name,role,lines};
  }
  const api={describe,skillFormula,statusText};root.BattleSkillInfo=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
