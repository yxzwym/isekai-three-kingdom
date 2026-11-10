const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),S=require('../js/skill-icons.js'),C=require('../js/weapon-catalog.js'),W=require('../js/weapon-skills.js');
test('54个基础武器技能均有独立技能插画，同一武器的技能不共用装备图片',()=>{
 assert.equal(S.ids.length,64);assert.equal(new Set(S.ids).size,64);for(const src of S.atlases)assert.ok(fs.existsSync(path.join(__dirname,'..',src)));
 const tiles=new Set();for(const type of C.types){const local=new Set();for(const skill of type.skills){const art=S.resolve(skill),tile=art.src+':'+art.column+':'+art.row;assert.ok(S.atlases.includes(art.src));assert.ok(!art.src.includes('rpg-items'));assert.equal(art.id,skill.id);local.add(tile);tiles.add(tile);}assert.equal(local.size,type.skills.length,type.name+'技能图标重复');}
 assert.equal(tiles.size,54);
});
test('强化技能沿用对应图标，专武改名改倍率仍按技能模板解析，也可覆盖图标',()=>{
 for(const type of C.types)for(const skill of type.daySkills||[]){const base=skill.id.replace(/-day$/,'');if(S.ids.includes(base))assert.equal(S.resolve(skill).id,base);}
 const weapon=W.resolveWeapon({id:'fangtian-halberd',type:'halberd'}),definitions=W.definitionsForWeapon(weapon);assert.deepEqual(definitions.map(s=>S.resolve({...s,name:'专武绝技',scaling:{war:99}}).id),['sword-critical']);
 assert.equal(S.resolve({...definitions[0],iconId:'hammer-1'}).id,'hammer-1');assert.deepEqual(S.resolve({icon:{src:'./custom-skill.webp',crop:{x:10,y:20,width:40,height:40}}}),{src:'./custom-skill.webp',crop:{x:10,y:20,width:40,height:40}});
 assert.notEqual(S.resolve(W.skills['staff-shock']).column+':'+S.resolve(W.skills['staff-shock']).row,S.resolve(W.skills['staff-storm']).column+':'+S.resolve(W.skills['staff-storm']).row);
});
test('新增技能按范围和作用选择专用兜底图，绘制读取正确图集分格',()=>{
 assert.equal(S.resolve({kind:'physical',scope:'all'}).id,'$physical-all');assert.equal(S.resolve({kind:'heal',scope:'single'}).id,'$heal-single');assert.equal(S.resolve({kind:'heal',scope:'all'}).id,'$heal-all');assert.equal(S.resolve({kind:'buff',buff:{taunt:true}}).id,'shield-taunt');
 let args;const img={width:800,height:400};assert.ok(S.draw({drawImage(...a){args=a;}},W.skills['fan-frost'],10,20,48,{image:()=>img}));assert.deepEqual(args,[img,500,100,100,100,10,20,48,48]);
});
