// 六类成就徽章
export const ACHIEVEMENTS = [
  {
    id: 'color-master',
    name: '认色达人',
    emoji: '🎨',
    desc: '学完 12 种颜色的认色卡',
    goal: 12,
    metric: 'colorsLearned',
    color: '#E8384A',
  },
  {
    id: 'discriminate-pro',
    name: '辨色高手',
    emoji: '🔍',
    desc: '辨色游戏正确率达到 90%',
    goal: 90,
    metric: 'discriminateRate',
    suffix: '%',
    color: '#2E7BE6',
  },
  {
    id: 'mix-magician',
    name: '调色小魔术师',
    emoji: '🧪',
    desc: '完成 20 次调色',
    goal: 20,
    metric: 'mixingCount',
    color: '#8A4FD0',
  },
  {
    id: 'match-designer',
    name: '配色设计师',
    emoji: '👗',
    desc: '完成 30 个配色练习',
    goal: 30,
    metric: 'matchingCount',
    color: '#FF8A1E',
  },
  {
    id: 'color-observer',
    name: '色彩观察家',
    emoji: '📔',
    desc: '记录 30 篇色彩观察日记',
    goal: 30,
    metric: 'diaryCount',
    color: '#3CB54A',
  },
  {
    id: 'color-expresser',
    name: '色彩表达者',
    emoji: '💌',
    desc: '完成 10 个情境用色作品',
    goal: 10,
    metric: 'coloringCount',
    color: '#FF8FB3',
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// 完成模块时可获得的星星规则
export const STAR_RULES = {
  colorCard: 1, // 学完一张认色卡
  discriminate80: 1, // 一轮正确率 >= 80%
  discriminate100: 2, // 一轮 100%
  mixing: 1,
  matching: 1,
  coloring: 1,
  diary: 1,
};
