(function(root){
  'use strict';
  // 各国军师接洽与招募赏钱；每名将臣的赏钱只发放一次。
  const rewardPerHero=500;
  const rulers={
    wei:{id:'caocao',name:'曹操',minimum:5,before:['主公前些天南下，想把沿江几处渡口的人联络起来。最初还能收到回信，后来送信的人一直没到，我也在派人找。','现在还不能让你们贸然追过去。先把愿意来魏国做事的人找齐五位，城里的接应和粮路有人负责，我们才能腾出人手一起查。'],restored:'主公已经平安回来了，伤兵也都安顿好。你们这趟辛苦，往后要找他，可以到府里问，准备出门时他也会留个口信。'},
    shu:{id:'liubei',name:'刘备',minimum:5,before:['主公去了江夏，想跟当地人商量安置流民。前面几封信说谈得不顺，如今该回信的时候却没有消息，我怕他还在为乡亲的住处跟人争执。','我想去接应，也得先有人照看成都。你们帮蜀国找到五位愿意做事的人，再来找我，我们就能把城里安排开，仔细查他的去处。'],restored:'主公和江夏的乡亲都平安到了成都。你想找他，我会替你传话；他若又准备出门，也得先把接应和行程交代清楚，不能再让大家干等。'},
    wu:{id:'sunquan',name:'孙权',minimum:5,before:['主公去接应沿江的百姓了。柴桑送来的信越来越少，渡口又有人拦船，具体是哪一路人，我还在等探子回来确认。','先为江东找到五位愿意帮忙的将士。渡口和城里都得留够人手，到时若真要接应主公，我们才不会一出门，后面就没人照管。'],restored:'主公已经回到建业，接回来的百姓也有了住处。你要找他，我替你问问；若他正跟你们同行，城里的事情由我和主簿接着管。'}
  };
  function rulerStatus(world,country){const data=rulers[country];if(!data)return null;const q=world.state.heroQuests[data.id];return {...data,count:world.state.recruits[country].length,ready:world.state.recruits[country].length>=data.minimum,complete:q.stage==='complete',stage:q.stage,accepted:q.accepted};}
  const definitions={
    wei:{country:'wei',place:'xuchang',id:'simayi',name:'司马懿',art:'simayi',side:'left',
      welcome:['你终于到许昌了。那夜梦中一别，我还疑心只是怪梦，今日见到你，才算信了。曹公尚未回来，府里的事由我照看，先进来坐。','这里还需要能带兵、也肯管束手下的人。你们走的地方多，要是遇到愿意来魏国做事的将士，麻烦帮我们介绍一下，事后回来告诉我就好。'],
      thanks:'他们已经来信，说了你们一路帮忙的事情。我让人备好了赏钱，你们收着吧，往后还要赶路，吃住和买药都用得上。',
      idle:'你上次介绍来的人，我已经记好了。以后再碰到合适的，也可以叫他来这里找我，到了报你的名字，我们会安排接待。'},
    shu:{country:'shu',place:'chengdu',id:'zhugeliang',name:'诸葛亮',art:'zhugeliang',side:'right',
      welcome:['那夜梦中相约，今日总算见面了。从常山一路到成都，想必很不容易。主公尚未归来，我已叫人收拾了客房，你们先歇歇。','成都最近收留了不少逃难的人，住处、粮车、沿路护送都缺人照看。你们如果遇到愿意来帮忙的将士，麻烦替我们问问，介绍成了，路上的花费也该由我们出一些。'],
      thanks:'你们介绍来的几位，已经说过一路发生的事情了。这份赏钱请收下，不能总让你们自己出钱赶路，大家愿意来，少不了你们费心。',
      idle:'你带回的消息我都记下了。想休息就多住几天，府里有地方安排；准备继续走的话，也先把伤治好，不用刚到就急着出门。'},
    wu:{country:'wu',place:'jianye',id:'zhouyu',name:'周瑜',art:'zhouyu',side:'left',
      welcome:['我已吩咐门吏，见你便请进府来。那夜三位仙长说过的事，我还记得。主公尚在外面接应百姓，眼下由我留守建业。你们这一路可还顺利？','来建业的乡亲越来越多，渡口要有人接应，城里也要安排吃住。你们在外头遇到愿意来江东做事的人，替我们带句话，办成以后回来，我会给大家备好路上的花费。'],
      thanks:'这几位的事情我已经记好了，真是帮了江东的大忙。赏钱带上吧，接下来不管是找人还是救急，总有要花钱的地方。',
      idle:'上次那份赏钱已经结清了，账上也都有记录。你们可以放心去办自己的事，再找到愿意来江东的人，回来告诉我，我会接着安排。'}
  };
  const npc=country=>{const d=definitions[country];return d?{id:d.id,name:d.name,art:d.art,side:d.side,place:d.place,country,role:'court',roleLabel:'招贤'}:null;};
  const at=place=>npc(Object.keys(definitions).find(c=>definitions[c].place===place));
  const api={definitions,rulers,rulerStatus,rewardPerHero,npc,at};root.FactionCourts=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
