import { create } from 'zustand';
import { idbPut, idbGetByProfile, idbDelete } from '../lib/db.js';
import { uid } from '../lib/util.js';
import { BASE_COLORS } from '../data/colors.js';
import { useAppStore } from './appStore.js';
import { sfx } from '../lib/audio.js';

export const useProgressStore = create((set, get) => ({
  profileId: null,
  colorProgress: [], // {id, profileId, colorId, learned, learnedAt, seen, discCorrect, discTotal}
  discRounds: [], // 存在 colorProgress 表? 不——单独按 record 存在 mixingRecords 同级：复用 records
  records: {
    mixing: [],
    matching: [],
    coloring: [],
    diary: [],
  },

  async loadFor(profileId) {
    const [colorProgress, mixing, matching, coloring, diary] = await Promise.all([
      idbGetByProfile('colorProgress', profileId),
      idbGetByProfile('mixingRecords', profileId),
      idbGetByProfile('matchingWorks', profileId),
      idbGetByProfile('coloringWorks', profileId),
      idbGetByProfile('observationLogs', profileId),
    ]);
    // 补齐 12 色的进度行
    const map = new Map(colorProgress.map((r) => [r.colorId, r]));
    for (const c of BASE_COLORS) {
      if (!map.has(c.id)) {
        map.set(c.id, {
          id: uid('cp_'),
          profileId,
          colorId: c.id,
          learned: false,
          learnedAt: null,
          seen: false,
          discCorrect: 0,
          discTotal: 0,
        });
      }
    }
    set({
      profileId,
      colorProgress: [...map.values()],
      records: {
        mixing: mixing.sort((a, b) => b.createdAt - a.createdAt),
        matching: matching.sort((a, b) => b.createdAt - a.createdAt),
        coloring: coloring.sort((a, b) => b.createdAt - a.createdAt),
        diary: diary.sort((a, b) => b.createdAt - a.createdAt),
      },
    });
  },

  resetForCurrent() {
    set({ profileId: null, colorProgress: [], records: { mixing: [], matching: [], coloring: [], diary: [] } });
  },

  async _ensureColorRow(colorId) {
    const pid = get().profileId;
    let row = get().colorProgress.find((r) => r.colorId === colorId);
    if (row) return row;
    row = {
      id: uid('cp_'),
      profileId: pid,
      colorId,
      learned: false,
      learnedAt: null,
      seen: false,
      discCorrect: 0,
      discTotal: 0,
    };
    await idbPut('colorProgress', row);
    set((s) => ({ colorProgress: [...s.colorProgress, row] }));
    return row;
  },

  // 学完一张认色卡
  async markColorLearned(colorId) {
    const pid = get().profileId;
    const row = await get()._ensureColorRow(colorId);
    let awardedStars = 0;
    if (!row.learned) {
      const next = { ...row, learned: true, learnedAt: Date.now(), seen: true };
      await idbPut('colorProgress', next);
      set((s) => ({
        colorProgress: s.colorProgress.map((r) => (r.id === next.id ? next : r)),
      }));
      awardedStars = 1;
      await useAppStore.getState().addStars(pid, 1);
      sfx.star();
    }
    await get()._syncAchievements();
    return awardedStars;
  },

  async markColorSeen(colorId) {
    const row = await get()._ensureColorRow(colorId);
    if (!row.seen) {
      const next = { ...row, seen: true };
      await idbPut('colorProgress', next);
      set((s) => ({
        colorProgress: s.colorProgress.map((r) => (r.id === next.id ? next : r)),
      }));
    }
  },

  // 完成一轮辨色游戏
  // perColor: { [colorId]: { correct, total } }
  async recordDiscriminateRound({ correct, total, hardMode, perColor }) {
    const pid = get().profileId;
    const rows = [...get().colorProgress];
    const wrongColorIds = {};
    for (let i = 0; i < rows.length; i++) {
      const pc = perColor?.[rows[i].colorId];
      if (!pc || !pc.total) continue;
      const nr = {
        ...rows[i],
        discCorrect: (rows[i].discCorrect || 0) + pc.correct,
        discTotal: (rows[i].discTotal || 0) + pc.total,
      };
      const wrong = pc.total - pc.correct;
      if (wrong > 0) wrongColorIds[rows[i].colorId] = wrong;
      await idbPut('colorProgress', nr);
      rows[i] = nr;
    }
    const rec = {
      id: uid('dr_'),
      profileId: pid,
      kind: 'discriminate',
      correct,
      total,
      hardMode: !!hardMode,
      wrongColorIds,
      createdAt: Date.now(),
    };
    // 辨色轮次与调色记录共用练习记录表，用 kind 区分
    await idbPut('mixingRecords', rec);
    set((s) => ({
      colorProgress: rows,
      records: { ...s.records, mixing: [rec, ...s.records.mixing] },
    }));
    const rate = total ? correct / total : 0;
    let stars = 0;
    if (rate >= 1) stars = 2;
    else if (rate >= 0.8) stars = 1;
    if (stars > 0) await useAppStore.getState().addStars(pid, stars);
    await get()._syncAchievements();
    return stars;
  },

  async saveMixingRecord({ drops, resultHex, targetHex, deltaE, recipe, passed }) {
    const pid = get().profileId;
    const rec = {
      id: uid('mx_'),
      profileId: pid,
      kind: 'mixing',
      drops,
      resultHex,
      targetHex: targetHex || null,
      deltaE: deltaE == null ? null : Math.round(deltaE * 10) / 10,
      recipe,
      passed: !!passed,
      createdAt: Date.now(),
    };
    await idbPut('mixingRecords', rec);
    set((s) => ({ records: { ...s.records, mixing: [rec, ...s.records.mixing] } }));
    await useAppStore.getState().addStars(pid, 1);
    sfx.star();
    await get()._syncAchievements();
    return rec;
  },

  async saveMatchingWork({ exerciseId, exerciseOrder, title, rule, colors, previewDataUrl }) {
    const pid = get().profileId;
    const rec = {
      id: uid('mw_'),
      profileId: pid,
      exerciseId,
      exerciseOrder,
      title,
      rule: rule || null,
      colors,
      previewDataUrl: previewDataUrl || null,
      createdAt: Date.now(),
    };
    await idbPut('matchingWorks', rec);
    set((s) => ({ records: { ...s.records, matching: [rec, ...s.records.matching] } }));
    await useAppStore.getState().addStars(pid, 1);
    sfx.star();
    await get()._syncAchievements();
    return rec;
  },

  async saveColoringWork({ taskId, scene, title, emotion, fills, dataUrl, note }) {
    const pid = get().profileId;
    const rec = {
      id: uid('cw_'),
      profileId: pid,
      taskId,
      scene,
      title,
      emotion,
      fills,
      dataUrl,
      note: note || '',
      createdAt: Date.now(),
    };
    await idbPut('coloringWorks', rec);
    set((s) => ({ records: { ...s.records, coloring: [rec, ...s.records.coloring] } }));
    await useAppStore.getState().addStars(pid, 1);
    sfx.star();
    await get()._syncAchievements();
    return rec;
  },

  async addDiary({ text, drawing, photo, colorTags }) {
    const pid = get().profileId;
    const rec = {
      id: uid('ol_'),
      profileId: pid,
      text: text || '',
      drawing: drawing || null,
      photo: photo || null,
      colorTags: colorTags || [],
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    };
    await idbPut('observationLogs', rec);
    set((s) => ({ records: { ...s.records, diary: [rec, ...s.records.diary] } }));
    await useAppStore.getState().addStars(pid, 1);
    sfx.star();
    await get()._syncAchievements();
    return rec;
  },

  async deleteRecord(kind, id) {
    const table = {
      mixing: 'mixingRecords',
      matching: 'matchingWorks',
      coloring: 'coloringWorks',
      diary: 'observationLogs',
    }[kind];
    if (!table) return;
    await idbDelete(table, id);
    set((s) => ({
      records: { ...s.records, [kind]: s.records[kind].filter((r) => r.id !== id) },
    }));
  },

  metrics() {
    const { colorProgress, records } = get();
    const colorsLearned = colorProgress.filter((r) => r.learned).length;
    const rounds = records.mixing.filter((r) => r.kind === 'discriminate');
    const totalQ = rounds.reduce((a, r) => a + r.total, 0);
    const totalCorrect = rounds.reduce((a, r) => a + r.correct, 0);
    const discriminateRate = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
    return {
      colorsLearned,
      discriminateRate,
      mixingCount: records.mixing.filter((r) => r.kind !== 'discriminate').length,
      matchingCount: records.matching.length,
      diaryCount: records.diary.length,
      coloringCount: records.coloring.length,
    };
  },

  // 易错色：从辨色轮次里统计被选错次数
  errorColors() {
    const tally = {};
    for (const r of get().records.mixing) {
      if (r.kind !== 'discriminate' || !r.wrongColorIds) continue;
      for (const [id, n] of Object.entries(r.wrongColorIds)) {
        tally[id] = (tally[id] || 0) + n;
      }
    }
    return Object.entries(tally)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  },

  async _syncAchievements() {
    const pid = get().profileId;
    if (!pid) return;
    await useAppStore.getState().checkAchievements(pid, get().metrics());
  },
}));
