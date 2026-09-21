import { useMemo, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import Feedback from '../components/Feedback.jsx';
import DoodlePad from '../components/DoodlePad.jsx';
import { BASE_COLORS } from '../data/colors.js';
import { useProgressStore } from '../store/progressStore.js';
import { compressDataUrl, formatTime, readFileAsDataUrl, todayStr } from '../lib/util.js';
import { sfx, speak } from '../lib/audio.js';

export default function Diary() {
  const logs = useProgressStore((s) => s.records.diary);
  const addDiary = useProgressStore((s) => s.addDiary);
  const deleteRecord = useProgressStore((s) => s.deleteRecord);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [hasDoodle, setHasDoodle] = useState(false);
  const [saved, setSaved] = useState(false);
  const padRef = useRef(null);
  const fileRef = useRef(null);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const l of logs) {
      if (!m.has(l.date)) m.set(l.date, []);
      m.get(l.date).push(l);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [logs]);

  const toggleTag = (id) => {
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
    sfx.click();
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await readFileAsDataUrl(file);
    const small = await compressDataUrl(raw, 800, 0.8);
    setPhoto(small);
  };

  // 写字、拍照、涂鸦，有任意一样就能保存
  const canSave = Boolean(text.trim()) || Boolean(photo) || hasDoodle;

  const submit = async () => {
    if (!canSave) return;
    const drawing = padRef.current && (hasDoodle || photo) ? padRef.current.toDataURL() : null;
    await addDiary({ text: text.trim(), drawing, photo, colorTags: tags });
    setSaved(true);
    sfx.correct();
    setTimeout(() => {
      setSaved(false);
      setWriting(false);
      setText('');
      setTags([]);
      setPhoto(null);
      setHasDoodle(false);
    }, 900);
  };

  return (
    <div>
      <AppHeader title="色彩观察日记" />
      <div className="mx-auto max-w-4xl px-6 py-8">
        {!writing ? (
          <>
            <div className="flex items-center justify-between">
              <p className="font-body text-slate-500">
                今天在生活里看到了什么颜色？记下来吧！共 {logs.length} 篇
              </p>
              <KidButton variant="green" data-testid="diary-new" onClick={() => { setWriting(true); sfx.click(); }}>
                ✏️ 写一篇
              </KidButton>
            </div>

            {/* 时间线 */}
            <div className="mt-8 space-y-8">
              {grouped.length === 0 && (
                <div className="card-kid p-12 text-center">
                  <div className="text-7xl">📔</div>
                  <p className="mt-4 font-body text-slate-500">
                    还没有日记。和爸爸妈妈一起找找家里的颜色吧！
                  </p>
                </div>
              )}
              {grouped.map(([date, items]) => (
                <div key={date}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded-full bg-purple-500 px-5 py-1.5 font-body text-white shadow-soft">
                      📅 {date}
                    </span>
                    <span className="h-1 flex-1 rounded bg-purple-100" />
                  </div>
                  <div className="space-y-4 pl-4">
                    {items.map((l) => (
                      <div key={l.id} className="card-kid relative p-5">
                        <div className="absolute -left-4 top-8 h-4 w-4 rounded-full bg-purple-400 ring-4 ring-purple-100" />
                        <div className="flex flex-wrap gap-4">
                          {l.photo && (
                            <img src={l.photo} alt="观察照片" className="h-44 rounded-2xl object-cover shadow-soft" />
                          )}
                          {l.drawing && (
                            <img src={l.drawing} alt="涂鸦" className="h-44 rounded-2xl object-cover shadow-soft" />
                          )}
                          <div className="min-w-[220px] flex-1">
                            {l.text && <p className="font-body text-slate-700">{l.text}</p>}
                            {l.colorTags?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {l.colorTags.map((id) => {
                                  const c = BASE_COLORS.find((x) => x.id === id);
                                  return (
                                    <span
                                      key={id}
                                      className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-2 pr-3 font-body text-slate-600"
                                    >
                                      <span className="h-5 w-5 rounded-full" style={{ backgroundColor: c.hex }} />
                                      {c.name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-3">
                              <span className="font-body text-slate-400">{formatTime(l.createdAt)}</span>
                              <button
                                onClick={() => speak(l.text)}
                                className="pressable rounded-full bg-sky-50 px-3 py-1 font-body text-sky-600"
                              >
                                🔊 读给我听
                              </button>
                              <button
                                onClick={() => deleteRecord('diary', l.id)}
                                className="ml-auto pressable rounded-full bg-red-50 px-3 py-1 font-body text-red-400"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card-kid p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-cname text-purple-500" style={{ fontSize: 34 }}>
                📔 {todayStr()}
              </h2>
              <KidButton variant="ghost" onClick={() => setWriting(false)}>
                返回
              </KidButton>
            </div>

            <label className="mt-5 block font-btn text-slate-600">我看到的颜色是……</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 120))}
              rows={3}
              placeholder="例如：今天我在公园看到了红红的枫叶，像小手掌一样。"
              className="mt-2 w-full rounded-2xl border-4 border-amber-200 p-4 text-xl outline-none focus:border-amber-400"
            />
            <div className="text-right font-body text-slate-400">{text.length}/120</div>

            <label className="mt-2 block font-btn text-slate-600">这是什么颜色？（可以多选）</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BASE_COLORS.map((c) => (
                <button
                  key={c.id}
                  data-color={c.id}
                  onClick={() => toggleTag(c.id)}
                  className="pressable flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-4 font-body"
                  style={{
                    backgroundColor: tags.includes(c.id) ? c.hex : '#f4f2fb',
                    color: tags.includes(c.id) ? '#fff' : '#5b5578',
                  }}
                >
                  <span className="h-5 w-5 rounded-full" style={{ backgroundColor: tags.includes(c.id) ? '#ffffff88' : c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>

            <label className="mt-6 block font-btn text-slate-600">画下来 / 在照片上画</label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="pressable rounded-2xl bg-teal-50 px-5 py-3 font-body text-teal-700"
              >
                📷 拍一张 / 选照片
              </button>
              {photo && (
                <button
                  onClick={() => setPhoto(null)}
                  className="pressable rounded-2xl bg-slate-100 px-5 py-3 font-body text-slate-600"
                >
                  移除照片
                </button>
              )}
            </div>
            <div className="mt-3">
              <DoodlePad ref={padRef} photo={photo} onChange={setHasDoodle} />
            </div>

            <div className="mt-6 flex gap-4">
              <KidButton variant="ghost" onClick={() => setWriting(false)}>
                取消
              </KidButton>
              <KidButton
                variant="green"
                data-testid="diary-save"
                className="flex-1"
                disabled={!canSave}
                onClick={submit}
              >
                💾 保存日记 ⭐
              </KidButton>
            </div>
          </div>
        )}
      </div>
      {saved && <Feedback type="correct" text="日记保存好啦 ⭐" onDone={() => setSaved(false)} />}
    </div>
  );
}
