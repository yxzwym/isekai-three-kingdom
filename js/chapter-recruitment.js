(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 if(node){require('./chapter-traits.js');require('./chapter-quests-wei.js');require('./chapter-quests-shu.js');require('./chapter-quests-wu.js');require('./chapter-quests-other.js');require('./recruitment-stories.js');require('./recruitment-challenges.js');}
 const api={version:1};root.ChapterRecruitment=api;if(node)module.exports=api;
})(globalThis);
