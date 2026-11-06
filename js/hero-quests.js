(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,W=node?require('./weapon-skills.js'):root.WeaponSkills,I=node?require('./items.js'):root.ItemCatalog;
 const definition={id:'ganning',title:'江上锦帆',category:'story',recommendedLevel:10,country:'wu',place:'xinye',start:'rumor',stages:{
  locked:{objective:''},
  rumor:{objective:'前往新野查探消息',npc:{id:'ganning-neighbor',name:'街坊',art:'villager',lines:['你们也是来看热闹的？这两天衙门门口挤满了人，听说抓了个叫甘宁的水匪，腰上挂着铜铃，以前在江上很有名气。','前阵子官府张榜招安，他带人来了，哪知道刚进衙门就让人卸了兵器。人还关在牢里，这回恐怕没那么容易出来。'],choices:[{label:'去衙门打听',next:'gate'}]}},
  gate:{objective:'向新野狱卒打听探监的办法',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,lines:['探监？你跟他是什么关系？上头有话，这个人不许随便见。','不过，我这几日当差辛苦，连口热饭都吃不上。你要真是来探亲的，总得表示表示。'],choices:[{label:'打点狱卒',price:100,next:'prison'}]}},
  prison:{strictDialogue:true,sceneId:'county-prison',objective:'进牢探望甘宁',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,lines:['来探我的？我那帮弟兄没这份闲钱。你是谁，找我做什么？','说是招安，酒倒是摆好了，可我刚坐下，门就关了。前些日子我掀了他们一条运黑钱的船，这笔账，他们一直记着。','我抢过什么船、杀过什么人，用不着旁人替我遮掩。可要我认了这张写满胡话的口供，没门。'],choices:[{label:'出牢查看消息',next:'notice'}]}},
  notice:{objective:'查看新野衙门外的新告示',npc:{id:'ganning-notice',name:'告示牌',icon:'任务',lines:['告示上列着甘宁的罪状，最下面新添了一行朱笔：近日押赴刑场问斩。','探监的钱只买来了一次见面。要救人，还得再想办法。'],choices:[{label:'商量救人办法',next:'plan'}]}},
  plan:{objective:'选择赎人，或强闯新野牢房',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,lines:['你还没走？想把人领出去，可不是刚才那点钱能办到的。','事情也不是完全没得商量。上头只看钱有没有送够，至于牢里少了个人，自然有人能把册子改了。'],choices:[{label:'重金赎人',price:5000,next:'freed'},{label:'强闯衙门',battle:'breach'}]}},
  breach:{objective:'击退新野衙门守卫',npc:{id:'ganning-guard',name:'官兵队长',art:'imperial-soldier',observe:true,lines:['敢在衙门口拔兵器？把门关上，一个也别让他们走！'],choices:[{label:'闯入外院',battle:'breach'}]}},
  cell:{objective:'突破牢房守卫，救出甘宁',npc:{id:'ganning-cell-guard',name:'牢房守卫',art:'imperial-soldier',observe:true,lines:['里头的，把犯人看住！外院挡不住了，谁敢开牢门，谁就跟他们一起下狱！'],choices:[{label:'夺取牢房',battle:'cell'}]}},
  freed:{objective:'与甘宁商议去留',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,lines:['总算能出来喘口气了。这份情我记下了，往后你有事，尽管开口。','我原想带弟兄们去建业。听说孙权肯用人，总比在这里听人摆布强。你们若还缺人手，我可以先陪你们走一程。'],choices:[{label:'留下同行',recruit:true},{label:'先去建业',recruit:false}]}},
  complete:{objective:'甘宁已脱困，愿为吴国效力'}
 },battles:{breach:{stage:['plan','breach'],next:'cell',title:'新野衙门',sceneId:'market-street',count:4},cell:{stage:['cell'],next:'freed',title:'牢房突围',sceneId:'county-prison',count:5}},source:'https://article.ali213.net/html/1241_9.html'};
 const definitions={ganning:definition};
 function normalize(value={},unlocked=false){return Object.fromEntries(Object.values(definitions).map(d=>{const old=value?.[d.id]||{},stage=Object.hasOwn(d.stages,old.stage)?old.stage:unlocked?d.start:'locked';return [d.id,{stage}];}));}
 function npc(id,state){const d=definitions[id],n=d?.stages[state?.stage]?.npc;return n?{...n,sceneId:d.stages[state.stage].sceneId,heroQuest:id,side:'left',role:'heroQuest',roleLabel:'剧情'}:null;}
 function companion(){const weapon=I.create('weapon-blade','green','ganning-blade');return {...G.create('ganning',10),id:'ganning',name:'甘宁',characterId:'ganning',homeNode:'jianye',experience:0,experienceVersion:2,weaponPlanVersion:3,weapon,skills:W.forWeapon(weapon),priorities:W.prioritiesFor(W.forWeapon(weapon)),equipment:{armor:I.create('leather-armor','green','ganning-armor'),accessory1:null,accessory2:null},armor:4,resistance:3,weaponProficiencies:{blade:80},passives:['ganning-brocade']};}
 function enemies(count){return Array.from({length:count},(_,i)=>{const captain=i===0,weapon=I.create('weapon-'+(captain?'shield':'spear'),'white','jail-weapon-'+i),skills=captain?W.forWeapon(weapon):['spear-cut','spear-sweep'];return {...G.create(captain?'imperialCaptain':i%2?'imperialPikeman':'imperialSoldier',10),id:'jail-guard-'+i,name:captain?'官兵队长':'官兵',characterId:'imperial-soldier',weapon,attack:weapon.power,equipment:{armor:I.create('leather-armor')},armor:6,resistance:3,weaponProficiencies:{[weapon.type]:40},skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:W.skills[skill].kind==='buff'?'always':'sometimes'}))};});}
 const api={definitions,normalize,npc,companion,enemies};root.HeroQuests=api;if(node)module.exports=api;
})(globalThis);
