(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,get=(f,k)=>node?require('./'+f+'.js'):root[k],G=get('character-growth','CharacterGrowth'),R=get('game-rules','PengpaiRules'),C=get('weapon-catalog','WeaponCatalog'),I=get('items','ItemCatalog'),W=get('weapon-skills','WeaponSkills'),E=get('engine','BattleEngine');
 const REFRESH_COST=100,HIRE_COST=100,COUNT=3,capitals=['xuchang','chengdu','jianye'];
 const appearances=Object.fromEntries(['warrior','mage','healer','assassin','ranger','berserker'].map(group=>[group,[1,2,3,4].map((variant,i)=>({id:'recruit-'+group+(variant===1?'':'-'+variant),gender:(['healer','assassin'].includes(group)?['female','male','male','female']:['male','male','female','female'])[i]}))]));
 const surnames=['陈','刘','张','赵','孙','周','吴','郑','王','冯','卫','许','沈','杨','韩','曹','方','陆','秦','袁','杜','严','程','丁','石','宋'],given={male:['平','安','岳','成','远','义','衡','毅','康','志诚','守义','明远','仲平','子安','文昭','承志'],female:['宁','兰','青','芳','芸','玉','月','秀','静宜','清禾','兰心','知秋','若云','素贞','玉蓉']};
 const pick=(a,rng)=>a[Math.min(a.length-1,Math.floor(rng()*a.length))],copy=v=>JSON.parse(JSON.stringify(v));
 function name(gender,rng){return pick(surnames,rng)+pick(given[gender],rng);}
 function generate(seed,generation=0){const rng=E.seededRandom(seed+':tavern:'+generation),usedArt=new Set();return Array.from({length:COUNT},(_,index)=>{
  const group=pick(C.groups,rng).id,art=pick(appearances[group].filter(a=>!usedArt.has(a.id)),rng),rating=pick([40,40,50,50,60,60,70,80,90],rng),potentials=Object.fromEntries(G.KEYS.map(k=>[k,Math.min(100,Math.max(20,rating+Math.floor(rng()*41)-20))]));usedArt.add(art.id);
  // 资质独立随机；职业只决定一级基础与可选择的兵器方向。
  const count=rng()<.03?3:rng()<.18?2:1;
  return {id:'retainer-'+generation+'-'+index,group,characterId:art.id,name:name(art.gender,rng),gender:art.gender,potentials,passives:R.rollPassives(rng,count,{white:35,green:32,blue:23,gold:9,red:1})};
 });}
 function normalize(value,seed){const generation=Math.max(0,Math.floor(Number(value?.generation)||0)),pool=generate(seed,generation),rows=Array.isArray(value?.candidates)?value.candidates:null;return {generation,candidates:rows?pool.map(expected=>{const row=rows.find(c=>c?.id===expected.id);if(!row)return null;const art=appearances[row.group]?.find?.(a=>a.id===row.characterId),valid=art&&G.KEYS.every(k=>Number.isInteger(row.potentials?.[k])&&row.potentials[k]>=1&&row.potentials[k]<=100)&&Array.isArray(row.passives)&&row.passives.length>=1&&row.passives.length<=3&&row.passives.every(p=>Object.hasOwn(R.PASSIVE_MAP,p)&&!R.PASSIVE_MAP[p].fusionOnly);return valid?{...expected,...copy(row),gender:art.gender,name:R.heroName(row.name)}:expected;}).filter(Boolean):pool};}
 function create(candidate,type,level,home){const weaponType=C.types.find(t=>t.id===type);if(!candidate||weaponType?.group!==candidate.group||!capitals.includes(home))return null;
  const base={warrior:[11,6,12,9,9],mage:[5,12,10,10,11],healer:[5,12,10,11,10],assassin:[10,6,10,12,12],ranger:[11,6,10,11,11],berserker:[13,5,13,8,8]}[candidate.group],baseAttributes=Object.fromEntries(G.KEYS.map((k,i)=>[k,base[i]])),growth=G.create('hero',level,{baseAttributes,potentials:candidate.potentials}),weapon=I.create('weapon-'+type,'white',candidate.id+'-weapon'),skills=W.forWeapon(weapon);
  return {...growth,id:candidate.id,name:candidate.name,characterId:candidate.characterId,gender:candidate.gender,unitType:'general',origin:'tavern',recruitGroup:candidate.group,lockedWeaponType:type,homeNode:home,experience:0,experienceVersion:2,recruitLevelVersion:1,weaponPlanVersion:3,constitutionRevision:1,weapon,skills,priorities:W.prioritiesFor(skills),equipment:{armor:I.create('cloth-armor','white',candidate.id+'-armor'),accessory1:null,accessory2:null},weaponProficiencies:{[type]:0},armor:0,resistance:0,passives:[...candidate.passives]};
 }
 function npc(place){return capitals.includes(place)?{id:'tavern-'+place,name:'酒肆掌柜',art:'innkeeper',side:'left',role:'tavern',roleLabel:'招募'}:null;}
 const api={REFRESH_COST,HIRE_COST,COUNT,capitals,appearances,generate,normalize,create,npc};root.TavernRecruitment=api;if(node)module.exports=api;
})(globalThis);
