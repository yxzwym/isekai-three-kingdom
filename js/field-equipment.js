(function(root){
 'use strict';
 const templates={};
 function gear(id,name,slot,attributes,options={}){templates[id]={id,name,slot,attributes,price:options.unique?300:100,...options};}
 gear('lamellar-armor','札甲','armor',{armor:12,constitution:4},{price:120});
 gear('marching-armor','行军轻甲','armor',{armor:7,speed:10},{price:100});
 gear('silk-robe','绢袍','armor',{armor:2,resistance:10,intelligence:5},{price:100});
 const unique=(id,name,slot,quality,attributes,acquisition,options={})=>gear(id,name,slot,attributes,{unique:true,quality,acquisition,...options});
 unique('taiping-robe','太平法衣','armor','blue',{armor:8,resistance:12,speed:18,intelligence:8},'张角·招募谢礼');
 unique('healers-coat','青囊药衣','armor','blue',{armor:6,resistance:12,intelligence:14,technique:8,healingBonus:.08},'马良·招募谢礼');
 unique('pulse-armor','护脉内甲','armor','blue',{armor:16,constitution:12},'襄阳·磨坊停工',{statusImmunities:['bleed']});
 unique('fireproof-robe','避火道袍','armor','blue',{armor:10,resistance:18,constitution:10},'陆逊·招募',{statusImmunities:['burn']});
 unique('black-iron-armor','玄铁重甲','armor','orange',{armor:32,resistance:8,constitution:24},'邺·石场铁卫');
 unique('bright-armor','明光铠','armor','orange',{armor:24,resistance:20,constitution:18},'黄忠·招募',{statusImmunities:['stun']});
 unique('ritual-robe','青纹祭衣','armor','blue',{armor:6,resistance:10,speed:24,intelligence:12,healingBonus:.05},'张宝·招募');
 unique('scout-armor','斥候轻甲','armor','blue',{armor:14,speed:28,technique:10},'吕蒙·招募');
 unique('feather-pendant','飞羽佩','accessory','blue',{speed:55,technique:8,dodge:.05},'太史慈·招募',{iconId:'wood-beads'});
 unique('wind-ring','逐风环','accessory','orange',{speed:75,armor:6,dodge:.08},'济北·废垒雷声',{statusImmunities:['speedDown','paralysis'],iconId:'copper-ring'});
 unique('herbal-sachet','泽兰香囊','accessory','green',{resistance:8,speed:18},'北海·归乡货车',{statusImmunities:['poison'],iconId:'woven-charm'});
 unique('clear-mind-charm','清瘴符','accessory','blue',{resistance:12,intelligence:10,healingBonus:.08},'平原·芦泽毒踪',{statusImmunities:['poison'],iconId:'woven-charm'});
 unique('iron-bracers','铁壁护腕','accessory','blue',{armor:20,constitution:8,war:3},'许褚·招募',{iconId:'copper-ring'});
 unique('focus-ring','凝神环','accessory','blue',{intelligence:14,technique:12,hitBonus:.08},'荀彧·招募',{iconId:'copper-ring'});
 unique('breaker-ring','破阵指环','accessory','blue',{war:10,technique:8,armorPenetration:8},'典韦·招募',{iconId:'copper-ring'});
 unique('warding-seal','诛邪印','accessory','orange',{intelligence:18,technique:12,resistancePenetration:10},'诸葛亮·招募',{iconId:'wood-beads'});
 unique('tiger-pendant','虎骨佩','accessory','blue',{constitution:20,armor:6,speed:12},'张飞·招募',{iconId:'wood-beads'});
 unique('steady-knot','定心结','accessory','blue',{speed:28,technique:12},'关羽·招募',{statusImmunities:['stun'],iconId:'woven-charm'});
 unique('river-cloak','白羽披风','accessory','orange',{speed:60,technique:14,dodge:.1},'甘宁·招募',{iconId:'woven-charm'});
 unique('water-pendant','碧水佩','accessory','blue',{intelligence:14,speed:35,healingBonus:.15},'鲁肃·招募',{iconId:'wood-beads'});
 const rewards={
  'story:escort':[['travel-knot','green']],
  'side:grain-escort':[['travel-knot','green']], 'side:trade-road':[['cloud-pendant','green']],
  'side:cs-blackwood':[['marching-armor','green']], 'side:ye-quarry':[['lamellar-armor','green']],
  'side:beihai-road':[['herbal-sachet']], 'side:suiyang-delivery':[['swift-pendant','green']],
  'side:xy-mill':[['pulse-armor']], 'side:jy-supplies':[['cloud-pendant','blue']],
  'side:challenge-iron':[['black-iron-armor']], 'side:challenge-poison':[['clear-mind-charm']],
  'side:challenge-reflection':[['wind-ring']],
  ...Object.fromEntries(Object.entries({zhangjiao:'taiping-robe',maliang:'healers-coat',luxun:'fireproof-robe',huangzhong:'bright-armor',zhangbao:'ritual-robe',lvmeng:'scout-armor',taishici:'feather-pendant',xuchu:'iron-bracers',xunyu:'focus-ring',dianwei:'breaker-ring',zhugeliang:'warding-seal',zhangfei:'tiger-pendant',guanyu:'steady-knot',ganning:'river-cloak',lusu:'water-pendant'}).map(([id,item])=>['hero:'+id,[[item]]]))
 };
 const api={templates,rewards};root.FieldEquipment=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
