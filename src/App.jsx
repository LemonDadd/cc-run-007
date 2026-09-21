import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/appStore.js';
import { useProgressStore } from './store/progressStore.js';
import BadgePopup from './components/BadgePopup.jsx';

import ProfileSelect from './pages/ProfileSelect.jsx';
import Home from './pages/Home.jsx';
import ColorWall from './pages/ColorWall.jsx';
import ColorDetail from './pages/ColorDetail.jsx';
import Discriminate from './pages/Discriminate.jsx';
import MixLab from './pages/MixLab.jsx';
import Match from './pages/Match.jsx';
import ColorIn from './pages/ColorIn.jsx';
import Diary from './pages/Diary.jsx';
import Gallery from './pages/Gallery.jsx';
import Reward from './pages/Reward.jsx';
import ParentPanel from './pages/ParentPanel.jsx';

function RequireProfile({ children }) {
  const currentProfileId = useAppStore((s) => s.currentProfileId);
  const location = useLocation();
  if (!currentProfileId) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}

// 学习时长计时：前台每 10 秒累计一次（切后台自动暂停）
function StudyTimer() {
  const currentProfileId = useAppStore((s) => s.currentProfileId);
  const addStudySeconds = useAppStore((s) => s.addStudySeconds);
  const tickRef = useRef(null);
  useEffect(() => {
    const start = () => {
      clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        if (!document.hidden && currentProfileId) addStudySeconds(currentProfileId, 10);
      }, 10000);
    };
    start();
    return () => clearInterval(tickRef.current);
  }, [currentProfileId, addStudySeconds]);
  return null;
}

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const currentProfileId = useAppStore((s) => s.currentProfileId);
  const loadFor = useProgressStore((s) => s.loadFor);
  const resetForCurrent = useProgressStore((s) => s.resetForCurrent);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (ready && currentProfileId) loadFor(currentProfileId);
    if (!currentProfileId) resetForCurrent();
  }, [ready, currentProfileId, loadFor, resetForCurrent]);

  if (!ready) {
    return (
      <div className="page-bg flex h-full items-center justify-center">
        <div className="animate-floaty text-center">
          <div className="text-8xl">🎨</div>
          <div className="mt-4 font-cname text-purple-500">ColoKid 色彩乐园</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-full">
      <StudyTimer />
      <Routes>
        <Route path="/" element={<ProfileSelect />} />
        <Route
          path="/home"
          element={
            <RequireProfile>
              <Home />
            </RequireProfile>
          }
        />
        <Route
          path="/colors"
          element={
            <RequireProfile>
              <ColorWall />
            </RequireProfile>
          }
        />
        <Route
          path="/color/:id"
          element={
            <RequireProfile>
              <ColorDetail />
            </RequireProfile>
          }
        />
        <Route
          path="/game/discriminate"
          element={
            <RequireProfile>
              <Discriminate />
            </RequireProfile>
          }
        />
        <Route
          path="/lab"
          element={
            <RequireProfile>
              <MixLab />
            </RequireProfile>
          }
        />
        <Route
          path="/match"
          element={
            <RequireProfile>
              <Match />
            </RequireProfile>
          }
        />
        <Route
          path="/color-in"
          element={
            <RequireProfile>
              <ColorIn />
            </RequireProfile>
          }
        />
        <Route
          path="/diary"
          element={
            <RequireProfile>
              <Diary />
            </RequireProfile>
          }
        />
        <Route
          path="/gallery"
          element={
            <RequireProfile>
              <Gallery />
            </RequireProfile>
          }
        />
        <Route
          path="/reward"
          element={
            <RequireProfile>
              <Reward />
            </RequireProfile>
          }
        />
        <Route path="/parent" element={<ParentPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BadgePopup />
    </div>
  );
}
