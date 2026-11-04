(function(root){
  'use strict';
  const font='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  // 正文最低14px，按钮16px，页面标题20px；主菜单游戏名单独放大。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:14;
  const api={font,textSize};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
