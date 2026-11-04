(function(root){
  'use strict';
  const R=typeof module!=='undefined'&&module.exports?require('./game-rules.js'):root.PengpaiRules;
  const effect=(id,extra={})=>({id,...extra});
  const effects={
    armorDown:effect('armorDown',{chance:.4,attribute:'armor',base:3,coefficient:.25,negative:true}),
    resistanceDown:effect('resistanceDown',{attribute:'resistance',base:3,coefficient:.25,negative:true}),
    armorUp:effect('armorUp',{attribute:'armor',base:8,coefficient:.1,stat:'war'}),
    resistanceUp:effect('resistanceUp',{attribute:'resistance',base:5,coefficient:.25}),
    techniqueUp:effect('techniqueUp',{attribute:'technique',base:5,coefficient:.25}),
    techniqueDown:effect('techniqueDown',{attribute:'technique',base:5,coefficient:.25,negative:true}),
    bleed:effect('bleed',{chance:.8,base:1,coefficient:.25}),poison:effect('poison',{chance:.7,base:1,coefficient:.25}),burn:effect('burn',{chance:.4,base:1,coefficient:.25}),
    stun:effect('stun',{chance:.35}),shortStun:effect('stun',{chance:.35,duration:2}),paralysis:effect('paralysis',{chance:.4}),
    taunt:effect('taunt',{armorBase:8,armorCoefficient:.1}),speedUp:effect('speedUp'),speedDown:effect('speedDown'),
    regeneration:effect('regeneration',{base:1,coefficient:.25}),reflectDamage:effect('reflectDamage')
  };
  const skills={};
  for(const [weapon,plan]of Object.entries(R.WEAPON_SKILL_PLANS))for(const template of plan.skills){
    const tags=template.effects||[],group=template.scope==='all',skill={...template,cost:0,all:group,base:template.kind==='heal'?120:70,cooldown:group?3:1.5,effects:tags.filter(id=>effects[id]).map(id=>({...effects[id]}))};
    if(weapon==='staff')skill.element='fire';if(weapon==='talisman'&&template.kind==='tactic')skill.element='thunder';
    if(template.kind==='buff')skill.buff={id:template.id,name:template.name,duration:8,visual:tags.includes('taunt')?'taunt':'buff'};
    if(tags.includes('taunt')){skill.buff={id:'taunt',name:'嘲讽',taunt:true,duration:30,visual:'taunt'};skill.cooldown=1;skill.effects=skill.effects.filter(e=>!['taunt','armorUp'].includes(e.id));skill.effects.push(effect('armorUp',{duration:30,attribute:'armor',base:8,coefficient:.1,stat:'war'}));}
    if(tags.includes('ignoreTaunt'))skill.ignoreTaunt=true;if(tags.includes('lifesteal'))skill.lifesteal=.25;
    if(tags.includes('heavyHit'))skill.power=1.5;if(tags.includes('highCritical'))skill.criticalBonus=.25;
    if(tags.includes('fastRecovery'))skill.cooldown=-1.2;if(tags.includes('precision'))skill.alwaysHit=true;
    skills[skill.id]=skill;
  }
  skills['spear-break'].cooldown=2.5;skills['spear-stun'].cooldown=1;
  const add=(id,name,kind,side,scope,extra={})=>skills[id]={id,name,kind,side,scope,cost:0,all:scope==='all',cooldown:scope==='all'?3:1.5,...extra};
  add('punch','拳击','physical','enemy','single');add('spear-cut','直刺','physical','enemy','single');add('spear-sweep','横扫枪','physical','enemy','all');add('sword-cut','劈斩','physical','enemy','single');add('sword-sweep','横扫','physical','enemy','all');
  add('staff-shock','电击','tactic','enemy','single',{element:'thunder',base:70,effects:[effect('paralysis',{chance:.25})]});
  add('staff-storm','落雷阵','tactic','enemy','all',{element:'thunder',base:70});
  skills['talisman-rain'].cooldown=2;
  const forWeapon=weapon=>weapon?.type==='staff'&&weapon.school==='thunder'?['staff-shock','staff-storm']:(R.WEAPON_SKILL_PLANS[weapon?.type]?[...R.WEAPON_SKILL_PLANS[weapon.type].skills.map(s=>s.id),...(weapon.type==='sword'?['sword-cut','sword-sweep']:weapon.type==='spear'?['spear-cut','spear-sweep']:[])]:['punch']);
  const forEquipment=unit=>[...new Set([...forWeapon(unit.weapon),...(unit.equipment?.offhand?forWeapon(unit.equipment.offhand):[])])];
  const api={skills,forWeapon,forEquipment,effects};root.WeaponSkills=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
