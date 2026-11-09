(function(root){
  'use strict';
  const Scenes=typeof module!=='undefined'&&module.exports?require('./battle-scenes.js'):root.BattleScenes;
  const factions={yellow:{name:'黄巾',color:'#c5a64a'},wei:{name:'魏',color:'#5b91ba'},shu:{name:'蜀',color:'#749766'},wu:{name:'吴',color:'#b86958'},dong:{name:'董卓朝廷',color:'#825a78'},yuan:{name:'袁绍',color:'#a08664'},shuYuan:{name:'袁术',color:'#ad8551'},liu:{name:'刘表',color:'#6d9286'},ma:{name:'马腾',color:'#947559'},zhang:{name:'张鲁',color:'#827aa5'},gongsun:{name:'公孙瓒',color:'#9c9b8c'},neutral:{name:'乡野',color:'#9c927b'}};
  const geography=typeof module!=='undefined'&&module.exports?require('./world-geography.js'):root.WorldGeography,project=geography.project,locationData=typeof module!=='undefined'&&module.exports?require('./world-locations.js'):root.WorldLocations;
  const locate=id=>{const p=locationData.locations[id];if(!p)throw new Error('缺少地理坐标：'+id);return {...p,...project(p.lon,p.lat)};};
  const cityRows=[
    ['xiangping','襄平','gongsun','辽隧'],['beiping','北平','gongsun','徐无'],['ji','蓟','gongsun','涿县'],
    ['nanpi','南皮','yuan','东光'],['zhongshan','中山','yuan','毋极'],['julu','巨鹿','yellow','广宗'],['ganling','甘陵','yuan','广川'],['ye','邺城','yuan','斥丘'],
    ['jinyang','晋阳','yuan','祁县'],['shangdang','上党','yuan','长子'],['pingyuan','平原','yuan','高唐'],['beihai','北海','neutral','都昌'],
    ['langya','琅邪','neutral','莒县'],['xiapi','下邳','neutral','良成'],['guangling','广陵','wu','海陵'],['jibei','济北','wei','卢县'],['puyang','濮阳','wei','顿丘'],
    ['chenliu','陈留','wei','己吾'],['xiaopei','小沛','wei','丰县'],['qiaoxian','谯','wei','城父'],['xuchang','许昌','wei','长社'],['runan','汝南','wei','上蔡'],
    ['henei','河内','dong','温县'],['luoyang','洛阳','dong','偃师'],['hongnong','弘农','dong','陕县'],['changan','长安','dong','蓝田'],['anding','安定','ma','朝那'],['tianshui','天水','ma','上邽'],
    ['wuwei','武威','ma','仓松'],['jincheng','金城','ma','榆中'],['wudu','武都','zhang','河池'],['hanzhong','汉中','zhang','褒中'],['yongan','永安','shu','朐忍'],['zitong','梓潼','shu','涪县'],
    ['chengdu','成都','shu','新都'],['jiangzhou','江州','shu','临江'],['zangke','牂牁','shu','鄨县'],['yuexi','越巂','shu','邛都'],['jianning','建宁','shu','滇池'],['yongchang','永昌','shu','博南'],
    ['wan','宛','wei','博望'],['xinye','新野','liu','棘阳'],['xiangyang','襄阳','liu','宜城'],['jiangxia','江夏','liu','安陆'],['shangyong','上庸','liu','房陵'],['jiangling','江陵','liu','当阳'],
    ['changsha','长沙','liu','浏阳'],['wuling','武陵','liu','汉寿'],['guiyang','桂阳','liu','耒阳'],['lingling','零陵','liu','营道'],
    ['shouchun','寿春','shuYuan','下蔡'],['lujiang','庐江','wu','皖县'],['jianye','建业','wu','秣陵'],['wu','吴','wu','娄县'],['kuaiji','会稽','wu','上虞'],['yuzhang','豫章','wu','新淦'],['jianan','建安','wu','侯官'],
    ['nanhai','南海','neutral','四会'],['hepu','合浦','neutral','徐闻'],['jiaozhi','交趾','neutral','龙编']
  ];
  const mapLayout=typeof module!=='undefined'&&module.exports?require('./world-map-layout.js'):root.WorldMapLayout;
  const places=cityRows.map(([id,name,faction])=>({id,name,kind:'city',faction,...locate(id)}));
  const roads=[],link=(a,b)=>{if(a!==b&&!roads.some(r=>r.includes(a)&&r.includes(b)))roads.push([a,b]);};
  const routes=[
    ['xiangping','beiping','ji','zhongshan','julu','ganling','ye','shangdang','jinyang','anding','jincheng','wuwei'],
    ['ji','nanpi','pingyuan','beihai','langya','xiapi','guangling','jianye','wu','kuaiji','jianan','nanhai','hepu','jiaozhi'],
    ['nanpi','ganling','pingyuan','jibei','puyang','chenliu','xuchang','runan','xinye','xiangyang','jiangling','wuling','lingling','hepu'],
    ['langya','xiaopei','qiaoxian','shouchun','lujiang','yuzhang','changsha','guiyang','nanhai'],
    ['shangdang','henei','luoyang','hongnong','changan','tianshui','jincheng'],
    ['anding','changan','hanzhong','wudu','tianshui'],['hanzhong','shangyong','xiangyang'],
    ['hanzhong','zitong','chengdu','yuexi','jianning','yongchang'],['zitong','jiangzhou','yongan','jiangling','jiangxia','lujiang'],
    ['jiangzhou','zangke','jianning'],['zangke','lingling','guiyang'],['yuzhang','jianan'],['yongan','shangyong'],
    ['ye','puyang'],['ye','henei'],['chenliu','xiaopei','xiapi'],['xuchang','wan','xinye'],['runan','shouchun'],['jiangxia','xinye'],['jiangxia','yuzhang'],['lujiang','jianye'],['wuling','changsha'],['guiyang','jianan']
  ];
  for(const row of routes)for(let i=1;i<row.length;i++)link(row[i-1],row[i]);
  for(const [i,row]of cityRows.entries()){
    const parent=places[i],id=parent.id+'-county';if(locationData.aliases[id])continue;
    places.push({id,name:row[3],kind:'village',faction:parent.faction,parent:parent.id,...locate(id)});link(parent.id,id);
  }
  const extra=(id,name,kind,faction,connections)=>{places.push({id,name,kind,faction,...locate(id)});for(const to of connections)link(id,to);};
  extra('camp','黄巾营地','camp','yellow',['julu','ye']);
  extra('changshan','常山','village','neutral',['camp','zhongshan','jinyang']);
  extra('donglai','东莱','village','neutral',['beihai']);
  extra('hedong','河东','village','neutral',['shangdang','henei','hongnong']);
  extra('tongguan','潼关','pass','dong',['hongnong','changan']);
  extra('hulao','虎牢关','pass','dong',['luoyang','chenliu']);
  extra('jiange','剑门关','pass','shu',['hanzhong','zitong']);
  extra('yiling','夷陵','port','liu',['yongan','jiangling']);
  extra('jiangxia-port','江夏渡口','port','neutral',['jiangxia','yuzhang']);
  extra('chaisang','柴桑','port','neutral',['yuzhang','lujiang']);
  extra('yiyang','义阳','village','neutral',['runan','jiangxia']);
  extra('baima','白马渡','port','wei',['ye','puyang']);
  extra('hangu','函谷关','pass','dong',['luoyang','hongnong']);
  extra('wuzhang','五丈原','village','neutral',['changan','tianshui']);
  extra('bowang','博望坡','pass','wei',['wan','xinye']);
  extra('chibi','赤壁','port','neutral',['jiangxia','changsha']);
  extra('yumen','玉门关','pass','ma',['wuwei']);
  // 海外地点只作地图标记；水路系统开放前不建立任何通行道路。
  const overseas=[
    ['lelang','乐浪','korea','朝鲜半岛'],['hanseong','汉城','korea','朝鲜半岛'],['geumseong','金城','korea','朝鲜半岛'],
    ['yamatai','邪马台','kyushu','日本'],['itsukushima','严岛','itsukushima','日本'],
    ['odawara','小田原城','honshu','日本'],['edo','江户城','honshu','日本'],
    ['osaka','大坂城','honshu','日本'],['odani','小谷城','honshu','日本']
  ];
  for(const [id,name,landmass,region]of overseas)places.push({id,name,kind:'city',faction:'neutral',region,landmass,requiresWater:true,...locate(id)});
  mapLayout.arrange(places,geography);
  const placeMap=Object.fromEntries(places.map(p=>[p.id,p]));
  const roadBends=new Map([
    ['xiangping','beiping',[[121.8,41.4],[120.5,40.9]]],
    ['hepu','jiaozhi',[[109.1,22],[108.3,22.2],[107.4,21.9]]],['hepu','hepu-county',[[110,21.8]]],
    ['wu','kuaiji',[[120.18,30.34],[120.12,30.2],[120.45,30.0]]],
    ['yumen','wuwei',[[95,40.2],[98.49,39.73],[100.45,38.93]]]
  ].map(([from,to,points])=>[[from,to].sort().join('|'),{from,points:points.map(([lon,lat])=>project(lon,lat))}]));
  function roadPath(a,b){const bends=roadBends.get([a,b].sort().join('|'));return [placeMap[a],...(bends?(a===bends.from?bends.points:[...bends.points].reverse()):[]),placeMap[b]];}
  const roadLength=(a,b)=>roadPath(a,b).reduce((n,p,i,points)=>i?n+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0);
  function roadPosition(a,b,progress){const points=roadPath(a,b);let remaining=roadLength(a,b)*Math.max(0,Math.min(1,progress));for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],length=Math.hypot(to.x-from.x,to.y-from.y);if(remaining<=length||i===points.length-1){const t=length?remaining/length:0;return{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};}remaining-=length;}return {...points[0]};}
  const descriptions={camp:'营里已经在做早饭，乡亲们正排队领粥。张角和两个弟弟还在安排新来的人住下。',luoyang:'皇帝仍住在宫里，可外面的命令大多都是董卓从府里传出来的。',changan:'城门外停着等待检查的粮车，百姓抱怨着最近又多出来的征粮和征工告示。',julu:'城外新搭了几间草棚，赶路的百姓带着行李，四处打听哪里还能住人。',chengdu:'城头挂着蜀国的旗，街上的商贩已经开门，也有人在替刚到的乡亲指路。',xuchang:'魏国官署门前有人等着办事，带介绍信的客人正在向门口的人询问。',jianye:'吴国的船停在江岸边，船工正忙着卸下粮食，再把等候的乘客接上船。'};
  const fallback={city:'城门口有来往的车马，守军正在询问进城的人，也有人站在路边等候。',village:'村里的屋顶冒着做饭的烟，几个人在村口帮忙照看停着的粮车。',port:'渡船已经靠岸，船夫正把最后几个客人扶上去，岸边还留着下一趟等船的人。',pass:'关口上挂着旗，前面的山路越来越窄，过路的车都要停下来慢慢通过。',camp:'营帐前有人走动，伙房的火还烧着，不时有人端着碗回到帐里。'};
  for(const p of places)p.description=p.requiresWater?'水路尚未开通。':descriptions[p.id]||fallback[p.kind];
  const clues=[
    {id:'xuchu',name:'许褚',faction:'wei',place:'qiaoxian',title:'土垒守粮',text:'谯县附近的许家村有个叫许褚的，最近一直帮乡亲们守粮。听说村里又来了抢粮的人，你们可以先去问问，看看他们需不需要帮忙。',outline:'到许家村帮助许褚守住粮车，再追查被抓的乡亲关在哪里。'},
    {id:'dianwei',name:'典韦',faction:'wei',place:'chenliu',title:'陈留豪客',text:'听说睢阳有个叫典韦的人，最近一直替刘家母子说话，跟李家的家丁闹得很厉害。你们可以去睢阳打听一下，别只听一边的说法。',outline:'去睢阳了解刘家的债务纠纷，帮助受到李家欺负的乡亲。'},
    {id:'xuhuang',name:'徐晃',faction:'wei',place:'hedong',title:'旧伍歧路',text:'河东有人提过一个叫徐晃的军士，他不愿再跟着抢百姓的粮，正在替同伴找别的去处。以后经过那边，可以多打听一下他的消息。',outline:'了解徐晃和同伴为什么想离开旧部，再商量他们往后能去哪里。'},
    {id:'zhaoyun',name:'赵云',faction:'shu',place:'changshan',title:'常山归途',text:'赵云就在常山照顾逃难的乡亲。他们住的地方暂时有了，粮食却一直紧张，你们去找他，也许正好能帮上忙。',outline:'去常山找赵云，了解村里缺粮的情况，再帮乡亲们把粮车找回来。'},
    {id:'huangzhong',name:'黄忠',faction:'shu',place:'changsha',title:'弓藏药市',text:'长沙有人在卖来路不明的马，黄忠认出了军中的记号，正在追问。你们到城里先找酒家掌柜，他见过当时的情况。',outline:'到长沙了解失马的事情，跟黄忠一起把马找回来。'},
    {id:'weiyan',name:'魏延',faction:'shu',place:'yiyang',title:'长刀未酬',text:'义阳有人在打听一个叫魏延的年轻人，听说他帮乡亲争辩过几句，后来却被人追着抓。具体出了什么事，还得找到当地的人问问。',outline:'了解魏延被追捕的原因，查清是否有人冒用官府的名义陷害他。'},
    {id:'ganning',name:'甘宁',faction:'wu',place:'jiangxia-port',title:'江上锦帆',text:'新野来了个江上做过水匪的人，听说答应招安以后，反而被官府抓进了牢里。你们到衙门附近问问，也许能知道更多消息。',outline:'去新野查探消息，问清被抓的人是谁、为什么会被关起来。'},
    {id:'taishici',name:'太史慈',faction:'wu',place:'donglai',title:'东莱孤骑',text:'太史慈正在北海照顾生病的母亲，城里的药铺又被人抢了。他一直在想办法找药，你们有空可以过去问问，有没有能帮忙的地方。',outline:'到北海寻找太史慈，先处理药铺遇到的麻烦，再帮助他照顾母亲。'},
    {id:'zhoutai',name:'周泰',faction:'wu',place:'chaisang',title:'渡口风急',text:'柴桑的船户常提起周泰，说江边出了事情，他总肯过来帮忙。以后经过那里的渡口，可以问问他最近有没有回来。',outline:'向柴桑船户打听周泰的消息，了解渡口最近发生的事情。'}
  ];
  const catalog=typeof module!=='undefined'&&module.exports?require('./weapon-catalog.js'):root.WeaponCatalog;
  const weaponNames=Object.fromEntries(catalog.types.map(t=>[t.id,t.ordinaryName]));
  for(const place of places)if(['hulao','tongguan','luoyang','changan'].includes(place.id))place.encounterCount=2;
  places.find(p=>p.id==='jiangxia').rumor='船夫说，昨晚有几条挂着锦帆的船经过，把困在岸边的船户一起接走了，可他也没看清船上领头的人是谁。';
  const roadEvents=[
    {id:'patrol',weight:2,kind:'battle',encounter:'patrol',title:'路遇巡兵',text:'几个巡兵拦住了道路，问你是不是从黄巾营地来的。你还没有回答，领头的人就叫手下围了上来。'},
    {id:'thieves',weight:2,kind:'battle',encounter:'thieves',title:'草丛伏客',text:'路边的草丛突然晃了一下，两个黑衣人跳出来，抓住你的行囊就往外扯。'},
    {id:'river-bandits',weight:1,kind:'battle',encounter:'river-bandits',title:'河岸劫道',text:'几名水贼把船拖到浅滩，堵住岸边的小路，非要过路的人留下钱才肯让开。'},
    {id:'mountain-bandits',weight:2,kind:'battle',encounter:'mountain-bandits',title:'山道拦路',text:'山道被一截新砍下的树挡住。你刚停下来查看，身后的林子里就走出了几个带刀的人。'},
    {id:'brigands',weight:1,kind:'battle',encounter:'brigands',title:'行路遇匪',text:'前面的商人扔下货物逃走了，几个提刀的强盗转过头，又朝你这边走过来。'},
    {id:'rumor',weight:4,kind:'rumor',title:'道旁消息',text:'途中有人跟你同行了一会儿，说附近几国都在招人。有的乡亲想去试试，也有人只想留下照顾家里，谁也没劝服谁。'},
    {id:'quiet',weight:88,kind:'quiet'}
  ];
  const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  const patrol={...G.create('imperialSoldier',4),name:'巡兵',characterId:'imperial-soldier',attack:10,armor:8,resistance:8,weapon:{type:'spear',name:'长枪'},weaponProficiencies:{spear:60},skills:['spear-cut'],priorities:[{skill:'spear-cut',when:'always'}]};
  const encounters={patrol:{id:'patrol',title:'路遇巡兵',scene:{background:'./assets/story/village-road-v3.webp'},roster:[patrol,{...patrol,...G.create('imperialPikeman',4)}],rules:{level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true}}};
  const nearby=typeof module!=='undefined'&&module.exports?require('./nearby-content.js'):root.NearbyContent;
  const outlaw=(profile,level,name,art,type,skills)=>nearby.enemy(profile,level,name,art,type,skills);
  for(const [id,title,profile,name,art,type,skills,level,count]of [
    ['thieves','草丛伏客','thief','盗贼','thief','dagger',['dagger-fast'],3,2],
    ['river-bandits','河岸劫道','riverBandit','水贼','river-bandit','spear',['spear-cut'],3,2],
    ['mountain-bandits','山道拦路','mountainBandit','山贼','mountain-bandit','blade',['blade-cut'],3,2],
    ['brigands','行路遇匪','brigand','强盗','brigand','blade',['blade-cut'],4,2]
  ])encounters[id]={id,title,count,scene:{background:'./assets/story/village-road-v3.webp'},roster:[outlaw(profile,level,name,art,type,skills)],rules:{level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true}};
  encounters['changshan-rescue']={id:'changshan-rescue',title:'毋极接应',count:2,scene:{background:'./assets/story/village-road-v3.webp'},roster:[outlaw('thief',1,'盗贼','thief','dagger',['dagger-fast'])],rules:{level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true}};
  for(const [id,scene]of Object.entries({patrol:'rural-road',thieves:'forest-path','river-bandits':'river-dock','mountain-bandits':'bandit-camp',brigands:'bandit-camp','changshan-rescue':'market-street'}))encounters[id].scene=Scenes.get(scene);
  const questDefinitions=[
    {id:'coalition',title:'访贤合盟',category:'main',recommendedLevel:10},
    {id:'changshan',title:'常山归途',category:'story',recommendedLevel:3}
  ];
  const questNpcs={
    zhaoyun:{id:'zhaoyun',name:'赵云',art:'zhaoyun',side:'left',role:'story',roleLabel:'剧情'},
    zhenji:{id:'zhenji',name:'甄姬',art:'zhenji',side:'right',role:'heal',roleLabel:'疗伤'},
    maiden:{id:'grain-maiden',name:'村姑',art:'village-maiden',side:'right',role:'story',roleLabel:'剧情'},
    laborer:{id:'refugee-laborer',name:'劳工',art:'laborer',side:'left',role:'story',roleLabel:'剧情'},
    elder:{id:'village-elder',name:'村民',art:'villager',side:'left',role:'story',roleLabel:'剧情'}
  };
  const townScenes={camp:{background:'./assets/story/yellow-camp.webp'},xinye:{background:'./assets/battles/market-street-v1.webp'},default:{background:'./assets/story/village-road-v3.webp'}};
  const townNpcs={camp:[
    {id:'zhangjiao',name:'张角',art:'zhangjiao',side:'left',role:'advice',roleLabel:'问策'},
    {id:'zhangbao',name:'张宝',art:'zhangbao',side:'right',role:'heal',roleLabel:'疗伤'},
    {id:'zhangliang',name:'张梁',art:'zhangliang',side:'left',role:'training',roleLabel:'操练'}
  ]};
  const gateGuard={id:'gate-guard',name:'官兵',art:'imperial-soldier',side:'left',role:'guard'};
  const trainingOptions=[
    {id:'straw-dummy',label:'稻草人',count:1,dummy:true},
    {id:'militia-one',label:'一名黄巾军',count:1},
    {id:'militia-two',label:'两名黄巾军',count:2},
    {id:'militia-five',label:'五名黄巾军',count:5},
    {id:'zhangliang',label:'挑战张梁',rivals:['zhangliang']},
    {id:'three-brothers',label:'挑战三兄弟',rivals:['zhangjiao','zhangbao','zhangliang']}
  ];
  const travelRules={speed:roadLength('camp','changshan'),eventGraceSteps:2,quietStepsAfterEvent:2};
  const mapRules={zoomStep:1.3,defaultZoom:Math.max(...places.map(mapLayout.minZoom))*1.3**2};
  const placeAliases={jiujiang:'chaisang',...locationData.aliases};
  const travelTimeFactor=potential=>{const p=Math.max(0,Math.min(100,Number.isFinite(Number(potential))?Number(potential):50));return p<=50?2-p/50:1-(p-50)/100;};
  const travelDurationMs=(a,b,potential=50)=>Math.max(1,roadLength(a,b)/travelRules.speed*1000*travelTimeFactor(potential));
  const api={mapRules,travelRules,travelTimeFactor,travelDurationMs,placeAliases,factions,places,roads,clues,weaponNames,roadEvents,encounters,townScenes,townNpcs,gateGuard,trainingOptions,questDefinitions,questNpcs,placeMap,roadPath,roadLength,roadPosition,geography,mapLayout,bounds:geography.bounds,cityIds:cityRows.map(row=>row[0])};
  root.WorldData=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
