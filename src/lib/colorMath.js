// 色彩数学：hex/rgb/hsl/ Lab 转换 + CIEDE2000 色差
import { clamp } from './util.js';

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const c = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return {
    r: clamp((r1 + m) * 255, 0, 255),
    g: clamp((g1 + m) * 255, 0, 255),
    b: clamp((b1 + m) * 255, 0, 255),
  };
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

export function hexToHsl(hex) {
  return rgbToHsl(hexToRgb(hex));
}

// sRGB -> Lab（D65）
function rgbToXyz({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  };
  const R = f(r);
  const G = f(g);
  const B = f(b);
  return {
    x: (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100,
    y: (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100,
    z: (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100,
  };
}

export function rgbToLab(rgb) {
  const { x, y, z } = rgbToXyz(rgb);
  const Xn = 95.047;
  const Yn = 100;
  const Zn = 108.883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function hexToLab(hex) {
  return rgbToLab(hexToRgb(hex));
}

// CIEDE2000 色差（标准实现，kL=kC=kH=1）
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  let h1p = C1p === 0 ? 0 : (Math.atan2(b1, a1p) * 180) / Math.PI;
  if (h1p < 0) h1p += 360;
  let h2p = C2p === 0 ? 0 : (Math.atan2(b2, a2p) * 180) / Math.PI;
  if (h2p < 0) h2p += 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p !== 0 && C2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else if (diff > 180) dhp = diff - 360;
    else dhp = diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * (Math.PI / 180));
  let avgHp = h1p + h2p;
  if (C1p !== 0 && C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) {
      avgHp = (h1p + h2p < 360 ? avgHp + 360 : avgHp - 360) / 2;
    } else {
      avgHp = avgHp / 2;
    }
  }
  const T =
    1 -
    0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) +
    0.24 * Math.cos(((2 * avgHp) * Math.PI) / 180) +
    0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const dTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const RT = -Math.sin((2 * dTheta * Math.PI) / 180) * RC;
  return Math.sqrt(
    (dLp / SL) ** 2 +
      (dCp / SC) ** 2 +
      (dHp / SH) ** 2 +
      RT * (dCp / SC) * (dHp / SH)
  );
}

export function deltaEHex(hexA, hexB) {
  return deltaE2000(hexToLab(hexA), hexToLab(hexB));
}

// 明度渐变 / 饱和度渐变（认色卡用）
export function lightnessSteps(hex, steps = 9) {
  const hsl = hexToHsl(hex);
  return Array.from({ length: steps }, (_, i) => {
    const l = 12 + (i * 76) / (steps - 1);
    return hslToHex({ h: hsl.h, s: Math.max(hsl.s, 55), l });
  });
}

export function saturationSteps(hex, steps = 9) {
  const hsl = hexToHsl(hex);
  return Array.from({ length: steps }, (_, i) => {
    const s = (i * 100) / (steps - 1);
    return hslToHex({ h: hsl.h, s, l: Math.max(45, Math.min(65, hsl.l)) });
  });
}

// 文字与背景的对比度，决定用黑字还是白字
export function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}
