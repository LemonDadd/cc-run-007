import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import KidButton from '../components/KidButton.jsx';
import { sfx, speak } from '../lib/audio.js';
import { ageFromBirthday, cx } from '../lib/util.js';
import { deleteProfileFully } from '../lib/db.js';

const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐯', '🐸', '🦄', '🐱', '🐶', '🐵', '🐷', '🦁'];

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { profiles, createProfile, selectProfile, deleteProfile } = useAppStore();
  const [creating, setCreating] = useState(false);
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [confirmDel, setConfirmDel] = useState(null);

  const pick = (p) => {
    selectProfile(p.id);
    sfx.correct();
    speak(`你好呀，${p.nickname}！`);
    navigate('/home');
  };

  const submit = async () => {
    if (!nickname.trim()) return;
    const p = await createProfile({
      nickname: nickname.trim().slice(0, 12),
      birthday,
      avatar,
    });
    selectProfile(p.id);
    sfx.win();
    navigate('/home');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-10">
      <div className="animate-floaty text-center">
        <div className="text-7xl">🎨</div>
        <h1 className="mt-2 font-cname text-purple-500">ColoKid 儿童色彩乐园</h1>
        <p className="font-body text-slate-500">认颜色 · 调颜色 · 配颜色 · 用颜色</p>
      </div>

      {!creating && (
        <>
          <h2 className="mt-10 font-cname text-slate-600" style={{ fontSize: 34 }}>
            选择小朋友
          </h2>
          <div className="mt-6 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="card-kid relative flex items-center gap-5 p-6"
              >
                <button
                  onClick={() => pick(p)}
                  className="pressable flex flex-1 items-center gap-5 text-left"
                >
                  <span className="flex h-28 w-28 items-center justify-center rounded-full bg-amber-100 text-7xl shadow-inner">
                    {p.avatar}
                  </span>
                  <span>
                    <span className="block font-cname" style={{ fontSize: 36 }}>
                      {p.nickname}
                    </span>
                    {ageFromBirthday(p.birthday) != null && (
                      <span className="font-body text-slate-500">
                        {ageFromBirthday(p.birthday)} 岁
                      </span>
                    )}
                    <span className="mt-1 block font-body text-amber-500">⭐ {p.stars} 颗星</span>
                  </span>
                </button>
                <button
                  aria-label="删除档案"
                  onClick={() => setConfirmDel(p)}
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-xl text-red-400 pressable"
                >
                  🗑
                </button>
              </div>
            ))}
            {profiles.length < 4 && (
              <button
                onClick={() => {
                  sfx.click();
                  setCreating(true);
                }}
                className="pressable flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[32px] border-4 border-dashed border-purple-300 bg-white/60 p-6 text-purple-400"
              >
                <span className="text-6xl">➕</span>
                <span className="font-btn">添加新玩家</span>
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/parent')}
            className="mt-10 font-body text-slate-400 underline-offset-4 hover:underline"
          >
            家长入口
          </button>
        </>
      )}

      {creating && (
        <div className="card-kid mt-8 w-full max-w-2xl p-8">
          <h2 className="font-cname text-purple-500" style={{ fontSize: 34 }}>
            创建小玩家
          </h2>
          <label className="mt-6 block font-body text-slate-600">你的名字是？</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            placeholder="点这里输入名字"
            className="mt-2 w-full rounded-2xl border-4 border-amber-200 px-5 py-4 text-2xl outline-none focus:border-amber-400"
          />
          <label className="mt-6 block font-body text-slate-600">生日（可以不填）</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-2 rounded-2xl border-4 border-amber-200 px-5 py-4 text-2xl outline-none focus:border-amber-400"
          />
          <label className="mt-6 block font-body text-slate-600">选一个头像</label>
          <div className="mt-3 grid grid-cols-6 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  sfx.click();
                  setAvatar(a);
                }}
                className={cx(
                  'pressable flex h-20 items-center justify-center rounded-2xl text-4xl',
                  avatar === a ? 'bg-amber-200 ring-4 ring-amber-400' : 'bg-amber-50'
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="mt-8 flex gap-4">
            <KidButton variant="ghost" onClick={() => setCreating(false)}>
              返回
            </KidButton>
            <KidButton variant="primary" className="flex-1" disabled={!nickname.trim()} onClick={submit}>
              开始玩！
            </KidButton>
          </div>
        </div>
      )}

      {confirmDel && (
        <DeleteProfileGate
          profile={confirmDel}
          onCancel={() => setConfirmDel(null)}
          onConfirm={async () => {
            await deleteProfileFully(confirmDel.id);
            await deleteProfile(confirmDel.id);
            setConfirmDel(null);
          }}
        />
      )}
    </div>
  );
}

// 删除玩家档案需要家长 PIN（与家长面板同一套哈希校验）
function DeleteProfileGate({ profile, onCancel, onConfirm }) {
  const verifyPin = useAppStore((s) => s.verifyPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const tap = async (d) => {
    const next = (pin + String(d)).slice(0, 4);
    setPin(next);
    setError('');
    if (next.length === 4) {
      const ok = await verifyPin(next);
      if (ok) {
        onConfirm();
      } else {
        setError('家长密码不对，不能删除档案');
        setTimeout(() => setPin(''), 400);
      }
    }
  };
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-6">
      <div className="card-kid w-full max-w-md p-8 text-center">
        <div className="text-6xl">🗑</div>
        <p className="mt-4 font-btn text-slate-700">
          删除 {profile.nickname} 的全部档案？
        </p>
        <p className="mt-2 font-body text-slate-500">需要输入家长 4 位密码才能删除</p>
        <div className="mt-4 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-center rounded-2xl bg-slate-100" style={{ height: 60, width: 60 }}>
              <span className="text-4xl text-slate-600">{pin[i] ? '●' : ''}</span>
            </div>
          ))}
        </div>
        {error && <p className="mt-3 font-body text-red-400">{error}</p>}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} onClick={() => tap(d)} className="pressable flex h-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-slate-700 shadow-soft">
              {d}
            </button>
          ))}
          <button onClick={() => { setPin(''); setError(''); }} className="pressable rounded-2xl bg-slate-100 text-base text-slate-500">清除</button>
          <button onClick={() => tap(0)} className="pressable flex h-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-slate-700 shadow-soft">0</button>
          <div />
        </div>
        <div className="mt-6">
          <KidButton variant="ghost" className="w-full" onClick={onCancel}>
            再想想
          </KidButton>
        </div>
      </div>
    </div>
  );
}
