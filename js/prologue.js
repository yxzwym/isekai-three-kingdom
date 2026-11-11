(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const Journal=typeof module!=='undefined'&&module.exports?require('./conversation-journal.js'):root.ConversationJournal;
  const speakerSides={hero:'right',nanhua:'right',zuoci:'left',yuji:'left',zhangjiao:'left',zhangbao:'right',zhangliang:'left'};
  const line=(speaker,text,partner,figure)=>({speaker,text,partner,figure,side:speakerSides[speaker]||'left'});
  const chapters={
    arrival:{scene:'village',title:'序章 · 陌路',next:'first-fight',lines:[
      line('narrator',"下山时，景区已经没什么人了。你在岔路口停了一下：停车场明明就在山脚，怎么走了这么久，还看不见出口？雾沿着石阶漫上来，很快没过了膝盖。",null),
      line('narrator',"前面传来车轮声，夹着几句争吵。你扶着石墙往声音那边走，脚下突然一滑。再站稳时，踩着的已经不是石阶，而是黏着草根的泥。",null),
      line('hero',"不对啊，我刚才还在台阶上……这儿什么时候有个村子？",null),
      line('narrator',"茅屋前停着一辆粮车，几个穿甲的人正往上搬粮袋。你回身望去，石墙不见了。身后只有一片田，枯黄的秸秆在雾里轻轻晃动。",null),
      line('imperial-soldier','叫你松手，没听见？这是军中征粮，再拦着连你一起带走！','imperial-soldier'),
      line('narrator',"老人死死攥着车绳，被推得跌过来。你下意识扶了一把。还没等他站稳，那官兵已经转过身，手按上了刀柄。",'imperial-soldier'),
      line('hero',"当心！老人家，站稳了……这是哪儿？",'imperial-soldier'),
      line('imperial-soldier','你干什么的？是不是他家里人，跑来替他撑腰？','imperial-soldier'),
      line('hero',"不是，我就扶了他一下。你看，他差点摔着。",'imperial-soldier'),
      line('imperial-soldier',"还敢顶嘴？我瞧你在这儿转半天了。来人，拿下！",'imperial-soldier'),
      line('hero','等一下！别动手——','imperial-soldier')
    ]},
    aftermath:{scene:'village',title:'序章 · 援手',next:'manual-fight',lines:[
      line('narrator',"胸口一阵闷痛，你摔在泥里，张着嘴却吸不进气。手掌刚撑上地面，一只靴子便踩住了你的衣襟。",'imperial-soldier'),
      line('hero',"我就是路过的……路过也不行？",'imperial-soldier'),
      line('imperial-soldier','把这个也带走。','imperial-soldier'),
      line('zhangjiao','放开他。','zhangjiao'),
      line('narrator','一只手拦住了官兵。来人俯下身，把你扶到路边。','zhangjiao'),
      line('zhangjiao',"别急着起身。伤在胸口？缓一缓，慢些吸气。",'zhangjiao'),
      line('hero',"疼……嘶，差点背过气去。你当心，他们不听解释的。",'zhangjiao'),
      line('zhangjiao',"我看见了，是你扶住了那位老丈。他们要拿人，也得有个缘由。你且歇着，我去问他。",'zhangjiao'),
      line('hero',"这还用问缘由？我手都没碰到他，就挨了一顿打。",'zhangjiao'),
      line('imperial-soldier',"那边那个，你也想吃军棍？滚开！",'imperial-soldier'),
      line('zhangjiao','你靠着树歇一会儿，他交给我。','zhangjiao'),

    ]},
    reinforcements:{scene:'village',title:'序章 · 并肩',next:'prepare',lines:[
      line('imperial-soldier','这人会妖术！都过来，别让他跑了！','imperial-soldier','imperial-soldier'),
      line('narrator','听见喊声，又有几名官兵从路口赶来。张角刚把你扶到树下，村道两头就都被堵住了。','zhangjiao','zhangjiao'),
      line('zhangliang',"大哥！谁在喊？俺隔着半条道都听见了。",'zhangliang','zhangliang'),
      line('zhangbao',"乡亲们从后面撤了。几个老人走不快，咱们还得挡一会儿。",'zhangbao','zhangbao'),
      line('zhangjiao',"二弟守左边，三弟随我断后。等乡亲们过了路口便撤，不许追远。",'zhangjiao','zhangjiao'),
      line('hero',"又来了这么多……咱们还走得了吗？",'zhangjiao'),
      line('zhangjiao',"走得了。你靠着树，别乱跑，乡亲们还在后头。",'zhangjiao'),

    ]},
    camp:{scene:'camp',title:'序章 · 黄天之下',next:'dream',lines:[
      line('narrator',"回到山脚，天已经黑透。张宝替你敷了药，把热粥塞到手里。胸口还疼，你捧着碗不敢大口喝，只借着火光打量这座营地。",'zhangjiao'),
      line('zhangliang',"这几袋抬去伙房！那头还有几家没领着。小娃娃的碗也别落下。",'zhangliang'),
      line('hero',"你们自己不留一点？外头还来了好多人。",'zhangjiao'),
      line('zhangjiao',"仓里够吃。那几家赶了两天路，总不能叫他们闻着粥香挨饿。",'zhangjiao'),
      line('hero',"还没谢过你们。我叫{name}。恩人的名字，总得让我知道吧？",'zhangjiao'),
      line('zhangjiao',"张角。这是二弟张宝，那边搬粮的是三弟张梁。",'zhangjiao'),
      line('hero',"张角……太平道的那个张角？",'zhangjiao'),
      line('zhangjiao',"正是。你听说过我？",'zhangjiao'),
      line('zhangbao',"大哥，探信的人回来了。洛阳又来征粮，还点名各村出丁，说董卓要修府邸。",'zhangbao'),
      line('zhangjiao',"又征？秋粮才收走，连种子都快没了。等营里这些人安顿下来，我得再去联络各路义军。",'zhangjiao'),
      line('hero',"董卓？他现在已经在朝廷了？",'zhangjiao'),
      line('zhangjiao',"皇帝在宫里，诏令却由他出。名目换来换去，最后征来的粮、人，都送进了他手里。",'zhangjiao'),
      line('hero',"（不对，董卓掌权那会儿，张角不是已经死了吗？）",'zhangjiao'),
      line('zhangliang',"魏、蜀、吴，哪家不比俺们粮多兵多？偏偏一说讨董，就都没了回音。俺们的人白跑了好几趟。",'zhangliang'),
      line('hero',"魏蜀吴？曹操、刘备，还有孙家？都立国了？",'zhangjiao'),
      line('zhangbao',"立了有些年了。许昌、成都、建业，你总听过吧？袁家兄弟也占着好些城。你从哪儿来的，连这个也没听说？",'zhangbao'),
      line('hero',"很远。那边……消息不太通。",'zhangjiao'),
      line('narrator',"张宝看了看你的衣服，没有追问。你低头搅着碗里的粥：张角、董卓、魏蜀吴，这些名字怎么也凑不到同一年里。",'zhangjiao'),
      line('hero',"就算讨了董卓，往后呢？换谁来管？粮还征不征？",'zhangjiao'),
      line('zhangjiao',"该收的粮要收，可不能连人活命的都拿走。乡亲们跟着我逃出来，总得给他们找条活路。",'zhangjiao'),
      line('zhangjiao',"我想让他们有田种，有饭吃，病了有药。老了做不动活，也不至于被赶出家门。种一辈子地，不能到头来连葬身的地方都没有。",'zhangjiao'),
      line('hero',"耕者有其田，老有所养……你想的是大同？",'zhangjiao'),
      line('zhangjiao',"若真能如此，便好了。可如今有人只因生在穷人家，就得世世代代给人做牛马。这是什么道理？",'zhangjiao'),
      line('hero',"（这真是张角？我不光是穿越了，连穿到哪段历史都说不清。）",'zhangjiao'),
      line('zhangjiao',"粥要凉了，先喝吧。帐篷给你留着，夜里冷，缺被褥便来叫人。有话明日再说。",'zhangjiao')
    ]},
    dream:{scene:'dream',title:'序章 · 一枕异梦',next:'dawn',lines:[
      line('narrator',"你合上眼，火光还在眼皮后晃。忽然有人在耳边吵起来。你翻了个身，手却摸了个空——铺盖、营帐都不见了，脚下是雾，雾里站着三个人。",null),
      line('zuoci',"南华，你倒说句话！说好了借这些人的本事平乱，结果死人活了，活人也乱了，各家抢得比从前还凶！",'zuoci'),
      line('nanhua',"我原想让他们早些相识，少些误会，或许能免去几场大战……谁知这一施法，竟到了这般田地。",'nanhua'),
      line('zuoci',"你把人拉来，人就肯照你的意思做？如今连年月都对不上了，你还打算怎么办？",'zuoci'),
      line('yuji',"行了，人醒了。有什么话，让他也听明白。",'yuji'),
      line('hero','这是哪儿？我刚才不是在营里睡觉吗？','nanhua'),
      line('yuji',"你的身子还睡在帐中，这是梦。贫道于吉，那位爱吵的是左元放，旁边这位便是南华。",'yuji'),
      line('nanhua',"白日受惊了。原不该让你落在官兵手里。",'nanhua'),
      line('hero',"你们连这个都知道？等会儿，我怎么来的，你们也知道？",'nanhua'),
      line('nanhua',"是我们带你来的。此地有许多能平乱的人，却还散在乡野。我们想请一个知晓三国往事的后世人，替我们找到他们。",'nanhua'),
      line('hero',"我就是看过几本书，打过几款游戏。这种事找我？你们是不是找错人了？",'nanhua'),
      line('zuoci',"赵子龙、许仲康、甘兴霸，这些人，你总认得吧？你知道他们有什么本领，我们却得一个个从头打听。这便是找你的缘故。",'zuoci'),
      line('hero','就算要我帮忙，也该先问问我吧？我家里人还在等我回去！','nanhua'),
      line('nanhua',"是我冒失，未曾问过你，便将你带来。你家中的事，我们会设法照看。有什么疑问，你问吧。",'nanhua'),
      line('yuji',"你今日听到的怪事，也是这场法术所致。原本相隔数十年的人，如今同处一世，前后因果都乱了。",'yuji'),
      line('hero',"所以张角活着，董卓掌权，连魏蜀吴都已经有了……不是我记错了？",'yuji'),
      line('yuji',"没记错。本地人却不觉得奇怪，他们记得的从来就是这个天下。你拿史书去问，他们反倒会疑心你。",'yuji'),
      line('zuoci',"他还想再施一回法术！幸亏叫我们拦住了。这回若再弄出岔子，可就真没法收拾了。",'zuoci'),
      line('hero',"然后就轮到我收拾？你们也看见了，我连个小兵都打不过。",'nanhua'),
      line('nanhua',"寻人不只凭武艺。谁值得相交，谁尚困在乡里，你有些底细。先帮他们渡过眼前的难处，往后才好请他们出力。",'nanhua'),
      line('yuji',"魏、蜀、吴都缺人。你替三家奔走，凑齐人手，我们再请他们会盟，出兵讨董。",'yuji'),
      line('hero','这么说，有些原本该跟着曹操、刘备的人，现在还没去？','yuji'),
      line('zuoci',"有些还没去。许仲康在谯县守粮，甘兴霸还在江上。去处变了，本事没变，你打听起来也有个凭据。",'zuoci'),
      line('nanhua',"赵子龙就在常山，离营地不远。他正照看一批流民，你可从他那里走起。",'nanhua'),
      line('hero',"找到以后怎么说？总不能上来就劝人搬家，人家又不认识我。",'nanhua'),
      line('yuji',"不必急着劝。见见他，问问乡里的事。若有可相助之处，便出一份力，交情自然慢慢有了。",'yuji'),
      line('hero',"那三家的府门呢？我说神仙托梦让我来的，门房真能放我进去？",'nanhua'),
      line('zuoci',"这倒好办。你稍候，我把人请来，当面说。",'zuoci'),
      line('narrator',"左慈振了振衣袖。雾里现出三道人影，一人握着未搁下的笔，一人外衣披到一半。他们望向彼此，脸上都有惊色。",null),
      line('simayi',"孔明？公瑾？这是什么地方？",'simayi'),
      line('zhouyu',"方才还在府中……三位仙长，是你们召我等来的？",'zhouyu'),
      line('nanhua',"请三位来，正为此人。他叫{name}，自后世而来。为解此间战乱，我们想借他的见闻，也想请三位助他一臂之力。",'nanhua'),
      line('zhugeliang',"后世？难道我等的行事，在后世已有记载？",'zhugeliang'),
      line('hero',"有是有，可这儿跟书里差得太多，我也不敢照着书说。",'zhugeliang'),
      line('yuji',"董卓据着朝廷，各方又各自为战。我们请他走访乡野，寻些可用之人。他若到了府上，还请三位多加照拂。",'yuji'),
      line('simayi',"原来如此。董卓不除，许昌也难安宁。你来许昌时，报我姓名便是。若真能联络各家共讨董卓，我自当出力。",'simayi'),
      line('zhugeliang',"成都亦缺贤士。你寻到愿意出山的人，可来找我。沿路所需的钱粮、落脚的住处，府里会替你安排。",'zhugeliang'),
      line('zhouyu',"建业这边，我会交代门吏。三家若能一同出兵，远胜各自相持。你到了江东，便来府上寻我。",'zhouyu'),
      line('hero',"那就说定了。我先去常山，之后到三位府上拜访。",'simayi'),
      line('zuoci',"这下认得了？可别等他敲门，又当作骗子赶出去！讨董的事，待人手齐了再议。",'zuoci'),
      {...line('nanhua',"此行的凶险，我不能瞒你。事情办妥，我会送你回家，让你与亲人重聚。这是我应你的。",'nanhua'),choices:[{id:'gold',label:'那可不够，还要十万两黄金'},{id:'stay',label:'我不想回去'}]}
    ]},
    dawn:{scene:'camp',title:'序章 · 天明',next:'departure',lines:[
      line('narrator',"帐外传来碗勺相碰的响声。你醒过来，胸口仍有些疼。摸了摸身下的铺盖，再掐一把胳膊，梦中那些话却记得分毫不差。",'zhangjiao'),
      line('hero',"张先生，有多余的衣裳吗？穿这身出去，谁都得多看我两眼，昨天还蹭破了。",'zhangjiao'),
      line('zhangjiao',"有，昨夜找的，就在帐边。你试试，若不合身，我叫人替你改。",'zhangjiao'),
      line('narrator','你换好衣服，把原来的那身仔细叠好，收进了行囊。','zhangjiao'),
      line('zhangjiao',"倒像是给你做的。来，伙房还有粥，趁热吃。",'zhangjiao'),
      line('hero',"我还真有件事想说。我打算去常山找个人，听说他在帮着安置乡亲。",'zhangjiao'),
      line('zhangjiao',"常山？路不远。你认得那人？",'zhangjiao'),
      line('hero',"没见过，听过他的名字。我去问问。",'zhangjiao'),
      line('zhangjiao',"也好。只是我们兄弟还走不开，这一营老小总得有人管。",'zhangjiao'),
      line('hero',"不用送，我认着路走。已经在这儿白吃白住，还得过你们一回救命的恩。",'zhangjiao'),
      line('zhangjiao',"哪里的话。昨日素不相识的老人，你也肯伸手去扶。你要出去，我便替你备些行装。",'zhangjiao'),
      line('zhangjiao',"钱带上，路上吃住都得用。帐里还有些兵器，挑件趁手的。若真遇到乱兵，总要能挡一挡。",'zhangjiao'),
      line('hero',"好，这钱我记着。到了常山，探到消息就回来告诉你。",'zhangjiao'),
      line('zhangjiao',"用不着记账。路走不通就回来，帐篷不拆，你住的地方还给你留着。",'zhangjiao'),
      line('zhangliang',"兵器不会使，就来教场找俺！输几回不丢人，俺当初也没少摔跟头。可别到外头挨了打，才想起来没练过。",'zhangliang'),
      line('narrator',"你收起钱，把旧衣服叠进行囊。昨日下山时，你还在盘算停车场那家店是否关门，如今却得去挑一件能护身的兵器。",'zhangjiao')
    ]}
  };
  const stages=['arrival','first-fight','aftermath','manual-fight','reinforcements','prepare','squad-fight','camp','dream','dawn','departure','world','complete'];
  const dreamEnding=line('narrator','营帐外有人开始叫大家吃早饭。你还想再问，众人的身影却慢慢消失在雾里。等你睁开眼，看到的已经是帐篷的布顶。',null);
  const dreamBranches={
    gold:[
      line('hero',"送我回去，本来就是你们该做的。我这可是拿命替你们跑腿。事成以后，再给十万两黄金，行不行？",'nanhua'),
      line('zuoci','你这价钱开得可不低。南华，这笔账可得算在你头上。','zuoci'),
      line('nanhua',"好，十万两。我把你带来，这份酬谢也该我出。回家的事同样作数，你不必担心我借钱留人。",'nanhua'),
      line('hero',"三位都听见了啊。那我先去常山找子龙。后头的事，得看我能不能活着走到再说。",'nanhua'),
      line('yuji',"我们记下了。还有一句：书里的故人，你未必认得今日的他。相见时，多听听他自己怎么说。",'yuji'),dreamEnding
    ],
    stay:[
      line('hero',"我……不想回去了。以前看他们的故事，总想，要是那会儿有人多说一句，或许就不一样。现在人就在这儿，我想试试。",'nanhua'),
      line('hero',"何况这里早就乱了年月，谁也不知道下一步会怎样。真能拦下一场仗，或多救几个人，我倒宁愿把日子过在这里。",'nanhua'),
      line('nanhua',"你有此心，自是好事。只是莫把史书当作人心。我先前自以为算尽了，到头来，偏偏漏算了人。",'nanhua'),
      line('hero',"我也没那么大把握。可人都来了，连试都不试就走，以后想起来，恐怕还是放不下。",'nanhua'),
      line('yuji',"那便留下。将来思乡，想回去了，再来寻我们。这句话，你也记着。",'yuji'),
      line('zuoci',"还有，南华！往后再施法，先问一问人家愿不愿意。",'zuoci'),
      line('nanhua',"……记着了。往后的路，你自己选。",'nanhua'),dreamEnding
    ]
  };
  function linesFor(stage,progress={}){const lines=chapters[stage]?.lines;return stage==='dream'&&dreamBranches[progress.dreamChoice]?[...lines,...dreamBranches[progress.dreamChoice]]:lines;}
  function checkpoint(value={}){value=value&&typeof value==='object'?value:{};let stage=stages.includes(value.stage)?value.stage:'arrival',index=Math.floor(Number(value.index)||0);if(stage==='complete'||(stage==='camp'&&value.storyVersion!==2)){stage='camp';index=0;}const dreamChoice=Object.hasOwn(dreamBranches,value.dreamChoice)?value.dreamChoice:null,lines=linesFor(stage,{dreamChoice});return {storyVersion:2,history:Journal.normalize(value.history),stage,index:lines?Math.max(0,Math.min(lines.length-1,index)):0,dreamChoice,preparation:clone(value.preparation&&typeof value.preparation==='object'?value.preparation:{}),...(value.world&&typeof value.world==='object'?{world:clone(value.world)}:{})};}
  function chooseDream(progress,id){if(progress.stage!=='dream'||progress.index!==chapters.dream.lines.length-1||!Object.hasOwn(dreamBranches,id)||progress.dreamChoice)return null;return checkpoint({...progress,dreamChoice:id,index:progress.index+1});}
  function assets(id,appearance,modern=false){
    if(typeof module!=='undefined'&&module.exports&&!root.CharacterAssets)require('./character-assets.js');
    if(id==='hero'&&modern&&root.CharacterAssets?.manifest.characters['modern-male'])return root.CharacterAssets.resolve(['swordswoman','healer','silverguard'].includes(appearance)?'modern-female':'modern-male');
    if(id==='hero'){const a=root.PengpaiAssets?.protagonists[appearance];return a?{fullbody:{src:a.src,...(a.crop?{crop:a.crop}:{})},portrait:{src:a.src,crop:a.portrait}}:{};}
    return root.CharacterAssets?.manifest.characters[id]?root.CharacterAssets.resolve(id):{};
  }
  const W=typeof module!=='undefined'&&module.exports?require('./weapon-skills.js'):root.WeaponSkills;
  const skills=W.skills,G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  function hero(character){return {id:'hero',name:character.name,...G.characterAt(character),...assets('hero',character.appearance,true),weapon:null,attack:1,armor:0,resistance:0,healthOverride:1,maxSoldiers:1,startSoldiers:1,skills:['punch'],priorities:[{skill:'punch',when:'always'}]};}
  function general(id,level=10){
    const data={
      zhangjiao:{name:'张角',attack:8,armor:8,resistance:8,weapon:{type:'staff',name:'木杖'},skills:W.forWeapon({type:'staff'}),passives:['thunder-lord'],priorities:W.prioritiesFor(W.forWeapon({type:'staff'}))},
      zhangbao:{name:'张宝',attack:8,armor:8,resistance:10,weapon:{type:'scripture',name:'太平经'},skills:W.forWeapon({type:'scripture'}),priorities:[{skill:'scripture-2',when:'healThresholds',selfThreshold:.85,allyThreshold:.85},{skill:'scripture-3',when:'enemyCount',threshold:2,disabled:true}]},
      zhangliang:{name:'张梁',passives:['zhangliang-might','zhangliang-hardy'],attack:8,armor:12,resistance:6,weapon:{type:'spear',name:'铁枪'},skills:W.forWeapon({type:'spear'}),priorities:W.prioritiesFor(W.forWeapon({type:'spear'}))}
    };
    const u={id,unitType:'general',campLevelVersion:2,weaponPlanVersion:3,...G.create(id,level),...clone(data[id]),...assets(id)};u.equipment={armor:(typeof module!=='undefined'&&module.exports?require('./items.js'):root.ItemCatalog).armorRecord({name:id==='zhangliang'?'铁甲':'道袍'},id+'-initial-armor'),accessory1:null,accessory2:null};return (typeof module!=='undefined'&&module.exports?require('./passives.js'):root.BattlePassives).complete(u);
  }
  function soldier(i,level=8){
    const profiles=['imperialSoldier','imperialPikeman','imperialGuard','imperialSkirmisher'],growth=G.create(profiles[Math.max(0,i-1)%profiles.length],level),groups=[2,4,3,4];
    return {id:'soldier-'+i,name:'官兵',...assets('imperial-soldier'),...growth,weapon:{type:'spear',name:'长枪'},equipment:{armor:{name:'旧铁甲'}},attack:6,armor:5,resistance:5,skills:['spear-cut'],priorities:[{skill:'spear-cut',when:'always'}]};
  }
  function createBattle(stage,character,preparation={}){
    const basic={id:stage,title:'村道交锋',control:{retreatDisabled:true},scene:{background:'./assets/story/village-road-v3.webp'},skills:clone(skills),rules:{difficulty:character.difficulty,level:1,enemyLevel:1,allySp:0,random:false,critical:false,hit:false,seed:'prologue-'+stage}};
    if(stage==='first-fight')return {...basic,title:'陌路冲突',allies:[{...hero(character),initialMode:'manual'}],enemies:[{...soldier(1),initialProgress:.5}],rules:{...basic.rules,random:false,critical:false,hit:false}};
    if(stage==='manual-fight'){const j=general('zhangjiao');j.passives=['thunder-lord-tutorial'];return {...basic,title:'一杖退敌',hint:'点击技能，再选择敌人',control:{...basic.control,manualOnly:true,lockTactics:true},allies:[j],enemies:[soldier(1)]};}
    if(!['prepare','squad-fight'].includes(stage))throw new TypeError('未知序章战斗');
    const allies=['zhangjiao','zhangbao','zhangliang'].map(id=>{const u=general(id),saved=preparation[id];if(id==='zhangjiao')u.passives=['thunder-lord-tutorial'];if(saved){if(['manual','auto'].includes(saved.mode))u.initialMode=saved.mode;if(Array.isArray(saved.rules))u.priorities=saved.rules.filter(r=>u.skills.includes(r.skill));u.targetRule=saved.targetRule;}return u;});
    const captain={...soldier(1),...G.create('imperialCaptain',8),id:'captain',name:'官兵队长',armor:10,resistance:5,...assets('imperial-captain'),weapon:{type:'spear',name:'铁枪'},equipment:{armor:{name:'加固铁甲'},accessory1:null,accessory2:null},skills:['shield-taunt','spear-cut'],priorities:[{skill:'shield-taunt',when:'always'},{skill:'spear-cut',when:'always'}],weaponPlanVersion:3};
    return {...basic,title:'黄巾并肩',preparationHint:'点击人物头像，可配置技能释放设置',scene:{...basic.scene,enemyFormation:{back:[1,2,3,4],front:[0]}},allies,enemies:[captain,...Array.from({length:4},(_,i)=>soldier(i+1))]};
  }
  function preparationOf(battle){return Object.fromEntries(battle.units.filter(u=>u.side==='ally').map(u=>[u.id,{mode:u.mode,rules:clone(u.priorities),targetRule:u.targetRule}]));}
  const api={chapters,stages,checkpoint,linesFor,chooseDream,dreamBranches,createBattle,preparationOf,assets,general};root.PengpaiPrologue=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
