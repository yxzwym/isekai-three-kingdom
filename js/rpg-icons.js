(function(root){
 'use strict';
 const items='./assets/ui/rpg-items-v1.webp',effects='./assets/ui/rpg-effects-v1.webp',money='./assets/ui/copper-coins-v1.webp';
 const itemIds=['sword','blade','spear','shield','fan','staff','whisk','banner','gourd','scripture','needle','dagger','shortBlade','bow','cannon','crossbow','axe','hammer','cloth-armor','leather-armor','iron-armor','wood-beads','copper-ring','woven-charm','人物','队伍','任务','背包','设置','定位','筛选','排序'];
 const effectIds=['fire','thunder','water','heal','armorUp','armorDown','taunt','reflectDamage','bleed','poison','stun','speedUp','resistanceUp','resistanceDown','earth','wood'];
 const trophies='./assets/ui/trophies-v1.webp';
 const specialItems={'fangtian-halberd':'./assets/ui/fangtian-halberd-v1.webp'};
 function resolveItem(item,empty='sword'){
  if(!item)return aliases[empty]||empty;
  const candidates=[item.icon?.src,item.icon,item.iconId,item.id,item.templateId,item.proficiencyType,item.type,item.slot,empty];
  for(let id of candidates){if(typeof id!=='string')continue;id=id==='halberd'?'fangtian-halberd':aliases[id]||id;if(id.startsWith('trophy-')||specialItems[id]||itemIds.includes(id)||id.startsWith('./assets/'))return id;}
  return item.slot==='armor'?'iron-armor':item.slot?.startsWith('accessory')?'copper-ring':'sword';
 }
 const aliases={armor:'iron-armor',accessory:'copper-ring',菜单:'设置',施法设置:'设置',详情:'任务',金币:'copper-ring',plague:'poison',paralysis:'thunder',regeneration:'heal',speedDown:'speedUp',warDown:'armorDown',intelligenceDown:'resistanceDown',intelligenceUp:'resistanceUp',buff:'resistanceUp',debuff:'resistanceDown'};
 function draw(c,id,x,y,size,{image,disabled=false}={}){
  if(/^trophy-[0-8]$/.test(id)){const img=root.GameAssetLoader?.get(trophies)||image?.(trophies);if(!img)return false;const n=Number(id.slice(7)),iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,sw=iw/3,rows=[0,.323,.606,1],row=Math.floor(n/3),sy=rows[row]*ih,sh=(rows[row+1]-rows[row])*ih,scale=Math.min(size/sw,size/sh),dw=sw*scale,dh=sh*scale;c.drawImage(img,n%3*sw,sy,sw,sh,x+(size-dw)/2,y+(size-dh)/2,dw,dh);return true;}if(id==='trophy-empty')return false;
  const custom=specialItems[id]||(typeof id==='string'&&id.startsWith('./assets/')?id:null);
  if(custom){const img=root.GameAssetLoader?.get(custom)||image?.(custom);if(img){c.save();if(disabled)c.globalAlpha*=.24;c.drawImage(img,x,y,size,size);c.restore();return true;}id='spear';}
  if(['金币','金钱','money'].includes(id)){const img=root.GameAssetLoader?.get(money)||image?.(money);if(!img)return false;c.save();if(disabled)c.globalAlpha*=.24;c.drawImage(img,x,y,size,size);c.restore();return true;}
  id=aliases[id]||id;let index=itemIds.indexOf(id),cols=8,rows=4,src=items;
  if(index<0){index=effectIds.indexOf(id);cols=rows=4;src=effects;}if(index<0)return false;
  const img=root.GameAssetLoader?.get(src)||image?.(src);if(!img)return false;
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,sw=iw/cols,sh=ih/rows;
  c.save();if(disabled)c.globalAlpha*=.24;c.drawImage(img,(index%cols)*sw,Math.floor(index/cols)*sh,sw,sh,x,y,size,size);c.restore();return true;
 }
 const api={items,effects,money,itemIds,effectIds,specialItems,resolveItem,draw};root.RpgIcons=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
