(function(root){
 'use strict';
 const clean=n=>Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(Number(n)||0))),points=n=>Math.round(Math.max(0,Number(n)||0)*100)/100;
 const required=level=>4+clean(level),total=level=>clean(level)*(clean(level)+7)/2;
 const multiplier=(enemyLevel,level)=>[0,.1,.25,.45,.7,1,1.2,1.4,1.6,1.8,2][Math.max(-5,Math.min(5,clean(enemyLevel)-clean(level)))+5];
 const levelOf=(record,type)=>clean(record?.weaponProficiencies?.[type]);
 const power=(attack,record,type=record?.weapon?.proficiencyType||record?.weapon?.type)=>Math.max(0,Number(attack)||0)*(1+levelOf(record,type)/500);
 function grant(record,type,amount){
  const before=levelOf(record,type),experienceBefore=points(record.weaponExperience?.[type]),available=total(before)+experienceBefore+points(amount);
  let after=Math.max(before,Math.floor((-7+Math.sqrt(49+8*available))/2));
  // Correct possible floating point error on exact integer boundaries.
  if(total(after)>available)after--;if(total(after+1)<=available)after++;
  const experienceAfter=points(available-total(after));
  return {record:{...record,weaponProficiencies:{...record.weaponProficiencies,[type]:after},weaponExperience:{...record.weaponExperience,[type]:experienceAfter}},type,before,after,experienceBefore,experienceAfter,amount:points(amount)};
 }
 function rewards(result){
  const units=new Map((result.units||[]).map(u=>[u.id,u])),out=new Map(),buffUntil=new Map();
  for(const event of result.events||[]){
   const actor=units.get(event.actor),type=actor?.weapon?.proficiencyType||actor?.weapon?.type,skill=result.skills?.[event.skill];
   if(event.type!=='action'||event.periodic||event.reaction||event.passive||!actor||actor.side!=='ally'||!type||!skill||skill.reactionOnly)continue;
   let valid=false,foes=[];
   for(const r of event.results||[]){
    const target=units.get(r.target);if(!target||r.miss)continue;
    if(r.buff&&r.status){const key=target.id+':'+r.status.id,previous=buffUntil.get(key)||0;buffUntil.set(key,Math.max(previous,r.status.expiresAt||event.time));if(previous<=event.time)valid=true;}
    else if(!r.healing&&target.side!==actor.side&&r.amount>0){valid=true;foes.push(target);}
    else if(r.healing&&skill.kind==='heal'&&r.actual>0)valid=true;
   }
   if(!valid)continue;
   if(!foes.length)foes=[...(result.units||[])].filter(u=>u.side==='enemy');
   if(!foes.length)continue;
   const differenceLevel=Math.max(...foes.map(u=>u.level||1)),amount=multiplier(differenceLevel,actor.level||1);
   if(amount<=0)continue;
   const key=actor.id+':'+type,g=out.get(key)||{id:actor.id,type,amount:0,uses:0};g.amount=points(g.amount+amount);g.uses++;out.set(key,g);
  }
  return [...out.values()];
 }
 const api={required,total,multiplier,levelOf,power,grant,rewards};root.WeaponProficiency=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
