// Only the host chooses a fixture; the battle system accepts any scenario data.
(function () {
  const name = new URLSearchParams(location.search).get('scenario');
  let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw new Error('浏览器存储不可用');}};}
  const store=new PengpaiRules.SaveStore(storage);
  if(!name){
    const canvas=document.getElementById('battleCanvas'),input=document.getElementById('heroName');let screen;
    const menu=()=>{screen?.destroy();screen=PengpaiMenu.mount(canvas,{store,nameInput:input,onCharacterCreated:(character,slot)=>story(character,slot),onLoad:(save,slot)=>story(save.character,slot,save.progress)});window.pengpaiGame=screen;};
    const story=(character,slot,progress)=>{screen?.destroy();input.hidden=true;screen=PengpaiStory.mount(canvas,{store,character,slot,progress,onExit:menu});window.pengpaiGame=screen;};
    menu();return;
  }
  const previewHero={name:'无名氏',appearance:'wanderer',difficulty:'normal',...PengpaiRules.rollHero('normal')};
  const scenario = name==='tutorial'?PengpaiPrologue.createBattle('manual-fight',previewHero):name==='preparation'?PengpaiPrologue.createBattle('prepare',previewHero):name === 'stress' ? BattleScenarios.createStress() : name === 'encounter' ? BattleScenarios.createEncounter()
    : name === 'effects' ? BattleScenarios.createEffectsPreview() : name==='formation'?BattleScenarios.createFormationPreview():BattleScenarios.createChibi();
  const settings=store.settings();
  window.battleDemo = BattleSystem.mount(document.getElementById('battleCanvas'), scenario,{autoStart:name!=='preparation',profile:new URLSearchParams(location.search).has('profile'),screenShake:settings.screenShake,effects:settings.effects});
})();
