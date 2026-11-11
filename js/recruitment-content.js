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
   ['hero',"大叔，松手！刀都出鞘了。到我身后来，车绳给我。"],
   ['xu-bandit','你跟这老头是一家的？不是就赶紧让开！我们拿了粮就走，少在这里给自己找麻烦。'],
   ['xuchu',"俺才下趟田，你们又来了？上回没听清是吧？粮袋放下！"]], [next('帮忙护住粮车','meet')]),
  meet:S('xujia','与许褚一起守住粮车','xuchu','许褚','xuchu',[
   ['npc','你帮忙看着车头，我去拦后面的两个人。大叔，趁他们过不来，先把牛牵进院子，别让刀碰着它。'],
   ['hero','我守着这边。你也小心墙边那个人，他手藏在衣服里，应该还带着刀，别让他绕到你背后。']], [{label:'护住乡亲',battle:'village'}]),
  temple:S('north-temple','追到破庙，救回被抓的乡亲','xu-bandit','盗贼队长','brigand',[
   ['npc',"许褚，你还真敢来？人就在庙里。你那锤子再抬一寸，老子可就管不住手了！"],
   ['xuchu',"把人放了！拿乡亲吓唬俺算什么本事，有胆的出来！"],
   ['hero',"别急，左边窗子没封，里头有人敲。你再跟他说两句，我绕过去。"]], [{label:'救出乡亲',battle:'temple'}]),
  home:S('xujia','将乡亲和粮车送回许家村','xu-farmer','庄稼汉','laborer',[
   ['npc',"回来了，回来了！快让我瞧瞧，伤着没有？方才听见车响，我还怕又是那帮贼。"],
   ['xuchu','庙里还堆着不少抢去的粮，我让几个人留下看着了。明天多找几辆车，把乡亲们的东西一起拉回来。'],
   ['hero',"村口该设个望风的。哪家来了生人，喊一嗓子，守粮的人也来得及赶到。"],
   ['npc',"这就跟里正说，夜里也得轮着守。你们进屋坐！饭还在灶上，我再热热。"]], [next('与许褚坐下聊聊','freed')]),
  freed:finish('xuchu','许褚','xujia','xuchang')
 },{village:{stage:['meet','village'],next:'pursuit',title:'许家村口',sceneId:'farmland',count:3,enemyKind:'bandit',guest:'xuchu'},temple:{stage:['temple'],next:'home',title:'破庙救人',sceneId:'bandit-camp',count:4,enemyKind:'bandit',guest:'xuchu'}},['xuchu-tiger']);
 H.definitions.xuchu.stages.village=H.definitions.xuchu.stages.meet;
 H.definitions.xuchu.stages.pursuit=S('xujia','与许褚追查盗匪落脚处','xuchu','许褚','xuchu',[
  ['npc',"跑的那几个往村北去了。前几日还抓了几个看田的，至今不见回来。粮夺下了，人可还在他们手里。"],
  ['hero',"有地方可找吗？咱们追过去，免得他们跑回来又把人挪走。"],
  ['npc',"村北破庙，贼就宿在那儿。俺追过一回，听见里面有人喊救命。就俺一个，顾得了打，顾不了人，没敢闯。"],
  ['hero',"这回有人帮你。咱们去看看，先找关人的地方。"]], [next('前往村北破庙','temple',{guest:'xuchu'})]);
 define('dianwei','睢阳旧案','wei','suiyang','axe','xuchang',9,{
  rumor:S('suiyang','查看刘家门前的争执','liu-widow','刘氏','liu-widow',[
   ['npc','这笔粮我丈夫生前已经还清了，里正当时就在旁边！你们不去问他，凭什么直接来收我们的房子？'],
   ['li-servant','我们只照主人的吩咐搬东西。你要说理，自己去李府说，别挡在门口，再磨蹭，连门也给你拆了！'],
   ['hero',"柜子放下！现成的证人在这儿，你们不问，倒先来搬东西？"],
   ['dianwei',"讨债？这是抢。东西放回去！欺负孤儿寡母，也不怕叫人笑话。"]], [next('拦住家丁','yard')]),
  yard:S('suiyang','与典韦赶走李家家丁','li-servant','李府家丁','brigand',[
   ['npc','又是你这个姓典的！上次就坏了我们的事，今天还敢拦着？主人正愁找不到你，这回你也别想走！'],
   ['dianwei',"就说典韦拦的！想找我，叫李永自己来。搬走的东西，一样不少地送回来。"],
   ['hero',"大嫂，带孩子进屋，拴好门。别出来，我们挡着。"]], [{label:'赶走家丁',battle:'yard'}]),
  night:S('suiyang','安顿刘氏母子','dianwei','典韦','dianwei',[
   ['liu-widow','多谢你们。我想先带孩子到他舅舅家住几天，行李以后再收。那些人知道这里就剩我们娘俩，我晚上实在不敢再住了。'],
   ['npc','我送你们过去。你兄弟住在东街，我认得他，路上有我跟着，李家的人也不敢拦你们。'],
   ['hero',"我去找里正，求他把还粮的日子写下来。有旁的证人，也一并请到。明早客店碰头。"],
   ['npc',"成，你住西街客店。我把人送妥，便去找你。"]], [next('先去找里正作证','morning')]),
  morning:S('suiyang','查问刘氏母子的下落','liu-neighbor','邻妇','neighbor-woman',[
   ['npc','你是昨天帮刘家的那位吧？昨晚李家的人又去了东街，她兄弟让人打伤，刘氏和孩子……郎中赶过去，也没能救下来。'],
   ['hero','怎么会这样？典韦呢，他昨天护送他们去东街的，有没有人见过他？'],
   ['npc','他送到了，又出去找人帮着守门，半路让一伙人缠住了。天亮听见这个消息，连伤都没顾上包扎，就跑去李府找人算账了。'],
   ['hero','麻烦你告诉我李府怎么走，我得去找他。他现在又有伤又着急，不能让他一个人闯进去。']], [next('赶往李府','mansion')]),
  mansion:S('suiyang','闯入李府寻找典韦','li-servant','李府家丁','brigand',[
   ['hero',"刚才有人在里头喊！典韦是不是进了你家？人呢？"],
   ['npc','什么典韦？我们根本不认识，你赶紧走，李府不是让人随便进来的地方。'],
   ['dianwei',"我在这儿！停下！地上有机关，别踩我前头那块板！"],
   ['hero',"听见了！你别使蛮力，我这就进去。挡门的，让开！"]], [{label:'闯入院中',battle:'mansion'}]),
  cage:S('suiyang','解开墙上的机关，救出典韦','li-yong','李永','li-yong',[
   ['npc','一个接一个地来坏我的事，真当李家是好欺负的？我今天就把这院子烧了，你们要救人，就留在里面陪着！'],
   ['dianwei',"李永跑后门了！别追，先看墙上，那几块木板连着锁。把它挪开，笼门兴许就能升起来。"],
   ['hero',"抬不动，得解锁。你退后，我试试墙上的木板。"],
   ['dianwei',"就那几块！当心头顶，横梁已经晃了，别正站在底下。"]], [{label:'解开机关',puzzle:true,next:'tunnel'}],{sceneId:'bandit-camp'}),
  tunnel:S('suiyang','从后院密道追上李永','dianwei','典韦','dianwei',[
   ['npc',"可算出来了！让我喘口气……这笼子，险些把两条胳膊都拉脱了。"],
   ['hero',"布给你，先裹住伤。暗道里的灯还亮着，李永走不远。能走了咱们就追。"],
   ['npc',"走得！他还带着借据，不拿回来，明日又要有人倒霉。"]], [{label:'追入密道',battle:'tunnel'}]),
  freed:finish('dianwei','典韦','suiyang','xuchang')
 },{yard:{stage:['yard'],next:'night',title:'刘家院前',sceneId:'city-north',count:3,enemyKind:'retainer',guest:'dianwei'},mansion:{stage:['mansion'],next:'cage',title:'李府前院',sceneId:'city-north',count:4,enemyKind:'retainer'},tunnel:{stage:['tunnel'],next:'freed',title:'李府密道',sceneId:'bandit-camp',count:4,enemyKind:'retainer',guest:'dianwei',leaderName:'李永',leaderArt:'li-yong'}},['dianwei-guard']);
 define('huangzhong','长沙老将','shu','changsha','bow','chengdu',10,{
  rumor:S('changsha','向酒家询问街上的动静','cs-host','酒家掌柜','innkeeper',[
   ['npc','这酒还没温好，你先坐一会儿。哎，那几个人怎么又把马牵走了？黄老将军不是叫他们等马夫回来认的吗？'],
   ['hero',"这马不是他们的？怎么还要叫马夫来认？"],
   ['npc','黄老将军说像是军中丢的马，腿上的旧伤也对得上。那些人一听要找马夫就急着走，你看，他已经追出去了。']], [next('跟出去看看','stable')]),
  stable:S('changsha','协助黄忠拦住卖马的人','huangzhong','黄忠','huangzhong',[
   ['npc',"左后腿的伤，鞍底的烙印，老夫认得清楚。这是军马。马夫一来便知，你们急什么？"],
   ['horse-thief','我们也是花钱买来的，你说是军马就是军马？老人家，生意不是这么做的，把路让开，别一直拦着我们。'],
   ['hero',"卖马的人是谁？可留了字据？有凭证便拿出来，何必急着牵走。"],
   ['npc',"要跑！拦右边！别往马身上招呼，那匹受不得惊。"]], [{label:'拦住马贼',battle:'street'}]),
  track:S('changsha','与黄忠追查失马的去向','huangzhong','黄忠','huangzhong',[
   ['npc',"马夫认了，是军中走失的。浏阳还丢了两匹，怕也在他们手里。这些人只牵一匹来，是探探行情。"],
   ['hero',"刚才跑的往哪边去了？顺着追，或许能找到马。"],
   ['npc',"东门。可愿再陪老夫一程？他们知道露了馅，不会在城外久留。"]], [next('前往浏阳找马','horses')]),
  horses:S('changsha-county','找到浏阳道旁的失马','horse-thief','马贼头目','brigand',[
   ['npc','刚才回来的弟兄说，有个老头一直追着问马的事，就是你吧？这么大年纪了，还非得跟我们过不去？'],
   ['huangzhong',"刀离马远些！方才射你脚边，是留情。再敢动，下一箭便换个地方。"],
   ['hero',"后头那两个人我挡着，将军只管护马！"]], [{label:'夺回失马',battle:'horses'}]),
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
   ['hero',"官爷，门口这些人还等着看伤。有什么话，到旁边说吧。这位先生，究竟出了什么事？"],
   ['npc','我弟弟跟刘家的公子争吵，推搡时把人弄伤了，现在还关着。我想先把伤治好，可城里已经请过几位大夫，都没有见好。']], [next('问问能否帮忙','doctor')]),
  doctor:S('xiangyang','与马良商量请医的办法','maliang','马良','maliang',[
   ['npc','听药铺的人说，华先生这几天在宜城。我想去请他，又怕府里找不到人，以为我们要逃走，实在没法离开。'],
   ['hero',"季常，我替你去宜城。劳烦把伤处、症状和用过的药写下，我好带给先生看。"],
   ['npc',"都写在这里了。刘家照料伤者的仆人也随你去，信里说不清的，他见过，能答得上来。"]], [next('前往宜城请医','clinic')]),
  clinic:S('xiangyang-county','在宜城找到华佗','huatuo','华佗','huatuo',[
   ['npc',"信里说伤口流脓，发热不退。这须亲眼看，不能隔空开方。我随你们去襄阳。"],
   ['hero',"那我去备车。先生要带什么，我们一道搬上去。"],
   ['npc','得先去后院把药箱取回来。昨天有几个逃兵来拿药，连针具和给孩子用的药都搬走了，现在还守在那里，不肯让我们进去。'],
   ['hero',"刚来时确实见到有人堵后门。先生留步，我们去取药箱。"]], [next('去药铺后院','medicine')],{sceneId:'clinic-courtyard'}),
  medicine:S('xiangyang-county','夺回被占用的药箱','medicine-looter','逃兵头目','imperial-captain',[
   ['npc','这些药已经归军里用了，受伤的弟兄都等着。你们在外面等，什么时候能拿回去，我们自会告诉你们。'],
   ['hero',"要什么药，请大夫给你们开。针具也搬走，叫外头那些病人用什么？你听，街上还有孩子在哭。"],
   ['npc','轮得到你在这里教训人？把门关上，谁再往里走，就别怪我们动手！'],
   ['hero',"先生，带病人走侧门！药箱在架子上，我们去取。"]], [{label:'夺回药箱',battle:'medicine'}],{sceneId:'clinic-courtyard'}),
  return:S('xiangyang','陪华佗回襄阳诊治','maliang','马良','maliang',[
   ['npc',"先生可算来了！人在医馆后屋，昨夜又烧了一回。我领您进去。"],
   ['huatuo',"拆开旧布……原来碎木还在里头，怪不得。灯拿近些，别挡着亮。"],
   ['hero',"照这儿行吗？我拿稳，您动手。"],
   ['npc',"我去烧水。二位扶着他些，别碰伤臂，先生还要清创。"]], [next('等候诊治结果','freed')],{sceneId:'clinic-courtyard'}),
  freed:finish('maliang','马良','xiangyang','chengdu')
 },{medicine:{stage:['medicine'],next:'return',title:'宜城药铺',sceneId:'clinic-courtyard',count:4,enemyKind:'retainer'}},['maliang-white-brow']);
 define('taishici','北海问药','wu','beihai','blade','jianye',5,{
  rumor:S('beihai','查看北海医馆门前的动静','beihai-neighbor','邻妇','neighbor-woman',[
   ['npc','药铺已经让你们抢了一回，今天还要来砸？老掌柜自己都受了伤，哪还有东西能给你们？'],
   ['medicine-bandit','没药就拿钱出来！你们这条街总不能每家都没钱吧，谁敢把门关上，我们就砸谁的门！'],
   ['hero',"大娘，回屋！棍子不长眼。你们几位，要钱也犯不上砸药铺吧？"],
   ['taishici','昨晚就是他们抢了药车，今天还敢来。这位朋友，帮我守住门口，铺里还有病人，不能让他们冲进去。']], [next('与太史慈护住医馆','visit')]),
  visit:S('beihai','与太史慈赶走闹事的盗匪','taishici','太史慈','taishici',[
   ['npc','前面还有老人和孩子，别让他们跑进人群里。你帮我拦左边，我去拉住那辆车，先把这几个人分开。'],
   ['hero',"巷口还藏着一个，我来挡。你顾住铺门！"]], [{label:'护住医馆',battle:'street'}]),
  doctor:S('beihai','与太史慈、华佗商议追回药材','taishici','太史慈','taishici',[
   ['npc',"方才承你援手。我叫太史慈，字子义。来替母亲抓药，却碰上这伙人抢车打人，只能先替掌柜守住门。"],
   ['hero',"子义，我从常山听说令堂病了，特意来看一眼。药还能接得上吗？"],
   ['huatuo',"尚能稳住。可急用的几味药，全在被抢的车上。再拖几日，就不好说了。"],
   ['npc',"贼把车拖到都昌了，我认得路。先生，母亲便拜托您了，我去把药取回来。"],
   ['huatuo',"我在这儿，你放心。找药要紧，别追着贼走远。箱里有针具，搬时当心。"],
   ['hero',"我陪子义去。大娘，铺里还劳您搭把手，我们取了药便回来。"]], [next('与太史慈前往都昌','herbs',{guest:'taishici'})],{sceneId:'clinic-courtyard'}),
  herbs:S('beihai-county','在都昌找回药车和采药人','herb-worker','采药人','herbalist',[
   ['npc','你们别直接过来，树后面还有人！我刚想把车推回去，就让他们从车上拽下来了，那边一直有人看着。'],
   ['taishici',"蹲下，藏到车轮后头！人我看见了，你别动！"],
   ['hero',"药箱也许还在车旁。把他们引到路口来，别打翻车，车后还有人！"]], [{label:'救下采药人',battle:'herbs'}]),
  depot:S('beihai-county','取回被藏进棚里的药箱','herb-worker','采药人','herbalist',[
   ['npc','车上现在只剩空筐，药箱被他们搬进棚子了。你们先坐下来，我还有点随身带的药，先把伤口包好，再过去找。'],
   ['hero',"腿伤重不重？车先推到路口，那儿有人经过。我们去找药箱，你别再往里闯。"],
   ['taishici',"你替他裹一下伤，我去瞧瞧棚子的门。那几个人还守着，得等你过来再动手。"]], [{label:'包扎后取回药箱',battle:'depot',restoreParty:true}]),
  mix:S('beihai','将药材送回北海医馆','huatuo','华佗','huatuo',[
   ['npc',"子义，箱子放这儿。药没受潮，还能用。你回家烧水，我配好便送过去。"],
   ['taishici',"母亲还醒着吗？又发热没有？我这一路……心总悬着。"],
   ['npc',"方才睡着了，大嫂守着。进门轻些，烧好水等着便是。"],
   ['hero',"剩下的我搬进铺里。门外还等着人，急用的几样放上头吧。"]], [next('去太史慈家看看','return')],{sceneId:'clinic-courtyard'}),
  return:S('beihai','探望太史慈母亲','taishici','太史慈','taishici',[
   ['npc',"母亲喝了药，精神好多了。方才还问，你们在外忙了一天，可吃过饭？前两日她连话都不肯说，今日竟催起我来了。"],
   ['hero',"那我可不跟她客气。饭在院里吃，屋里留给她静养，咱们别吵着。"],
   ['npc',"院里桌子现成，我去搬凳子。你方才说是从常山来，谁向你提起我的？"]], [next('与太史慈聊聊来意','freed')],{sceneId:'clinic-courtyard'}),
  freed:finish('taishici','太史慈','beihai','jianye')
 },{street:{stage:['visit','street'],next:'doctor',title:'北海医馆',sceneId:'city-north',count:2,enemyKind:'bandit',level:5,guest:'taishici'},herbs:{stage:['herbs'],next:'depot',title:'都昌救人',sceneId:'forest-path',count:3,enemyKind:'bandit',level:5,guest:'taishici'},depot:{stage:['depot'],next:'mix',title:'夺回药箱',sceneId:'bandit-camp',count:3,enemyKind:'bandit',level:5,guest:'taishici'}},['taishici-bold']);
 H.definitions.taishici.stages.street=H.definitions.taishici.stages.visit;
 define('lusu','长沙粮行','wu','changsha','scripture','jianye',7,{
  rumor:S('changsha','询问粮行前排队的乡民','lusu','鲁肃','lusu',[
   ['npc','每家先照人数领，孩子多的再添一些。大家别挤，仓里还备着粮，一个个来，今天都能领到。'],
   ['hero',"这么些粮，都是你拿出来的？北边有几处地方，攥着钱都买不着。"],
   ['npc',"附近几家一道凑的，我只照看着分。我姓鲁，名肃，字子敬。你们也拿一份？路上缺粮，可不是小事。"],
   ['hero',"我们带的够，谢谢子敬。你对各处粮情这么熟，我正想向你讨教，可有空说几句？"]], [next('和鲁肃聊聊粮队','convoy')]),
  convoy:S('changsha','与鲁肃商量护送粮车','lusu','鲁肃','lusu',[
   ['npc','原来是来找人商量事情的。你来得正好，我明天准备往江东送一批粮，公瑾来信说，建业收留了不少流民，已经快供应不上了。'],
   ['hero','那这一趟要送到建业去吗？路上那么多粮车，你们打算怎么护送，已经找好人手没有？'],
   ['npc',"车送浏阳，再换船。前一队到码头便被赶回来了，说船钱交过，还嫌不够，连粮都不肯卸。"],
   ['hero',"我们陪你走一趟。到底是谁收的船钱，到了问他便知道。"]], [next('护送粮车前往浏阳','dock',{guest:'lusu'})]),
  dock:S('changsha-county','清理拦住粮队的水贼','dock-chief','水贼头目','river-bandit',[
   ['npc','这么多车粮，想从我们的码头上船？你们带的那点钱可不够，先把车停在这里，等我们查完再说。'],
   ['lusu',"船钱照付，诸位若缺粮，我也可分些。可这几车，是给江东逃难之人的口粮，不能全扣在这里。"],
   ['npc','你说给多少就给多少？这码头现在由我们说了算。车和粮都留下，你们到旁边等着，没有吩咐不许动。'],
   ['hero',"子敬，叫车夫退开水边。他们要的不是船钱，是整车的粮。"]], [{label:'护住粮队',battle:'dock'}]),
  letter:S('jianye','陪鲁肃将粮送到建业','zhouyu','周瑜','zhouyu',[
   ['npc',"子敬，你可来了！我前日还派人送信去长沙，想必与你错过了。渡口可有为难？"],
   ['lusu',"信收着了，码头倒着实费了一番周折。承这几位相助，粮才保住。车已卸在外头，请管事照单点收。"],
   ['npc',"多谢诸位。我正想借子敬几日，他却说还没问过你们的行程。你们接下来有何打算？"],
   ['hero',"还得四处寻人，少不得赶远路。我想请子敬帮我们照看粮草，沿途若有人缺吃少药，他也熟悉门路。"],
   ['npc',"那我备一封书信。到了江东各处，你们持信去见当地官吏，不必再为通行的事耽误。子敬愿留愿走，你们自去商量。"]], [next('与鲁肃商议去留','freed')]),
  freed:finish('lusu','鲁肃','jianye','jianye')
 },{dock:{stage:['dock'],next:'letter',title:'浏阳渡边',sceneId:'river-dock',count:4,enemyKind:'bandit',guest:'lusu'}},['lusu-generous']);
 actors['xu-bandit']={id:'xu-bandit',name:'盗贼队长',art:'brigand',side:'left'};actors['li-servant']={id:'li-servant',name:'李府家丁',art:'brigand',side:'left'};actors['horse-thief']={id:'horse-thief',name:'马贼头目',art:'brigand',side:'left'};actors['medicine-bandit']={id:'medicine-bandit',name:'盗贼',art:'thief',side:'left'};actors['imperial-soldier']={id:'imperial-soldier',name:'官兵',art:'imperial-soldier',side:'left'};
 const rumors={xuchu:"许家村有个壮士，叫许褚，几回都替村人挡住了贼。你若去，田里粮仓都可找找，他闲不住。",dianwei:"睢阳李家又派人去搬刘家东西了，孤儿寡母，哪拦得住？姓典的壮士已经赶去，恐怕要闹大。",huangzhong:"长沙黄老将军，胡子白了，弓却拉得开。近来常去马厩，也不知是在看马，还是寻什么东西。",maliang:"襄阳马先生这阵子到处请医，听说弟弟伤了人，还押着呢。你要见他，去药铺门口找。",taishici:"北海的太史慈正替母亲寻药，偏药车叫人抢了。他日日在医馆附近，邻家那位大嫂认得他。",lusu:"长沙鲁子敬在收粮，说要送去江东。他分粮时，连谁家几口人都问，倒不只是个财主。",ganning:"新野抓了个叫甘宁的，江上来的。衙门外正贴告示呢，我瞧守门的脸色，恐怕没什么好事。"};for(const [id,text]of Object.entries(rumors))H.definitions[id].rumor=text;
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
  if(!N.npcs.some(n=>n.place===p.id&&n.role==='civilian'))N.npcs.push({id:'resident-'+p.id,name:p.kind==='city'?'街坊':'乡人',art:'villager',place:p.id,side:'left',role:'rumor',roleLabel:'交谈',lines:["从哪边来的？路上可还好走？天黑前找地方住吧，近来总听见半夜有人喊丢了车。","我在这里住了几十年。问人，问路，问哪家有张空铺，都能说上几句。你想打听什么？"]});
  if(p.kind==='city'&&!N.npcs.some(n=>n.place===p.id&&n.role==='merchant'))N.npcs.push({id:'merchant-'+p.id,name:'商贩',art:'laborer',place:p.id,side:'left',role:'merchant',roleLabel:'商贩',lines:["客官瞧瞧，兵器、护具都有。旧的也收，只要还使得，价钱便能商量。"]});
  if(p.kind==='city'&&!N.npcs.some(n=>n.place===p.id&&n.role==='healer'))N.npcs.push({id:'doctor-'+p.id,name:'郎中',art:'villager',place:p.id,side:'right',role:'healer',roleLabel:'疗伤',lines:["伤在哪儿？坐下，我瞧一眼。赶路也别连血都顾不得止。"]});
 }
 const commissions=[
 ['cs-blackwood','林间归路','changshan','blackwood','laborer',3,2,'bandit-camp','山贼','mountain-bandit',"林里那伙人，专挑背柴的抢。我妹妹昨晚被撵进沟，脚肿得鞋也穿不进。诸位若有本事，替我们清清路吧，往后还得去打柴呢。"],
 ['ye-quarry','石场欠账','ye','old-quarry','laborer',6,3,'bandit-camp','恶仆','brigand',"新来的石场管事，工钱不发，连大伙的铺盖都扣了。告到官府也没人理。劳你们跑一趟，好歹先叫人拿上东西回家。"],
 ['beihai-road','归乡货车','beihai-county','beihai','village-maiden',5,2,'rural-road','盗贼','thief',"城外那车是我家的。几个人围着说查货，既没文书，也没官衣。天快黑了，我怕一转眼，连车也寻不着了。"],
 ['pingyuan-boats','河滩旧船','pingyuan','pingyuan-county','laborer',5,3,'river-dock','水贼','river-bandit',"船叫水贼占了，连网都不许取。一家老小指着河里这口饭，可不能只站岸上看水啊。"],
 ['qiao-harvest','秋粮未归','qiaoxian','qiaoxian-county','villager',7,2,'farmland','强盗','brigand',"庄稼熟了，贼却守在田埂，谁割抢谁。一场雨下来就全烂在地里了，哪等得起？帮帮我们吧。"],
 ['suiyang-delivery','迟来的家书','suiyang','chenliu-county','village-maiden',8,2,'rural-road','盗贼','thief',"送家书的老伯扣在己吾了。他替人捎个信，挣得了几个钱，哪有赎身的银子？劳你们带他回来，信晚些到，总好过人回不来。"],
 ['xy-mill','磨坊停工','xiangyang','xiangyang-county','laborer',8,3,'farmland','山贼','mountain-bandit',"宜城磨坊又停了，贼堵着不叫开磨。麦子堆在外头，饼铺的日日来催，我还能空手给他磨出面来？"],
 ['cs-riverside','渡边灯火','changsha','changsha-county','villager',9,3,'river-dock','水贼','river-bandit',"船夫昨夜跑来，哭说船板都叫水贼拆来烧了。去浏阳时，替他赶走那伙人吧！船没毁透，补补还能过河。"],
 ['jy-supplies','山道药担','jianye','jianye-county','village-maiden',9,2,'rural-road','强盗','brigand',"秣陵那条小路，药担让人抢了，伙计带着伤逃回来。若能替铺里寻回药材，酬谢都好说，病人还等着用呢。"]
 ];
 for(const [id,title,giverPlace,place,art,recommendedLevel,rounds,sceneId,enemyName,enemyArt,accept]of commissions){const giver='giver-'+id;N.npcs.push({id:giver,name:art==='laborer'?'劳工':art==='village-maiden'?'乡女':'乡老',art,place:giverPlace,role:'quest',side:'left',roleLabel:'委托',lines:[accept,"坐，脚歇过来再说。外头的路，总不能一口气走完。"]});N.sideQuests.push({id,title,giver,giverPlace,place,recommendedLevel,rounds,sceneId,enemyName,enemyArt,accept,money:100+recommendedLevel*20,item:recommendedLevel>7?'iron-armor':'leather-armor',quality:'green'});}
 for(const npc of N.npcs){if(npc.role==='merchant')npc.art='peddler';else if(npc.role==='healer')npc.art='town-doctor';}
 const api={landmark,registerCompanion:(id,factory)=>factories.set(id,factory),actors,companion,enemies};root.RecruitmentContent=api;if(node)module.exports=api;
})(globalThis);
