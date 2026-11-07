(function(root){
 'use strict';
 const itemDefinitions={
  'rounds-journal':{name:'巡诊簿',iconId:'scripture',description:'记有宜城伤者的住处与用药，完成“宜城送药”后由药徒整理。华佗要先交接好这些病人，才能放心出门。'},
  'ox-sinew':{name:'牛筋弓弦',iconId:'bow',description:'浏阳船夫保存的牛筋弦料。完成“渡边灯火”后获得，可用于修好黄忠的旧弓。'}
 };
 function itemRecord(world,id){const d=itemDefinitions[id],count=world.state.story.items[id]||0;return d&&count>0?{...d,id,uid:'quest-'+id,slot:'quest',questItem:true,quality:'blue',count}:null;}
 const itemRecords=world=>Object.keys(itemDefinitions).map(id=>itemRecord(world,id)).filter(Boolean);
 function check(world,rule={}){
  const s=world.state;if(rule.any&&!rule.any.some(option=>check(world,option).ok))return {ok:false,reason:rule.hint||'先把目前的线索查清楚。'};
  for(const [country,minimum]of Object.entries(rule.recruits||{}))if((s.recruits[country]||[]).length<minimum)return {ok:false,reason:'先为'+({wei:'魏',shu:'蜀',wu:'吴'}[country]||'各地')+'国招募至少'+minimum+'位将士，再来商议。'};
  for(const id of rule.quests||[])if(s.heroQuests[id]?.stage!=='complete')return {ok:false,reason:'这边的事情还没办妥，先把眼前的事处理好。'};
  for(const [id,value]of Object.entries(rule.flags||{}))if(s.story.flags[id]!==value)return {ok:false,reason:rule.hint||'先把打听到的事情查清楚，再来商议。'};
  for(const [id,count]of Object.entries(rule.items||{}))if((s.story.items[id]||0)<count)return {ok:false,reason:rule.hint||'需要的东西还没有备齐。'};
  if(rule.partyAny&&!rule.partyAny.some(id=>s.companions.some(u=>u.id===id)))return {ok:false,reason:rule.hint||'先请一位熟悉此事的同伴同行。'};
  if(rule.chapterComplete&&s.chapterOne?.stage!=='complete')return {ok:false,reason:'洛阳的事还没有结束。'};
  return {ok:true};
 }
 function apply(world,effects={}){
  for(const id of effects.acceptSide||[])world.acceptSide(id);
  for(const [id,amount]of Object.entries(effects.items||{}))world.state.story.items[id]=Math.max(0,(world.state.story.items[id]||0)+amount);
  Object.assign(world.state.story.flags,effects.flags||{});
  for(const [id,stage]of Object.entries(effects.stages||{}))if(world.state.heroQuests[id]&&root.HeroQuests.definitions[id]?.stages[stage]&&world.state.heroQuests[id].stage!=='complete'){world.state.heroQuests[id].stage=stage;world.state.heroQuests[id].accepted=true;}
  if(effects.money)world.state.money=Math.max(0,world.state.money+effects.money);if(effects.rest)world.rest();if(effects.enemyCap)world.unlockEnemyLevelCap(effects.enemyCap);
 }
 const api={check,apply,itemDefinitions,itemRecord,itemRecords};root.StoryRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
