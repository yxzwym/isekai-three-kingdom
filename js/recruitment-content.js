(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,H=node?require('./hero-quests.js'):root.HeroQuests,D=node?require('./world-data.js'):root.WorldData,N=node?require('./nearby-content.js'):root.NearbyContent,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog,W=node?require('./weapon-skills.js'):root.WeaponSkills;
 const copy=x=>JSON.parse(JSON.stringify(x));
 function landmark(id,name,parent,dx,dy,kind='village'){
  if(D.placeMap[id])return;const p=D.placeMap[parent],desired={x:p.x+dx,y:p.y+dy},geo=id==='suiyang'?{lon:115.62,lat:34.40}:id==='huashan'?{lon:110.08,lat:34.48}:D.geography.unproject(desired),anchor=D.geography.project(geo.lon,geo.lat);
  const record={...geo,reference:name,note:['suiyang','huashan'].includes(id)?'按所在区域设置的游戏地标':'虚构剧情地点；相对附近城县安排位置，不作史迹坐标'};
  const candidates=[anchor];for(let radius=8;radius<=72;radius+=8)for(let i=0;i<48;i++)candidates.push({x:anchor.x+Math.cos(i*Math.PI/24)*radius,y:anchor.y+Math.sin(i*Math.PI/24)*radius});const pos=candidates.find(q=>D.geography.isLand(q,'mainland')&&D.places.every(other=>Math.hypot(other.x-q.x,other.y-q.y)>=46))||anchor;
  const entry={id,name,kind,faction:p.faction,parent,...record,...pos,anchorX:anchor.x,anchorY:anchor.y};D.places.push(entry);D.placeMap[id]=entry;D.roads.push([parent,id]);const L=node?require('./world-locations.js'):root.WorldLocations;L.locations[id]=record;
 }
 landmark('xujia','许家村','qiaoxian',-60,-50);landmark('north-temple','村北破庙','xujia',-40,-50);landmark('suiyang','睢阳','chenliu',78,66);landmark('huashan','华山','tongguan',-24,68);
 landmark('blackwood','黑松林','changshan',-65,44);landmark('old-quarry','旧石场','ye',-55,56);landmark('poison-marsh','芦泽','pingyuan',48,66);landmark('fort-ruins','废垒','jibei',-42,-66);
 const n=(id,name,art,...lines)=>({id,name,art,observe:!!G.PROFILES[id],turns:lines.map((text,i)=>({speaker:i%2?'hero':'npc',text})),choices:[]});
 const step=(place,objective,npc,choices)=>({place,objective,npc:{...npc,choices}}),next=(label,next,extra={})=>({label,next,...extra});
 const finish=(id,name,place,home)=>step(place,'与'+name+'商议去留',n(id,name,id,'这件事多亏有你们帮忙。我原先也想出去看看，只是家里一直有事放不下。如今总算安顿好了，你们接下来怎么走？','我们还要去各地找人。你愿意的话，可以先一起走。要是有别的安排，以后再来找我们也一样。'),[{label:'留下同行',recruit:true},{label:'先去'+D.placeMap[home].name,recruit:false}]);
 function define(id,title,country,place,type,home,recommendedLevel,stages,battles,passives){H.definitions[id]={id,name:G.isGeneral({id})?({xuchu:'许褚',dianwei:'典韦',huangzhong:'黄忠',maliang:'马良',taishici:'太史慈',lusu:'鲁肃'}[id]):id,title,country,place,type,home,category:'story',requiresChangshan:false,start:'rumor',recommendedLevel,level:id==='taishici'?5:10,passives,stages:{locked:{objective:''},...stages,complete:{objective:'已愿意相助'}},battles};}
 const actors={};
 const speech=(id,name,art,rows)=>{actors[id]={id,name,art,side:id==='huatuo'?'right':'left'};return {id,name,art,side:actors[id].side,observe:!!G.PROFILES[id],turns:rows.map(([speaker,text])=>({speaker,text})),choices:[]};};
 const S=(place,objective,id,name,art,rows,choices,extra={})=>({...step(place,objective,speech(id,name,art,rows),choices),...extra});
 define('xuchu','许家村的壮士','wei','xujia','hammer','xuchang',7,{
  rumor:S('xujia','查看许家村口的争执','xu-farmer','庄稼汉','laborer',[
   ['npc','这些粮是留着明年下种的，不是吃剩下的！你们全拉走了，我们明年连地都种不了，还要怎么活？'],
   ['hero','大叔，先松开车绳，他们已经在拔刀了。你退到我后面，粮车我们帮你看着，别为了拦车伤着自己。'],
   ['xu-bandit','你跟这老头是一家的？不是就赶紧让开！我们拿了粮就走，少在这里给自己找麻烦。'],
   ['xuchu','我才去田里看了一会儿，你们怎么又来了？上回已经说得很清楚，这些粮不能拿，把车给我放下！']], [next('帮忙护住粮车','meet')]),
  meet:S('xujia','与许褚一起守住粮车','xuchu','许褚','xuchu',[
   ['npc','你帮忙看着车头，我去拦后面的两个人。大叔，趁他们过不来，先把牛牵进院子，别让刀碰着它。'],
   ['hero','我守着这边。你也小心墙边那个人，他手藏在衣服里，应该还带着刀，别让他绕到你背后。']], [{label:'护住乡亲',battle:'village'}]),
  temple:S('north-temple','追到破庙，救回被抓的乡亲','xu-bandit','盗贼队长','brigand',[
   ['npc','许褚，你还真追到这里来了？那几个人就在庙里，你再往前一步，我可不保证他们还能不能好好走出去。'],
   ['xuchu','把乡亲放出来，有事冲着我说！粮食本来就是村里的，你们抢了东西还要伤人，这回别想再混过去。'],
   ['hero','左边的窗子没有封住，我听见里面有人敲。你先跟他说话，我从那边进去，看看能不能把人带出来。']], [{label:'救出乡亲',battle:'temple'}]),
  home:S('xujia','将乡亲和粮车送回许家村','xu-farmer','庄稼汉','laborer',[
   ['npc','人都回来了就好！你们走以后，我一直怕那伙人急了会伤人，刚才听见车响，才敢出来看看。'],
   ['xuchu','庙里还堆着不少抢去的粮，我让几个人留下看着了。明天多找几辆车，把乡亲们的东西一起拉回来。'],
   ['hero','以后在村口安排几个人轮流看着吧。有人来就早点通知大家，总比等他们到了粮仓门口，才急着去找人帮忙。'],
   ['npc','我这就去跟里正说，叫大家晚上也轮着守。你们忙了一天，先进屋吃点东西吧，我去把灶上的饭热一热。']], [next('与许褚坐下聊聊','freed')]),
  freed:finish('xuchu','许褚','xujia','xuchang')
 },{village:{stage:['meet','village'],next:'pursuit',title:'许家村口',sceneId:'farmland',count:3,enemyKind:'bandit',guest:'xuchu'},temple:{stage:['temple'],next:'home',title:'破庙救人',sceneId:'bandit-camp',count:4,enemyKind:'bandit',guest:'xuchu'}},['xuchu-tiger']);
 H.definitions.xuchu.stages.village=H.definitions.xuchu.stages.meet;
 H.definitions.xuchu.stages.pursuit=S('xujia','与许褚追查盗匪落脚处','xuchu','许褚','xuchu',[
  ['npc','刚才逃走的那几个往村北去了。他们之前抓了几个看田的乡亲，到现在也没放回来，我们不能只顾着把这车粮抢下来。'],
  ['hero','你知道他们把人关在哪里吗？要是有地方可找，我们现在就过去，别等他们回去以后又换了地方。'],
  ['npc','村北有间破庙，他们一直在那里过夜。我以前追过去，听见里面有人求救，可身边没人，不敢一个人硬闯，怕他们伤了乡亲。'],
  ['hero','这次我们陪你去。先看清里面的情况，把人救出来，再找那些抢粮的人算账。']], [next('前往村北破庙','temple',{guest:'xuchu'})]);
 define('dianwei','睢阳旧案','wei','suiyang','axe','xuchang',9,{
  rumor:S('suiyang','查看刘家门前的争执','liu-widow','刘氏','liu-widow',[
   ['npc','这笔粮我丈夫生前已经还清了，里正当时就在旁边！你们不去问他，凭什么直接来收我们的房子？'],
   ['li-servant','我们只照主人的吩咐搬东西。你要说理，自己去李府说，别挡在门口，再磨蹭，连门也给你拆了！'],
   ['hero','先把柜子放下。她说有人能作证，你们连问都不问就来搬家里的东西，这怎么算是在讨债？'],
   ['dianwei','他不是来讨债的，是来抢东西的。把手里的柜子放回去，别仗着她家没人，什么都敢砸。']], [next('拦住家丁','yard')]),
  yard:S('suiyang','与典韦赶走李家家丁','li-servant','李府家丁','brigand',[
   ['npc','又是你这个姓典的！上次就坏了我们的事，今天还敢拦着？主人正愁找不到你，这回你也别想走！'],
   ['dianwei','你回去告诉李永，是我让你们停手的。现在把搬出去的东西送回来，不许再碰这屋里的人。'],
   ['hero','刘大嫂，先带孩子进屋，把门拴上。外面的事情我们来处理，你们别站在这些人旁边。']], [{label:'赶走家丁',battle:'yard'}]),
  night:S('suiyang','安顿刘氏母子','dianwei','典韦','dianwei',[
   ['liu-widow','多谢你们。我想先带孩子到他舅舅家住几天，行李以后再收。那些人知道这里就剩我们娘俩，我晚上实在不敢再住了。'],
   ['npc','我送你们过去。你兄弟住在东街，我认得他，路上有我跟着，李家的人也不敢拦你们。'],
   ['hero','我去找里正，把还粮的事情写下来，再问问有没有别的人作证。明天早上我们碰头，看能不能把这桩债彻底说清楚。'],
   ['npc','那就这么办。你先住西街的客店，我送完他们就过去，有什么消息也好互相告诉一声。']], [next('先去找里正作证','morning')]),
  morning:S('suiyang','查问刘氏母子的下落','liu-neighbor','邻妇','neighbor-woman',[
   ['npc','你是昨天帮刘家的那位吧？昨晚李家的人又去了东街，她兄弟让人打伤，刘氏和孩子……郎中赶过去，也没能救下来。'],
   ['hero','怎么会这样？典韦呢，他昨天护送他们去东街的，有没有人见过他？'],
   ['npc','他送到了，又出去找人帮着守门，半路让一伙人缠住了。天亮听见这个消息，连伤都没顾上包扎，就跑去李府找人算账了。'],
   ['hero','麻烦你告诉我李府怎么走，我得去找他。他现在又有伤又着急，不能让他一个人闯进去。']], [next('赶往李府','mansion')]),
  mansion:S('suiyang','闯入李府寻找典韦','li-servant','李府家丁','brigand',[
   ['hero','典韦是不是进了这道门？我刚才听见里面有人喊，你们把他带到哪里去了？'],
   ['npc','什么典韦？我们根本不认识，你赶紧走，李府不是让人随便进来的地方。'],
   ['dianwei','我在院子里面！别直接往前跑，地上有机关，刚才那个地方会把人关起来！'],
   ['hero','我听见你了，先别乱动。你们把门让开，我今天一定要进去，不会听一句不认识就走。']], [{label:'闯入院中',battle:'mansion'}]),
  cage:S('suiyang','解开墙上的机关，救出典韦','li-yong','李永','li-yong',[
   ['npc','一个接一个地来坏我的事，真当李家是好欺负的？我今天就把这院子烧了，你们要救人，就留在里面陪着！'],
   ['dianwei','李永从后门跑了！先别去追，墙上的木板跟这道锁连着，你帮我看看，应该是从那儿打开的。'],
   ['hero','我试过了，铁笼拉不起来，应该得先解开机关。你离笼门远一点，我去看看那些木板能不能挪动。'],
   ['dianwei','对，就是你手边那几块。上面的横梁已经松了，挪的时候站到旁边去，别让它掉下来砸着你。']], [{label:'解开机关',puzzle:true,next:'tunnel'}],{sceneId:'bandit-camp'}),
  tunnel:S('suiyang','从后院密道追上李永','dianwei','典韦','dianwei',[
   ['npc','门终于开了，我还以为要让他关死在这里。先让我缓一口气，刚才拉了半天，手都使不上劲了。'],
   ['hero','你先把伤口包一下。李永从后面的暗道走了，灯还亮着，应该没走远，等你能走了，我们一起去追。'],
   ['npc','我可以走了。他手里还有那些借据，得一起找回来，不然我们一走，他又能拿去欺负别人。这回不能再让他跑掉。']], [{label:'追入密道',battle:'tunnel'}]),
  freed:finish('dianwei','典韦','suiyang','xuchang')
 },{yard:{stage:['yard'],next:'night',title:'刘家院前',sceneId:'city-north',count:3,enemyKind:'retainer',guest:'dianwei'},mansion:{stage:['mansion'],next:'cage',title:'李府前院',sceneId:'city-north',count:4,enemyKind:'retainer'},tunnel:{stage:['tunnel'],next:'freed',title:'李府密道',sceneId:'bandit-camp',count:4,enemyKind:'retainer',guest:'dianwei',leaderName:'李永',leaderArt:'li-yong'}},['dianwei-guard']);
 define('huangzhong','长沙老将','shu','changsha','bow','chengdu',10,{
  rumor:S('changsha','向酒家询问街上的动静','cs-host','酒家掌柜','innkeeper',[
   ['npc','这酒还没温好，你先坐一会儿。哎，那几个人怎么又把马牵走了？黄老将军不是叫他们等马夫回来认的吗？'],
   ['hero','那匹马怎么了？他们既然要卖，为什么还要等别人来认？是不是有什么事情没说清楚？'],
   ['npc','黄老将军说像是军中丢的马，腿上的旧伤也对得上。那些人一听要找马夫就急着走，你看，他已经追出去了。']], [next('跟出去看看','stable')]),
  stable:S('changsha','协助黄忠拦住卖马的人','huangzhong','黄忠','huangzhong',[
   ['npc','这匹马左后腿伤过，鞍子下面还有旧烙印，都是军中的记号。马夫一会儿就到，你们要是真没偷马，等他认一认又有什么关系？'],
   ['horse-thief','我们也是花钱买来的，你说是军马就是军马？老人家，生意不是这么做的，把路让开，别一直拦着我们。'],
   ['hero','既然你们花钱买的，就把卖马的人和收据说清楚。等马夫到了，当着大家的面认，总比现在拉着就跑好。'],
   ['npc','当心，他们准备冲出去了！你帮我拦住右边那个人，马交给我，别让他们拿刀把马也伤了。']], [{label:'拦住马贼',battle:'street'}]),
  track:S('changsha','与黄忠追查失马的去向','huangzhong','黄忠','huangzhong',[
   ['npc','马夫已经到了，说浏阳那边还丢了两匹马。刚才这几个人应该只是来试着卖一匹，剩下的多半还藏在城外。'],
   ['hero','刚才逃走的人朝哪边去了？如果能跟上，说不定还能找到藏马的地方。'],
   ['npc','他们从东门跑了。你有空的话，陪我过去一趟吧，拖得久了，我怕他们把剩下的马也转手卖掉。']], [next('前往浏阳找马','horses')]),
  horses:S('changsha-county','找到浏阳道旁的失马','horse-thief','马贼头目','brigand',[
   ['npc','刚才回来的弟兄说，有个老头一直追着问马的事，就是你吧？这么大年纪了，还非得跟我们过不去？'],
   ['huangzhong','把马放开，别拿刀在它旁边比画。刚才那一箭只是拦你，再想伤马，我可不会只射你身边的车板了。'],
   ['hero','左边那两个人我来拦。你看着马，别让他们趁着我们说话，从后面的林子绕过去。']], [{label:'夺回失马',battle:'horses'}]),
  school:S('changsha','回长沙向黄忠请教','huangzhong','黄忠','huangzhong',[
   ['npc','马夫已经把马都领回去了，路上也没再受伤。今天多亏你肯帮忙，不然我顾着马，确实很难把四散的人都拦住。'],
   ['hero','早就听说汉升将军的箭术，刚才亲眼看见，更觉得厉害了。等你有空，能不能教我怎么站、怎么瞄准？'],
   ['npc','可以，等你休息好了，我们去教场试试。刚开始不用急着跟别人比，先把弓拿稳，找个你使起来顺手的姿势。']], [{label:'请教箭术',battle:'duel'}]),
  freed:finish('huangzhong','黄忠','changsha','chengdu')
 },{street:{stage:['stable','street'],next:'track',title:'长沙马市',sceneId:'city-river',count:3,enemyKind:'bandit',guest:'huangzhong'},horses:{stage:['horses'],next:'school',title:'浏阳寻马',sceneId:'rural-road',count:4,enemyKind:'bandit',guest:'huangzhong'},duel:{stage:['school','duel'],next:'freed',title:'长沙试箭',sceneId:'farmland',duel:'huangzhong',acceptDefeat:true}},['huangzhong-veteran']);
 H.definitions.huangzhong.stages.street=H.definitions.huangzhong.stages.stable;H.definitions.huangzhong.stages.duel=H.definitions.huangzhong.stages.school;
 define('maliang','白眉求医','shu','xiangyang','gourd','chengdu',8,{
  rumor:S('xiangyang','询问医馆外的争执','maliang','马良','maliang',[
   ['npc','这些药先让病人领走，花费我会补上。你们如果要找我弟弟，我可以带路，别一直堵在药铺门口，让病人连门都进不来。'],
   ['imperial-soldier','府里还等着问话，你别总找理由拖延。刘公子的伤到现在没好，你弟弟惹下的事，总得有人出来说清楚！'],
   ['hero','这是怎么回事？药铺门口还有好几个伤者，你们这样吵，他们也没法好好看病。'],
   ['npc','我弟弟跟刘家的公子争吵，推搡时把人弄伤了，现在还关着。我想先把伤治好，可城里已经请过几位大夫，都没有见好。']], [next('问问能否帮忙','doctor')]),
  doctor:S('xiangyang','与马良商量请医的办法','maliang','马良','maliang',[
   ['npc','听药铺的人说，华先生这几天在宜城。我想去请他，又怕府里找不到人，以为我们要逃走，实在没法离开。'],
   ['hero','季常，宜城不算远，我替你跑一趟。你把怎么受伤、现在有什么症状写下来，我带过去，也免得说漏了。'],
   ['npc','我已经写好一张，麻烦你带上。刘家也派了人一起去，他一直照顾伤者，有什么细节不明白，可以让他告诉大夫。']], [next('前往宜城请医','clinic')]),
  clinic:S('xiangyang-county','在宜城找到华佗','huatuo','华佗','huatuo',[
   ['npc','伤口在哪儿、烧了多久，我从信里看见了。不过要换药，还得亲眼看看伤口，我跟你们去一趟，不能只照着几句话开方子。'],
   ['hero','那我们陪你去襄阳。你看看还要带什么，车也能帮着安排，路上不用赶得太急。'],
   ['npc','得先去后院把药箱取回来。昨天有几个逃兵来拿药，连针具和给孩子用的药都搬走了，现在还守在那里，不肯让我们进去。'],
   ['hero','我们刚才经过，确实看见有人堵门。你留下照顾病人，我们过去跟他们说，让他们把药箱还回来。']], [next('去药铺后院','medicine')],{sceneId:'clinic-courtyard'}),
  medicine:S('xiangyang-county','夺回被占用的药箱','medicine-looter','逃兵头目','imperial-captain',[
   ['npc','这些药已经归军里用了，受伤的弟兄都等着。你们在外面等，什么时候能拿回去，我们自会告诉你们。'],
   ['hero','你们有伤员，可以请大夫照着伤情拿药，不能把整间药铺都搬走。城里的病人也在等，外面还有孩子发着烧呢。'],
   ['npc','轮得到你在这里教训人？把门关上，谁再往里走，就别怪我们动手！'],
   ['hero','华先生，你先带病人从侧门走，别留在院子里。药箱的位置我们已经看见了，拿回来就交给你。']], [{label:'夺回药箱',battle:'medicine'}],{sceneId:'clinic-courtyard'}),
  return:S('xiangyang','陪华佗回襄阳诊治','maliang','马良','maliang',[
   ['npc','华先生总算来了！府里已经说好了，病人就住在医馆后面。我带你们进去，他昨晚又发了热，我们都很着急。'],
   ['huatuo','先把旧布拆开，让我看看。伤口里还有碎木没有清干净，怪不得总发热。拿盏灯过来，我得看得仔细些。'],
   ['hero','灯我来拿着，你看看这个位置够不够亮，需要往哪边移就告诉我。'],
   ['npc','我去把水烧上。旁边两位帮忙扶着他，别让受伤的那条胳膊乱动，有什么需要尽管叫我。']], [next('等候诊治结果','freed')],{sceneId:'clinic-courtyard'}),
  freed:finish('maliang','马良','xiangyang','chengdu')
 },{medicine:{stage:['medicine'],next:'return',title:'宜城药铺',sceneId:'clinic-courtyard',count:4,enemyKind:'retainer'}},['maliang-white-brow']);
 define('taishici','北海问药','wu','beihai','blade','jianye',5,{
  rumor:S('beihai','查看北海医馆门前的动静','beihai-neighbor','邻妇','neighbor-woman',[
   ['npc','药铺已经让你们抢了一回，今天还要来砸？老掌柜自己都受了伤，哪还有东西能给你们？'],
   ['medicine-bandit','没药就拿钱出来！你们这条街总不能每家都没钱吧，谁敢把门关上，我们就砸谁的门！'],
   ['hero','大娘，先往屋里退，别站在棍子旁边。你们几个，把手里的东西放下，有什么话冲着我们说。'],
   ['taishici','昨晚就是他们抢了药车，今天还敢来。这位朋友，帮我守住门口，铺里还有病人，不能让他们冲进去。']], [next('与太史慈护住医馆','visit')]),
  visit:S('beihai','与太史慈赶走闹事的盗匪','taishici','太史慈','taishici',[
   ['npc','前面还有老人和孩子，别让他们跑进人群里。你帮我拦左边，我去拉住那辆车，先把这几个人分开。'],
   ['hero','左边我会看着。你也留意一下巷子口，那里还藏着一个，别只顾着眼前的人。']], [{label:'护住医馆',battle:'street'}]),
  doctor:S('beihai','与太史慈、华佗商议追回药材','taishici','太史慈','taishici',[
   ['npc','谢谢你帮忙，我叫太史慈，字子义。本来是替母亲来抓药，到了才知道药车被抢，连看病的先生也伤了，只好先来帮着守门。'],
   ['hero','子义，我听常山的人提过，令堂这阵子身体不好，才想着过来看看。她现在怎么样，药有没有断？'],
   ['huatuo','我刚给她看过，暂时还稳得住。需要的药原本都有，可都装在那辆被抢走的车上，得尽快把药找回来。'],
   ['npc','他们把车拉到都昌去了，我认得那条路。我和这位朋友去找，母亲这边，还得请先生帮忙照顾。'],
   ['huatuo','你们路上当心，到了先找药车，别一见人就追。箱子里还有针具，搬的时候扶稳，别伤着自己的手。'],
   ['hero','我们一起去都昌。大娘，劳烦你先帮先生照应一下病人，有消息了，我们会尽快赶回来。']], [next('与太史慈前往都昌','herbs',{guest:'taishici'})],{sceneId:'clinic-courtyard'}),
  herbs:S('beihai-county','在都昌找回药车和采药人','herb-worker','采药人','herbalist',[
   ['npc','你们别直接过来，树后面还有人！我刚想把车推回去，就让他们从车上拽下来了，那边一直有人看着。'],
   ['taishici','先蹲到车轮后面去，那里能挡一挡。我们看见那些人了，你别再自己上去拉车。'],
   ['hero','药箱应该还在附近。我们从路口把他们引开，尽量别挤到车旁边，免得打坏东西，也伤了车后的人。']], [{label:'救下采药人',battle:'herbs'}]),
  depot:S('beihai-county','取回被藏进棚里的药箱','herb-worker','采药人','herbalist',[
   ['npc','车上现在只剩空筐，药箱被他们搬进棚子了。你们先坐下来，我还有点随身带的药，先把伤口包好，再过去找。'],
   ['hero','你伤到腿没有，还能不能走？先把车推到路口停着，那里来往的人多，你也能找人帮忙。'],
   ['taishici','你先照看一下他，我去棚子旁边看看。门口那几个还在，我们等把车安置好，再一起过去。']], [{label:'包扎后取回药箱',battle:'depot',restoreParty:true}]),
  mix:S('beihai','将药材送回北海医馆','huatuo','华佗','huatuo',[
   ['npc','药箱放在这张桌上吧，这几包没受潮，都能用。子义，你先回去把水烧好，我配完药就过去，别让你母亲等急了。'],
   ['taishici','我这就回去。她刚才有没有再发热，人醒着吗？我出去这么久，一直有些放心不下。'],
   ['npc','刚刚睡着，邻居大嫂在屋里陪她。你回去轻一点，不用把她叫醒，先把水备好就行。'],
   ['hero','剩下的药我帮你送进铺里。门口还有人在等着，先把急着用的几样整理出来吧。']], [next('去太史慈家看看','return')],{sceneId:'clinic-courtyard'}),
  return:S('beihai','探望太史慈母亲','taishici','太史慈','taishici',[
   ['npc','母亲已经喝了药，刚才还问你们吃过饭没有。这两天她连说话都费劲，今天总算肯多问几句，我也放心了不少。'],
   ['hero','能有精神说话就是好事。让她安心歇着吧，我们到外面坐，不用这么多人都挤在屋里。'],
   ['npc','院里有张桌子，我们过去坐。你从常山特意赶过来，我还没好好问过，是谁向你提起我的？']], [next('与太史慈聊聊来意','freed')],{sceneId:'clinic-courtyard'}),
  freed:finish('taishici','太史慈','beihai','jianye')
 },{street:{stage:['visit','street'],next:'doctor',title:'北海医馆',sceneId:'city-north',count:2,enemyKind:'bandit',level:5,guest:'taishici'},herbs:{stage:['herbs'],next:'depot',title:'都昌救人',sceneId:'forest-path',count:3,enemyKind:'bandit',level:5,guest:'taishici'},depot:{stage:['depot'],next:'mix',title:'夺回药箱',sceneId:'bandit-camp',count:3,enemyKind:'bandit',level:5,guest:'taishici'}},['taishici-bold']);
 H.definitions.taishici.stages.street=H.definitions.taishici.stages.visit;
 define('lusu','长沙粮行','wu','changsha','scripture','jianye',7,{
  rumor:S('changsha','询问粮行前排队的乡民','lusu','鲁肃','lusu',[
   ['npc','每家先照人数领，孩子多的再添一些。大家别挤，仓里还备着粮，一个个来，今天都能领到。'],
   ['hero','这些粮是你在分？我们从北边过来，很多地方连想买粮都买不到，你们这里还能接济这么多人，真不容易。'],
   ['npc','是附近几家一起凑出来的，我只是帮忙照看。我叫鲁肃，字子敬。你们要是一路没带够，也可以来领一份，赶路不能一直饿着。'],
   ['hero','谢谢，我们带的还够用。不过我倒很想跟子敬聊聊。我们正在各地找愿意帮忙的人，你分粮的时候这么周到，应该很了解大家缺什么。']], [next('和鲁肃聊聊粮队','convoy')]),
  convoy:S('changsha','与鲁肃商量护送粮车','lusu','鲁肃','lusu',[
   ['npc','原来是来找人商量事情的。你来得正好，我明天准备往江东送一批粮，公瑾来信说，建业收留了不少流民，已经快供应不上了。'],
   ['hero','那这一趟要送到建业去吗？路上那么多粮车，你们打算怎么护送，已经找好人手没有？'],
   ['npc','先用车送到浏阳，再换船去建业。人手倒有，只是前一队到了渡口又退回来，说有人堵着码头，给了船钱还不让走。'],
   ['hero','我们可以陪你到渡口看看。粮食一直放在这里也不是办法，先问清楚是什么人在拦路，再商量怎么过去。']], [next('护送粮车前往浏阳','dock',{guest:'lusu'})]),
  dock:S('changsha-county','清理拦住粮队的水贼','dock-chief','水贼头目','river-bandit',[
   ['npc','这么多车粮，想从我们的码头上船？你们带的那点钱可不够，先把车停在这里，等我们查完再说。'],
   ['lusu','这些粮是送给逃难的百姓的，船钱我们会照付。你们如果也缺吃的，可以商量着分一些，别把所有车都扣住，江东那边还等着。'],
   ['npc','你说给多少就给多少？这码头现在由我们说了算。车和粮都留下，你们到旁边等着，没有吩咐不许动。'],
   ['hero','子敬，让车夫先往后退，别停在水边。他们根本没想让我们过去，我们把乡亲安置好，再回来处理。']], [{label:'护住粮队',battle:'dock'}]),
  letter:S('jianye','陪鲁肃将粮送到建业','zhouyu','周瑜','zhouyu',[
   ['npc','子敬，你总算到了。我前天还叫人去长沙送信，生怕你没收到消息，看来是跟你在路上错过了。'],
   ['lusu','信我收到了，只是渡口出了些麻烦。多亏这几位帮忙，粮车才没被扣下。现在都卸好了，让管事按单子点一点，看有没有少。'],
   ['npc','这一路辛苦你们了。我想请子敬留下帮忙，他说还想先听听你们的打算。你们接下来准备去哪里，需要他做些什么？'],
   ['hero','我们会继续去各地查探，遇到缺粮、缺药，或者被人欺负的地方，就尽量帮忙。子敬愿意同行很好，有别的安排也不用勉强。'],
   ['npc','我明白了。我给子敬写封介绍信，往后去江东各地办事，也方便跟当地的人说明来历。至于留在哪里，你们慢慢商量就好。']], [next('与鲁肃商议去留','freed')]),
  freed:finish('lusu','鲁肃','jianye','jianye')
 },{dock:{stage:['dock'],next:'letter',title:'浏阳渡边',sceneId:'river-dock',count:4,enemyKind:'bandit',guest:'lusu'}},['lusu-generous']);
 actors['xu-bandit']={id:'xu-bandit',name:'盗贼队长',art:'brigand',side:'left'};actors['li-servant']={id:'li-servant',name:'李府家丁',art:'brigand',side:'left'};actors['horse-thief']={id:'horse-thief',name:'马贼头目',art:'brigand',side:'left'};actors['medicine-bandit']={id:'medicine-bandit',name:'盗贼',art:'thief',side:'left'};actors['imperial-soldier']={id:'imperial-soldier',name:'官兵',art:'imperial-soldier',side:'left'};
 const rumors={xuchu:'许家村最近常遭贼，村里的许褚几次把人赶走。你们如果经过那里，可以去他家坐坐，他很乐意招待过路的朋友。',dianwei:'睢阳李家的家丁又在欺负刘家那对母子。听说有个叫典韦的壮士看不过去，已经过去了。',huangzhong:'长沙有位黄老将军，年纪虽大，弓却拉得比年轻人还稳。听说他常去酒肆和马厩，你去那儿问问。',maliang:'襄阳马先生正在四处找大夫，好像是他弟弟闯了祸。我也只听了个大概，你到了城里，不妨亲自问问。',taishici:'太史慈就在北海。听说他母亲病着，城里的药铺偏偏又被人抢了。你们想找他的话，到医馆附近问问，邻家大嫂认得他。',lusu:'鲁肃在长沙收粮，打算送去江东。我见过他一回，做事很实在，跟他说话也不必拐弯抹角。',ganning:'新野前几日抓了个江上来的人，官府不许人探望。街坊们议论得多，你到了那里再问，比听我传话强。'};for(const [id,text]of Object.entries(rumors))H.definitions[id].rumor=text;
 const conclusions={
  xuchu:[['npc','家里已经安排好轮流守夜的人，我爹也答应让我出门了。我准备去许昌看看，听说曹公正在找能做事的人，也许能帮我们把附近几处村子一起照应起来。'],['hero','那我们就一起走。你家里要是有消息送来，随时告诉我们，需要回来的时候，大家再一起商量。']],
  dianwei:[['npc','借据已经交给县里，里正也愿意作证，李永这回没法再随便说别人欠债了。只是刘大嫂和孩子已经不在，说什么都补不回来。'],['hero','我们先把他们的后事办好，也去看看受伤的家人。你身上的伤还没处理，别再一个人硬撑着跑。'],['npc','我知道，等这边都安排好，我想去许昌拜见曹公。你们要是还在外面走，我也能先跟着，路上再碰到这样的事，多个人总能多帮一点。']],
  huangzhong:[['npc','先歇一会儿吧，刚才练得够久了。你已经知道看我抬手就往旁边躲，比刚来的时候好多了，不用急着再打一场。'],['hero','再练下去，我明天怕是连胳膊都抬不起来了。对了，你以后有什么打算，还一直留在长沙吗？'],['npc','我想去成都拜见玄德公，听说他正在安置很多流民，应该用得上人手。你们要去别的地方，我也可以先同行，路上同样有需要帮忙的人。']],
  maliang:[['npc','病人已经退烧，刚才还吃了些东西。我弟弟也放出来了，我让他先去道歉，再在医馆帮几天忙，不能弄伤了人，治好就当没发生。'],['hero','他肯去道歉，也愿意留下照顾人，你应该能少担心些了。等这边安排好了，你自己准备去哪里？'],['npc','我先把弟弟送回家，然后想去成都拜访玄德公。如果你们还要在各地走访，我愿意一起去，记账、找药、跟人商量事情，我都可以帮忙。']],
  taishici:[['npc','我跟母亲说过你们要去各地找人的事了。她让我要是想去就去，不用整天守在屋里。华先生会来看病，邻家大嫂也答应常来照应。'],['hero','我们不急着催你。要是你还想等她再好一些，就再多留几天，等你们都放心了再决定。'],['npc','我知道你们没催。我自己也想去江东拜见孙将军，听说他愿意接纳外来的人。能先跟你们一起走，我也能多熟悉些地方，到建业再去拜访。']],
  lusu:[['npc','介绍信我收好了，粮也交给了管事。我留下两个伙计帮忙，暂时不用急着回长沙。你们接下来准备先去哪里？'],['hero','还没决定，先在附近打听一下。要是有地方正缺人帮忙，我们就过去看看，再决定往哪边走。'],['npc','那我也一起去打听。粮铺、药铺我都认识一些人，要是碰到缺东西的村子，说不定还能帮着找找门路。']]
 };
 for(const [id,rows]of Object.entries(conclusions))H.definitions[id].stages.freed.npc.turns=rows.map(([speaker,text])=>({speaker,text}));
 const factories=new Map();
 function companion(id,currentLevel){if(factories.has(id))return root.BattlePassives.complete(factories.get(id)(currentLevel));const d=H.definitions[id];if(id==='ganning')return root.BattlePassives.complete(H.companion(currentLevel??1));const weapon=I.create('weapon-'+d.type,'green',id+'-weapon'),skills=W.forWeapon(weapon);return {...G.create(id,currentLevel??d.level??10),id,name:d.name,characterId:id,unitType:'general',homeNode:d.home,experience:0,experienceVersion:2,weaponPlanVersion:3,defaultLoadoutVersion:2,weapon,skills,priorities:W.prioritiesFor(skills),equipment:{armor:I.create('leather-armor','white',id+'-armor'),accessory1:null,accessory2:null},armor:3,resistance:3,passives:root.BattlePassives.forUnit({id,passives:d.passives||[]})};}
 function buildEnemies(id,phase,currentLevel){const d=H.definitions[id],f=d.battles[phase];if(f.roster)return f.roster().map(u=>{const level=f.level||d.fixedCombatLevel||10;return u.baseAttributes&&u.potentials?{...u,level,...G.attributesAt(u.baseAttributes,u.potentials,level)}:{...u,level};});if(f.duel){let u=companion(f.duel,f.level||d.fixedCombatLevel||10);if(f.trainingWeapon){const weapon={...I.create('weapon-'+u.weapon.type,'white','duel-training'),id:'training-'+f.duel,name:f.trainingWeapon,skills:f.trainingSkills||[{base:'sword-cut',name:'试招'}]},skills=W.forWeapon(weapon);u={...u,weapon,skills,priorities:W.prioritiesFor(skills)};}return [{...u,id:'duel-'+f.duel,experienceWeight:1}];}const Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;return Catalog.roster(f.level||d.fixedCombatLevel||10,f.count,f.pattern,{army:!f.enemyKind}).map((u,i)=>({...u,id:id+'-foe-'+i,...(f.enemyKind==='retainer'?{name:i===0?'家丁头目':'李府家丁',characterId:'brigand'}:{}),...(i===0&&f.leaderName?{name:f.leaderName}:{}),...(i===0&&f.leaderArt?{characterId:f.leaderArt}:{})}));}
 function enemies(id,phase,currentLevel){const f=H.definitions[id].battles[phase],boss=f.boss||f.duel||f.named||f.roster;return N.mixRoster(buildEnemies(id,phase,currentLevel),f.enemyRoles,{army:!f.enemyKind}).map((u,i)=>({...u,...(i===0&&f.leaderName?{name:f.leaderName}:{}),...(i===0&&f.leaderArt?{characterId:f.leaderArt}:{}),...(boss?{boss:true,statusImmunities:[...new Set([...(u.statusImmunities||[]),'stun'])]}:{}),passives:[...new Set([...(u.passives||[]),...(f.temporaryPassives||[])])]}));}
 // 城镇日常人物长期保留；线索只指出当前需要前往的地点。
 const Scenes=node?require('./battle-scenes.js'):root.BattleScenes;
 const excluded=new Set(['camp']);
 for(const p of D.places.filter(p=>!p.requiresWater&&!excluded.has(p.id))){
  if(p.kind==='city')D.townScenes[p.id]=Scenes.town(p);else if(!D.townScenes[p.id])D.townScenes[p.id]=Scenes.get(p.kind==='city'?'market-street':p.kind==='port'?'river-dock':p.kind==='village'?'farmland':'rural-road');
  if(!N.npcs.some(n=>n.place===p.id&&n.role==='civilian'))N.npcs.push({id:'resident-'+p.id,name:p.kind==='city'?'街坊':'乡人',art:'villager',place:p.id,side:'left',role:'rumor',roleLabel:'交谈',lines:['你们是从外头来的吧？这几天路上不太平，天黑以前最好找个地方落脚。','在这里住久了，附近几条路和几户人家我都熟悉。你们想找人，或者想问哪里能歇脚，跟我说就是，我知道的都会告诉你们。']});
  if(p.kind==='city'&&!N.npcs.some(n=>n.place===p.id&&n.role==='merchant'))N.npcs.push({id:'merchant-'+p.id,name:'商贩',art:'laborer',place:p.id,side:'left',role:'merchant',roleLabel:'商贩',lines:['来看看吧，兵器和护具都有。赶路的人多，我也收些还能用的旧东西。']});
  if(p.kind==='city'&&!N.npcs.some(n=>n.place===p.id&&n.role==='healer'))N.npcs.push({id:'doctor-'+p.id,name:'郎中',art:'villager',place:p.id,side:'right',role:'healer',roleLabel:'疗伤',lines:['有伤就先坐下，我看看。别等到走不动路了才想起来找大夫。']});
 }
 const commissions=[
 ['cs-blackwood','林间归路','changshan','blackwood','laborer',3,2,'bandit-camp','山贼','mountain-bandit','林子里有人专抢挑柴的乡亲。我妹妹昨日回来得晚，被他们赶进沟里，脚到现在还肿着。你要是有空，帮我们把那条路清出来吧。'],
 ['ye-quarry','石场欠账','ye','old-quarry','laborer',6,3,'bandit-camp','恶仆','brigand','石场换了个管事，工钱不发，还把工人的东西扣住了。官府没人肯管，你能不能去把他们赶走，让大伙先回家？'],
 ['beihai-road','归乡货车','beihai-county','beihai','village-maiden',5,2,'rural-road','盗贼','thief','我家那辆车停在城外，几个人围着不许走，说要查货。可他们连个官差的样子也没有，怕是在等着把车拉走。'],
 ['pingyuan-boats','河滩旧船','pingyuan','pingyuan-county','laborer',5,3,'river-dock','水贼','river-bandit','河滩上那几条船是我们吃饭的家伙，被一伙水贼占了。他们不许下水捕鱼，我们一家人可怎么过日子？'],
 ['qiao-harvest','秋粮未归','qiaoxian','qiaoxian-county','villager',7,2,'farmland','强盗','brigand','地里的粮眼看就能收，有伙贼却堵在田埂上，谁去就抢谁。再拖下去，一场雨下来就全坏了。'],
 ['suiyang-delivery','迟来的家书','suiyang','chenliu-county','village-maiden',8,2,'rural-road','盗贼','thief','送信的老伯被扣在己吾了。他只是替乡亲们带几封家书，哪里拿得出他们要的赎钱。劳烦你去看看，先把人带回来。'],
 ['xy-mill','磨坊停工','xiangyang','xiangyang-county','laborer',8,3,'farmland','山贼','mountain-bandit','宜城磨坊那边又来人闹事了。麦子堆着磨不了，城里几家饼铺都来催我，我实在没办法。'],
 ['cs-riverside','渡边灯火','changsha','changsha-county','villager',9,3,'river-dock','水贼','river-bandit','渡口的船夫昨夜跑回来了，说有人拆他的船板生火。你们如果去浏阳，帮他把那些人赶走，船还能补一补。'],
 ['jy-supplies','山道药担','jianye','jianye-county','village-maiden',9,2,'rural-road','强盗','brigand','药铺托人送来的药材被抢了，挑担的伙计也受了伤。就在秣陵那条小路，你如果能找回来，铺里愿意出一份酬谢。']
 ];
 for(const [id,title,giverPlace,place,art,recommendedLevel,rounds,sceneId,enemyName,enemyArt,accept]of commissions){const giver='giver-'+id;N.npcs.push({id:giver,name:art==='laborer'?'劳工':art==='village-maiden'?'乡女':'乡老',art,place:giverPlace,role:'quest',side:'left',roleLabel:'委托',lines:[accept,'你们一路过来，路上可还顺利？先在这里歇歇脚吧。']});N.sideQuests.push({id,title,giver,giverPlace,place,recommendedLevel,rounds,sceneId,enemyName,enemyArt,accept,money:100+recommendedLevel*20,item:recommendedLevel>7?'iron-armor':'leather-armor',quality:'green'});}
 for(const npc of N.npcs){if(npc.role==='merchant')npc.art='peddler';else if(npc.role==='healer')npc.art='town-doctor';}
 const api={landmark,registerCompanion:(id,factory)=>factories.set(id,factory),actors,companion,enemies};root.RecruitmentContent=api;if(node)module.exports=api;
})(globalThis);
