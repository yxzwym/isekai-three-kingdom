(function(root){
  'use strict';
  // 专属被动独立于武器技能，不参与开局随机池，也不限制角色持有数量。
  const skills={
    'thunder-retaliation':{id:'thunder-retaliation',name:'电击',scope:'single',kind:'tactic',element:'thunder',scaling:{intelligence:1},weaponCoefficient:1,cost:0,side:'enemy',reactionOnly:true},
    'thunder-renewal':{id:'thunder-renewal',name:'雷公助我',scope:'single',kind:'heal',cost:0,side:'self',reactionOnly:true}
  };
  const definitions={
    'ganning-brocade':{id:'ganning-brocade',name:'锦帆骁勇',quality:'gold',description:'物理伤害提高12%。',stats:{physicalBonus:.12},triggers:[]},
    'zhaoyun-ever-victorious':{id:'zhaoyun-ever-victorious',name:'常胜骁勇',quality:'gold',description:'物理伤害提高10%。',stats:{physicalBonus:.1},triggers:[]},
    'zhaoyun-loyal-guard':{id:'zhaoyun-loyal-guard',name:'忠胆护身',quality:'gold',description:'受到的物理伤害减少8%。',stats:{physicalReduction:.08},triggers:[]},
    'zhangliang-might':{id:'zhangliang-might',name:'勇健有力',quality:'green',description:'物理伤害提高5%。',stats:{physicalBonus:.05},triggers:[]},
    'zhangliang-hardy':{id:'zhangliang-hardy',name:'皮实耐打',quality:'white',description:'受到的物理伤害减少2%。',stats:{physicalReduction:.02},triggers:[]},
    'benevolent-healer':{id:'benevolent-healer',name:'济世仁心',quality:'gold',description:'治疗效果提高20%。',stats:{healingBonus:.2},triggers:[]},
    'zhenji-clear-water':{id:'zhenji-clear-water',name:'洛水清晖',quality:'red',exclusive:true,description:'使用治疗技能恢复生命时，为目标净除一个负面状态。',stats:{},triggers:[{on:'heal',effect:'cleanse',count:1}]},
    'thunder-lord':{id:'thunder-lord',name:'雷公助我',quality:'red',exclusive:true,description:'闪避率增加25个百分点；闪避成功后，立即电击攻击者。',stats:{dodgeBonus:.25},triggers:[{on:'dodge',skill:'thunder-retaliation',target:'source'}]},
    'zhaoyun-courage':{id:'zhaoyun-courage',name:'一身是胆',quality:'red',exclusive:true,description:'生命每损失1%，造成的伤害提高0.5%，最多提高50%。',stats:{missingHealthDamageBonus:.5},triggers:[]},
    'zhaoyun-seven-crossings':{id:'zhaoyun-seven-crossings',name:'七进七出',quality:'red',exclusive:true,description:'受伤或治疗使生命越过25%、50%、75%时，立即充满当前行动进度。',stats:{},triggers:[{on:'healthCrossing',thresholds:[.25,.5,.75],direction:'both',effect:'fillProgress'}]}
  };
  definitions['thunder-lord-tutorial']={...JSON.parse(JSON.stringify(definitions['thunder-lord'])),id:'thunder-lord-tutorial',tutorialOnly:true,basePassive:'thunder-lord',description:'闪避率增加25个百分点；闪避后电击攻击者；濒死时恢复全部生命。',triggers:[...definitions['thunder-lord'].triggers,{on:'lethal',effect:'restoreFull',skill:'thunder-renewal'}]};
  const api={skills,definitions};root.BattlePassives=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
