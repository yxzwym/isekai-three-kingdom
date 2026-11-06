(function(root){
  'use strict';
  const ATTRIBUTES=[['war','武力'],['intelligence','智力'],['constitution','体质'],['speed','速度'],['technique','技巧']],KEYS=ATTRIBUTES.map(([id])=>id);
  const vector=(war,intelligence,constitution,speed,technique)=>({war,intelligence,constitution,speed,technique});
  const profile=(base,potentials)=>({baseAttributes:vector(...base),potentials:vector(...potentials)});
  // 1级裸属性与成长潜力独立；换武器不会改写人物的成长曲线。
  const PROFILES={
    hero:profile([10,10,10,10,10],[50,50,50,50,50]),
    zhangjiao:profile([6,12,10,8,10],[25,86,70,60,85]),
    zhangbao:profile([6,10,11,8,10],[71,81,70,60,80]),
    zhangliang:profile([12,5,12,7,7],[80,68,90,45,55]),
    zhenji:profile([5,12,9,8,11],[4,71,65,68,87]),
    zhaoyun:profile([12,7,11,11,10],[96,76,88,92,94]),
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
    zhouyu:profile([7,12,9,10,10],[71,96,97,84,88]),
    huanggai:profile([10,6,12,8,8],[83,65,80,68,78]),
    ganning:profile([12,6,10,12,10],[94,76,90,92,92]),
    lusu:profile([6,12,10,8,9],[56,92,88,70,74]),
    zhugeliang:profile([5,14,8,9,12],[38,100,92,86,90]),
    caocao:profile([8,11,12,9,10],[72,91,100,80,87]),
    zhangliao:profile([11,7,11,10,10],[92,78,95,88,90]),
    xuhuang:profile([11,6,11,9,9],[90,74,90,76,85]),
    yujin:profile([9,8,11,8,8],[78,70,92,72,80]),
    caoren:profile([10,5,13,7,8],[86,56,89,60,72]),
    sunquan:profile([7,10,11,9,9],[67,80,94,75,78]),
    lvbu:profile([14,4,12,11,10],[100,26,87,85,95])
  };
  // 原作只有武力、智力与本作同名；其余三项是本作的独立成长参数。
  const POTENTIAL_REFERENCE={edition:'三国志11',fields:['war','intelligence'],pages:{zhangjiao:611,zhangbao:642,zhangliang:646,zhenji:510,zhaoyun:201,zhouyu:456,huanggai:375,ganning:323,lusu:869,zhugeliang:123,caocao:338,zhangliao:204,xuhuang:500,yujin:211,caoren:551,sunquan:576,lvbu:202}};
  function normalizeKnownPotentials(unit){
    const id=unit.characterId||unit.id;if(unit.potentialRevision>=1||!POTENTIAL_REFERENCE.pages[id]||!unit.potentials)return unit;
    const next=clone(unit);for(const key of POTENTIAL_REFERENCE.fields)next.potentials[key]=PROFILES[id].potentials[key];next.potentialRevision=1;return next;
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
    return {growthVersion:1,potentialRevision:1,level:current,baseAttributes,potentials,attributes,...attributes};
  }
  function characterAt(character,currentLevel=character.level||1){
    const values=create('hero',currentLevel,{baseAttributes:character.baseAttributes||PROFILES.hero.baseAttributes,potentials:character.potentials||PROFILES.hero.potentials});
    const {war,intelligence,constitution,speed,technique,...record}=values;return {...clone(character),...record};
  }
  const validGrowth=c=>Number.isSafeInteger(c.level)&&c.level>=1&&KEYS.every(key=>Number.isSafeInteger(c.baseAttributes?.[key])&&c.baseAttributes[key]>=1&&Number.isSafeInteger(c.potentials?.[key])&&c.potentials[key]>=1);
  function normalizeCharacter(character){
    const next=clone(character);if(next.attributes){next.attributes.constitution??=next.attributes.leadership;delete next.attributes.leadership;}
    if(next.growthVersion===1){if(!validGrowth(next)||!KEYS.every(k=>Number.isSafeInteger(next.attributes?.[k])&&next.attributes[k]>=1))return next;return characterAt(next);}
    const old=next.attributes||{},potentials=Object.fromEntries(KEYS.map(key=>[key,Math.max(1,Math.round((Number(old[key])||1)*100/255))]));
    return characterAt({...next,potentials,legacyMaxHealth:positive(old.constitution)*10},next.level||1);
  }
  const GENERAL_IDS=['hero','zhangjiao','zhangbao','zhangliang','zhaoyun','zhenji','zhouyu','huanggai','ganning','lusu','zhugeliang','caocao','zhangliao','xuhuang','yujin','caoren','sunquan','lvbu'];
  const isGeneral=unit=>unit.unitType==='general'||GENERAL_IDS.includes(unit.characterId||unit.id);
  const api={GENERAL_IDS,isGeneral,ATTRIBUTES,KEYS,PROFILES,POTENTIAL_REFERENCE,normalizeKnownPotentials,growthPerLevel,attributesAt,create,characterAt,normalizeCharacter,validGrowth};root.CharacterGrowth=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
