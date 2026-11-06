// Only the host chooses a fixture; the battle system accepts any scenario data.
(function () {
  GameAssetLoader.mount(document.getElementById('battleCanvas'),GameAssetManifest,start);
  function start(){
  const name = new URLSearchParams(location.search).get('scenario');
  let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw new Error('浏览器存储不可用');}};}
  const store=new PengpaiRules.SaveStore(storage);
  if(!name){
    const canvas=document.getElementById('battleCanvas'),input=document.getElementById('heroName');let screen;
    const menu=()=>{screen?.destroy();screen=PengpaiMenu.mount(canvas,{store,nameInput:input,onCharacterCreated:(character,slot)=>story(character,slot),onLoad:(save,slot)=>story(save.character,slot,save.progress)});window.pengpaiGame=screen;};
    const world=(character,slot,progress)=>{screen?.destroy();input.hidden=true;const model=new WorldModel.World(character,progress?.world);if(!model.members()[0].weapon&&!model.state.outfitted){story(model.character,slot,{...progress,stage:'departure',world:model.snapshot()});return;}screen=WorldMap.mount(canvas,{store,character:model.character,slot,progress,model,onExit:menu});window.pengpaiGame=screen;};
    const story=(character,slot,progress)=>{if(progress?.stage==='world'){world(character,slot,progress);return;}screen?.destroy();input.hidden=true;screen=PengpaiStory.mount(canvas,{store,character,slot,progress,onExit:menu,onWorld:next=>world(character,slot,next)});window.pengpaiGame=screen;};
    menu();return;
  }
  const previewHero={name:'无名氏',appearance:'wanderer',difficulty:'normal',...PengpaiRules.rollHero('normal')};
  if(['camp','dream','dawn','departure','world','world-battle','world-travel'].includes(name)){
    const memory={value:null,getItem(){return this.value;},setItem(key,value){this.value=value;}},previewStore=new PengpaiRules.SaveStore(memory),canvas=document.getElementById('battleCanvas'),exit=()=>location.assign(location.pathname);
    const showWorld=progress=>{window.pengpaiGame?.destroy();window.pengpaiGame=WorldMap.mount(canvas,{store:previewStore,character:previewHero,slot:0,progress,onExit:exit});};
    if(name==='world'||name==='world-battle'||name==='world-travel'){const model=new WorldModel.World(previewHero);model.chooseWeapon('sword');if(name==='world-battle'){model.move('julu',{eventRoll:0});window.pengpaiGame=WorldMap.mount(canvas,{store:previewStore,character:previewHero,slot:0,model,onExit:exit});}else {showWorld({stage:'world',world:model.snapshot()});if(name==='world-travel'){window.pengpaiGame.finishIntroduction();window.pengpaiGame.travel('julu',{eventRoll:0});}}}
    else window.pengpaiGame=PengpaiStory.mount(canvas,{store:previewStore,character:previewHero,slot:0,progress:{storyVersion:2,stage:name},onWorld:showWorld,onExit:exit});return;
  }
  const scenario = name==='tutorial'?PengpaiPrologue.createBattle('manual-fight',previewHero):name==='preparation'?PengpaiPrologue.createBattle('prepare',previewHero):name === 'stress' ? BattleScenarios.createStress() : name === 'encounter' ? BattleScenarios.createEncounter()
    : name === 'effects' ? BattleScenarios.createEffectsPreview() : name==='formation'?BattleScenarios.createFormationPreview():BattleScenarios.createChibi();
  const settings=store.settings();
  window.battleDemo = BattleSystem.mount(document.getElementById('battleCanvas'), scenario,{autoStart:name!=='preparation',profile:new URLSearchParams(location.search).has('profile'),screenShake:settings.screenShake,effects:settings.effects});
  }
})();
