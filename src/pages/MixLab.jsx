import { useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import { PAINT_POTS } from '../data/colors.js';
import { mixPigments, recipeText, EMPTY_DROPS, MIX_RULES } from '../lib/mixEngine.js';
import { deltaEHex } from '../lib/colorMath.js';
import { useProgressStore } from '../store/progressStore.js';
import { sfx, speak } from '../lib/audio.js';

// 目标色挑战（12 目标，覆盖各种色相）
const TARGETS = [
  { name: '橙色', hex: '#FF8A1E' },
  { name: '绿色', hex: '#3CB54A' },
  { name: '紫色', hex: '#8A4FD0' },
  { name: '粉色', hex: '#F0A0AA' },
  { name: '浅蓝', hex: '#A8C3EE' },
  { name: '深红', hex: '#C33443' },
  { name: '深蓝', hex: '#2D69C2' },
  { name: '棕色', hex: '#8A6A44' },
  { name: '灰色', hex: '#B8B5B0' },
  { name: '橘红', hex: '#F46B39' },
  { name: '黄绿', hex: '#A2C041' },
  { name: '蓝紫', hex: '#7560D8' },
];

function grade(dE) {
  if (dE <= 8) return { text: '一模一样！你是调色大师！', emoji: '🏆', pass: true };
  if (dE <= 16) return { text: '非常接近啦，眼睛真厉害！', emoji: '🌟', pass: true };
  if (dE <= 28) return { text: '有一点点像了，再加一滴试试？', emoji: '👍', pass: true };
  return { text: '颜色还不太一样，大胆再加一点颜料吧！', emoji: '🎨', pass: false };
}

export default function MixLab() {
  const [drops, setDrops] = useState({ ...EMPTY_DROPS });
  const [target, setTarget] = useState(() => TARGETS[Math.floor(Math.random() * TARGETS.length)]);
  const [showResult, setShowResult] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const saveMixingRecord = useProgressStore((s) => s.saveMixingRecord);
  const records = useProgressStore((s) => s.records.mixing.filter((r) => r.kind === 'mixing'));
  const canvasRef = useRef(null);
  const dragIdRef = useRef(null);

  const mixedHex = useMemo(() => mixPigments(drops), [drops]);
  const hasPaint = mixedHex != null;
  const dE = hasPaint && target ? deltaEHex(mixedHex, target.hex) : null;

  // Canvas 实时绘制混合结果（真实像素绘制，不是贴图）
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);
    if (!hasPaint) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8d2ee';
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#a9a1c7';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('把颜料拖到调色盘里', w / 2, h / 2 + 10);
      return;
    }
    // 颜料池主体（径向渐变模拟湿润颜料）
    const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 20, w / 2, h / 2, w * 0.42);
    g.addColorStop(0, mixedHex);
    g.addColorStop(1, mixedHex + 'ee');
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    // 高光
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 0.32, w * 0.12, h * 0.07, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
  }, [mixedHex, hasPaint]);

  const addDrop = (id, n = 1) => {
    sfx.drop();
    setDrops((d) => ({ ...d, [id]: Math.min(9, d[id] + n) }));
    setShowResult(null);
  };

  const onDragStart = (id) => (e) => {
    dragIdRef.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDropToCanvas = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragIdRef.current;
    if (id) addDrop(id);
    dragIdRef.current = null;
  };

  const checkColor = async () => {
    if (!hasPaint) return;
    const g = grade(dE);
    setShowResult(g);
    speak(g.text);
    const name = g.pass ? target.name : null;
    await saveMixingRecord({
      drops,
      resultHex: mixedHex,
      targetHex: target.hex,
      deltaE: dE,
      recipe: recipeText(drops, name),
      passed: g.pass,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const nextTarget = () => {
    let t = target;
    while (t.hex === target.hex) t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    setTarget(t);
    setDrops({ ...EMPTY_DROPS });
    setShowResult(null);
    speak(`这次我们来调${t.name}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="调色实验室" />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        {/* 左：Canvas 调色盘 */}
        <div className="card-kid flex flex-col items-center p-6">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-body text-slate-500">目标色</span>
              <div
                className="h-16 w-16 rounded-2xl shadow-soft"
                style={{ backgroundColor: target.hex }}
              />
              <span className="font-cname" style={{ fontSize: 32 }}>
                {target.name}
              </span>
              <button onClick={() => speak(target.name)} className="text-3xl">
                🔊
              </button>
            </div>
            <KidButton variant="ghost" onClick={nextTarget}>
              换个目标 🎲
            </KidButton>
          </div>

          <div
            className="relative mt-4 w-full max-w-[460px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropToCanvas}
          >
            <canvas ref={canvasRef} width={460} height={460} className="w-full" />
            {savedFlash && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="animate-pop rounded-full bg-green-500 px-8 py-4 font-btn text-white shadow-pop">
                  配方已保存 ⭐
                </div>
              </div>
            )}
          </div>

          {showResult && (
            <div className="animate-pop mt-4 w-full max-w-[460px] rounded-3xl bg-amber-50 p-5 text-center">
              <div className="text-5xl">{showResult.emoji}</div>
              <div className="mt-1 font-btn text-slate-700">{showResult.text}</div>
              <div className="mt-1 font-body text-slate-500">
                色差 ΔE = {dE.toFixed(1)}（越小越接近）
              </div>
              <div className="mt-2 font-body text-purple-500">{recipeText(drops, target.name)}</div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <KidButton variant="ghost" onClick={() => { setDrops({ ...EMPTY_DROPS }); setShowResult(null); sfx.click(); }}>
              🫗 清空重来
            </KidButton>
            <KidButton variant="purple" data-testid="mix-check" disabled={!hasPaint} onClick={checkColor}>
              🔍 看看像不像
            </KidButton>
          </div>
        </div>

        {/* 右：颜料瓶 + 配方 */}
        <div className="flex flex-col gap-5">
          <div className="card-kid p-6">
            <h3 className="font-cname text-slate-600" style={{ fontSize: 30 }}>
              五种颜料
            </h3>
            <p className="mt-1 font-body text-slate-500">拖到调色盘里，或者点一下加一滴</p>
            <div className="mt-4 space-y-3">
              {PAINT_POTS.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div
                    data-paint={p.id}
                    draggable
                    onDragStart={onDragStart(p.id)}
                    onClick={() => addDrop(p.id)}
                    className="pressable flex h-20 w-20 cursor-grab items-center justify-center rounded-3xl text-4xl shadow-soft active:cursor-grabbing"
                    style={{ backgroundColor: p.hex }}
                  >
                    🎨
                  </div>
                  <div className="flex-1">
                    <div className="font-btn text-slate-600">{p.name}</div>
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        onClick={() => setDrops((d) => ({ ...d, [p.id]: Math.max(0, d[p.id] - 1) }))}
                        className="pressable flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl"
                      >
                        －
                      </button>
                      <span className="w-10 text-center font-cname text-purple-500">
                        {drops[p.id]}
                      </span>
                      <button
                        onClick={() => addDrop(p.id)}
                        className="pressable flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-kid p-6">
            <h3 className="font-btn text-slate-600">📜 我的调色配方</h3>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto no-scrollbar">
              {records.length === 0 && (
                <p className="font-body text-slate-400">还没有配方，快去调出第一个颜色吧！</p>
              )}
              {records.slice(0, 12).map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2 pr-4">
                  <span className="h-10 w-10 rounded-xl shadow-inner" style={{ backgroundColor: r.resultHex }} />
                  <span className="flex-1 font-body text-slate-600">{r.recipe}</span>
                  {r.deltaE != null && (
                    <span className={r.passed ? 'font-body text-green-500' : 'font-body text-slate-400'}>
                      ΔE {r.deltaE}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <details className="card-kid p-6">
            <summary className="cursor-pointer font-btn text-slate-600">💡 20 个调色小秘方</summary>
            <div className="mt-3 grid gap-2">
              {MIX_RULES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setDrops({ ...r.drops });
                    setShowResult(null);
                    sfx.drop();
                  }}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2 text-left"
                >
                  <span className="h-9 w-9 shrink-0 rounded-xl" style={{ backgroundColor: mixPigments(r.drops) }} />
                  <span className="font-body text-slate-600">{r.label}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
