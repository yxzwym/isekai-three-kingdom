(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,I=node?require('./items.js'):root.ItemCatalog,N=node?require('./nearby-content.js'):root.NearbyContent,R=node?require('./recruitment-content.js'):root.RecruitmentContent;
 const definitions=[
 {id:'abandoned-fort',title:'废弃军堡',parent:'changshan',level:3,sceneId:'bandit-camp',pattern:'earlyPhysical',prize:'fort-brace',rumor:'常山南边那座废军堡，最近总有人进去翻找。听说旧军械库还没塌，里面有些当年留下的护具。去的人也不全是寻宝的，路上小心。'},
 {id:'reed-shrine',title:'芦泽古祠',parent:'pingyuan',level:6,sceneId:'river-dock',pattern:'venom',prize:'shrine-charm',rumor:'平原河滩那座古祠退了水，有人从里面带回一只药香囊。现在去寻东西的人不少，可也有人中了毒回来，最好带个懂医术的。'},
 {id:'old-manor',title:'荒废庄园',parent:'beihai',level:9,sceneId:'market-street',pattern:'arcane',prize:'manor-pendant',rumor:'北海旧庄园的东墙倒了，露出一间封了多年的库房。前两天有人捡到轻巧的旧饰品，消息一传开，连外乡人都往那儿赶。'}
 ];
 Object.assign(I.templates,{
 'fort-brace':{id:'fort-brace',name:'玄铁臂盾',slot:'accessory',iconId:'shield',attributes:{armor:24,constitution:8,war:3},price:220,dungeonOnly:true},
 'shrine-charm':{id:'shrine-charm',name:'辟瘴香囊',slot:'accessory',iconId:'woven-charm',attributes:{resistance:10,intelligence:8},statusImmunities:['poison'],price:220,dungeonOnly:true},
 'manor-pendant':{id:'manor-pendant',name:'追风坠',slot:'accessory',iconId:'wood-beads',attributes:{speed:35,technique:8},price:240,dungeonOnly:true}
 });
 for(const d of definitions){R.landmark(d.id,d.title,d.parent,35,45);N.npcs.push({id:'keeper-'+d.id,name:'寻宝客',art:'laborer',role:'quest',place:d.id,side:'left',lines:['里面的路还能走。我们只探过外头几间，你们要继续深入，先把伤势和兵器料理好。'],dungeonId:d.id});N.npcs.push({id:'rumor-'+d.id,name:'过路客',art:'villager',role:'rumor',place:d.parent,side:'left',lines:[d.rumor],dungeonRumor:d.id});N.sideQuests.push({id:d.id,title:d.title,giver:'keeper-'+d.id,giverPlace:d.id,place:d.id,sceneId:d.sceneId,recommendedLevel:d.level,fixedCombatLevel:d.level,pattern:d.pattern,rounds:3,money:d.level*15,item:d.prize,quality:'green',repeatable:true,dungeon:true,enemyName:'寻宝敌手',enemyArt:'brigand',accept:'里面有几伙人在抢东西，连过路的人也不放过。先看看情况，再往里走。'});}
 const D=node?require('./world-data.js'):root.WorldData,Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;const source=D.encounters.thieves;if(source){D.encounters['wild-wolves']={...JSON.parse(JSON.stringify(source)),id:'wild-wolves',title:'野狼拦路',count:2,roster:Catalog.roster(1,2,'beasts')};const previous=D.roadEvents.find(e=>e.kind==='battle'&&e.weight>1);if(previous){previous.weight--;D.roadEvents.push({id:'wild-wolves',kind:'battle',weight:1,encounter:'wild-wolves',title:'林中狼影',text:'草丛里传来低低的呜声，两匹狼已经绕到了路边。'});}}
 const api={definitions};root.EarlyDungeons=api;if(node)module.exports=api;
})(globalThis);
