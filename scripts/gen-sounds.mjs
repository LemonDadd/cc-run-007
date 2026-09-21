// 构建期生成本地音效（WAV PCM，零依赖、无网络资源）
// 产物为 base64 data URI，打包后完全自包含
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;

function pcm(seconds) {
  return new Float32Array(Math.floor(SR * seconds));
}

function tone(buf, start, dur, freq, { type = 'sine', gain = 0.25, decay = 6 } = {}) {
  const s = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-decay * t / dur);
    let v = 0;
    const ph = 2 * Math.PI * freq * t;
    if (type === 'sine') v = Math.sin(ph);
    else if (type === 'tri') v = Math.asin(Math.sin(ph)) * (2 / Math.PI);
    v *= env * gain;
    if (s + i < buf.length) buf[s + i] += v;
  }
}

function gliss(buf, start, dur, f0, f1, { gain = 0.25 } = {}) {
  const s = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 + (f1 - f0) * t;
    const env = Math.exp(-3 * t);
    if (s + i < buf.length) buf[s + i] += Math.sin(2 * Math.PI * f * (i / SR)) * env * gain;
  }
}

function encodeWav(buf) {
  const n = buf.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(ab);
  const ws = (off, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
  ws(0, 'RIFF');
  dv.setUint32(4, 36 + n * 2, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, SR, true);
  dv.setUint32(28, SR * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  ws(36, 'data');
  dv.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    o += 2;
  }
  return Buffer.from(ab);
}

function toDataUri(buf) {
  return 'data:audio/wav;base64,' + encodeWav(buf).toString('base64');
}

const sounds = {};
{
  const b = pcm(0.08);
  tone(b, 0, 0.07, 660, { gain: 0.18, decay: 8 });
  sounds.click = toDataUri(b);
}
{
  const b = pcm(0.5);
  tone(b, 0, 0.14, 523.25, { gain: 0.22 });
  tone(b, 0.13, 0.14, 659.25, { gain: 0.22 });
  tone(b, 0.26, 0.22, 783.99, { gain: 0.24 });
  sounds.correct = toDataUri(b);
}
{
  // 温和的引导音（不刺耳、无惩罚感）
  const b = pcm(0.4);
  tone(b, 0, 0.16, 330, { type: 'tri', gain: 0.16, decay: 4 });
  tone(b, 0.17, 0.2, 262, { type: 'tri', gain: 0.16, decay: 4 });
  sounds.gentle = toDataUri(b);
}
{
  const b = pcm(0.35);
  gliss(b, 0, 0.32, 880, 1568, { gain: 0.22 });
  sounds.star = toDataUri(b);
}
{
  const b = pcm(0.85);
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(b, i * 0.12, 0.3, f, { gain: 0.2, decay: 5 })
  );
  sounds.badge = toDataUri(b);
}
{
  const b = pcm(1.1);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(b, i * 0.14, 0.5, f, { gain: 0.2, decay: 4 }));
  gliss(b, 0.6, 0.45, 700, 1400, { gain: 0.14 });
  sounds.win = toDataUri(b);
}
{
  // 颜料滴入
  const b = pcm(0.18);
  gliss(b, 0, 0.16, 500, 180, { gain: 0.2 });
  sounds.drop = toDataUri(b);
}

const out =
  '// 本文件由 scripts/gen-sounds.mjs 自动生成，请勿手改\n' +
  '// 本地内置音效（base64 WAV data URI），运行时无需任何网络请求\n' +
  'export default ' +
  JSON.stringify(sounds, null, 2) +
  ';\n';

const target = new URL('../src/generated/sounds.js', import.meta.url);
mkdirSync(dirname(fileURLToPath(target)), { recursive: true });
writeFileSync(fileURLToPath(target), out);
console.log('sounds generated:', Object.keys(sounds).join(', '));
