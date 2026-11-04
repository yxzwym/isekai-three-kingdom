(function(root){
  'use strict';
  const manifest=typeof module!=='undefined'&&module.exports?require('../assets/characters/manifest.json'):root.CharacterAssetManifest;
  const bustCrop=(width,height)=>({x:width*150/1024,y:0,width:width*724/1024,height:height*830/1536});
  function resolve(characterId,variant){
    const character=manifest.characters[characterId];if(!character)throw new Error(`角色素材未登记：${characterId}`);
    const key=variant||character.defaultVariant,art=character.variants[key];if(!art)throw new Error(`角色形象未登记：${characterId}/${key}`);
    const ready=asset=>asset?.src&&asset.status!=='pending-generation'?JSON.parse(JSON.stringify(asset)):null;
    return {characterId,variant:key,portrait:ready(art.portrait),fullbody:ready(art.fullbody),pending:Object.keys(art).filter(k=>art[k]?.status==='pending-generation')};
  }
  const api={manifest,resolve,bustCrop};root.CharacterAssets=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
