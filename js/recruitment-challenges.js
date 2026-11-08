(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,K=node?require('./chapter-quest-kit.js'):root.ChapterQuestKit,H=node?require('./hero-quests.js'):root.HeroQuests,N=node?require('./nearby-content.js'):root.NearbyContent,Stories=node?require('./recruitment-stories.js'):root.RecruitmentStories;
 const {stage:S,next:Go,fight:F}=K;
 // 看信、交谈和同意切磋是不同阶段，不能让一个无战斗含义的按钮直接开打。
 const z=H.definitions.zhangfei;
 z.stages.return.npc.choices=[Go('把信交给张飞','read')];
 Stories.before('zhangfei','freed',[
  ['trial-talk','xiapi-county','zhangfei','与张飞商量同行的事',[
   ['npc','信我看了，桥也修好了。跟你们出去，我愿意。不过往后真要一起上阵，我还不知道你自己怎么应付敌人。'],['hero','你是想跟我比一场？'],['npc','对，就咱们两个，点到为止。不是替大哥考你，是以后我把后背交给你，总得知道你会怎么出手。没准备好就改天，我在这里等。']],[Go('准备好了，去空地切磋','duel')]]
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
   ['npc','你们来了。我已经在江东报了到，今天教场也空着。之前说的比试还算数，不过这回别请同伴帮忙。'],['hero','我自己上。你也不用因为北海那件事让着我。'],['npc','正合我意。伤药放在门边，不要硬撑。什么时候准备好，你开口。']],[Go('接受太史慈的单挑','jianye-duel')]]
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
 H.definitions.zhangliao.stages.rumor.npc.turns.push({speaker:'npc',text:'先不论你想替哪家做事。我跟你单独比一场，看看你遇到拦路的人，会不会只等着同伴来救。比完以后，我们再谈关外这些人的去处。'});
 Object.assign(H.definitions.sunshangxiang.battles.spar,{solo:true,boss:true,scaleToHero:true,acceptDefeat:false,trainingWeapon:'练武短弓',trainingSkills:[{base:'sword-cut',name:'校场试射'}]});
 H.definitions.sunshangxiang.stages.spar.npc.turns=[{speaker:'npc',text:'渡船上的人都安顿好了，这回该说说我们自己的事。我想跟你单独比一场，赢了我，再请我同行。不是闹着玩，真到了战场，总不能只知道你会叫大家怎么走。'},{speaker:'hero',text:'可以，先把旁边的东西收好。你用练武的弓，我也自己上，谁都不叫人帮忙。'}];
 H.definitions.machao.stages.house.npc.choices[0]={label:'要求守卫通报',next:'house-warning'};
 H.definitions.machao.stages['house-warning']=S('ma-residence','应对拒绝归还旧物的守军','river-guard',[
  ['npc','通报过了，里面说马家的东西也归军中，你们再不走，就按探营拿人！'],['hero','只是取回家里的旧枪，怎么就成探营了？把门后的人叫出来，当着我们说清楚。'],['npc','还想往里闯？来人，把他们赶出去！']],[F('挡住动手的守军','house')]);H.definitions.machao.battles.house.stage.push('house-warning');
 // 两种可见的任务道具由本地委托获得，不能用钱直接买到，也不能被出售。
 const river=N.sideQuests.find(q=>q.id==='cs-riverside');river.effects={...(river.effects||{}),items:{'ox-sinew':1}};
 river.accept+='船夫替军中运过弓料，手里留着一份牛筋弦料。把船接回来，他愿意拿出来修黄将军的旧弓。';
 Stories.before('huangzhong','school',[
  ['broken-bow','changsha','huangzhong','替黄忠寻找修弓的牛筋',[
   ['npc','马找回来了，可马贼把弓弦划坏了。浏阳的老船夫以前替军中运弓料，手里应该还有能用的牛筋。'],['hero','我们去问问。要是他有什么难处，也一起看看能不能解决。'],['npc','他前些日子托人来求过助，说渡船被水贼占了。我本来就想去，你到了先把船上的人接回来，弦料拿不到也别紧追着要。']],[Go('先去浏阳帮船夫','bow-wait',{effects:{acceptSide:['cs-riverside']}})]],
  ['bow-wait','changsha','huangzhong','完成渡边灯火，带回牛筋弓弦',[
   ['npc','船夫那边有消息了吗？我先把弓身理好，等你们回来。乡亲能重新过河，比我早几天拿起弓更要紧。']],[Go('拿出牛筋，修好旧弓','school',{requires:{items:{'ox-sinew':1},hint:'先完成“渡边灯火”，向委托人交付后取得牛筋弓弦。'}})]]
 ]);
 Object.assign(H.definitions.huangzhong.battles.duel,{solo:true,boss:true,scaleToHero:true,acceptDefeat:false,trainingWeapon:'练武短弓',trainingSkills:[{base:'sword-cut',name:'校场试射'}]});
 H.definitions.huangzhong.stages.school.npc.turns=[{speaker:'npc',text:'船夫的信我看过了，人和船都平安，弓也修好了。这趟多亏你们。要说同行，我还想看看你自己拿兵器的本事，咱们在教场单独试一场。'},{speaker:'hero',text:'好，你用练武的弓，我们点到为止。我打不过，就先回去练，不会拿帮忙的事要你让着。'}];
 N.npcs.push({id:'yicheng-apprentice',name:'药徒',art:'herbalist',place:'xiangyang-county',role:'quest',roleLabel:'委托',side:'left',lines:['先生给病人配的药还有两户没送到。往襄阳的路上有盗匪，我一个人不敢挑着药过去，能不能请你们护送一程？','每家用了什么药、还有哪里不舒服，都得记下来带回去，不能只把药包往门口一放。']});
 N.sideQuests.push({id:'yicheng-rounds',title:'宜城送药',giver:'yicheng-apprentice',giverPlace:'xiangyang-county',place:'xiangyang',sceneId:'rural-road',recommendedLevel:6,rounds:2,money:180,item:'wood-beads',quality:'green',enemyName:'拦路盗贼',enemyArt:'thief',accept:'药徒请你护送药材到襄阳附近，送达后记下伤者的情况，再回宜城交接。',effects:{items:{'rounds-journal':1}}});
 Stories.before('huatuo','freed',[
  ['rounds-request','xiangyang-county','huatuo','与华佗交接宜城病人的后续照料',[
   ['npc','我想跟你们出去，可还有两户人家的药没送到。药徒昨天被人拦回来，我不放心让他一个人再走。'],['hero','我陪他去。病人还有什么要问的，你先告诉我，我一起记回来。'],['npc','看他们有没有再发热，伤口肿没肿，药有没有按时用。遇到拿不准的就记下来，别自己改方子。等巡诊簿交回来，我也好把这几户托给留下的大夫。']],[Go('护送药徒去送药','rounds-handover',{effects:{acceptSide:['yicheng-rounds']}})]],
  ['rounds-handover','xiangyang-county','huatuo','完成宜城送药，将巡诊簿交给华佗',[
   ['npc','两户人家的情况，都交给药徒记好了吗？有这份记录，之后接手的大夫才知道该留意什么，我也能放心出门。']],[Go('拿出巡诊簿，交代病情','freed',{requires:{items:{'rounds-journal':1},hint:'先完成“宜城送药”，回药徒处交付，取得巡诊簿。'}})]]
 ]);
 // 固定编成让玩家能观察、辨认和重试，不在每次开战时重新抽敌人。
 for(const [id,phase,roles]of [['xuchu','temple',[null,null,'caster']],['taishici','depot',[null,null,'medic']],['ganning','breach',[null,null,null,'caster','medic']],['maliang','medicine',[null,'healer',null]],['zhouyu','river-night',[null,null,'witch',null,'healer']],['zhugeliang','water-timber',[null,null,'caster',null,'medic']],['simayi','grain-seizure',[null,null,'witch',null,'medic']]])H.definitions[id].battles[phase].enemyRoles=roles;
 // 石阵解围不是递交一封信；陆逊会参与一次真正的守路行动。
 Stories.before('luxun','freed',[
  ['road-warning','yiling','evacuee','与陆逊接应被堵在山口的乡民',[
   ['npc','你们从石阵那边回来了？刚才有伙人把路口封了，几辆车还在坡下，他们要把货全卸下来才让人过。'],['luxun','那条坡路我刚走过，后面还有一条能绕到石壁边的小径。先把乡亲接出来，别让他们在车旁边动手。'],['hero','你带人看住小径，我们从正面过去。等车夫把人带开，再拦住追上来的，别一见他们退就往山里追。']],[Go('与陆逊前往山口','road-defense')]]
 ]);
 H.definitions.luxun.stages['road-defense']=S('yiling','与陆逊击退封路匪首','luxun',[
  ['npc','乡亲已经沿小径走了，拦路的人正在往这边追。先守住石壁旁的窄口，他们散开以后再出手。'],['hero','我看见后面的弓手了，不能只顾着眼前这个。大家站稳，把背后那条路留给乡亲。']],[F('守住乡民的退路','road-defense')]);
 H.definitions.luxun.battles['road-defense']={stage:['road-defense'],next:'freed',title:'夷陵守路',sceneId:'forest-path',count:3,enemyKind:'bandit',level:8,boss:true,guest:'luxun'};
 H.definitions.luxun.stages.freed.place='yiling';H.definitions.luxun.stages.freed.npc.turns=[{speaker:'npc',text:'车都进城了，刚才落在后面的老伯也有人接走。今天要是我自己从石阵出来就走，那些车恐怕还堵在坡下。多亏你们肯留下帮忙。'},{speaker:'hero',text:'你也一直守着小径，不然我们顾不上那么多人。既然大家都平安，接下来还愿不愿意一起走？我们正准备往江东看看。'},{speaker:'npc',text:'愿意。让我先把那条绕行的路画给守城的人，免得以后再有人被堵在那里，交代完就来找你们。'}];
 H.definitions.luxun.recommendedLevel=8;
 // 君主任务的可见入口与人数条件共用同一份数据。
 for(const [id,country]of [['caocao','wei'],['liubei','shu'],['sunquan','wu']]){const d=H.definitions[id];d.visibility={recruits:{[country]:5}};d.rulerCountry=country;}
 H.definitions.taishici.battles['jianye-duel'].failureLines=['先停，你肩上已经见血了。你那几下出手够重，可一急就顾不上准头，反倒给我留了空。回去把招式用稳些，改天我们再比。'];H.definitions.lvbu.battles.trial.friendly=true;
 // 通常冲突以三人以下的小队为主，劫狱外院等明确配置保留四人。
 for(const d of Object.values(H.definitions))for(const f of Object.values(d.battles))if(d.id!=='ganning'&&f.count===4&&!f.boss&&!f.duel&&!f.roster&&!f.named)f.count=3;
 N.storyBattles.escort.count=3;
 for(const d of Object.values(H.definitions)){const at=d.stages.freed?.place||d.place;if(at===d.home)for(const choice of d.stages.freed?.npc?.choices||[])if(choice.recruit===false)choice.label='留在'+root.WorldData.placeMap[d.home].name;}
 const api={version:1};root.RecruitmentChallenges=api;if(node)module.exports=api;
})(globalThis);
