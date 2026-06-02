import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getProfile, saveProfile, enableCloudSync, disableCloudSync, syncFromCloud } from './data/db';
import { auth } from './services/supabase';
import type { UserProfile } from './types';
import type { User } from '@supabase/supabase-js';

import DashboardScreen from './pages/Dashboard';
import MealScreen from './pages/MealRecord';
import WeightScreen from './pages/WeightTracker';
import ExerciseScreen from './pages/ExerciseTracker';
import HabitScreen from './pages/HabitTracker';
import SettingsScreen from './pages/Settings';
import CoachingScreen from './pages/Coaching';

type TabId = 'home' | 'meal' | 'weight' | 'exercise' | 'habit' | 'coaching' | 'settings';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home', icon: '📊', label: 'ホーム' },
  { id: 'meal', icon: '📸', label: '食事' },
  { id: 'weight', icon: '⚖️', label: '体重' },
  { id: 'exercise', icon: '🏃', label: '運動' },
  { id: 'habit', icon: '💧', label: '習慣' },
  { id: 'coaching', icon: '🤖', label: 'AI' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('settings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [mealJumpDate, setMealJumpDate] = useState('');

  const latestBodyRecord = useLiveQuery(
    () => db.bodyRecords.orderBy('date').last()
  );

  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    if (latestBodyRecord?.weight) {
      return { ...profile, weight: latestBodyRecord.weight };
    }
    return profile;
  }, [profile, latestBodyRecord]);

  // 認証状態の監視
  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
        enableCloudSync(user.id);
      } else {
        disableCloudSync();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 初回ロード + ログイン時の同期
  useEffect(() => {
    (async () => {
      const { data: { session } } = await auth.getSession();
      const user = session?.user ?? null;
      setAuthUser(user);

      if (user) {
        enableCloudSync(user.id);
        setSyncing(true);
        try {
          await syncFromCloud();
        } catch (e) {
          console.error('Sync error:', e);
        }
        setSyncing(false);
      }

      const p = await getProfile();
      if (p) {
        setProfile(p);
        setTab('home');
      }
      setLoading(false);
    })();
  }, []);

  const handleSaveProfile = async (p: UserProfile) => {
    await saveProfile(p);
    setProfile(p);
    setTab('home');
  };

  const handleSync = async () => {
    if (!authUser) return;
    setSyncing(true);
    try {
      await syncFromCloud();
      const p = await getProfile();
      if (p) setProfile(p);
    } catch (e) {
      console.error('Sync error:', e);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🍽️</div>
        <div style={{ color: 'var(--pri)', fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>
          CalorieSight
        </div>
        <div style={{ color: 'var(--sub)', fontSize: 12 }}>
          {syncing ? '☁️ クラウドと同期中...' : '読み込み中...'}
        </div>
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
          {authUser && (
            <span style={{ fontSize: 10, color: 'var(--ok)', marginLeft: 4 }}>☁️</span>
          )}
        </div>
        <button onClick={() => setTab('settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
            color: tab === 'settings' ? 'var(--pri)' : 'var(--sub)', padding: 4 }}>
          ⚙️
        </button>
      </header>

      {/* Sync indicator */}
      {syncing && (
        <div style={{ background: 'var(--pri-dim)', padding: '4px 16px', fontSize: 11,
          color: 'var(--pri)', textAlign: 'center' }}>
          ☁️ 同期中...
        </div>
      )}

      {/* Content */}
      <main style={{ padding: '6px 14px 76px' }}>
        {tab === 'home' && effectiveProfile && (
          <DashboardScreen profile={effectiveProfile} onNavigate={(t, date) => {
            if (date) setMealJumpDate(date);
            setTab(t);
          }} />
        )}
        {tab === 'meal' && effectiveProfile && (
          <MealScreen profile={effectiveProfile} jumpToDate={mealJumpDate} onJumpConsumed={() => setMealJumpDate('')} />
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
        {tab === 'coaching' && effectiveProfile && (
          <CoachingScreen profile={effectiveProfile} />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            profile={profile || undefined}
            onSave={handleSaveProfile}
            authUser={authUser}
            syncing={syncing}
            onSync={handleSync}
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
