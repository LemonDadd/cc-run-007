import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { useProgressStore } from '../store/progressStore.js';
import ModuleCard from '../components/ModuleCard.jsx';
import { BASE_COLORS } from '../data/colors.js';

const MODULES = [
  { to: '/colors', icon: '🃏', title: '认色卡', subtitle: '认识 12 种颜色', color: '#FF8A1E' },
  { to: '/game/discriminate', icon: '🔍', title: '辨色游戏', subtitle: '找出指定颜色', color: '#2E7BE6' },
  { to: '/lab', icon: '🧪', title: '调色实验室', subtitle: '调出神奇颜色', color: '#8A4FD0' },
  { to: '/match', icon: '🎀', title: '配色练习', subtitle: '学习搭配规则', color: '#E8384A' },
  { to: '/color-in', icon: '🖍️', title: '情境用色', subtitle: '用颜色说心情', color: '#3CB54A' },
  { to: '/diary', icon: '📔', title: '观察日记', subtitle: '记录生活色彩', color: '#1FB8B0' },
];

export default function Home() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.currentProfile());
  const metrics = useProgressStore((s) => s.metrics());
  const colorProgress = useProgressStore((s) => s.colorProgress);
  const learnedMap = new Map(colorProgress.map((r) => [r.colorId, r.learned]));

  return (
    <div className="mx-auto max-w-6xl px-6 pb-14">
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <h1 className="font-cname text-slate-700" style={{ fontSize: 44 }}>
            你好，{profile?.avatar} {profile?.nickname}！
          </h1>
          <p className="font-body text-slate-500">今天想玩哪个色彩游戏？</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/gallery')}
            className="pressable card-kid flex min-h-[80px] min-w-[80px] flex-col items-center justify-center px-6 py-3"
          >
            <span className="text-4xl">🖼️</span>
            <span className="font-body text-2xl">我的作品</span>
          </button>
          <button
            onClick={() => navigate('/reward')}
            className="pressable card-kid flex min-h-[80px] min-w-[80px] flex-col items-center justify-center px-6 py-3"
          >
            <span className="text-4xl">🏅</span>
            <span className="font-body text-2xl">奖励</span>
          </button>
          <button
            onClick={() => navigate('/parent')}
            className="pressable card-kid flex min-h-[80px] min-w-[80px] flex-col items-center justify-center px-6 py-3"
          >
            <span className="text-4xl">👪</span>
            <span className="font-body text-2xl">家长</span>
          </button>
        </div>
      </div>

      {/* 12 色学习进度条 */}
      <div className="card-kid mb-8 flex flex-wrap items-center gap-3 p-5">
        <span className="font-body font-bold text-slate-600">
          认色进度 {metrics.colorsLearned}/12
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {BASE_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/color/${c.id}`)}
              title={c.name}
              className="pressable h-20 w-20 rounded-full shadow-soft"
              style={{
                backgroundColor: c.hex,
                opacity: learnedMap.get(c.id) ? 1 : 0.28,
                outline: learnedMap.get(c.id) ? '3px solid #ffffff' : '3px dashed #c7c2dd',
              }}
            />
          ))}
        </div>
        <span className="font-body text-amber-500">⭐ {profile?.stars ?? 0}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.to}
            {...m}
            onClick={() => navigate(m.to)}
            done={
              m.to === '/colors'
                ? `${metrics.colorsLearned}/12 色`
                : m.to === '/match'
                ? `${metrics.matchingCount} 幅`
                : m.to === '/color-in'
                ? `${metrics.coloringCount} 幅`
                : m.to === '/diary'
                ? `${metrics.diaryCount} 篇`
                : m.to === '/lab'
                ? `${metrics.mixingCount} 次`
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
