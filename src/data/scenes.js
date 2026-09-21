// 30 个真实情境用色任务：10 个插画场景 × 3 种情绪/主题
// 每个场景声明若干可上色区域（region），SVG 在 components/SceneArt.jsx 中绘制

export const SCENE_TASKS = [
  // 1. 小动物的家
  {
    id: 'home-warm',
    scene: 'home',
    emoji: '🏠',
    title: '温暖的小兔子家',
    emotion: '温暖',
    prompt: '给小兔子的家配上暖暖的颜色，让它一回家就觉得很温暖',
    criterion: { minWarm: 2, coolAllowed: 1 },
    exampleText: '我给小兔子的家配了暖色，因为它很温暖',
  },
  {
    id: 'home-cool',
    scene: 'home',
    emoji: '🏠',
    title: '清凉的小青蛙家',
    emotion: '清凉',
    prompt: '夏天好热呀，给小青蛙的家配上凉凉的颜色吧',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给小青蛙的家配了冷色，因为夏天很清凉',
  },
  {
    id: 'home-night',
    scene: 'home',
    emoji: '🏠',
    title: '安静睡觉的小家',
    emotion: '安静',
    prompt: '天黑了要睡觉，给小家配上深深的、安安静静的颜色',
    criterion: { minCool: 1, neutralMin: 1, warmAllowed: 1 },
    exampleText: '我给小家配了深色，因为要安静睡觉了',
  },
  // 2. 天空
  {
    id: 'sky-sunny',
    scene: 'sky',
    emoji: '⛅',
    title: '大晴天的天空',
    emotion: '开心',
    prompt: '太阳出来啦！给大晴天配上明亮开心的颜色',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给晴天配了蓝色和黄色，因为太阳出来了',
  },
  {
    id: 'sky-rainy',
    scene: 'sky',
    emoji: '⛅',
    title: '下雨天的天空',
    emotion: '忧伤',
    prompt: '下雨了，天空有点难过，给它配上灰灰冷冷的颜色',
    criterion: { minCool: 1, neutralMin: 1, warmAllowed: 1 },
    exampleText: '我给雨天配了灰色和蓝色，因为天空在流泪',
  },
  {
    id: 'sky-sunset',
    scene: 'sky',
    emoji: '⛅',
    title: '美丽的晚霞',
    emotion: '温柔',
    prompt: '太阳要落山了，给晚霞配上粉粉橙橙、温柔的颜色',
    criterion: { minWarm: 2, coolAllowed: 1 },
    exampleText: '我给晚霞配了粉色和橙色，因为它很温柔',
  },
  // 3. 森林
  {
    id: 'forest-spring',
    scene: 'forest',
    emoji: '🌲',
    title: '春天的森林',
    emotion: '新生',
    prompt: '春天来了，小树发芽了，给森林配上嫩嫩的颜色',
    criterion: { minCool: 1, minWarm: 1 },
    exampleText: '我给春天的森林配了嫩绿和粉色，因为花都开了',
  },
  {
    id: 'forest-autumn',
    scene: 'forest',
    emoji: '🌲',
    title: '秋天的森林',
    emotion: '丰收',
    prompt: '秋天到了，给森林配上红红黄黄的丰收颜色',
    criterion: { minWarm: 2, coolAllowed: 1 },
    exampleText: '我给秋天的森林配了红黄橙，因为叶子变色了',
  },
  {
    id: 'forest-night',
    scene: 'forest',
    emoji: '🌲',
    title: '夜晚的森林',
    emotion: '神秘',
    prompt: '夜晚的森林有点神秘，给它配上深深的蓝紫色',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给夜晚的森林配了深蓝和紫色，因为很神秘',
  },
  // 4. 海底
  {
    id: 'sea-happy',
    scene: 'sea',
    emoji: '🐠',
    title: '热热闹闹的海底',
    emotion: '热闹',
    prompt: '小鱼们在开派对！给海底配上鲜艳热闹的颜色',
    criterion: { minCool: 1, minWarm: 1 },
    exampleText: '我给海底配了蓝色和橙色，因为小鱼在开派对',
  },
  {
    id: 'sea-deep',
    scene: 'sea',
    emoji: '🐠',
    title: '深深的海底',
    emotion: '安静',
    prompt: '游到深深的海底，那里安静又清凉',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给深海配了深蓝色，因为那里很安静',
  },
  {
    id: 'sea-coral',
    scene: 'sea',
    emoji: '🐠',
    title: '珊瑚礁乐园',
    emotion: '快乐',
    prompt: '彩色的珊瑚礁真漂亮，给它配上五颜六色的家',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给珊瑚礁配了很多颜色，因为那里很快乐',
  },
  // 5. 派对
  {
    id: 'party-birthday',
    scene: 'party',
    emoji: '🎉',
    title: '生日派对',
    emotion: '开心',
    prompt: '今天过生日！给派对配上最热闹最开心的颜色',
    criterion: { minWarm: 2 },
    exampleText: '我给生日派对配了暖色，因为大家都很开心',
  },
  {
    id: 'party-fancy',
    scene: 'party',
    emoji: '🎉',
    title: '化妆舞会',
    emotion: '神秘',
    prompt: '神秘的化妆舞会开始啦，配上紫色和深深的颜色',
    criterion: { minCool: 1, neutralAllowed: true },
    exampleText: '我给舞会配了紫色，因为它很神秘',
  },
  {
    id: 'party-garden',
    scene: 'party',
    emoji: '🎉',
    title: '花园下午茶',
    emotion: '温柔',
    prompt: '在花园里喝下午茶，配上柔和的粉色和浅绿色',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给花园茶会配了粉色和绿色，因为很温柔',
  },
  // 6. 心情小怪兽
  {
    id: 'monster-happy',
    scene: 'monster',
    emoji: '👾',
    title: '开心小怪兽',
    emotion: '开心',
    prompt: '给开心的小怪兽配上明亮的颜色吧！',
    criterion: { minWarm: 1 },
    exampleText: '我给开心小怪兽配了黄色，因为我开心的时候想笑',
  },
  {
    id: 'monster-sad',
    scene: 'monster',
    emoji: '👾',
    title: '难过小怪兽',
    emotion: '难过',
    prompt: '小怪兽有点难过，给它配上冷冷的蓝灰色陪陪它',
    criterion: { minCool: 1, neutralAllowed: true },
    exampleText: '我给难过小怪兽配了蓝色，因为它有点想哭',
  },
  {
    id: 'monster-angry',
    scene: 'monster',
    emoji: '👾',
    title: '生气小怪兽',
    emotion: '生气',
    prompt: '小怪兽气鼓鼓的，什么颜色看起来像在生气呢？',
    criterion: { minWarm: 2 },
    exampleText: '我给生气小怪兽配了大红色，因为生气脸会红红的',
  },
  // 7. 城市
  {
    id: 'city-day',
    scene: 'city',
    emoji: '🏙️',
    title: '白天的城市',
    emotion: '精神',
    prompt: '新的一天开始啦，给城市配上精神十足的颜色',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给白天的城市配了蓝天和黄太阳，因为很有精神',
  },
  {
    id: 'city-night',
    scene: 'city',
    emoji: '🏙️',
    title: '夜晚的城市',
    emotion: '安静',
    prompt: '城市要睡觉了，配上深色和一点点温暖的灯光',
    criterion: { minCool: 1, neutralAllowed: true },
    exampleText: '我给夜晚的城市配了深蓝和暖黄灯光，因为要睡了',
  },
  {
    id: 'city-rain',
    scene: 'city',
    emoji: '🏙️',
    title: '雨中的城市',
    emotion: '清凉',
    prompt: '下雨的城市湿湿凉凉，给它配上冷色调',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给雨中城市配了蓝灰色，因为雨水凉凉的',
  },
  // 8. 花园
  {
    id: 'garden-spring',
    scene: 'garden',
    emoji: '🌷',
    title: '春天的花园',
    emotion: '新生',
    prompt: '花儿朵朵开，给春天的花园配上粉嫩的颜色',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给春天花园配了粉色和绿色，因为花开了',
  },
  {
    id: 'garden-summer',
    scene: 'garden',
    emoji: '🌷',
    title: '夏天的花园',
    emotion: '热烈',
    prompt: '夏天的花园热热闹闹，配上鲜艳浓烈的颜色',
    criterion: { minWarm: 1, minCool: 1 },
    exampleText: '我给夏天花园配了大红大绿，因为开得很热烈',
  },
  {
    id: 'garden-dream',
    scene: 'garden',
    emoji: '🌷',
    title: '梦里的花园',
    emotion: '梦幻',
    prompt: '梦里什么都有！给花园配上紫色粉色的梦幻颜色',
    criterion: { minCool: 1, minWarm: 1 },
    exampleText: '我给梦里花园配了紫色和粉色，因为梦是彩色的',
  },
  // 9. 太空
  {
    id: 'space-night',
    scene: 'space',
    emoji: '🪐',
    title: '静静的外太空',
    emotion: '神秘',
    prompt: '外太空黑黑静静的，给它配上深蓝和紫色',
    criterion: { minCool: 1, neutralAllowed: true },
    exampleText: '我给太空配了深蓝和黑色，因为太空很神秘',
  },
  {
    id: 'space-nebula',
    scene: 'space',
    emoji: '🪐',
    title: '彩色星云',
    emotion: '梦幻',
    prompt: '哇，星云是彩色的！给它配上紫粉蓝的梦幻颜色',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给星云配了紫色和粉色，因为星云像棉花糖',
  },
  {
    id: 'space-planet',
    scene: 'space',
    emoji: '🪐',
    title: '温暖的小星球',
    emotion: '温暖',
    prompt: '给远处的小星球配上温暖的颜色，像家一样',
    criterion: { minWarm: 2, coolAllowed: 1 },
    exampleText: '我给小星球配了暖色，因为想让它也有家',
  },
  // 10. 衣服
  {
    id: 'clothes-rainy',
    scene: 'clothes',
    emoji: '🧥',
    title: '下雨天的小雨衣',
    emotion: '安全',
    prompt: '给小雨衣配上醒目的颜色，让司机叔叔一眼看到你',
    criterion: { minWarm: 1 },
    exampleText: '我给雨衣配了亮黄色，因为雨天要安全',
  },
  {
    id: 'clothes-summer',
    scene: 'clothes',
    emoji: '🧥',
    title: '夏天的小T恤',
    emotion: '清凉',
    prompt: '夏天穿什么颜色最凉快？给小T恤配上清凉色',
    criterion: { minCool: 2, warmAllowed: 1 },
    exampleText: '我给T恤配了浅蓝色，因为看着就凉快',
  },
  {
    id: 'clothes-winter',
    scene: 'clothes',
    emoji: '🧥',
    title: '冬天的厚棉袄',
    emotion: '温暖',
    prompt: '冬天好冷，给厚棉袄配上暖暖的颜色吧',
    criterion: { minWarm: 2, coolAllowed: 1 },
    exampleText: '我给棉袄配了暖红色，因为穿上就不冷了',
  },
];

export const SCENE_TASK_MAP = Object.fromEntries(SCENE_TASKS.map((t) => [t.id, t]));

// 与配色练习共用的情绪判定（与主题判定同样的冷暖逻辑）
export function evaluateScene(criterion, selectedIds, colorList) {
  const meta = Object.fromEntries(colorList.map((c) => [c.id, c]));
  let warm = 0;
  let cool = 0;
  let neutral = 0;
  for (const id of selectedIds) {
    const c = meta[id];
    if (!c) continue;
    if (c.neutral) neutral += 1;
    else if (c.warm) warm += 1;
    else if (c.cool) cool += 1;
  }
  const {
    minWarm = 0,
    minCool = 0,
    neutralMin = 0,
    warmAllowed = Infinity,
    coolAllowed = Infinity,
    neutralAllowed = true,
  } = criterion;
  const ok =
    warm >= minWarm &&
    cool >= minCool &&
    neutral >= neutralMin &&
    warm <= warmAllowed &&
    cool <= coolAllowed &&
    (neutralAllowed ? true : neutral === 0);
  return {
    ok,
    warm,
    cool,
    neutral,
    explanation: ok
      ? '你的颜色说出了画里的心情，真是色彩小表达家！'
      : '闭上眼睛想一想：这种心情是暖暖的，还是凉凉的？再试试～',
  };
}
