(function (root) {
  'use strict';
  const convert = value => Math.max(1, Math.round(value * 255 / 100));
  const { SKILLS } = typeof module !== 'undefined' && module.exports ? require('./rules.js') : root.BattleRules;
  const CharacterAssets = typeof module !== 'undefined' && module.exports ? require('./character-assets.js') : root.CharacterAssets;
  const rule = (skill, when, threshold, scope = 'single') => ({ skill, when, threshold, scope });
  function general(id, name, title, side, w, i, l, s, t, attack, armor, skills, priorities, extra = {}) {
    return { id, characterId:id, name, title, side, war: convert(w), intelligence: convert(i), leadership: convert(l), speed: convert(s), technique: convert(t), attack, armor, resistance:0, skills, priorities, enemySp: 24, ...extra };
  }
  const ALLIES = [
    general('zhouyu', '周瑜', '大都督', 'ally', 71, 96, 97, 84, 88, 85, 150, ['huoshen', 'dare', 'strike'], [rule('huoshen', 'enemyCount', 3, 'all'), rule('dare','always',0), rule('strike','always',0)]),
    general('huanggai', '黄盖', '破浪先锋', 'ally', 83, 69, 80, 68, 78, 105, 165, ['dare', 'strike'], [rule('dare', 'enemyCount', 4, 'all'), rule('strike','always',0)]),
    general('ganning', '甘宁', '锦帆将军', 'ally', 94, 76, 90, 92, 92, 115, 135, ['luoshi', 'strike'], [rule('luoshi','always',0), rule('strike','always',0)]),
    general('lusu', '鲁肃', '赞军校尉', 'ally', 56, 92, 88, 70, 74, 60, 155, ['yinxian', 'hongshui', 'strike'], [rule('yinxian', 'allyBelow', .55), { ...rule('hongshui', 'enemyCount', 4, 'all'), disabled: true }, rule('strike','always',0)]),
    general('zhugeliang', '诸葛亮', '卧龙', 'ally', 38, 100, 92, 86, 90, 60, 140, ['yinxian', 'huoshen', 'strike'], [rule('yinxian', 'allyBelow', .45), { ...rule('huoshen', 'enemyCount', 3, 'all'), disabled: true }, rule('strike','always',0)], { passive: '卧龙 · 物理技能50%闪避', dodge: .5 })
  ];
  const ENEMIES = [
    general('caocao', '曹操', '北军主帅', 'enemy', 72, 91, 100, 80, 87, 100, 190, ['yinxian', 'dare', 'strike'], [rule('yinxian', 'allyBelow', .4), rule('dare', 'enemyCount', 3, 'all'), rule('strike','always',0)], { enemySp: 30 }),
    general('zhangliao', '张辽', '前军都督', 'enemy', 92, 78, 95, 88, 90, 120, 160, ['luoshi', 'strike'], [rule('luoshi','always',0), rule('strike','always',0)]),
    general('xuhuang', '徐晃', '长驱将军', 'enemy', 90, 72, 90, 76, 85, 125, 165, ['luoshi', 'strike'], [rule('luoshi','always',0), rule('strike','always',0)]),
    general('yujin', '于禁', '水军都督', 'enemy', 78, 76, 92, 72, 80, 100, 180, ['tongxian', 'hongshui', 'strike'], [rule('tongxian', 'allyBelow', .45), rule('hongshui', 'enemyCount', 4, 'all'), rule('strike','always',0)]),
    general('caoren', '曹仁', '铁壁中军', 'enemy', 86, 64, 89, 60, 72, 110, 200, ['dare', 'strike'], [rule('dare','always',0), rule('strike','always',0)])
  ];
  const REINFORCEMENTS = [
    general('sunquan', '孙权', '剧情援军', 'ally', 67, 80, 94, 75, 78, 95, 175, ['tongxian', 'dare', 'strike'], [rule('tongxian', 'allyBelow', .5), rule('dare', 'enemyCount', 3, 'all'), rule('strike','always',0)]),
    general('lvbu', '吕布', '跨时空校验', 'ally', 100, 26, 87, 85, 95, 145, 170, ['strike'], [rule('strike','always',0)], { passive: '飞将 · 必会心 / 无视护甲', guaranteedCritical: true, ignoreArmor: true })
  ];
  const DEFAULTS = { seed: '赤壁-208', level: 40, enemyLevel: 60, allySp: 64, random: true, critical: true, hit: true, criticalSource: 'technique', physicalRandom: 'list', timing: 'classic', skillDelays: { huoshen: 1, dare: .6, hongshui: .8, luoshi: .4, yinxian: .5, tongxian: .3 }, reinforcements: [], rosterOverrides: {} };
  function appearance(u) {
    const art=CharacterAssets.resolve(u.characterId || u.id,u.artVariant);
    return {...u,artVariant:art.variant,portrait:u.portrait || art.portrait,fullbody:u.fullbody || art.fullbody};
  }
  function createChibi(rules = {}) {
    const config = {...DEFAULTS,...rules};
    const allies = [...ALLIES, ...REINFORCEMENTS.filter(u=>(config.reinforcements||[]).includes(u.id))].map(appearance);
    return {id:'chibi-demo',title:'赤壁之战',allies,enemies:ENEMIES.map(appearance),rules:config,allowRetreat:false,scene:{background:'./assets/chibi-night.jpg',color:'#081d27',allowedElements:['fire','water','stone']}};
  }
  function createFormationPreview(){
    const scenario=createChibi();scenario.id='formation-preview';scenario.title='全身立绘验证';scenario.allies=scenario.allies.map(u=>({...u,initialMode:'manual'}));scenario.enemies=[appearance({...ALLIES[0],id:'opponent-zhouyu',characterId:'zhouyu',attack:1,armor:99999,resistance:99999,leadership:1020,skills:['strike'],priorities:[rule('strike','always',0)]})];return scenario;
  }
  function createEncounter() {
    return {id:'road-encounter',title:'道旁遇袭',allies:[appearance({...ALLIES[2],id:'traveler',name:'旅人',skills:['luoshi','strike'],priorities:[rule('luoshi','always',0),rule('strike','always',0)]})],enemies:[appearance({...ENEMIES[1],id:'raider',name:'盗匪',skills:['strike'],priorities:[rule('strike','always',0)]})],rules:{...DEFAULTS,level:10,enemyLevel:10,seed:'road-1',allySp:12},allowRetreat:true,scene:{color:'#25352d',allowedElements:['fire','stone']}};
  }
  // Diagnostic fixture only: the engine/rendering code contains no fixture IDs.
  function createEffectsPreview() {
    const attack=(id,name,element,scope='single')=>({...SKILLS.luoshi,id,name,element,scope,cost:0,vfx:element});
    const buff=(id,name,side,definition)=>({id,name,kind:'buff',side,scope:'single',cost:0,buff:{id,duration:10,...definition}});
    const skills={
      fx_fire:attack('fx_fire','火矢','fire'),fx_fire_all:attack('fx_fire_all','烈焰','fire','all'),
      fx_thunder:attack('fx_thunder','雷击','thunder'),fx_wood:attack('fx_wood','藤袭','wood'),fx_water:attack('fx_water','洪流','water','all'),fx_earth:attack('fx_earth','落岩','earth','all'),
      fx_heal:{...SKILLS.yinxian,id:'fx_heal',scope:'single',cost:0},fx_heal_all:{...SKILLS.tongxian,id:'fx_heal_all',scope:'all',cost:0},
      fx_taunt:buff('fx_taunt','嘲讽','self',{taunt:true,visual:'buff'}),fx_boost:buff('fx_boost','奋起','ally',{attackMultiplier:1.2}),fx_weaken:buff('fx_weaken','破甲','enemy',{armorMultiplier:.8,visual:'debuff'})
    };
    const slots=[['fx_fire','fx_fire_all','strike'],['fx_thunder','fx_taunt'],['fx_wood','fx_boost'],['fx_water','fx_heal'],['fx_earth','fx_heal_all','fx_weaken']];
    return {id:'effects-preview',title:'特效与操作验证',skills,
      allies:ALLIES.map((u,i)=>appearance({...u,initialMode:'manual',leadership:510,startSoldiers:6000,attack:1000,armor:999,resistance:100,skills:slots[i],priorities:[rule(slots[i][0],'always',0)],guaranteedCritical:true})),
      enemies:ENEMIES.map(u=>appearance({...u,leadership:1020,attack:1,speed:1,armor:999,resistance:100,skills:['strike'],priorities:[rule('strike','always',0)],guaranteedCritical:true})),
      rules:{...DEFAULTS,level:80,enemyLevel:80,allySp:64,random:false,hit:false},scene:{background:'./assets/chibi-night.jpg'},allowRetreat:false};
  }
  function createStress(){
    const burst={...SKILLS.huoshen,id:'stress_burst',name:'火攻',cost:0};
    const unit=u=>appearance({...u,war:200,speed:200,leadership:1020,armor:100000,resistance:100000,skills:['stress_burst'],priorities:[rule('stress_burst','always',0)],enemySp:99999});
    return{id:'stress',title:'同步施法压力验证',allies:ALLIES.map(unit),enemies:ENEMIES.map(unit),skills:{stress_burst:burst},rules:{...DEFAULTS,level:99,enemyLevel:99,allySp:99999,random:false,critical:false,hit:false},scene:{background:'./assets/chibi-night.jpg'}};
  }
  const api = { SKILLS, ALLIES, ENEMIES, REINFORCEMENTS, DEFAULTS, convert, createChibi, createEncounter, createEffectsPreview, createStress,createFormationPreview };
  root.BattleScenarios = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
