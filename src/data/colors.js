// 12 种基础色：名称、拼音、色值、生活例子、冷暖分类
export const BASE_COLORS = [
  {
    id: 'red',
    name: '红色',
    pinyin: 'hóng sè',
    hex: '#E8384A',
    warm: true,
    examples: ['红苹果', '消防车', '红灯笼'],
    emoji: '🍎',
  },
  {
    id: 'orange',
    name: '橙色',
    pinyin: 'chéng sè',
    hex: '#FF8A1E',
    warm: true,
    examples: ['橙子', '胡萝卜', '夕阳'],
    emoji: '🍊',
  },
  {
    id: 'yellow',
    name: '黄色',
    pinyin: 'huáng sè',
    hex: '#FFD426',
    warm: true,
    examples: ['香蕉', '向日葵', '小黄鸭'],
    emoji: '🍌',
  },
  {
    id: 'green',
    name: '绿色',
    pinyin: 'lǜ sè',
    hex: '#3CB54A',
    cool: true,
    examples: ['树叶', '西瓜皮', '小草'],
    emoji: '🌳',
  },
  {
    id: 'cyan',
    name: '青色',
    pinyin: 'qīng sè',
    hex: '#1FB8B0',
    cool: true,
    examples: ['湖水', '小薄荷', '孔雀羽毛'],
    emoji: '🦚',
  },
  {
    id: 'blue',
    name: '蓝色',
    pinyin: 'lán sè',
    hex: '#2E7BE6',
    cool: true,
    examples: ['天空', '大海', '蓝莓'],
    emoji: '🌊',
  },
  {
    id: 'purple',
    name: '紫色',
    pinyin: 'zǐ sè',
    hex: '#8A4FD0',
    cool: true,
    examples: ['葡萄', '茄子', '紫藤花'],
    emoji: '🍇',
  },
  {
    id: 'pink',
    name: '粉色',
    pinyin: 'fěn sè',
    hex: '#FF8FB3',
    warm: true,
    examples: ['桃花', '小猪', '棉花糖'],
    emoji: '🌸',
  },
  {
    id: 'brown',
    name: '棕色',
    pinyin: 'zōng sè',
    hex: '#9C6433',
    warm: true,
    examples: ['巧克力', '树干', '小熊'],
    emoji: '🐻',
  },
  {
    id: 'black',
    name: '黑色',
    pinyin: 'hēi sè',
    hex: '#2B2B33',
    neutral: true,
    examples: ['小熊猫的耳朵', '夜空', '黑板'],
    emoji: '🐼',
  },
  {
    id: 'white',
    name: '白色',
    pinyin: 'bái sè',
    hex: '#F7F4EC',
    neutral: true,
    examples: ['云朵', '棉花', '小雪花'],
    emoji: '☁️',
  },
  {
    id: 'gray',
    name: '灰色',
    pinyin: 'huī sè',
    hex: '#9AA0A6',
    neutral: true,
    examples: ['小石子', '大象', '阴天的云'],
    emoji: '🐘',
  },
];

export const colorById = Object.fromEntries(BASE_COLORS.map((c) => [c.id, c]));

// 调色实验室可使用的 5 种基础颜料：三原色 + 黑 + 白
export const PAINT_POTS = ['red', 'yellow', 'blue', 'black', 'white'].map((id) => ({
  ...colorById[id],
}));

// 辨色游戏相近色辨析组
export const SIMILAR_GROUPS = [
  { label: '深蓝与浅蓝', colors: ['blue', 'cyan'] },
  { label: '红与橙', colors: ['red', 'orange'] },
  { label: '黄与绿', colors: ['yellow', 'green'] },
  { label: '紫与粉', colors: ['purple', 'pink'] },
];
