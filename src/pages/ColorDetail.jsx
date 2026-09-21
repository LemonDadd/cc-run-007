import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import { BASE_COLORS } from '../data/colors.js';
import { lightnessSteps, saturationSteps, isLight } from '../lib/colorMath.js';
import { speak } from '../lib/audio.js';
import { useProgressStore } from '../store/progressStore.js';
import { sfx } from '../lib/audio.js';

export default function ColorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const index = Math.max(0, BASE_COLORS.findIndex((c) => c.id === id));
  const color = BASE_COLORS[index];
  const [saved, setSaved] = useState(false);
  const markColorLearned = useProgressStore((s) => s.markColorLearned);
  const markColorSeen = useProgressStore((s) => s.markColorSeen);
  const colorProgress = useProgressStore((s) => s.colorProgress);

  const lights = useMemo(() => lightnessSteps(color.hex, 9), [color.hex]);
  const sats = useMemo(() => saturationSteps(color.hex, 9), [color.hex]);
  const known = colorProgress.find((r) => r.colorId === color.id)?.learned;
  const light = isLight(color.hex);

  useEffect(() => {
    setSaved(false);
    markColorSeen(color.id);
    // 进入卡片自动朗读（不可用时静默降级）
    const t = setTimeout(() => speak(`${color.name}，${color.pinyin}。比如${color.examples[0]}的颜色。`), 350);
    return () => clearTimeout(t);
  }, [color.id]);

  const go = (delta) => {
    const next = BASE_COLORS[(index + delta + BASE_COLORS.length) % BASE_COLORS.length];
    navigate(`/color/${next.id}`);
  };

  const finish = async () => {
    const stars = await markColorLearned(color.id);
    if (stars > 0) setSaved(true);
    else setSaved(true);
    speak('我学会这个颜色啦！');
    sfx.correct();
  };

  return (
    <div>
      <AppHeader title="认色卡" />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-2">
        {/* 大色块：桌面端占左侧大半屏，移动端占首屏 60%+ */}
        <div
          className="relative flex min-h-[60vh] flex-col items-center justify-center gap-3 overflow-hidden rounded-[44px] shadow-kid lg:min-h-[62vh]"
          style={{
            background: `linear-gradient(165deg, ${color.hex}, ${color.hex}cc)`,
            color: light ? '#3b3550' : '#fff',
          }}
        >
          <span className="text-[130px] leading-none drop-shadow-lg">{color.emoji}</span>
          <span className="font-cname" style={{ fontSize: 72 }}>
            {color.name}
          </span>
          <span className="font-body text-2xl opacity-85">{color.pinyin}</span>
          <button
            onClick={() => speak(`${color.name}，${color.pinyin}`)}
            className="pressable mt-2 flex items-center gap-2 rounded-full bg-white/90 px-6 py-3 font-btn text-slate-700 shadow"
          >
            🔊 听一听
          </button>
          {known && (
            <span className="absolute right-5 top-5 rounded-full bg-white/90 px-4 py-2 font-body text-green-600">
              ✓ 已学会
            </span>
          )}
        </div>

        {/* 信息区 */}
        <div className="flex flex-col gap-5">
          <div className="card-kid p-6">
            <h2 className="font-cname text-slate-600" style={{ fontSize: 32 }}>
              生活里的{color.name}
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {color.examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => speak(ex)}
                  className="pressable rounded-3xl bg-amber-50 p-4 text-center"
                >
                  <div className="h-6 w-full rounded-full" style={{ backgroundColor: color.hex }} />
                  <div className="mt-3 font-body text-slate-700">{ex}</div>
                  <div className="font-body text-slate-400">🔊</div>
                </button>
              ))}
            </div>
            <p className="mt-4 font-body text-slate-500">
              它属于{color.neutral ? '中性色，和什么颜色都合得来' : color.warm ? '暖色，看起来暖暖的' : '冷色，看起来凉凉的'}。
            </p>
          </div>

          <div className="card-kid p-6">
            <h3 className="font-btn text-slate-600">明度渐变：从暗暗到亮亮</h3>
            <div className="mt-3 flex h-14 overflow-hidden rounded-2xl shadow-inner">
              {lights.map((h, i) => (
                <button
                  key={i}
                  onClick={() => speak(i < 4 ? '深' : i > 4 ? '浅' : '不深不浅')}
                  className="pressable flex-1"
                  style={{ backgroundColor: h }}
                />
              ))}
            </div>
          </div>

          <div className="card-kid p-6">
            <h3 className="font-btn text-slate-600">饱和度渐变：从灰灰到鲜艳</h3>
            <div className="mt-3 flex h-14 overflow-hidden rounded-2xl shadow-inner">
              {sats.map((h, i) => (
                <button key={i} className="pressable flex-1" style={{ backgroundColor: h }} />
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <KidButton variant="ghost" onClick={() => go(-1)}>
              ← 上一个
            </KidButton>
            <KidButton variant="green" data-testid="color-learned" className="flex-1" onClick={finish}>
              {saved ? '✓ 我学会啦' : '我学会啦 ⭐'}
            </KidButton>
            <KidButton variant="ghost" onClick={() => go(1)}>
              下一个 →
            </KidButton>
          </div>
        </div>
      </div>
    </div>
  );
}
