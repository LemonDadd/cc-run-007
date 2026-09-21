import { useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import Feedback from '../components/Feedback.jsx';
import SceneArt, { SCENE_REGIONS } from '../components/SceneArt.jsx';
import { SCENE_TASKS, evaluateScene } from '../data/scenes.js';
import { BASE_COLORS } from '../data/colors.js';
import { useProgressStore } from '../store/progressStore.js';
import { sfx, speak } from '../lib/audio.js';
import { isLight } from '../lib/colorMath.js';

function serializeSvg(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const xml = new XMLSerializer().serializeToString(clone);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

export default function ColorIn() {
  const saveColoringWork = useProgressStore((s) => s.saveColoringWork);
  const works = useProgressStore((s) => s.records.coloring);
  const doneTaskIds = new Set(works.map((w) => w.taskId));

  const [taskId, setTaskId] = useState(null);
  const task = SCENE_TASKS.find((t) => t.id === taskId);
  const [fills, setFills] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [note, setNote] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const svgWrapRef = useRef(null);
  const dragColor = useRef(null);

  const openTask = (t) => {
    setTaskId(t.id);
    setFills({});
    setSelectedColor(null);
    setCheckResult(null);
    setNote(t.exampleText);
    speak(t.prompt);
  };

  const fillRegion = (rid, hex) => {
    setFills((f) => ({ ...f, [rid]: hex }));
    sfx.drop();
  };

  const checkFeelings = () => {
    // fills 存的是 hex，映射回 12 色 id 后再判定
    const hexToId = new Map(BASE_COLORS.map((c) => [c.hex.toLowerCase(), c.id]));
    const usedIds = [...new Set(Object.values(fills).map((h) => hexToId.get(h.toLowerCase())).filter(Boolean))];
    const r = evaluateScene(task.criterion, usedIds, BASE_COLORS);
    // 统计时按区域数算，让孩子感受到"这幅画里有几块暖色"
    const counts = { warm: 0, cool: 0, neutral: 0 };
    for (const h of Object.values(fills)) {
      const c = BASE_COLORS.find((x) => x.hex.toLowerCase() === h.toLowerCase());
      if (!c) continue;
      if (c.neutral) counts.neutral += 1;
      else if (c.warm) counts.warm += 1;
      else if (c.cool) counts.cool += 1;
    }
    r.warm = counts.warm;
    r.cool = counts.cool;
    r.neutral = counts.neutral;
    setCheckResult(r);
    if (r.ok) {
      sfx.correct();
      setFeedback({ type: 'correct', text: '颜色说出心情啦！', tts: r.explanation });
      speak(r.explanation);
    } else {
      sfx.gentle();
      setFeedback({ type: 'gentle', text: '再感受一下～', sub: r.explanation, tts: r.explanation });
    }
  };

  const save = async () => {
    const svg = svgWrapRef.current?.querySelector('svg');
    const dataUrl = svg ? serializeSvg(svg) : null;
    await saveColoringWork({
      taskId: task.id,
      scene: task.scene,
      title: task.title,
      emotion: task.emotion,
      fills,
      dataUrl,
      note,
    });
    setFeedback({ type: 'correct', text: '作品保存好啦 ⭐', tts: '作品保存好啦' });
    setTimeout(() => {
      setTaskId(null);
      setFeedback(null);
    }, 1000);
  };

  // ---------------- 任务列表 ----------------
  if (!task) {
    return (
      <div>
        <AppHeader title="情境用色" />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="mb-6 font-body text-slate-500">
            选一个情境，用颜色告诉大家画里的心情吧！已完成 {doneTaskIds.size}/30
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCENE_TASKS.map((t) => (
              <button
                key={t.id}
                data-task={t.id}
                onClick={() => openTask(t)}
                className="pressable card-kid relative flex items-center gap-4 p-5 text-left"
              >
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-4xl">
                  {t.emoji}
                </span>
                <span>
                  <span className="block font-cname text-slate-700" style={{ fontSize: 26 }}>
                    {t.title}
                  </span>
                  <span className="font-body text-teal-600">心情：{t.emotion}</span>
                </span>
                {doneTaskIds.has(t.id) && (
                  <span className="absolute right-3 top-3 text-2xl text-green-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const regions = SCENE_REGIONS[task.scene];
  const filledCount = Object.keys(fills).length;

  // ---------------- 上色工作区 ----------------
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title={task.title} />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_330px]">
        <div className="card-kid p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-teal-100 px-4 py-1.5 font-body text-teal-700">
              心情：{task.emotion}
            </span>
            <span className="font-body text-slate-500">
              已涂 {filledCount}/{regions.length} 个地方
            </span>
          </div>
          <h2 className="mt-3 font-cname text-slate-700" style={{ fontSize: 34 }}>
            {task.prompt}
          </h2>

          {/* 区域名称选择条：点名字选区域，再选颜色即可填色（避免小区域被遮挡难点） */}
          <div className="mt-3 flex flex-wrap gap-2">
            {regions.map((r) => (
              <button
                key={r.id}
                data-region-chip={r.id}
                onClick={() => {
                  if (selectedColor) {
                    fillRegion(r.id, selectedColor);
                  } else {
                    sfx.click();
                  }
                }}
                className="pressable flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-4 font-body text-slate-600 shadow-soft"
              >
                <span
                  className="h-6 w-6 rounded-full border border-slate-200"
                  style={{ backgroundColor: fills[r.id] || '#F1EEFB' }}
                />
                {r.name}
              </button>
            ))}
          </div>

          <div
            ref={svgWrapRef}
            className="mt-4 overflow-hidden rounded-[36px] bg-white shadow-soft"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              // 拖到哪一块区域，就涂哪一块；点在区域之外则忽略
              const hex = e.dataTransfer.getData('text/plain');
              const regionEl = e.target.closest?.('[data-region]');
              const rid = regionEl?.getAttribute('data-region');
              if (hex && rid && regions.some((r) => r.id === rid)) {
                fillRegion(rid, hex);
              }
            }}
          >
            <SceneArt
              scene={task.scene}
              fills={fills}
              onPickRegion={(rid) => {
                if (selectedColor) fillRegion(rid, selectedColor);
                else sfx.click();
              }}
              className="w-full"
            />
          </div>

          {checkResult && (
            <div
              className={`animate-pop mt-4 rounded-3xl p-5 font-body ${
                checkResult.ok ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'
              }`}
            >
              {checkResult.ok ? '✅ ' : '💡 '}
              {checkResult.explanation}
              <div className="mt-1 text-slate-500">
                这幅画里有 {checkResult.warm} 个暖色、{checkResult.cool} 个冷色
                {checkResult.neutral ? `、${checkResult.neutral} 个中性色` : ''}。
              </div>
            </div>
          )}
        </div>

        {/* 右侧：调色板与操作 */}
        <div className="flex flex-col gap-5">
          <div className="card-kid p-6">
            <h3 className="font-cname text-slate-600" style={{ fontSize: 28 }}>
              选颜色
            </h3>
            <p className="mt-1 font-body text-slate-500">点颜色再点画面，或拖到画上</p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {BASE_COLORS.map((c) => (
                <button
                  key={c.id}
                  data-color={c.id}
                  draggable
                  onDragStart={(e) => {
                    dragColor.current = c.hex;
                    e.dataTransfer.setData('text/plain', c.hex);
                  }}
                  onClick={() => {
                    setSelectedColor(selectedColor === c.hex ? null : c.hex);
                    sfx.click();
                  }}
                  className="pressable flex h-20 flex-col items-center justify-center rounded-2xl shadow-soft"
                  style={{
                    backgroundColor: c.hex,
                    color: isLight(c.hex) ? '#3b3550' : '#fff',
                    outline: selectedColor === c.hex ? '6px solid #FF8A1E' : 'none',
                  }}
                >
                  <span className="text-2xl">{c.emoji}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFills({})}
                className="rounded-full bg-slate-100 px-5 py-2 font-body text-slate-600 pressable"
              >
                🧽 全部擦掉
              </button>
              {regions.some((r) => fills[r.id]) && (
                <button
                  onClick={() => {
                    const last = Object.keys(fills).pop();
                    setFills((f) => {
                      const n = { ...f };
                      delete n[last];
                      return n;
                    });
                  }}
                  className="rounded-full bg-slate-100 px-5 py-2 font-body text-slate-600 pressable"
                >
                  ↩ 撤销一笔
                </button>
              )}
            </div>
          </div>

          <div className="card-kid p-6">
            <h3 className="font-btn text-slate-600">✍️ 我的一句话</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 60))}
              rows={3}
              className="mt-2 w-full rounded-2xl border-4 border-teal-200 p-4 text-xl outline-none focus:border-teal-400"
              placeholder="我给……配了……因为……"
            />
            <div className="mt-2 text-right font-body text-slate-400">{note.length}/60</div>
          </div>

          <div className="flex flex-col gap-3">
            <KidButton variant="blue" data-testid="colorin-check" onClick={checkFeelings}>
              💭 我的颜色说得对吗？
            </KidButton>
            <KidButton variant="green" data-testid="colorin-save" disabled={filledCount === 0} onClick={save}>
              💾 保存作品 ⭐
            </KidButton>
            <KidButton variant="ghost" onClick={() => setTaskId(null)}>
              返回任务列表
            </KidButton>
          </div>
        </div>
      </div>

      {feedback && (
        <Feedback
          type={feedback.type}
          text={feedback.text}
          sub={feedback.sub}
          tts={feedback.tts}
          onDone={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
