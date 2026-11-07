(function(root){
 'use strict';
 const definitions={
  'capital-wei':{id:'capital-wei',name:'许昌官署',background:'./assets/towns/capital-wei-v1.webp',color:'#887054'},
  'capital-shu':{id:'capital-shu',name:'成都府院',background:'./assets/towns/capital-shu-v1.webp',color:'#77895c'},
  'capital-wu':{id:'capital-wu',name:'建业水府',background:'./assets/towns/capital-wu-v1.webp',color:'#738b87'},
  'city-north':{id:'city-north',name:'北地城街',background:'./assets/towns/city-north-v1.webp',color:'#847252'},
  'city-river':{id:'city-river',name:'江南水城',background:'./assets/towns/city-river-v1.webp',color:'#7d8b6b'},
  'city-frontier':{id:'city-frontier',name:'西北城郭',background:'./assets/towns/city-frontier-v1.webp',color:'#958062'},
  'city-shu':{id:'city-shu',name:'蜀地城街',background:'./assets/towns/city-shu-v1.webp',color:'#77885b'},
  'clinic-courtyard':{id:'clinic-courtyard',name:'医馆内院',background:'./assets/towns/clinic-courtyard-v1.webp',color:'#7c8063'},
  'bandit-camp':{id:'bandit-camp',name:'山贼营寨',background:'./assets/battles/bandit-camp-v1.webp',color:'#564b36'},
  'forest-path':{id:'forest-path',name:'林间小径',background:'./assets/battles/forest-path-v1.webp',color:'#3d4934'},
  'river-dock':{id:'river-dock',name:'河岸渡口',background:'./assets/battles/river-dock-v1.webp',color:'#4b5949'},
  'rural-road':{id:'rural-road',name:'乡野官道',background:'./assets/battles/rural-road-v1.webp',color:'#776449'},
  farmland:{id:'farmland',name:'村边农田',background:'./assets/battles/farmland-v1.webp',color:'#79623e'},
  'market-street':{id:'market-street',name:'城内街市',background:'./assets/battles/market-street-v1.webp',color:'#655b4b'},
  'county-prison':{id:'county-prison',name:'县衙牢房',background:'./assets/battles/county-prison-v1.webp',color:'#544e42'}
 };
 function get(id){if(!definitions[id])throw new TypeError('未登记的战斗场景：'+id);return {...definitions[id]};}
 function defaultFormation(count,leader=0){if(count===3||count===5)return {front:[leader],back:Array.from({length:count},(_,i)=>i).filter(i=>i!==leader)};if(count===6)return {front:[3,4,5],back:[0,1,2]};return null;}
 function arrange(scene,enemies){
  if(scene.enemyFormation||enemies.length<2)return scene;
  // 两人和四人直接横排，单位身上的前后排标记不拆散小队。
  if(enemies.length===2||enemies.length===4)return scene;
  const front=[],back=[];enemies.forEach((unit,index)=>(unit.formationRow==='front'?front:back).push(index));
  const formation=enemies.length===3||enemies.length===5?defaultFormation(enemies.length,front[0]??0):front.length&&back.length?{front,back}:defaultFormation(enemies.length);
  return formation?{...scene,enemyFormation:formation}:scene;
 }
 const capitals={xuchang:'capital-wei',chengdu:'capital-shu',jianye:'capital-wu'};
 const town=node=>get(capitals[node.id]||(node.lon<110&&node.lat>=33.5?'city-frontier':node.lon<109&&node.lat<33.5?'city-shu':node.lat<33.8?'city-river':'city-north'));
 const api={definitions,get,arrange,town,defaultFormation};root.BattleScenes=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
