(function(root){
  'use strict';
  const S=typeof module!=='undefined'&&module.exports?require('./settings.js'):root.GameSettings;
  const HEIGHT=374;
  function draw(view,f,settings,onChange){
    const x=f.x+20,right=f.x+f.w-20,width=f.w-40;
    function button(label,bx,by,bw,active,action){root.PengpaiUI.button(view,label,bx,by,bw,32,action,{active});}
    S.TOGGLES.forEach(([key,label],i)=>{const y=f.y+56+i*46,on=settings[key];view.text(label,x,y+16,16,'#d3d7c6','left');view.box(right-62,y+5,62,22,on?'#573b2d':'#202824',on?'#9d8057':'#626a59',3);view.box(on?right-21:right-57,y+8,16,16,on?'#d9c79b':'#7a8775',null,2);view.hits.push({x:right-79,y,w:79,h:32,label:label+' '+(on?'开启':'关闭'),action:()=>{onChange({[key]:!on});root.GameAudio?.play('ui');}});});
    const y=f.y+56+S.TOGGLES.length*46;view.text('菜单字号',x,y+10,14,'#e4e7de','left');const bw=(width-12)/3;S.SCALES.forEach(([label,value],i)=>button(label,x+i*(bw+6),y+30,bw,settings.menuScale===value,()=>{onChange({menuScale:value});root.GameAudio?.play('ui');}));return y+66;
  }
  const api={HEIGHT,draw};root.GameSettingsPanel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
