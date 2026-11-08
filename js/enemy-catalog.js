(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,W=node?require('./weapon-skills.js'):root.WeaponSkills;
 const profiles={
  novice:{name:'盗贼',art:'thief',type:'spear',base:[8,3,10,9,10,2,1,5],growth:[1.5,.5,2,1.3,1,.4,.3,.5],skills:['spear-cut']},
  apprentice:{name:'方士学徒',art:'herbalist',type:'staff',base:[3,7,10,10,10,1,3,3],growth:[.5,1.3,1.8,1.4,1,.3,.5,.4],skills:[{base:'staff-fire',name:'火符',effects:[]}]},
  infantry:{name:'盗贼',art:'thief',type:'spear',base:[13,4,16,11,12,4,2,7],growth:[3,1,4,1.5,2,1,.5,1],skills:['spear-cut']},
  captain:{name:'盗贼队长',art:'brigand',type:'shield',base:[16,5,34,10,14,12,3,9],growth:[3,1,8,1.5,2,2,1,1],skills:['shield-taunt','spear-cut']},
  archer:{name:'盗匪弓手',art:'mountain-bandit',type:'bow',base:[16,4,14,14,16,3,2,8],growth:[3.3,1,3.5,1.8,2.5,.7,.5,1],skills:[{base:'spear-cut',name:'疾射',scaling:{war:1.7},cooldown:1.7}]},
  caster:{name:'游方法士',art:'herbalist',type:'staff',base:[5,20,14,14,17,2,14,8],growth:[1,3.7,3.5,1.8,2.4,.5,1.8,1],skills:['staff-fire','staff-flame']},
  medic:{name:'盗匪医师',art:'town-doctor',type:'needle',base:[4,18,14,14,16,3,10,7],growth:[1,3.2,3.5,1.7,2,.8,1.4,.8],skills:[{base:'needle-stun',name:'飞针',effects:[]},'needle-heal']},
  healer:{name:'符水医师',art:'herbalist',type:'scripture',base:[5,18,18,12,17,4,15,8],growth:[1,3.2,4,1.6,2,.8,1.8,.8],skills:['scripture-3','scripture-2']},
  witch:{name:'使毒巫医',art:'herbalist',type:'gourd',base:[5,17,18,14,20,3,11,7],growth:[1,2.8,4,1.8,3,.7,1.4,.8],skills:['gourd-poison','gourd-regeneration']},
  raider:{name:'突袭盗贼',art:'thief',type:'dagger',base:[14,4,15,22,16,3,2,7],growth:[2.4,1,3.5,2.7,2,.6,.4,.8],skills:[{base:'spear-cut',name:'追袭',scaling:{war:1.25},cooldown:1}]},
  armored:{name:'重甲军士',art:'imperial-soldier',type:'spear',base:[16,4,30,9,12,30,1,8],growth:[3,1,7,1.4,2,5,.3,1],skills:['spear-cut']}
 };
 const patterns={tutorial:['novice','apprentice','novice'],patrol:['infantry','infantry','caster'],shieldwall:['captain','archer','caster','medic','infantry'],ambush:['raider','raider','raider','raider'],arcane:['infantry','caster','healer'],venom:['captain','witch','archer'],armored:['armored','armored','caster'],siege:['captain','caster','archer','healer','infantry']};
 function unit(role,level,index=0,options={}){
  role=profiles[role]?role:'infantry';const p=profiles[role],l=Math.max(1,Math.min(25,Math.floor(level)||1)),values=p.base.map((n,i)=>Math.round(n+p.growth[i]*(l-1))),[war,intelligence,constitution,speed,technique,armor,resistance,power]=values;
  const weapon={id:'enemy-'+role,type:p.type,name:({spear:'短枪',shield:'木盾',bow:'猎弓',staff:'木杖',needle:'银针',scripture:'医书',gourd:'药葫芦',dagger:'短匕'})[p.type],power,skills:p.skills},skills=W.forWeapon(weapon),priorities=W.prioritiesFor(skills),u={id:'enemy-'+role+'-'+index,name:p.name,characterId:p.art,unitType:'soldier',enemyRole:role,initialProgress:index*.11% .45,level:l,war,intelligence,constitution,speed,technique,armor,resistance,attack:power,weapon,skills,priorities,weaponProficiencies:{[p.type]:30},targetRule:'random',passives:[]};
  if(options.army){u.name=({infantry:'官兵',captain:'官兵队长',archer:'官兵弓手',caster:'军中方士',medic:'军医',healer:'随军医师',witch:'使毒方士',armored:'重甲官兵',raider:'军中刺客'})[role];u.characterId=role==='caster'||role==='witch'?'herbalist':role==='medic'||role==='healer'?'town-doctor':'imperial-soldier';}
  if(role==='raider'){u.targetRule='lowestCurrent';u.passives=['enemy-ignore-taunt','enemy-hunt-wounded'];}
  if(role==='captain'){u.passives=['enemy-stun-resistance'];u.statusImmunities=['stun'];}
  if(options.preserveIdentity)for(const key of ['id','name','characterId','formationRow','experienceWeight'])if(options[key]!=null)u[key]=options[key];
  return u;
 }
 function roster(level,count=3,pattern='patrol',options={}){const roles=patterns[pattern]||patterns.patrol,n=Math.max(1,count);return Array.from({length:n},(_,i)=>unit(roles[i%roles.length],level,i,options));}
 const api={profiles,patterns,unit,roster};root.EnemyCatalog=api;if(node)module.exports=api;
})(globalThis);
