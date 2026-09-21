import { cx } from '../lib/util.js';
import { sfx } from '../lib/audio.js';

const VARIANTS = {
  primary: 'btn-primary',
  blue: 'btn-blue',
  green: 'btn-green',
  purple: 'btn-purple',
  pink: 'btn-pink',
  ghost: 'btn-ghost',
};

export default function KidButton({
  children,
  variant = 'primary',
  className,
  sound = true,
  onClick,
  ...rest
}) {
  return (
    <button
      className={cx(VARIANTS[variant] || 'btn-primary', className)}
      onClick={(e) => {
        if (sound) sfx.click();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
