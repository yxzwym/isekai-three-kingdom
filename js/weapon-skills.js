(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./weapon-catalog.js'):root.WeaponCatalog;
  const equipment=typeof module!=='undefined'&&module.exports?require('./equipment.js'):root.EquipmentSlots;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const skills=Object.fromEntries([...(C.legacyTypes||[]),...C.types].flatMap(t=>[...t.skills,...t.daySkills]).map(s=>[s.id,copy(s)]));
  const add=(id,name,kind,side,scope,extra={})=>skills[id]={id,name,kind,side,scope,cost:0,cooldown:scope==='all'?3:1.5,scaling:{[kind==='physical'?'war':'intelligence']:1},weaponCoefficient:1,...extra};
  add('punch','拳击','physical','enemy','single',{weaponCoefficient:0});
  add('spear-cut','直刺','physical','enemy','single');add('spear-sweep','横扫枪','physical','enemy','all',{scaling:{war:.8}});
  add('sword-cut','劈斩','physical','enemy','single');add('sword-sweep','横扫','physical','enemy','all',{scaling:{war:.8}});
  // 旧技能 ID 留作存档与反应技兼容，不再配置专属兵器。
  skills['staff-shock']={...JSON.parse(JSON.stringify(skills['staff-fire'])),id:'staff-shock',name:'电击',element:'thunder',effects:[{id:'paralysis',chance:.25,duration:8,speedMultiplier:.5}]};
  skills['staff-storm']={...JSON.parse(JSON.stringify(skills['staff-flame'])),id:'staff-storm',name:'落雷阵',element:'thunder',effects:[]};
  const specials={
    'fangtian-halberd':{id:'fangtian-halberd',type:'spear',name:'方天画戟',quality:'purple',unique:true,exclusive:true,skills:[{base:'sword-critical',scope:'all'}]}
  };
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
  const fingerprint=value=>{let n=2166136261;for(const c of JSON.stringify(canonical(value)))n=Math.imul(n^c.codePointAt(0),16777619);return (n>>>0).toString(36);};
  const special=weapon=>!!weapon&&(Array.isArray(weapon.skills)||!!specials[weapon.id]);
  function resolveWeapon(weapon){if(!weapon)return null;if(weapon.id==='fire-god-staff'){const {skills:oldSkills,school,exclusive,unique,...ordinary}=copy(weapon);return {...ordinary,id:'weapon-staff',name:'木杖',type:'staff'};}const preset=specials[weapon.id]||{};return weapon.id==='fangtian-halberd'?{...copy(weapon),...copy(preset)}:{...copy(preset),...copy(weapon)};}
  function definitionsForWeapon(weapon){
    const resolved=resolveWeapon(weapon);if(!resolved)return [copy(skills.punch)];
    const type=C.types.find(t=>t.id===(C.aliases[resolved.type]||resolved.type));
    const entries=Array.isArray(resolved.skills)?resolved.skills:(type?.[resolved.tier==='day'?'daySkills':'skills'].map(s=>s.id)||['punch']);
    return entries.map((entry,index)=>{
      if(typeof entry==='string'){if(!skills[entry])throw new TypeError('未知武器技能：'+entry);return copy(skills[entry]);}
      if(!entry||typeof entry!=='object')throw new TypeError('武器技能配置必须是技能ID或对象');
      const base=entry.base?skills[entry.base]:null;if(entry.base&&!base)throw new TypeError('未知技能模板：'+entry.base);
      const {base:baseId,...changes}=copy(entry),definition={cost:0,cooldown:0,weaponCoefficient:1,...copy(base||{}),...changes};
      if(base?.scaling&&changes.scaling)definition.scaling={...base.scaling,...changes.scaling};
      for(const key of ['name','kind','side','scope'])if(!definition[key])throw new TypeError('武器技能缺少字段：'+key);
      definition.id='weapon:'+fingerprint({weapon:resolved.id||resolved.type,index,definition});if(baseId)definition.template=baseId;return definition;
    });
  }
  function registerWeapon(weapon){const definitions=definitionsForWeapon(weapon);for(const definition of definitions)skills[definition.id]=copy(definition);return definitions.map(s=>s.id);}
  const forWeapon=registerWeapon;
  const forEquipment=unit=>forWeapon(unit.weapon);
  const prioritiesFor=ids=>ids.map(id=>{const s=skills[id];if(!s)throw new TypeError('未知技能：'+id);return s.kind==='buff'?{skill:id,when:'always'}:s.kind==='heal'?{skill:id,when:'healThresholds',selfThreshold:.65,allyThreshold:.65}:s.scope==='all'?{skill:id,when:'enemyCount',threshold:2}:{skill:id,when:'always',frequency:'sometimes'};});
  function migrateWeaponPlan(unit){
    const out=JSON.parse(JSON.stringify(unit));out.equipment=equipment.normalize(out.equipment);
    const hero=out.origin!=='tavern'&&(out.characterId||out.id);if(out.weapon&&hero&&out.heroLoadoutVersion!==1){const legacy=out.weapon.id==='fire-god-staff'||['green-dragon-glaive','serpent-spear','zhouyu-featherfan','luxun-featherfan'].includes(out.weapon.id)||['飞翼枪','白羽扇'].includes(out.weapon.name);if(legacy){const type=hero==='zhangjiao'?'staff':hero==='zhangfei'?'spear':hero==='guanyu'?'blade':hero==='machao'?'spear':'fan';const I=typeof module!=='undefined'&&module.exports?require('./items.js'):root.ItemCatalog;out.weapon=I.create('weapon-'+type,out.weapon.quality||'green',out.weapon.uid);out.skills=forWeapon(out.weapon);out.priorities=prioritiesFor(out.skills);out.weaponPlanMigrated=true;}out.heroLoadoutVersion=1;}
    if(out.weaponPlanVersion!==3&&!special(out.weapon)){
      const oldType=out.weapon?.type,nextType=C.legacyAliases[oldType]||oldType;if(out.weapon)out.weapon.type=nextType;
      if(out.weapon&&C.types.some(t=>t.id===nextType)&&(!out.skills?.length||out.skills.some(id=>!['punch','spear-cut','spear-sweep','sword-cut','sword-sweep'].includes(id)))){const next=forWeapon(out.weapon);if(JSON.stringify(out.skills)!==JSON.stringify(next)){out.skills=next;out.priorities=prioritiesFor(out.skills);out.weaponPlanMigrated=true;}}
    }
    if(special(out.weapon)){out.skills=forWeapon(out.weapon);out.priorities=out.priorities?.every(r=>out.skills.includes(r.skill))?out.priorities:prioritiesFor(out.skills);}
    const passiveCatalog=typeof module!=='undefined'&&module.exports?require('./passives.js'):root.BattlePassives;if(passiveCatalog?.heroDefaults[out.characterId||out.id])out.passives=passiveCatalog.forUnit(out);out.weaponPlanVersion=3;return out;
  }
  const effects=Object.fromEntries(Object.values(skills).flatMap(s=>s.effects||[]).map(e=>[e.id,e]));
  const api={skills,specials,special,resolveWeapon,definitionsForWeapon,registerWeapon,forWeapon,forEquipment,prioritiesFor,migrateWeaponPlan,effects};root.WeaponSkills=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
