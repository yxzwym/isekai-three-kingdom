(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./weapon-catalog.js'):root.WeaponCatalog;
  const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  const ATTRIBUTES=G.ATTRIBUTES;
  const PROFICIENCY_BASE=100;
  const proficiencyFromLegacy=value=>value===0?0:Math.max(1,Math.round(value*PROFICIENCY_BASE/255));
  const IDENTITIES=[
  {
    "id": "worthless",
    "name": "无用之人",
    "difficulty": 5,
    "ranges": {
      "war": [
        1,
        1
      ],
      "intelligence": [
        1,
        1
      ],
      "constitution": [
        1,
        1
      ],
      "speed": [
        1,
        1
      ],
      "technique": [
        1,
        1
      ]
    }
  },
  {
    "id": "civilian",
    "name": "老百姓",
    "difficulty": 4,
    "ranges": {
      "war": [
        16,
        76
      ],
      "intelligence": [
        16,
        76
      ],
      "constitution": [
        16,
        76
      ],
      "speed": [
        16,
        76
      ],
      "technique": [
        16,
        76
      ]
    },
    "attributeBands": [
      {
        "weight": 90,
        "min": 16,
        "max": 43
      },
      {
        "weight": 10,
        "min": 44,
        "max": 76
      }
    ]
  },
  {
    "id": "teacher",
    "name": "教书先生",
    "difficulty": 3,
    "ranges": {
      "war": [
        10,
        31
      ],
      "intelligence": [
        55,
        76
      ],
      "constitution": [
        41,
        61
      ],
      "speed": [
        39,
        59
      ],
      "technique": [
        37,
        61
      ]
    }
  },
  {
    "id": "bully",
    "name": "横行乡里",
    "difficulty": 3,
    "ranges": {
      "war": [
        55,
        76
      ],
      "intelligence": [
        10,
        31
      ],
      "constitution": [
        41,
        61
      ],
      "speed": [
        39,
        59
      ],
      "technique": [
        37,
        61
      ]
    }
  },
  {
    "id": "strategist",
    "name": "无双谋将",
    "difficulty": 2,
    "ranges": {
      "war": [
        31,
        55
      ],
      "intelligence": [
        86,
        98
      ],
      "constitution": [
        76,
        92
      ],
      "speed": [
        69,
        86
      ],
      "technique": [
        69,
        86
      ]
    }
  },
  {
    "id": "warrior",
    "name": "无双猛将",
    "difficulty": 2,
    "ranges": {
      "war": [
        86,
        98
      ],
      "intelligence": [
        31,
        55
      ],
      "constitution": [
        76,
        92
      ],
      "speed": [
        69,
        86
      ],
      "technique": [
        69,
        86
      ]
    }
  },
  {
    "id": "overlord",
    "name": "龙傲天",
    "difficulty": 1,
    "ranges": {
      "war": [
        100,
        100
      ],
      "intelligence": [
        100,
        100
      ],
      "constitution": [
        100,
        100
      ],
      "speed": [
        100,
        100
      ],
      "technique": [
        100,
        100
      ]
    }
  }
];
  const IDENTITY_PASSIVE_WEIGHTS={
    worthless:{white:100},civilian:{white:70,green:25,blue:5},
    teacher:{white:15,green:50,blue:30,gold:5},bully:{white:15,green:50,blue:30,gold:5},
    strategist:{blue:45,gold:45,red:10},warrior:{blue:45,gold:45,red:10},overlord:{gold:40,red:60}
  };
  // Legacy identities remain numeric templates and save aliases, not professions.
  const DIFFICULTIES=[
    {id:'hell',name:'地狱难度',stars:5,profiles:['worthless']},
    {id:'survival',name:'乱世求生',stars:4,profiles:['civilian']},
    {id:'normal',name:'初出茅庐',stars:3,profiles:['teacher','bully']},
    {id:'heroic',name:'天纵之才',stars:2,profiles:['strategist','warrior']},
    {id:'protagonist',name:'主角剧本',stars:1,profiles:['overlord']}
  ].map(d=>({...d,passiveWeights:IDENTITY_PASSIVE_WEIGHTS[d.profiles[0]]}));
  const getDifficulty=id=>DIFFICULTIES.find(d=>d.id===id||d.profiles.includes(id));
  const WEAPON_GROUPS=C.groups;
  const WEAPON_TYPES=C.types.map(({id,name,role,group,ordinaryName,style})=>({id,name,role,group,ordinaryName,style,skillPlanId:id}));
  const getWeaponProficiency=(character,id)=>{const values=character?.weaponProficiencies,value=values?.[id]??(id==='talisman'?values?.['medicine-bag']:id==='qin'?values?.jade:undefined);return Number.isSafeInteger(value)&&value>=0?value:0;};
  const WEAPON_SKILL_PLANS=Object.fromEntries(C.types.map(t=>[t.id,{status:'ready',skills:t.skills}]));
  const QUALITIES={
    white:{name:'白色',color:'#e5e7e7',weight:42},green:{name:'绿色',color:'#87cf92',weight:31},
    blue:{name:'蓝色',color:'#72b9ed',weight:18},gold:{name:'金色',color:'#e9c371',weight:8},
    red:{name:'红色',color:'#f07670',weight:1},rainbow:{name:'彩虹色',color:'#d1a4ef',weight:0}
  };
  const passive=(id,name,quality,description,effects={},category='特殊')=>({id,name,quality,description,effects,category,fusionOnly:quality==='rainbow'});
  const PASSIVES=[
    passive('healthy','身强体健','white','最大生命提高5%。',{troopsMultiplier:1.05},'生命'),
    passive('steady','稳扎稳打','white','物理技能伤害提高5%。',{physicalMultiplier:1.05},'武技'),
    passive('careful','心思缜密','white','计策伤害提高5%。',{tacticMultiplier:1.05},'计策'),
    passive('lightfoot','步履轻健','white','行动读条时间缩短3%。',{intervalMultiplier:.97},'速度'),
    passive('bandage','包扎手法','white','治疗量提高5%。',{healingMultiplier:1.05},'治疗'),
    passive('patient','坚守本心','white','受到的伤害降低3%。',{takenMultiplier:.97},'防护'),
    passive('brave','破阵之勇','green','物理技能伤害提高10%。',{physicalMultiplier:1.1},'武技'),
    passive('planning','运筹帷幄','green','计策伤害提高10%。',{tacticMultiplier:1.1},'计策'),
    passive('strongarmy','兵强马壮','green','最大生命提高12%。',{troopsMultiplier:1.12},'生命'),
    passive('swift','疾行如风','green','行动读条时间缩短6%。',{intervalMultiplier:.94},'速度'),
    passive('herbalist','灵丹妙手','green','治疗量提高12%。',{healingMultiplier:1.12},'治疗'),
    passive('veteran','百战余生','green','受到的伤害降低6%。',{takenMultiplier:.94},'防护'),
    passive('initiative','先声夺人','blue','开战时获得25%行动进度。',{initialProgress:.25},'先手'),
    passive('clever','奇谋迭出','blue','计策伤害提高20%。',{tacticMultiplier:1.2},'计策'),
    passive('unstoppable','势如破竹','blue','物理技能伤害提高20%。',{physicalMultiplier:1.2},'武技'),
    passive('fortress','坚壁清野','blue','护甲与抗性提高25%。',{armorMultiplier:1.25,resistanceMultiplier:1.25},'防护'),
    passive('rapid','兵贵神速','blue','行动读条时间缩短12%。',{intervalMultiplier:.88},'速度'),
    passive('doctor','妙手回春','blue','治疗量提高25%。',{healingMultiplier:1.25},'治疗'),
    passive('critical','会心一击','blue','暴击率增加15个百分点。',{criticalBonus:.15},'暴击'),
    passive('edge','锋芒毕露','gold','暴击率增加30个百分点。',{criticalBonus:.3},'暴击'),
    passive('surprise','攻其不备','gold','物理技能无视目标50%护甲。',{armorPierce:.5},'破甲'),
    passive('foresight','料敌先机','gold','受到物理技能时有25%概率闪避。',{physicalDodge:.25},'闪避'),
    passive('loyal','赤胆忠心','gold','最大生命提高35%。',{troopsMultiplier:1.35},'生命'),
    passive('mastermind','神机妙算','gold','计策伤害提高40%。',{tacticMultiplier:1.4},'计策'),
    passive('miracle','回天之术','gold','治疗量提高45%。',{healingMultiplier:1.45},'治疗'),
    passive('shadow','神行无踪','gold','行动读条时间缩短22%。',{intervalMultiplier:.78},'速度'),
    passive('guishen','鬼神无双','red','物理技能必定暴击。',{guaranteedCritical:true},'暴击'),
    passive('bagua','八卦阵','red','受到物理技能时有50%概率闪避。',{physicalDodge:.5},'闪避'),
    passive('pojun','破军绝阵','red','物理技能无视目标全部护甲。',{ignoreArmor:true},'破甲'),
    passive('heavenly','经天纬地','red','计策伤害提高100%。',{tacticMultiplier:2},'计策'),
    passive('invincible','万夫莫当','red','受到的伤害降低50%。',{takenMultiplier:.5},'防护'),
    passive('renewal','枯木逢春','red','治疗量提高100%。',{healingMultiplier:2},'治疗'),
    passive('destiny','天命所归','red','最大生命提高75%，读条时间缩短15%。',{troopsMultiplier:1.75,intervalMultiplier:.85},'统合'),
    passive('keen','眼疾手快','white','暴击率增加3个百分点。',{criticalBonus:.03},'暴击'),
    passive('toughskin','皮糙肉厚','white','护甲提高8%。',{armorMultiplier:1.08},'护甲'),
    passive('calm','沉着应战','white','抗性提高8%。',{resistanceMultiplier:1.08},'抗性'),
    passive('bluntforce','蓄力重击','white','物理伤害提高8%，读条时间增加3%。',{physicalMultiplier:1.08,intervalMultiplier:1.03},'武技'),
    passive('mindshield','明心守志','white','受到的计策伤害降低5%。',{tacticTakenMultiplier:.95},'抗性'),
    passive('renew','吐故纳新','white','每次行动恢复1%最大生命。',{actionRegen:.01},'恢复'),
    passive('ironbody','铜筋铁骨','green','护甲提高18%。',{armorMultiplier:1.18},'护甲'),
    passive('clearhead','固守心神','green','抗性提高18%。',{resistanceMultiplier:1.18},'抗性'),
    passive('sharpsense','洞察破绽','green','物理技能无视目标12%护甲。',{armorPierce:.12},'破甲'),
    passive('brightmind','攻心为上','green','计策无视目标12%抗性。',{resistancePierce:.12},'破谋'),
    passive('smallcure','生生不息','green','每次行动恢复2.5%最大生命。',{actionRegen:.025},'恢复'),
    passive('assault','乘胜追击','green','攻击生命低于30%的敌人时伤害提高15%。',{executeThreshold:.3,executeMultiplier:1.15},'追击'),
    passive('sustain','浴血奋战','blue','物理技能恢复造成伤害8%的生命。',{physicalLifesteal:.08},'吸血'),
    passive('spellpierce','奇策破阵','blue','计策无视目标25%抗性。',{resistancePierce:.25},'破谋'),
    passive('counter','以逸待劳','blue','受物理技能时15%概率反击，造成50%物理伤害。',{counterChance:.15,counterMultiplier:.5},'反击'),
    passive('vanguard','先登夺旗','blue','开战获得相当于15%最大生命的护盾。',{openingShield:.15},'护盾'),
    passive('resolve','坚忍不拔','blue','自身生命低于30%时，受到伤害降低20%。',{lowTroopsThreshold:.3,lowTroopsTakenMultiplier:.8},'绝境'),
    passive('lightning','疾风迅雷','blue','开战获得15%进度，读条时间缩短10%。',{initialProgress:.15,intervalMultiplier:.9},'先手'),
    passive('disrupt','出奇制胜','gold','计策无视目标50%抗性。',{resistancePierce:.5},'破谋'),
    passive('resolvebreak','背水一战','gold','自身生命低于30%时，伤害提高60%。',{lowTroopsThreshold:.3,lowTroopsDamageMultiplier:1.6},'绝境'),
    passive('guardall','固若金汤','gold','护甲与抗性提高50%。',{armorMultiplier:1.5,resistanceMultiplier:1.5},'防护'),
    passive('bloodblade','血战到底','gold','物理技能恢复造成伤害18%的生命。',{physicalLifesteal:.18},'吸血'),
    passive('shrine','悬壶济世','gold','治疗提高35%，溢出治疗的40%转为护盾。',{healingMultiplier:1.35,overhealShield:.4},'治疗'),
    passive('decisive','一击制敌','gold','暴击率增加10个百分点，暴击伤害增加50%。',{criticalBonus:.1,criticalDamageBonus:.5},'暴击'),
    passive('dominance','王者之威','red','所有伤害提高50%，护甲与抗性提高30%。',{damageMultiplier:1.5,armorMultiplier:1.3,resistanceMultiplier:1.3},'统合'),
    passive('stratagem','算无遗策','red','计策暴击率增加50个百分点，暴击伤害增加50%。',{tacticCriticalBonus:.5,tacticCriticalDamageBonus:.5},'计策'),
    passive('rampage','修罗血煞','red','物理技能恢复造成伤害35%的生命。',{physicalLifesteal:.35},'吸血'),
    passive('thunderlord','雷霆万钧','red','计策无视目标全部抗性。',{ignoreResistance:true},'破谋'),
    passive('neverfall','不屈战魂','red','自身生命低于30%时，受到伤害降低65%。',{lowTroopsThreshold:.3,lowTroopsTakenMultiplier:.35},'绝境'),
    passive('unity','万象归一','rainbow','融合品质预留，开局不会出现。'),
    passive('reversal','逆转乾坤','rainbow','融合品质预留，开局不会出现。')
  ];
  const PASSIVE_MAP=Object.fromEntries(PASSIVES.map(p=>[p.id,p]));
  const APPEARANCES=['beggar','wanderer','scholar','swordswoman','healer','armored','silverguard','warlord'].map(id=>({id}));
  const unitRandom=rng=>Math.max(0,Math.min(1-Number.EPSILON,Number(rng())||0));
  const randomInt=(min,max,rng=Math.random)=>min+Math.floor(unitRandom(rng)*(max-min+1));
  function rollRange(range,bands,rng){
    if(!bands)return randomInt(...range,rng);
    let pick=unitRandom(rng)*bands.reduce((sum,band)=>sum+band.weight,0),chosen=bands.at(-1);
    for(const band of bands){pick-=band.weight;if(pick<0){chosen=band;break;}}
    return randomInt(chosen.min,chosen.max,rng);
  }
  const rollAttribute=(identity,key,rng)=>rollRange(identity.ranges[key],identity.attributeBands,rng);
  function rollPassives(rng=Math.random,count=3,weights=null){
    const weight=tier=>weights?Number(weights[tier])||0:QUALITIES[tier].weight;
    const available=PASSIVES.filter(p=>!p.fusionOnly&&weight(p.quality)>0);if(!Number.isInteger(count)||count<0||count>available.length)throw new RangeError('被动数量超出可选范围');
    const selected=[];
    while(selected.length<count){
      const tiers=Object.entries(QUALITIES).map(([tier])=>[tier,{weight:weight(tier)}]).filter(([tier,q])=>q.weight>0&&available.some(p=>p.quality===tier));
      let pick=unitRandom(rng)*tiers.reduce((sum,[,q])=>sum+q.weight,0),tier=tiers.at(-1)[0];
      for(const [key,q]of tiers){pick-=q.weight;if(pick<0){tier=key;break;}}
      const matches=available.filter(p=>p.quality===tier),chosen=matches[randomInt(0,matches.length-1,rng)];
      selected.push(chosen.id);available.splice(available.indexOf(chosen),1);
    }
    return selected;
  }
  function rollHero(difficultyId,rng=Math.random){
    const difficulty=getDifficulty(difficultyId);if(!difficulty)throw new TypeError('请先选择难度');
    const profileId=IDENTITIES.some(i=>i.id===difficultyId)?difficultyId:difficulty.profiles.length===1?difficulty.profiles[0]:difficulty.profiles[randomInt(0,difficulty.profiles.length-1,rng)];
    const identity=IDENTITIES.find(i=>i.id===profileId);
    const growth=G.characterAt({potentials:Object.fromEntries(ATTRIBUTES.map(([key])=>[key,rollAttribute(identity,key,rng)]))},1);
    return {...growth,weaponCatalogVersion:1,weaponProficiencies:Object.fromEntries(WEAPON_TYPES.map(type=>[type.id,0])),passives:rollPassives(rng,3,difficulty.passiveWeights)};
  }
  const segments=text=>typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(text),s=>s.segment):Array.from(text);
  const sanitizeName=value=>segments(String(value||'').replace(/[\u0000-\u001f\u007f\s]/g,'')).slice(0,4).join('');
  const heroName=value=>sanitizeName(value)||'无名氏';
  function validCharacter(c){
    return !!c&&typeof c.name==='string'&&c.name.length>0&&sanitizeName(c.name)===c.name&&!!getDifficulty(c.difficulty||c.identity)&&APPEARANCES.some(a=>a.id===c.appearance)
      &&G.validGrowth(c)&&ATTRIBUTES.every(([key])=>Number.isSafeInteger(c.attributes?.[key])&&c.attributes[key]>=1)
      &&(c.weaponProficiencies===undefined||!!c.weaponProficiencies&&typeof c.weaponProficiencies==='object'&&!Array.isArray(c.weaponProficiencies)&&Object.values(c.weaponProficiencies).every(value=>Number.isSafeInteger(value)&&value>=0))
      &&Array.isArray(c.passives)&&new Set(c.passives).size===c.passives.length&&c.passives.every(id=>!!PASSIVE_MAP[id]);
  }
  const clone=value=>JSON.parse(JSON.stringify(value));
  function normalizeCharacter(character){
    if(!character||typeof character!=='object')return character;
    const next=G.normalizeCharacter(character);const difficulty=getDifficulty(next.difficulty||next.identity);if(difficulty)next.difficulty=difficulty.id;delete next.identity;
    if(next.weaponProficiencies&&typeof next.weaponProficiencies==='object'&&!Array.isArray(next.weaponProficiencies)&&Object.hasOwn(next.weaponProficiencies,'medicine-bag')){if(!Object.hasOwn(next.weaponProficiencies,'talisman'))next.weaponProficiencies.talisman=next.weaponProficiencies['medicine-bag'];delete next.weaponProficiencies['medicine-bag'];}
    if(next.weaponProficiencies&&Object.hasOwn(next.weaponProficiencies,'jade')){next.weaponProficiencies.qin??=next.weaponProficiencies.jade;delete next.weaponProficiencies.jade;}
    if(Array.isArray(next.passives))next.passives=next.passives.filter(id=>id!=='revive');return next;
  }
  const SETTINGS={screenShake:true,effects:true,menuScale:1};
  class SaveStore{
    constructor(storage){this.storage=storage;this.key='pengpai-sanguo:saves:v1';this.settingsKey='pengpai-sanguo:settings:v1';}
    slots(){
      let data;try{data=JSON.parse(this.storage.getItem(this.key)||'[]');}catch{return [null,null,null];}
      return Array.from({length:3},(_,i)=>{const slot=Array.isArray(data)?data[i]:null,character=normalizeCharacter(slot?.character);if(![1,2,3,4].includes(slot?.version)||!validCharacter(character)||typeof slot.savedAt!=='string'||!Number.isFinite(Date.parse(slot.savedAt)))return null;
        if(slot.version<3&&character.weaponProficiencies)character.weaponProficiencies=Object.fromEntries(Object.entries(character.weaponProficiencies).map(([id,value])=>[id,proficiencyFromLegacy(value)]));
        return clone({...slot,version:4,character});});
    }
    save(index,character,progress){
      const current=normalizeCharacter(character);if(!Number.isInteger(index)||index<0||index>2||!validCharacter(current))throw new TypeError('人物或存档位置无效');
      const slots=this.slots();slots[index]={version:4,character:current,savedAt:new Date().toISOString(),chapter:progress?.stage==='world'?'world-map':progress?.stage==='complete'?'prologue-complete':'prologue-start',...(progress?{progress:clone(progress)}:{})};
      this.storage.setItem(this.key,JSON.stringify(slots));return clone(slots[index]);
    }
    settings(){let data;try{data=JSON.parse(this.storage.getItem(this.settingsKey)||'{}');}catch{data={};}return {screenShake:typeof data?.screenShake==='boolean'?data.screenShake:true,effects:typeof data?.effects==='boolean'?data.effects:true,menuScale:[.9,1,1.1].includes(data?.menuScale)?data.menuScale:1};}
    setSettings(settings){const next={...SETTINGS,...settings};if(typeof next.screenShake!=='boolean'||typeof next.effects!=='boolean'||![.9,1,1.1].includes(next.menuScale))throw new TypeError('设置无效');this.storage.setItem(this.settingsKey,JSON.stringify(next));return next;}
  }
  const sortPassives=(ids,map=PASSIVE_MAP)=>ids.map((id,index)=>({id,index})).sort((a,b)=>(Object.keys(QUALITIES).indexOf(map[b.id]?.quality)-Object.keys(QUALITIES).indexOf(map[a.id]?.quality))||a.index-b.index).map(v=>v.id);
  const api={sortPassives,PARTY_LIMIT:4,ATTRIBUTES,PROFICIENCY_BASE,DIFFICULTIES,getDifficulty,WEAPON_GROUPS,WEAPON_TYPES,WEAPON_SKILL_PLANS,getWeaponProficiency,IDENTITIES,IDENTITY_PASSIVE_WEIGHTS,QUALITIES,PASSIVES,PASSIVE_MAP,APPEARANCES,randomInt,rollPassives,rollHero,sanitizeName,heroName,nameLength:value=>segments(value).length,validCharacter,SaveStore};
  root.PengpaiRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
