import KidButton from './KidButton.jsx';

// 大图标模块入口卡片
export default function ModuleCard({ icon, title, subtitle, color, onClick, done }) {
  return (
    <button
      onClick={onClick}
      className="pressable relative flex w-full flex-col items-center gap-2 rounded-[36px] p-6 text-white shadow-kid transition-shadow"
      style={{ background: `linear-gradient(160deg, ${color}, ${color}dd)` }}
    >
      {done != null && (
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 font-body text-[16px] text-slate-600">
          {done}
        </span>
      )}
      <span className="text-7xl drop-shadow">{icon}</span>
      <span className="font-cname" style={{ fontSize: 34 }}>
        {title}
      </span>
      {subtitle && <span className="font-body text-white/90">{subtitle}</span>}
    </button>
  );
}
