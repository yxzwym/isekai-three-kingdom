(function(root){
  'use strict';
  // 专属被动独立于武器技能，不参与开局随机池，也不限制角色持有数量。
  const skills={
    'thunder-retaliation':{id:'thunder-retaliation',name:'电击',scope:'single',kind:'tactic',element:'thunder',scaling:{intelligence:1},weaponCoefficient:1,cost:0,side:'enemy',reactionOnly:true},
    'thunder-renewal':{id:'thunder-renewal',name:'雷公助我',scope:'single',kind:'heal',cost:0,side:'self',reactionOnly:true}
  };
  const definitions={
    'enemy-stun-resistance':{id:'enemy-stun-resistance',name:'眩晕抵抗',quality:'white',enemyOnly:true,temporary:true,description:'免疫眩晕。',stats:{},triggers:[]},
    'xuchu-tiger':{id:'xuchu-tiger',name:'虎痴悍勇',quality:'gold',description:'物理伤害提高12%。',stats:{physicalBonus:.12},triggers:[]},
    'dianwei-guard':{id:'dianwei-guard',name:'恶来护主',quality:'gold',description:'受到的物理伤害减少12%。',stats:{physicalReduction:.12},triggers:[]},
    'huangzhong-veteran':{id:'huangzhong-veteran',name:'老当益壮',quality:'gold',description:'物理伤害提高12%。',stats:{physicalBonus:.12},triggers:[]},
    'taishici-bold':{id:'taishici-bold',name:'笃烈之士',quality:'gold',description:'受到的物理伤害减少10%。',stats:{physicalReduction:.1},triggers:[]},
    'maliang-white-brow':{id:'maliang-white-brow',name:'白眉济世',quality:'gold',description:'治疗效果提高15%。',stats:{healingBonus:.15},triggers:[]},
    'lusu-generous':{id:'lusu-generous',name:'解衣推食',quality:'gold',description:'治疗效果提高15%。',stats:{healingBonus:.15},triggers:[]},
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
  // 英雄天赋与兵器分开管理；普通杂兵不会自动获得这些特性。
  const heroDefaults={
    liubei:['liubei-kind','liubei-resolve','liubei-care','liubei-fortitude'],
    caocao:['caocao-cunning','caocao-ambition','caocao-insight','caocao-composure'],
    simayi:['simayi-deep','simayi-patience','simayi-exploit','simayi-reserve'],
    xiahoudun:['xiahoudun-stalwart','xiahoudun-defiance','xiahoudun-iron'],
    zhangliao:['zhangliao-assault','zhangliao-breakthrough','zhangliao-precision'],
    xunyu:['xunyu-counsel','xunyu-prudence','xunyu-poise'],
    jiaxu:['jiaxu-poison','jiaxu-survival','jiaxu-schemes'],
    guanyu:['guanyu-righteous','guanyu-overawe','guanyu-martial','guanyu-steady'],
    zhangfei:['zhangfei-roar','zhangfei-ferocity','zhangfei-iron'],
    machao:['machao-valiant','machao-swift','machao-pierce'],
    sunquan:['sunquan-command','sunquan-balance','sunquan-calm','sunquan-judgment'],
    zhouyu:['zhouyu-flames','zhouyu-strategy','zhouyu-elegance','zhouyu-steady'],
    huanggai:['huanggai-veteran','huanggai-endure','huanggai-tenacity'],
    lvmeng:['lvmeng-study','lvmeng-discipline','lvmeng-ambush'],
    luxun:['luxun-fire','luxun-patience','luxun-insight'],
    sunshangxiang:['sunshangxiang-bow','sunshangxiang-agile','sunshangxiang-aim'],
    lvbu:['lvbu-peerless','lvbu-flying','lvbu-battlelust','lvbu-fearless'],
    zhugeliang:['zhuge-eight-trigrams','zhuge-divine','zhuge-calculation','zhuge-composure'],
    diaochan:['diaochan-grace','diaochan-gentle','diaochan-heart'],
    menghuo:['menghuo-strength','menghuo-endure','menghuo-resolve'],
    huatuo:['huatuo-healer','huatuo-surehand','huatuo-travel'],
    dongzhuo:['dongzhuo-soldier','dongzhuo-brutal','dongzhuo-stubborn'],
    zhangjiao:['thunder-lord','zhangjiao-taiping','zhangjiao-clarity'],
    zhangbao:['zhangbao-salve','zhangbao-talisman','zhangbao-patience'],
    zhangliang:['zhangliang-might','zhangliang-hardy','zhangliang-vanguard'],
    xuchu:['xuchu-tiger','xuchu-steadfast','xuchu-ferocity'],
    dianwei:['dianwei-guard','dianwei-fury','dianwei-stalwart'],
    huangzhong:['huangzhong-veteran','huangzhong-sure','huangzhong-calm'],
    taishici:['taishici-bold','taishici-archery','taishici-valiant'],
    maliang:['maliang-white-brow','maliang-gentle','maliang-care'],
    lusu:['lusu-generous','lusu-concord','lusu-watchful'],
    ganning:['ganning-brocade','ganning-night-raid','ganning-audacity'],
    zhaoyun:['zhaoyun-courage','zhaoyun-seven-crossings','zhaoyun-ever-victorious','zhaoyun-loyal-guard'],
    zhenji:['zhenji-clear-water','benevolent-healer','zhenji-serenity']
  };
  const additions={
    liubei:[['resolve','百折不挠','gold','生命越少，伤害越高，最多提高20%。',{missingHealthDamageBonus:.2}],['care','宽仁待人','blue','受到的计策伤害减少6%。',{tacticReduction:.06}],['fortitude','临难不弃','blue','受到的物理伤害减少6%。',{physicalReduction:.06}]],
    caocao:[['ambition','雄才大略','gold','物理与计策伤害提高8%。',{physicalBonus:.08,tacticBonus:.08}],['insight','洞察先机','gold','技能命中率增加8个百分点。',{hitBonus:.08}],['composure','从容应变','blue','速度提高8%。',{speedMultiplier:1.08}]],
    simayi:[['patience','隐忍待时','gold','受到的计策伤害减少10%。',{tacticReduction:.1}],['exploit','料敌机先','gold','计策伤害忽略目标8点抗性。',{resistancePenetration:8}],['reserve','藏锋守拙','blue','受到的物理伤害减少5%。',{physicalReduction:.05}]],
    xiahoudun:[['defiance','独目奋威','gold','生命越少，伤害越高，最多提高20%。',{missingHealthDamageBonus:.2}],['iron','刚烈不屈','blue','受到的物理伤害减少6%。',{physicalReduction:.06}]],
    zhangliao:[['breakthrough','突阵先登','gold','物理伤害忽略目标6点护甲。',{armorPenetration:6}],['precision','军令如山','blue','技能命中率增加6个百分点。',{hitBonus:.06}]],
    xunyu:[['prudence','秉正持重','blue','受到的计策伤害减少8%。',{tacticReduction:.08}],['poise','清心定虑','blue','速度提高6%。',{speedMultiplier:1.06}]],
    jiaxu:[['survival','明哲保身','gold','闪避率增加8个百分点。',{dodgeBonus:.08}],['schemes','算无遗策','gold','计策伤害忽略目标8点抗性。',{resistancePenetration:8}]],
    guanyu:[['overawe','威震华夏','gold','物理伤害忽略目标8点护甲。',{armorPenetration:8}],['martial','武圣之威','red','技能暴击率增加12个百分点。',{criticalBonus:.12}],['steady','凛然不惧','blue','受到的计策伤害减少6%。',{tacticReduction:.06}]],
    zhangfei:[['ferocity','万人之敌','gold','技能暴击率增加10个百分点。',{criticalBonus:.1}],['iron','虎躯铁骨','blue','受到的物理伤害减少8%。',{physicalReduction:.08}]],
    machao:[['swift','锦骑疾驰','gold','速度提高12%。',{speedMultiplier:1.12}],['pierce','寒枪破阵','blue','物理伤害忽略目标5点护甲。',{armorPenetration:5}]],
    sunquan:[['balance','权衡全局','gold','治疗效果提高12%。',{healingBonus:.12}],['calm','镇定自若','blue','技能命中率增加6个百分点。',{hitBonus:.06}],['judgment','善断军机','gold','物理与计策伤害提高6%。',{physicalBonus:.06,tacticBonus:.06}]],
    zhouyu:[['strategy','火候纯熟','gold','技能命中率增加8个百分点。',{hitBonus:.08}],['elegance','雅量高致','blue','受到的计策伤害减少6%。',{tacticReduction:.06}],['steady','运筹江东','gold','计策伤害忽略目标6点抗性。',{resistancePenetration:6}]],
    huanggai:[['endure','老将沉毅','blue','受到的计策伤害减少6%。',{tacticReduction:.06}],['tenacity','百战不退','gold','生命越少，伤害越高，最多提高20%。',{missingHealthDamageBonus:.2}]],
    lvmeng:[['discipline','士别三日','gold','技能命中率增加8个百分点。',{hitBonus:.08}],['ambush','白衣渡江','blue','速度提高8%。',{speedMultiplier:1.08}]],
    luxun:[['patience','静待战机','gold','技能暴击率增加8个百分点。',{criticalBonus:.08}],['insight','明察敌隙','blue','计策伤害忽略目标5点抗性。',{resistancePenetration:5}]],
    sunshangxiang:[['agile','灵姿矫健','blue','闪避率增加6个百分点。',{dodgeBonus:.06}],['aim','百步穿杨','gold','技能命中率增加10个百分点。',{hitBonus:.1}]],
    lvbu:[['flying','飞将神速','gold','速度提高15%。',{speedMultiplier:1.15}],['battlelust','战意无穷','red','生命越少，伤害越高，最多提高30%。',{missingHealthDamageBonus:.3}],['fearless','睥睨群雄','gold','受到的物理与计策伤害减少8%。',{physicalReduction:.08,tacticReduction:.08}]],
    zhuge:[['divine','神机妙算','red','计策伤害提高20%。',{tacticBonus:.2}],['calculation','料事如神','gold','技能命中率增加10个百分点。',{hitBonus:.1}],['composure','清心凝神','gold','受到的计策伤害减少10%。',{tacticReduction:.1}]],
    diaochan:[['gentle','轻云流袖','blue','速度提高10%。',{speedMultiplier:1.1}],['heart','兰心蕙质','gold','计策伤害与治疗效果提高10%。',{tacticBonus:.1,healingBonus:.1}]],
    menghuo:[['endure','蛮王铁骨','gold','受到的计策伤害减少10%。',{tacticReduction:.1}],['resolve','愈战愈勇','blue','生命越少，伤害越高，最多提高15%。',{missingHealthDamageBonus:.15}]],
    huatuo:[['surehand','妙手回春','gold','速度提高10%。',{speedMultiplier:1.1}],['travel','悬壶济世','blue','受到的物理与计策伤害减少5%。',{physicalReduction:.05,tacticReduction:.05}]],
    dongzhuo:[['brutal','西凉悍勇','gold','技能暴击率增加8个百分点。',{criticalBonus:.08}],['stubborn','久战不屈','blue','生命越少，伤害越高，最多提高15%。',{missingHealthDamageBonus:.15}]],
    zhangjiao:[['taiping','太平道法','gold','计策伤害提高10%。',{tacticBonus:.1}],['clarity','黄天护身','blue','受到的计策伤害减少6%。',{tacticReduction:.06}]],
    zhangbao:[['salve','符水济人','gold','治疗效果提高15%。',{healingBonus:.15}],['talisman','清符护体','blue','受到的计策伤害减少6%。',{tacticReduction:.06}],['patience','凝神养气','green','速度提高4%。',{speedMultiplier:1.04}]],
    zhangliang:[['vanguard','奋勇当先','blue','技能命中率增加5个百分点。',{hitBonus:.05}]],
    xuchu:[['steadfast','虎卫坚守','blue','受到的物理伤害减少8%。',{physicalReduction:.08}],['ferocity','虎啸生威','gold','技能暴击率增加8个百分点。',{criticalBonus:.08}]],
    dianwei:[['fury','古之恶来','gold','物理伤害提高10%。',{physicalBonus:.1}],['stalwart','舍身拒敌','blue','生命越少，伤害越高，最多提高20%。',{missingHealthDamageBonus:.2}]],
    huangzhong:[['sure','百发百中','gold','技能命中率增加12个百分点。',{hitBonus:.12}],['calm','老练沉着','blue','技能暴击率增加5个百分点。',{criticalBonus:.05}]],
    taishici:[['archery','弦无虚发','gold','技能命中率增加10个百分点。',{hitBonus:.1}],['valiant','勇烈奋进','blue','物理伤害提高8%。',{physicalBonus:.08}]],
    maliang:[['gentle','沉心施治','blue','受到的计策伤害减少6%。',{tacticReduction:.06}],['care','细察病情','green','速度提高5%。',{speedMultiplier:1.05}]],
    lusu:[['concord','敦厚守信','blue','受到的物理与计策伤害减少5%。',{physicalReduction:.05,tacticReduction:.05}],['watchful','审势而行','green','速度提高5%。',{speedMultiplier:1.05}]],
    ganning:[['night-raid','百骑劫营','gold','技能暴击率增加10个百分点。',{criticalBonus:.1}],['audacity','轻舟疾进','blue','速度提高8%。',{speedMultiplier:1.08}]],
    zhenji:[['serenity','静水凝心','blue','受到的计策伤害减少8%。',{tacticReduction:.08}]]
  };
  for(const [hero,rows]of Object.entries(additions))for(const [suffix,name,quality,description,stats]of rows){const id=hero+'-'+suffix;definitions[id]={id,name,quality,description,stats,triggers:[]};}
  function forUnit(unit){
    const existing=Array.isArray(unit.passives)?unit.passives.filter(id=>!definitions[id]?.enemyOnly||unit.side==='enemy'):[];
    // 教学专用的不败版本不叠加正式英雄天赋，避免改变新手战的节奏。
    if(existing.some(id=>definitions[id]?.tutorialOnly))return [...new Set(existing)];
    return [...new Set([...existing,...(heroDefaults[unit.characterId||unit.id]||[])])];
  }
  function complete(unit){return {...unit,passives:forUnit(unit)};}
  // 随机天赋和武将天赋共用同一份战斗定义；浏览器在规则表加载后首次取用。
  let randomInstalled=false;
  function allDefinitions(){
    const rules=typeof module!=='undefined'&&module.exports?require('./game-rules.js'):root.PengpaiRules;
    if(!randomInstalled&&rules){for(const p of rules.PASSIVES){const stats={...p.effects};if(stats.troopsMultiplier!=null){stats.healthMultiplier=stats.troopsMultiplier;delete stats.troopsMultiplier;}if(stats.physicalDodge!=null){stats.physicalDodgeBonus=stats.physicalDodge;delete stats.physicalDodge;}definitions[p.id]={id:p.id,name:p.name,quality:p.quality,description:p.description,stats,triggers:[]};}randomInstalled=true;}
    return definitions;
  }
  function statsFor(unit,table=allDefinitions()){
    const key=(unit.passives||[]).join('|');if(unit._passiveStats?.key===key&&unit._passiveStats.table===table)return unit._passiveStats.value;
    const value={};for(const id of unit.passives||[])for(const [stat,n]of Object.entries(table[id]?.stats||{})){
      if(typeof n==='boolean')value[stat]=value[stat]||n;
      else if(stat.endsWith('Multiplier'))value[stat]=(value[stat]??1)*n;
      else if(stat.endsWith('Pierce'))value[stat]=1-(1-(value[stat]||0))*(1-n);
      else value[stat]=(value[stat]||0)+n;
    }
    // 缓存仅为运行时数据，不能写入存档或参战阵容。
    Object.defineProperty(unit,'_passiveStats',{value:{key,table,value},configurable:true,writable:true,enumerable:false});return value;
  }
  const healthMultiplier=unit=>statsFor(unit).healthMultiplier||1;
  const api={skills,get definitions(){return allDefinitions();},heroDefaults,forUnit,complete,statsFor,healthMultiplier};root.BattlePassives=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
