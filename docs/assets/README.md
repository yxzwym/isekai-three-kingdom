# 演示素材记录

使用内置 imagegen 工具生成，作为本地战斗演示素材。

- 战场背景：`assets/chibi-night.jpg`，由生成的 PNG 转为 JPEG。
- 武将图集：`assets/legacy/generals-v1.png`，6 列 × 2 行。前排为周瑜、黄盖、甘宁、鲁肃、诸葛亮、孙权；后排为曹操、张辽、徐晃、于禁、曹仁、吕布。浏览器按原始比例裁切，不拉伸。
- 这些是演示立绘，不代表历史人物真实长相。

## 背景提示词

Use case: historical-scene. Asset type: portrait mobile RPG battle environment background, aspect ratio 2:3. A cinematic dark painted game environment of the Battle of Red Cliffs on the Yangtze at night, late Han dynasty China. View from low on the empty wooden deck of a war junk, looking over dark teal river water toward distant clustered Chinese warships with square sails and a few small orange fires, hazy red cliffs on both sides, blue moonlit mist, restrained embers. Ship decks in the bottom 25%, river and distant fleet in the middle, atmospheric dark teal negative space in the top 30% for game HUD. High quality hand painted realistic strategy RPG concept art, sombre desaturated navy, teal, charcoal and subtle ember orange. Full bleed, excellent depth, detailed environment, lighting readable behind white interface. No characters, no close foreground people, no letters, no words, no logos, no frames, no UI, no health bars, no symbols. This is a reusable background layer, not a screenshot.

## 图集提示词

Use case: stylized-concept. Asset type: transparent character portrait sprite atlas for a Chinese Three Kingdoms RPG. Exactly 12 separate half-body bust portraits, arranged in a perfectly regular SIX COLUMNS by TWO ROWS grid, all cells equal, each character centered in its own cell with equal scale, head at same height, shoulders extend nearly to cell edges, chest cropped on the bottom edge of each cell, no overlap between cells. Wide sheet aspect ratio 3:2. Transparent background throughout all space. Late Han Chinese male characters, detailed painterly realistic historical strategy game art, cool cinematic lighting and restrained colors. Readable varied faces and large heads. TOP ROW left to right: 1 Zhou Yu young handsome clean-shaven commander with bronze helmet and red dark armor; 2 Huang Gai old grey-bearded broad battle veteran wearing iron helmet; 3 Gan Ning fierce young pirate general black hair gold headband dark armor; 4 Lu Su middle-aged kind-faced slim moustache scholar in muted green robe and black official cap; 5 Zhuge Liang elegant middle-aged thin beard scholar with tall traditional black silk cap and grey-blue robe; 6 Sun Quan short reddish beard young sovereign in dark maroon armor with black headdress. BOTTOM ROW left to right: 1 Cao Cao middle-aged stern calculating ruler narrow eyes strong moustache short pointed beard black and gold crown dark crimson robe; 2 Zhang Liao stern middle-aged moustached armored general with steel helmet; 3 Xu Huang broad-faced scarred robust general iron helmet with dark axe shaft behind shoulder; 4 Yu Jin thin stern older general angular beard dark blue helmet; 5 Cao Ren stocky bearded heavily armored general with bronze helmet; 6 Lu Bu imposing handsome warrior young with elaborate gold helmet two tall pheasant plumes dark armor burgundy sash. All exactly twelve busts entirely separated in a 6 by 2 grid. No text, no names, no UI, no borders, no weapons crossing cells, no background scenery, no pedestal. Genuine transparent alpha background.

图集随后通过内置 imagegen 请求去除背景并保持人物、尺寸和排列。最终文件仍保留部分背景渐变，页面使用边缘渐隐处理。


角色素材管理已迁入`assets/characters/manifest.json`。周瑜全身图已用内置imagegen单独生成，保存在`assets/characters/zhouyu/classic/fullbody.png`（1024×1536 RGBA）。配套独立头像请求返回HTTP429，当前保留旧头像；其他人物后续按需生成。完整提示词及状态见各自`classic/generation.json`，约定见项目根目录`角色素材管理.md`。
