import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { sfx } from '../lib/audio.js';
import { cx } from '../lib/util.js';

export default function AppHeader({ title, showHome = true, right, transparent }) {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.currentProfile());
  return (
    <header
      className={cx(
        'sticky top-0 z-40 flex items-center gap-3 px-4 py-3',
        !transparent && 'backdrop-blur bg-white/60 border-b border-white/70'
      )}
    >
      <button
        aria-label="返回"
        onClick={() => {
          sfx.click();
          navigate(-1);
        }}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-soft pressable"
      >
        ←
      </button>
      {showHome && (
        <button
          aria-label="回首页"
          onClick={() => {
            sfx.click();
            navigate('/home');
          }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-soft pressable"
        >
          🏠
        </button>
      )}
      <h1 className="flex-1 truncate text-[28px] font-bold text-slate-700">{title}</h1>
      {right}
      {profile && (
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pl-2 pr-4 shadow-soft">
          <span className="text-3xl">{profile.avatar}</span>
          <span className="font-body font-bold text-amber-500">⭐ {profile.stars}</span>
        </div>
      )}
    </header>
  );
}
