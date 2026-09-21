import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import { useAppStore } from '../store/appStore.js';
import { useProgressStore } from '../store/progressStore.js';
import { BASE_COLORS, colorById } from '../data/colors.js';
import {
  idbGetByProfile,
  idbDelete,
  exportProfile,
  importProfile,
  exportAll,
  importAll,
  deleteProfileFully,
} from '../lib/db.js';
import { downloadJson, formatDate, formatTime } from '../lib/util.js';
import { sfx, speak, setMuted } from '../lib/audio.js';

const CHILD_STORES = [
  'colorProgress',
  'mixingRecords',
  'matchingWorks',
  'coloringWorks',
  'observationLogs',
  'achievements',
  'unlockedStickers',
];

// ---------------- PIN 门禁 --------------------
function PinGate({ onSuccess }) {
  const verifyPin = useAppStore((s) => s.verifyPin);
  const isDefault = useAppStore((s) => s.settings.isDefaultPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const tap = async (d) => {
    sfx.click();
    setError('');
    const next = (pin + String(d)).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const ok = await verifyPin(next);
      if (ok) {
        sfx.correct();
        onSuccess();
      } else {
        sfx.gentle();
        setError('密码不对哦，再试一次');
        setShakeKey((k) => k + 1);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6">
      <div key={shakeKey} className={`card-kid w-full p-8 ${error ? 'shake' : ''}`}>
        <div className="text-center">
          <div className="text-7xl">👪</div>
          <h2 className="mt-3 font-cname text-slate-700" style={{ fontSize: 36 }}>
            家长面板
          </h2>
          <p className="mt-2 font-body text-slate-500">请输入 4 位家长密码</p>
          {isDefault && (
            <p className="mt-3 rounded-2xl bg-amber-50 p-3 font-body text-amber-600">
              ⚠️ 当前是默认密码 0000，进入后请尽快修改
            </p>
          )}
          {error && <p className="mt-3 font-body text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-2xl bg-slate-100"
              style={{ height: 72, width: 72 }}
            >
              <span className="text-5xl text-slate-600">{pin[i] ? '●' : ''}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              data-digit={d}
              onClick={() => tap(d)}
              className="pressable flex h-20 items-center justify-center rounded-3xl bg-white text-4xl font-bold text-slate-700 shadow-soft"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => {
              setPin('');
              setError('');
            }}
            className="pressable flex h-20 items-center justify-center rounded-3xl bg-slate-100 text-xl text-slate-500"
          >
            清除
          </button>
          <button
            data-digit="0"
            onClick={() => tap(0)}
            className="pressable flex h-20 items-center justify-center rounded-3xl bg-white text-4xl font-bold text-slate-700 shadow-soft"
          >
            0
          </button>
          <div />
        </div>
        <p className="mt-5 text-center font-body text-slate-400">密码错误无法进入，也无法修改任何设置</p>
      </div>
    </div>
  );
}

// ---------------- 面板内容 --------------------
function PanelBody() {
  const navigate = useNavigate();
  const { profiles, settings, saveSettings, changePin, updateProfile } = useAppStore();
  const selectProfile = useAppStore((s) => s.selectProfile);
  const currentProfileId = useAppStore((s) => s.currentProfileId);
  const progress = useProgressStore();
  const [pid, setPid] = useState(currentProfileId || profiles[0]?.id);
  const [tab, setTab] = useState('overview');
  const [confirm, setConfirm] = useState(null);
  const [pinChange, setPinChange] = useState(null);

  const profile = profiles.find((p) => p.id === pid);
  const isCurrent = pid === currentProfileId;
  const cpRows = isCurrent
    ? progress.colorProgress
    : []; // 非当前玩家按需查询（见 effect）
  const [otherRows, setOtherRows] = useState(null);
  const [otherRecords, setOtherRecords] = useState(null);

  useEffect(() => {
    if (isCurrent) {
      setOtherRows(null);
      setOtherRecords(null);
      return;
    }
    let alive = true;
    (async () => {
      const [c, mx, mw, cw, ol, ach] = await Promise.all([
        idbGetByProfile('colorProgress', pid),
        idbGetByProfile('mixingRecords', pid),
        idbGetByProfile('matchingWorks', pid),
        idbGetByProfile('coloringWorks', pid),
        idbGetByProfile('observationLogs', pid),
        idbGetByProfile('achievements', pid),
      ]);
      if (!alive) return;
      setOtherRows(c);
      setOtherRecords({ mixing: mx, matching: mw, coloring: cw, diary: ol, achievements: ach });
    })();
    return () => {
      alive = false;
    };
  }, [pid, isCurrent]);

  const colorRows = isCurrent ? cpRows : otherRows || [];
  const recs = isCurrent
    ? progress.records
    : otherRecords || { mixing: [], matching: [], coloring: [], diary: [] };

  const rounds = recs.mixing?.filter((r) => r.kind === 'discriminate') || [];
  const totalQ = rounds.reduce((a, r) => a + r.total, 0);
  const totalCorrect = rounds.reduce((a, r) => a + r.correct, 0);
  const rate = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  // 易错色
  const errorTally = {};
  for (const r of rounds) {
    for (const [id, n] of Object.entries(r.wrongColorIds || {})) {
      errorTally[id] = (errorTally[id] || 0) + n;
    }
  }
  const errorColors = Object.entries(errorTally)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const learnedCount = colorRows.filter((r) => r.learned).length;
  const mixingList = recs.mixing?.filter((r) => r.kind === 'mixing') || [];

  const doReset = async () => {
    for (const store of CHILD_STORES) {
      const rows = await idbGetByProfile(store, pid);
      for (const r of rows) await idbDelete(store, r.id);
    }
    await updateProfile(pid, { stars: 0, totalSeconds: 0 });
    if (isCurrent) await progress.loadFor(pid);
    setConfirm(null);
    sfx.correct();
  };

  const doExport = async () => {
    const data = await exportProfile(pid);
    downloadJson(`colokid-${profile.nickname}-${Date.now()}.json`, data);
  };
  const doImport = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importProfile(data, pid);
      if (isCurrent) await progress.loadFor(pid);
      setConfirm({ ok: '导入成功！' });
    } catch (e) {
      setConfirm({ err: '导入失败：' + e.message });
    }
  };
  const doBackupAll = async () => {
    downloadJson(`colokid-全部备份-${Date.now()}.json`, await exportAll());
  };
  const doRestoreAll = async (file) => {
    try {
      await importAll(JSON.parse(await file.text()));
      location.reload();
    } catch (e) {
      setConfirm({ err: '恢复失败：' + e.message });
    }
  };

  const TABS = [
    ['overview', '📊 学习总览'],
    ['records', '🧪 调色记录'],
    ['works', '🖼️ 作品与日记'],
    ['settings', '⚙️ 设置'],
  ];

  return (
    <div>
      <AppHeader title="家长面板" />
      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* 孩子切换 */}
        <div className="card-kid flex flex-wrap items-center gap-3 p-4">
          <span className="font-body text-slate-500">查看哪个孩子：</span>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setPid(p.id)}
              className={`pressable rounded-full px-5 py-2 font-body ${
                pid === p.id ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {p.avatar} {p.nickname}
            </button>
          ))}
          {profiles.length === 0 && (
            <button onClick={() => navigate('/')} className="font-body text-purple-500 underline">
              先去创建一个玩家 →
            </button>
          )}
          <button
            onClick={() => {
              if (pid) selectProfile(pid);
              navigate('/home');
            }}
            className="ml-auto pressable rounded-full bg-sky-50 px-5 py-2 font-body text-sky-600"
          >
            以这个孩子身份进入 →
          </button>
        </div>

        {profile && (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {TABS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`pressable shrink-0 rounded-full px-6 py-2.5 font-body ${
                    tab === k ? 'bg-purple-500 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="mt-5 space-y-5">
                <div className="card-kid grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                  <Stat label="认色进度" value={`${learnedCount}/12`} />
                  <Stat label="辨色正确率" value={`${rate}%`} sub={`${totalCorrect}/${totalQ} 题`} />
                  <Stat label="累计星星" value={profile.stars ?? 0} />
                  <Stat label="学习时长" value={`${Math.round((profile.totalSeconds || 0) / 60)} 分钟`} />
                </div>

                <div className="card-kid p-6">
                  <h3 className="font-btn text-slate-700">🎨 认色与各色辨色情况</h3>
                  <div className="mt-4 grid gap-2">
                    {BASE_COLORS.map((c) => {
                      const row = colorRows.find((r) => r.colorId === c.id);
                      const dr = row?.discTotal
                        ? Math.round((row.discCorrect / row.discTotal) * 100)
                        : null;
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-xl shadow" style={{ backgroundColor: c.hex }} />
                          <span className="w-16 font-body text-slate-600">{c.name}</span>
                          <span className={`font-body ${row?.learned ? 'text-green-500' : 'text-slate-400'}`}>
                            {row?.learned ? '✓ 已学完' : '未学完'}
                          </span>
                          <span className="ml-auto font-body text-slate-500">
                            {dr == null ? '还没辨过' : `辨色正确率 ${dr}%（${row.discCorrect}/${row.discTotal}）`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card-kid p-6">
                  <h3 className="font-btn text-slate-700">🔍 易错色 TOP5</h3>
                  {errorColors.length === 0 ? (
                    <p className="mt-3 font-body text-slate-400">还没有错题数据，和孩子玩几轮辨色游戏吧。</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {errorColors.map((e) => (
                        <span
                          key={e.id}
                          className="flex items-center gap-2 rounded-full bg-red-50 py-1.5 pl-2 pr-4 font-body text-red-500"
                        >
                          <span className="h-6 w-6 rounded-full" style={{ backgroundColor: colorById[e.id]?.hex }} />
                          {colorById[e.id]?.name} × {e.count} 次
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 font-body text-slate-500">
                    亲子对话建议：从易错色出发，问问孩子“它和旁边颜色哪里不一样？”
                  </p>
                </div>
              </div>
            )}

            {tab === 'records' && (
              <div className="card-kid mt-5 p-6">
                <h3 className="font-btn text-slate-700">🧪 调色配方记录（{mixingList.length}）</h3>
                <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
                  {mixingList.length === 0 && (
                    <p className="font-body text-slate-400">还没有调色记录。</p>
                  )}
                  {mixingList.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="h-10 w-10 rounded-xl" style={{ backgroundColor: r.resultHex }} />
                      <span className="flex-1 font-body text-slate-600">{r.recipe}</span>
                      {r.targetHex && (
                        <span className="flex items-center gap-1 font-body text-slate-400">
                          目标
                          <span className="h-6 w-6 rounded-md" style={{ backgroundColor: r.targetHex }} />
                        </span>
                      )}
                      {r.deltaE != null && (
                        <span className={r.passed ? 'font-body text-green-500' : 'font-body text-slate-400'}>
                          ΔE {r.deltaE}
                        </span>
                      )}
                      <span className="font-body text-slate-400">{formatTime(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'works' && (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <WorkList title={`🎀 配色作品（${recs.matching?.length || 0}）`} rows={recs.matching} imgKey="previewDataUrl" />
                <WorkList title={`🖍️ 情境作品（${recs.coloring?.length || 0}）`} rows={recs.coloring} imgKey="dataUrl" note />
                <div className="card-kid p-6 lg:col-span-2">
                  <h3 className="font-btn text-slate-700">📔 色彩观察日记（{recs.diary?.length || 0}）</h3>
                  <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                    {(recs.diary || []).length === 0 && (
                      <p className="font-body text-slate-400">还没有日记。</p>
                    )}
                    {(recs.diary || []).map((d) => (
                      <div key={d.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                        {d.photo && <img src={d.photo} className="h-20 w-20 rounded-xl object-cover" />}
                        {d.drawing && <img src={d.drawing} className="h-20 w-20 rounded-xl object-cover" />}
                        <div>
                          <div className="font-body text-slate-600">{d.text || '（只有图画）'}</div>
                          <div className="font-body text-slate-400">{formatDate(d.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="mt-5 space-y-5">
                <div className="card-kid p-6">
                  <h3 className="font-btn text-slate-700">📅 每日练习量</h3>
                  <p className="mt-1 font-body text-slate-500">辨色游戏每轮题数，默认 5 题（3–10 题）</p>
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => saveSettings({ dailyQuestions: Math.max(3, settings.dailyQuestions - 1) })}
                      className="pressable h-16 w-16 rounded-2xl bg-slate-100 text-4xl"
                    >
                      －
                    </button>
                    <span className="w-20 text-center font-cname text-purple-500" style={{ fontSize: 48 }}>
                      {settings.dailyQuestions}
                    </span>
                    <button
                      onClick={() => saveSettings({ dailyQuestions: Math.min(10, settings.dailyQuestions + 1) })}
                      className="pressable h-16 w-16 rounded-2xl bg-slate-100 text-4xl"
                    >
                      ＋
                    </button>
                    <span className="font-body text-slate-500">题 / 轮</span>
                  </div>
                  <label className="mt-5 flex cursor-pointer items-center gap-3 font-body text-slate-600">
                    <input
                      type="checkbox"
                      checked={settings.soundOn}
                      onChange={(e) => saveSettings({ soundOn: e.target.checked })}
                      className="h-7 w-7"
                    />
                    音效与语音（关闭后静音，游戏仍可正常玩）
                  </label>
                </div>

                <div className="card-kid p-6">
                  <h3 className="font-btn text-slate-700">🔑 修改家长密码</h3>
                  {settings.isDefaultPin && (
                    <p className="mt-1 font-body text-amber-600">当前是默认密码 0000，建议立即修改。</p>
                  )}
                  {pinChange ? (
                    <PinChange
                      onDone={async (np) => {
                        await changePin(np);
                        setPinChange(false);
                      }}
                      onCancel={() => setPinChange(false)}
                    />
                  ) : (
                    <KidButton variant="blue" className="mt-4" onClick={() => setPinChange(true)}>
                      修改 4 位密码
                    </KidButton>
                  )}
                </div>

                <div className="card-kid p-6">
                  <h3 className="font-btn text-slate-700">💾 数据备份</h3>
                  <p className="mt-1 font-body text-slate-500">数据都保存在本机浏览器 IndexedDB 中，可导出 JSON 备份。</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <KidButton variant="ghost" onClick={doExport}>
                      ⬇️ 导出这个孩子的数据
                    </KidButton>
                    <label className="btn-ghost cursor-pointer">
                      ⬆️ 导入到这个孩子
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && doImport(e.target.files[0])}
                      />
                    </label>
                    <KidButton variant="ghost" onClick={doBackupAll}>
                      ⬇️ 导出全部备份
                    </KidButton>
                    <label className="btn-ghost cursor-pointer">
                      ⬆️ 恢复全部备份
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setConfirm({ action: doRestoreAll, arg: e.target.files[0], text: '恢复全部备份会覆盖当前所有数据，确定吗？' });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="card-kid border-2 border-red-100 p-6">
                  <h3 className="font-btn text-red-400">⚠️ 危险操作</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <KidButton
                      variant="ghost"
                      className="!text-red-500"
                      onClick={() =>
                        setConfirm({
                          action: doReset,
                          text: `将清空「${profile.nickname}」的全部学习进度、星星、作品和日记，无法恢复。确定吗？`,
                        })
                      }
                    >
                      🔄 重置这个孩子的进度
                    </KidButton>
                    <KidButton
                      variant="ghost"
                      className="!text-red-500"
                      onClick={() =>
                        setConfirm({
                          action: async () => {
                            await deleteProfileFully(pid);
                            await useAppStore.getState().deleteProfile(pid);
                            navigate('/');
                          },
                          text: `将彻底删除玩家「${profile.nickname}」及其全部档案，确定吗？`,
                        })
                      }
                    >
                      🗑 删除这个档案
                    </KidButton>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-6">
          <div className="card-kid max-w-md p-8 text-center">
            {confirm.ok ? (
              <>
                <div className="text-6xl">✅</div>
                <p className="mt-4 font-btn text-green-600">{confirm.ok}</p>
                <KidButton className="mt-6 w-full" onClick={() => setConfirm(null)}>
                  好的
                </KidButton>
              </>
            ) : confirm.err ? (
              <>
                <div className="text-6xl">😵</div>
                <p className="mt-4 font-body text-red-500">{confirm.err}</p>
                <KidButton className="mt-6 w-full" onClick={() => setConfirm(null)}>
                  好的
                </KidButton>
              </>
            ) : (
              <>
                <div className="text-6xl">⚠️</div>
                <p className="mt-4 font-body text-slate-700">{confirm.text}</p>
                <div className="mt-6 flex gap-3">
                  <KidButton variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>
                    取消
                  </KidButton>
                  <KidButton
                    variant="primary"
                    className="flex-1 !from-red-400 !to-red-500"
                    onClick={async () => {
                      if (confirm.arg) await confirm.action(confirm.arg);
                      else await confirm.action();
                      setConfirm(null);
                    }}
                  >
                    确定
                  </KidButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 text-center">
      <div className="font-cname text-purple-500" style={{ fontSize: 38 }}>
        {value}
      </div>
      <div className="font-body text-slate-500">{label}</div>
      {sub && <div className="font-body text-slate-400">{sub}</div>}
    </div>
  );
}

function WorkList({ title, rows, imgKey, note }) {
  return (
    <div className="card-kid p-6">
      <h3 className="font-btn text-slate-700">{title}</h3>
      <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
        {(rows || []).length === 0 && <p className="font-body text-slate-400">还没有作品。</p>}
        {(rows || []).map((w) => (
          <div key={w.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2">
            {w[imgKey] ? (
              <img src={w[imgKey]} className="h-16 w-20 rounded-xl bg-white object-contain" />
            ) : (
              <div className="flex h-16 w-20 items-center justify-center gap-0.5 rounded-xl bg-white">
                {w.colors?.slice(0, 3).map((id, i) => (
                  <span key={i} className="h-8 w-6" style={{ backgroundColor: colorById[id]?.hex }} />
                ))}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-slate-600">{w.title}</div>
              {note && w.note && <div className="truncate font-body text-slate-400">“{w.note}”</div>}
              <div className="font-body text-slate-400">{formatDate(w.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PinChange({ onDone, onCancel }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!/^\d{4}$/.test(p1)) return setErr('请输入 4 位数字');
    if (p1 === '0000') return setErr('新密码不能还是默认的 0000 哦');
    if (p1 !== p2) return setErr('两次输入不一样');
    onDone(p1);
  };
  return (
    <div className="mt-4 space-y-3">
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={p1}
        onChange={(e) => setP1(e.target.value.replace(/\D/g, ''))}
        placeholder="输入新的 4 位密码"
        className="w-full rounded-2xl border-4 border-amber-200 px-5 py-3 text-2xl tracking-widest outline-none"
      />
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={p2}
        onChange={(e) => setP2(e.target.value.replace(/\D/g, ''))}
        placeholder="再输一次"
        className="w-full rounded-2xl border-4 border-amber-200 px-5 py-3 text-2xl tracking-widest outline-none"
      />
      {err && <p className="font-body text-red-400">{err}</p>}
      <div className="flex gap-3">
        <KidButton variant="ghost" onClick={onCancel}>
          取消
        </KidButton>
        <KidButton variant="blue" className="flex-1" onClick={submit}>
          保存新密码
        </KidButton>
      </div>
    </div>
  );
}

export default function ParentPanel() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinGate onSuccess={() => setUnlocked(true)} />;
  return <PanelBody />;
}
