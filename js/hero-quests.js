(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,G=node?require('./character-growth.js'):root.CharacterGrowth,W=node?require('./weapon-skills.js'):root.WeaponSkills,I=node?require('./items.js'):root.ItemCatalog;
 const talk=(...rows)=>({turns:rows.map(([speaker,text])=>({speaker,text})),lines:rows.map(row=>row[1])});
 const definition={id:'ganning',name:'甘宁',title:'江上锦帆',category:'story',recommendedLevel:10,country:'wu',place:'xinye',start:'rumor',stages:{
  locked:{objective:''},
  rumor:{objective:'前往新野查探消息',npc:{id:'ganning-neighbor',name:'街坊',art:'villager',...talk(
   ['hero',"大叔，衙门门口怎么围着这么多人？出了什么事？"],
   ['npc',"抓了个水匪，叫甘宁。你瞧过江船没有？穿锦衣、挂铃铛的那伙，就是他的人。"],
   ['hero','我听过甘宁的名字。不过他不是一直在江上活动吗，怎么会在新野被抓住？'],
   ['npc',"说是来受招安的，进衙门就给拿下了。县尉跟他有旧怨吧？我也是听人传，牢门那儿总比这儿知道得清楚。"]),choices:[{label:'去衙门打听',next:'gate'}]}},
  gate:{objective:'向新野狱卒打听探监的办法',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,...talk(
   ['hero',"官爷，我来探望甘宁。劳烦通融，让我们见上一面。"],
   ['npc',"不见！县尉有令，甘宁不得会客。你等到换班也没用。"],
   ['hero',"只说几句话，不领人走。要办什么手续，你指点一下。"],
   ['npc',"这时候见他，手续可不好办。上头怪罪下来，我也吃罪不起。不过……茶钱若是备着，我倒能领你进去一会儿。"]),choices:[{label:'打点狱卒',price:100,next:'prison'}]}},
  prison:{strictDialogue:true,sceneId:'county-prison',objective:'进牢探望甘宁',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,...talk(
   ['npc',"找我的？不认得你。是哪个弟兄托你来的？"],
   ['hero',"街上听见你的名字，我就来了。听说你是来受招安的，怎么坐进了牢里？"],
   ['npc',"县尉说，给我和弟兄们找个正经出路。我便带人赴宴了。酒没喝完，刀架到脖子上——这顿招安酒，可真够贵的。"],
   ['hero',"门外的人早埋伏好了？他从头就没打算招安。"],
   ['npc',"前阵子我扣过他一条官船，里头装的东西见不得光。他拿招安骗我，又逼我认下劫村的罪。等我死了，船上的事便没人再提。"],
   ['hero',"外面还没贴问斩的告示。我出去打听，你等着，别先跟他们拼命。"],
   ['npc',"肯来见我，便谢你这份情。不过那条官船的事，别叫县尉知道是我说的。我栽一回也罢，可别再搭上你。"]),choices:[{label:'出牢查看消息',next:'notice'}]}},
  notice:{objective:'查看新野衙门外的新告示',npc:{id:'ganning-notice',name:'告示牌',icon:'任务',...talk(
   ['npc','新野县衙告示：甘宁因聚众劫掠已被关押，定于三日后处斩。各处守卫须严加看守，禁止私自放行。'],
   ['hero',"三日后？连审都省了。得再找那个狱卒，他既肯收钱，总有门路。"]),choices:[{label:'商量救人办法',next:'plan'}]}},
  plan:{objective:'选择赎人，或强闯新野牢房',npc:{id:'ganning-jailer',name:'狱卒',art:'imperial-soldier',observe:true,...talk(
   ['hero',"告示我看见了，三日后问斩。真要救人出来，还有没有路可走？"],
   ['npc',"你还当真了？领你见一面，我敢。私放死囚，那可是拿我这颗脑袋换！"],
   ['hero',"哪条路能走，要多少钱，你说个实数。若还是只许进去看一眼，就不必了。"],
   ['npc',"管事的能把名册改作病死，夜里再放人。只是他的胃口，可不是几文茶钱能填的。你快些定，过了刑期，神仙也领不走。"]),choices:[{label:'重金赎人',price:5000,next:'freed'},{label:'强闯衙门',battle:'breach'}]}},
  breach:{objective:'击退新野衙门守卫',npc:{id:'ganning-guard',name:'官兵队长',art:'imperial-soldier',observe:true,...talk(['npc',"关门！有人劫狱！去后院叫人，别叫他们绕过去！"]),choices:[{label:'闯入外院',battle:'breach'}]}},
  cell:{objective:'突破牢房守卫，救出甘宁',npc:{id:'ganning-cell-guard',name:'牢房守卫',art:'imperial-soldier',observe:true,...talk(['npc',"站住！再过来一步，老子先宰了里头的！"],['hero',"拦住他！钥匙在他腰上，别让他退回牢里！"]),choices:[{label:'夺取牢房',battle:'cell'}]}},
  freed:{objective:'与甘宁商议去留',npc:{id:'ganning',name:'甘宁',art:'ganning',observe:true,...talk(
   ['npc','你居然真的把我救出来了。你走了那么久，我还以为外头出了事，或者你听说了我的底细，不肯再回来帮忙了。'],
   ['hero','我答应出去想办法，当然得回来告诉你结果。现在人平安出来了，你有没有地方能去，弟兄们还找得到吗？'],
   ['npc','我得先给他们送个消息，免得他们也闯进来送死。之后想去建业拜见孙将军，问问他肯不肯收我们。这次我会先把话问清楚，不会再傻乎乎地直接去喝酒了。'],
   ['hero','我们也准备去各地走走，找愿意一起对付董卓的人。你想去江东的话，可以先跟着我们，到了建业再一起去拜见孙将军。'],
   ['npc','好，我先托人告诉弟兄们，让他们去江边等消息。你们现在方便的话，我就一起走；人手已经够了，我先去建业，往后你们也能在那里找到我。']),choices:[{label:'留下同行',recruit:true},{label:'先去建业',recruit:false}]}},
  complete:{objective:'甘宁已脱困，愿为吴国效力'}
 },battles:{breach:{stage:['plan','breach'],next:'cell',title:'新野衙门',sceneId:'market-street',count:4},cell:{stage:['cell'],next:'freed',title:'牢房突围',sceneId:'county-prison',count:5}}};
 const definitions={ganning:definition};
 function place(id,state){const d=definitions[id];return d?.stages[state?.stage]?.place||d?.place;}
 function normalize(value={},unlocked=false){return Object.fromEntries(Object.values(definitions).map(d=>{const old=value?.[d.id]||{},stage=Object.hasOwn(d.stages,old.stage)?old.stage:unlocked||d.requiresChangshan===false?d.start:'locked';return [d.id,{stage,heard:!!old.heard,accepted:old.accepted??(!!old.stage&&old.stage!=='locked'&&old.stage!==d.start),...(old.offerAccepted?{offerAccepted:true}:{}),...(old.puzzle?{puzzle:old.puzzle}:{})}];}));}
 function npc(id,state){const d=definitions[id],n=d?.stages[state?.stage]?.npc;return n?{...n,sceneId:d.stages[state.stage].sceneId,heroQuest:id,side:n.side||'left',role:'heroQuest',roleLabel:'剧情'}:null;}
 function companion(currentLevel=1){const weapon=I.create('weapon-blade','green','ganning-blade');return {...G.create('ganning',currentLevel),id:'ganning',name:'甘宁',characterId:'ganning',homeNode:'jianye',experience:0,experienceVersion:2,weaponPlanVersion:3,weapon,skills:W.forWeapon(weapon),priorities:W.prioritiesFor(W.forWeapon(weapon)),equipment:{armor:I.create('leather-armor','green','ganning-armor'),accessory1:null,accessory2:null},armor:4,resistance:3,passives:['ganning-brocade']};}
 function enemies(count){return Array.from({length:count},(_,i)=>{const captain=i===0,weapon=I.create('weapon-'+(captain?'shield':'spear'),'white','jail-weapon-'+i),skills=captain?['shield-taunt','spear-cut']:['spear-cut'];return {...G.create(captain?'imperialCaptain':i%2?'imperialPikeman':'imperialSoldier',10),id:'jail-guard-'+i,name:captain?'官兵队长':'官兵',formationRow:captain?'front':'back',characterId:'imperial-soldier',weapon,attack:weapon.power,equipment:{armor:I.create('leather-armor')},armor:6,resistance:3,skills,targetRule:'random',priorities:skills.map(skill=>({skill,when:W.skills[skill].scope==='all'?'enemyCount':'always',threshold:2,frequency:W.skills[skill].kind==='buff'?'always':'sometimes'}))};});}
 const api={place,definitions,normalize,npc,companion,enemies};root.HeroQuests=api;if(node)module.exports=api;
})(globalThis);
