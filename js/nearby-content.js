(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog,W=node?require('./weapon-skills.js'):root.WeaponSkills;
 const np=(id,name,art,role,place,lines)=>({id,name,art,role,place,side:role==='healer'?'right':'left',roleLabel:{civilian:'交谈',quest:'委托',merchant:'商贩',healer:'疗伤'}[role]||'交谈',lines});
 const npcs=[
  np('changshan-elder','里正','villager','quest','changshan',['你是想打听人，还是找个住的地方？西边有间空屋，我让人腾张铺位出来。走了一路，先在这里歇歇吧。','逃难来的乡亲暂时都住在村里，赵将军一直帮着照顾。住的地方还能再挤一挤，可粮食剩得不多了，大家都在发愁。']),
  np('changshan-woodcutter','樵夫','laborer','quest','changshan',['你准备进山吗？山口那条近路先别走，我前两天在那里遇见了贼，柴和斧头都没保住，跑回来时还摔了一跤。','以前我天不亮就进山，如今得等邻居们一起出门。也不是人多就打得过，只是遇到事情，总能有人跑回来报信。']),
  np('changshan-doctor','乡医','villager','healer','changshan',['身上有伤吗？到这边坐，把袖子挽起来，我看看伤口。别隔着衣服自己揉，脏东西揉进去，会更难处理。','想包扎的话就在这里坐会儿，轮到了我叫你。干净布条剩得不多，我还得找人再洗一些，伤重的先看，别着急。']),
  np('changshan-maiden','阿禾','village-maiden','civilian','changshan',['西边那间屋子我已经扫干净了，晚上再铺些干草。今天投宿的人多，要是被子不够，我再去问邻居借几床。','东边那家的小孩今天总算肯出来玩了。刚来的时候，一听见马蹄声就躲到桌下，抱着他娘怎么也不肯松手，实在叫人心疼。']),
  np('grain-steward','仓守','villager','quest','zhongshan',['这些粮是附近几家凑给常山乡亲的。我们还没把车备好，贼就来了，把守仓的人赶走，连仓门都给换了锁。','你看这些粮袋，线的颜色都不一样，是各家自己缝好送来的。我都点过数，只怕那伙人搬来搬去，把好好的粮食也糟蹋了。']),
  np('road-merchant','行商','laborer','merchant','zhongshan',['要买兵器还是护具？我这里有些旧货，看着不新，刃口和甲扣都修过了，用起来没问题，你可以慢慢挑。','最近送货太难，一趟路常要绕好几个村子，走到天黑也未必能到。等道路安稳些，我再多进点东西，现在先卖手里这些。']),
  np('grain-maiden','阿芹','village-maiden','civilian','zhongshan',['你在找甄姑娘？她本来在这里替人看伤，贼听说甄家有粮，就把她和几个伤者一起带走了，说要叫她家里拿东西来换人。','甄姑娘给我弟弟包过伤，他一直怕疼不肯让人碰，还是她哄了半天才肯伸手。不知道她现在有没有受伤，我这几天一直惦记着。']),
  np('refugee-laborer','车夫','laborer','quest','zhongshan-county',['我跟着那伙人看见了，他们把甄姑娘带进旧祠堂的后院。门口一直有人守着，我想靠近听听，还差点被他们发现。','车轮已经修好，我就停在路边等。里面那几个伤者走不动，甄姑娘肯定不愿意丢下他们，所以还得有人把车赶过去接。']),
  np('wujii-servant','甄家侍女','maid','civilian','zhongshan-county',['你们有没有见过我家姑娘？她出门给人看病，到现在都没回家。我一路问到这里，可守门的人连她的消息都不肯说。','她出门时带了整箱药，跟我说用完就回来。我昨天还在等她回家，早知道外头这么乱，真该一起出来，至少有人能送个信。']),
  np('julu-carrier','运粮老卒','villager','quest','julu',['粮车往广宗去了，本来说前天就回，可一直没消息。我想去找找，偏偏这条腿又犯了老伤，连上车都得有人扶。','你们从外面过来，有没有看见几辆运粮车？赶车的老冯脸上有道疤，年纪跟我差不多，要是见过，劳烦跟我说一声。']),
  np('guangzong-worker','补车匠','laborer','civilian','julu-county',['车轮松了就推到这边来，我帮你看看。别觉得还能转就凑合上路，真在半道掉下来，伤着人不说，货也全得耽误。','这两天等着修的车太多，木料都快用光了。有急事的我先修，能等的就在旁边歇一会儿，轮到谁我会叫。']),
  {...np('xinye-doctor','药铺郎中','villager','healer','xinye',['到这里坐吧，我先把伤口清理一下，再换上干净布条。包好以后别沾水，觉得又疼又热，就回来让我再看看。','衙门那边闹得很厉害，你们要是还准备过去办事，至少先把身上的伤处理好。带着伤硬撑，真碰到麻烦就更难脱身了。']),unlockQuest:'ganning'}
 ];
 const conversations={
  'changshan-elder':{afterReturn:['粮食已经分给各家了，剩下的也收进了仓里。今晚大家准备一起做顿饭，你们不急着赶路的话，就留下吃完再走吧。','早上有人想回去看看自家的田，我劝他们先等等。路上还有没有乱兵，得问清楚，不能刚吃上几顿饱饭，又出了事。']},
  'changshan-maiden':{afterReturn:['昨天饭刚煮好，几个孩子就围在灶边等。好不容易分到碗里，烫得直吹气也不肯放下，看来之前真是饿坏了。','你们住过的铺位还留着，回来提前跟我说一声就行。我把被子晒一晒，再换些干草，晚上住着也舒服点。']},
  'grain-steward':{afterReturn:['粮车平安送到，我这边也放心了。这两天我找人把仓门补好，再安排几个年轻人轮流守着，不能总让我一个老头留在这里。','那些破粮袋我都收着呢，洗干净再补一补还能用。你们路上要是缺袋子，来跟我拿，别又为了装点东西多跑一趟。']},
  'grain-maiden':{afterRescue:['听说甄姑娘已经救出来了，太好了！我弟弟还问她什么时候再来，想把自己做的小竹篮送给她，说以后能用来装药。','我煮了些吃的，想送给祠堂里救出来的伤者。你们见到甄姑娘，帮我问问他们有没有什么不能吃的，我好重新准备。']},
  'refugee-laborer':{afterRescue:['人接出来，车也没坏，我终于敢回家安心睡一觉了。你们以后还要运人运东西，提前来叫我，我把车收拾好再出发。','那几个伤者一路上都在跟我道谢，我让他们少说话，先留着力气养伤。盼着下次见面，他们都能自己站起来走路。']},
  'wujii-servant':{afterRescue:['多亏你们把姑娘救回来！她刚进门就问药箱找到了没有，自己身上的灰都没拍。我又高兴又着急，只好先拉着她坐下来。','换洗的衣服我已经收好了。姑娘要是还跟你们出门，麻烦帮我提醒她按时吃饭，她一忙起来，常常只记得病人，忘了自己也饿着。']}
 };
 const sideQuests=[
  {id:'clear-mountain',sceneId:'bandit-camp',title:'山道清剿',giver:'changshan-woodcutter',giverPlace:'changshan',place:'zhongshan',enemyName:'山道盗匪',enemyArt:'mountain-bandit',recommendedLevel:4,rounds:5,money:180,item:'leather-armor',quality:'green',description:'前往中山山道清理盗匪，再回常山向樵夫复命。',accept:'你们愿意帮忙，那真是太好了。那些贼就在通往中山的山道上，分散住着几间旧棚。到了找一找，把还没离开的也清出去，不能只赶跑眼前的一伙。'},
  {id:'grain-escort',sceneId:'farmland',title:'营粮归路',giver:'julu-carrier',giverPlace:'julu',place:'julu-county',enemyName:'拦粮山贼',enemyArt:'mountain-bandit',recommendedLevel:3,rounds:2,money:100,item:'cloth-armor',quality:'green',description:'前往广宗击退拦粮山贼、护送粮车，再回巨鹿向老卒复命。',accept:'麻烦你们往广宗走一趟，粮车走的是那条旧驿道。找到人以后，先看看有没有受伤，要真被贼拦住了，也请把他们和粮车一起接出来。'},
  {id:'trade-road',sceneId:'market-street',title:'商路肃清',giver:'road-merchant',giverPlace:'zhongshan',place:'zhongshan-county',enemyName:'商道匪首',enemyArt:'brigand',recommendedLevel:5,rounds:5,money:240,item:'copper-ring',quality:'green',description:'前往毋极清理商道盗匪，再回中山向行商复命。',accept:'毋极那边的商道有好几伙贼，专盯着落单的货车。你们要是肯帮忙清路，我们几个商人愿意一起出酬劳，等事情办好，一定按约给你们。'}
 ];
 function enemy(profile,level,name,art,type,skills,index=0){const weapon=I.create('weapon-'+type,'white','enemy-'+index);weapon.id='outlaw-'+type;weapon.skills=skills.map(id=>id==='blade-cut'?{base:id,name:'劈砍'}:id);skills=W.forWeapon(weapon);return {...G.create(profile,level),name,characterId:art,weapon,armor:3,resistance:3,equipment:{armor:I.create('cloth-armor','white','enemy-armor-'+index)},skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:'sometimes'}))};}
 const bandits=(level,count,captain=false)=>Array.from({length:count},(_,i)=>({...enemy(i===0&&captain?'brigand':i%2?'riverBandit':'thief',level,i===0&&captain?'盗匪头目':i%2?'山贼':'盗贼',i===0&&captain?'brigand':i%2?'mountain-bandit':'thief',i%2?'spear':'blade',i===0&&captain?['blade-sweep','blade-cut']:i%2?['spear-cut']:['blade-cut'],i),...(i===0&&captain?{formationRow:'front',statusImmunities:['stun'],passives:['enemy-stun-resistance']}:{})}));
 const storyConversations={changshanEntry:[
  {speaker:'villager',text:'你想进村歇脚吗？先在这里等等吧，里面来了几个山贼，堵着人要粮，还把劝架的人打伤了，正吵得厉害。'},
  {speaker:'hero',text:'村里看着也没剩多少粮，他们还来抢？附近没有能帮忙的人吗，大家就这么被堵在这里？'},
  {speaker:'villager',text:'官府很久没管过了。最近有个使枪的年轻人在照应，可他刚去了村东……你看，那几个贼往这边来了，你先站远一点。'},
  {speaker:'thief',text:'老头，那两袋粮还没搬出来？赶紧去拿！旁边那个也不许走，既然来了，把身上值钱的都留下。'},
  {speaker:'hero',text:'村里的人已经快吃不上饭了，你们连最后这点粮也要拿走？他刚才还在告诉我，有人被你们打伤了。'},
  {speaker:'thief',text:'怎么，你也想管？那就跟他们一起留下！把他绑起来，先搜搜他身上有没有钱，别让他跑了！'},
  {speaker:'zhaoyun',text:'把人放开，别再动手。这些粮要留给村里的老人和孩子，你们拿走了，叫他们明天吃什么？'},
  {speaker:'thief',text:'又是你！昨天放你一马，今天还敢来拦？弟兄们一起上，把他手里的枪夺下来，看他还怎么逞强！'},
  {speaker:'zhaoyun',text:'这位朋友，帮我拦一下左边那个人，别让他进村去抓人。乡亲们先回屋，把门关好，这里我们来挡！'},
  {speaker:'hero',text:'左边我来守，你小心后面还有一个。大叔，你也赶紧进屋，别留在路中间。'}
 ]};
 storyConversations.escortArrival=[
  {speaker:'villager',text:'子龙，你们把粮运回来了！快往村里推吧，大家都等着呢……后面那几个带刀的，也是跟你们一起回来的吗？'},
  {speaker:'zhaoyun',text:'不是，他们应该一路跟着车。乡亲们先把粮推进去，进屋以后把门拴好，别在外头围着看。'},
  {speaker:'thief',text:'前面的给我站住！从粮仓里搬了东西，拍拍手就想走？那几车粮今天得留下，你们谁也不许推！'},
  {speaker:'hero',text:'他们果然没肯罢休，还追到村口来了。里面有孩子和伤者，不能让他们冲进去，我们得在这里把人拦住。'},
  {speaker:'zhaoyun',text:'我守住村口这条路，你帮着照看粮车旁边。乡亲们快进去，等把门关好再出来帮忙，别让他们抓到人。'}
 ];
 const storyBattles={entry:{sceneId:'farmland',title:'常山村口',place:'changshan',scaling:'early',count:2},grain:{followup:{phase:'grain',speaker:'zhaoyun',lines:['前院的人已经退开，粮袋还在。后院还有几个正在搬东西，我们现在过去，别让他们把仓门堵上，再从后墙逃走。']},sceneId:'market-street',title:'夺回乡粮',place:'zhongshan',scaling:'early',count:3},rescue:{sceneId:'market-street',title:'祠堂救人',place:'zhongshan-county',scaling:'early',count:2},escort:{sceneId:'rural-road',title:'粮车归途',place:'changshan',scaling:'early',pattern:'earlyLeader',count:3}};
 // 普通施法者使用独立的杂兵成长档案，数值随等级成长，不借用名将潜力。
 const casterProfiles={outlawCaster:[[3,9,7,10,8],[15,45,35,50,40]],fieldMedic:[[3,9,8,8,8],[15,45,40,40,45]],fieldPriest:[[3,9,8,7,8],[15,45,40,35,45]],outlawWitch:[[3,8,8,8,8],[15,45,40,40,45]]};
 for(const [id,[base,potential]]of Object.entries(casterProfiles))G.PROFILES[id]={baseAttributes:Object.fromEntries(G.KEYS.map((key,i)=>[key,base[i]])),potentials:Object.fromEntries(G.KEYS.map((key,i)=>[key,potential[i]]))};
 const enemyRoles={
  caster:{profile:'outlawCaster',name:'游方法士',armyName:'军中方士',art:'herbalist',type:'staff',skills:['staff-fire']},
  medic:{profile:'fieldMedic',name:'盗匪医师',armyName:'军医',art:'town-doctor',type:'needle',skills:[{base:'needle-stun',name:'飞针袭',effects:[]},'needle-heal']},
  healer:{profile:'fieldPriest',name:'符水医师',armyName:'随军医师',art:'herbalist',type:'scripture',skills:['scripture-3','scripture-2']},
  witch:{profile:'outlawWitch',name:'使毒巫医',armyName:'使毒方士',art:'herbalist',type:'gourd',skills:['gourd-poison','gourd-regeneration']}
 };
 function roleEnemy(role,level,index,options={}){if(!enemyRoles[role])throw new Error('未知敌军职责：'+role);return (node?require('./enemy-catalog.js'):root.EnemyCatalog).unit(role,level,index,options);}
 function mixRoster(roster,roles,options={}){if(!roles)return roster;return roster.map((u,i)=>enemyRoles[roles[i]]?{...roleEnemy(roles[i],u.level,i,options),id:u.id,...(u.formationRow?{formationRow:u.formationRow}:{}),...(u.experienceWeight?{experienceWeight:u.experienceWeight}:{})}:u);}
 function mixedRoles(count,variant=0){const roles=Array(count).fill(null);if(count<2)return roles;const options=['caster','medic','healer','witch'],pick=((Number(variant)||0)%8+8)%8;if(pick>=options.length)return roles;roles[count-1]=options[pick];if(count>=5)roles[count-2]=options[(pick+2)%options.length];return roles;}
 const services={healing:{price:8,currency:'文'}};
 const combatProgression={initialCap:20,caps:[20]};
 const api={services,combatProgression,npcs,conversations,storyConversations,sideQuests,enemy,bandits,storyBattles,enemyRoles,roleEnemy,mixRoster,mixedRoles};root.NearbyContent=api;if(node)module.exports=api;
})(globalThis);
