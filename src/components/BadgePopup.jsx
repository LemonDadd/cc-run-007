import { useAppStore } from '../store/appStore.js';
import KidButton from './KidButton.jsx';
import { sfx, speak } from '../lib/audio.js';
import { useEffect } from 'react';

// 成就解锁庆祝弹窗（可叠加多枚）
export default function BadgePopup() {
  const newBadges = useAppStore((s) => s.newBadges);
  const dismiss = useAppStore((s) => s.dismissBadges);

  useEffect(() => {
    if (newBadges.length) {
      sfx.badge();
      speak(`恭喜你解锁了${newBadges.length}枚新徽章！`);
    }
  }, [newBadges.length]);

  if (!newBadges.length) return null;
  const badge = newBadges[0];
  const left = newBadges.length - 1;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/30">
      <div className="animate-pop card-kid flex w-[min(92vw,520px)] flex-col items-center gap-4 p-10">
        <div className="font-body font-bold text-amber-500">🏅 成就解锁</div>
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full animate-wiggle"
          style={{ backgroundColor: badge.color + '33', border: `8px solid ${badge.color}` }}
        >
          <span className="text-8xl">{badge.emoji}</span>
        </div>
        <div className="font-cname" style={{ color: badge.color }}>
          {badge.name}
        </div>
        <div className="font-body text-center text-slate-600">{badge.desc}</div>
        <KidButton
          variant="primary"
          onClick={() => {
            const rest = useAppStore.getState().newBadges.slice(1);
            useAppStore.setState({ newBadges: rest });
            if (!rest.length) dismiss();
          }}
        >
          {left > 0 ? `收下（还有 ${left} 枚）` : '太棒啦！'}
        </KidButton>
      </div>
    </div>
  );
}
