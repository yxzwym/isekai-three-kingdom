(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,I=node?require('./items.js'):root.ItemCatalog,N=node?require('./nearby-content.js'):root.NearbyContent,R=node?require('./recruitment-content.js'):root.RecruitmentContent;
 const definitions=[
 {id:'abandoned-fort',title:'废弃军堡',parent:'changshan',level:3,sceneId:'bandit-camp',pattern:'earlyPhysical',prize:'fort-brace',rumor:"常山南边的废军堡，近来总见人往里钻。旧军械库没塌，有人捡了护具出来。不过惦记那点东西的，不光是赶路人。"},
 {id:'reed-shrine',title:'芦泽古祠',parent:'pingyuan',level:6,sceneId:'river-dock',pattern:'venom',prize:'shrine-charm',rumor:"平原古祠退水了，有人带出只药香囊，便惹得一堆人去寻。也有中了毒横着回来的，最好请个懂医的同去。"},
 {id:'old-manor',title:'荒废庄园',parent:'beihai',level:9,sceneId:'market-street',pattern:'arcane',prize:'manor-pendant',rumor:"北海旧庄园塌了东墙，露出个老库房。有人捡着旧饰品，说拿在手里轻得很。消息一传，外乡人都赶着去了。"}
 ];
 Object.assign(I.templates,{
 'fort-brace':{id:'fort-brace',name:'玄铁臂盾',slot:'accessory',iconId:'shield',attributes:{armor:24,constitution:8,war:3},price:220,dungeonOnly:true},
 'shrine-charm':{id:'shrine-charm',name:'辟瘴香囊',slot:'accessory',iconId:'woven-charm',attributes:{resistance:10,intelligence:8},statusImmunities:['poison'],price:220,dungeonOnly:true},
 'manor-pendant':{id:'manor-pendant',name:'追风坠',slot:'accessory',iconId:'wood-beads',attributes:{speed:35,technique:8},price:240,dungeonOnly:true}
 });
 for(const d of definitions){R.landmark(d.id,d.title,d.parent,35,45);N.npcs.push({id:'keeper-'+d.id,name:'寻宝客',art:'laborer',role:'quest',place:d.id,side:'left',lines:["外头几间我们走过，里头还没探。伤裹好，兵器拿稳，再进去吧，里面没人给你递药。"],dungeonId:d.id});N.npcs.push({id:'rumor-'+d.id,name:'过路客',art:'villager',role:'rumor',place:d.parent,side:'left',lines:[d.rumor],dungeonRumor:d.id});N.sideQuests.push({id:d.id,title:d.title,giver:'keeper-'+d.id,giverPlace:d.id,place:d.id,sceneId:d.sceneId,recommendedLevel:d.level,fixedCombatLevel:d.level,pattern:d.pattern,rounds:3,money:d.level*15,item:d.prize,quality:'green',repeatable:true,dungeon:true,enemyName:'寻宝敌手',enemyArt:'brigand',accept:"里头几伙人正在争东西，连过路的也抢。我们没敢再进，你们看准了再走。"});}
 const D=node?require('./world-data.js'):root.WorldData,Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;const source=D.encounters.thieves;if(source){D.encounters['wild-wolves']={...JSON.parse(JSON.stringify(source)),id:'wild-wolves',title:'野狼拦路',count:2,roster:Catalog.roster(1,2,'beasts')};const previous=D.roadEvents.find(e=>e.kind==='battle'&&e.weight>1);if(previous){previous.weight--;D.roadEvents.push({id:'wild-wolves',kind:'battle',weight:1,encounter:'wild-wolves',title:'林中狼影',text:'草丛里传来低低的呜声，两匹狼已经绕到了路边。'});}}
 const api={definitions};root.EarlyDungeons=api;if(node)module.exports=api;
})(globalThis);
