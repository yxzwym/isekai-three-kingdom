(function(root){
  'use strict';
  const Professions=typeof module!=='undefined'&&module.exports?require('./hero-professions.js'):root.HeroProfessions;
  const ATTRIBUTES=[['war','武力'],['intelligence','智力'],['constitution','体质'],['speed','速度'],['technique','技巧']],KEYS=ATTRIBUTES.map(([id])=>id);
  const vector=(war,intelligence,constitution,speed,technique)=>({war,intelligence,constitution,speed,technique});
  const profile=(base,potentials)=>({baseAttributes:vector(...base),potentials:vector(...potentials)});
  const GENERAL_POTENTIALS={
    xuchu:[65,96,36],dianwei:[56,95,35],huangzhong:[86,93,60],maliang:[46,23,85],taishici:[82,93,66],zhangjiao:[86,25,86],zhangbao:[83,71,81],zhangliang:[78,80,68],zhenji:[15,4,71],zhaoyun:[91,96,76],zhouyu:[97,71,96],huanggai:[79,83,65],ganning:[86,94,76],lusu:[80,56,92],zhugeliang:[92,38,100],caocao:[96,72,91],zhangliao:[93,92,78],xuhuang:[88,90,74],yujin:[84,78,70],caoren:[89,86,56],sunquan:[76,67,80],lvbu:[87,100,26]
  };
  // 武智沿用人物档案；体质按战斗定位单独设定，速度与技巧使用各自的固定规则。
  const AGILITY_PROFILES={zhenji:{base:12,potential:80},diaochan:{base:12,potential:85},sunshangxiang:{base:12,potential:90},zhurong:{base:12,potential:90},huangyueying:{base:12,potential:75}};
  const derivedPotential=reference=>Math.round((Math.max(1,reference-20)+Math.min(100,reference+10))/2);
  function generalProfile(id,base){const [command,war,intelligence]=GENERAL_POTENTIALS[id],agility=AGILITY_PROFILES[id];if(agility)base=[...base.slice(0,3),agility.base,base[4]];return profile(base,[war,intelligence,Professions.definitions[id]?.constitution??command,agility?.potential??derivedPotential(war),derivedPotential(intelligence)]);}
  // 1级裸属性与成长潜力独立；换武器不会改写人物的成长曲线。
  const PROFILES={
    hero:profile([10,10,10,10,10],[50,50,50,50,50]),
    xuchu:generalProfile('xuchu',[13,5,12,8,6]),dianwei:generalProfile('dianwei',[13,5,12,8,6]),huangzhong:generalProfile('huangzhong',[12,7,11,9,9]),maliang:generalProfile('maliang',[5,12,9,7,11]),taishici:generalProfile('taishici',[12,7,11,10,9]),
    zhangjiao:generalProfile('zhangjiao',[6,12,10,8,10]),
    zhangbao:generalProfile('zhangbao',[6,10,11,8,10]),
    zhangliang:generalProfile('zhangliang',[12,5,12,7,7]),
    zhenji:generalProfile('zhenji',[5,12,9,8,11]),
    zhaoyun:generalProfile('zhaoyun',[12,7,11,11,10]),
    thief:profile([8,3,12,10,8],[40,15,45,60,45]),
    riverBandit:profile([10,3,13,8,7],[45,15,50,45,40]),
    mountainBandit:profile([12,3,15,5,6],[55,15,60,25,35]),
    brigand:profile([13,3,16,6,7],[55,15,60,35,40]),
    yellowMilitia:profile([7,3,9,7,5],[35,15,45,40,30]),
    yellowSkirmisher:profile([6,3,8,9,6],[30,15,40,60,35]),
    yellowGuard:profile([9,3,11,5,5],[45,15,50,30,30]),
    imperialSoldier:profile([8,4,10,6,6],[40,20,45,40,30]),
    imperialPikeman:profile([8,4,10,8,6],[40,20,45,60,30]),
    imperialGuard:profile([10,4,11,6,5],[50,20,50,35,30]),
    imperialSkirmisher:profile([7,4,9,10,7],[35,20,40,65,35]),
    imperialCaptain:profile([8,4,12,6,6],[40,20,75,40,30]),
    zhouyu:generalProfile('zhouyu',[7,12,9,10,10]),
    huanggai:generalProfile('huanggai',[10,6,12,8,8]),
    ganning:generalProfile('ganning',[12,6,10,12,10]),
    lusu:generalProfile('lusu',[6,12,10,8,9]),
    zhugeliang:generalProfile('zhugeliang',[5,14,8,9,12]),
    caocao:generalProfile('caocao',[8,11,12,9,10]),
    zhangliao:generalProfile('zhangliao',[11,7,11,10,10]),
    xuhuang:generalProfile('xuhuang',[11,6,11,9,9]),
    yujin:generalProfile('yujin',[9,8,11,8,8]),
    caoren:generalProfile('caoren',[10,5,13,7,8]),
    sunquan:generalProfile('sunquan',[7,10,11,9,9]),
    lvbu:generalProfile('lvbu',[14,4,12,11,10])
  };
  function normalizeKnownPotentials(unit){
    const id=unit.characterId||unit.id;let next=unit;
    if(!(unit.potentialRevision>=2)&&GENERAL_POTENTIALS[id]&&unit.potentials){next=clone(unit);if(!(unit.potentialRevision>=1))for(const key of ['war','intelligence'])next.potentials[key]=PROFILES[id].potentials[key];for(const key of ['constitution','speed','technique'])next.potentials[key]=PROFILES[id].potentials[key];next.potentialRevision=2;}
    if(AGILITY_PROFILES[id]&&next.agilityRevision!==1&&next.baseAttributes&&next.potentials){next=clone(next);next.baseAttributes.speed=Math.max(next.baseAttributes.speed||1,AGILITY_PROFILES[id].base);next.potentials.speed=Math.max(next.potentials.speed||1,AGILITY_PROFILES[id].potential);const attributes=attributesAt(next.baseAttributes,next.potentials,next.level);next.attributes={...next.attributes,speed:attributes.speed};next.speed=attributes.speed;next.agilityRevision=1;}
    const profession=Professions.forUnit(unit);if(profession&&next.constitutionRevision!==1&&next.baseAttributes&&next.potentials){next=clone(next);next.potentials.constitution=profession.constitution;const attributes=attributesAt(next.baseAttributes,next.potentials,next.level);next.attributes={...next.attributes,constitution:attributes.constitution};next.constitution=attributes.constitution;next.constitutionRevision=1;delete next.maxSoldiers;}
    return next;
  }
  const clone=x=>JSON.parse(JSON.stringify(x)),positive=value=>Math.max(1,Math.floor(Number(value)||1)),level=value=>positive(value);
  const growthPerLevel=potential=>positive(potential)*.04;
  function attributesAt(baseAttributes,potentials,currentLevel){
    const upgrades=level(currentLevel)-1;
    // 按累计成长取整，保留跨级的小数进度；逐级升与直接设等级结果相同。
    return Object.fromEntries(KEYS.map(key=>[key,positive(baseAttributes[key])+Math.floor(upgrades*positive(potentials[key])*4/100)]));
  }
  function create(id,currentLevel=1,overrides={}){
    const preset=PROFILES[id];if(!preset)throw new TypeError('未知成长档案：'+id);
    const baseAttributes=clone(overrides.baseAttributes||preset.baseAttributes),potentials=clone(overrides.potentials||preset.potentials),current=level(currentLevel),attributes=attributesAt(baseAttributes,potentials,current);
    return {growthVersion:1,potentialRevision:2,...(Professions.definitions[id]?{constitutionRevision:1}:{}),...(AGILITY_PROFILES[id]?{agilityRevision:1}:{}),level:current,baseAttributes,potentials,attributes,...attributes};
  }
  function characterAt(character,currentLevel=character.level||1){
    const values=create('hero',currentLevel,{baseAttributes:character.baseAttributes||PROFILES.hero.baseAttributes,potentials:character.potentials||PROFILES.hero.potentials});
    const {war,intelligence,constitution,speed,technique,...record}=values;return {...clone(character),...record};
  }
  const validGrowth=c=>Number.isSafeInteger(c.level)&&c.level>=1&&KEYS.every(key=>Number.isSafeInteger(c.baseAttributes?.[key])&&c.baseAttributes[key]>=1&&Number.isSafeInteger(c.potentials?.[key])&&c.potentials[key]>=1);
  function normalizeCharacter(character){
    const next=clone(character);delete next.weaponProficiencies;delete next.weaponExperience;if(next.attributes){next.attributes.constitution??=next.attributes.leadership;delete next.attributes.leadership;}
    if(next.growthVersion===1){if(!validGrowth(next)||!KEYS.every(k=>Number.isSafeInteger(next.attributes?.[k])&&next.attributes[k]>=1))return next;return characterAt(next);}
    const old=next.attributes||{},potentials=Object.fromEntries(KEYS.map(key=>[key,Math.max(1,Math.round((Number(old[key])||1)*100/255))]));
    return characterAt({...next,potentials,legacyMaxHealth:positive(old.constitution)*10},next.level||1);
  }
  const GENERAL_IDS=['xuchu','dianwei','huangzhong','maliang','taishici','hero','zhangjiao','zhangbao','zhangliang','zhaoyun','zhenji','zhouyu','huanggai','ganning','lusu','zhugeliang','caocao','zhangliao','xuhuang','yujin','caoren','sunquan','lvbu'];
  const isGeneral=unit=>unit.unitType==='general'||GENERAL_IDS.includes(unit.characterId||unit.id);
  const api={GENERAL_IDS,isGeneral,ATTRIBUTES,KEYS,PROFILES,GENERAL_POTENTIALS,AGILITY_PROFILES,derivedPotential,normalizeKnownPotentials,growthPerLevel,attributesAt,create,characterAt,normalizeCharacter,validGrowth};root.CharacterGrowth=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
