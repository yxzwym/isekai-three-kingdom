(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,W=node?require('./weapon-skills.js'):root.WeaponSkills,P=node?require('./passives.js'):root.BattlePassives;
 P.definitions['dongzhuo-pursuit']={id:'dongzhuo-pursuit',name:'索命追袭',quality:'white',temporary:true,enemyOnly:true,description:'无视嘲讽，始终追击当前生命最低的目标。',stats:{ignoreTaunt:true},triggers:[]};
 function unit(){
  const weapon={id:'possessed-warblade',type:'blade',name:'太师重刀',power:20,skills:[{name:'锁魂追斩',iconId:'sword-eagle',kind:'physical',side:'enemy',scope:'single',cooldown:-.5,scaling:{war:1,technique:4},weaponCoefficient:1,hitChance:.4,criticalChance:.08,ignoreTaunt:true}]},skills=W.forWeapon(weapon);
  return {id:'chapter-dongzhuo-0',name:'董卓',characterId:'dongzhuo',unitType:'general',level:25,war:108,intelligence:45,technique:130,speed:126,constitution:240,armor:27,resistance:27,weapon,skills,priorities:W.prioritiesFor(skills),targetRule:'lowestCurrent',formationRow:'front',boss:true,statusImmunities:['stun'],passives:['luoyang-possession','enemy-stun-resistance','dongzhuo-pursuit']};
 }
 const api={unit};root.DongzhuoBoss=api;if(node)module.exports=api;
})(globalThis);
