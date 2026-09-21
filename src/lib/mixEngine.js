// 真实颜料混色引擎：RYB（红-黄-蓝传统美术三原色）模型
// 用六分三角形重心插值求彩色基底，再按黑/白比例调暗、调亮（在线性 RGB 空间混合）
import { colorById } from '../data/colors.js';
import { hexToRgb, rgbToHex } from './colorMath.js';

// RYB 大三角形布局：红在顶点，黄左下，蓝右下
const V = {
  R: { p: [0.5, 0], hex: colorById.red.hex },
  Y: { p: [0, 1], hex: colorById.yellow.hex },
  B: { p: [1, 1], hex: colorById.blue.hex },
  O: { p: [0.25, 0.5], hex: colorById.orange.hex },
  G: { p: [0.5, 1], hex: colorById.green.hex },
  P: { p: [0.75, 0.5], hex: colorById.purple.hex },
  // 三色等量点 = 大三角形重心：颜料等量混合的真实结果（暖棕，而非发黑）
  M: { p: [0.5, 2 / 3], hex: '#8A6A44' },
};

// 六个小三角形（中心 M 向外分出）
const FAN = [
  ['R', 'O', 'M'],
  ['O', 'Y', 'M'],
  ['Y', 'G', 'M'],
  ['G', 'B', 'M'],
  ['B', 'P', 'M'],
  ['P', 'R', 'M'],
];

function barycentric(px, py, a, b, c) {
  const [ax, ay] = V[a].p;
  const [bx, by] = V[b].p;
  const [cx, cy] = V[c].p;
  const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const wa = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den;
  const wb = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
  const wc = 1 - wa - wb;
  return [wa, wb, wc];
}

const lin = (c) => {
  const v = c / 255;
  return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
};
const srgb = (v) => {
  v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
};

function averageHexColors(items) {
  // items: [[hex, weight], ...] 在线性光空间加权平均
  let r = 0;
  let g = 0;
  let b = 0;
  let wsum = 0;
  for (const [hex, w] of items) {
    const c = hexToRgb(hex);
    r += lin(c.r) * w;
    g += lin(c.g) * w;
    b += lin(c.b) * w;
    wsum += w;
  }
  if (wsum === 0) return '#FFFFFF';
  return rgbToHex({ r: srgb(r / wsum), g: srgb(g / wsum), b: srgb(b / wsum) });
}

function rybBase(fr, fy, fb) {
  const px = fr * 0.5 + fy * 0 + fb * 1;
  const py = fr * 0 + fy * 1 + fb * 1;
  for (const tri of FAN) {
    const [wa, wb, wc] = barycentric(px, py, ...tri);
    const eps = -0.002;
    if (wa >= eps && wb >= eps && wc >= eps) {
      return averageHexColors([
        [V[tri[0]].hex, Math.max(0, wa)],
        [V[tri[1]].hex, Math.max(0, wb)],
        [V[tri[2]].hex, Math.max(0, wc)],
      ]);
    }
  }
  // 浮点兜底：取最近三角形
  let best = null;
  let bestD = Infinity;
  for (const tri of FAN) {
    const [wa, wb] = barycentric(px, py, ...tri);
    const wc = 1 - wa - wb;
    const d = Math.min(wa, wb, wc);
    if (d < bestD) {
      bestD = d;
      best = averageHexColors([
        [V[tri[0]].hex, Math.max(0, wa)],
        [V[tri[1]].hex, Math.max(0, wb)],
        [V[tri[2]].hex, Math.max(0, wc)],
      ]);
    }
  }
  return best;
}

export const EMPTY_DROPS = { red: 0, yellow: 0, blue: 0, black: 0, white: 0 };

// drops: { red, yellow, blue, black, white } 数值（滴数，可连续）
export function mixPigments(drops) {
  const r = Math.max(0, drops.red || 0);
  const y = Math.max(0, drops.yellow || 0);
  const b = Math.max(0, drops.blue || 0);
  const k = Math.max(0, drops.black || 0);
  const w = Math.max(0, drops.white || 0);
  const chroma = r + y + b;
  const total = chroma + k + w;
  if (total === 0) return null;

  if (chroma === 0) {
    // 只有黑白 → 灰
    return averageHexColors([
      ['#2B2B33', k],
      ['#F7F4EC', w],
    ]);
  }

  const base = rybBase(r / chroma, y / chroma, b / chroma);
  return averageHexColors([
    [base, chroma],
    ['#2B2B33', k],
    ['#F7F4EC', w],
  ]);
}

const DROP_NAME = {
  red: '红',
  yellow: '黄',
  blue: '蓝',
  black: '黑',
  white: '白',
};

// 生成配方描述，如 "红2 + 黄1 = 橙色"
export function recipeText(drops, resultName = null) {
  const parts = Object.entries(drops)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${DROP_NAME[k]}${Math.round(n)}`);
  if (!parts.length) return '';
  return parts.join(' + ') + (resultName ? ` = ${resultName}` : '');
}

// 20 组基础混色规则（配方比例经引擎验证）
export const MIX_RULES = [
  { id: 'mr1', label: '红 + 黄 = 橙', drops: { red: 1, yellow: 1, blue: 0, black: 0, white: 0 } },
  { id: 'mr2', label: '红多黄少 = 橘红', drops: { red: 2, yellow: 1, blue: 0, black: 0, white: 0 } },
  { id: 'mr3', label: '黄多红少 = 橙黄', drops: { red: 1, yellow: 2, blue: 0, black: 0, white: 0 } },
  { id: 'mr4', label: '蓝 + 黄 = 绿', drops: { red: 0, yellow: 1, blue: 1, black: 0, white: 0 } },
  { id: 'mr5', label: '蓝多黄少 = 蓝绿', drops: { red: 0, yellow: 1, blue: 2, black: 0, white: 0 } },
  { id: 'mr6', label: '黄多蓝少 = 黄绿', drops: { red: 0, yellow: 2, blue: 1, black: 0, white: 0 } },
  { id: 'mr7', label: '红 + 蓝 = 紫', drops: { red: 1, yellow: 0, blue: 1, black: 0, white: 0 } },
  { id: 'mr8', label: '红多蓝少 = 紫红', drops: { red: 2, yellow: 0, blue: 1, black: 0, white: 0 } },
  { id: 'mr9', label: '蓝多红少 = 蓝紫', drops: { red: 1, yellow: 0, blue: 2, black: 0, white: 0 } },
  { id: 'mr10', label: '红 + 白 = 粉', drops: { red: 1, yellow: 0, blue: 0, black: 0, white: 1 } },
  { id: 'mr11', label: '橙 + 白 = 浅橙', drops: { red: 1, yellow: 1, blue: 0, black: 0, white: 1 } },
  { id: 'mr12', label: '黄 + 白 = 鹅黄', drops: { red: 0, yellow: 2, blue: 0, black: 0, white: 1 } },
  { id: 'mr13', label: '蓝 + 白 = 浅蓝', drops: { red: 0, yellow: 0, blue: 1, black: 0, white: 1 } },
  { id: 'mr14', label: '绿 + 白 = 浅绿', drops: { red: 0, yellow: 1, blue: 1, black: 0, white: 1 } },
  { id: 'mr15', label: '紫 + 白 = 浅紫', drops: { red: 1, yellow: 0, blue: 1, black: 0, white: 1 } },
  { id: 'mr16', label: '红 + 黑 = 深红', drops: { red: 2, yellow: 0, blue: 0, black: 1, white: 0 } },
  { id: 'mr17', label: '蓝 + 黑 = 深蓝', drops: { red: 0, yellow: 0, blue: 2, black: 1, white: 0 } },
  { id: 'mr18', label: '绿 + 黑 = 深绿', drops: { red: 0, yellow: 1, blue: 1, black: 1, white: 0 } },
  { id: 'mr19', label: '红 + 黄 + 蓝 = 棕', drops: { red: 1, yellow: 1, blue: 1, black: 0, white: 0 } },
  { id: 'mr20', label: '黑 + 白 = 灰', drops: { red: 0, yellow: 0, blue: 0, black: 1, white: 1 } },
];
