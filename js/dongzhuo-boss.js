(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,W=node?require('./weapon-skills.js'):root.WeaponSkills,P=node?require('./passives.js'):root.BattlePassives;
 P.definitions['dongzhuo-pursuit']={id:'dongzhuo-pursuit',name:'索命追袭',quality:'white',temporary:true,enemyOnly:true,description:'无视嘲讽，始终追击当前生命最低的目标。攻击附带无法免疫、无法净除的生命流失；一击造成重伤时，不附加新的生命流失。',stats:{ignoreTaunt:true},triggers:[]};
 function unit(){
  const weapon={id:'possessed-warblade',type:'blade',name:'太师重刀',power:0,skills:[{name:'锁魂追斩',iconId:'sword-eagle',kind:'physical',side:'enemy',scope:'single',cooldown:-.5,scaling:{war:1,technique:4},weaponCoefficient:0,hitChance:.4,criticalChance:.08,ignoreTaunt:true,effects:[{id:'lifeLoss',chance:1,amount:300,duration:5,period:1,unresistable:true,uncleansable:true}]}]},skills=W.forWeapon(weapon);
  return {id:'chapter-dongzhuo-0',name:'董卓',characterId:'dongzhuo',unitType:'general',level:25,war:1080,intelligence:450,technique:1350,speed:1260,constitution:240,armor:27,resistance:27,weapon,skills,priorities:W.prioritiesFor(skills),targetRule:'lowestCurrent',formationRow:'front',boss:true,statusImmunities:['stun'],passives:['luoyang-possession','enemy-stun-resistance','dongzhuo-pursuit']};
 }
 const api={unit};root.DongzhuoBoss=api;if(node)module.exports=api;
})(globalThis);
