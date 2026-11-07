(function(root){
  'use strict';
  const font='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  // 正文最低14px，按钮16px，页面标题20px；主菜单游戏名单独放大。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:14;
  function wrapLines(ctx,value,width){const lines=[];let row='';for(const ch of String(value)){if(row&&ctx.measureText(row+ch).width>width){if(/[，。！？、；：）》」』】,.!?;:]/u.test(ch)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else if(/[（《「『【(]$/u.test(row)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else{lines.push(row);row=ch;}}else row+=ch;}if(row)lines.push(row);return lines;}
  function singleChoiceHit(hits,width,height,choices){if(choices.length===1)hits.unshift({x:0,y:0,w:width,h:height,action:choices[0].action});}
  const EXCLUSIVE_COLOR='#b69cff';
  function passiveColor(passive,qualities=root.PengpaiRules?.QUALITIES){return passive.exclusive?EXCLUSIVE_COLOR:qualities?.[passive.quality]?.color||'#c4d5d3';}
  function passiveButtons(view,passives,x,y,width,onSelect){
    const cellW=width/4;
    passives.forEach((passive,i)=>{const row=Math.floor(i/4),count=Math.min(4,passives.length-row*4),cw=cellW-6,xx=x+(width-count*cellW)/2+i%4*cellW+3,yy=y+row*24+2,tint=passiveColor(passive);
      view.box(xx,yy,cw,20,'#112932',tint,3);view.text(passive.name,xx+cw/2,yy+10,14,tint,'center');
      view.hits.push({x:xx,y:yy,w:cw,h:20,label:passive.name,action:()=>onSelect(passive)});
    });
    return Math.ceil(passives.length/4)*24;
  }
  const api={font,textSize,wrapLines,singleChoiceHit,EXCLUSIVE_COLOR,passiveColor,passiveButtons};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
