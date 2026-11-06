(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const speakerSides={hero:'right',nanhua:'right',zuoci:'left',yuji:'left',zhangjiao:'left',zhangbao:'right',zhangliang:'left'};
  const line=(speaker,text,partner,figure)=>({speaker,text,partner,figure,side:speakerSides[speaker]||'left'});
  const chapters={
    arrival:{scene:'village',title:'序章 · 陌路',next:'first-fight',lines:[
      line('narrator','你在景区逛了一下午，下山时天已经快黑了。刚才还能看见山下的停车场，转过一道弯，雾就把前面的石阶遮住了。',null),
      line('narrator','你扶着石墙往下走，听见前面有人赶着车说话，便循着声音找过去。走了没多远，鞋底忽然一滑，石阶竟变成了一条泥路。',null),
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
      line('zhangjiao','我看见了。你自己都不会武艺，看见老人要摔倒，还是肯伸手扶他。如今敢这么做的人可不多。','zhangjiao'),
      line('hero','这不就是顺手的事吗？我也没想到，扶个人就能挨一顿打。','zhangjiao'),
      line('imperial-soldier','你们两个说够了没有？再不滚开，我连你一起收拾！','imperial-soldier'),
      line('zhangjiao','你靠着树歇一会儿，他交给我。','zhangjiao'),

    ]},
    reinforcements:{scene:'village',title:'序章 · 并肩',next:'prepare',lines:[
      line('imperial-soldier','这人会妖术！都过来，别让他跑了！','imperial-soldier','imperial-soldier'),
      line('narrator','听见喊声，又有几名官兵从路口赶来。张角刚把你扶到树下，村道两头就都被堵住了。','zhangjiao','zhangjiao'),
      line('zhangliang','大哥，怎么跟他们打起来了？我在那边就听见有人喊。','zhangliang','zhangliang'),
      line('zhangbao','乡亲们已经从后面走了，不过有几个老人走得慢，还得替他们挡一阵。','zhangbao','zhangbao'),
      line('zhangjiao','来得正好。你们帮我守住这边，等乡亲们走远了就撤，不必追他们。','zhangjiao','zhangjiao'),
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
      line('zhangbao','大哥，送信的人回来了。洛阳又要征粮，还要各村出人，说是给董卓修府邸。','zhangbao'),
      line('zhangjiao','乡里已经交不出来了。等这边安顿好，我去找几路义军谈谈，总得有人带头讨伐董卓，不能一直由着他。','zhangjiao'),
      line('hero','你刚说董卓？他现在已经控制朝廷了？','zhangjiao'),
      line('zhangjiao','不错。天子还住在宫里，可外头的事都由董卓说了算。这些征发令，最后也都是替他办事。','zhangjiao'),
      line('hero','（董卓掌权的时候，张角不是早就死了吗？怎么还在这里张罗着讨伐他？）','zhangjiao'),
      line('zhangliang','魏、蜀、吴倒是不缺兵粮，可咱们派出去的人跑了好几趟，也没谈出个结果来。','zhangliang'),
      line('hero','等等，你说的魏、蜀、吴，是曹操、刘备和孙家？他们都已经立国了？','zhangjiao'),
      line('zhangbao','是啊，许昌是魏国的，成都归蜀国，建业归吴国。袁绍、袁术那些人也各有城池。你一路过来，没听人提过？','zhangbao'),
      line('hero','我……不是从这边来的，对这里的事确实不太清楚。','zhangjiao'),
      line('narrator','张宝见你脸色不好，没有再问。你低头喝了口粥，想把记得的事理一理，却发现这些人和这些事根本排不到一起。','zhangjiao'),
      line('hero','那你们把董卓赶下去以后呢？谁来管这些城和百姓？','zhangjiao'),
      line('zhangjiao','这也是我一直在想的事。如果后来的人还是照样征粮、照样抢地，乡亲们跟着我们折腾这一场，就白受苦了。','zhangjiao'),
      line('zhangjiao','我盼着将来种田的人能留下自己的粮食，老了病了也有人照顾。乡绅贵族不能想欺负谁就欺负谁，更不能因为生在哪一家，就注定一辈子受人使唤。','zhangjiao'),
      line('hero','你说的这种日子……有点像书里讲的大同社会。','zhangjiao'),
      line('zhangjiao','是这个意思。现在跟着我的这些人，只想有块地种，能把孩子养大，原也不是什么过分的要求。','zhangjiao'),
      line('hero','（眼前这个人真是张角？我大概是穿越了，可这跟我记得的三国也差太远了。）','zhangjiao'),
      line('zhangjiao','你也累了一天了，今晚就在这里住下吧。有什么想问的，明天再慢慢说。','zhangjiao')
    ]},
    dream:{scene:'dream',title:'序章 · 一枕异梦',next:'dawn',lines:[
      line('narrator','你躺下没多久就睡着了，迷迷糊糊听见有人在争吵。睁开眼，营帐和铺盖都不见了，四周飘着雾，面前站着三个陌生人。',null),
      line('zuoci','南华，你当初怎么说的？把人聚到一起，仗就能早点打完？现在倒好，连本来死了的人也回来了，各家还在抢地盘！','zuoci'),
      line('nanhua','我以为这些人若是早些相遇，能少走些弯路，百姓也就不用多受几十年的苦……','nanhua'),
      line('zuoci','你倒替他们想得周全。可人家都有自己的打算，凭什么照着你的意思办？如今仗越打越多，你准备怎么办？','zuoci'),
      line('yuji','好了，别当着他的面吵。人已经来了，让他先问吧。','yuji'),
      line('hero','这是哪儿？我刚才不是在营里睡觉吗？','nanhua'),
      line('yuji','你还睡在营里，不必害怕。我们只是借这个梦和你说话。我叫于吉，刚才说话的是左慈，那边这位是南华。','yuji'),
      line('nanhua','今天让你受了不少惊吓，还挨了顿打，实在对不住。','nanhua'),
      line('hero','等一下，你们知道我挨打了？那我到这个地方来，也跟你们有关系？','nanhua'),
      line('nanhua','是我们把你带来的。我们想找一位精通三国史的后世之人，帮忙收拾眼下这个局面，最后选中了你。','nanhua'),
      line('hero','我看过些书，也玩过不少三国游戏，可这跟帮你们收拾乱世是两回事吧？','nanhua'),
      line('zuoci','至少你知道他们是什么人。如今有些将领还没出名，我们找起来费劲，你却连他们往后会做什么都知道。','zuoci'),
      line('hero','就算要我帮忙，也该先问问我吧？我家里人还在等我回去！','nanhua'),
      line('nanhua','这件事是我考虑不周。你有什么顾虑，尽管说，我们总得给你一个交代。','nanhua'),
      line('yuji','你今晚听到的那些怪事，都是南华施法之后出的岔子。本来相隔几十年的人，如今活在了同一个时候，所以这里的事已经不能照着史书算了。','yuji'),
      line('hero','难怪张角还活着，董卓已经控制了朝廷，魏蜀吴也建起来了。我还以为是自己记错了。','yuji'),
      line('yuji','你没记错，是这里变了。各家只知道自己的城池和人马，没人觉得这些事有哪里不对。','yuji'),
      line('zuoci','他原先还想再施一次法术，被我们拦住了。谁也不知道还会出什么乱子，这回只能想别的办法。','zuoci'),
      line('hero','所以你们就来找我？我今天连一个官兵都打不过，你们也看见了。','nanhua'),
      line('nanhua','我们想借重的是你知道的那些事。眼下各家缺少能用的人，还有许多将领散在乡里。你若能把他们找出来，事情就有转机。','nanhua'),
      line('yuji','先帮魏、蜀、吴招揽些人才，让他们有实力出兵。之后再设法让几家坐下来商量，一起对付董卓。','yuji'),
      line('hero','这么说，有些原本该跟着曹操、刘备的人，现在还没去？','yuji'),
      line('zuoci','对。许褚还在谯县替村里守粮，甘宁也还在江上当水匪。你知道他们的本事，换作旁人，见到了也未必肯多问一句。','zuoci'),
      line('nanhua','离这里最近的是常山。赵云正在那里照看流民，你可以先去找他，不必一开始就往远处跑。','nanhua'),
      line('hero','人是能找到，可我跟他们非亲非故的，凭什么劝他们走？','nanhua'),
      line('yuji','这就得见了面才知道了。人家若有难处，你能帮便帮一把，熟悉以后再谈。肯与你同行的，也可以先留在你的队伍里。','yuji'),
      line('hero','那我帮你们把事情办成以后，你们得送我回家。这个能保证吗？','nanhua'),
      line('nanhua','能。事情办成，我们一定送你回原来的地方，还会给你十万两黄金作为酬谢。这两件事，我都答应你。','nanhua'),
      line('hero','十万两黄金？你可别看我不懂这边的事，就随口拿个数来哄我。','nanhua'),
      line('hero','好吧，我先去常山看看。回家的事你们可得放在心上，我不想一辈子困在这里。','nanhua'),
      line('zuoci','你放心，话是当着我们三个说的，到时候我也会催着他办。','zuoci'),
      line('narrator','你还想问回去后该怎么解释，营外却传来了敲锅的声音。眼前的三人渐渐看不清了，等你再睁眼，头顶又成了营帐的布顶。',null)
    ]},
    dawn:{scene:'camp',title:'序章 · 天明',next:'departure',lines:[
      line('narrator','天已经亮了。你坐起来揉了揉胸口，昨晚挨打的地方还有些疼，那场梦里的话倒是一句也没忘。','zhangjiao'),
      line('zhangjiao','醒得挺早。伙房还有热粥，吃过了再出来走动，别饿着肚子。','zhangjiao'),
      line('hero','张先生，我正想跟你说一声。我准备去趟常山，听说那里有个人，也许能帮上你们。','zhangjiao'),
      line('zhangjiao','常山不算远。你在那边有相熟的人？','zhangjiao'),
      line('hero','还没见过，只是听过他的事。我想先去找找，总得试一试。','zhangjiao'),
      line('zhangjiao','你若已经想好了，就去吧。只是我和两个弟弟还得照顾营里这些人，眼下抽不开身。','zhangjiao'),
      line('hero','我一个人去就行。这两天已经给你们添了不少麻烦，不能再耽误你们的事。','zhangjiao'),
      line('zhangjiao','不必这么说。你昨天自己都顾不上，还肯扶那老人，我看得出你心地不坏。你要出去做事，我也该帮上一点。','zhangjiao'),
      line('zhangjiao','这里有两百文，拿去做盘缠。营里的兵器你也挑一件，路上不太平，手里总得有个防身的东西。','zhangjiao'),
      line('hero','那我就收下了，谢谢。等那边有了消息，我再回来告诉你。','zhangjiao'),
      line('zhangjiao','好。路上有事别硬撑，回来找我们就是。营里的饭也不差你这一碗。','zhangjiao'),
      line('narrator','你把钱收好，跟张角走向放兵器的帐篷。昨天还在山上游玩，现在却得认真想想，带什么才能在路上保住自己。','zhangjiao')
    ]}
  };
  const stages=['arrival','first-fight','aftermath','manual-fight','reinforcements','prepare','squad-fight','camp','dream','dawn','departure','world','complete'];
  function checkpoint(value={}){value=value&&typeof value==='object'?value:{};let stage=stages.includes(value.stage)?value.stage:'arrival',index=Math.floor(Number(value.index)||0);if(stage==='complete'||(stage==='camp'&&value.storyVersion!==2)){stage='camp';index=0;}const lines=chapters[stage]?.lines;return {storyVersion:2,stage,index:lines?Math.max(0,Math.min(lines.length-1,index)):0,preparation:clone(value.preparation&&typeof value.preparation==='object'?value.preparation:{}),...(value.world&&typeof value.world==='object'?{world:clone(value.world)}:{})};}
  function assets(id,appearance){
    if(id==='hero'){const a=root.PengpaiAssets?.protagonists[appearance];return a?{fullbody:{src:a.src},portrait:{src:a.src,crop:a.portrait}}:{};}
    return root.CharacterAssets?.manifest.characters[id]?root.CharacterAssets.resolve(id):{};
  }
  const W=typeof module!=='undefined'&&module.exports?require('./weapon-skills.js'):root.WeaponSkills;
  const skills=W.skills,G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  function hero(character){return {id:'hero',name:character.name,...G.characterAt(character),...assets('hero',character.appearance),weapon:null,attack:1,armor:0,resistance:0,healthOverride:1,maxSoldiers:1,startSoldiers:1,skills:['punch'],priorities:[{skill:'punch',when:'always'}]};}
  function general(id,level=5){
    const data={
      zhangjiao:{name:'张角',attack:8,armor:8,resistance:8,weapon:{type:'staff',id:'fire-god-staff',name:'火神杖',school:'thunder'},skills:['staff-shock','staff-storm'],passives:['thunder-lord'],priorities:[{skill:'staff-storm',when:'enemyCount',threshold:3},{skill:'staff-shock',when:'always',frequency:'sometimes'}]},
      zhangbao:{name:'张宝',attack:8,armor:8,resistance:10,weapon:{type:'scripture',name:'太平经'},skills:W.forWeapon({type:'scripture'}),priorities:[{skill:'scripture-2',when:'healThresholds',selfThreshold:.85,allyThreshold:.85},{skill:'scripture-3',when:'enemyCount',threshold:2,disabled:true}]},
      zhangliang:{name:'张梁',passives:['zhangliang-might','zhangliang-hardy'],attack:8,armor:12,resistance:6,weapon:{type:'spear',name:'铁枪'},skills:W.forWeapon({type:'spear'}),priorities:W.prioritiesFor(W.forWeapon({type:'spear'}))}
    };
    const u={id,unitType:'general',weaponPlanVersion:3,...G.create(id,level),...clone(data[id]),...assets(id)};u.weaponProficiencies={[u.weapon.type]:100};u.equipment={armor:{name:id==='zhangliang'?'铁甲':'道袍'},accessory1:null,accessory2:null};return u;
  }
  function soldier(i,level=8){
    const profiles=['imperialSoldier','imperialPikeman','imperialGuard','imperialSkirmisher'],growth=G.create(profiles[Math.max(0,i-1)%profiles.length],level),groups=[2,4,3,4];
    return {id:'soldier-'+i,name:'官兵',...assets('imperial-soldier'),...growth,weapon:{type:'spear',name:'长枪'},equipment:{armor:{name:'旧铁甲'}},weaponProficiencies:{spear:90},attack:6,armor:5,resistance:5,skills:['spear-cut','spear-sweep'],priorities:[{skill:'spear-sweep',when:'enemyCount',threshold:groups[Math.max(0,i-1)%profiles.length]},{skill:'spear-cut',when:'always',frequency:'sometimes'}]};
  }
  function createBattle(stage,character,preparation={}){
    const basic={id:stage,title:'村道交锋',control:{retreatDisabled:true},scene:{background:'./assets/story/village-road-v3.webp'},skills:clone(skills),rules:{level:1,enemyLevel:1,allySp:0,random:false,critical:false,hit:false,seed:'prologue-'+stage}};
    if(stage==='first-fight')return {...basic,title:'陌路冲突',allies:[{...hero(character),initialMode:'manual'}],enemies:[soldier(1)],rules:{...basic.rules,random:false,critical:false,hit:false}};
    if(stage==='manual-fight'){const j=general('zhangjiao');j.passives=['thunder-lord-tutorial'];return {...basic,title:'一杖退敌',hint:'点击技能，再选择敌人',control:{...basic.control,manualOnly:true,lockTactics:true},allies:[j],enemies:[soldier(1)]};}
    if(!['prepare','squad-fight'].includes(stage))throw new TypeError('未知序章战斗');
    const allies=['zhangjiao','zhangbao','zhangliang'].map(id=>{const u=general(id),saved=preparation[id];if(id==='zhangjiao')u.passives=['thunder-lord-tutorial'];if(saved){if(['manual','auto'].includes(saved.mode))u.initialMode=saved.mode;if(Array.isArray(saved.rules))u.priorities=saved.rules.filter(r=>u.skills.includes(r.skill));u.targetRule=saved.targetRule;}return u;});
    const captain={...soldier(1),...G.create('imperialCaptain',8),id:'captain',name:'官兵队长',armor:10,resistance:5,...assets('imperial-captain'),weapon:{type:'spear',name:'铁枪'},equipment:{armor:{name:'加固铁甲'},accessory1:null,accessory2:null},weaponProficiencies:{spear:90},skills:['shield-taunt','spear-cut','spear-sweep'],priorities:[{skill:'shield-taunt',when:'always'},{skill:'spear-sweep',when:'enemyCount',threshold:4},{skill:'spear-cut',when:'always',frequency:'sometimes'}],weaponPlanVersion:3};
    return {...basic,title:'黄巾并肩',preparationHint:'点击人物头像，可配置技能释放设置',scene:{...basic.scene,enemyFormation:{back:[1,2,3,4],front:[0]}},allies,enemies:[captain,...Array.from({length:4},(_,i)=>soldier(i+1))]};
  }
  function preparationOf(battle){return Object.fromEntries(battle.units.filter(u=>u.side==='ally').map(u=>[u.id,{mode:u.mode,rules:clone(u.priorities),targetRule:u.targetRule}]));}
  const api={chapters,stages,checkpoint,createBattle,preparationOf,assets,general};root.PengpaiPrologue=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
