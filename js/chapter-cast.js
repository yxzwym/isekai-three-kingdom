(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog,W=node?require('./weapon-skills.js'):root.WeaponSkills,C=node?require('./recruitment-content.js'):root.RecruitmentContent;
 if(node){require('./chapter-statistics.js');require('./chapter-traits.js');}
 const entries=[
  ['liubei','刘备','shu','sword','chengdu'],['zhugeliang','诸葛亮','shu','whisk','chengdu'],['guanyu','关羽','shu','blade','chengdu'],['zhangfei','张飞','shu','axe','chengdu'],['machao','马超','shu','spear','chengdu'],
  ['caocao','曹操','wei','sword','xuchang'],['simayi','司马懿','wei','banner','xuchang'],['xiahoudun','夏侯惇','wei','blade','xuchang'],['zhangliao','张辽','wei','crossbow','xuchang'],['xunyu','荀彧','wei','scripture','xuchang'],['jiaxu','贾诩','wei','banner','xuchang'],
  ['sunquan','孙权','wu','sword','jianye'],['zhouyu','周瑜','wu','staff','jianye'],['huanggai','黄盖','wu','shield','jianye'],['lvmeng','吕蒙','wu','sword','jianye'],['luxun','陆逊','wu','staff','jianye'],['sunshangxiang','孙尚香','wu','bow','jianye'],
  ['lvbu','吕布','other','spear','xinye'],['diaochan','貂蝉','other','shortBlade','xinye'],['menghuo','孟获','other','axe','nanman'],['huatuo','华佗','other','gourd','xiangyang-county'],['zhangjiao','张角','yellow','staff','camp'],['zhangbao','张宝','yellow','scripture','camp'],['dongzhuo','董卓','other','blade','luoyang'],
  ['huaxiong','华雄','dong','blade','hulao'],['gaoshun','高顺','dong','shield','xiapi'],['liru','李儒','dong','banner','luoyang'],['lijue','李傕','dong','spear','luoyang'],['guosi','郭汜','dong','blade','luoyang'],['yuanshu','袁术','dong','staff','chaisang'],['yanbaihu','严白虎','dong','axe','chaisang'],['zhangxiu','张绣','other','spear','wan'],
  ['guanlu','管辂','wei','whisk','pingyuan'],['zhurong','祝融','other','dagger','nanman'],['huangyueying','黄月英','shu','cannon','xiangyang'],
  ['xuhuang','徐晃','wei','spear','xuchang'],['yujin','于禁','wei','spear','xuchang'],['caoren','曹仁','wei','shield','xuchang'],['yuanshao','袁绍','other','sword','ye'],['yanliang','颜良','other','blade','ye'],['wenchou','文丑','other','spear','ye']
 ];
 const definitions=Object.fromEntries(entries.map(([id,name,country,type,home])=>[id,{id,name,country,type,home,level:10}]));
 const clone=value=>JSON.parse(JSON.stringify(value));
 Object.assign(definitions.guanyu,{weapon:{id:'green-dragon-glaive',name:'青龙偃月刀',skills:[{base:'sword-eagle',name:'青龙斩'},{base:'spear-break',name:'偃月横扫'}]},passives:['guanyu-righteous']});
 Object.assign(definitions.zhangfei,{weapon:{id:'serpent-spear',type:'spear',proficiencyType:'spear',name:'丈八蛇矛',skills:[{base:'axe-1',name:'燕人怒击'},{base:'spear-break',name:'蛇矛横扫'}]},passives:['zhangfei-roar']});
 Object.assign(definitions.machao,{weapon:{name:'飞翼枪'},passives:['machao-valiant']});
 Object.assign(definitions.lvbu,{weapon:{id:'fangtian-halberd',name:'方天画戟',type:'halberd',proficiencyType:'spear',skills:['sword-critical','spear-break']},passives:['lvbu-peerless'],guaranteedCritical:true,ignoreArmor:true});
 Object.assign(definitions.zhangjiao,{weapon:{id:'fire-god-staff',name:'火神杖'},passives:['thunder-lord']});
 Object.assign(definitions.zhugeliang,{type:'fan',weapon:{name:'白羽扇'},passives:['zhuge-eight-trigrams']});
 Object.assign(definitions.zhouyu,{type:'fan',weapon:{id:'zhouyu-featherfan',name:'朱羽扇',type:'fan',skills:[{base:'staff-fire',name:'焰火计'},{base:'staff-flame',name:'赤焰连营'}]},passives:['zhouyu-flames']});
 Object.assign(definitions.luxun,{type:'fan',weapon:{id:'luxun-featherfan',name:'青竹扇',type:'fan',skills:[{base:'staff-fire',name:'火伏计'},{base:'staff-flame',name:'连营焚野'}]},passives:['luxun-fire']});
 Object.assign(definitions.huatuo,{passives:['huatuo-healer']});
 Object.assign(definitions.dongzhuo,{passives:['dongzhuo-soldier']});
 Object.assign(definitions.xuhuang,{passives:['xuhuang-steady','xuhuang-martial']});Object.assign(definitions.yujin,{passives:['yujin-discipline','yujin-guard']});Object.assign(definitions.caoren,{passives:['caoren-fortress','caoren-tenacious']});
 Object.assign(definitions.yuanshao,{passives:['yuanshao-noble','yuanshao-command','yuanshao-reserve']});
 Object.assign(definitions.yanliang,{passives:['yanliang-might','yanliang-iron','yanliang-strike']});
 Object.assign(definitions.wenchou,{passives:['wenchou-charge','wenchou-vigor','wenchou-guard']});
 Object.assign(definitions.guanlu,{passives:['guanlu-star','guanlu-calm','guanlu-frost']});
 Object.assign(definitions.zhurong,{passives:['zhurong-hunter','zhurong-footwork','zhurong-vigor']});
 Object.assign(definitions.huangyueying,{passives:['huangyueying-craft','huangyueying-aim','huangyueying-mechanism']});
 const ordinary={liubei:['liubei-kind'],caocao:['caocao-cunning'],simayi:['simayi-deep'],sunquan:['sunquan-command'],xiahoudun:['xiahoudun-stalwart'],zhangliao:['zhangliao-assault'],xunyu:['xunyu-counsel'],jiaxu:['jiaxu-poison'],huanggai:['huanggai-veteran'],lvmeng:['lvmeng-study'],sunshangxiang:['sunshangxiang-bow'],diaochan:['diaochan-grace'],menghuo:['menghuo-strength'],zhangbao:[]};
 for(const [id,passives]of Object.entries(ordinary))definitions[id].passives=passives;
 for(const [id,d]of Object.entries(definitions))d.passives=root.BattlePassives.forUnit({...d,characterId:id});
 function unit(id,level,{boss=false}={}){
  const d=definitions[id];if(!d)throw new TypeError('未登记剧情人物：'+id);
  level??=d.level;
  const weapon={...I.create('weapon-'+d.type,boss?'blue':'green',id+'-weapon'),...clone(d.weapon||{})},skills=W.forWeapon(weapon),growth=G.create(id,level),armor=I.create(boss?'iron-armor':'leather-armor',boss?'blue':'green',id+'-armor');
  const u={...growth,id,name:d.name,characterId:id,unitType:'general',homeNode:d.home,experience:0,experienceVersion:2,weaponPlanVersion:3,weapon,skills,priorities:W.prioritiesFor(skills),equipment:{armor,accessory1:boss?I.create('copper-ring','blue',id+'-ring'):null,accessory2:boss?I.create('wood-beads','blue',id+'-beads'):null},armor:boss?15:3,resistance:boss?15:3,passives:clone(d.passives||[])};
  if(d.guaranteedCritical)u.guaranteedCritical=true;if(d.ignoreArmor)u.ignoreArmor=true;return u;
 }
 for(const d of Object.values(definitions))if(d.country!=='dong')C.registerCompanion(d.id,level=>unit(d.id,level??d.level));
 const original=['liubei','zhugeliang','guanyu','zhangfei','huangzhong','zhaoyun','machao','maliang','caocao','simayi','xiahoudun','dianwei','xuchu','zhangliao','xunyu','jiaxu','sunquan','zhouyu','ganning','lvmeng','taishici','huanggai','luxun','lusu','sunshangxiang','lvbu','diaochan','menghuo','huatuo','zhangjiao'];
 const api={definitions,unit,original};root.ChapterCast=api;if(node)module.exports=api;
})(globalThis);
