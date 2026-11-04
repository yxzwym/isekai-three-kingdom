(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const line=(speaker,text,partner,figure)=>({speaker,text,partner,figure});
  const chapters={
    arrival:{scene:'village',title:'序章 · 陌路',next:'first-fight',lines:[
      line('narrator','你推开便利店的门，低头拧开饮料。脚下一软，鞋底竟陷进了泥里。',null),
      line('hero','……我刚才不是在店门口吗？',null),
      line('narrator','身后没有便利店。只有土路、茅屋，还有几个穿甲的人，正往车上搬粮。',null),
      line('imperial-soldier','松手！军中征粮，听不懂？','imperial-soldier'),
      line('narrator','一个老人被推到你跟前。你下意识扶住他，抬头想问路。','imperial-soldier'),
      line('hero','这是哪儿？你们……','imperial-soldier'),
      line('imperial-soldier','谁让你碰他的？一伙的？','imperial-soldier'),
      line('hero','什么一伙的？我就是路过。','imperial-soldier'),
      line('imperial-soldier','穿得古里古怪，问你话还装傻。拿下！','imperial-soldier'),
      line('hero','等一下！别动手——','imperial-soldier')
    ]},
    aftermath:{scene:'village',title:'序章 · 援手',next:'manual-fight',lines:[
      line('narrator','胸口一阵闷痛。你摔进泥里，想撑起身，胳膊却使不上力。','imperial-soldier'),
      line('hero','我招谁惹谁了……','imperial-soldier'),
      line('imperial-soldier','把这个也带走。','imperial-soldier'),
      line('zhangjiao','放开他。','zhangjiao'),
      line('narrator','一只手拦住了官兵。来人俯下身，把你扶到路边。','zhangjiao'),
      line('zhangjiao','哪里伤着了？能喘气么？','zhangjiao'),
      line('hero','能。就是疼。','zhangjiao'),
      line('zhangjiao','方才那老人快摔倒，旁人都躲，只有你伸了手。自己没半分武艺，还肯护着人，我很佩服。','zhangjiao'),
      line('hero','我都没弄明白怎么回事，他们就打过来了。','zhangjiao'),
      line('imperial-soldier','少在那儿装好人！你也想挨打？','imperial-soldier'),
      line('zhangjiao','在这里歇着。我去去便来。','zhangjiao'),

    ]},
    reinforcements:{scene:'village',title:'序章 · 并肩',next:'prepare',lines:[
      line('imperial-soldier','有妖人！快叫人来！','imperial-soldier','imperial-soldier'),
      line('narrator','路口脚步声骤密。又一队官兵赶来，封住了村道。','zhangjiao','zhangjiao'),
      line('zhangliang','大哥！我们听见这边有动静。','zhangliang','zhangliang'),
      line('zhangbao','百姓已经往后撤了。这里交给我们。','zhangbao','zhangbao'),
      line('zhangjiao','二弟，三弟，护住村口，别追得太远。','zhangjiao','zhangjiao'),
      line('hero','你们三个，真打得过？','zhangjiao'),
      line('zhangjiao','你先去路边歇着。乡亲们还没走远，得守住这条路。','zhangjiao'),

    ]},
    camp:{scene:'camp',title:'序章 · 黄天之下',next:'complete',lines:[
      line('narrator','官兵丢下粮袋，退得比来时还快。入夜前，你跟着三人到了山脚的营地。','zhangjiao','zhangjiao'),
      line('zhangliang','粮先送去伙房。有孩子的几家，今晚多添一碗。','zhangliang','zhangliang'),
      line('hero','这些粮，不留给你们自己？','zhangjiao','zhangjiao'),
      line('zhangjiao','兵也是人。让百姓饿着，自己吃饱，我们与刚才那些人又有什么分别？','zhangjiao'),
      line('hero','还没问你叫什么。我叫{name}。','zhangjiao'),
      line('zhangjiao','张角。这是我的二弟张宝、三弟张梁。','zhangjiao'),
      line('hero','……张角？太平道那个张角？','zhangjiao'),
      line('zhangjiao','你听过我？','zhangjiao'),
      line('hero','听过一点。现在……是哪一年？','zhangjiao'),
      line('zhangjiao','光和七年。怎么了？','zhangjiao'),
      line('narrator','光和七年。张角。营外那些黄巾。你握了握手里早已不凉的饮料瓶。不是拍戏，也不是做梦。','zhangjiao'),
      line('hero','你们聚这么多人，到底想做什么？','zhangjiao'),
      line('zhangjiao','今日你也看见了。田是百姓耕的，粮却进了豪门的仓。灾年卖儿卖女，官府还来催租。','zhangjiao'),
      line('zhangjiao','我想换个活法。没有乡绅贵族压在头上，也不凭门第分人的高低。耕田的人有饭吃，老弱有人照料。','zhangjiao'),
      line('hero','你是说……大同？','zhangjiao'),
      line('zhangjiao','正是。天下该是天下人的天下。若这也做不到，谈什么太平。','zhangjiao'),
      line('zhangjiao','你若无处可去，就留下。你肯护着百姓，我们便是同路人。','zhangjiao'),
      line('hero','……那我先留下。伤还疼着，也走不远。','zhangjiao'),
      line('narrator','张角笑了，给你让出火边的位置。你望着营中分粥的人，又看了看他。','zhangjiao'),
      line('hero','（我这是穿越了。可到底穿进哪本野史里了？）','zhangjiao')
    ]}
  };
  const stages=['arrival','first-fight','aftermath','manual-fight','reinforcements','prepare','squad-fight','camp','complete'];
  function checkpoint(value={}){value=value&&typeof value==='object'?value:{};const stage=stages.includes(value.stage)?value.stage:'arrival',lines=chapters[stage]?.lines;return {stage,index:lines?Math.max(0,Math.min(lines.length-1,Math.floor(Number(value.index)||0))):0,preparation:clone(value.preparation&&typeof value.preparation==='object'?value.preparation:{})};}
  function assets(id,appearance){
    if(id==='hero'){const a=root.PengpaiAssets?.protagonists[appearance];return a?{fullbody:{src:a.src},portrait:{src:a.src,crop:a.portrait}}:{};}
    return root.CharacterAssets?.manifest.characters[id]?root.CharacterAssets.resolve(id):{};
  }
  const W=typeof module!=='undefined'&&module.exports?require('./weapon-skills.js'):root.WeaponSkills;
  const skills=W.skills;
  function hero(character){return {id:'hero',name:character.name,...character.attributes,...assets('hero',character.appearance),weapon:null,attack:1,armor:0,resistance:0,maxSoldiers:1,startSoldiers:1,skills:['punch'],priorities:[{skill:'punch',when:'always'}]};}
  function general(id){
    const data={
      zhangjiao:{name:'张角',war:90,intelligence:95,leadership:95,speed:90,technique:90,maxSoldiers:200,attack:100,armor:70,resistance:70,weapon:{type:'staff',id:'fire-god-staff',name:'火神杖',school:'thunder'},skills:['staff-shock','staff-storm'],passives:['thunder-lord'],priorities:[{skill:'staff-storm',when:'enemyCount',threshold:3},{skill:'staff-shock',when:'always'}]},
      zhangbao:{name:'张宝',war:85,intelligence:90,leadership:90,speed:90,technique:90,maxSoldiers:200,attack:100,armor:60,resistance:65,weapon:{type:'talisman',name:'太平符'},skills:['talisman-clear','talisman-rain'],priorities:[{skill:'talisman-rain',when:'healThresholds',selfThreshold:.85,allyThreshold:.85},{skill:'talisman-clear',when:'enemyCount',threshold:2,disabled:true}]},
      zhangliang:{name:'张梁',war:100,intelligence:80,leadership:95,speed:90,technique:90,maxSoldiers:200,attack:75,armor:90,resistance:50,weapon:{type:'spear',name:'铁枪'},skills:['spear-break','spear-stun'],priorities:[{skill:'spear-break',when:'enemyCount',threshold:2},{skill:'spear-stun',when:'always'}]}
    };
    const u={id,level:1,...clone(data[id]),...assets(id)};u.weaponProficiencies={[u.weapon.type]:100};u.equipment={armor:{name:id==='zhangliang'?'铁甲':'道袍'}};return u;
  }
  function soldier(i,max=200){
    const profiles=[{war:100,speed:70,group:2,target:'lowestCurrent'},{war:90,speed:95,group:4,target:'lowestCurrent'},{war:96,speed:80,group:3,target:'random'},{war:85,speed:110,group:4,target:'random'}],p=profiles[Math.max(0,i-1)%profiles.length];
    return {id:'soldier-'+i,name:'官兵',...assets('imperial-soldier'),war:p.war,intelligence:80,leadership:90,speed:p.speed,technique:80,level:1,weapon:{type:'spear',name:'长枪'},equipment:{armor:{name:'旧铁甲'}},weaponProficiencies:{spear:90},maxSoldiers:max,attack:100,armor:10,resistance:10,skills:['spear-cut','spear-sweep'],priorities:[{skill:'spear-sweep',when:'enemyCount',threshold:p.group},{skill:'spear-cut',when:'always'}],targetRule:p.target};
  }
  function createBattle(stage,character,preparation={}){
    const basic={id:stage,title:'村道交锋',scene:{background:'./assets/story/village-road.png'},skills:clone(skills),rules:{level:1,enemyLevel:1,allySp:0,random:false,critical:false,hit:false,seed:'prologue-'+stage}};
    if(stage==='first-fight')return {...basic,title:'陌路冲突',allies:[{...hero(character),initialMode:'manual'}],enemies:[{...soldier(1,200),war:100,speed:50}],rules:{...basic.rules,random:false,critical:false,hit:false}};
    if(stage==='manual-fight'){const j=general('zhangjiao');j.passives=['thunder-lord-tutorial'];return {...basic,title:'一杖退敌',hint:'点击技能，再选择敌人',control:{manualOnly:true,lockTactics:true},allies:[j],enemies:[soldier(1,200)]};}
    if(!['prepare','squad-fight'].includes(stage))throw new TypeError('未知序章战斗');
    const allies=['zhangjiao','zhangbao','zhangliang'].map(id=>{const u=general(id),saved=preparation[id];if(id==='zhangjiao')u.passives=['thunder-lord-tutorial'];if(saved){if(['manual','auto'].includes(saved.mode))u.initialMode=saved.mode;if(Array.isArray(saved.rules))u.priorities=saved.rules.filter(r=>u.skills.includes(r.skill));u.targetRule=saved.targetRule;}return u;});
    const captain={...soldier(0,360),id:'captain',name:'官兵队长',war:105,speed:85,attack:550,armor:40,...assets('imperial-captain'),weapon:{type:'blade',name:'军刀'},equipment:{armor:{name:'旧铁甲'},offhand:{type:'shield',name:'木盾'}},weaponProficiencies:{blade:90,shield:90},skills:['shield-taunt','blade-cut','blade-sweep'],priorities:[{skill:'shield-taunt',when:'always'},{skill:'blade-sweep',when:'enemyCount',threshold:4},{skill:'blade-cut',when:'always'}],targetRule:'random'};
    return {...basic,title:'黄巾并肩',preparationHint:'点击人物头像，可配置技能释放设置',scene:{...basic.scene,enemyFormation:{back:[1,2,3,4],front:[0]}},allies,enemies:[captain,...Array.from({length:4},(_,i)=>soldier(i+1))]};
  }
  function preparationOf(battle){return Object.fromEntries(battle.units.filter(u=>u.side==='ally').map(u=>[u.id,{mode:u.mode,rules:clone(u.priorities),targetRule:u.targetRule}]));}
  const api={chapters,stages,checkpoint,createBattle,preparationOf,assets,general};root.PengpaiPrologue=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
