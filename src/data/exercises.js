// 50 组配色练习：20 组两色 + 20 组三色 + 10 组主题配色
import {
  COMPLEMENTARY_PAIRS,
  TRIADS,
  SPLIT_COMPLEMENTS,
  WHEEL_ORDER,
  isNeutral,
} from '../lib/colorWheel.js';
import { colorById } from './colors.js';
import { seededRandom } from '../lib/util.js';

// 完成练习后可以上色的简笔画模板
export const REWARD_TEMPLATES = [
  { id: 'flower', name: '小花' },
  { id: 'balloon', name: '气球' },
  { id: 'fish', name: '小鱼' },
  { id: 'house', name: '小房子' },
  { id: 'tree', name: '小树' },
  { id: 'star', name: '星星' },
  { id: 'umbrella', name: '小雨伞' },
  { id: 'gift', name: '礼物盒' },
  { id: 'boat', name: '小船' },
  { id: 'kite', name: '风筝' },
];

const TEMPLATES = REWARD_TEMPLATES.map((t) => t.id);

function makePool(answer, size, seed) {
  const rnd = seededRandom(seed);
  const pool = [...answer];
  const others = WHEEL_ORDER.filter((id) => !answer.includes(id));
  // 稳定洗牌
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  pool.push(...others.slice(0, Math.max(0, size - answer.length)));
  // 干扰项里给一两个中性色
  const neutral = ['white', 'black', 'gray', 'brown'].filter((id) => !pool.includes(id));
  while (pool.length < size) pool.push(neutral.shift());
  // 再洗牌一遍，让答案不固定在前面
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

const names = (ids) => ids.map((id) => colorById[id].name.replace('色', '')).join(' + ');

const exercises = [];
let n = 0;
const push = (e) => {
  n += 1;
  exercises.push({ order: n, id: `m${String(n).padStart(2, '0')}`, ...e });
};

// ---- 两色搭配 20 题：10 互补 + 10 邻近 ----
const twoPrompts = (a, b, rule) =>
  rule === 'complementary'
    ? `给${a}找一个正对面的互补色好朋友`
    : `给${a}找一个住在隔壁的邻近色好朋友`;

COMPLEMENTARY_PAIRS.forEach((pair, i) => {
  const answer = pair;
  push({
    kind: 'two',
    rule: 'complementary',
    slots: 2,
    answer,
    pool: makePool(answer, 6, 100 + i),
    prompt: twoPrompts(colorById[pair[0]].name, colorById[pair[1]].name, 'complementary'),
    hint: '提示：色轮上正对面的颜色最亮眼！',
    template: TEMPLATES[i % TEMPLATES.length],
  });
});
COMPLEMENTARY_PAIRS.forEach((pair, i) => {
  // 反向出题：让孩子为 pair[1] 找 pair[0]
  push({
    kind: 'two',
    rule: 'complementary',
    slots: 2,
    answer: pair,
    pool: makePool(pair, 6, 200 + i),
    prompt: twoPrompts(colorById[pair[1]].name, colorById[pair[0]].name, 'complementary'),
    hint: '提示：在色轮对面找一找～',
    template: TEMPLATES[(i + 3) % TEMPLATES.length],
  });
});

WHEEL_ORDER.slice(0, 5).forEach((id, i) => {
  const next = WHEEL_ORDER[(i + 1) % WHEEL_ORDER.length];
  const pair = [id, next];
  push({
    kind: 'two',
    rule: 'analogous',
    slots: 2,
    answer: pair,
    pool: makePool(pair, 6, 300 + i),
    prompt: twoPrompts(colorById[id].name, colorById[next].name, 'analogous'),
    hint: '提示：找色轮上紧挨在一起的邻居～',
    template: TEMPLATES[i % TEMPLATES.length],
  });
});
WHEEL_ORDER.slice(3, 8).forEach((id, i) => {
  const prev = WHEEL_ORDER[(WHEEL_ORDER.indexOf(id) - 1 + WHEEL_ORDER.length) % WHEEL_ORDER.length];
  const pair = [id, prev];
  push({
    kind: 'two',
    rule: 'analogous',
    slots: 2,
    answer: pair,
    pool: makePool(pair, 6, 400 + i),
    prompt: `再找一组柔和的邻居：${colorById[id].name}旁边还有谁？`,
    hint: '提示：另一边的邻居也是好搭配～',
    template: TEMPLATES[(i + 5) % TEMPLATES.length],
  });
});

// ---- 三色搭配 20 题：10 三角 + 10 分裂互补 ----
TRIADS.forEach((tri, i) => {
  push({
    kind: 'three',
    rule: 'triadic',
    slots: 3,
    answer: tri,
    pool: makePool(tri, 7, 500 + i),
    prompt: `三角配色：选三个在色轮上站成三角形的颜色（${names(
      tri.slice(0, 2)
    )}……还差哪个？）`,
    hint: '提示：三个颜色要均匀分开哦。',
    template: TEMPLATES[i % TEMPLATES.length],
  });
});
TRIADS.slice(0, 4).forEach((tri, i) => {
  const rotated = [tri[1], tri[2], tri[0]];
  push({
    kind: 'three',
    rule: 'triadic',
    slots: 3,
    answer: tri,
    pool: makePool(tri, 7, 600 + i),
    prompt: `再来一组三角配色，让 ${names(rotated.slice(0, 2))} 找到第三个伙伴`,
    hint: '提示：像三角形的三个角。',
    template: TEMPLATES[(i + 2) % TEMPLATES.length],
  });
});
SPLIT_COMPLEMENTS.slice(0, 5).forEach((tri, i) => {
  push({
    kind: 'three',
    rule: 'split',
    slots: 3,
    answer: tri,
    pool: makePool(tri, 7, 700 + i),
    prompt: `分裂互补：给${colorById[tri[0]].name}配上它对面颜色的两个邻居`,
    hint: '提示：先找到正对面，再选它左右两边的邻居。',
    template: TEMPLATES[i % TEMPLATES.length],
  });
});
SPLIT_COMPLEMENTS.slice(5, 10).forEach((tri, i) => {
  push({
    kind: 'three',
    rule: 'split',
    slots: 3,
    answer: tri,
    pool: makePool(tri, 7, 800 + i),
    prompt: `挑战分裂互补：选出 ${names(tri)} 这样的三人组`,
    hint: '提示：一个颜色 + 对面颜色的两个邻居。',
    template: TEMPLATES[(i + 4) % TEMPLATES.length],
  });
});
// 第 10 题分裂互补（换题干，找主色）
{
  const tri = SPLIT_COMPLEMENTS[0];
  push({
    kind: 'three',
    rule: 'split',
    slots: 3,
    answer: tri,
    pool: makePool(tri, 7, 900),
    prompt: `再试一次分裂互补：${colorById[tri[1]].name}和${colorById[tri[2]].name}对面的主色是谁？`,
    hint: '提示：它俩正对面夹着的颜色就是主色。',
    template: TEMPLATES[6],
  });
}

// ---- 主题配色 10 题 ----
// criterion: 主题对颜色的要求（暖色/冷色/中性色的数量与情绪）
export const THEMES = [
  {
    theme: '春天',
    emoji: '🌱',
    slots: 3,
    criterion: { minWarm: 1, minCool: 1, neutralAllowed: true },
    prompt: '给春天配色：要有暖暖的花色，也要有嫩嫩的冷色小草哦',
    hint: '春天是粉色的花、黄色的阳光，还有绿色的小草。',
  },
  {
    theme: '夏天的海边',
    emoji: '🏖️',
    slots: 3,
    criterion: { minCool: 2, warmAllowed: 1, neutralAllowed: true },
    prompt: '给夏天的海边配色：蓝蓝凉凉的颜色要多一点',
    hint: '蓝色大海、青色海水，再加一点暖暖的阳光。',
  },
  {
    theme: '秋天的树林',
    emoji: '🍂',
    slots: 3,
    criterion: { minWarm: 2, coolAllowed: 1, neutralAllowed: true },
    prompt: '给秋天的树林配色：红红黄黄暖暖的叶子最多',
    hint: '红色、橙色、黄色的叶子，棕色树干。',
  },
  {
    theme: '冬天下雪',
    emoji: '❄️',
    slots: 3,
    criterion: { minCool: 1, neutralMin: 1, warmAllowed: 1 },
    prompt: '给冬天下雪天配色：白白的雪和冷冷的天空',
    hint: '白色雪花、灰色天空，一点点冷蓝色。',
  },
  {
    theme: '生日派对',
    emoji: '🎉',
    slots: 3,
    criterion: { minWarm: 2, minCool: 0, neutralAllowed: false },
    prompt: '给生日派对配色：要热热闹闹的鲜艳颜色！',
    hint: '红、橙、黄、粉……都很开心！',
  },
  {
    theme: '安静的夜晚',
    emoji: '🌙',
    slots: 3,
    criterion: { minCool: 1, neutralMin: 1, warmAllowed: 1 },
    prompt: '给安静的夜晚配色：深深的、安安静静的颜色',
    hint: '深蓝、紫色的天空，黑色的夜幕。',
  },
  {
    theme: '雨天',
    emoji: '🌧️',
    slots: 3,
    criterion: { minCool: 2, neutralAllowed: true },
    prompt: '给雨天配色：凉凉湿湿的冷色调',
    hint: '蓝色、青色、灰色，像下雨的天空。',
  },
  {
    theme: '大晴天',
    emoji: '☀️',
    slots: 3,
    criterion: { minWarm: 2, coolAllowed: 1, neutralAllowed: true },
    prompt: '给大晴天配色：金灿灿暖洋洋的颜色',
    hint: '黄色太阳、橙色阳光，再来点蓝天。',
  },
  {
    theme: '花园',
    emoji: '🌷',
    slots: 3,
    criterion: { minWarm: 1, minCool: 1, neutralAllowed: true },
    prompt: '给花园配色：要有花朵的暖色和叶子的冷色',
    hint: '红花粉花配绿叶，冷暖都有才好看。',
  },
  {
    theme: '海底世界',
    emoji: '🐠',
    slots: 3,
    criterion: { minCool: 2, warmAllowed: 1 },
    prompt: '给海底世界配色：深深浅浅的蓝绿色，再加一条暖色小鱼',
    hint: '蓝、青、绿是海水，橙或红是小鱼。',
  },
];

THEMES.forEach((t, i) => {
  const pool = [
    'red',
    'orange',
    'yellow',
    'green',
    'cyan',
    'blue',
    'purple',
    'pink',
    'brown',
    'gray',
  ];
  push({
    kind: 'theme',
    slots: t.slots,
    pool,
    prompt: t.prompt,
    hint: t.hint,
    themeName: t.theme,
    emoji: t.emoji,
    criterion: t.criterion,
    template: TEMPLATES[i % TEMPLATES.length],
  });
});

export const MATCHING_EXERCISES = exercises;

// 主题配色判定
export function evaluateTheme(criterion, selectedIds, colorList, themeName = '') {
  const meta = Object.fromEntries(colorList.map((c) => [c.id, c]));
  let warm = 0;
  let cool = 0;
  let neutral = 0;
  for (const id of selectedIds) {
    const c = meta[id];
    if (!c) continue;
    if (isNeutral(id)) neutral += 1;
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
    explanation: ok
      ? `太棒了！你为「${themeName}」配的颜色正好说出了主题的感觉！`
      : '看看题目提示：这个主题需要更多暖暖的颜色还是凉凉的颜色呢？再调一调吧～',
  };
}
