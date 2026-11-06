(function(root){
 'use strict';
 const definitions={
  'bandit-camp':{id:'bandit-camp',name:'山贼营寨',background:'./assets/battles/bandit-camp-v1.webp',color:'#564b36'},
  'forest-path':{id:'forest-path',name:'林间小径',background:'./assets/battles/forest-path-v1.webp',color:'#3d4934'},
  'river-dock':{id:'river-dock',name:'河岸渡口',background:'./assets/battles/river-dock-v1.webp',color:'#4b5949'},
  'rural-road':{id:'rural-road',name:'乡野官道',background:'./assets/battles/rural-road-v1.webp',color:'#776449'},
  farmland:{id:'farmland',name:'村边农田',background:'./assets/battles/farmland-v1.webp',color:'#79623e'},
  'market-street':{id:'market-street',name:'城内街市',background:'./assets/battles/market-street-v1.webp',color:'#655b4b'},
  'county-prison':{id:'county-prison',name:'县衙牢房',background:'./assets/battles/county-prison-v1.webp',color:'#544e42'}
 };
 function get(id){if(!definitions[id])throw new TypeError('未登记的战斗场景：'+id);return {...definitions[id]};}
 const api={definitions,get};root.BattleScenes=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
