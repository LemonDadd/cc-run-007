// 配色练习完成后的简笔画上色模板（10 张，纯 SVG）
import { isLight } from '../lib/colorMath.js';

const OUT = '#433E5C';
const SW = 5;

export const TEMPLATE_REGIONS = {
  flower: ['petal', 'center', 'stem', 'pot'],
  balloon: ['balloon', 'knot', 'string', 'bg'],
  fish: ['body', 'tail', 'fin', 'sea'],
  house: ['roof', 'wall', 'door', 'win', 'ground'],
  tree: ['leaf', 'trunk', 'fruit', 'ground'],
  star: ['star', 'moon', 'bg', 'hill'],
  umbrella: ['canopy', 'tip', 'handle', 'rain'],
  gift: ['box', 'ribbonV', 'ribbonH', 'bow'],
  boat: ['sail1', 'sail2', 'hull', 'sea'],
  kite: ['kite', 'cross', 'tail', 'sky'],
};

function useArt(fills, onPickRegion, selectedId) {
  const fillOf = (id, def = '#FFFFFF') => fills?.[id] || def;
  const p = (id) => ({
    'data-region': id,
    fill: fills?.[id] || '#FFFFFF',
    onClick: onPickRegion ? () => onPickRegion(id) : undefined,
    style: onPickRegion ? { cursor: 'pointer' } : undefined,
    stroke: selectedId === id ? '#FF8A1E' : OUT,
    strokeWidth: selectedId === id ? 9 : SW,
  });
  return { fillOf, p };
}

function TInner({ template, fills, onPickRegion, selectedId }) {
  const { fillOf, p } = useArt(fills, onPickRegion, selectedId);
  switch (template) {
    case 'flower':
      return (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="130" cy="72" rx="20" ry="32" transform={`rotate(${a} 130 102)`} {...p('petal')} fill={fillOf('petal')} />
          ))}
          <circle cx="130" cy="102" r="20" {...p('center')} fill={fillOf('center')} />
          <path d="M130 122 V190" stroke={fillOf('stem')} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M96 200 h68 l-10 46 h-48 Z" {...p('pot')} fill={fillOf('pot')} strokeLinejoin="round" />
        </>
      );
    case 'balloon':
      return (
        <>
          <rect x="0" y="0" width="260" height="260" {...p('bg')} fill={fillOf('bg')} stroke="none" />
          <ellipse cx="130" cy="100" rx="58" ry="70" {...p('balloon')} fill={fillOf('balloon')} />
          <ellipse cx="108" cy="74" rx="14" ry="20" fill="#ffffff66" stroke="none" />
          <path d="M122 168 l8 0 l-4 12 Z" {...p('knot')} fill={fillOf('knot')} strokeLinejoin="round" />
          <path d="M126 180 q-14 30 8 64" stroke={isLight(fillOf('string', '#9AA0A6')) ? OUT : '#9AA0A6'} strokeWidth="4" fill="none" />
        </>
      );
    case 'fish':
      return (
        <>
          <rect x="0" y="0" width="260" height="260" {...p('sea')} fill={fillOf('sea')} stroke="none" />
          <path d="M180 130 L238 86 V174 Z" {...p('tail')} fill={fillOf('tail')} strokeLinejoin="round" />
          <ellipse cx="118" cy="130" rx="74" ry="52" {...p('body')} fill={fillOf('body')} />
          <path d="M96 150 q20 22 46 6 l-12 -22 Z" {...p('fin')} fill={fillOf('fin')} strokeLinejoin="round" />
          <circle cx="82" cy="116" r="11" fill="#fff" stroke={OUT} strokeWidth="4" />
          <circle cx="79" cy="116" r="5" fill={OUT} stroke="none" />
        </>
      );
    case 'house':
      return (
        <>
          <path d="M40 120 L130 46 L220 120 Z" {...p('roof')} fill={fillOf('roof')} strokeLinejoin="round" />
          <rect x="60" y="120" width="140" height="90" rx="8" {...p('wall')} fill={fillOf('wall')} strokeLinejoin="round" />
          <rect x="112" y="158" width="38" height="52" rx="6" {...p('door')} fill={fillOf('door')} strokeLinejoin="round" />
          <circle cx="140" cy="186" r="3.5" fill={OUT} stroke="none" />
          <rect x="74" y="138" width="30" height="30" rx="5" {...p('win')} fill={fillOf('win')} strokeLinejoin="round" />
          <rect x="0" y="210" width="260" height="50" {...p('ground')} fill={fillOf('ground')} stroke="none" />
        </>
      );
    case 'tree':
      return (
        <>
          <rect x="112" y="140" width="34" height="90" rx="8" {...p('trunk')} fill={fillOf('trunk')} strokeLinejoin="round" />
          <circle cx="130" cy="100" r="76" {...p('leaf')} fill={fillOf('leaf')} />
          <circle cx="92" cy="80" r="10" {...p('fruit')} fill={fillOf('fruit')} />
          <circle cx="166" cy="92" r="10" {...p('fruit2', 'fruit')} fill={fillOf('fruit')} />
          <circle cx="130" cy="60" r="10" {...p('fruit3', 'fruit')} fill={fillOf('fruit')} />
          <rect x="0" y="228" width="260" height="32" {...p('ground')} fill={fillOf('ground')} stroke="none" />
        </>
      );
    case 'star':
      return (
        <>
          <rect x="0" y="0" width="260" height="260" {...p('bg')} fill={fillOf('bg')} stroke="none" />
          <circle cx="200" cy="60" r="26" {...p('moon')} fill={fillOf('moon')} />
          <path
            d="M130 40 l24 60 l64 4 l-49 41 l15 62 l-54 -33 l-54 33 l15 -62 l-49 -41 l64 -4 Z"
            {...p('star')}
            fill={fillOf('star')}
            strokeLinejoin="round"
          />
          <path d="M0 232 Q130 190 260 232 V260 H0 Z" {...p('hill')} fill={fillOf('hill')} stroke="none" />
        </>
      );
    case 'umbrella':
      return (
        <>
          <path d="M26 120 a104 104 0 0 1 208 0 Z" {...p('canopy')} fill={fillOf('canopy')} strokeLinejoin="round" />
          <path d="M26 120 a104 104 0 0 1 208 0" fill="none" stroke={OUT} strokeWidth="3" />
          <path d="M130 24 V120 M78 46 V120 M182 46 V120" stroke={OUT} strokeWidth="3" />
          <circle cx="130" cy="20" r="8" {...p('tip')} fill={fillOf('tip')} />
          <path d="M130 120 v66 q0 24 24 24 q18 0 18 -18" stroke={fillOf('handle', OUT)} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M20 200 l12 -24 M60 214 l10 -20 M200 210 l10 -20 M236 196 l12 -24" stroke={fillOf('rain', '#7FB7E8')} strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      );
    case 'gift':
      return (
        <>
          <rect x="40" y="96" width="180" height="140" rx="10" {...p('box')} fill={fillOf('box')} strokeLinejoin="round" />
          <rect x="114" y="96" width="32" height="140" {...p('ribbonV')} fill={fillOf('ribbonV')} stroke="none" />
          <rect x="40" y="140" width="180" height="30" {...p('ribbonH')} fill={fillOf('ribbonH')} stroke="none" />
          <path d="M130 96 q-40 -52 -8 -34 q8 4 8 10 q0 -6 8 -10 q32 -18 -8 34 Z" {...p('bow')} fill={fillOf('bow')} strokeLinejoin="round" />
        </>
      );
    case 'boat':
      return (
        <>
          <rect x="0" y="0" width="260" height="260" fill={fillOf('sea', '#BFE6FF')} {...p('sea')} stroke="none" />
          <path d="M130 40 L130 150 L208 150 Z" {...p('sail1')} fill={fillOf('sail1')} strokeLinejoin="round" />
          <path d="M130 56 L130 150 L64 150 Z" {...p('sail2')} fill={fillOf('sail2')} strokeLinejoin="round" />
          <line x1="130" y1="36" x2="130" y2="168" stroke={OUT} strokeWidth="7" />
          <path d="M40 168 H220 L196 214 H64 Z" {...p('hull')} fill={fillOf('hull')} strokeLinejoin="round" />
        </>
      );
    case 'kite':
      return (
        <>
          <rect x="0" y="0" width="260" height="260" {...p('sky')} fill={fillOf('sky')} stroke="none" />
          <path d="M130 30 L200 96 L130 180 L60 96 Z" {...p('kite')} fill={fillOf('kite')} strokeLinejoin="round" />
          <path d="M130 30 V180 M60 96 H200" {...p('cross')} stroke={isLight(fillOf('cross', '#ffffff')) ? OUT : fillOf('cross')} strokeWidth="5" fill="none" />
          <path d="M130 180 q26 26 0 44 q-20 14 6 26" stroke={fillOf('tail', '#E8384A')} strokeWidth="7" fill="none" strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}

export default function RewardArt({ template, fills, onPickRegion, selectedId, className }) {
  return (
    <svg viewBox="0 0 260 260" className={className} preserveAspectRatio="xMidYMid meet">
      <TInner template={template} fills={fills} onPickRegion={onPickRegion} selectedId={selectedId} />
    </svg>
  );
}
