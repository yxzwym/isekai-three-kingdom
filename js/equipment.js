(function(root){
  'use strict';
  const item=value=>typeof value==='string'?(value.trim()?{name:value}:null):value&&typeof value==='object'&&!Array.isArray(value)?JSON.parse(JSON.stringify(value)):null;
  const slots=[{id:'weapon',label:'武器'},{id:'armor',label:'防具'},{id:'accessory1',label:'饰品'},{id:'accessory2',label:'饰品'}];
  function normalize(value={}){value=value&&typeof value==='object'?value:{};return {armor:item(value.armor),accessory1:item(value.accessory1??value.accessories?.[0]),accessory2:item(value.accessory2??value.accessories?.[1])};}
  const api={slots,normalize};root.EquipmentSlots=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
