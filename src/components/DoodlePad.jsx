import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { sfx } from '../lib/audio.js';

// Canvas 涂鸦板：支持鼠标/触摸、换色、橡皮、清空、导出 dataURL
const PALETTE = ['#E8384A', '#FF8A1E', '#FFD426', '#3CB54A', '#1FB8B0', '#2E7BE6', '#8A4FD0', '#FF8FB3', '#9C6433', '#2B2B33'];

const DoodlePad = forwardRef(function DoodlePad({ height = 360, photo, onDirtyChange }, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const last = useRef(null);
  const [color, setColor] = useState(PALETTE[6]);
  const [size, setSize] = useState(10);
  const [eraser, setEraser] = useState(false);

  const markDirty = () => {
    if (!dirty.current) {
      dirty.current = true;
      onDirtyChange?.(true);
    }
  };
  const markClean = () => {
    if (dirty.current) {
      dirty.current = false;
      onDirtyChange?.(false);
    }
  };

  // 初始化白底（有照片则铺照片）
  const setup = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * ratio;
    cv.height = height * ratio;
    const ctx = cv.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, height);
    // 重铺画布后，之前的涂鸦就没了
    markClean();
    if (photo) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height);
      };
      img.src = photo;
    }
  };

  useEffect(() => {
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useImperativeHandle(ref, () => ({
    clear() {
      const cv = canvasRef.current;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      if (photo) {
        const img = new Image();
        img.onload = () => {
          const rect = cv.getBoundingClientRect();
          ctx.drawImage(img, 0, 0, rect.width, height);
        };
        img.src = photo;
      }
      markClean();
    },
    hasContent() {
      return dirty.current;
    },
    toDataURL() {
      return canvasRef.current.toDataURL('image/jpeg', 0.85);
    },
  }));

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    last.current = pos(e);
    e.preventDefault();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = eraser ? '#ffffff' : color;
    ctx.lineWidth = eraser ? size * 2.4 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    // 只有真正画下笔迹才算有内容；只动橡皮、没画过不算
    if (!eraser) markDirty();
    e.preventDefault();
  };
  const end = () => {
    drawing.current = false;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        className="w-full touch-none rounded-3xl border-4 border-amber-200 bg-white shadow-inner"
        style={{ height }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setEraser(false);
              sfx.click();
            }}
            className="pressable h-11 w-11 rounded-full shadow-soft"
            style={{ backgroundColor: c, outline: !eraser && color === c ? '4px solid #FF8A1E' : 'none' }}
          />
        ))}
        <input
          type="range"
          min="4"
          max="28"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="ml-2 w-28"
          aria-label="画笔粗细"
        />
        <button
          onClick={() => setEraser((v) => !v)}
          className={`pressable rounded-2xl px-4 py-2 font-body ${eraser ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          🧽 橡皮
        </button>
        <button
          onClick={() => {
            ref.current?.clear();
            sfx.click();
          }}
          className="pressable rounded-2xl bg-slate-100 px-4 py-2 font-body text-slate-600"
        >
          🗑 清空
        </button>
      </div>
    </div>
  );
});

export default DoodlePad;
