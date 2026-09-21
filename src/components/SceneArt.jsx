// 纯 SVG 简笔画：可上色区域由 fills[regionId] 决定，点击触发 onPickRegion
import { isLight } from '../lib/colorMath.js';

const OUT = '#433E5C';
const SW = 5;

function useArt(fills, onPickRegion, selectedId) {
  const fillOf = (id, def = '#FFFFFF') => fills?.[id] || def;
  // id 参数可省略（用 key）；同色区域可显式传 region id
  const p = (key, regionId = key) => ({
    'data-region': regionId,
    fill: fills?.[regionId] || '#FFFFFF',
    onClick: onPickRegion ? () => onPickRegion(regionId) : undefined,
    style: onPickRegion ? { cursor: 'pointer' } : undefined,
    stroke: selectedId === regionId ? '#FF8A1E' : OUT,
    strokeWidth: selectedId === regionId ? 8 : SW,
  });
  return { fillOf, p };
}

// ===================== 情境场景（400x300） =====================
export const SCENE_REGIONS = {
  home: [
    { id: 'sky', name: '天空' },
    { id: 'wall', name: '墙壁' },
    { id: 'roof', name: '屋顶' },
    { id: 'door', name: '小门' },
    { id: 'win', name: '窗户' },
    { id: 'ground', name: '草地' },
  ],
  sky: [
    { id: 'sky', name: '天空' },
    { id: 'sun', name: '太阳' },
    { id: 'cloud1', name: '云朵1' },
    { id: 'cloud2', name: '云朵2' },
    { id: 'hill', name: '小山' },
  ],
  forest: [
    { id: 'sky', name: '天空' },
    { id: 'ground', name: '地面' },
    { id: 'trunk1', name: '树干' },
    { id: 'leaf1', name: '树冠' },
    { id: 'trunk2', name: '小树干' },
    { id: 'leaf2', name: '小树冠' },
  ],
  sea: [
    { id: 'water', name: '海水' },
    { id: 'sand', name: '沙地' },
    { id: 'fish', name: '小鱼身体' },
    { id: 'tail', name: '鱼尾' },
    { id: 'weed', name: '海草' },
    { id: 'rock', name: '小石头' },
  ],
  party: [
    { id: 'bg', name: '背景' },
    { id: 'table', name: '桌子' },
    { id: 'cake', name: '蛋糕' },
    { id: 'balloon1', name: '气球1' },
    { id: 'balloon2', name: '气球2' },
    { id: 'gift', name: '礼物盒' },
  ],
  monster: [
    { id: 'bg', name: '背景' },
    { id: 'body', name: '身体' },
    { id: 'horn', name: '小角' },
    { id: 'belly', name: '肚皮' },
    { id: 'arm', name: '小手' },
  ],
  city: [
    { id: 'sky', name: '天空' },
    { id: 'b1', name: '高楼1' },
    { id: 'b2', name: '高楼2' },
    { id: 'b3', name: '高楼3' },
    { id: 'moon', name: '月亮' },
    { id: 'ground', name: '马路' },
  ],
  garden: [
    { id: 'sky', name: '天空' },
    { id: 'ground', name: '草地' },
    { id: 'f1', name: '花朵1' },
    { id: 'f2', name: '花朵2' },
    { id: 'f3', name: '花朵3' },
    { id: 'stem', name: '花叶茎' },
  ],
  space: [
    { id: 'bg', name: '太空' },
    { id: 'planet', name: '星球' },
    { id: 'ring', name: '光环' },
    { id: 'star1', name: '星星1' },
    { id: 'star2', name: '星星2' },
    { id: 'rocket', name: '小火箭' },
  ],
  clothes: [
    { id: 'bg', name: '背景' },
    { id: 'shirt', name: '衣服' },
    { id: 'sleeve', name: '袖子' },
    { id: 'collar', name: '领子' },
    { id: 'pocket', name: '口袋' },
    { id: 'boots', name: '小靴子' },
  ],
};

function SceneInner({ scene, fills, onPickRegion, selectedId }) {
  const { fillOf, p } = useArt(fills, onPickRegion, selectedId);
  switch (scene) {
    case 'home':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('sky')} fill={fillOf('sky', '#DCEFFE')} />
          <rect x="0" y="240" width="400" height="60" {...p('ground')} fill={fillOf('ground')} strokeLinejoin="round" />
          <rect x="110" y="140" width="180" height="110" rx="8" {...p('wall')} fill={fillOf('wall')} strokeLinejoin="round" />
          <path d="M90 145 L200 60 L310 145 Z" {...p('roof')} fill={fillOf('roof')} strokeLinejoin="round" />
          <rect x="180" y="190" width="44" height="60" rx="6" {...p('door')} fill={fillOf('door')} strokeLinejoin="round" />
          <circle cx="214" cy="222" r="4" fill={OUT} stroke="none" />
          <rect x="130" y="165" width="38" height="38" rx="5" {...p('win')} fill={fillOf('win')} strokeLinejoin="round" />
          <path d="M149 165 V203 M130 184 H168" stroke={OUT} strokeWidth="3" fill="none" />
          {/* 小兔子 */}
          <ellipse cx="315" cy="232" rx="20" ry="16" fill="#fff" stroke={OUT} strokeWidth="4" />
          <circle cx="315" cy="206" r="14" fill="#fff" stroke={OUT} strokeWidth="4" />
          <ellipse cx="308" cy="186" rx="5" ry="14" fill="#fff" stroke={OUT} strokeWidth="4" />
          <ellipse cx="322" cy="186" rx="5" ry="14" fill="#fff" stroke={OUT} strokeWidth="4" />
          <circle cx="310" cy="204" r="2.5" fill={OUT} stroke="none" />
          <circle cx="320" cy="204" r="2.5" fill={OUT} stroke="none" />
        </>
      );
    case 'sky':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('sky')} fill={fillOf('sky', '#BFE6FF')} strokeLinejoin="round" />
          <path d="M0 250 Q100 200 200 250 T400 250 V300 H0 Z" {...p('hill')} fill={fillOf('hill')} strokeLinejoin="round" />
          <circle cx="320" cy="70" r="42" {...p('sun')} fill={fillOf('sun')} />
          <g {...p('cloud1')} fill={fillOf('cloud1')} strokeLinejoin="round">
            <ellipse cx="90" cy="80" rx="34" ry="24" />
            <ellipse cx="120" cy="72" rx="28" ry="22" />
            <ellipse cx="66" cy="86" rx="22" ry="17" />
          </g>
          <g {...p('cloud2')} fill={fillOf('cloud2')} strokeLinejoin="round">
            <ellipse cx="210" cy="140" rx="30" ry="20" />
            <ellipse cx="236" cy="134" rx="24" ry="18" />
          </g>
        </>
      );
    case 'forest':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('sky')} fill={fillOf('sky', '#DCEFFE')} strokeLinejoin="round" />
          <rect x="0" y="232" width="400" height="68" {...p('ground')} fill={fillOf('ground')} strokeLinejoin="round" />
          <rect x="92" y="170" width="26" height="66" rx="6" {...p('trunk1')} fill={fillOf('trunk1')} strokeLinejoin="round" />
          <circle cx="105" cy="140" r="58" {...p('leaf1')} fill={fillOf('leaf1')} />
          <rect x="266" y="192" width="20" height="46" rx="5" {...p('trunk2')} fill={fillOf('trunk2')} strokeLinejoin="round" />
          <circle cx="276" cy="168" r="42" {...p('leaf2')} fill={fillOf('leaf2')} />
        </>
      );
    case 'sea':
      return (
        <>
          <rect x="0" y="0" width="400" height="246" {...p('water')} fill={fillOf('water', '#BFE6FF')} strokeLinejoin="round" />
          <rect x="0" y="246" width="400" height="54" {...p('sand')} fill={fillOf('sand')} strokeLinejoin="round" />
          <path d="M60 250 q10 -34 22 0 q-11 10 -22 0Z" {...p('weed')} fill={fillOf('weed')} />
          <path d="M330 252 q14 -44 30 0Z" {...p('x', 'weed')} fill={fillOf('weed')} />
          <ellipse cx="330" cy="258" rx="26" ry="12" {...p('rock')} fill={fillOf('rock')} />
          <path d="M250 130 L300 100 L300 160 Z" {...p('tail')} fill={fillOf('tail')} strokeLinejoin="round" />
          <ellipse cx="210" cy="130" rx="52" ry="36" {...p('fish')} fill={fillOf('fish')} />
          <circle cx="185" cy="120" r="7" fill="#fff" stroke={OUT} strokeWidth="3" />
          <circle cx="183" cy="120" r="3" fill={OUT} stroke="none" />
          <path d="M168 140 q12 10 26 2" stroke={OUT} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'party':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('bg')} fill={fillOf('bg', '#FDE9F4')} strokeLinejoin="round" />
          <path d="M40 40 q20 -18 40 0 q20 -18 40 0 v14 h-120 Z" fill="none" stroke={OUT} strokeWidth="3" />
          <ellipse cx="100" cy="78" rx="26" ry="32" {...p('balloon1')} fill={fillOf('balloon1')} />
          <path d="M100 110 v40" stroke={OUT} strokeWidth="3" fill="none" />
          <ellipse cx="300" cy="70" rx="26" ry="32" {...p('balloon2')} fill={fillOf('balloon2')} />
          <path d="M300 102 v46" stroke={OUT} strokeWidth="3" fill="none" />
          <rect x="80" y="210" width="240" height="20" rx="8" {...p('table')} fill={fillOf('table')} strokeLinejoin="round" />
          <rect x="170" y="150" width="64" height="58" rx="8" {...p('cake')} fill={fillOf('cake')} strokeLinejoin="round" />
          <path d="M170 170 h64 M170 190 h64" stroke={OUT} strokeWidth="3" />
          <path d="M202 134 v16" stroke={OUT} strokeWidth="4" strokeLinecap="round" />
          <circle cx="202" cy="128" r="6" fill="#FFD426" stroke={OUT} strokeWidth="3" />
          <rect x="300" y="206" width="46" height="46" rx="6" {...p('gift')} fill={fillOf('gift')} strokeLinejoin="round" />
          <path d="M323 206 V252 M300 222 h46" stroke={OUT} strokeWidth="3" />
        </>
      );
    case 'monster':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('bg')} fill={fillOf('bg', '#EDE9FE')} strokeLinejoin="round" />
          <path d="M160 96 l14 -36 l18 30 Z" {...p('horn')} fill={fillOf('horn')} strokeLinejoin="round" />
          <path d="M240 96 l-14 -36 l-18 30 Z" {...p('horn2', 'horn')} fill={fillOf('horn')} strokeLinejoin="round" />
          <rect x="128" y="90" width="144" height="150" rx="56" {...p('body')} fill={fillOf('body')} strokeLinejoin="round" />
          <ellipse cx="200" cy="176" rx="56" ry="44" {...p('belly')} fill={fillOf('belly')} />
          <ellipse cx="120" cy="160" rx="20" ry="26" {...p('arm')} fill={fillOf('arm')} />
          <ellipse cx="280" cy="160" rx="20" ry="26" {...p('x', 'arm')} fill={fillOf('arm')} />
          <circle cx="176" cy="134" r="16" fill="#fff" stroke={OUT} strokeWidth="4" />
          <circle cx="224" cy="134" r="16" fill="#fff" stroke={OUT} strokeWidth="4" />
          <circle cx="178" cy="138" r="6" fill={OUT} stroke="none" />
          <circle cx="220" cy="138" r="6" fill={OUT} stroke="none" />
          <path d="M180 176 q20 16 40 0" stroke={OUT} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'city':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('sky')} fill={fillOf('sky', '#1f2a55')} strokeLinejoin="round" />
          <circle cx="340" cy="56" r="26" {...p('moon')} fill={fillOf('moon')} />
          <rect x="50" y="110" width="80" height="132" rx="6" {...p('b1')} fill={fillOf('b1')} strokeLinejoin="round" />
          <rect x="160" y="70" width="86" height="172" rx="6" {...p('b2')} fill={fillOf('b2')} strokeLinejoin="round" />
          <rect x="276" y="130" width="70" height="112" rx="6" {...p('b3')} fill={fillOf('b3')} strokeLinejoin="round" />
          {[
            [70, 134],
            [98, 134],
            [70, 168],
            [98, 168],
            [182, 96],
            [212, 96],
            [182, 130],
            [212, 130],
            [182, 164],
            [212, 164],
            [292, 152],
            [320, 152],
            [292, 186],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="14" height="14" rx="2" fill="#FFE9A8" stroke={OUT} strokeWidth="2" />
          ))}
          <rect x="0" y="242" width="400" height="58" {...p('ground')} fill={fillOf('ground')} strokeLinejoin="round" />
          <path d="M0 262 h400" stroke={OUT} strokeWidth="3" strokeDasharray="18 14" />
        </>
      );
    case 'garden':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('sky')} fill={fillOf('sky', '#DCEFFE')} strokeLinejoin="round" />
          <rect x="0" y="210" width="400" height="90" {...p('ground')} fill={fillOf('ground')} strokeLinejoin="round" />
          <path d="M100 210 V150 M200 210 V130 M300 210 V158 M104 178 q-16 -6 -18 -22 M204 160 q18 -6 20 -24" strokeWidth="6" {...p('stem')} fill="none" stroke={isLight(fillOf('stem', '#3CB54A')) ? OUT : fillOf('stem', '#3CB54A')} strokeLinecap="round" />
          {[
            [100, 128, 'f1'],
            [200, 104, 'f2'],
            [300, 132, 'f3'],
          ].map(([cx, cy, id], fi) => (
            <g key={id}>
              {[0, 72, 144, 216, 288].map((a, pi) => (
                <ellipse
                  key={a}
                  cx={cx}
                  cy={cy - 20}
                  rx="14"
                  ry="22"
                  transform={`rotate(${a} ${cx} ${cy})`}
                  {...p(`petal-${fi}-${pi}`, id)}
                  fill={fillOf(id)}
                />
              ))}
              <circle cx={cx} cy={cy} r="12" fill="#FFD426" stroke={OUT} strokeWidth="3" />
            </g>
          ))}
        </>
      );
    case 'space':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('bg')} fill={fillOf('bg', '#171A3D')} strokeLinejoin="round" />
          <path d="M70 70 l7 14 l15 2 l-11 10 l3 15 l-14 -8 l-13 8 l3 -15 l-11 -10 l15 -2 Z" {...p('star1')} fill={fillOf('star1')} strokeLinejoin="round" />
          <path d="M310 180 l6 12 l13 2 l-10 9 l3 13 l-12 -7 l-12 7 l3 -13 l-10 -9 l13 -2 Z" {...p('star2')} fill={fillOf('star2')} strokeLinejoin="round" />
          <g transform="rotate(-18 150 150)">
            <ellipse cx="150" cy="150" rx="90" ry="20" fill="none" {...p('ring')} stroke={fillOf('ring')} />
          </g>
          <circle cx="150" cy="150" r="46" {...p('planet')} fill={fillOf('planet')} />
          <path d="M290 200 l22 0 l10 18 l-10 18 l-22 0 Z" {...p('rocket')} fill={fillOf('rocket')} strokeLinejoin="round" />
          <circle cx="300" cy="212" r="7" fill="#BFE6FF" stroke={OUT} strokeWidth="3" />
          <path d="M290 204 l-16 -10 l0 20 Z" {...p('x', 'rocket')} fill={fillOf('rocket')} strokeLinejoin="round" />
        </>
      );
    case 'clothes':
      return (
        <>
          <rect x="0" y="0" width="400" height="300" {...p('bg')} fill={fillOf('bg', '#E7F0FF')} strokeLinejoin="round" />
          <path d="M140 70 l-50 40 l30 44 l26 -16 v120 h108 v-120 l26 16 l30 -44 l-50 -40 l-28 22 a36 30 0 0 1 -64 0 Z"
            {...p('shirt')} fill={fillOf('shirt')} strokeLinejoin="round" />
          <path d="M90 110 l30 44 l26 -16" fill="none" {...p('sleeve')} strokeWidth={SW} stroke={fillOf('sleeve')} onClick={onPickRegion ? () => onPickRegion('sleeve') : undefined} style={{ cursor: 'pointer' }} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M310 110 l-30 44 l-26 -16" fill="none" stroke={fillOf('sleeve')} strokeWidth={SW} onClick={onPickRegion ? () => onPickRegion('sleeve') : undefined} style={{ cursor: 'pointer' }} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M168 92 a36 30 0 0 0 64 0" fill="none" {...p('collar')} strokeWidth={8} stroke={fillOf('collar')} onClick={onPickRegion ? () => onPickRegion('collar') : undefined} style={{ cursor: 'pointer' }} strokeLinecap="round" />
          <rect x="176" y="170" width="48" height="40" rx="8" {...p('pocket')} fill={fillOf('pocket')} strokeLinejoin="round" />
          <path d="M176 232 h-18 a12 22 0 0 0 0 44 h18 Z M224 232 h18 a12 22 0 0 1 0 44 h-18 Z" {...p('boots')} fill={fillOf('boots')} strokeLinejoin="round" />
        </>
      );
    default:
      return null;
  }
}

export default function SceneArt({ scene, fills, onPickRegion, selectedId, className }) {
  return (
    <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid meet">
      <SceneInner scene={scene} fills={fills} onPickRegion={onPickRegion} selectedId={selectedId} />
    </svg>
  );
}
