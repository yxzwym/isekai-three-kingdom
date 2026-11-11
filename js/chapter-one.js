(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,Cast=node?require('./chapter-cast.js'):root.ChapterCast,C=node?require('./recruitment-content.js'):root.RecruitmentContent,H=node?require('./hero-quests.js'):root.HeroQuests;
 if(node)require('./chapter-recruitment.js');
 const stages=['gather','rally','vanguard','garrison','gate','street','advisor','dongzhuo','aftermath','complete'];
 const normalize=value=>({stage:stages.includes(value?.stage)?value.stage:'gather',accepted:!!value?.accepted,endingIndex:Math.max(0,Math.min(20,Math.floor(Number(value?.endingIndex)||0)))});
 const W=node?require('./weapon-skills.js'):root.WeaponSkills,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog;
 const phases={
  vanguard:{title:'关前先锋',sceneId:'rural-road',next:'garrison',speaker:'huaxiong',lines:["华雄在此！借路进洛阳？先过我这一关！后队列阵，谁敢退，军法伺候！"],roster:[['huaxiong','front'],['soldier','back'],['soldier','back']]},
  garrison:{title:'陷阵守军',sceneId:'city-frontier',next:'gate',speaker:'gaoshun',lines:["退下的收拢到我身后，伤兵入关！弩手看住两翼，不准追，守住关门！"],roster:[['gaoshun','front'],['crossbow','back'],['crossbow','back']]},
  gate:{title:'温侯拦关',sceneId:'city-frontier',next:'street',speaker:'lvbu',lines:["你们终于来了。太师近来如何，我也有话要问。可这道关，眼下仍由我守。想过，便拿出本事。"],roster:[['lvbu','front'],['soldier','back'],['soldier','back']]},
  street:{title:'洛阳街垒',sceneId:'market-street',next:'advisor',speaker:'lijue',lines:["再退便是太师府！郭汜，封右巷，别叫他们绕到屋后。街口给我守住！"],roster:[['lijue','front'],['guosi','front'],['assassin','back']]},
  advisor:{title:'府前毒阵',sceneId:'city-north',next:'dongzhuo',speaker:'liru',lines:["倒真闯到这里来了。关上院门。几位不妨多留片刻，太师那边，我自会去报。"],roster:[['guard','front'],['guard','front'],['liru','back']]},
  dongzhuo:{title:'太师府决战',sceneId:'city-north',next:'aftermath',speaker:'dongzhuo',lines:["杀到府门，就以为能来问我的罪？进来！让我瞧瞧，是谁给你们的胆！"],roster:[['dongzhuo','front']]}
 };
 function mob(role,index){const type={soldier:'spear',crossbow:'crossbow',assassin:'dagger',guard:'shield'}[role],weapon=I.create('weapon-'+type,'blue','luoyang-'+role+'-'+index),skills=role==='soldier'?['spear-cut']:role==='crossbow'?W.forWeapon(weapon).slice(0,1):role==='assassin'?W.forWeapon(weapon).slice(0,1):['shield-taunt','spear-cut'];return {...G.create(role==='guard'?'imperialCaptain':role==='crossbow'?'imperialSkirmisher':'imperialGuard',15),id:'luoyang-'+role+'-'+index,name:{soldier:'西凉军士',crossbow:'西凉弩手',assassin:'府中刺客',guard:'府前护卫'}[role],characterId:role==='assassin'?'thief':'imperial-soldier',weapon,skills,priorities:W.prioritiesFor(skills),equipment:{armor:I.create('iron-armor','blue')},armor:10,resistance:8,targetRule:'random'};}
 function battleGear(u,role){const defensive=role==='guard'||role==='gaoshun',arcane=role==='liru';return {...u,weapon:{...u.weapon,power:role==='lvbu'?20:18},equipment:{...u.equipment,armor:{uid:'luoyang-armor-'+role,id:'luoyang-armor',name:defensive?'陷阵重甲':'西凉战甲',slot:'armor',quality:'blue',attributes:{constitution:defensive?65:45,armor:defensive?95:60,resistance:arcane?60:18}},accessory1:{uid:'luoyang-seal-'+role,id:'luoyang-seal',name:'西凉军印',slot:'accessory',quality:'blue',attributes:{war:arcane?0:5,intelligence:arcane?5:0,technique:8}},accessory2:u.equipment?.accessory2}};}
 function enemies(phase){if(phase==='dongzhuo')return [(node?require('./dongzhuo-boss.js'):root.DongzhuoBoss).unit()];return phases[phase].roster.map(([id,row],i)=>{let u=battleGear(Cast.definitions[id]?Cast.unit(id,15,{boss:true}):mob(id,i),id);if(id==='lvbu'){
    u.weapon=W.resolveWeapon(u.weapon);u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }else if(id==='liru'){
    u.weapon={...u.weapon,skills:[{name:'封息毒雾',kind:'tactic',side:'enemy',scope:'all',element:'wood',cooldown:3.5,scaling:{intelligence:.7},weaponCoefficient:1,hitChance:.9,criticalChance:0,effects:[{id:'poison',chance:1,duration:14,period:1,base:3,coefficient:.14,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }else if(id==='huaxiong'){
    u.weapon={...u.weapon,skills:[{base:'sword-eagle',name:'裂阵重斩',hitChance:.8,effects:[{id:'bleed',chance:.75,duration:10,period:1,base:2,coefficient:.12,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }else if(id==='assassin'){
    u.weapon={...u.weapon,skills:[{base:'spear-cut',name:'淬毒刺',hitChance:.8,effects:[{id:'poison',chance:.75,duration:12,period:1,base:2,coefficient:.12,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }
   return {...u,boss:true,statusImmunities:[...new Set([...(u.statusImmunities||[]),'stun'])],id:'chapter-'+id+'-'+i,formationRow:row};});}
 function npc(world){if(world.state.nodeId!=='luoyang'||world.state.chapterOne.stage==='complete')return null;return {id:'luoyang-scout',name:'联军斥候',art:'imperial-soldier',role:'chapter',roleLabel:'讨董',side:'left'};}
 function quest(world){const q=world.state.chapterOne;if(!world.coalitionReady()&&!q.accepted&&q.stage!=='complete')return null;return {id:'chapter-one',title:'第一章 · 洛阳风起',category:'main',recommendedLevel:q.stage==='dongzhuo'?25:20,accepted:!!q.accepted,complete:q.stage==='complete',taskStatus:q.stage==='complete'?null:world.coalitionReady()?'ready':'active',target:'luoyang',objective:q.stage==='complete'?'第一章结束':q.stage==='aftermath'?'查看董卓恢复意识后发生的情况':['gather','rally'].includes(q.stage)?'前往洛阳，和联军斥候商量进攻安排':'击破'+(phases[q.stage]?.title||'洛阳守军')};}
 const ending=[
  {id:'hero',name:null,art:'hero',side:'right',text:"停手！他身后那道影子，你们瞧见没有？钻出来就不见了！"},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:"这是……洛阳？你们何人？灯挪开些，照得我眼疼。"},
  {id:'hero',name:null,art:'hero',side:'right',text:"刚才还在跟我们打，转眼便不认人？烧粮仓、抓乡民，都是你下的令，你也不认？"},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:"有些记得。我像是站在一旁，眼见自己开口、挥刀，却管不住手脚。想喊，也喊不出。那东西……它借的是我的身子。"},
  {id:'hero',name:null,art:'hero',side:'right',text:"跑掉的那影子，就是它？可听见它说过什么，要往哪里去？"},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:"想不起来。只记得那日去了太庙，后头便断断续续。兵器你们拿去，外头的军令，却得立刻止住。"},
  {id:'hero',name:null,art:'hero',side:'right',text:"刀先交来。传令停兵，放人，开仓。城里安定之后，我们再查太庙的事。在那之前，你哪里也别去。"},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:"来人，照办！……待这些办妥，我也要去查。借我的手做下这许多事，我总得知道，它究竟是谁。"}
 ];
 const api={normalize,Cast,phases,enemies,npc,quest,ending};root.ChapterOne=api;if(node)module.exports=api;
})(globalThis);
