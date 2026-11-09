(function(root){
 'use strict';
 const rows=[
  ['liubei','sword',78],['caocao','sword',80],['sunquan','sword',75],['lvmeng','sword',82],
  ['ganning','blade',78],['taishici','blade',80],['guanyu','blade',90],['xiahoudun','blade',88],['dongzhuo','blade',95],['huaxiong','blade',88],['guosi','blade',76],
  ['zhaoyun','spear',95],['zhangliang','spear',92],['zhangfei','spear',100],['machao','spear',90],['lvbu','spear',90],['lijue','spear',80],['zhangxiu','spear',82],['xuhuang','spear',85],['yujin','spear',80],
  ['huanggai','shield',98],['gaoshun','shield',100],['caoren','shield',100],
  ['zhugeliang','fan',60],['zhouyu','fan',62],['luxun','fan',58],['zhangjiao','staff',68],['yuanshu','staff',55],
  ['simayi','banner',58],['jiaxu','banner',52],['liru','banner',50],['maliang','gourd',58],['huatuo','gourd',60],
  ['lusu','scripture',65],['xunyu','scripture',55],['zhangbao','scripture',65],['zhenji','needle',60],
  ['guanlu','whisk',58],['zhurong','dagger',70],['huangyueying','cannon',62],['yuanshao','sword',85],['yanliang','blade',90],['wenchou','spear',90],
  ['diaochan','shortBlade',52],['huangzhong','bow',72],['sunshangxiang','bow',65],['zhangliao','crossbow',78],
  ['dianwei','axe',98],['menghuo','axe',100],['yanbaihu','axe',88],['xuchu','hammer',100]
 ];
 const definitions=Object.fromEntries(rows.map(([id,weaponType,constitution])=>[id,{id,weaponType,constitution}]));
 function forUnit(unit){if(!unit||unit.id==='hero'||unit.characterId==='hero')return null;if(unit.origin==='tavern'&&unit.lockedWeaponType)return {id:unit.id,weaponType:unit.lockedWeaponType,constitution:unit.potentials?.constitution||50};const id=unit.characterId||unit.id;return Object.hasOwn(definitions,id)?definitions[id]:null;}
 function canEquip(unit,item,catalog){if(!item||item.slot!=='weapon'&&!item.type)return true;const profession=forUnit(unit);return !profession||catalog.classification(item)?.type.id===profession.weaponType;}
 const api={definitions,forUnit,canEquip};root.HeroProfessions=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
