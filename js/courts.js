(function(root){
  'use strict';
  // 各国军师接洽与招募赏钱；每名将臣的赏钱只发放一次。
  const rewardPerHero=500;
  const rulers={
    wei:{id:'caocao',name:'曹操',minimum:5,before:["主公南下联络渡口，起初信未曾断，近日却连送信的人也不见了。我已遣斥候去探，尚无回报。","此刻不宜再散人手。魏国还须五位肯任事的将士，守住城池、粮路，接应才有余力。待你寻齐，再来找我，我会将查到的路告诉你。"],restored:"主公已平安归城，伤兵也入了医馆。此行有劳。要见他便来府里问，若人又出门，我也会留意他的行程。"},
    shu:{id:'liubei',name:'刘备',minimum:5,before:["主公为流民的住处去了江夏。前信说两边相争，谈得艰难，如今连应到的信也误了时辰，实在叫人挂心。","成都还要有人守，亮一时抽不开身。先为蜀国寻得五位可任事之人，安顿下城内，便可调人接应。届时请再来，我将细说主公的去处。"],restored:"主公与江夏乡亲都已到了成都，医馆、住处也在照看。要寻他，我替你传话。若又出门，总得先把信使和接应留好。"},
    wu:{id:'sunquan',name:'孙权',minimum:5,before:["主公去接沿江乡民，柴桑的信却越来越迟。渡口有人拦船，究竟哪一路，还须等斥候回报。","江东须先有五位将士任事，城内、渡口才调得开人。诸位寻齐再来，我备妥接应，也将主公行程交予你们。"],restored:"主公已回建业，乡民也都有了住处。若要找他，我替你通传；若正与你同行，城中自有我与主簿照料。"}
  };
  function rulerStatus(world,country){const data=rulers[country];if(!data)return null;const q=world.state.heroQuests[data.id];return {...data,count:world.state.recruits[country].length,ready:world.state.recruits[country].length>=data.minimum,complete:q.stage==='complete',stage:q.stage,accepted:q.accepted};}
  const definitions={
    wei:{country:'wei',place:'xuchang',id:'simayi',name:'司马懿',art:'simayi',side:'left',
      welcome:["果真来了。那夜梦中相见，我醒后还疑了许久，今日在许昌见着你，才敢认。曹公尚未归，府中由我照看。入内坐吧。","军中缺能领兵、肯约束部下的人。你走乡野，若遇着合适的，替我引来许昌。事成来此复命，路上的花费，府里自会给你补上。"],
      thanks:"来的人已向我说过了。这份赏钱收着，添些行装，也好再赶路。你的人情，我另记在心里。",
      idle:"上回来的人已安置妥当。再有愿来的，报你姓名即可，门吏会领他入府，不叫他在外空等。"},
    shu:{country:'shu',place:'chengdu',id:'zhugeliang',name:'诸葛亮',art:'zhugeliang',side:'right',
      welcome:["梦中之约，竟真有今日。常山到成都，路途不近。主公尚未归，客房却已替诸位留着，先洗去一路尘土吧。","流民日增，安置、运粮、护送，处处都缺人。若遇肯出力的将士，烦你代问一声，带来成都。引荐的酬劳，在此领取，莫再尽用自己的盘缠。"],
      thanks:"几位都已到了，也说起沿路受你相助。谢仪备在这里，请收下。亮不能远迎，至少也该替你分担些路费。",
      idle:"来信已记下。客房还留着，想住几日便住。伤若未愈，也别急着出城，成都总还管得起一碗饭。"},
    wu:{country:'wu',place:'jianye',id:'zhouyu',name:'周瑜',art:'zhouyu',side:'left',
      welcome:["门吏报你来了，我便知那夜非梦。三位仙长所托，公瑾记着。主公尚在外接应乡民，由我留守建业。一路水陆，可还顺利？","江东来投的乡亲日多，渡口、城内都需人手。诸位访得愿来江东的将士，请代传一信，引来此处。复命时，谢仪也一并领去。"],
      thanks:"姓名都已录下，人也见过了，确是可用之才。谢仪请收，江东虽忙，总不能叫奔走的人空着行囊再上路。",
      idle:"上回引荐的，已入册，谢仪也结清了。再有贤士肯来，仍在此处报知，我遣人相迎。"}
  };
  const npc=country=>{const d=definitions[country];return d?{id:d.id,name:d.name,art:d.art,side:d.side,place:d.place,country,role:'court',roleLabel:'招贤'}:null;};
  const at=place=>npc(Object.keys(definitions).find(c=>definitions[c].place===place));
  const api={definitions,rulers,rulerStatus,rewardPerHero,npc,at};root.FactionCourts=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
