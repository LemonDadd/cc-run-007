import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { BASE_COLORS } from '../data/colors.js';
import { useProgressStore } from '../store/progressStore.js';
import { isLight } from '../lib/colorMath.js';

export default function ColorWall() {
  const navigate = useNavigate();
  const colorProgress = useProgressStore((s) => s.colorProgress);
  const learnedMap = new Map(colorProgress.map((r) => [r.colorId, r.learned]));
  const learned = colorProgress.filter((r) => r.learned).length;

  return (
    <div>
      <AppHeader title={`认色卡墙 ${learned}/12`} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-6 font-body text-slate-500">
          点一点任何一张卡片，跟着大声读出来吧！
        </p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {BASE_COLORS.map((c) => {
            const done = learnedMap.get(c.id);
            const light = isLight(c.hex);
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/color/${c.id}`)}
                className="pressable relative flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[36px] shadow-kid"
                style={{
                  background: `linear-gradient(160deg, ${c.hex}, ${c.hex}dd)`,
                  color: light ? '#3b3550' : '#fff',
                }}
              >
                <span className="text-7xl drop-shadow">{c.emoji}</span>
                <span className="font-cname" style={{ fontSize: 50 }}>
                  {c.name}
                </span>
                <span className="font-body opacity-80">{c.pinyin}</span>
                {done && (
                  <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl shadow">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
