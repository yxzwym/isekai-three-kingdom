(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;if(node)require('./recruitment-challenges.js');const H=node?require('./hero-quests.js'):root.HeroQuests;
 const replacements={
 '你帮忙看着车头，我去拦后面的两个人。大叔，趁他们过不来，先把牛牵进院子，别让刀碰着它。':'这些粮是乡亲们省下来的种子，你们一袋也别想拿走。大叔，把牛牵回去，这里有我。',
 '我守着这边。你也小心墙边那个人，他手藏在衣服里，应该还带着刀，别让他绕到你背后。':'他已经把刀抽出来了。既然道理说不通，我们帮你把粮留下。',
 '前面还有老人和孩子，别让他们跑进人群里。你帮我拦左边，我去拉住那辆车，先把这几个人分开。':'病人还在里面，你们也要抢？药车的账还没算，今天就一并说清楚！',
 '昨晚就是他们抢了药车，今天还敢来。这位朋友，帮我守住门口，铺里还有病人，不能让他们冲进去。':'昨晚抢走药车，今天又来砸医馆。乡亲们已经让到这个地步，你们还不肯罢手？',
 '你带熟路的人守住寨口，我们去接药车。这次大家一起做，不用再争谁比谁能打。':'药是给寨里救急的，不能在这里耽搁。你熟悉山路，我们跟着你走。',
 '我带人去扶后面的伤兵，你先守住路口。等他们都退过来了，我们再往岸边走，不能把伤者留在那里。':'有人中箭了！先把伤者扶起来，芦苇里的人又在拉弓，大家当心！'
 };
 const endings={zhangfei:'往后有仗，记得叫俺！跟你们一起办事痛快。酒俺会少喝，若再犯浑，你就当面说，俺不跟你急。',guanyu:'父母在成都有了照应，我也能放心上路。这一路欠你不少人情，今后遇到难处，尽管来叫我。',xuchu:'村里的粮和人都安顿好了，我也没什么放不下的。你们叫我一声，我提上锤子就走。',huangzhong:'别嫌老夫年纪大。这张弓还拉得开，走起路来也不输年轻人。你们愿意带上我，我就陪你们再跑一趟。',maliang:'我弟弟的事已经有人照看，医馆也交接妥当了。我愿意同行，路上的账目和药材都可以交给我。',lusu:'粮车已经送到，我留下的人也知道后面该怎么办。你们要走，我便一同去，沿途缺什么，我们再想办法筹措。',jiaxu:'这里已经安排妥当，曹公那边也该回个信了。路上的事我可以替你多想几步，至于听不听，你自己拿主意。',zhangjiao:'营里的事已经交代给弟兄们。你既然还愿意为这些乡亲奔走，我也该跟你出去看看。',huatuo:'留下的大夫已经接过诊簿，病人的药也都备齐了。我跟你们走，路上碰见需要看伤的人，也好帮上一把。'};
 for(const [id,d]of Object.entries(H.definitions)){for(const stage of Object.values(d.stages)){const npc=stage.npc;if(!npc)continue;for(const turn of npc.turns||[]){turn.text=replacements[turn.text]||turn.text;const speaker=turn.speaker==='npc'?npc.id:turn.speaker;if(speaker==='zhangfei')turn.text=turn.text.replace(/我们/g,'俺们').replace(/我/g,'俺');}}
 if(endings[id]&&d.stages.freed?.npc){const npc=d.stages.freed.npc,turn=(npc.turns||[]).find(t=>t.speaker==='npc');if(turn)turn.text=endings[id];}}
 const api={version:1};root.DialogueVoices=api;if(node)module.exports=api;
})(globalThis);
