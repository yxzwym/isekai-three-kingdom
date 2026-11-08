(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,W=node?require('./weapon-skills.js'):root.WeaponSkills,I=node?require('./items.js'):root.ItemCatalog;
 const talk=(...rows)=>({turns:rows.map(([speaker,text])=>({speaker,text})),lines:rows.map(row=>row[1])});
 const definition={id:'ganning',title:'江上锦帆',category:'story',recommendedLevel:10,country:'wu',place:'xinye',start:'rumor',stages:{
  locked:{objective:''},
  rumor:{objective:'前往新野查探消息',npc:{id:'ganning-neighbor',name:'街坊',art:'villager',...talk(
   ['hero','大叔，我想打听件事。衙门门口怎么围着那么多人，里面是出了什么事吗？'],
   ['npc','刚抓回来一个叫甘宁的水匪。听说他手下那群人总穿着鲜亮的衣服，腰上还挂铃铛，江上过船的，多半听说过他们。'],
   ['hero','我听过甘宁的名字。不过他不是一直在江上活动吗，怎么会在新野被抓住？'],
   ['npc','官府前阵子说要招安，他就带人来了，哪知道一进衙门就被绑了。有人说县尉跟他有旧怨，也有人说招安就是个幌子。我也没亲眼看见，你可以去牢门口再问问。']),choices:[{label:'去衙门打听',next:'gate'}]}},
  gate:{objective:'向新野狱卒打听探监的办法',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,...talk(
   ['hero','我想探望一下关在里面的甘宁。他现在能见人吗，要到哪里登记？'],
   ['npc','县尉吩咐过，甘宁不许见客。你别在这里等了，今天换谁当值，都不会随便放人进去。'],
   ['hero','我不是来领人的，只想问他几句话。有什么手续需要办，你告诉我，我不会进去给你惹麻烦。'],
   ['npc','手续倒没那么复杂，只是放你进去，我总得担点风险。现在管事不在，你要是肯给些茶钱，我可以让你进去一会儿，别待得太久。']),choices:[{label:'打点狱卒',price:100,next:'prison'}]}},
  prison:{strictDialogue:true,sceneId:'county-prison',objective:'进牢探望甘宁',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,...talk(
   ['npc','你是来找我的？我好像没见过你。是我那些弟兄请你来，还是外面有什么消息？'],
   ['hero','我在街上听说你被抓了，才想进来看看。外面说官府答应招安，你也带人来了，怎么反倒把你关进了牢里？'],
   ['npc','县尉派人跟我说，愿意给我和弟兄们安排个正经差事。我想着总不能一直在江上抢船，就来赴宴。谁知道酒还没喝完，外头就冲进来一群官兵。'],
   ['hero','他把你们请来，连守卫都提前安排好了，根本没有打算跟你好好谈吧？'],
   ['npc','前些时候，我扣过他的一条官船，船上装的东西不能让人知道。他怕我往外说，就拿招安骗我进城，再逼我认下抢村子的罪，好把以前的事一起掩盖。'],
   ['hero','我进来时，外面还没贴处置你的告示。你在这里等消息，我出去找人问问，看看还有没有办法把事情说清楚。'],
   ['npc','你帮我，我当然感激，可别让县尉知道你在查那条船。我已经吃过一次亏，不想再害你也被他们骗进来。']),choices:[{label:'出牢查看消息',next:'notice'}]}},
  notice:{objective:'查看新野衙门外的新告示',npc:{id:'ganning-notice',name:'告示牌',icon:'任务',...talk(
   ['npc','新野县衙告示：甘宁因聚众劫掠已被关押，定于三日后处斩。各处守卫须严加看守，禁止私自放行。'],
   ['hero','这么快就定了处斩的日子，看来他根本不打算让甘宁开口。刚才那个狱卒肯放我进去，可以再找他问问，看还有没有救人的办法。']),choices:[{label:'商量救人办法',next:'plan'}]}},
  plan:{objective:'选择赎人，或强闯新野牢房',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,...talk(
   ['hero','我看见外面的告示了，甘宁三日后就要被处斩。你知不知道，还有什么办法能让他离开这里？'],
   ['npc','你还真准备救他？刚才只是让你进去说几句话，放人可是另一回事，出了事我也得掉脑袋。'],
   ['hero','我明白。如果真有办法，你把条件说清楚，我们再想办法。要是只想让我多付一次探监的钱，就不必了。'],
   ['npc','管事那里肯收钱，名册上就能把人记成病死，再趁晚上放出去。不过要交的可不是一笔小钱，你们最好早些决定，押去刑场以后，我也帮不上忙。']),choices:[{label:'重金赎人',price:5000,next:'freed'},{label:'强闯衙门',battle:'breach'}]}},
  breach:{objective:'击退新野衙门守卫',npc:{id:'ganning-guard',name:'官兵队长',art:'imperial-soldier',observe:true,...talk(['npc','把牢门关上，他们是来劫狱的！快去叫后院的人过来，别只顾着守大门，让他们从旁边钻进去！']),choices:[{label:'闯入外院',battle:'breach'}]}},
  cell:{objective:'突破牢房守卫，救出甘宁',npc:{id:'ganning-cell-guard',name:'牢房守卫',art:'imperial-soldier',observe:true,...talk(['npc','都站住！里面的犯人还在我们手上，你们再往前走，我现在就进去杀了他！'],['hero','钥匙就在他腰上，得先把他拦住！别让他退进牢里，甘宁还在里面，我们跟上！']),choices:[{label:'夺取牢房',battle:'cell'}]}},
  freed:{objective:'与甘宁商议去留',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,...talk(
   ['npc','你居然真的把我救出来了。你走了那么久，我还以为外头出了事，或者你听说了我的底细，不肯再回来帮忙了。'],
   ['hero','我答应出去想办法，当然得回来告诉你结果。现在人平安出来了，你有没有地方能去，弟兄们还找得到吗？'],
   ['npc','我得先给他们送个消息，免得他们也闯进来送死。之后想去建业拜见孙将军，问问他肯不肯收我们。这次我会先把话问清楚，不会再傻乎乎地直接去喝酒了。'],
   ['hero','我们也准备去各地走走，找愿意一起对付董卓的人。你想去江东的话，可以先跟着我们，到了建业再一起去拜见孙将军。'],
   ['npc','好，我先托人告诉弟兄们，让他们去江边等消息。你们现在方便的话，我就一起走；人手已经够了，我先去建业，往后你们也能在那里找到我。']),choices:[{label:'留下同行',recruit:true},{label:'先去建业',recruit:false}]}},
  complete:{objective:'甘宁已脱困，愿为吴国效力'}
 },battles:{breach:{stage:['plan','breach'],next:'cell',title:'新野衙门',sceneId:'market-street',count:4},cell:{stage:['cell'],next:'freed',title:'牢房突围',sceneId:'county-prison',count:5}},source:'https://article.ali213.net/html/1241_9.html'};
 const definitions={ganning:definition};
 function place(id,state){const d=definitions[id];return d?.stages[state?.stage]?.place||d?.place;}
 function normalize(value={},unlocked=false){return Object.fromEntries(Object.values(definitions).map(d=>{const old=value?.[d.id]||{},stage=Object.hasOwn(d.stages,old.stage)?old.stage:unlocked||d.requiresChangshan===false?d.start:'locked';return [d.id,{stage,heard:!!old.heard,accepted:old.accepted??(!!old.stage&&old.stage!=='locked'&&old.stage!==d.start),...(old.puzzle?{puzzle:old.puzzle}:{})}];}));}
 function npc(id,state){const d=definitions[id],n=d?.stages[state?.stage]?.npc;return n?{...n,sceneId:d.stages[state.stage].sceneId,heroQuest:id,side:n.side||'left',role:'heroQuest',roleLabel:'剧情'}:null;}
 function companion(currentLevel=1){const weapon=I.create('weapon-blade','green','ganning-blade');return {...G.create('ganning',currentLevel),id:'ganning',name:'甘宁',characterId:'ganning',homeNode:'jianye',experience:0,experienceVersion:2,weaponPlanVersion:3,weapon,skills:W.forWeapon(weapon),priorities:W.prioritiesFor(W.forWeapon(weapon)),equipment:{armor:I.create('leather-armor','green','ganning-armor'),accessory1:null,accessory2:null},armor:4,resistance:3,weaponProficiencies:{blade:80},passives:['ganning-brocade']};}
 function enemies(count){return Array.from({length:count},(_,i)=>{const captain=i===0,weapon=I.create('weapon-'+(captain?'shield':'spear'),'white','jail-weapon-'+i),skills=captain?['shield-taunt','spear-cut']:['spear-cut'];return {...G.create(captain?'imperialCaptain':i%2?'imperialPikeman':'imperialSoldier',10),id:'jail-guard-'+i,name:captain?'官兵队长':'官兵',formationRow:captain?'front':'back',characterId:'imperial-soldier',weapon,attack:weapon.power,equipment:{armor:I.create('leather-armor')},armor:6,resistance:3,weaponProficiencies:{[weapon.type]:40},skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:W.skills[skill].kind==='buff'?'always':'sometimes'}))};});}
 const api={place,definitions,normalize,npc,companion,enemies};root.HeroQuests=api;if(node)module.exports=api;
})(globalThis);
