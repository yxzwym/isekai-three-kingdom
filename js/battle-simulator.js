(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const get=(file,key)=>node?require('./'+file+'.js'):root[key];
  const R=get('game-rules','PengpaiRules'),G=get('character-growth','CharacterGrowth'),I=get('items','ItemCatalog'),W=get('weapon-skills','WeaponSkills');
  const World=get('world','WorldModel').World,Cast=get('chapter-cast','ChapterCast'),Recruit=get('recruitment-content','RecruitmentContent');
  const Art=get('character-assets','CharacterAssets'),H=get('hero-quests','HeroQuests'),Chapter=get('chapter-one','ChapterOne'),Optional=get('optional-battles','OptionalBattles');
  const Scenes=get('battle-scenes','BattleScenes'),P=get('prologue','PengpaiPrologue'),Wars=get('great-battles','GreatBattles');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const KEY='isekai-three-kingdom:simulator:v1',MAX_LEVEL=100,MAX_TEAM=10;
  const level=value=>Number.isFinite(Number(value))?Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(value)))):20;
  const heroes=[...new Set(['hero',...Cast.original,'zhenji','zhangbao','zhangliang',...Object.keys(Cast.definitions)])].map(id=>({id,name:id==='hero'?'主角':({zhaoyun:'赵云',zhenji:'甄姬',zhangliang:'张梁',zhangbao:'张宝',xuchu:'许褚',dianwei:'典韦',huangzhong:'黄忠',maliang:'马良',taishici:'太史慈',lusu:'鲁肃',ganning:'甘宁'}[id]||Cast.definitions[id]?.name),country:Cast.definitions[id]?.country||H.definitions[id]?.country||(['zhangbao','zhangliang'].includes(id)?'yellow':id==='zhaoyun'?'shu':id==='zhenji'?'wei':'other')})).filter(h=>h.name&&(h.id==='hero'||Art.manifest.characters[h.id]));
  const heroMap=Object.fromEntries(heroes.map(h=>[h.id,h]));
  const bosses=[...Wars.definitions.map(b=>({...b,id:'war:'+b.id,group:'war',roster:()=>Wars.roster(b)})),...Object.entries(Chapter.phases).map(([id,d])=>({id:'chapter:'+id,title:id==='dongzhuo'?'董卓':d.title,group:'luoyang',limit:R.PARTY_LIMIT,sceneId:d.sceneId,roster:()=>Chapter.enemies(id)})),...Object.values(Optional.definitions).map(d=>({id:'optional:'+d.id,title:d.title,group:'boss',limit:R.PARTY_LIMIT,sceneId:d.sceneId,roster:()=>Optional.roster(d.id)})),...Object.values(H.definitions).flatMap(d=>Object.entries(d.battles||{}).filter(([,f])=>f.boss||f.duel||f.named||f.roster).map(([id,f])=>({id:'recruit:'+d.id+':'+id,title:f.solo?d.name+' · 单挑':d.id==='lvbu'?'吕布 · 试武':f.title,group:f.solo?'duel':'boss',limit:f.solo?1:4,sceneId:f.sceneId,roster:()=>Recruit.enemies(d.id,id)}))),{id:'camp:zhangliang',title:'张梁 · 操练',group:'boss',limit:R.PARTY_LIMIT,sceneId:'farmland',roster:()=>[{...P.general('zhangliang',10),id:'sim-enemy-zhangliang'}]},{id:'camp:brothers',title:'黄巾三兄弟',group:'boss',limit:R.PARTY_LIMIT,sceneId:'farmland',roster:()=>['zhangjiao','zhangbao','zhangliang'].map((id,i)=>({...P.general(id,10),id:'sim-enemy-'+id,formationRow:i===2?'front':'back'}))}];
  const bossMap=Object.fromEntries(bosses.map(b=>[b.id,b]));
  const knownHero=id=>typeof id==='string'&&Object.hasOwn(heroMap,id),knownBoss=id=>typeof id==='string'&&Object.hasOwn(bossMap,id);
  function heroCharacter(l){return {name:'主角',appearance:'scholar',difficulty:'normal',...G.characterAt(G.create('hero',l)),passives:[],weaponCatalogVersion:1,weaponProficiencies:{sword:65}};}
  function createHero(id,l=20){
    if(!knownHero(id))throw new TypeError('未知武将');
    let u;
    if(id==='hero'){const m=new World(heroCharacter(l),{introStep:2,weaponType:'sword'});u=m.members()[0];}
    else if(id==='zhaoyun'||id==='zhenji'){const m=new World(heroCharacter(l),{introStep:2});u=id==='zhaoyun'?m.zhaoYunUnit():m.zhenJiUnit();}
    else if(id==='zhangliang')u=P.general(id,l);
    else u=Cast.definitions[id]?Cast.unit(id,l):Recruit.companion(id,l);
    const attributes=G.attributesAt(u.baseAttributes,u.potentials,l);
    u={...u,id,name:heroMap[id].name,level:l,attributes,...attributes,weapon:I.weaponRecord(u.weapon,u.attack),equipment:clone(u.equipment||{})};
    delete u.guest;delete u.questGuest;delete u.dead;delete u.wounded;delete u.condition;delete u.startSoldiers;
    return u;
  }
  function equipmentCatalog(){
    const result=[];
    for(const id of Object.keys(I.templates))for(const quality of (I.templates[id].unique?[I.templates[id].quality]:Object.keys(I.qualities)))result.push(I.create(id,quality,'sim:'+id+':'+quality));
    const seen=new Set();for(const hero of heroes){const weapon=createHero(hero.id).weapon;if(!weapon||!W.special(weapon)||seen.has(weapon.id))continue;seen.add(weapon.id);result.push({...clone(weapon),slot:'weapon',quality:weapon.quality||'green',uid:'sim:special:'+weapon.id});}
    return result;
  }
  let catalog;
  class Session{
    constructor(storage){
      this.storage=storage;let saved;try{saved=JSON.parse(storage?.getItem(KEY)||'null');}catch{}saved=saved?.version===1?saved:{};
      this.level=level(saved.level);this.bossId=knownBoss(saved.bossId)?saved.bossId:'chapter:dongzhuo';this.difficulty=saved.difficulty==='hell'?'hell':'normal';this.records={};this.attempt=0;this.revision=0;
      this.selected=Array.isArray(saved.selected)?[...new Set(saved.selected.filter(knownHero))].slice(0,bossMap[this.bossId].group==='war'?bossMap[this.bossId].limit:R.PARTY_LIMIT):['zhaoyun','zhenji','zhangbao','zhangliang'];this.regularSelected=Array.isArray(saved.regularSelected)?saved.regularSelected.filter(knownHero).slice(0,R.PARTY_LIMIT):['zhaoyun','zhenji','zhangbao','zhangliang'];this.warTeams=Object.fromEntries(Object.entries(saved.warTeams||{}).filter(([id,team])=>bossMap[id]?.group==='war'&&Array.isArray(team)).map(([id,team])=>[id,[...new Set(team.filter(knownHero))].slice(0,bossMap[id].limit)]));
      for(const [id,record]of Object.entries(saved.records||{}))if(knownHero(id))try{const u=createHero(id,level(record.level));if(record.weapon===null)u.weapon=null;else if(record.weapon&&typeof record.weapon==='object'&&I.canEquip(u,record.weapon)){W.forWeapon(record.weapon);u.weapon=I.weaponRecord(record.weapon,u.attack);}if(record.equipment&&typeof record.equipment==='object')u.equipment=clone(record.equipment);if(record.weaponProficiencies)u.weaponProficiencies=clone(record.weaponProficiencies);u.skills=W.forWeapon(u.weapon);this.records[id]={unit:u,tactics:record.tactics?clone(record.tactics):null};}catch{}
      this.world=new World(heroCharacter(this.level),{introStep:2,nodeId:'camp',inside:true,outfitted:true});
      const world=this.world,members=world.members.bind(world),changeEquipment=world.changeEquipment.bind(world);
      world.members=()=>members().filter(u=>world.state.activeIds.includes(u.id));world.activeLimit=()=>this.boss().limit;world.rosterLimit=()=>MAX_TEAM;
      world.changeEquipment=(id,slot,uid)=>{const changed=changeEquipment(id,slot,uid);if(changed){const item=world.equipped(id,slot);if(item)item.uid='sim:equipped:'+id+':'+slot;world.state.inventory=clone(this.catalog());world.rest();this.capture();this.revision++;this.save();}return changed;};
      this.rebuild();
    }
    catalog(){return catalog||=(equipmentCatalog());}
    boss(){return bossMap[this.bossId];}
    activeIds(){return this.selected.slice(0,this.boss().limit);}
    record(id){return this.records[id]||=( {unit:createHero(id,this.level),tactics:null} );}
    capture(){
      const m=this.world;if(!m)return;
      for(const raw of m.state.companions){const record=this.record(raw.id);record.unit=clone(raw);record.tactics=clone(m.state.tactics[raw.id]||null);}
      if(m.state.activeIds.includes('hero')){const record=this.record('hero');record.unit={...record.unit,...clone(m.character),weapon:clone(m.state.weapon),equipment:clone(m.state.heroEquipment)};record.tactics=clone(m.state.tactics.hero||null);}
    }
    rebuild(){
      const m=this.world,ids=this.activeIds();m.pending=null;m.journey=null;m.state.companions=ids.filter(id=>id!=='hero').map(id=>clone(this.record(id).unit));m.state.activeIds=[...ids];m.state.reserveOrder=[];m.state.tactics={};m.state.conditions={};m.state.troops={};
      const h=this.record('hero').unit;m.character={...clone(h),appearance:'scholar',difficulty:this.difficulty};m.state.weapon=clone(h.weapon);m.state.weaponType=h.weapon?.type||null;m.state.heroEquipment=clone(h.equipment||{});
      for(const id of ids){const t=this.record(id).tactics;if(t)m.state.tactics[id]=clone(t);}
      m.state.inventory=clone(this.catalog());m.rest();this.revision++;
    }
    chooseBoss(id){if(!knownBoss(id))return false;this.capture();const previous=this.boss();if(previous.group==='war')this.warTeams[previous.id]=[...this.selected];else this.regularSelected=[...this.selected];this.bossId=id;const next=this.boss();if(next.group==='war')this.selected=[...(this.warTeams[id]||next.preset)];else if(previous.group==='war')this.selected=[...this.regularSelected];this.rebuild();this.save();return true;}
    toggle(id){if(!knownHero(id))return false;this.capture();const at=this.selected.indexOf(id);if(this.boss().limit===1){if(at>=0)[this.selected[0],this.selected[at]]=[this.selected[at],this.selected[0]];else this.selected=[id,...this.selected.slice(1)];}else if(at>=0)this.selected.splice(at,1);else if(this.selected.length<this.boss().limit)this.selected.push(id);else return false;this.rebuild();this.save();return true;}
    replace(index,id){if(!knownHero(id)||!Number.isInteger(index)||index<0||index>=this.boss().limit)return false;this.capture();const previous=this.selected.indexOf(id);if(previous>=0)[this.selected[index],this.selected[previous]]=[this.selected[previous],this.selected[index]];else this.selected[index]=id;this.selected=this.selected.filter(Boolean);this.rebuild();this.save();return true;}
    setLevel(value,id){if(id&&!knownHero(id))return false;this.capture();const next=level(value);if(!id)this.level=next;for(const key of id?[id]:Object.keys(this.records)){const u=this.record(key).unit,attributes=G.attributesAt(u.baseAttributes,u.potentials,next);Object.assign(u,{level:next,attributes},attributes);}this.rebuild();this.save();}
    setDifficulty(value){this.capture();this.difficulty=value==='hell'?'hell':'normal';this.rebuild();this.save();}
    snapshot(){this.capture();return {version:1,level:this.level,bossId:this.bossId,difficulty:this.difficulty,selected:[...this.selected],regularSelected:[...this.regularSelected],warTeams:{...this.warTeams,...(this.boss().group==='war'?{[this.bossId]:[...this.selected]}:{})},records:Object.fromEntries(Object.entries(this.records).map(([id,{unit:u,tactics}])=>[id,{level:u.level,weapon:clone(u.weapon),equipment:clone(u.equipment||{}),weaponProficiencies:clone(u.weaponProficiencies||{}),tactics:clone(tactics)}]))};}
    save(){try{this.storage?.setItem(KEY,JSON.stringify(this.snapshot()));this.saveError=false;}catch{this.saveError=true;}}
    scenario(seed){
      this.capture();const b=this.boss(),enemies=b.roster().map(u=>({...u,...(root.CharacterAssets?root.CharacterAssets.resolve(u.characterId||u.id):{})})),allies=this.world.members().map(u=>{const fresh={...clone(u),startSoldiers:u.maxSoldiers};delete fresh.dead;delete fresh.wounded;delete fresh.condition;return fresh;});
      return {id:'simulation:'+b.id,title:b.title,scene:Scenes.arrange(Scenes.get(b.sceneId),enemies),allies,enemies,passives:root.WorldModel?.heroPassives?.(),rules:{bossBattle:true,partySlots:b.limit,difficulty:this.difficulty,hit:true,critical:true,seed:seed||'simulation:'+Date.now()+':'+this.attempt++}};
    }
  }
  const api={Session,heroes,heroMap,bosses,bossMap,createHero,equipmentCatalog,KEY,MAX_LEVEL,MAX_TEAM};root.BattleSimulator=api;if(node)module.exports=api;
})(globalThis);
