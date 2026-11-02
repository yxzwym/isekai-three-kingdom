(function(root){
  'use strict';
  const SKILLS = {
    strike: { id:'strike', scope:'single', name:'奋击', kind:'physical', cost:0, side:'enemy', icon:'戈', description:'物理技能，使用兵力、武力与装备攻击计算伤害。' },
    huoshen: { id: 'huoshen', scope: 'all', name: '火神计', kind: 'tactic', element: 'fire', base: 4000, cost: 8, side: 'enemy', all: true, icon: '焰', description: '火计，基数4000。全体攻击，按目标数分摊。' },
    dare: { id: 'dare', scope: 'single', name: '大热计', kind: 'tactic', element: 'fire', base: 2500, cost: 6, side: 'enemy', all: true, icon: '火', description: '火计，基数2500。伤害由智力决定，不随自身残兵降低。' },
    hongshui: { id: 'hongshui', scope: 'all', name: '洪水计', kind: 'tactic', element: 'water', base: 2700, cost: 8, side: 'enemy', all: true, icon: '澜', description: '水计，基数2700。需战场允许水计。' },
    luoshi: { id: 'luoshi', scope: 'single', name: '落石计', kind: 'tactic', element: 'stone', base: 1500, cost: 6, side: 'enemy', all: true, icon: '石', description: '计策伤害基数1500，忽略物理攻防。' },
    yinxian: { id: 'yinxian', scope: 'single', name: '银仙计', kind: 'heal', base: 2000, cost: 4, side: 'ally', all: true, icon: '援', description: '基数2000的回复计。不能复活，不能超过最大兵力。' },
    tongxian: { id: 'tongxian', scope: 'all', name: '铜仙计', kind: 'heal', base: 800, cost: 4, side: 'ally', all: true, icon: '复', description: '基数800的回复计，回复全体友军。' }
  };
  const DEFAULTS = { seed: 'battle', level: 1, enemyLevel: 1, allySp: 0, mitigationScale:100, random: true, critical: true, hit: true, criticalSource: 'technique', physicalRandom: 'list', timing: 'classic', skillDelays: { huoshen: 1, dare: .6, hongshui: .8, luoshi: .4, yinxian: .5, tongxian: .3 }, reinforcements: [], rosterOverrides: {} };
  const api = {SKILLS, DEFAULTS}; root.BattleRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
