(function(root){
  'use strict';
  const make=(id,name,kind,scope,scaling,cooldown,extra={})=>({id,name,kind,scope,side:kind==='heal'?'ally':'enemy',cost:0,scaling,weaponCoefficient:1,hitChance:.4,criticalChance:.08,cooldown,...extra});
  const SKILLS={strike:make('strike','奋击','physical','single',{war:1},1.5),huoshen:make('huoshen','火神计','tactic','all',{intelligence:1.3},3,{element:'fire'}),dare:make('dare','大热计','tactic','single',{intelligence:2.55},1.8,{element:'fire'}),hongshui:make('hongshui','洪水计','tactic','all',{intelligence:1.5},3,{element:'water'}),luoshi:make('luoshi','落石计','tactic','single',{intelligence:2},2,{element:'earth'}),yinxian:make('yinxian','银仙计','heal','single',{intelligence:1.5},1.8),tongxian:make('tongxian','铜仙计','heal','all',{intelligence:.85},3.5)};
  const DEFAULTS={seed:'battle',level:1,enemyLevel:1,allySp:0,mitigationScale:50,random:false,critical:true,hit:true,retreatAfter:300,skillDelays:{},reinforcements:[],rosterOverrides:{}};
  const api={SKILLS,DEFAULTS};root.BattleRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
