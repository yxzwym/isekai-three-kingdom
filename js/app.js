// Only the host chooses a fixture; the battle system accepts any scenario data.
(function () {
  const name = new URLSearchParams(location.search).get('scenario');
  let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw new Error('浏览器存储不可用');}};}
  const store=new PengpaiRules.SaveStore(storage);
  if(!name){window.pengpaiGame=PengpaiMenu.mount(document.getElementById('battleCanvas'),{store,nameInput:document.getElementById('heroName')});return;}
  const scenario = name === 'stress' ? BattleScenarios.createStress() : name === 'encounter' ? BattleScenarios.createEncounter()
    : name === 'effects' ? BattleScenarios.createEffectsPreview() : name==='formation'?BattleScenarios.createFormationPreview():BattleScenarios.createChibi();
  const settings=store.settings();
  window.battleDemo = BattleSystem.mount(document.getElementById('battleCanvas'), scenario,{profile:new URLSearchParams(location.search).has('profile'),screenShake:settings.screenShake,effects:settings.effects});
})();
