(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog,W=node?require('./weapon-skills.js'):root.WeaponSkills;
 const np=(id,name,art,role,place,lines)=>({id,name,art,role,place,side:role==='healer'?'right':'left',roleLabel:{civilian:'交谈',quest:'任务',merchant:'商贩',healer:'疗伤'}[role]||'交谈',lines});
 const npcs=[
  np('changshan-elder','里正','villager','quest','changshan',["寻人还是投宿？西边空屋能挤出个铺位。脚上都是泥，赶了远路吧，进来歇一歇。","逃难来的都收在村里，赵将军日日帮着张罗。人还能挤，锅里的粮却一天天少，愁人哪。"]),
  np('changshan-woodcutter','樵夫','laborer','quest','changshan',["进山？别走山口那条近道！我前日碰着贼，柴、斧头全丢了，跑得太急，还栽了个跟头。","从前鸡没叫就上山，如今得等邻家一起。打是打不过，好歹能跑回一个报信，不至于丢了人还没人知晓。"]),
  np('changshan-doctor','乡医','villager','healer','changshan',["袖子挽起，坐到亮处。别隔着衣裳揉，泥都揉进伤里了。让我瞧瞧。","布条不多，得煮过再用。伤重的先来，其余的坐一会儿，轮着叫，不会落下谁。"]),
  np('changshan-maiden','阿禾','village-maiden','civilian','changshan',["西屋扫好了，晚些再铺干草。今日住的人多，被子若不够，我去隔壁借，你可别睡一半才喊冷。","东头那孩子今日跑出来玩了。刚来时一听马蹄，便往桌子底下钻，搂着他娘不松手。总算敢出门了。"]),
  np('grain-steward','仓守','villager','quest','zhongshan',["粮是各家凑的，本要送常山。车还没备齐，贼便闯进来，把我们赶出来，仓锁也换了。我这把钥匙，如今只剩个铁疙瘩。","袋口的线各有颜色，都是乡亲自己缝的，数我也记得。只怕他们乱拖乱搬，洒在泥里，想捡都捡不起来。"]),
  np('road-merchant','行商','laborer','merchant','zhongshan',["兵器还是护具？旧货，刃口重磨过，甲扣也换了。新不新先放一边，客官拿起试试，趁手要紧。","一车货绕三四个村，走到黑还摸不着城门。路再不好，我也只能守这些存货了。盼早些安生，好再添点货。"]),
  np('grain-maiden','阿芹','village-maiden','civilian','zhongshan',["来运粮的？仓门叫人占了，连院里歇脚的都没放出来。我们近前一问，就亮刀，也不知道里头如今怎样。","甄姑娘替我弟弟看过伤。他怕疼，躲了半天，她竟真哄得他肯伸手了。如今姑娘自己困在里面，可别也伤着才好。"]),
  np('refugee-laborer','车夫','laborer','quest','zhongshan',["轮子补好了，只等装粮。你们进仓时，看一眼后院那扇门吧。方才人从那儿过，里头有敲门声，我听着不像风。","车就停仓外，真接出伤者，横上几块板，慢慢推便是。贼在里面，我不敢进，只能先备着。"]),
  np('wujii-servant','甄家侍女','maid','civilian','xuchang',["诸位见过我家姑娘吗？去中山看病，一直没回。路上正闹贼，我在许昌等信，又怕送信的和她走岔，真不知该往哪头找。","她背药箱走时，还说用完这箱便回。我只当两三日，谁知道……早该一起去，哪怕替她跑一封信也好。"]),
  np('julu-carrier','运粮老卒','villager','quest','julu',["粮车去广宗，约好前日回，到如今半点信也没。我想去找，这条腿偏又犯病，爬上车都得人抬。","路上见过赶粮车的老冯吗？脸上有道疤，跟我差不多年纪。若见着，劳烦知会一声，我在这儿等着呢。"]),
  np('guangzong-worker','补车匠','laborer','civilian','julu-county',["轮子松了？推来。别说还转得动，轴一脱，连车带货栽下去，哪里是你一只手扶得住的。","木料都快使尽了，外头还排着车。急着上路的先修，其余坐着等，我叫着呢，谁也别自己硬推走。"]),
  {...np('xinye-doctor','药铺郎中','villager','healer','xinye',["坐这边。伤口清一清，换块干净布。包好别碰水，夜里发热，或伤处又肿，便来敲门。","衙门那边又闹起来了？你们要去，也先让我把血止住。真打起来，伤口不会管你赶不赶时辰。"]),unlockQuest:'ganning'}
 ];
 const conversations={
  'changshan-elder':{afterReturn:["各家都分到了，余粮也入了仓。今晚大伙凑一桌饭，请你们坐上席，不急着走吧？灶都点上了。","早上几个人想回去看田，我拦了一回。还得问清路上有没有乱兵，才吃上几顿饭，别又折了人。"]},
  'changshan-maiden':{afterReturn:["饭才起锅，那几个孩子就捧着碗等。烫得直吹，也不肯搁下。我多盛了半勺，他们还问能不能留给娘。","铺位留着呢。回来前捎句话，我晒晒被子，换层干草。别像上回，进门了才说要住。"]},
  'grain-steward':{afterReturn:["常山收到粮，我这口气才敢松。仓门正补着，也叫几个年轻的轮着守，总不能回回指望我这把老骨头。","破袋子别扔，洗净缝好，还能装东西。你们缺了便来拿，路上哪值得为个口袋再花钱。"]},
  'grain-maiden':{afterRescue:["甄姑娘真出来了？谢天谢地！我弟弟编了只小篮，天天问什么时候送去，说要给姑娘装药呢。","我想煮些吃食送伤者。见了甄姑娘，替我问问有什么忌口，免得一锅煮好，倒让人吃不得。"]},
  'refugee-laborer':{afterRescue:["人送到了，车没散，我也能回家睡个囫囵觉。往后还运东西便叫我，早说一声，我先把轮子拧紧。","车上那几个，一路谢得我都不敢颠。下回见面，最好都能自己走来，别再坐我这辆伤车了。"]},
  'wujii-servant':{afterRescue:["中山的信到了！姑娘平安，真多亏诸位。可你瞧她，报平安只两行，后头一整页又在嘱咐给人换药。还是这个性子。","换洗衣裳都收好了。姑娘随你们走，劳烦到饭点叫她一声。病人的药记得牢，自己的饭，倒回回忘。"]}
 };
 const sideQuests=[
  {id:'clear-mountain',sceneId:'bandit-camp',title:'山道清剿',giver:'changshan-woodcutter',giverPlace:'changshan',place:'zhongshan',enemyName:'山道盗匪',enemyArt:'mountain-bandit',recommendedLevel:4,rounds:5,money:180,item:'leather-armor',quality:'green',description:'前往中山山道清理盗匪，再回常山向樵夫复命。',accept:"中山山道那几间旧棚，都有贼住着。劳烦几处都去一趟，赶跑一伙，另一伙又要出来。我在村里等信，斧头也先不往山上带了。"},
  {id:'grain-escort',sceneId:'farmland',title:'营粮归路',giver:'julu-carrier',giverPlace:'julu',place:'julu-county',enemyName:'拦粮山贼',enemyArt:'mountain-bandit',recommendedLevel:3,rounds:2,money:100,item:'cloth-armor',quality:'green',description:'前往广宗击退拦粮山贼、护送粮车，再回巨鹿向老卒复命。',accept:"粮车走广宗旧驿道，赶车的老冯脸上有疤。找到人，劳烦连车一块接回来。若伤着了，慢些走，粮晚一日不妨。"},
  {id:'trade-road',sceneId:'market-street',title:'商路肃清',giver:'road-merchant',giverPlace:'zhongshan',place:'zhongshan-county',enemyName:'商道匪首',enemyArt:'brigand',recommendedLevel:5,rounds:5,money:240,item:'copper-ring',quality:'green',description:'前往毋极清理商道盗匪，再回中山向行商复命。',accept:"毋极商道，几伙贼各占一段，专等落单的车。我们商户凑了酬劳，诸位若肯清路，回来便照约交付，绝不赖账。"}
 ];
 function enemy(profile,level,name,art,type,skills,index=0){const weapon=I.create('weapon-'+type,'white','enemy-'+index);weapon.id='outlaw-'+type;weapon.skills=skills.map(id=>id==='blade-cut'?{base:id,name:'劈砍'}:id);skills=W.forWeapon(weapon);return {...G.create(profile,level),name,characterId:art,weapon,armor:3,resistance:3,equipment:{armor:I.create('cloth-armor','white','enemy-armor-'+index)},skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:'sometimes'}))};}
 const bandits=(level,count,captain=false)=>Array.from({length:count},(_,i)=>({...enemy(i===0&&captain?'brigand':i%2?'riverBandit':'thief',level,i===0&&captain?'盗匪头目':i%2?'山贼':'盗贼',i===0&&captain?'brigand':i%2?'mountain-bandit':'thief',i%2?'spear':'blade',i===0&&captain?['blade-sweep','blade-cut']:i%2?['spear-cut']:['blade-cut'],i),...(i===0&&captain?{formationRow:'front',statusImmunities:['stun'],passives:['enemy-stun-resistance']}:{})}));
 const storyConversations={changshanEntry:[
  {speaker:'villager',text:"别往里走，山贼正要粮呢！劝架的才挨了打，门口乱得很，等一等再进村吧。"},
  {speaker:'hero',text:"村里还剩几袋粮？他们怎么连这里也抢。官府没人管吗？"},
  {speaker:'villager',text:"官府？多久没见过官差了。倒有个年轻人，枪使得好，一直照应我们，可他刚去村东……哎，贼过来了，你快让开！"},
  {speaker:'thief',text:"老头，两袋粮呢？还藏着？旁边那个也站住，身上有钱便掏出来！"},
  {speaker:'hero',text:"我路过的也要交？你们把粮拿光，村里这些人吃什么？"},
  {speaker:'thief',text:"管得倒宽！绑上，身上搜干净，叫他跟老头一道待着！"},
  {speaker:'zhaoyun',text:"放手。村里只余这两袋，你们带不走。乡亲，到我后面来。"},
  {speaker:'thief',text:"使枪的又来了！一块上，夺了他的枪，看他还能拦几回！"},
  {speaker:'zhaoyun',text:"这位朋友，左边劳你挡一挡！乡亲回屋，关门，别留在路上！"},
  {speaker:'hero',text:"左边给我！你留神背后。大叔，快回屋！"}
 ]};
 storyConversations.escortArrival=[
  {speaker:'villager',text:"子龙！粮回来了！快进村，大伙正盼着……后头那几个带刀的，也是你们的人？"},
  {speaker:'zhaoyun',text:"不是。别停，车先进院！乡亲回屋拴门，别围在这里！"},
  {speaker:'thief',text:"站住！把老子的粮搬了就想走？车留下！谁敢再推，连人带车一块砍！"},
  {speaker:'hero',text:"追得还真紧。孩子伤者都在村里，得拦在这儿，不能让他们进去。"},
  {speaker:'zhaoyun',text:"村口我来守，粮车旁边交给你。乡亲，往院里走，关好门！"}
 ];
 const storyBattles={entry:{sceneId:'farmland',title:'常山村口',place:'changshan',scaling:'early',count:2},grain:{followup:{phase:'grain',speaker:'zhaoyun',lines:["前仓守住了。后院还在搬东西，趁门没堵上，跟我过去！"]},sceneId:'market-street',title:'夺回乡粮',place:'zhongshan',scaling:'early',count:3},rescue:{sceneId:'market-street',title:'粮仓救人',place:'zhongshan',scaling:'early',count:2},escort:{sceneId:'rural-road',title:'粮车归途',place:'changshan',scaling:'early',pattern:'earlyLeader',count:3}};
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
