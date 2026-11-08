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
 // 本表是武将招牌特质；强度品质与“角色专属”的身份分别记录。
 for(const [id,name,quality,description,stats,exclusive=true]of rows)P.definitions[id]={id,name,quality,description,stats,triggers:[],...(exclusive?{exclusive:true}:{})};
 P.definitions['luoyang-possession']={id:'luoyang-possession',name:'诡影附身',quality:'white',temporary:true,enemyOnly:true,description:'最大生命提高200%，免疫眩晕，仍可被破甲、麻痹和持续伤害影响。',stats:{healthMultiplier:3},triggers:[]};
 const api={ids:rows.map(r=>r[0])};root.ChapterTraits=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
