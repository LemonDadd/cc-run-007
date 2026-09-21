// 交互色轮（SVG）：展示配色规则连线
import { BASE_COLORS } from '../data/colors.js';
import { wheelAngle, WHEEL_ORDER } from '../lib/colorWheel.js';

const CX = 150;
const CY = 150;
const R = 112;

export function colorPos(id, radius = R) {
  const a = ((wheelAngle(id) ?? 0) * Math.PI) / 180;
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}

export default function ColorWheel({ highlight = [], links = [], size = 300 }) {
  const colors = WHEEL_ORDER.map((id) => BASE_COLORS.find((c) => c.id === id));
  return (
    <svg viewBox="0 0 300 300" style={{ width: size, height: size }}>
      <circle cx={CX} cy={CY} r={R + 26} fill="#ffffffaa" />
      {links.map((pair, i) => {
        const [x1, y1] = colorPos(pair[0]);
        const [x2, y2] = colorPos(pair[1]);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#8B7BD8"
            strokeWidth="6"
            strokeDasharray="10 8"
            strokeLinecap="round"
            opacity="0.8"
          />
        );
      })}
      {links.length === 3 &&
        (() => {
          const [x1, y1] = colorPos(links[0]);
          const [x2, y2] = colorPos(links[2]);
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B7BD8" strokeWidth="6" strokeDasharray="10 8" opacity="0.8" />;
        })()}
      {colors.map((c) => {
        const [x, y] = colorPos(c.id);
        const on = highlight.includes(c.id);
        return (
          <g key={c.id}>
            {on && <circle cx={x} cy={y} r="28" fill="none" stroke="#FF8A1E" strokeWidth="5" />}
            <circle cx={x} cy={y} r="22" fill={c.hex} stroke="#ffffff" strokeWidth="4" />
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r="30" fill="#fff" stroke="#E4DCFF" strokeWidth="4" />
      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="22" fill="#6C5CE7" fontWeight="bold">
        色轮
      </text>
    </svg>
  );
}
