import { create } from 'zustand';
import {
  idbPut,
  idbGetAll,
  idbGet,
  idbDelete,
} from '../lib/db.js';
import { hashPin, randomSalt, uid } from '../lib/util.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { setMuted } from '../lib/audio.js';

const SETTINGS_ID = 'global';

const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  pinHash: null,
  pinSalt: null,
  isDefaultPin: true,
  dailyQuestions: 5, // 每日练习量 3-10
  soundOn: true,
};

export const useAppStore = create((set, get) => ({
  ready: false,
  profiles: [],
  currentProfileId: null,
  settings: { ...DEFAULT_SETTINGS },
  // 刚刚解锁、需要弹窗庆祝的徽章
  newBadges: [],

  async init() {
    const [profiles, settingsRow] = await Promise.all([
      idbGetAll('profiles'),
      idbGet('parentSettings', SETTINGS_ID),
    ]);
    const settings = { ...DEFAULT_SETTINGS, ...(settingsRow || {}) };
    if (settings.isDefaultPin && !settings.pinHash) {
      // 默认 PIN 0000，首次进入家长面板时提示修改
      const salt = randomSalt();
      settings.pinSalt = salt;
      settings.pinHash = await hashPin('0000', salt);
      await idbPut('parentSettings', settings);
    }
    setMuted(!settings.soundOn);
    set({
      profiles: profiles.sort((a, b) => a.createdAt - b.createdAt),
      settings,
      ready: true,
      currentProfileId:
        get().currentProfileId ||
        localStorage.getItem('colokid:currentProfile') ||
        null,
    });
  },

  async createProfile({ nickname, birthday, avatar }) {
    const profile = {
      id: uid('p_'),
      nickname,
      birthday: birthday || '',
      avatar: avatar || '🐻',
      stars: 0,
      totalSeconds: 0,
      createdAt: Date.now(),
    };
    await idbPut('profiles', profile);
    set((s) => ({ profiles: [...s.profiles, profile], currentProfileId: profile.id }));
    localStorage.setItem('colokid:currentProfile', profile.id);
    return profile;
  },

  selectProfile(id) {
    set({ currentProfileId: id });
    localStorage.setItem('colokid:currentProfile', id);
  },

  async updateProfile(id, patch) {
    const p = get().profiles.find((x) => x.id === id);
    if (!p) return;
    const next = { ...p, ...patch };
    await idbPut('profiles', next);
    set((s) => ({ profiles: s.profiles.map((x) => (x.id === id ? next : x)) }));
  },

  async deleteProfile(id) {
    await idbDelete('profiles', id);
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      currentProfileId: s.currentProfileId === id ? null : s.currentProfileId,
    }));
    if (get().currentProfileId == null) localStorage.removeItem('colokid:currentProfile');
  },

  currentProfile() {
    return get().profiles.find((p) => p.id === get().currentProfileId) || null;
  },

  async addStars(profileId, count) {
    const p = get().profiles.find((x) => x.id === profileId);
    if (!p) return;
    const next = { ...p, stars: (p.stars || 0) + count };
    await idbPut('profiles', next);
    set((s) => ({ profiles: s.profiles.map((x) => (x.id === profileId ? next : x)) }));
  },

  async addStudySeconds(profileId, seconds) {
    const p = get().profiles.find((x) => x.id === profileId);
    if (!p) return;
    const next = { ...p, totalSeconds: (p.totalSeconds || 0) + seconds };
    await idbPut('profiles', next);
    set((s) => ({ profiles: s.profiles.map((x) => (x.id === profileId ? next : x)) }));
  },

  async saveSettings(patch) {
    const next = { ...get().settings, ...patch };
    await idbPut('parentSettings', next);
    set({ settings: next });
    setMuted(!next.soundOn);
  },

  async verifyPin(pin) {
    const { settings } = get();
    const hash = await hashPin(pin, settings.pinSalt);
    return hash === settings.pinHash;
  },

  async changePin(newPin) {
    const salt = randomSalt();
    const pinHash = await hashPin(newPin, salt);
    await get().saveSettings({ pinHash, pinSalt: salt, isDefaultPin: false });
  },

  async resetPinToDefault() {
    // 仅供家长面板内部调用（已通过 PIN 验证）
    const salt = randomSalt();
    const pinHash = await hashPin('0000', salt);
    await get().saveSettings({ pinHash, pinSalt: salt, isDefaultPin: true });
  },

  // 根据聚合指标解锁徽章；返回本次新解锁列表
  async checkAchievements(profileId, metrics) {
    const existing = await idbGetAll('achievements');
    const have = new Set(
      existing.filter((a) => a.profileId === profileId).map((a) => a.achievementId)
    );
    const unlocked = [];
    for (const def of ACHIEVEMENTS) {
      const value = metrics[def.metric] || 0;
      if (!have.has(def.id) && value >= def.goal) {
        const rec = {
          id: uid('ach_'),
          profileId,
          achievementId: def.id,
          createdAt: Date.now(),
        };
        await idbPut('achievements', rec);
        unlocked.push(def);
      }
    }
    if (unlocked.length) set((s) => ({ newBadges: [...s.newBadges, ...unlocked] }));
    return unlocked;
  },

  dismissBadges() {
    set({ newBadges: [] });
  },
}));
