const test=require('node:test'),assert=require('node:assert/strict'),C=require('../js/weapon-catalog.js');
test('熟练度按六大职业分组，所有18种武器完整且不重复',()=>{
 const groups=C.groupedTypes();assert.deepEqual(groups.map(g=>g.name),['战士','术士','医师','刺客','游侠','力士']);assert.deepEqual(groups.map(g=>g.types.length),[4,5,2,2,3,2]);const ids=groups.flatMap(g=>g.types.map(t=>t.id));assert.equal(new Set(ids).size,18);assert.deepEqual([...ids].sort(),C.types.map(t=>t.id).sort());
});
test('武器职业信息兼容旧类型和专武熟练度覆盖，未登记类型不会伪装成其他职业',()=>{
 assert.equal(C.classification({type:'sword'}).group.name,'战士');assert.equal(C.classification({type:'staff',school:'thunder'}).group.name,'术士');assert.equal(C.classification({type:'halberd',proficiencyType:'spear'}).type.id,'spear');assert.equal(C.classification({type:'custom',proficiencyType:'bow'}).group.name,'游侠');assert.equal(C.classification({type:'custom'}),null);assert.equal(C.classification(null),null);
});
