(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,Cast=node?require('./chapter-cast.js'):root.ChapterCast,Recruit=node?require('./recruitment-content.js'):root.RecruitmentContent,Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;
 const definitions=[
  {id:'guandu',title:'官渡之战',sceneId:'farmland',limit:5,level:100,preset:['caocao','zhangliao','xiahoudun','xuchu','xunyu'],foes:['yuanshao','yanliang','wenchou',{model:'taishici',name:'袁谭'},{model:'xunyu',name:'袁熙'}]},
  {id:'chibi',title:'赤壁之战',sceneId:'chibi-deck',limit:10,level:100,preset:['huanggai','ganning','taishici','sunshangxiang','lvmeng','zhouyu','zhugeliang','lusu','liubei','zhaoyun'],foes:['caocao','zhangliao','xiahoudun','xuchu','caoren','simayi','xunyu','jiaxu','xuhuang','yujin']},
  {id:'hulao',title:'虎牢关之战',sceneId:'city-frontier',limit:5,level:100,preset:['liubei','guanyu','zhangfei','caocao','lusu'],foes:['lvbu','huaxiong','gaoshun','liru','dongzhuo']},
  {id:'hefei',title:'合肥之战',sceneId:'city-river',limit:5,level:100,preset:['sunquan','ganning','taishici','huanggai','lusu'],foes:['zhangliao',{model:'xiahoudun',name:'乐进'},{model:'yujin',name:'李典'},'caoren','xuhuang']}
 ];
 function roster(b){return b.foes.map((entry,i)=>{const model=typeof entry==='string'?entry:entry.model,u=Cast.definitions[model]?Cast.unit(model,b.level):Recruit.companion(model,b.level);return {...u,id:'war-'+b.id+'-'+i,name:typeof entry==='string'?u.name:entry.name,characterId:u.characterId||model,unitType:'general',statusImmunities:[...new Set([...(u.statusImmunities||[]),'stun'])],passives:[...new Set([...(u.passives||[]),'enemy-stun-resistance'])],formationRow:i<Math.ceil(b.foes.length/2)?'back':'front',initialProgress:(i*.17)%.6,targetRule:'random'};});}
 const api={definitions,roster};root.GreatBattles=api;if(node)module.exports=api;
})(globalThis);
