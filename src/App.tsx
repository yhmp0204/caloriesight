import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getProfile, saveProfile } from './data/db';
import type { UserProfile } from './types';

// ── Screens (各画面のコンポーネント) ──
// 本番ではこれらを各ファイルに分割する
// 現段階ではApp.tsxに全て含めて動作確認を容易にする

import DashboardScreen from './pages/Dashboard';
import MealScreen from './pages/MealRecord';
import WeightScreen from './pages/WeightTracker';
import ExerciseScreen from './pages/ExerciseTracker';
import HabitScreen from './pages/HabitTracker';
import SettingsScreen from './pages/Settings';

type TabId = 'home' | 'meal' | 'weight' | 'exercise' | 'habit' | 'settings';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home', icon: '📊', label: 'ホーム' },
  { id: 'meal', icon: '📸', label: '食事' },
  { id: 'weight', icon: '⚖️', label: '体重' },
  { id: 'exercise', icon: '🏃', label: '運動' },
  { id: 'habit', icon: '💧', label: '習慣' },
  { id: 'settings', icon: '⚙️', label: '設定' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('settings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 最新の体重記録を取得（TDEE計算に使用）
  const latestBodyRecord = useLiveQuery(
    () => db.bodyRecords.orderBy('date').last()
  );

  // 最新体重を反映した実効プロフィール（設定画面以外で使用）
  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    if (latestBodyRecord?.weight) {
      return { ...profile, weight: latestBodyRecord.weight };
    }
    return profile;
  }, [profile, latestBodyRecord]);

  // 初回ロード
  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setTab('home');
      }
      setLoading(false);
    });
  }, []);

  // プロフィール保存
  const handleSaveProfile = async (p: UserProfile) => {
    await saveProfile(p);
    setProfile(p);
    setTab('home');
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🍽️</div>
        <div style={{ color: 'var(--pri)', fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>
          CalorieSight
        </div>
        <div style={{ color: 'var(--sub)', fontSize: 12 }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '10px 16px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'rgba(15,17,23,0.93)',
        backdropFilter: 'blur(10px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20 }}>🍽️</span>
          <span style={{ color: 'var(--pri)', fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
            CalorieSight
          </span>
        </div>
        <span style={{ color: 'var(--sub)', fontSize: 10 }}>v0.2</span>
      </header>

      {/* Content */}
      <main style={{ padding: '6px 14px 76px' }}>
        {tab === 'home' && effectiveProfile && (
          <DashboardScreen profile={effectiveProfile} onNavigate={setTab} />
        )}
        {tab === 'meal' && effectiveProfile && (
          <MealScreen profile={effectiveProfile} />
        )}
        {tab === 'weight' && effectiveProfile && (
          <WeightScreen profile={effectiveProfile} />
        )}
        {tab === 'exercise' && effectiveProfile && (
          <ExerciseScreen profile={effectiveProfile} />
        )}
        {tab === 'habit' && (
          <HabitScreen />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            profile={profile || undefined}
            onSave={handleSaveProfile}
          />
        )}
      </main>

      {/* Tab Bar */}
      <nav style={{
        display: 'flex', background: 'var(--card)',
        borderTop: '1px solid var(--bor)',
        padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              color: tab === t.id ? 'var(--pri)' : 'var(--sub)',
              transition: 'color .2s',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
