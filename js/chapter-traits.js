(function(root){
 'use strict';
 const P=typeof module!=='undefined'&&module.exports?require('./passives.js'):root.BattlePassives;
 const rows=[
 ['liubei-kind','仁心厚德','gold','治疗效果提高15%。',{healingBonus:.15}],['caocao-cunning','临危制变','gold','受到的物理和计策伤害减少8%。',{physicalReduction:.08,tacticReduction:.08}],
 ['simayi-deep','深谋远虑','gold','计策伤害提高15%。',{tacticBonus:.15}],['xiahoudun-stalwart','拔矢奋战','gold','物理伤害提高15%。',{physicalBonus:.15}],['zhangliao-assault','威震逍遥','gold','物理伤害提高15%。',{physicalBonus:.15}],['xunyu-counsel','王佐之才','gold','治疗效果提高20%。',{healingBonus:.2}],['jiaxu-poison','帷幄毒士','gold','计策伤害提高18%。',{tacticBonus:.18}],
 ['guanyu-righteous','义薄云天','gold','物理伤害提高15%。',{physicalBonus:.15}],['zhangfei-roar','燕人怒吼','gold','物理伤害提高18%。',{physicalBonus:.18}],['machao-valiant','西凉骁骑','gold','物理伤害提高15%。',{physicalBonus:.15}],
 ['sunquan-command','坐镇江东','gold','受到的物理和计策伤害减少8%。',{physicalReduction:.08,tacticReduction:.08}],['zhouyu-flames','赤焰周郎','gold','计策伤害提高18%。',{tacticBonus:.18}],['huanggai-veteran','铁骨老将','gold','受到的物理伤害减少15%。',{physicalReduction:.15}],['lvmeng-study','刮目相看','gold','物理和计策伤害提高10%。',{physicalBonus:.1,tacticBonus:.1}],['luxun-fire','连营烈火','gold','计策伤害提高18%。',{tacticBonus:.18}],['sunshangxiang-bow','弓腰姬','gold','物理伤害提高15%。',{physicalBonus:.15}],
 ['lvbu-peerless','天下无双','red','物理技能必定暴击，无视目标全部护甲。',{guaranteedCritical:true,ignoreArmor:true},true],['zhuge-eight-trigrams','八卦阵','red','受到物理技能时有50%概率闪避。',{physicalDodgeBonus:.5},true],['diaochan-grace','闭月流风','gold','受到物理技能时额外增加15%闪避率。',{physicalDodgeBonus:.15}],['menghuo-strength','南中雄威','gold','受到物理伤害减少12%，物理伤害提高10%。',{physicalReduction:.12,physicalBonus:.1}],['huatuo-healer','青囊济世','red','治疗效果提高35%。',{healingBonus:.35},true],['dongzhuo-soldier','西凉旧将','gold','物理伤害提高12%，受到物理伤害减少10%。',{physicalBonus:.12,physicalReduction:.1}]
 ];
 rows.push(
  ['xuhuang-steady','治军严整','gold','技能命中率增加8个百分点。',{hitBonus:.08}],['xuhuang-martial','沉勇善战','blue','物理伤害提高15%。',{physicalBonus:0.15},false],
  ['yujin-discipline','持军有度','gold','受到的物理伤害减少10%。',{physicalReduction:.1}],['yujin-guard','久历军阵','blue','体质提高15%。',{constitutionMultiplier:1.15},false],
  ['caoren-fortress','不动坚城','gold','受到的物理和计策伤害减少10%。',{physicalReduction:.1,tacticReduction:.1}],['caoren-tenacious','固守不退','gold','体质提高20%。',{constitutionMultiplier:1.2},false],
  ['yuanshao-noble','四世三公','gold','受到的物理和计策伤害减少8%。',{physicalReduction:.08,tacticReduction:.08}],
  ['yuanshao-command','从容督战','blue','技能命中率增加15个百分点。',{hitBonus:0.15},false],
  ['yuanshao-reserve','河北雄兵','gold','体质提高20%。',{constitutionMultiplier:1.2},false],
  ['yanliang-might','河北骁将','gold','物理伤害提高15%。',{physicalBonus:.15}],
  ['yanliang-iron','披坚执锐','blue','受到的物理伤害减少15%。',{physicalReduction:0.15},false],
  ['yanliang-strike','奋力破敌','gold','技能暴击率增加20个百分点。',{criticalBonus:0.2},false],
  ['wenchou-charge','铁骑争先','gold','速度提高12%。',{speedMultiplier:1.12}],
  ['wenchou-vigor','勇悍难当','gold','物理伤害提高20%。',{physicalBonus:0.2},false],
  ['wenchou-guard','久经战阵','blue','受到的物理伤害减少15%。',{physicalReduction:0.15},false],
  ['guanlu-star','星罗推演','gold','技能命中率增加12个百分点。',{hitBonus:.12}],
  ['guanlu-calm','静心观象','blue','受到的计策伤害减少15%。',{tacticReduction:0.15},false],
  ['guanlu-frost','寒息凝神','gold','计策伤害提高20%。',{tacticBonus:0.2},false],
  ['zhurong-hunter','南中猎影','gold','技能暴击率增加12个百分点。',{criticalBonus:.12}],
  ['zhurong-footwork','踏林疾行','blue','速度提高15%。',{speedMultiplier:1.15},false],
  ['zhurong-vigor','百猎磨锋','green','物理伤害提高10%。',{physicalBonus:0.1},false],
  ['huangyueying-craft','工巧天成','gold','物理伤害忽略目标8点护甲。',{armorPenetration:8}],
  ['huangyueying-aim','凝神校准','blue','技能命中率增加15个百分点。',{hitBonus:0.15},false],
  ['huangyueying-mechanism','机括娴熟','gold','速度提高20%。',{speedMultiplier:1.2},false]
 );
 // 本表是武将招牌特质；强度品质与“角色专属”的身份分别记录。
 for(const [id,name,quality,description,stats,exclusive=true]of rows)P.definitions[id]={id,name,quality,description,stats,triggers:[],...(exclusive?{exclusive:true}:{})};
 P.definitions['luoyang-possession']={id:'luoyang-possession',name:'诡影附身',quality:'white',temporary:true,enemyOnly:true,description:'体质提高200%，免疫眩晕，仍可被破甲、麻痹和持续伤害影响。',stats:{constitutionMultiplier:3},triggers:[]};
 const api={ids:rows.map(r=>r[0])};root.ChapterTraits=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
