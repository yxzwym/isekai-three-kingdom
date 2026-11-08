(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,Cast=node?require('./chapter-cast.js'):root.ChapterCast,C=node?require('./recruitment-content.js'):root.RecruitmentContent,H=node?require('./hero-quests.js'):root.HeroQuests;
 if(node)require('./chapter-recruitment.js');
 const stages=['gather','rally','vanguard','garrison','gate','street','advisor','dongzhuo','aftermath','complete'];
 const normalize=value=>({stage:stages.includes(value?.stage)?value.stage:'gather',accepted:!!value?.accepted,endingIndex:Math.max(0,Math.min(20,Math.floor(Number(value?.endingIndex)||0)))});
 const W=node?require('./weapon-skills.js'):root.WeaponSkills,G=node?require('./character-growth.js'):root.CharacterGrowth,I=node?require('./items.js'):root.ItemCatalog;
 const phases={
  vanguard:{title:'关前先锋',sceneId:'rural-road',next:'garrison',speaker:'huaxiong',lines:['各路人马终于到齐了？那就别再说什么借路，想进洛阳，先打赢我华雄。后面的兵都站好了，今天谁也不许往回跑！'],roster:[['huaxiong','front'],['soldier','back'],['soldier','back']]},
  garrison:{title:'陷阵守军',sceneId:'city-frontier',next:'gate',speaker:'gaoshun',lines:['前面退下来的人到我身后集合，受伤的先撤进去。弩手看住两侧，别为了追一个人跑出去，把关门前的阵势守好！'],roster:[['gaoshun','front'],['crossbow','back'],['crossbow','back']]},
  gate:{title:'温侯拦关',sceneId:'city-frontier',next:'street',speaker:'lvbu',lines:['我知道你们迟早会来。太师最近确实有些反常，我也想问个明白，可我还守着这道门。你们想过去，先拿出本事让我看看。'],roster:[['lvbu','front'],['soldier','back'],['soldier','back']]},
  street:{title:'洛阳街垒',sceneId:'market-street',next:'advisor',speaker:'lijue',lines:['街口都让他们打进来了，再退就只剩太师府了！郭汜，你带人看住右边的小巷，别让他们从屋后绕过去，我们在这里把人拦住！'],roster:[['lijue','front'],['guosi','front'],['assassin','back']]},
  advisor:{title:'府前毒阵',sceneId:'city-north',next:'dongzhuo',speaker:'liru',lines:['外面的守军居然没能拦住你们，看来我得亲自招待了。院门已经关好，几位既然进来了，就在这里多待一会儿，别急着去见董太师。'],roster:[['guard','front'],['guard','front'],['liru','back']]},
  dongzhuo:{title:'太师府决战',sceneId:'city-north',next:'aftermath',speaker:'dongzhuo',lines:['一路打到这里，就以为我只能坐着等你们来问话？既然都来了，谁也别想再轻轻松松走出去，进来让我看看你们的本事！'],roster:[['dongzhuo','front']]}
 };
 function mob(role,index){const type={soldier:'spear',crossbow:'crossbow',assassin:'dagger',guard:'shield'}[role],weapon=I.create('weapon-'+type,'blue','luoyang-'+role+'-'+index),skills=role==='soldier'?['spear-cut']:role==='crossbow'?W.forWeapon(weapon).slice(0,1):role==='assassin'?W.forWeapon(weapon).slice(0,1):['shield-taunt','spear-cut'];return {...G.create(role==='guard'?'imperialCaptain':role==='crossbow'?'imperialSkirmisher':'imperialGuard',15),id:'luoyang-'+role+'-'+index,name:{soldier:'西凉军士',crossbow:'西凉弩手',assassin:'府中刺客',guard:'府前护卫'}[role],characterId:role==='assassin'?'thief':'imperial-soldier',weapon,skills,priorities:W.prioritiesFor(skills),equipment:{armor:I.create('iron-armor','blue')},weaponProficiencies:{[type]:75},armor:10,resistance:8,targetRule:'random'};}
 function battleGear(u,role){const defensive=role==='guard'||role==='gaoshun',arcane=role==='liru';return {...u,weapon:{...u.weapon,power:arcane?40:role==='lvbu'?45:38},equipment:{...u.equipment,armor:{uid:'luoyang-armor-'+role,id:'luoyang-armor',name:defensive?'陷阵重甲':'西凉战甲',slot:'armor',quality:'blue',attributes:{constitution:defensive?65:45,armor:defensive?95:60,resistance:arcane?60:18}},accessory1:{uid:'luoyang-seal-'+role,id:'luoyang-seal',name:'西凉军印',slot:'accessory',quality:'blue',attributes:{war:arcane?0:20,intelligence:arcane?30:0,technique:25}},accessory2:u.equipment?.accessory2}};}
 function enemies(phase){if(phase==='dongzhuo')return [(node?require('./dongzhuo-boss.js'):root.DongzhuoBoss).unit()];return phases[phase].roster.map(([id,row],i)=>{let u=battleGear(Cast.definitions[id]?Cast.unit(id,15,{boss:true}):mob(id,i),id);if(id==='liru'){
    u.weapon={...u.weapon,skills:[{name:'封息毒雾',kind:'tactic',side:'enemy',scope:'all',element:'wood',cooldown:3.5,scaling:{intelligence:.7},weaponCoefficient:1,hitChance:.9,criticalChance:0,effects:[{id:'poison',chance:1,duration:14,period:1,base:8,coefficient:.24,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }else if(id==='huaxiong'){
    u.weapon={...u.weapon,skills:[{base:'sword-eagle',name:'裂阵重斩',hitChance:.8,effects:[{id:'bleed',chance:.75,duration:10,period:1,base:3,coefficient:.15,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }else if(id==='assassin'){
    u.weapon={...u.weapon,skills:[{base:'spear-cut',name:'淬毒刺',hitChance:.8,effects:[{id:'poison',chance:.75,duration:12,period:1,base:5,coefficient:.2,stat:'technique'}]}]};u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);
   }
   return {...u,boss:true,statusImmunities:[...new Set([...(u.statusImmunities||[]),'stun'])],id:'chapter-'+id+'-'+i,formationRow:row};});}
 function npc(world){if(world.state.nodeId!=='luoyang'||world.state.chapterOne.stage==='complete')return null;return {id:'luoyang-scout',name:'联军斥候',art:'imperial-soldier',role:'chapter',roleLabel:'讨董',side:'left'};}
 function quest(world){const q=world.state.chapterOne;if(!world.coalitionReady()&&!q.accepted&&q.stage!=='complete')return null;return {id:'chapter-one',title:'第一章 · 洛阳风起',category:'main',recommendedLevel:q.stage==='dongzhuo'?25:20,accepted:true,complete:q.stage==='complete',taskStatus:q.stage==='complete'?null:world.coalitionReady()?'ready':'active',target:'luoyang',objective:q.stage==='complete'?'第一章结束':q.stage==='aftermath'?'查看董卓恢复意识后发生的情况':['gather','rally'].includes(q.stage)?'前往洛阳，和联军斥候商量进攻安排':'击破'+(phases[q.stage]?.title||'洛阳守军')};}
 const ending=[
  {id:'hero',name:null,art:'hero',side:'right',text:'大家先停一下！刚才董卓身后有个人影，你们看见没有？它像是从他身上钻出来，然后一下就不见了。'},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:'我这是在洛阳？你们是什么人，怎么都站在这里……那盏灯先拿开一点，晃得我什么都看不清。'},
  {id:'hero',name:null,art:'hero',side:'right',text:'你刚才还在跟我们交手，现在却问我们是谁？城外的粮仓是你下令烧的，被抓的百姓也是你的人关的，你都不记得了吗？'},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:'有些事情我记得，可像是在旁边看着，身体怎么都动不了。那个人借着我的嘴下令，我想喊人住手，连一句话也说不出来。'},
  {id:'hero',name:null,art:'hero',side:'right',text:'所以刚才跑掉的那个人影，一直在控制你？你有没有听见它说过什么，或者知道它准备去哪里？'},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:'我想不起来。最后能清楚记得的，是进太庙那一天，后面就只剩断断续续的事了。你们不放心可以先收走兵器，但外头的兵不能再乱下令了。'},
  {id:'hero',name:null,art:'hero',side:'right',text:'刀先交给我们。你现在叫还能听令的人停手，把百姓放出来，再打开粮仓救急。等城里安顿好，我们再一起查到底发生了什么。'},
  {id:'dongzhuo',name:'董卓',art:'dongzhuo',side:'left',text:'我会照办，现在就派人出去传令。等这些事安排好，我也想跟你们去查。有人控制我做了这么多事，我不能就这样装作什么都不知道。'}
 ];
 const api={normalize,Cast,phases,enemies,npc,quest,ending};root.ChapterOne=api;if(node)module.exports=api;
})(globalThis);
