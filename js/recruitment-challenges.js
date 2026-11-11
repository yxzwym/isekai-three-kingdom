(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,K=node?require('./chapter-quest-kit.js'):root.ChapterQuestKit,H=node?require('./hero-quests.js'):root.HeroQuests,N=node?require('./nearby-content.js'):root.NearbyContent,Stories=node?require('./recruitment-stories.js'):root.RecruitmentStories;
 const {stage:S,next:Go,fight:F}=K;
 // 看信、交谈和同意切磋是不同阶段，不能让一个无战斗含义的按钮直接开打。
 const z=H.definitions.zhangfei;
 z.stages.return.npc.choices=[Go('把信交给张飞','read')];
 Stories.before('zhangfei','freed',[
  ['trial-talk','xiapi-county','zhangfei','与张飞商量同行的事',[
   ['npc',"信读了，桥也修了。跟你们走，俺愿意！可真要并肩上阵，俺还没瞧过你手里的本事。"],['hero','你是想跟我比一场？'],['npc',"没错，就你和俺。点到为止，不是大哥叫俺考你，是俺自己手痒！兵器还不趁手，便改日再来，俺等得。"]],[Go('准备好了，去空地切磋','duel')]]
 ]);
 z.stages.duel=S('xiapi-county','与张飞单独切磋','zhangfei',[
  ['npc','把旁边的人让开，别碰着。赢了咱们再商量同行，输了也没什么丢人的，回去练好再来。'],['hero','说好了，只有我们两个。准备好了就开始。']],[F('与张飞单挑','duel')]);
 Object.assign(z.battles.duel,{stage:['duel'],next:'freed',solo:true,boss:true,scaleToHero:true,acceptDefeat:false,trainingWeapon:'练武长矛',trainingSkills:[{base:'shield-hit',name:'枪柄试招'}],effects:{flags:{zhangfeiTrialWon:true}}});
 z.recruitRequires={flags:{zhangfeiTrialWon:true},hint:'先与张飞单独切磋，获胜后再商量同行。'};z.recruitRedirect='trial-talk';
 // 太史慈只在北海几场冲突中助阵，不进入玩家的队伍，也不提前计入招募。
 const t=H.definitions.taishici;t.recommendedLevel=6;
 for(const s of Object.values(t.stages))for(const c of s.npc?.choices||[])if(c.guest==='taishici')delete c.guest;
 for(const f of Object.values(t.battles))Object.assign(f,{scaleEnemies:true});
 Stories.before('taishici','freed',[
  ['depart-for-wu','beihai','taishici','与太史慈道别',[
   ['npc','母亲的药和吃住都有了安排，我准备去建业。孙家在招人，我想亲自看看，他们是不是真肯让人做些事情。'],['hero','那我们以后到了建业，再去找你。'],['npc','好。你们帮我的事，我记在心里。不过帮忙是一回事，要一起领兵，还得知道彼此的本事。到了建业教场，咱们单独比一场，你赢了，我就跟你走。']],[Go('约在建业教场再见','jianye-meet')]],
  ['jianye-meet','jianye','taishici','到建业教场与太史慈单挑',[
   ['npc',"等你们多时了！我已在江东报到，今日教场正空。北海说的那场比试，可没忘吧？这回就你我两个。"],['hero','我自己上。你也不用因为北海那件事让着我。'],['npc',"那才痛快。伤药在门边，撑不住便说，别伤了咱们喝酒的兴致。"]],[Go('接受太史慈的单挑','jianye-duel')]]
 ]);
 t.stages['jianye-duel']=S('jianye','单独击败太史慈','taishici',[
  ['npc','旁边的人先退远一点，就看我们两个。准备好了，来吧！']],[F('开始单挑','jianye-duel')]);
 t.battles['jianye-duel']={stage:['jianye-duel'],next:'freed',title:'建业教场',sceneId:'farmland',duel:'taishici',solo:true,boss:true,scaleToHero:true,trainingWeapon:'练武木刀',trainingSkills:[{base:'sword-cut',name:'横刀试招'}],effects:{flags:{taishiciTrialWon:true}}};
 t.stages.freed.place='jianye';t.stages.freed.npc.turns=[{speaker:'npc',text:'这场我认输。你没有让同伴下场，受了伤也没乱掉，跟我在北海认识的还是同一个人。以后要一起走，我愿意。'},{speaker:'hero',text:'那我们先把伤处理好，再商量往哪里去。你在建业还有要交代的事，我们等你办完。'}];
 for(const key of ['jianye-meet','jianye-duel','freed'])t.stages[key].recommendedLevel=10;
 t.battles['jianye-duel'].temporaryPassives=['enemy-healing-suppression','enemy-wipe-120'];t.stages.freed.npc.choices.find(c=>c.recruit===false).label='留在建业';
 t.recruitRequires={flags:{taishiciTrialWon:true},hint:'太史慈已约在建业教场，单挑获胜后才能邀请同行。'};t.recruitRedirect='jianye-meet';
 // 各条路线保留不同的考验，文士与医者不硬套武力单挑。
 Object.assign(H.definitions.zhangliao.battles.duel,{solo:true,boss:true,scaleToHero:true,trainingWeapon:'练武弩',trainingSkills:[{base:'sword-cut',name:'校场试射'}]});
 H.definitions.zhangliao.stages.rumor.npc.turns.push({speaker:'npc',text:"且试一场，就你我二人。武艺并非全部，可遇着刀兵，总不能只会开口求人。比过，再谈出关的事。"});
 Object.assign(H.definitions.sunshangxiang.battles.spar,{solo:true,boss:true,scaleToHero:true,acceptDefeat:false,trainingWeapon:'练武短弓',trainingSkills:[{base:'sword-cut',name:'校场试射'}]});
 H.definitions.sunshangxiang.stages.spar.npc.turns=[{speaker:'npc',text:"船上的人都送妥了，轮到我问你一件事。你自己使兵器如何？比一场吧，单独比。总不能一路只听你指东指西，还没见你出过几招。"},{speaker:'hero',text:"行，练武弓，我也独自上。让旁边的人挪挪，别碰着东西。"}];
 H.definitions.machao.stages.house.npc.choices[0]={label:'要求守卫通报',next:'house-warning'};
 H.definitions.machao.stages['house-warning']=S('ma-residence','应对拒绝归还旧物的守军','river-guard',[
  ['npc','通报过了，里面说马家的东西也归军中，你们再不走，就按探营拿人！'],['hero',"取自家的枪，倒成探营了？谁下的令，请他出来，我当面问。"],['npc','还想往里闯？来人，把他们赶出去！']],[F('挡住动手的守军','house')]);H.definitions.machao.battles.house.stage.push('house-warning');
 // 两种可见的任务道具由本地委托获得，不能用钱直接买到，也不能被出售。
 const river=N.sideQuests.find(q=>q.id==='cs-riverside');river.effects={...(river.effects||{}),items:{'ox-sinew':1}};
 river.accept="浏阳的水贼拆了船板生火，老船夫哭着来求助。劳诸位夺回船，能补便补。船夫替军中运过弓料，还留着一份牛筋弦料；船接回来，他愿取出修黄将军的弓。";
 Stories.before('huangzhong','school',[
  ['broken-bow','changsha','huangzhong','替黄忠寻找修弓的牛筋',[
   ['npc','马找回来了，可马贼把弓弦划坏了。浏阳的老船夫以前替军中运弓料，手里应该还有能用的牛筋。'],['hero',"那就去浏阳问问。老人家若有事为难，咱们帮一把。"],['npc',"他先前便托人求援，说渡船被水贼占了。到了先救人，弦料是小事，别让他以为咱们只为牛筋去的。"]],[Go('先去浏阳帮船夫','bow-wait',{effects:{acceptSide:['cs-riverside']}})]],
  ['bow-wait','changsha','huangzhong','完成渡边灯火，带回牛筋弓弦',[
   ['npc',"浏阳可有消息？弓身我已经理好。先让乡亲们过得了河，弦料迟些不妨。"]],[Go('拿出牛筋，修好旧弓','school',{requires:{items:{'ox-sinew':1},hint:'先完成“渡边灯火”，向委托人交付后取得牛筋弓弦。'}})]]
 ]);
 Object.assign(H.definitions.huangzhong.battles.duel,{solo:true,boss:true,scaleToHero:true,acceptDefeat:false,trainingWeapon:'练武短弓',trainingSkills:[{base:'sword-cut',name:'校场试射'}]});
 H.definitions.huangzhong.stages.school.npc.turns=[{speaker:'npc',text:"渡船的事，老船夫来信谢过了。弓也修好，多亏诸位。老夫还想试试你手里的兵器——不为别的，难得遇着个肯练的。教场上，咱们单独过几招？"},{speaker:'hero',text:"奉陪。可说好了，练武弓，点到为止。我若输了，回去练好再来。"}];
 N.npcs.push({id:'yicheng-apprentice',name:'药徒',art:'herbalist',place:'xiangyang-county',role:'quest',roleLabel:'委托',side:'left',lines:["还有两户没收到药，先生等着回信。往襄阳的路上有贼，我挑着药，腿都不听使唤。诸位肯陪我走一段吗？","先生说，药用了没有，哪里还疼，都得问明白记回来。我把笔带了，可别到了门口一紧张，又忘了问。"]});
 N.sideQuests.push({id:'yicheng-rounds',title:'宜城送药',giver:'yicheng-apprentice',giverPlace:'xiangyang-county',place:'xiangyang',sceneId:'rural-road',recommendedLevel:6,rounds:2,money:180,item:'wood-beads',quality:'green',enemyName:'拦路盗贼',enemyArt:'thief',accept:"药徒要往襄阳送两户药，求人同行。送到后记下病情，带巡诊簿回宜城交给华佗。",effects:{items:{'rounds-journal':1}}});
 Stories.before('huatuo','freed',[
  ['rounds-request','xiangyang-county','huatuo','与华佗交接宜城病人的后续照料',[
   ['npc','我想跟你们出去，可还有两户人家的药没送到。药徒昨天被人拦回来，我不放心让他一个人再走。'],['hero',"我陪药徒送。哪几样病情要问的，先生说吧，我记回来。"],['npc',"问发热、看伤处肿胀，再问用药是否准时。拿不准便记下，切莫擅改方。诊簿送回，留下的医者才好接诊。"]],[Go('护送药徒去送药','rounds-handover',{effects:{acceptSide:['yicheng-rounds']}})]],
  ['rounds-handover','xiangyang-county','huatuo','完成宜城送药，将巡诊簿交给华佗',[
   ['npc',"巡诊簿带来了？两户的病情，我须交给坐堂的大夫。翻给我看看，还有什么漏问的。"]],[Go('拿出巡诊簿，交代病情','freed',{requires:{items:{'rounds-journal':1},hint:'先完成“宜城送药”，回药徒处交付，取得巡诊簿。'}})]]
 ]);
 // 固定编成让玩家能观察、辨认和重试，不在每次开战时重新抽敌人。
 for(const [id,phase,roles]of [['xuchu','temple',[null,null,'caster']],['taishici','depot',[null,null,'medic']],['ganning','breach',[null,null,null,'caster','medic']],['maliang','medicine',[null,'healer',null]],['zhouyu','river-night',[null,null,'witch',null,'healer']],['zhugeliang','water-timber',[null,null,'caster',null,'medic']],['simayi','grain-seizure',[null,null,'witch',null,'medic']]])H.definitions[id].battles[phase].enemyRoles=roles;
 // 石阵解围不是递交一封信；陆逊会参与一次真正的守路行动。
 Stories.before('luxun','freed',[
  ['road-warning','yiling','evacuee','与陆逊接应被堵在山口的乡民',[
   ['npc','你们从石阵那边回来了？刚才有伙人把路口封了，几辆车还在坡下，他们要把货全卸下来才让人过。'],['luxun',"石壁旁有条小径，我方才走过，能绕下坡。先接乡亲离车，别叫他们夹在中间。"],['hero',"小径你照看，正面我们去。人撤开了再动手，别追进山里。"]],[Go('与陆逊前往山口','road-defense')]]
 ]);
 H.definitions.luxun.stages['road-defense']=S('yiling','与陆逊击退封路匪首','luxun',[
  ['npc',"乡亲已过小径，追兵正来！石壁前路窄，守住，待他们散开再击。"],['hero',"后头有弓手！别挤上去，背后这条路还得让乡亲走。"]],[F('守住乡民的退路','road-defense')]);
 H.definitions.luxun.battles['road-defense']={stage:['road-defense'],next:'freed',title:'夷陵守路',sceneId:'forest-path',count:3,enemyKind:'bandit',level:8,boss:true,guest:'luxun'};
 H.definitions.luxun.stages.freed.place='yiling';H.definitions.luxun.stages.freed.npc.turns=[{speaker:'npc',text:'车都进城了，刚才落在后面的老伯也有人接走。今天要是我自己从石阵出来就走，那些车恐怕还堵在坡下。多亏你们肯留下帮忙。'},{speaker:'hero',text:'你也一直守着小径，不然我们顾不上那么多人。既然大家都平安，接下来还愿不愿意一起走？我们正准备往江东看看。'},{speaker:'npc',text:'愿意。让我先把那条绕行的路画给守城的人，免得以后再有人被堵在那里，交代完就来找你们。'}];
 H.definitions.luxun.recommendedLevel=8;
 // 君主任务的可见入口与人数条件共用同一份数据。
 for(const [id,country]of [['caocao','wei'],['liubei','shu'],['sunquan','wu']]){const d=H.definitions[id];d.visibility={recruits:{[country]:5}};d.rulerCountry=country;}
 H.definitions.taishici.battles['jianye-duel'].failureLines=['先停，你肩上已经见血了。你那几下出手够重，可一急就顾不上准头，反倒给我留了空。回去把招式用稳些，改天我们再比。'];H.definitions.lvbu.battles.trial.friendly=true;
 // 通常冲突以三人以下的小队为主，劫狱外院等明确配置保留四人。
 for(const d of Object.values(H.definitions))for(const f of Object.values(d.battles))if(d.id!=='ganning'&&f.count===4&&!f.boss&&!f.duel&&!f.roster&&!f.named)f.count=3;
 for(const d of Object.values(H.definitions)){const at=d.stages.freed?.place||d.place;if(at===d.home)for(const choice of d.stages.freed?.npc?.choices||[])if(choice.recruit===false)choice.label='留在'+root.WorldData.placeMap[d.home].name;}
 const api={version:1};root.RecruitmentChallenges=api;if(node)module.exports=api;
})(globalThis);
