import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import KidButton from '../components/KidButton.jsx';
import Feedback from '../components/Feedback.jsx';
import { BASE_COLORS, SIMILAR_GROUPS } from '../data/colors.js';
import { hslToHex, hexToHsl, isLight } from '../lib/colorMath.js';
import { useAppStore } from '../store/appStore.js';
import { useProgressStore } from '../store/progressStore.js';
import { sfx, speak } from '../lib/audio.js';

const COLOR_MAP = Object.fromEntries(BASE_COLORS.map((c) => [c.id, c]));

function pickN(arr, n, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// 生成第 qi 题
function makeQuestion(hard, qi) {
  let target;
  const options = [];
  if (hard) {
    const group = SIMILAR_GROUPS[qi % SIMILAR_GROUPS.length];
    const [a, b] = group.colors.map((id) => COLOR_MAP[id]);
    target = Math.random() < 0.5 ? a : b;
    const other = target.id === a.id ? b : a;
    // 目标色与相近色，再加入它们的“深浅变体”
    const target2 = hslToHex({ ...hexToHsl(target.hex), l: Math.min(80, hexToHsl(target.hex).l + 11) });
    const other1 = hslToHex({ ...hexToHsl(other.hex), l: Math.min(80, hexToHsl(other.hex).l + 10) });
    const other2 = hslToHex({ ...hexToHsl(other.hex), l: Math.max(28, hexToHsl(other.hex).l - 10) });
    const other3 = hslToHex({ ...hexToHsl(target.hex), l: Math.max(28, hexToHsl(target.hex).l - 12) });
    options.push(
      { hex: target.hex, isTarget: true },
      { hex: target2, isTarget: false, label: '这是深色还是浅色？' },
      { hex: other.hex, isTarget: false },
      { hex: other1, isTarget: false },
      { hex: other2, isTarget: false },
      { hex: other3, isTarget: false }
    );
  } else {
    target = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
    options.push({ hex: target.hex, isTarget: true });
    const distractors = pickN(
      BASE_COLORS.filter((c) => c.id !== target.id && !c.neutral),
      5
    );
    for (const d of distractors) options.push({ hex: d.hex, isTarget: false });
  }
  // 洗牌
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { target, options, wrongIds: [] };
}

export default function Discriminate() {
  const navigate = useNavigate();
  const dailyQuestions = useAppStore((s) => s.settings.dailyQuestions);
  const profileId = useAppStore((s) => s.currentProfileId);
  const recordRound = useProgressStore((s) => s.recordDiscriminateRound);

  const [hard, setHard] = useState(false);
  const [started, setStarted] = useState(false);
  const [qi, setQi] = useState(0);
  const [question, setQuestion] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState(null); // 当前题是否已答对
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(null); // { correct, total, stars }
  const [perColor, setPerColor] = useState({});
  const [wrongShake, setWrongShake] = useState(null);

  const total = dailyQuestions;

  const start = (h) => {
    setHard(h);
    setStarted(true);
    setQi(0);
    setCorrect(0);
    setPerColor({});
    setQuestion(makeQuestion(h, 0));
    setDone(null);
    speak(h ? '进阶挑战：相近的颜色也要分清楚哦' : '请找出我读出来的颜色');
  };

  const tapOption = async (opt) => {
    if (picked || feedback) return;
    const tid = question.target.id;
    const pc = { ...perColor };
    pc[tid] = pc[tid] || { correct: 0, total: 0 };
    pc[tid].total += 1;

    if (opt.isTarget) {
      pc[tid].correct += 1;
      setPerColor(pc);
      setPicked(true);
      sfx.correct();
      setFeedback({ type: 'correct', text: '答对啦！', tts: '答对啦，真棒' });
      setTimeout(() => nextQuestion(true, pc), 550);
    } else {
      // 答错：温和引导，本题可重试，不计入最终错误数之外的惩罚
      setWrongShake(opt.hex);
      sfx.gentle();
      setFeedback({
        type: 'gentle',
        text: '再看看～',
        sub: hard ? '注意深浅和颜色的小差别' : `我们要找的是「${question.target.name}」`,
        tts: hard ? '再看看，它们有点像哦' : `我们要找的是${question.target.name}`,
      });
      setTimeout(() => setWrongShake(null), 800);
      setTimeout(() => setFeedback(null), 1300);
    }
  };

  const nextQuestion = async (isCorrect, pc) => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setCorrect(nextCorrect);
    setPicked(null);
    setFeedback(null);
    if (qi + 1 >= total) {
      const stars = await recordRound({
        correct: nextCorrect,
        total,
        hardMode: hard,
        perColor: pc,
      });
      sfx.win();
      setDone({ correct: nextCorrect, total, stars });
      speak(`完成啦！你答对了${nextCorrect}题`);
    } else {
      const nq = qi + 1;
      setQi(nq);
      const nqData = makeQuestion(hard, nq);
      setQuestion(nqData);
      setTimeout(() => speak(`找出${nqData.target.name}`), 200);
    }
  };

  // ---------- 开始屏 ----------
  if (!started) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader title="辨色游戏" />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-16">
          <div className="animate-floaty text-center">
            <div className="text-9xl">🔍</div>
            <h2 className="mt-4 font-cname text-slate-700" style={{ fontSize: 44 }}>
              听一听，找出对的颜色！
            </h2>
            <p className="mt-3 font-body text-slate-500">
              本轮共 {total} 题（家长设置的每日练习量）。没有倒计时，慢慢找就好～
            </p>
          </div>
          <div className="grid w-full gap-5 sm:grid-cols-2">
            <button
              onClick={() => start(false)}
              className="pressable flex flex-col items-center gap-2 rounded-[40px] bg-gradient-to-b from-sky-400 to-blue-500 p-8 text-white shadow-kid"
            >
              <span className="text-7xl">🟦</span>
              <span className="font-cname" style={{ fontSize: 36 }}>
                基础辨色
              </span>
              <span className="font-body opacity-90">从 6 个色块里找一找</span>
            </button>
            <button
              onClick={() => start(true)}
              className="pressable flex flex-col items-center gap-2 rounded-[40px] bg-gradient-to-b from-violet-400 to-purple-500 p-8 text-white shadow-kid"
            >
              <span className="text-7xl">🌈</span>
              <span className="font-cname" style={{ fontSize: 36 }}>
                相近色挑战
              </span>
              <span className="font-body opacity-90">深蓝浅蓝、红橙、黄绿、紫粉</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 结算屏 ----------
  if (done) {
    const rate = Math.round((done.correct / done.total) * 100);
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6">
        <div className="card-kid animate-pop w-full p-10 text-center">
          <div className="text-8xl">{rate === 100 ? '🏆' : rate >= 80 ? '🌟' : '🌱'}</div>
          <h2 className="mt-4 font-cname text-slate-700" style={{ fontSize: 44 }}>
            本轮完成！
          </h2>
          <p className="mt-3 font-cname text-orange-500" style={{ fontSize: 52 }}>
            {done.correct} / {done.total}
          </p>
          <p className="font-body text-slate-500">正确率 {rate}%</p>
          <div className="mt-4 font-btn text-amber-500">
            {done.stars > 0 ? `+${done.stars} 颗星 ⭐` : '再玩一轮就能得到星星啦，继续加油！'}
          </div>
          <div className="mt-8 flex gap-4">
            <KidButton variant="ghost" onClick={() => navigate('/home')}>
              回首页
            </KidButton>
            <KidButton variant="blue" className="flex-1" onClick={() => start(false)}>
              再玩一轮
            </KidButton>
            <KidButton variant="purple" onClick={() => start(true)}>
              进阶挑战
            </KidButton>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 答题屏 ----------
  const q = question;
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title={hard ? '辨色 · 相近色挑战' : '辨色游戏'}
        right={
          <div className="mr-2 rounded-full bg-white px-5 py-2 font-btn text-slate-600 shadow-soft">
            第 {qi + 1}/{total} 题 · ✅ {correct}
          </div>
        }
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6">
        {/* 找色目标提示，占屏大块 */}
        <button
          onClick={() => speak(`找出${q.target.name}`)}
          data-target-hex={q.target.hex.toLowerCase()}
          className="pressable mx-auto flex w-full max-w-3xl items-center justify-center gap-6 rounded-[44px] py-8 shadow-kid"
          style={{
            background: `linear-gradient(160deg, ${q.target.hex}, ${q.target.hex}cc)`,
            color: isLight(q.target.hex) ? '#3b3550' : '#fff',
          }}
        >
          <span className="text-7xl">{q.target.emoji}</span>
          <span>
            <span className="block font-body opacity-90">找出</span>
            <span className="font-cname" style={{ fontSize: 64 }}>
              {q.target.name}
            </span>
          </span>
          <span className="text-5xl">🔊</span>
        </button>

        {hard && (
          <p className="mt-4 text-center font-body text-purple-500">
            小提示：注意它们的深浅、明暗差别哦～
          </p>
        )}

        {/* 选项色块 */}
        <div className="mt-auto grid flex-1 grid-cols-3 gap-5 py-8">
          {q.options.map((opt, i) => (
            <button
              key={i}
              data-hex={opt.hex.toLowerCase()}
              onClick={() => tapOption(opt)}
              className={`pressable min-h-[150px] rounded-[40px] shadow-kid ${
                wrongShake === opt.hex ? 'shake' : ''
              }`}
              style={{ backgroundColor: opt.hex }}
              aria-label="色块"
            />
          ))}
        </div>
      </div>

      {feedback && <Feedback type={feedback.type} text={feedback.text} sub={feedback.sub} tts={feedback.tts} onDone={() => setFeedback(null)} />}
    </div>
  );
}
