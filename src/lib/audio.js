// 音频服务：本地内置音效（data URI）+ Web Speech API 中文 TTS
// 无语音或被静音时静默降级，游戏照常可玩
import SOUNDS from '../generated/sounds.js';

let muted = false;
const audioPool = new Map();

export function setMuted(v) {
  muted = v;
  if (v) speechCancel();
}
export function isMuted() {
  return muted;
}

export function playSound(name) {
  if (muted) return;
  try {
    let audio = audioPool.get(name);
    if (!audio) {
      audio = new Audio(SOUNDS[name]);
      audio.preload = 'auto';
      audioPool.set(name, audio);
    }
    // 复制一个实例以便快速连点
    const inst = audio.cloneNode();
    inst.volume = 0.9;
    inst.play().catch(() => {});
  } catch {
    /* 静音降级 */
  }
}

export const sfx = {
  click: () => playSound('click'),
  correct: () => playSound('correct'),
  gentle: () => playSound('gentle'),
  star: () => playSound('star'),
  badge: () => playSound('badge'),
  win: () => playSound('win'),
  drop: () => playSound('drop'),
};

// ---------- TTS ----------
let voices = [];
let zhVoice = null;

function refreshVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices();
  zhVoice =
    voices.find((v) => /zh[-_]CN/i.test(v.lang) && /female|ting|xiao|hui/i.test(v.name)) ||
    voices.find((v) => /zh/i.test(v.lang)) ||
    null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function ttsAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speechCancel() {
  if (ttsAvailable()) window.speechSynthesis.cancel();
}

export function speak(text, { rate = 0.9, pitch = 1.15 } = {}) {
  if (muted || !ttsAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    u.pitch = pitch;
    if (zhVoice) u.voice = zhVoice;
    window.speechSynthesis.speak(u);
  } catch {
    /* 静音降级 */
  }
}
