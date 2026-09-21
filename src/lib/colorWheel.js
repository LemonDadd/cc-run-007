// 色轮与配色规则：互补色、邻近色、三角配色、分裂互补
// 色轮顺序按色相排列（美术 8 色轮）
export const WHEEL_ORDER = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
];

export const NEUTRAL_IDS = ['black', 'white', 'gray'];
export const BROWN_ID = 'brown';

// 互补色对（色轮对面）
export const COMPLEMENTARY_PAIRS = [
  ['red', 'green'],
  ['orange', 'cyan'],
  ['yellow', 'blue'],
  ['pink', 'cyan'],
  ['purple', 'yellow'],
];

// 三角配色（三色在色轮上比较均匀地分开）
export const TRIADS = [
  ['red', 'yellow', 'blue'], // 美术三原色经典三角
  ['orange', 'green', 'purple'], // 三间色三角
  ['green', 'blue', 'red'],
  ['yellow', 'cyan', 'purple'],
  ['orange', 'cyan', 'purple'],
  ['green', 'blue', 'pink'],
];

// 分裂互补：一个主色 + 它互补色两边的两个邻居
export const SPLIT_COMPLEMENTS = [
  ['red', 'cyan', 'blue'],
  ['red', 'yellow', 'cyan'],
  ['orange', 'blue', 'purple'],
  ['yellow', 'purple', 'pink'],
  ['green', 'pink', 'red'],
  ['cyan', 'red', 'orange'],
  ['blue', 'orange', 'yellow'],
  ['purple', 'yellow', 'green'],
  ['pink', 'green', 'cyan'],
];

const key = (ids) => [...ids].sort().join('|');

export function isNeutral(id) {
  return NEUTRAL_IDS.includes(id);
}

// 判断已选颜色是否符合给定规则
// 返回 { ok, explanation }
export function evaluateRule(rule, selectedIds) {
  const chrom = [...new Set(selectedIds.filter((id) => !isNeutral(id) && id !== BROWN_ID))];
  const neutralCount = selectedIds.filter((id) => isNeutral(id)).length;
  const hasBrown = selectedIds.includes(BROWN_ID);
  const extras = neutralCount + (hasBrown ? 1 : 0);

  const hasSet = (sets, size) => {
    const k = key(chrom);
    return sets.some((s) => key(s) === k) && chrom.length === size;
  };

  switch (rule) {
    case 'complementary': {
      if (chrom.length !== 2) {
        return {
          ok: false,
          explanation: '互补色要选两个正好相对的颜色，比如红配绿、黄配蓝哦～',
        };
      }
      const ok = COMPLEMENTARY_PAIRS.some((p) => key(p) === key(chrom));
      return {
        ok,
        explanation: ok
          ? '真棒！这两个颜色在色轮上正好面对面，对比最强烈、最亮眼，这就是互补色！'
          : '再试试：在色轮上找一找，它正对面的好朋友是谁呢？',
      };
    }
    case 'analogous': {
      if (chrom.length !== 2) {
        return { ok: false, explanation: '邻近色要选两个住在色轮隔壁的颜色哦～' };
      }
      const [a, b] = chrom;
      const ia = WHEEL_ORDER.indexOf(a);
      const ib = WHEEL_ORDER.indexOf(b);
      let d = Math.abs(ia - ib);
      d = Math.min(d, WHEEL_ORDER.length - d);
      const ok = d === 1;
      return {
        ok,
        explanation: ok
          ? '太柔和啦！这两个颜色在色轮上是邻居，看起来很舒服、很和谐，这就是邻近色。'
          : '它们住得有点远呢，找找色轮上紧挨在一起的邻居吧～',
      };
    }
    case 'triadic': {
      const ok = chrom.length === 3 && hasSet(TRIADS, 3);
      return {
        ok,
        explanation: ok
          ? '哇，三个颜色在色轮上站成了一个三角形，又活泼又平衡，这就是三角配色！'
          : '三角配色要选三个在色轮上均匀分开的颜色，像三角形的三个角一样～',
      };
    }
    case 'split': {
      const ok = chrom.length === 3 && hasSet(SPLIT_COMPLEMENTS, 3);
      return {
        ok,
        explanation: ok
          ? '你找到了一个颜色和它互补色旁边的两个邻居，对比又丰富又不刺眼，这就是分裂互补！'
          : '分裂互补是：先选一个颜色，再选它对面颜色左右两边的邻居哦～',
      };
    }
    default:
      return { ok: false, explanation: '' };
  }
}

export const RULE_META = {
  complementary: { name: '互补色', emoji: '🎯', desc: '色轮上正对面的两个颜色，对比最强烈' },
  analogous: { name: '邻近色', emoji: '🌈', desc: '色轮上挨在一起的邻居，柔和又和谐' },
  triadic: { name: '三角配色', emoji: '🔺', desc: '三个颜色均匀分开，站成一个三角形' },
  split: { name: '分裂互补', emoji: '✨', desc: '一个颜色配上对面颜色的两个邻居' },
};

// 在色轮上的角度（用于画 SVG 色轮）
export function wheelAngle(id) {
  const i = WHEEL_ORDER.indexOf(id);
  if (i < 0) return null;
  // 从顶部开始顺时针
  return i * (360 / WHEEL_ORDER.length) - 90;
}
