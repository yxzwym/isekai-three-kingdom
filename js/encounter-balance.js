(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,H=node?require('./hero-quests.js'):root.HeroQuests,N=node?require('./nearby-content.js'):root.NearbyContent,P=node?require('./quest-progression.js'):root.QuestProgression;
 const levels={ganning:10,xuchu:6,dianwei:8,huangzhong:15,maliang:6,taishici:5,lusu:6,xunyu:5,jiaxu:9,zhangliao:14,xiahoudun:12,simayi:17,caocao:18,zhugeliang:18,guanyu:14,zhangfei:12,machao:17,liubei:15,zhouyu:16,huanggai:10,lvmeng:9,luxun:14,sunshangxiang:12,sunquan:18,lvbu:20,diaochan:14,huatuo:10,menghuo:18,zhangjiao:8,zhangbao:6,dongzhuo:25};
 const patternNames=['shieldwall','arcane','venom','armored','siege'];let route=0;
 for(const d of Object.values(H.definitions)){
  const level=levels[d.id]||Math.min(20,P.recommended(d));d.fixedCombatLevel=level;d.recommendedLevel=level;
  let index=0;for(const [phase,f]of Object.entries(d.battles||{})){
   const duel=!!f.solo&&!!f.duel;f.level=duel&&d.id==='taishici'?12:level;f.fixedLevel=true;delete f.scaleToHero;delete f.scaleEnemies;
   f.pattern=patternNames[(route+index++)%patternNames.length];
   if(!f.duel&&!f.roster&&!f.named){f.count=Math.max(f.count||3,3);if(level>=10&&route%5===0){f.pattern='ambush';f.count=4;}f.enemyRoles=null;}
   if(duel){f.temporaryPassives=[...new Set([...(f.temporaryPassives||[]),'enemy-stun-resistance','enemy-healing-suppression'])];}
   for(const stage of Object.values(d.stages||{}))if(stage.npc?.choices?.some(c=>c.battle===phase))stage.recommendedLevel=f.level;
  }if(d.id==='lvbu')d.battles.trial.temporaryPassives=[...(d.battles.trial.temporaryPassives||[]),'enemy-trial-armor'];if(d.id==='ganning'){d.battles.breach.count=5;d.battles.breach.pattern='shieldwall';d.battles.cell.count=5;d.battles.cell.pattern='siege';}if(d.id==='taishici')for(const key of ['jianye-meet','jianye-duel','freed'])d.stages[key].recommendedLevel=12;route++;
 }
 const early={'grain-escort':3,'cs-blackwood':3,'clear-mountain':3,'trade-road':4,'ye-quarry':5};
 for(const q of N.sideQuests){if(q.dungeon)continue;if(early[q.id]){q.fixedCombatLevel=q.recommendedLevel=early[q.id];q.pattern='earlyPhysical';continue;}q.fixedCombatLevel=Math.min(20,q.bossId?Math.max(10,q.recommendedLevel||10):Math.max(q.recommendedLevel||3,P.regionLevel(q.place)));q.recommendedLevel=q.fixedCombatLevel;}
 for(const [id,b]of Object.entries(N.storyBattles)){b.fixedCombatLevel={entry:2,rescue:2,grain:3,escort:3}[id]||3;b.recommendedLevel=b.fixedCombatLevel;}
 const api={levels};root.EncounterBalance=api;if(node)module.exports=api;
})(globalThis);
