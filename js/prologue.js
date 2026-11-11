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
      line('narrator','你又听见了争吵声。起初以为是营外的人，想翻身避一避，手却摸了个空。睁眼时，铺盖与火光都不见了，脚下浮着雾，几步外站着三个人。',null),
      line('zuoci','南华，你当初可不是这么说的！把英雄聚到一世，便能少些战乱？如今董卓还在，三国倒先立起来了！','zuoci'),
      line('nanhua','我原想让他们早些相识，免去几场争斗。谁知前后年月一乱，连各人的际遇也跟着变了……','nanhua'),
      line('zuoci','人家各有打算，哪肯照着你的意思走？如今闹成这样，你还想再试一回不成？','zuoci'),
      line('yuji','左慈，先别说了。他醒了。','yuji'),
      line('hero','……这是哪儿？我不是在张先生的营里睡觉吗？','yuji'),
      line('yuji','你仍睡在营中，只是入了梦。贫道于吉，这位是左慈，另一位便是南华。','yuji'),
      line('nanhua','白日让你受惊了。原想等你安顿下来再见，没料到先叫你碰上了官兵。','nanhua'),
      line('hero','你连我挨打都知道？那我怎么来的，你也知道？','nanhua'),
      line('nanhua','知道。是我们将你带来的。我们想请一位知晓三国往事的后世人，替此间寻些能平乱的人才。','nanhua'),
      line('hero','我也就是看过些书、玩过几款游戏。你们要平天下，怎么会找到我头上？','nanhua'),
      line('zuoci','赵子龙、许仲康、甘兴霸，这些人的名字，你总听过。他们尚未显名时，旁人未必知道有什么本领，你却有些底细。我们想借的，便是这份见闻。','zuoci'),
      line('hero','可也该先问我一声吧！我家里人还在等我回去。','nanhua'),
      line('nanhua','此事是我欠考虑，未问过你，便将你带来。你家中的牵挂，我记着，不会让你就此回不去。','nanhua'),
      line('yuji','你今日听到的怪事，也因这场法术而起。原本相隔数十年的人，如今同处一世，许多事早已改了。','yuji'),
      line('hero','所以张角还活着，董卓把持朝廷，曹操、刘备他们却已经立国……不是我记错了？','yuji'),
      line('yuji','没有记错。只是此地的人不知另有一段旧史，在他们看来，天下从来便是如此。','yuji'),
      line('zuoci','再施法去改，谁知又要弄乱什么。我们已经拦住他了，这回得在人间想办法。','zuoci'),
      line('hero','那我到底该怎么办？今天连个官兵都打不过，难道靠背几段史书，就能叫董卓交兵？','nanhua'),
      line('nanhua','不必叫你独自讨董。乡野间有许多可用之人，或困于生计，或家中有难，还未遇到出头的机会。你若寻到，便替他们寻个能施展本领的去处。','nanhua'),
      line('hero','是让我去找人，再引荐给魏、蜀、吴？','yuji'),
      line('yuji','三家都有缺人之处。将士、钱粮备得齐些，才有余力商议会盟。你不必一日便做成，从近处走起便是。','yuji'),
      line('zuoci','譬如许仲康，还在谯县替村里守粮；甘兴霸也尚未离开江上。去处虽变了，本领还在，你寻起来总有些凭据。','zuoci'),
      line('hero','可人真找到了，住哪儿，路费从哪儿来？三家肯不肯收，也不是我说了算。我连他们的府门都未必进得去。','nanhua'),
      line('nanhua','你说得是。只叫你去寻人，没有引荐与接应，确实难行。','nanhua'),
      line('yuji','这倒不难。请三家能主事的人来见一面，先替他通了门路。','yuji'),
      line('zuoci','仲达、孔明、公瑾，此刻都在各自府中。我请他们入梦，咱们当面说。','zuoci'),
      line('narrator','左慈将袖口一拂。雾里渐渐透出几处灯火，仿佛远处的窗。有人从案前抬头，有人侧身望向门外；待那些影子清晰起来，三人已站在你面前。',null),
      line('zhouyu','方才还在府中，怎么……三位仙长，这是何处？','zhouyu'),
      line('simayi','孔明、公瑾？二位也在这里？','simayi'),
      line('nanhua','诸葛丞相、周都督、司马先生，深夜相扰，是有一事相托。这位名叫{name}，由我们从后世请来。','nanhua'),
      line('hero','（诸葛亮、周瑜，还有司马懿……一下全来了？）','simayi'),
      line('zhugeliang','后世之人？仙长此言，是说我等所处的年月，于他已是往事？','zhugeliang'),
      line('hero','在我读过的书里是这样。可这里的事跟书里对不上，我也不敢把知道的都当真。','zhugeliang'),
      line('simayi','这般来历，实在叫人难以遽信。三位为何将他带来？','simayi'),
      line('yuji','此间年月错乱，是我们施法失当。他知道一些将臣的旧事，我们想请他走访乡野，寻得人才，引荐各方，日后再共议讨董。','yuji'),
      line('hero','寻人我可以试。可我既没功名，也没有文书，带着人到了城门口，总得有位肯见我的。','zhugeliang'),
      line('zhugeliang','此事不难。你来成都，报亮的姓名即可。远来的将士与家眷，府中可安排住处；路费、通行文书，也可来与我商议。','zhugeliang'),
      line('zhouyu','江东也正需人。到了建业便来见我，我会知会门吏。水路往来或粮船接应有难处，你递信来，我遣人查办。','zhouyu'),
      line('simayi','许昌这边，你来寻我。至于你所知的人与事，容我逐件核实。若确有可用之才，我会向曹公引荐，不叫你白跑。','simayi'),
      line('zhouyu','只是寻人与接应，我等尚可分担；三家合兵，却还须各自主公点头，不能在此轻诺。','zhouyu'),
      line('simayi','董卓据着朝廷，各地粮道也受其扰，谁都难以置身事外。先互通消息吧，待兵粮齐备，再各自上书商议。','simayi'),
      line('zhugeliang','亮亦有此意。你奔走在外，我们在三府接应，途中若有急难，也可送信来府中求援。','zhugeliang'),
      line('hero','那就有着落了。只是这天下这么大，我先去找谁？','nanhua'),
      line('nanhua','赵子龙就在常山，离你住的营地不远。他正照看一批逃难的百姓，可先去见他。','nanhua'),
      line('hero','我知道他的名字，他可不认识我。总不能一见面，就问愿不愿意换个地方做事吧？','zhugeliang'),
      line('zhugeliang','先叙话，问问他与乡亲有什么难处。能帮的便帮一把，结识之后再谈去留。人肯不肯来，总得由他自己定。','zhugeliang'),
      line('hero','好，我先去常山。等有了消息，再到许昌、成都、建业拜访三位。','simayi'),
      line('zuoci','这便说定。三位今日认过人，往后可别叫他隔着府门，喊破了嗓子也没人应。','zuoci'),
      {...line('nanhua','还有一事，你安心。此行既是我们所托，事情办妥，我会送你回家，让你与亲人重聚。','nanhua'),choices:[{id:'gold',label:'那可不够，还要十万两黄金'},{id:'stay',label:'我不想回去'}]}
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
      line('zuoci','十万两？这算什么！南华会点石成金，你想要多少，让他点多少便是。','zuoci'),
      line('hero','……还是我格局小了。那我现在改口，还来得及吗？','nanhua'),
      line('nanhua','你还想要多少？','nanhua'),
      line('hero','也不多，就白天下山时，那一座山。','nanhua'),
      line('yuji','才来一天，便要买山置业了？山上可还住着人呢。','yuji'),
      line('nanhua','屋子、田地都点成金子，人家还过不过日子了？十万两黄金，事成给你；送你回家的事，也一样作数。','nanhua'),
      line('hero','好好好，十万两就十万两。不过回去的时候，还得劳烦搭把手。我那边托运行李，可是要称重的。','nanhua'),
      line('zuoci','十万两黄金都拿了，还舍不得出点脚钱！','zuoci'),
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
