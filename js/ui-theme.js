(function(root){
  'use strict';
  const font='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  // 正文最低14px，按钮16px，页面标题20px；主菜单游戏名单独放大。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:14;
  function wrapLines(ctx,value,width){const lines=[];let row='';for(const ch of String(value)){if(row&&ctx.measureText(row+ch).width>width){if(/[，。！？、；：）》」』】,.!?;:]/u.test(ch)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else if(/[（《「『【(]$/u.test(row)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else{lines.push(row);row=ch;}}else row+=ch;}if(row)lines.push(row);return lines;}
  function singleChoiceHit(hits,width,height,choices){if(choices.length===1)hits.unshift({x:0,y:0,w:width,h:height,action:choices[0].action});}
  const api={font,textSize,wrapLines,singleChoiceHit};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
