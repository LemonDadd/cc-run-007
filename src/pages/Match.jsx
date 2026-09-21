import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import Feedback from '../components/Feedback.jsx';
import ColorWheel from '../components/ColorWheel.jsx';
import RewardArt, { TEMPLATE_REGIONS } from '../components/RewardArt.jsx';
import { MATCHING_EXERCISES, evaluateTheme } from '../data/exercises.js';
import { BASE_COLORS, colorById } from '../data/colors.js';
import { evaluateRule, RULE_META } from '../lib/colorWheel.js';
import { useProgressStore } from '../store/progressStore.js';
import { sfx, speak } from '../lib/audio.js';
import { isLight } from '../lib/colorMath.js';

const COLOR_LIST = BASE_COLORS;

function serializeSvg(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const xml = new XMLSerializer().serializeToString(clone);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

export default function Match() {
  const navigate = useNavigate();
  const saveMatchingWork = useProgressStore((s) => s.saveMatchingWork);
  const works = useProgressStore((s) => s.records.matching);
  const doneIds = useMemo(() => new Set(works.map((w) => w.exerciseId)), [works]);

  const firstUndone = MATCHING_EXERCISES.findIndex((e) => !doneIds.has(e.id));
  const [idx, setIdx] = useState(firstUndone >= 0 ? firstUndone : 0);
  const [slots, setSlots] = useState(() => Array(MATCHING_EXERCISES[0].slots).fill(null));
  const [phase, setPhase] = useState('rule'); // rule | reward
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [fills, setFills] = useState({});
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activePalette, setActivePalette] = useState(null); // 奖励阶段选色
  const svgWrapRef = useRef(null);
  const dragColor = useRef(null);

  const ex = MATCHING_EXERCISES[idx];

  const goto = (n) => {
    const i = (n + MATCHING_EXERCISES.length) % MATCHING_EXERCISES.length;
    setIdx(i);
    setSlots(Array(MATCHING_EXERCISES[i].slots).fill(null));
    setPhase('rule');
    setFeedback(null);
    setExplanation(null);
    setFills({});
    setSelectedRegion(null);
  };

  const usedIds = slots.filter(Boolean);

  const placeColor = (colorId) => {
    setSlots((prev) => {
      const next = [...prev];
      // 已在槽里：移动到下一个空槽（等价先取出）
      const exist = next.indexOf(colorId);
      if (exist >= 0) next[exist] = null;
      const empty = next.indexOf(null);
      if (empty < 0) return prev;
      next[empty] = colorId;
      return next;
    });
    sfx.drop();
  };

  const clearSlot = (i) => {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
    sfx.click();
  };

  const check = () => {
    if (slots.some((s) => !s)) {
      setFeedback({ type: 'gentle', text: '还没摆满哦', sub: '把颜色放到小槽里吧', tts: '颜色还没摆满呢' });
      return;
    }
    const r =
      ex.kind === 'theme'
        ? evaluateTheme(ex.criterion, slots, COLOR_LIST, ex.themeName)
        : evaluateRule(ex.rule, slots);
    setExplanation(r);
    if (r.ok) {
      sfx.correct();
      setFeedback({ type: 'correct', text: '搭配成功！', tts: '搭配成功，太好看啦' });
      // 用所选颜色自动给简笔画铺色
      const regions = TEMPLATE_REGIONS[ex.template];
      const auto = {};
      regions.forEach((reg, i) => {
        auto[reg] = colorById[slots[i % slots.length]].hex;
      });
      setFills(auto);
      setTimeout(() => setPhase('reward'), 800);
    } else {
      sfx.gentle();
      setFeedback({ type: 'gentle', text: '再调一调～', sub: r.explanation, tts: r.explanation });
    }
  };

  const saveWork = async () => {
    const svg = svgWrapRef.current?.querySelector('svg');
    const previewDataUrl = svg ? serializeSvg(svg) : null;
    await saveMatchingWork({
      exerciseId: ex.id,
      exerciseOrder: ex.order,
      title: ex.kind === 'theme' ? `主题配色·${ex.themeName}` : ex.prompt.slice(0, 14),
      rule: ex.rule || 'theme',
      colors: slots,
      previewDataUrl,
    });
    setFeedback({ type: 'correct', text: '作品已保存 ⭐', tts: '作品保存好啦，得到一颗星' });
    setTimeout(() => goto(idx + 1), 1100);
  };

  const ruleMeta = ex.rule ? RULE_META[ex.rule] : { name: `主题配色·${ex.themeName}`, emoji: ex.emoji, desc: ex.hint };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="配色练习"
        right={
          <div className="mr-2 rounded-full bg-white px-4 py-2 font-body text-slate-600 shadow-soft">
            {idx + 1}/50 · 已完成 {doneIds.size}
          </div>
        }
      />

      {/* 进度小条 */}
      <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-1 px-6 pt-4">
        {MATCHING_EXERCISES.map((e, i) => (
          <button
            key={e.id}
            onClick={() => goto(i)}
            className="h-4 w-4 rounded-full"
            style={{
              backgroundColor: doneIds.has(e.id) ? '#3CB54A' : i === idx ? '#FF8A1E' : '#ddd6f2',
            }}
            aria-label={`第${i + 1}题`}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_300px]">
        <div className="card-kid flex flex-col p-7">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-purple-100 px-4 py-1.5 font-body text-purple-600">
              {ruleMeta.emoji} {ruleMeta.name}
            </span>
            {doneIds.has(ex.id) && (
              <span className="rounded-full bg-green-100 px-4 py-1.5 font-body text-green-600">✓ 已完成</span>
            )}
          </div>
          <h2 className="mt-4 font-cname text-slate-700" style={{ fontSize: 38 }}>
            {ex.emoji ? `${ex.emoji} ` : ''}
            {ex.prompt}
          </h2>

          {phase === 'rule' && (
            <>
              {/* 槽位 */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {slots.map((id, i) => (
                  <div
                    key={i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const cid = e.dataTransfer.getData('text/plain');
                      if (cid) {
                        setSlots((prev) => {
                          const next = [...prev];
                          const exist = next.indexOf(cid);
                          if (exist >= 0) next[exist] = null;
                          next[i] = cid;
                          return next;
                        });
                        sfx.drop();
                      }
                    }}
                    onClick={() => id && clearSlot(i)}
                    className="flex h-28 w-28 items-center justify-center rounded-[28px] border-4 border-dashed border-purple-300 bg-purple-50/60"
                    style={
                      id
                        ? {
                            backgroundColor: colorById[id].hex,
                            borderColor: colorById[id].hex,
                            color: isLight(colorById[id].hex) ? '#3b3550' : '#fff',
                          }
                        : null
                    }
                  >
                    {id ? (
                      <span className="font-btn">{colorById[id].name}</span>
                    ) : (
                      <span className="font-body text-purple-300">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 色块托盘：可拖拽也可点选 */}
              <p className="mt-6 font-body text-slate-500">把颜色拖进小槽，或者点一下也可以～</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {ex.pool.map((cid) => {
                  const c = colorById[cid];
                  const used = slots.includes(cid);
                  return (
                    <button
                      key={cid}
                      data-color={cid}
                      draggable
                      onDragStart={(e) => {
                        dragColor.current = cid;
                        e.dataTransfer.setData('text/plain', cid);
                      }}
                      onClick={() => placeColor(cid)}
                      className="pressable flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[26px] shadow-soft"
                      style={{
                        backgroundColor: c.hex,
                        color: isLight(c.hex) ? '#3b3550' : '#fff',
                        opacity: used ? 0.35 : 1,
                      }}
                    >
                      <span className="text-3xl">{c.emoji}</span>
                      <span className="font-body text-[18px]">{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {explanation && (
                <div
                  className={`animate-pop mt-6 rounded-3xl p-5 font-body ${
                    explanation.ok ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {explanation.ok ? '✅ ' : '💡 '}
                  {explanation.explanation}
                </div>
              )}

              <div className="mt-auto flex gap-4 pt-6">
                <KidButton variant="ghost" onClick={() => goto(idx - 1)}>
                  ← 上一题
                </KidButton>
                <KidButton variant="purple" data-testid="match-check" className="flex-1" onClick={check}>
                  检查搭配 🔍
                </KidButton>
                <KidButton variant="ghost" onClick={() => goto(idx + 1)}>
                  下一题 →
                </KidButton>
              </div>
              <p className="mt-3 text-center font-body text-slate-400">💡 {ex.hint}</p>
            </>
          )}

          {phase === 'reward' && (
            <>
              <p className="mt-4 font-body text-slate-500">
                搭配完成！现在用你的颜色给「{ex.template === 'flower' ? '小花' : '简笔画'}」涂一涂吧：
                先点下面颜色，再点画上想涂的地方；也可以直接保存。
              </p>
              <div ref={svgWrapRef} className="mt-2 flex justify-center rounded-[32px] bg-amber-50 p-3">
                <RewardArt
                  template={ex.template}
                  fills={fills}
                  selectedId={selectedRegion}
                  onPickRegion={(rid) => {
                    if (activePalette) {
                      setFills((f) => ({ ...f, [rid]: colorById[activePalette].hex }));
                      sfx.drop();
                    } else {
                      setSelectedRegion(rid);
                      sfx.click();
                    }
                  }}
                  className="w-72"
                />
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {[...new Set(slots)].map((cid) => {
                  const c = colorById[cid];
                  return (
                    <button
                      key={cid}
                      onClick={() => {
                        setActivePalette(activePalette === cid ? null : cid);
                        sfx.click();
                      }}
                      className="pressable h-20 w-20 rounded-2xl shadow-soft"
                      style={{
                        backgroundColor: c.hex,
                        outline: activePalette === cid ? '6px solid #FF8A1E' : 'none',
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-auto flex gap-4 pt-6">
                <KidButton
                  variant="ghost"
                  onClick={() => {
                    const regions = TEMPLATE_REGIONS[ex.template];
                    const auto = {};
                    regions.forEach((reg, i) => {
                      auto[reg] = colorById[slots[i % slots.length]].hex;
                    });
                    setFills(auto);
                  }}
                >
                  🪄 自动涂色
                </KidButton>
                <KidButton variant="green" data-testid="match-save" className="flex-1" onClick={saveWork}>
                  💾 保存为我的作品 ⭐
                </KidButton>
              </div>
            </>
          )}
        </div>

        {/* 色轮提示 */}
        <div className="card-kid flex flex-col items-center p-5">
          <ColorWheel
            size={260}
            highlight={ex.kind === 'theme' ? [] : ex.answer || usedIds}
            links={
              ex.rule === 'complementary' && ex.answer
                ? [ex.answer]
                : ex.rule === 'analogous' && ex.answer
                ? [ex.answer]
                : (ex.rule === 'triadic' || ex.rule === 'split') && ex.answer
                ? [[ex.answer[0], ex.answer[1]], [ex.answer[1], ex.answer[2]]]
                : []
            }
          />
          <p className="mt-3 text-center font-body text-slate-500">{ruleMeta.desc}</p>
          <button onClick={() => navigate('/gallery')} className="mt-4 font-body text-purple-500 underline">
            看我的作品 →
          </button>
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
