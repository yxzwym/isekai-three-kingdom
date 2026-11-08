const {E,general,H,RC,Chapter,World,R}=require('./balance.cjs');
const Simulator=require('../../js/battle-simulator.js'),Catalog=require('../../js/enemy-catalog.js'),N=require('../../js/nearby-content.js'),D=require('../../js/world-data.js'),P=require('../../js/prologue.js');
function groups(){
 const out=[];
 for(const d of Object.values(H.definitions))for(const phase of Object.keys(d.battles||{}))out.push({key:'quest:'+d.id+':'+phase,roster:RC.enemies(d.id,phase)});
 for(const boss of Simulator.bosses)out.push({key:boss.id,roster:boss.roster()});
 for(const level of [1,3,5,10,15,20])for(const role of Object.keys(Catalog.profiles))out.push({key:'mob:'+role+':'+level,roster:[Catalog.unit(role,level)]});
 const character={name:'审校',appearance:'scholar',difficulty:'normal',...R.rollHero('normal',()=>.5)};
 for(const quest of N.sideQuests){const w=new World(character,{introStep:2});w.pending={kind:'side',questId:quest.id,seed:'audit'};out.push({key:'side:'+quest.id,roster:w.battleScenario().enemies});}
 for(const phase of Object.keys(N.storyBattles)){const w=new World(character,{introStep:2});w.pending={kind:'story',phase,seed:'audit'};out.push({key:'story:'+phase,roster:w.battleScenario().enemies});}
 for(const option of D.trainingOptions){const w=new World(character,{introStep:2});out.push({key:'training:'+option.id,roster:w.trainingRoster(option)});}
 for(const phase of ['first-fight','manual-fight','squad-fight'])out.push({key:'prologue:'+phase,roster:P.createBattle(phase,character).enemies});
 return out;
}
function inspect(group,difficulty='normal'){
 const battle=new E.Battle({allies:[general('zhaoyun',20)],enemies:group.roster,rules:{difficulty}});
 return battle.living('enemy').map(unit=>{
  const actor=battle.effective(unit),skills=unit.skills.map(id=>battle.skills[id]);
  return {group:group.key,name:unit.name,level:unit.level,health:unit.maxSoldiers,attributes:Object.fromEntries(['war','intelligence','constitution','speed','technique'].map(key=>[key,actor[key]])),
   skills:skills.map(skill=>{const target={armor:0,resistance:0,soldiers:1000,maxSoldiers:1000},critical=1.5+(actor.criticalDamageBonus||0)+(skill.kind==='tactic'?(actor.tacticCriticalDamageBonus||0):0);return {name:skill.name,kind:skill.kind,scope:skill.scope,normal:E.calculate({attacker:actor,target,skill}).amount,critical:E.calculate({attacker:actor,target,skill,critical}).amount,periodic:(skill.effects||[]).filter(effect=>effect.period&&!effect.healing).map(effect=>({id:effect.id,amount:effect.amount??Math.round((effect.base||0)+(effect.coefficient||0)*actor[effect.stat||'technique']),duration:effect.duration}))};})};
 });
}
module.exports={groups,inspect};
