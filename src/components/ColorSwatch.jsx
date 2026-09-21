import { isLight } from '../lib/colorMath.js';
import { cx } from '../lib/util.js';

// 圆润大色块
export default function ColorSwatch({
  hex,
  label,
  className,
  rounded = 'rounded-3xl',
  onClick,
  children,
  style,
  ring,
}) {
  const light = isLight(hex);
  return (
    <div
      onClick={onClick}
      className={cx(
        rounded,
        'relative flex items-center justify-center overflow-hidden shadow-soft',
        onClick && 'pressable',
        className
      )}
      style={{
        backgroundColor: hex,
        color: light ? '#3b3550' : '#ffffff',
        outline: ring ? `6px solid ${ring}` : undefined,
        ...style,
      }}
    >
      {label && <span className="font-btn drop-shadow-sm">{label}</span>}
      {children}
    </div>
  );
}
