(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog,W=node?require('./weapon-skills.js'):root.WeaponSkills;
 const np=(id,name,art,role,place,lines)=>({id,name,art,role,place,side:role==='healer'?'right':'left',roleLabel:{civilian:'交谈',quest:'委托',merchant:'商贩',healer:'疗伤'}[role]||'交谈',lines});
 const npcs=[
  np('changshan-elder','里正','villager','quest','changshan',['你是来找人的，还是想找个地方歇脚？西边那间屋子还空着，我叫人给你腾个铺位。','这些逃难来的乡亲暂时都住在村里，多亏子龙照应。住处还能挤一挤，就是吃的快不够了。']),
  np('changshan-woodcutter','樵夫','laborer','quest','changshan',['你要进山？可别走山口那条近路，前两天我在那里碰上了贼，柴和斧头都没保住。','以前天不亮就能进山，现在得等上几家一起走。人多了壮胆，真碰到贼，大伙儿也能互相喊一声。']),
  np('changshan-doctor','乡医','villager','healer','changshan',['我看看，是新添的伤？坐这里吧，把伤口露出来，别隔着衣服自己乱摸。','我这里还能替你们看伤，就是干净布条快用完了。要包扎的话，到这边坐吧。']),
  np('changshan-maiden','阿禾','village-maiden','civilian','changshan',['我把西边的空屋打扫过了，晚些再铺点干草。来投宿的人要是多，大概还得借几床被子。','东边那家的小孩总算肯出来玩了。刚来那几天，一听见马蹄声就往桌子底下钻，怎么哄都没用。']),
  np('grain-steward','仓守','villager','quest','zhongshan',['这仓里的粮，是附近几家凑给常山那些流民的。哪知道车还没备好，贼先来了，把人赶出去就占了仓。','你看粮袋上的线，颜色都不一样，各家自己缝的。我一袋袋点过数，只盼着别被他们糟蹋了。']),
  np('road-merchant','行商','laborer','merchant','zhongshan',['想买点什么？我这儿有些旧兵器，也有能穿的甲。东西看着旧了点，用起来没问题，你慢慢挑。','最近走一趟路太不容易，几文钱的小买卖，也得看能不能平安送到。等路上安稳些，我再多进点货。']),
  np('grain-maiden','阿芹','village-maiden','civilian','zhongshan',['你问甄姑娘？她原先在这里给伤者看病。贼来了以后，听说她家里有粮，就把她和几个伤者一块儿带走了。','甄姑娘替我弟弟看过伤，他怕疼，一直不肯让人碰，还是她哄着才包上的。也不知道她现在怎么样了。']),
  np('refugee-laborer','车夫','laborer','quest','zhongshan-county',['我看见他们把人带进旧祠堂了，就在后院。门口有两个守着，隔一会儿就进去看看，我不敢靠得太近。','车轮修好了，我就把车停在旁边等着。甄姑娘要照顾那几个伤者，他们自己肯定走不远。']),
  np('wujii-servant','甄家侍女','maid','civilian','zhongshan-county',['你们见到我家姑娘了吗？她出去给人看病，到现在也没回来。我打听到这里，守门的人就是不让我进去。','姑娘出门带了一整箱药，原先说用完就回来。我昨天还在家里等她，早知道该跟着她一起出来。']),
  np('julu-carrier','运粮老卒','villager','quest','julu',['那支粮队往广宗去了，说好前日回来，到现在还没信儿。我想去找，可这条腿连上车都费劲。','你是从外头来的，路上见过几辆运粮车没有？赶车的老冯跟我差不多年纪，脸上有一道疤。']),
  np('guangzong-worker','补车匠','laborer','civilian','julu-county',['你那车轮要是松了就推过来，我帮你紧一紧。可别想着凑合赶路，真掉在半道上，还得回头找我。','这几天来修车的人多，木料都有些不够了。急着赶路的我先修，不急的就在旁边坐会儿。']),
  {...np('xinye-doctor','药铺郎中','villager','healer','xinye',['伤口先别沾水，来这边坐。我替你清理一下，旧布条也得换掉。','外头闹得厉害，你们要是还有事要办，至少先把伤养好，别硬撑着出去。']),unlockQuest:'ganning'}
 ];
 const conversations={
  'changshan-elder':{afterReturn:['粮已经分下去了，剩下的我让人锁进了仓里。你要是不急着赶路，今晚在村里吃顿饭吧。','今早有人问能不能回去收拾田地了，我让他们再等等，先打听清楚路上有没有乱兵。']},
  'changshan-maiden':{afterReturn:['昨天煮饭的时候，几个孩子都挤在灶台边上不肯走。分到自己那碗，捧着就喝，连烫都顾不上了。','被子还给你们留着呢。什么时候回来，跟我说一声就行，我再去抱点晒过的干草。']},
  'grain-steward':{afterReturn:['粮车送到了就好。我这两天把仓门补一补，往后收粮，可不敢再只留我一个老头守着了。','那几只破粮袋我没舍得扔，洗干净还能补。你们要是路上缺口袋，来这里拿就是。']},
  'grain-maiden':{afterRescue:['听说你们把甄姑娘救出来了？太好了！我弟弟还一直问，她什么时候再来呢。','我煮了点吃的，想给那几个伤者送去。你们要是见到甄姑娘，替我问问有什么是他们不能吃的。']},
  'refugee-laborer':{afterRescue:['人都接出来了，车也没坏，我这心里总算踏实了。以后要运什么，提前跟我说一声，我来赶车。','那几个伤者路上还一直道谢，我让他们少说两句，留点力气。下回见面，盼着他们能自己走过来。']},
  'wujii-servant':{afterRescue:['多谢你们把姑娘救了出来！她刚回来就问药箱找着没有，我都不知道该先高兴还是先生气。','我给姑娘收拾了换洗的衣服。她若是还跟你们在外头走动，烦你提醒她按时吃饭，别又顾不上自己。']}
 };
 const sideQuests=[
  {id:'clear-mountain',sceneId:'bandit-camp',title:'山道清剿',giver:'changshan-woodcutter',giverPlace:'changshan',place:'zhongshan',enemyName:'山道盗匪',enemyArt:'mountain-bandit',recommendedLevel:4,rounds:5,money:180,item:'leather-armor',quality:'green',description:'前往中山山道清理盗匪，再回常山向樵夫复命。',accept:'你真愿意帮忙？那我带你去山口。他们在几处旧棚里落脚，不一定都在一块儿，咱们一处一处找，别漏了藏在后头的。'},
  {id:'grain-escort',sceneId:'farmland',title:'营粮归路',giver:'julu-carrier',giverPlace:'julu',place:'julu-county',enemyName:'拦粮山贼',enemyArt:'mountain-bandit',recommendedLevel:3,rounds:2,money:100,item:'cloth-armor',quality:'green',description:'前往广宗击退拦粮山贼、护送粮车，再回巨鹿向老卒复命。',accept:'劳烦你往广宗走一趟，他们走的是旧驿道。先找着人，看看出了什么事；要是被困在那儿了，帮着把他们和粮车送出来。'},
  {id:'trade-road',sceneId:'market-street',title:'商路肃清',giver:'road-merchant',giverPlace:'zhongshan',place:'zhongshan-county',enemyName:'商道匪首',enemyArt:'brigand',recommendedLevel:5,rounds:5,money:240,item:'copper-ring',quality:'green',description:'前往毋极清理商道盗匪，再回中山向行商复命。',accept:'西边商道上的贼分了好几伙，专等落单的货队。我们几个做买卖的凑了钱，你若能把这条路清出来，酬劳一文也不会少。'}
 ];
 function enemy(profile,level,name,art,type,skills,index=0){const weapon=I.create('weapon-'+type,'white','enemy-'+index);weapon.id='outlaw-'+type;weapon.skills=skills.map(id=>id==='blade-cut'?{base:id,name:'劈砍'}:id);skills=W.forWeapon(weapon);return {...G.create(profile,level),name,characterId:art,weapon,weaponProficiencies:{[type]:40},armor:3,resistance:3,equipment:{armor:I.create('cloth-armor','white','enemy-armor-'+index)},skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:'sometimes'}))};}
 const bandits=(level,count,captain=false)=>Array.from({length:count},(_,i)=>enemy(i===0&&captain?'brigand':i%2?'riverBandit':'thief',level,i===0&&captain?'盗匪头目':i%2?'山贼':'盗贼',i===0&&captain?'brigand':i%2?'mountain-bandit':'thief',i%2?'spear':'blade',i%2?['spear-cut','spear-sweep']:['blade-cut'],i));
 const storyConversations={changshanEntry:[
  {speaker:'villager',text:'你也是来投宿的？先别往里去了。村口来了几个山贼，正堵着人要粮，已经打伤两个人了。'},
  {speaker:'hero',text:'这地方看着也不像有多少余粮。没有人管吗？'},
  {speaker:'villager',text:'官府早就不管了。这几天多亏一个年轻枪客照应着，他刚往村东去了，偏偏这时候……坏了，他们过来了。'},
  {speaker:'thief',text:'老头，别磨蹭，那两袋粮搬出来。旁边那个也不许走，把身上的东西都拿出来！'},
  {speaker:'hero',text:'他们自己都快没饭吃了，这点口粮你们也要抢？'},
  {speaker:'thief',text:'你想替他们出头？行，连你一块儿绑了，看你身上能搜出什么！'},
  {speaker:'zhaoyun',text:'把人放开。这几袋粮要留给村里的老人孩子，不能让你们拿走。'},
  {speaker:'thief',text:'又是你坏事！一起上，今天非得让他长长记性！'},
  {speaker:'zhaoyun',text:'这位朋友，先帮我拦住左边那个人，别让他往村里跑。乡亲们，都退到屋里去！'},
  {speaker:'hero',text:'好，你当心后面那个，我来守这边。'}
 ]};
 const storyBattles={entry:{sceneId:'farmland',title:'常山村口',place:'changshan',scaling:'early',count:2},grain:{sceneId:'market-street',title:'夺回乡粮',place:'zhongshan',scaling:'early',count:3},rescue:{sceneId:'market-street',title:'祠堂救人',place:'zhongshan-county',scaling:'early',count:2},escort:{sceneId:'rural-road',title:'粮车归途',place:'changshan',scaling:'early',count:4}};
 const services={healing:{price:8,currency:'文'}};
 const combatProgression={initialCap:10,caps:[10,15,20]};
 const api={services,combatProgression,npcs,conversations,storyConversations,sideQuests,enemy,bandits,storyBattles};root.NearbyContent=api;if(node)module.exports=api;
})(globalThis);
