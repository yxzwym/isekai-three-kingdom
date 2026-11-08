(function(root){
  'use strict';
  const S=typeof module!=='undefined'&&module.exports?require('./settings.js'):root.GameSettings;
  const HEIGHT=374;
  function draw(view,f,settings,onChange){
    const x=f.x+20,right=f.x+f.w-20,width=f.w-40;
    function button(label,bx,by,bw,active,action){view.box(bx,by,bw,32,active?'#674d2d':'#102a34',active?'#dfc18b':'#577781',3);view.text(label,bx+bw/2,by+16,14,active?'#ffe8ba':'#e3e9e5','center');view.hits.push({x:bx,y:by,w:bw,h:32,label,action});}
    S.TOGGLES.forEach(([key,label],i)=>{const y=f.y+56+i*46;view.text(label,x,y+16,16,'#e4e7de','left');button(settings[key]?'开启':'关闭',right-79,y,79,settings[key],()=>{onChange({[key]:!settings[key]});root.GameAudio?.play('ui');});view.hits.at(-1).label=label+' '+(settings[key]?'开启':'关闭');});
    const y=f.y+56+S.TOGGLES.length*46;view.text('菜单字号',x,y+10,14,'#e4e7de','left');const bw=(width-12)/3;S.SCALES.forEach(([label,value],i)=>button(label,x+i*(bw+6),y+30,bw,settings.menuScale===value,()=>{onChange({menuScale:value});root.GameAudio?.play('ui');}));return y+66;
  }
  const api={HEIGHT,draw};root.GameSettingsPanel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
