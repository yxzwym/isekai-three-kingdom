(function(root){
 'use strict';
 const atlases=['./assets/ui/skill-actions-a-v1.webp','./assets/ui/skill-actions-b-v1.webp'];
 // Dedicated action illustrations; equipment and status atlases are not used here.
 const ids=[
  'spear-break','spear-stun','spear-burst','sword-break','sword-eagle','sword-critical','shield-hit','shield-taunt',
  'shield-reflect','greatShield-1','greatShield-2','greatShield-3','fan-fire','fan-frost','fan-rain','staff-fire',
  'staff-flame','staff-focus','whisk-1','whisk-2','whisk-3','banner-1','banner-2','banner-3',
  'gourd-poison','gourd-curse','gourd-regeneration','scripture-1','scripture-2','scripture-3','needle-stun','needle-heal',
  'needle-sacrifice','hook-1','hook-2','hook-3','dagger-bleed','dagger-fast','dagger-poison','crossbow-shot',
  'crossbow-volley','crossbow-snipe','repeatingCrossbow-1','repeatingCrossbow-2','repeatingCrossbow-3','bow-fire','bow-poison','bow-recover',
  'blade-cut','blade-burst','blade-sweep','hammer-1','hammer-2','hammer-3','staff-shock','staff-storm',
  'punch','$physical-single','$physical-all','$heal-single','$heal-all','$buff','$debuff','$tactic'
 ];
 const aliases={'spear-cut':'shield-hit','spear-sweep':'spear-break','sword-cut':'$physical-single','sword-sweep':'sword-break',strike:'$physical-single',huoshen:'staff-flame',dare:'staff-fire',hongshui:'whisk-2',luoshi:'scripture-3',yinxian:'$heal-single',tongxian:'$heal-all','thunder-retaliation':'staff-shock','thunder-renewal':'$heal-single'};
 function resolve(skill={}){
  if(skill.icon&&typeof skill.icon==='object'&&skill.icon.src)return skill.icon;
  const base=String(skill.iconId||skill.template||skill.id||'').replace(/-day$/,''),known=aliases[base]||base;let id=known;
  if(!ids.includes(id)){
   if(skill.kind==='heal')id=skill.scope==='all'?'$heal-all':'$heal-single';
   else if(skill.kind==='buff')id=skill.buff?.taunt?'shield-taunt':skill.buff?.reflect||skill.buff?.reflectFormula?'shield-reflect':skill.side==='enemy'?'$debuff':'$buff';
   else if(skill.kind==='physical')id=skill.scope==='all'?'$physical-all':'$physical-single';
   else{const all=skill.scope==='all';id={fire:all?'staff-flame':'staff-fire',thunder:all?'fan-frost':'fan-fire',water:all?'whisk-2':'whisk-1',wood:'gourd-poison',earth:all?'banner-2':'scripture-3'}[skill.element]||'$tactic';}
  }
  const index=ids.indexOf(id),tile=index%32;return {id,src:atlases[Math.floor(index/32)],columns:8,rows:4,column:tile%8,row:Math.floor(tile/8)};
 }
 function draw(c,skill,x,y,size,{image}={}){
  const art=resolve(skill),img=root.GameAssetLoader?.get(art.src)||image?.(art.src);if(!img)return false;
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,crop=art.crop||{x:(art.column||0)*w/(art.columns||1),y:(art.row||0)*h/(art.rows||1),width:w/(art.columns||1),height:h/(art.rows||1)};
  c.drawImage(img,crop.x,crop.y,crop.width,crop.height,x,y,size,size);return true;
 }
 const api={atlases,ids,resolve,draw};root.SkillIcons=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
