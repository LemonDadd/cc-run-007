import { useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import { useProgressStore } from '../store/progressStore.js';
import { colorById } from '../data/colors.js';
import { formatDate, cx } from '../lib/util.js';
import { sfx } from '../lib/audio.js';

const TABS = [
  { key: 'coloring', label: '情境用色', icon: '🖍️' },
  { key: 'matching', label: '配色练习', icon: '🎀' },
];

export default function Gallery() {
  const records = useProgressStore((s) => s.records);
  const deleteRecord = useProgressStore((s) => s.deleteRecord);
  const [tab, setTab] = useState('coloring');
  const [view, setView] = useState(null);

  const list = tab === 'coloring' ? records.coloring : records.matching;

  return (
    <div>
      <AppHeader title="我的作品" />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex gap-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                sfx.click();
              }}
              className={cx(
                'pressable rounded-full px-7 py-3 font-btn shadow-soft',
                tab === t.key ? 'bg-purple-500 text-white' : 'bg-white text-slate-600'
              )}
            >
              {t.icon} {t.label}（{t.key === 'coloring' ? records.coloring.length : records.matching.length}）
            </button>
          ))}
        </div>

        {list.length === 0 && (
          <div className="card-kid mt-8 p-12 text-center">
            <div className="text-7xl">{tab === 'coloring' ? '🖍️' : '🎀'}</div>
            <p className="mt-4 font-body text-slate-500">
              {tab === 'coloring' ? '去情境用色里画一幅作品吧！' : '去配色练习里完成第一幅搭配吧！'}
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w) => (
            <div key={w.id} className="card-kid overflow-hidden">
              <button onClick={() => setView(w)} className="pressable block w-full">
                {w.dataUrl || w.previewDataUrl ? (
                  <img
                    src={w.dataUrl || w.previewDataUrl}
                    alt={w.title}
                    className="h-52 w-full bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center gap-2 bg-white">
                    {w.colors?.map((id, i) => (
                      <span key={i} className="h-20 w-20 rounded-2xl shadow" style={{ backgroundColor: colorById[id]?.hex }} />
                    ))}
                  </div>
                )}
              </button>
              <div className="p-4">
                <div className="font-btn text-slate-700">{w.title}</div>
                {w.emotion && <div className="mt-1 font-body text-teal-600">心情：{w.emotion}</div>}
                <div className="mt-1 font-body text-slate-400">{formatDate(w.createdAt)}</div>
                <button
                  onClick={() => deleteRecord(tab, w.id)}
                  className="mt-2 pressable rounded-full bg-red-50 px-4 py-1 font-body text-red-400"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {view && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6"
          onClick={() => setView(null)}
        >
          <div className="card-kid max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {(view.dataUrl || view.previewDataUrl) && (
              <img src={view.dataUrl || view.previewDataUrl} alt={view.title} className="w-full rounded-3xl bg-white" />
            )}
            <h3 className="mt-4 font-cname text-slate-700" style={{ fontSize: 32 }}>
              {view.title}
            </h3>
            {view.emotion && <p className="mt-2 font-body text-teal-600">心情：{view.emotion}</p>}
            {view.note && <p className="mt-2 font-body text-slate-600">“{view.note}”</p>}
            {view.colors && (
              <div className="mt-3 flex gap-2">
                {view.colors.map((id, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-slate-50 py-1 pl-2 pr-3 font-body text-slate-600">
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: colorById[id]?.hex }} />
                    {colorById[id]?.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <KidButton variant="ghost" className="flex-1" onClick={() => setView(null)}>
                关闭
              </KidButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
