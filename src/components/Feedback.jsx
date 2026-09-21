import { useEffect } from 'react';
import { sfx, speak } from '../lib/audio.js';

// 答对/答错即时反馈（出现延迟远小于 500ms，纯本地动画）
export default function Feedback({ type, text, sub, onDone, tts }) {
  useEffect(() => {
    if (type === 'correct') sfx.correct();
    else sfx.gentle();
    if (tts) speak(tts);
    const t = setTimeout(() => onDone?.(), type === 'correct' ? 1100 : 1600);
    return () => clearTimeout(t);
  }, [type, tts, onDone]);

  const isCorrect = type === 'correct';
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className={`animate-pop flex flex-col items-center gap-3 rounded-[40px] px-12 py-10 shadow-pop ${
          isCorrect ? 'bg-white/95' : 'bg-white/95'
        }`}
      >
        <div className="text-[110px] leading-none">{isCorrect ? '🎉' : '🤗'}</div>
        <div
          className={`font-cname ${isCorrect ? 'text-green-500' : 'text-sky-500'}`}
          style={{ fontSize: 44 }}
        >
          {text || (isCorrect ? '答对啦！' : '再试一次')}
        </div>
        {sub && <div className="font-body text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}
