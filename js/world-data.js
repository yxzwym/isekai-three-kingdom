(function(root){
  'use strict';
  const Scenes=typeof module!=='undefined'&&module.exports?require('./battle-scenes.js'):root.BattleScenes;
  const factions={yellow:{name:'黄巾',color:'#c5a64a'},wei:{name:'魏',color:'#5b91ba'},shu:{name:'蜀',color:'#749766'},wu:{name:'吴',color:'#b86958'},dong:{name:'董卓朝廷',color:'#825a78'},yuan:{name:'袁绍',color:'#a08664'},shuYuan:{name:'袁术',color:'#ad8551'},liu:{name:'刘表',color:'#6d9286'},ma:{name:'马腾',color:'#947559'},zhang:{name:'张鲁',color:'#827aa5'},gongsun:{name:'公孙瓒',color:'#9c9b8c'},neutral:{name:'乡野',color:'#9c927b'}};
  // 城池名单以《三国志13》60城为基底；经纬度与来源独立保存在 world-locations.js。
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
  const descriptions={camp:'炊烟才起，营中已有人排队领粥。张角三兄弟还在安置逃难的乡民。',luoyang:'天子仍在宫中，诏令却从董卓府上发出。',changan:'西来的粮车在城门外受检，朝廷的征发令一日比一日多。',julu:'城外添了几处草棚，路上常能遇见逃难的乡人。',chengdu:'蜀国旗帜挂在城头，商贩趁早开市。',xuchang:'魏国官署门前，带荐书的人排起长队。',jianye:'吴国船只泊满江岸，船工正忙着装卸粮袋。'};
  const fallback={city:'城门前人来车往，守军正在查验行旅。',village:'炊烟散在屋舍之间，村口有人看守粮车。',port:'船只靠着江岸，行人正在等候渡船。',pass:'关上旌旗随风作响，山路在此收窄。',camp:'帐前有人往来，炊烟未散。'};
  for(const p of places)p.description=p.requiresWater?'水路尚未开通。':descriptions[p.id]||fallback[p.kind];
  const clues=[
    {id:'xuchu',name:'许褚',faction:'wei',place:'qiaoxian',title:'土垒守粮',text:'谯县那边有个叫许褚的，正带着乡人守粮。听说他们在村外筑了土墙，连乱兵也不敢轻易去抢，你可以到那里问问。',outline:'协助乡兵守住粮仓，查清混入征粮队的乱兵，劝许褚为更多乡民寻一条活路。'},
    {id:'dianwei',name:'典韦',faction:'wei',place:'chenliu',title:'陈留豪客',text:'陈留有人提起过一个叫典韦的汉子，说他替乡人出头惹了麻烦，如今还在附近躲着。你到了那边，可以先去客舍打听。',outline:'从客舍口角追查豪强侵占田地之事，帮典韦保护受牵连的乡民。'},
    {id:'xuhuang',name:'徐晃',faction:'wei',place:'hedong',title:'旧伍歧路',text:'河东有个使斧的军士，一直在找办法让几个同伴离开旧部。听说他不愿再跟着去抢百姓的东西，你若路过，可以找他聊聊。',outline:'助他护送不愿再从贼的士卒离开旧部，在保全同袍与择主之间作出决定。'},
    {id:'zhaoyun',name:'赵云',faction:'shu',place:'changshan',title:'常山归途',text:'常山有个年轻枪客，正照顾一队逃难来的乡亲。听说他们暂时住在村里，还没找到能长久安顿的地方。',outline:'沿途护送流民，寻找能让他们安顿的地方，以亲眼见到的治政说服赵云。'},
    {id:'huangzhong',name:'黄忠',faction:'shu',place:'changsha',title:'弓藏药市',text:'你去长沙时，可以问问药铺里的人。他们说有位姓黄的老将常来求药，好像家里有人病着，或许就是你要找的黄忠。',outline:'寻药解围，护住受乱军牵连的医者，让黄忠得以放下家事，重新执弓。'},
    {id:'weiyan',name:'魏延',faction:'shu',place:'yiyang',title:'长刀未酬',text:'义阳有人在打听一个叫魏延的年轻人。听说他原本是帮乡亲们讨说法，后来却成了被追赶的那个，这事恐怕有些蹊跷。',outline:'查清乡争背后的军粮侵吞，替魏延洗清罪名，给他一个凭本事立身的去处。'},
    {id:'ganning',name:'甘宁',faction:'wu',place:'jiangxia-port',title:'江上锦帆',text:'甘宁还在江夏的水道上，没有去吴国。那边的船夫都认得他的锦帆，你想找他，先去渡口问问往来的船只。',outline:'辨清劫船缘由，与锦帆众合力对付借水匪名义行劫的官船，再谈上岸之事。'},
    {id:'taishici',name:'太史慈',faction:'wu',place:'donglai',title:'东莱孤骑',text:'东莱客舍里住着个弓马很好的客人，叫太史慈。听说他有封急信要送，一直没能成行，也许正需要有人帮忙。',outline:'替太史慈送达求援书信，并助其救下被围的故交，让他能够自择前路。'},
    {id:'zhoutai',name:'周泰',faction:'wu',place:'chaisang',title:'渡口风急',text:'柴桑有个叫周泰的，平时话不多，江边的船户却都肯听他的。你找不到他，就问问渡口的人，他们常受他照应。',outline:'守住渡口，救出被水寨扣留的船户，与周泰并肩渡过一场险局。'}
  ];
  const catalog=typeof module!=='undefined'&&module.exports?require('./weapon-catalog.js'):root.WeaponCatalog;
  const weaponNames=Object.fromEntries(catalog.types.map(t=>[t.id,t.ordinaryName]));
  for(const place of places)if(['hulao','tongguan','luoyang','changan'].includes(place.id))place.encounterCount=2;
  places.find(p=>p.id==='jiangxia').rumor='船夫说，锦帆众的船昨夜又过了渡口，带走的却是一群被困在岸边的船户。';
  const roadEvents=[
    {id:'patrol',weight:2,kind:'battle',encounter:'patrol',title:'路遇巡兵',text:'路旁的巡兵拦住去路。领头的人认定你从黄巾营中来，不由分说便围了上来。'},
    {id:'thieves',weight:2,kind:'battle',encounter:'thieves',title:'草丛伏客',text:'路边草丛一阵响动，两个黑衣人跳了出来，伸手便来扯你的行囊。'},
    {id:'river-bandits',weight:1,kind:'battle',encounter:'river-bandits',title:'河岸劫道',text:'几名水贼把船拖上浅滩，横在岸边小路上，张口便要买路钱。'},
    {id:'mountain-bandits',weight:2,kind:'battle',encounter:'mountain-bandits',title:'山道拦路',text:'山道上横着一截新砍的树。你刚停下脚步，背后的林子里便走出几名山贼。'},
    {id:'brigands',weight:1,kind:'battle',encounter:'brigands',title:'行路遇匪',text:'前面的行商丢下货担跑了。几个提刀的强盗转过身，盯上了你。'},
    {id:'rumor',weight:4,kind:'rumor',title:'道旁消息',text:'途中有人同行了一段，说近来各地都在招兵。魏、蜀、吴的荐书有人争着求，也有人宁愿留在乡间。'},
    {id:'quiet',weight:88,kind:'quiet'}
  ];
  const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  const patrol={...G.create('imperialSoldier',4),name:'巡兵',characterId:'imperial-soldier',attack:10,armor:8,resistance:8,weapon:{type:'spear',name:'长枪'},weaponProficiencies:{spear:60},skills:['spear-cut','spear-sweep'],priorities:[{skill:'spear-sweep',when:'enemyCount',threshold:2},{skill:'spear-cut',when:'always',frequency:'sometimes'}]};
  const encounters={patrol:{id:'patrol',title:'路遇巡兵',scene:{background:'./assets/story/village-road-v3.webp'},roster:[patrol,{...patrol,...G.create('imperialPikeman',4)}],rules:{level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true}}};
  const nearby=typeof module!=='undefined'&&module.exports?require('./nearby-content.js'):root.NearbyContent;
  const outlaw=(profile,level,name,art,type,skills)=>nearby.enemy(profile,level,name,art,type,skills);
  for(const [id,title,profile,name,art,type,skills,level,count]of [
    ['thieves','草丛伏客','thief','盗贼','thief','dagger',['dagger-fast'],3,2],
    ['river-bandits','河岸劫道','riverBandit','水贼','river-bandit','spear',['spear-cut','spear-sweep'],3,2],
    ['mountain-bandits','山道拦路','mountainBandit','山贼','mountain-bandit','blade',['blade-cut','blade-sweep'],3,2],
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
  const api={mapRules,travelRules,travelTimeFactor,travelDurationMs,placeAliases,factions,places,roads,clues,weaponNames,roadEvents,encounters,townScenes,townNpcs,gateGuard,trainingOptions,questDefinitions,questNpcs,placeMap,roadPath,roadLength,roadPosition,geography,mapLayout,bounds:geography.bounds,cityIds:cityRows.map(row=>row[0]),mapSource:{title:'三国志13 · 60城（固定经纬度）',url:'https://www.gamecity.ne.jp/sangokushi13/concept.html'}};
  root.WorldData=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
