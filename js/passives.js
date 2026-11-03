(function(root){
  'use strict';
  // 专属被动独立于武器技能，不参与开局随机池，也不限制角色持有数量。
  const skills={
    'thunder-retaliation':{id:'thunder-retaliation',name:'电击',scope:'single',kind:'tactic',element:'thunder',base:70,cost:0,side:'enemy',reactionOnly:true},
    'thunder-renewal':{id:'thunder-renewal',name:'雷公助我',scope:'single',kind:'heal',cost:0,side:'self',reactionOnly:true}
  };
  const definitions={
    'thunder-lord':{id:'thunder-lord',name:'雷公助我',quality:'red',exclusive:true,description:'闪避率增加25个百分点；闪避成功后，立即电击攻击者。',stats:{dodgeBonus:.25},triggers:[{on:'dodge',skill:'thunder-retaliation',target:'source'}]}
  };
  definitions['thunder-lord-tutorial']={...JSON.parse(JSON.stringify(definitions['thunder-lord'])),id:'thunder-lord-tutorial',tutorialOnly:true,basePassive:'thunder-lord',description:'闪避率增加25个百分点；闪避后电击攻击者；濒死时恢复全部兵力。',triggers:[...definitions['thunder-lord'].triggers,{on:'lethal',effect:'restoreFull',skill:'thunder-renewal'}]};
  const api={skills,definitions};root.BattlePassives=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
