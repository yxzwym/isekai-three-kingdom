(function(root){
 'use strict';
 const D=typeof module!=='undefined'&&module.exports?require('./world-data.js'):root.WorldData;
 let levels;
 function regionLevel(id){
  if(!levels){
   const edges=new Map(D.places.map(p=>[p.id,[]]));
   for(const [a,b]of D.roads){if(D.placeMap[a].requiresWater||D.placeMap[b].requiresWater)continue;const length=D.roadLength(a,b);edges.get(a).push([b,length]);edges.get(b).push([a,length]);}
   const distances=new Map([['camp',0]]),open=new Set(['camp']);
   while(open.size){const current=[...open].reduce((a,b)=>distances.get(a)<=distances.get(b)?a:b);open.delete(current);for(const [next,length]of edges.get(current)){const value=distances.get(current)+length;if(value<(distances.get(next)??Infinity)){distances.set(next,value);open.add(next);}}}
   // 以最远的三国都城为十级距离，沿可行陆路从营地的三级线性递增。
   const far=Math.max(...['xuchang','chengdu','jianye'].map(id=>distances.get(id))),near=D.roadLength('camp','changshan')*3;
   levels=new Map([...distances].map(([id,distance])=>[id,Math.min(20,3+Math.round(17*Math.max(0,distance-near)/(far-near)))]));
  }
  return levels.get(D.placeAliases[id]||id)??10;
 }
 function recommended(task,stage){
  if(task.fixedCombatLevel!=null&&!stage?.recommendedLevel)return task.fixedCombatLevel;
  if(stage?.recommendedLevel!=null)return stage.recommendedLevel;
  if(task.bossId||task.rulerCountry||task.id==='ganning'||task.recommendedLevel>10)return task.recommendedLevel;
  return Math.max(...[task.giverPlace,task.place].filter(Boolean).map(regionLevel),3);
 }
 const api={regionLevel,recommended};root.QuestProgression=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
