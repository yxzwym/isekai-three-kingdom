// Only the host chooses a fixture; the battle system accepts any scenario data.
(function () {
  const name = new URLSearchParams(location.search).get('scenario');
  const scenario = name === 'stress' ? BattleScenarios.createStress() : name === 'encounter' ? BattleScenarios.createEncounter()
    : name === 'effects' ? BattleScenarios.createEffectsPreview() : BattleScenarios.createChibi();
  window.battleDemo = BattleSystem.mount(document.getElementById('battleCanvas'), scenario,{profile:new URLSearchParams(location.search).has('profile')});
})();
