(function(root){
  'use strict';
  const font='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  // 全部页面共用四档正文字号；大标题仅用于主菜单游戏名。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:value>=13?14:12;
  const api={font,textSize};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
