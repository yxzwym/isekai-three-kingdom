(function(root){
  'use strict';
  // Presentation metadata only. Rewards and quest transitions remain owned by World.
  function battle(context,world){
    const q=world.state.quests.changshan;
    if(context.kind==='story'){
      const beats={
        entry:['守住最后两袋粮','村民推开了紧闭的门。赵云记住了与你并肩的这一战。','与赵云商议，结伴前往中山。'],
        rescue:['粮仓的门打开了','被扣押的伤者终于走出后仓，门后的医者向你道谢。','与获救的医者交谈，再护送粮车回常山。'],
        grain:q.grainWins<2?['前仓夺回','仓守把各家缝制的粮袋一一认了出来。还有最后一院。','粮仓后院 · 还差一战。']:['乡粮夺回','两院粮袋全数清点，后院的锁门却传来呼救声。','查看后院，救出被扣押的人。'],
        escort:['常山，开门！','孩子们追着粮车跑进村。你一路护住的，终于成了灶上的热粥。','与里正交谈，再与赵云商议同行。']
      };
      const beat=beats[context.phase];return beat?{title:beat[0],text:beat[1],next:beat[2]}:null;
    }
    if(context.kind==='chapter'){
      const beats={vanguard:['关前的旗倒了','华雄的重甲没能拦住你们。身后的联军开始向关前集结。'],garrison:['陷阵已破','关门前的弩声停了。斥候穿过你们打通的缺口，向城外报信。'],gate:['温侯让路','吕布收戟退开。过了这道门，洛阳的灯火已在眼前。'],street:['街巷相通','街垒被推开，原本紧闭的窗里有人探出头来。你们守住了进城的路。'],advisor:['毒雾散去','李儒退下，府门前终于能喘一口气。所有人都望向最后那扇门。'],dongzhuo:['太师府的灯重新亮起','董卓倒下，异影从他身后脱离。城外还在等你下令停兵。']};
      const beat=beats[context.phase];return beat?{title:beat[0],text:beat[1],next:world.state.chapterOne.stage==='aftermath'?'听董卓说清真相，安排开仓、放人。':'找联军斥候商议下一场战斗。'}:null;
    }
    if(context.kind==='heroQuest'){
      const definition=root.HeroQuests?.definitions[context.questId];
      const next=definition?.stages[world.state.heroQuests[context.questId]?.stage];
      return {title:definition?.title||'新的转机',text:'这一关已过。'+(definition?.name||'同伴')+'的事有了新的转机。',next:next?.objective||'与当事人商议下一步。'};
    }
    return null;
  }
  function growth(gain,unit){
    if(!gain||gain.after<=gain.before||!unit?.baseAttributes||!unit.potentials)return 0;
    const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
    const before=G.attributesAt(unit.baseAttributes,unit.potentials,gain.before),after=G.attributesAt(unit.baseAttributes,unit.potentials,gain.after);
    return G.KEYS.reduce((n,key)=>n+after[key]-before[key],0);
  }
  function objective(world){
    const q=world.state.quests.changshan;
    const steps={available:['第一程 · 常山','去常山看看赵云与乡亲们的难处'],entry:['第一程 · 守住村口','与赵云并肩，挡住抢粮的盗匪'],supplies:['为常山带回粮食',q.zhaoInvitation?'与赵云商议结伴':q.grainWins?'再夺后仓，粮车就能上路':q.healerRescued?'返回中山，找仓守夺粮':'前往中山，向仓守询问粮车'],rescue:['粮仓里的呼救','查看中山粮仓后院，救出被扣押的人'],escort:['最后一程 · 护粮归乡','护送粮车返回常山'],return:['常山的灶火','进村与里正交谈，看看乡亲们'],decision:['一杆愿意同行的枪','与赵云商议下一程']};
    return steps[q.stage]||null;
  }
  function questReward(world,quest){
    const data=root.NearbyContent?.sideQuests.find(q=>q.id===quest.id);
    if(data){
      const item=root.ItemCatalog.templates[data.item],quality=root.ItemCatalog.qualities[data.quality]?.name||'';
      const progress=world.state.quests.side[data.id];
      return '任务奖励 · '+data.money+'文'+(item?' · '+quality+item.name:'')+(progress?.accepted?'　进度 '+Math.min(data.rounds,progress.wins)+'/'+data.rounds:'');
    }
    if(quest.id==='changshan')return '任务奖励 · 常山平安佩';
    if(quest.id==='coalition')return '达成目标 · 开启洛阳战线';
    const hero=root.HeroQuests?.definitions[quest.id];
    return hero?'完成后可邀 · '+hero.name:'';
  }
  function companionPerks(unit){
    return (unit.passives||[]).map(id=>root.BattlePassives?.definitions[id]).filter(p=>p?.exclusive).map(p=>p.name).slice(0,2);
  }
  const api={battle,growth,objective,questReward,companionPerks};root.AdventureFeedback=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
