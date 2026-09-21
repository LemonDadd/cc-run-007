import AppHeader from '../components/AppHeader.jsx';
import { useAppStore } from '../store/appStore.js';
import { useProgressStore } from '../store/progressStore.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { STICKERS } from '../data/stickers.js';
import { speak } from '../lib/audio.js';

export default function Reward() {
  const profile = useAppStore((s) => s.currentProfile());
  const metrics = useProgressStore((s) => s.metrics());
  const records = useProgressStore((s) => s.records);

  const badgeUnlocked = (def) => metrics[def.metric] >= def.goal;
  const minutes = Math.round((profile?.totalSeconds || 0) / 60);

  // 每完成一类模块点亮一张贴纸（用星星数阶梯解锁，简单确定）
  const stickerUnlocked = (i) => (profile?.stars || 0) >= i * 3;

  return (
    <div>
      <AppHeader title="我的奖励" />
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* 星星 */}
        <div className="card-kid flex flex-wrap items-center justify-around gap-4 p-8">
          <div className="text-center">
            <div className="text-7xl">⭐</div>
            <div className="mt-2 font-cname text-amber-500" style={{ fontSize: 56 }}>
              {profile?.stars ?? 0}
            </div>
            <div className="font-body text-slate-500">颗星星</div>
          </div>
          <div className="h-24 w-px bg-slate-200" />
          <div className="space-y-2">
            <div className="font-body text-slate-600">🎨 认色：{metrics.colorsLearned}/12</div>
            <div className="font-body text-slate-600">🔍 辨色正确率：{metrics.discriminateRate}%</div>
            <div className="font-body text-slate-600">🧪 调色：{metrics.mixingCount} 次</div>
            <div className="font-body text-slate-600">🎀 配色作品：{metrics.matchingCount} 幅</div>
            <div className="font-body text-slate-600">🖍️ 情境作品：{metrics.coloringCount} 幅</div>
            <div className="font-body text-slate-600">📔 观察日记：{metrics.diaryCount} 篇</div>
            <div className="font-body text-slate-600">⏱️ 累计学习：{minutes} 分钟</div>
          </div>
        </div>

        {/* 徽章 */}
        <h2 className="mt-10 font-cname text-slate-600" style={{ fontSize: 34 }}>
          成就徽章
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = badgeUnlocked(a);
            const value = metrics[a.metric] || 0;
            const pct = Math.min(100, Math.round((value / a.goal) * 100));
            return (
              <button
                key={a.id}
                onClick={() => speak(got ? `${a.name}，${a.desc}` : `${a.name}，${a.desc}，再加油哦`)}
                className={`pressable card-kid relative overflow-hidden p-6 text-left ${
                  got ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-5xl"
                    style={{
                      background: got ? a.color + '22' : '#eeeaf7',
                      filter: got ? 'none' : 'grayscale(1)',
                      border: `5px solid ${got ? a.color : '#d9d3ee'}`,
                    }}
                  >
                    {got ? a.emoji : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="font-cname text-slate-700" style={{ fontSize: 28 }}>
                      {a.name}
                    </div>
                    <div className="font-body text-slate-500">{a.desc}</div>
                  </div>
                </div>
                <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: got ? a.color : '#c9c0e8' }}
                  />
                </div>
                <div className="mt-1 text-right font-body text-slate-500">
                  {value}
                  {a.suffix || ''} / {a.goal}
                  {a.suffix || ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* 贴纸墙 */}
        <h2 className="mt-10 font-cname text-slate-600" style={{ fontSize: 34 }}>
          贴纸墙（每 3 颗星解锁一张）
        </h2>
        <div className="card-kid mt-4 grid grid-cols-5 gap-4 p-6 sm:grid-cols-10">
          {STICKERS.map((s, i) => {
            const got = stickerUnlocked(i);
            return (
              <button
                key={s.id}
                onClick={() => got && speak(s.name)}
                title={got ? s.name : '还没解锁'}
                className="pressable flex aspect-square items-center justify-center rounded-3xl bg-amber-50 text-4xl"
                style={{ filter: got ? 'none' : 'grayscale(1) opacity(0.4)' }}
              >
                {got ? s.emoji : '🔒'}
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center font-body text-slate-400">
          最近调色 {records.mixing.filter((r) => r.kind === 'mixing').length} 次 · 最近作品{' '}
          {records.coloring.length + records.matching.length} 幅
        </p>
      </div>
    </div>
  );
}
