(function(root){
  'use strict';
  const definitions={
    passiveShield:{name:'护盾',icon:'盾',color:'#93c9e5',shield:true},
    taunt:{name:'嘲讽',icon:'盾',color:'#e5b45e',duration:30,taunt:true},
    armorDown:{name:'破甲',icon:'裂',color:'#d7a27c',duration:8},
    resistanceDown:{name:'破抗',icon:'蚀',color:'#bc97dd',duration:8},
    bleed:{name:'流血',icon:'血',color:'#ed6b72',duration:8,period:1},
    plague:{name:'瘟疫',icon:'疫',color:'#b5b65f',duration:8,period:1},
    warDown:{name:'武力衰减',icon:'弱',color:'#d19b86',duration:8},
    intelligenceDown:{name:'智力衰减',icon:'惑',color:'#b29dcc',duration:8},
    intelligenceUp:{name:'智力提升',icon:'策',color:'#c0a8e4',duration:8},
    poison:{name:'中毒',icon:'毒',color:'#92bd65',duration:8,period:1},
    burn:{name:'灼烧',icon:'焰',color:'#eea44e',duration:5,period:1},
    stun:{name:'眩晕',icon:'晕',color:'#e9d984',duration:4,stun:true},
    paralysis:{name:'麻痹',icon:'麻',color:'#aca3f1',duration:8,speedMultiplier:.5},
    regeneration:{name:'回春',icon:'愈',color:'#7cda9a',duration:8,period:1,healing:true},
    armorUp:{name:'护甲提升',icon:'甲',color:'#c2c6db',duration:8},
    resistanceUp:{name:'抗性提升',icon:'抗',color:'#9ec4e0',duration:8},
    speedUp:{name:'速度提升',icon:'速',color:'#79c6d7',duration:8},
    speedDown:{name:'速度衰减',icon:'缓',color:'#a298ce',duration:8},
    techniqueUp:{name:'技巧提升',icon:'巧',color:'#a4d0cf',duration:8},
    techniqueDown:{name:'技巧衰减',icon:'钝',color:'#b0a4b9',duration:8},
    attackUp:{name:'攻击提升',icon:'锐',color:'#e8c58b',duration:8,attackMultiplier:1.2},
    reflectDamage:{name:'反伤',icon:'反',color:'#dbb28e',duration:8,reflect:.25}
  };
  const skills=Object.fromEntries(Object.entries(definitions).filter(([,s])=>s.period).map(([id,s])=>['status-'+id,{id:'status-'+id,name:s.name,kind:s.healing?'heal':'tactic',side:s.healing?'ally':'enemy',scope:'single',cost:0,reactionOnly:true,vfx:s.healing?'heal':id==='burn'?'fire':['poison','plague'].includes(id)?'wood':'physical'}]));
  skills['status-reflect']={id:'status-reflect',name:'反伤',kind:'physical',damageType:'true',side:'enemy',scope:'single',cost:0,reactionOnly:true};
  skills['passive-counter']={id:'passive-counter',name:'以逸待劳',kind:'physical',side:'enemy',scope:'single',cost:0,reactionOnly:true};
  const api={definitions,skills};root.BattleStatuses=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
