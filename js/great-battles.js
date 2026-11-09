(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,Cast=node?require('./chapter-cast.js'):root.ChapterCast,Recruit=node?require('./recruitment-content.js'):root.RecruitmentContent,Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;
 const definitions=[
  {id:'guandu',title:'官渡之战',sceneId:'farmland',limit:5,level:100,preset:['caocao','zhangliao','xiahoudun','xuchu','xunyu'],foes:['yuanshao','yanliang','wenchou',{role:'archer',name:'河北弓手'},{role:'medic',name:'河北军医'}]},
  {id:'chibi',title:'赤壁之战',sceneId:'river-dock',limit:10,level:100,preset:['huanggai','ganning','taishici','sunshangxiang','lvmeng','zhouyu','zhugeliang','lusu','liubei','zhaoyun'],foes:['caocao','zhangliao','xiahoudun','xuchu','caoren','simayi','xunyu','jiaxu','xuhuang','yujin']},
  {id:'hulao',title:'虎牢关之战',sceneId:'city-frontier',limit:5,level:100,preset:['liubei','guanyu','zhangfei','caocao','lusu'],foes:['lvbu','huaxiong','gaoshun','liru',{role:'medic',name:'关前军医'}]},
  {id:'hefei',title:'合肥之战',sceneId:'city-river',limit:5,level:100,preset:['sunquan','ganning','taishici','huanggai','lusu'],foes:['zhangliao','xiahoudun',{role:'armored',name:'合肥守军'},{role:'caster',name:'军中方士'},{role:'medic',name:'守城军医'}]}
 ];
 function roster(b){return b.foes.map((entry,i)=>{const named=typeof entry==='string',u=named?(Cast.definitions[entry]?Cast.unit(entry,b.level):Recruit.companion(entry,b.level)):{...Catalog.unit(entry.role,b.level,i,{army:true,maxLevel:100}),name:entry.name};return {...u,id:'war-'+b.id+'-'+i,...(named?{statusImmunities:[...new Set([...(u.statusImmunities||[]),'stun'])],passives:[...new Set([...(u.passives||[]),'enemy-stun-resistance'])]}:{}),formationRow:i<Math.ceil(b.foes.length/2)?'back':'front',initialProgress:(i*.17)%.6,targetRule:'random'};});}
 const api={definitions,roster};root.GreatBattles=api;if(node)module.exports=api;
})(globalThis);
