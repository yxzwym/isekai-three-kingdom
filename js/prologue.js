(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const Journal=typeof module!=='undefined'&&module.exports?require('./conversation-journal.js'):root.ConversationJournal;
  const speakerSides={hero:'right',nanhua:'right',zuoci:'left',yuji:'left',zhangjiao:'left',zhangbao:'right',zhangliang:'left'};
  const line=(speaker,text,partner,figure)=>({speaker,text,partner,figure,side:speakerSides[speaker]||'left'});
  const chapters={
    arrival:{scene:'village',title:'序章 · 陌路',next:'first-fight',lines:[
      line('narrator','你在景区逛了一下午，下山时天已经快黑了。刚才还能看见山下的停车场，转过一道弯，雾就把前面的石阶遮住了。',null),
      line('narrator','你扶着石墙往下走，听见前面有人赶着车说话，就顺着声音找过去。走了没多远，脚下忽然一滑，原本的石阶已经变成了一条泥路。',null),
      line('hero','我不是沿着台阶下来的吗？这村子又是从哪儿冒出来的？',null),
      line('narrator','路边有几间茅屋，几个穿甲的人正往车上搬粮袋。你回头找来时的路，身后却只剩下庄稼地，连那堵石墙也看不见了。',null),
      line('imperial-soldier','叫你松手，没听见？这是军中征粮，再拦着连你一起带走！','imperial-soldier'),
      line('narrator','一个老人被推得踉跄几步，险些撞到你身上。你赶紧扶住他，还没问清楚怎么回事，那官兵已经朝你走过来了。','imperial-soldier'),
      line('hero','老人家，你没事吧？我想问一下，这是什么地方？','imperial-soldier'),
      line('imperial-soldier','你干什么的？是不是他家里人，跑来替他撑腰？','imperial-soldier'),
      line('hero','我不认识他，就是看他快摔了，扶了一下。你们是不是认错人了？','imperial-soldier'),
      line('imperial-soldier','少跟我装糊涂！站在这儿东张西望半天了，我看你就是来找事的。把他拿下！','imperial-soldier'),
      line('hero','等一下！别动手——','imperial-soldier')
    ]},
    aftermath:{scene:'village',title:'序章 · 援手',next:'manual-fight',lines:[
      line('narrator','你被打翻在地，半天没缓过气来。刚撑着胳膊想爬起来，那官兵又一脚踩住了你的衣服。','imperial-soldier'),
      line('hero','我都说了只是路过……你们讲不讲道理？','imperial-soldier'),
      line('imperial-soldier','把这个也带走。','imperial-soldier'),
      line('zhangjiao','放开他。','zhangjiao'),
      line('narrator','一只手拦住了官兵。来人俯下身，把你扶到路边。','zhangjiao'),
      line('zhangjiao','伤到哪儿了？先别急着起来，试试能不能好好喘气。','zhangjiao'),
      line('hero','胸口疼，刚才那一下差点没喘上来。你小心点，他们真动手的。','zhangjiao'),
      line('zhangjiao','我刚才看见了，你也没有伤到他，只是扶了一下老人。自己都应付不了官兵，还肯过去帮忙，我不想看着你因为这个被带走。','zhangjiao'),
      line('hero','这不就是顺手的事吗？我也没想到，扶个人就能挨一顿打。','zhangjiao'),
      line('imperial-soldier','你们两个说够了没有？再不滚开，我连你一起收拾！','imperial-soldier'),
      line('zhangjiao','你靠着树歇一会儿，他交给我。','zhangjiao'),

    ]},
    reinforcements:{scene:'village',title:'序章 · 并肩',next:'prepare',lines:[
      line('imperial-soldier','这人会妖术！都过来，别让他跑了！','imperial-soldier','imperial-soldier'),
      line('narrator','听见喊声，又有几名官兵从路口赶来。张角刚把你扶到树下，村道两头就都被堵住了。','zhangjiao','zhangjiao'),
      line('zhangliang','大哥，怎么跟他们打起来了？我在那边就听见有人喊。','zhangliang','zhangliang'),
      line('zhangbao','乡亲们已经从后面走了，不过有几个老人走得慢，还得替他们挡一阵。','zhangbao','zhangbao'),
      line('zhangjiao','你们来得正好，帮我挡住这边。等乡亲们走远，我们就跟着退，不用追上去，先把大家平安带回营里。','zhangjiao','zhangjiao'),
      line('hero','他们还有这么多人，要不你们也先走？','zhangjiao'),
      line('zhangjiao','现在退了，他们就追上乡亲们了。你在树后躲好，我们能应付。','zhangjiao'),

    ]},
    camp:{scene:'camp',title:'序章 · 黄天之下',next:'dream',lines:[
      line('narrator','天黑时，你跟着他们回到了山脚的营地。张宝替你看过伤，又端来一碗粥。你捧着碗坐在火边，总算有空看看四周。','zhangjiao'),
      line('zhangliang','这几袋也送去伙房吧，那边还有几家没领到。孩子多的，多给他们盛一点。','zhangliang'),
      line('hero','你们救下来的粮，就这么分了？营里这些人够吃吗？','zhangjiao'),
      line('zhangjiao','暂时还够。新来的几家已经饿了两天，总不能让他们在锅边看着，等我们的兵吃完再说。','zhangjiao'),
      line('hero','今天多亏你们了。我叫{name}，还不知道该怎么称呼你。','zhangjiao'),
      line('zhangjiao','我叫张角。替你看伤的是我二弟张宝，刚才搬粮的那个是三弟张梁。','zhangjiao'),
      line('hero','张角？你是说……太平道的张角？','zhangjiao'),
      line('zhangjiao','是我。怎么，你从前听过我的名字？','zhangjiao'),
      line('zhangbao','大哥，去打听消息的人回来了。洛阳又下令征粮，还要各村派人做工，说是给董卓修新的住处。','zhangbao'),
      line('zhangjiao','乡亲们已经交不起粮了。我想等营里安排好，就去跟其他义军谈谈，一起对付董卓，不能再让他这样逼大家。','zhangjiao'),
      line('hero','你刚说董卓？他现在已经控制朝廷了？','zhangjiao'),
      line('zhangjiao','是，他把皇帝留在宫里，外面的事却全由自己决定。这些征粮、征工的命令，名义上是朝廷发的，最后都在给他办事。','zhangjiao'),
      line('hero','（董卓掌权的时候，张角不是早就死了吗？怎么还在这里张罗着讨伐他？）','zhangjiao'),
      line('zhangliang','魏、蜀、吴的粮和兵都比我们多，可我们派人跑了好几趟，他们就是不肯一起商量出兵的事。','zhangliang'),
      line('hero','等等，你说的魏、蜀、吴，是曹操、刘备和孙家？他们都已经立国了？','zhangjiao'),
      line('zhangbao','早就建立了啊。曹操在许昌，刘备在成都，孙家在建业。袁绍、袁术也各自占着一些城池，你一路过来，没有听人说过这些吗？','zhangbao'),
      line('hero','我……不是从这边来的，对这里的事确实不太清楚。','zhangjiao'),
      line('narrator','张宝见你脸色不好，没有再问。你低头喝了口粥，想把记得的事理一理，却发现这些人和这些事根本排不到一起。','zhangjiao'),
      line('hero','那你们把董卓赶下去以后呢？谁来管这些城和百姓？','zhangjiao'),
      line('zhangjiao','我也一直在想。不能换个人来管，就还是照样抢粮、抢田，那些跟着我们逃出来的乡亲，再回去也过不上好日子。','zhangjiao'),
      line('zhangjiao','我盼着将来种田的人能留下自己的粮食，老了病了也有人照顾。乡绅贵族不能想欺负谁就欺负谁，更不能因为生在哪一家，就注定一辈子受人使唤。','zhangjiao'),
      line('hero','你说的这种日子……有点像书里讲的大同社会。','zhangjiao'),
      line('zhangjiao','跟着我们的人，大多只是想有块地能种，家里人不用再挨饿。我觉得这些事情本来就该做到，不应该非得有身份、有钱才轮得到。','zhangjiao'),
      line('hero','（眼前这个人真是张角？我大概是穿越了，可这跟我记得的三国也差太远了。）','zhangjiao'),
      line('zhangjiao','你也累了一天了，今晚就在这里住下吧。有什么想问的，明天再慢慢说。','zhangjiao')
    ]},
    dream:{scene:'dream',title:'序章 · 一枕异梦',next:'dawn',lines:[
      line('narrator','你躺下没多久就睡着了，迷迷糊糊听见有人在争吵。睁开眼，营帐和铺盖都不见了，四周飘着雾，面前站着三个陌生人。',null),
      line('zuoci','南华，你当初怎么说的？把人聚到一起，仗就能早点打完？现在倒好，连本来死了的人也回来了，各家还在抢地盘！','zuoci'),
      line('nanhua','我以为让他们早点见面，早点商量，也许仗就不用打那么久，百姓能少吃一些苦。没想到事情变成了现在这样。','nanhua'),
      line('zuoci','他们都有自己的打算，你把人拉到一起，也不能让他们都听你的。现在打仗的地方更多了，原来的办法又用不了，你准备怎么收拾？','zuoci'),
      line('yuji','好了，别当着他的面吵。人已经来了，让他先问吧。','yuji'),
      line('hero','这是哪儿？我刚才不是在营里睡觉吗？','nanhua'),
      line('yuji','你还在营帐里睡着，不用怕，我们只是通过这个梦跟你谈话。我叫于吉，刚才说话的是左元放，另一位是南华。','yuji'),
      line('nanhua','今天让你受了不少惊吓，还挨了顿打，实在对不住。','nanhua'),
      line('hero','等一下，你们知道我挨打了？那我到这个地方来，也跟你们有关系？','nanhua'),
      line('nanhua','你会来到这里，是我们做的。我们想找一个精通三国历史、从未来来的人，帮忙找到那些还没有出名的将领，最后找到了你。','nanhua'),
      line('hero','我看过些书，也玩过不少三国游戏，可这跟帮你们收拾乱世是两回事吧？','nanhua'),
      line('zuoci','你知道他们后来做过什么，也知道不少人住在哪里。现在有些人还在家里种地，换成我们去找，很难知道谁能帮上忙。','zuoci'),
      line('hero','就算要我帮忙，也该先问问我吧？我家里人还在等我回去！','nanhua'),
      line('nanhua','这件事确实没有先问过你的意思，是我做得不对。你担心什么，可以直接告诉我们，我们会把能解决的事情都说明白。','nanhua'),
      line('yuji','你今天听到那些对不上的事情，都是南华施法以后出了问题。原本隔了几十年才会见到的人，现在一起活在这里，所以很多事情已经跟史书不一样了。','yuji'),
      line('hero','难怪张角还活着，董卓已经控制了朝廷，魏蜀吴也建起来了。我还以为是自己记错了。','yuji'),
      line('yuji','你的记忆没错，是这里发生了变化。住在这个时代的人自己察觉不到，只记得各自一直在这里生活，没有人觉得哪里不对。','yuji'),
      line('zuoci','他原先还想再施一次法术，被我们拦住了。谁也不知道还会出什么乱子，这回只能想别的办法。','zuoci'),
      line('hero','所以你们就来找我？我今天连一个官兵都打不过，你们也看见了。','nanhua'),
      line('nanhua','我们找你，不是因为你现在就能带兵打仗，而是你知道这些人的经历。许多能做事的人还留在乡里，如果有人找到他们，帮他们解决眼前的困难，就能慢慢把人手聚起来。','nanhua'),
      line('yuji','你可以先帮魏、蜀、吴找些愿意做事的人，等他们有了足够的人手，我们再想办法请几家一起商量出兵，对付控制朝廷的董卓。','yuji'),
      line('hero','这么说，有些原本该跟着曹操、刘备的人，现在还没去？','yuji'),
      line('zuoci','对，许仲康还在谯县帮村里守粮，甘兴霸也还在江上活动。这些人暂时没有去你熟悉的那些地方，可他们的本事还在，你比我们更知道该去哪里打听。','zuoci'),
      line('nanhua','先从近的地方试试吧，赵子龙就在常山照顾逃难的百姓。常山离营地不远，你能先在那里熟悉一下情况，不用马上跑遍天下。','nanhua'),
      line('hero','人是能找到，可我跟他们非亲非故的，凭什么劝他们走？','nanhua'),
      line('yuji','先去见一面，问问他们遇到了什么困难。能帮的事情就帮一帮，熟悉以后再谈以后的打算，愿意跟着走的人，也可以先和你同行。','yuji'),
      {...line('nanhua','我们知道这趟有危险，不能让你白白承担。等这里的事情办好，我们会负责送你回去，让你能重新见到家里人，这件事一定会做到。','nanhua'),choices:[{id:'gold',label:'那可不够，还要十万两黄金'},{id:'stay',label:'我不想回去'}]}
    ]},
    dawn:{scene:'camp',title:'序章 · 天明',next:'departure',lines:[
      line('narrator','天已经亮了。你坐起来揉了揉胸口，昨晚挨打的地方还有些疼，那场梦里的话倒是一句也没忘。','zhangjiao'),
      line('hero','张先生，你们这里有多余的衣服吗？我这一身走到哪儿都惹人看，昨天也蹭破了。','zhangjiao'),
      line('zhangjiao','有，昨晚就替你找好了。东西放在帐边，你试试合不合身，不合适再拿来改。','zhangjiao'),
      line('narrator','你换好衣服，把原来的那身仔细叠好，收进了行囊。','zhangjiao'),
      line('zhangjiao','衣服挺合身。伙房还有热粥，吃过了再出来走动，别饿着肚子。','zhangjiao'),
      line('hero','张先生，我正想跟你说一声。我准备去趟常山，听说那里有个人，也许能帮上你们。','zhangjiao'),
      line('zhangjiao','常山离这里倒不远。你在那边有认识的人吗，还是有人给你介绍过那里的情况？','zhangjiao'),
      line('hero','还没见过，只是听过他的事。我想先去找找，总得试一试。','zhangjiao'),
      line('zhangjiao','你已经决定了，就去试试吧。只是我和两个弟弟暂时还走不开，营里的乡亲得有人照看，不能把他们丢在这里。','zhangjiao'),
      line('hero','我一个人去就行。这两天已经给你们添了不少麻烦，不能再耽误你们的事。','zhangjiao'),
      line('zhangjiao','昨天看见老人快摔倒，你自己都没弄清情况，就伸手去扶，我知道你不是个坏人。既然你想出去帮忙，我们也该帮你把上路的东西准备好。','zhangjiao'),
      line('zhangjiao','这些钱你先拿着，吃饭、住店都用得上。营里的兵器也可以挑一件，路上不太平，有东西防身，总比空着手强。','zhangjiao'),
      line('hero','那我就收下了，谢谢。等那边有了消息，我再回来告诉你。','zhangjiao'),
      line('zhangjiao','路上遇到解决不了的事，就先回来，别一个人硬撑。营里一直有你住的地方，回来也不用客气。','zhangjiao'),
      line('zhangliang','有空就回来找俺练练！路上碰上打不过的，回来把情况说说，咱们琢磨琢磨。别嫌输几场丢人，总比在外头受伤强。','zhangliang'),
      line('narrator','你把钱收好，跟张角走向放兵器的帐篷。昨天还在山上游玩，现在却得认真想想，带什么才能在路上保住自己。','zhangjiao')
    ]}
  };
  const stages=['arrival','first-fight','aftermath','manual-fight','reinforcements','prepare','squad-fight','camp','dream','dawn','departure','world','complete'];
  const dreamEnding=line('narrator','营帐外有人开始叫大家吃早饭。你还想再问，三个人的身影却慢慢消失在雾里。等你睁开眼，看到的已经是帐篷的布顶。',null);
  const dreamBranches={
    gold:[
      line('hero','送我回去本来就是你们该做的。我还得替你们跑遍各地，弄不好连命都搭进去。事情办成以后，再给我十万两黄金，怎么样？','nanhua'),
      line('zuoci','你这价钱开得可不低。南华，这笔账可得算在你头上。','zuoci'),
      line('nanhua','是我把你带到这里，不能再让你只替我们冒险。十万两黄金，我答应你，送你回去的事情也一定会办，不会说完就算了。','nanhua'),
      line('hero','那就说好了，你们三个人都听见了。我先到常山找找子龙，至于后面能做到哪一步，还得见了人、弄清情况再说。','nanhua'),
      line('yuji','我们都记着。路上遇到跟历史不一样的事情，先问清楚，别只因为知道他在书里是什么样，就觉得现在也一定一样。','yuji'),dreamEnding
    ],
    stay:[
      line('hero','我不想回去。以前读到这些人的结局，总觉得要是有人早一点提醒他们，事情也许就不会那么糟。现在我就在这里，反而有机会试试。','nanhua'),
      line('hero','这里已经跟原来的历史不同了，我想试着留下来做些事情。要是能少打一场仗，早点提醒一个人，也许后来的百姓就不用再受同样的苦。','nanhua'),
      line('nanhua','你愿意留下，我们不会拦着。只是我得提醒你，知道历史，也不代表知道每个人现在在想什么，我就是没有弄清这一点，才让事情出了差错。','nanhua'),
      line('hero','我明白。我也不能保证自己一定做得对，但既然有机会，总想亲自试一次，而不是回去等着一切照旧发生。','nanhua'),
      line('yuji','那就照着你的打算去做吧。现在想留下，以后又想回去，都可以再跟我们说，我们不会替你决定应该过什么样的生活。','yuji'),
      line('zuoci','也不会再背着你施什么法术。南华，这回你可听清楚了？','zuoci'),
      line('nanhua','我听清楚了。你的去留，我们不会干涉。接下来准备怎么走，也由你自己决定。','nanhua'),dreamEnding
    ]
  };
  function linesFor(stage,progress={}){const lines=chapters[stage]?.lines;return stage==='dream'&&dreamBranches[progress.dreamChoice]?[...lines,...dreamBranches[progress.dreamChoice]]:lines;}
  function checkpoint(value={}){value=value&&typeof value==='object'?value:{};let stage=stages.includes(value.stage)?value.stage:'arrival',index=Math.floor(Number(value.index)||0);if(stage==='complete'||(stage==='camp'&&value.storyVersion!==2)){stage='camp';index=0;}const dreamChoice=Object.hasOwn(dreamBranches,value.dreamChoice)?value.dreamChoice:null,lines=linesFor(stage,{dreamChoice});return {storyVersion:2,history:Journal.normalize(value.history),stage,index:lines?Math.max(0,Math.min(lines.length-1,index)):0,dreamChoice,preparation:clone(value.preparation&&typeof value.preparation==='object'?value.preparation:{}),...(value.world&&typeof value.world==='object'?{world:clone(value.world)}:{})};}
  function chooseDream(progress,id){if(progress.stage!=='dream'||progress.index!==chapters.dream.lines.length-1||!Object.hasOwn(dreamBranches,id)||progress.dreamChoice)return null;return checkpoint({...progress,dreamChoice:id,index:progress.index+1});}
  function assets(id,appearance,modern=false){
    if(typeof module!=='undefined'&&module.exports&&!root.CharacterAssets)require('./character-assets.js');
    if(id==='hero'&&modern&&root.CharacterAssets?.manifest.characters['modern-male'])return root.CharacterAssets.resolve(['swordswoman','healer','armored'].includes(appearance)?'modern-female':'modern-male');
    if(id==='hero'){const a=root.PengpaiAssets?.protagonists[appearance];return a?{fullbody:{src:a.src,...(a.crop?{crop:a.crop}:{})},portrait:{src:a.src,crop:a.portrait}}:{};}
    return root.CharacterAssets?.manifest.characters[id]?root.CharacterAssets.resolve(id):{};
  }
  const W=typeof module!=='undefined'&&module.exports?require('./weapon-skills.js'):root.WeaponSkills;
  const skills=W.skills,G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  function hero(character){return {id:'hero',name:character.name,...G.characterAt(character),...assets('hero',character.appearance,true),weapon:null,attack:1,armor:0,resistance:0,healthOverride:1,maxSoldiers:1,startSoldiers:1,skills:['punch'],priorities:[{skill:'punch',when:'always'}]};}
  function general(id,level=10){
    const data={
      zhangjiao:{name:'张角',attack:8,armor:8,resistance:8,weapon:{type:'staff',id:'fire-god-staff',name:'火神杖',school:'thunder'},skills:['staff-shock','staff-storm'],passives:['thunder-lord'],priorities:[{skill:'staff-storm',when:'enemyCount',threshold:3},{skill:'staff-shock',when:'always',frequency:'sometimes'}]},
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
