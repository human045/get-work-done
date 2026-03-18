import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './firebase';
import { getWorks } from './storage';
import { applyTheme } from './themes';
import { ensureLeaderboardEntry, getMyPoints } from './points';
import './App.css';

import Topbar from './components/Topbar';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import WorkPage from './components/WorkPage';
import ProfilePage from './components/ProfilePage';
import Leaderboard from './components/Leaderboard';

const THEME_KEY = 'gwd_theme';
const GUEST_KEY = 'gwd_guest';

function getInitials(user) {
  if (!user) return 'G';
  if (user.displayName) return user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return user.email?.[0]?.toUpperCase() || 'U';
}

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [myPoints, setMyPoints] = useState(null);
  // page: 'dashboard' | 'work' | 'profile' | 'leaderboard'
  const [page, setPage] = useState('dashboard');
  const [openWork, setOpenWork] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'github-dark');

  useEffect(() => { applyTheme(theme); localStorage.setItem(THEME_KEY, theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setAuthState('authed');
        setWorks(await getWorks(u.uid));
        // Set up leaderboard entry and load points
        await ensureLeaderboardEntry(u.uid, u.displayName || u.email?.split('@')[0], getInitials(u));
        const pts = await getMyPoints(u.uid);
        setMyPoints(pts);
      } else {
        const isGuest = localStorage.getItem(GUEST_KEY) === '1';
        if (isGuest) {
          setUser(null); setAuthState('guest');
          setWorks(await getWorks(null));
        } else {
          setUser(null); setAuthState('unauthed');
        }
      }
    });
    return unsub;
  }, []);

  // Refresh points when returning to dashboard
  async function refreshPoints(uid) {
    if (!uid) return;
    const pts = await getMyPoints(uid);
    setMyPoints(pts);
  }

  function handleGuest() {
    localStorage.setItem(GUEST_KEY, '1');
    setAuthState('guest');
    const stored = JSON.parse(localStorage.getItem('gwd_data') || '{"works":[]}');
    setWorks(stored.works || []);
  }

  function handleWorkUpdate(updated) {
    setWorks(prev => prev.map(w => w.id === updated.id ? updated : w));
    if (openWork?.id === updated.id) setOpenWork(updated);
  }

  function handleSignOut() {
    localStorage.removeItem(GUEST_KEY);
    setAuthState('unauthed');
    setUser(null); setWorks([]); setMyPoints(null);
    setOpenWork(null); setPage('dashboard');
  }

  function openWorkPage(work) { setOpenWork(work); setPage('work'); }
  function goBack() {
    if (page === 'work' && user) refreshPoints(user.uid);
    setPage('dashboard'); setOpenWork(null);
  }

  if (authState === 'loading') {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="loading-spinner" />
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  const uid = user?.uid || null;
  const loggedIn = authState === 'authed' || authState === 'guest';

  return (
    <div className="app">
      <Topbar
        user={user}
        isGuest={authState === 'guest'}
        theme={theme}
        setTheme={setThemeState}
        myPoints={myPoints}
        showBack={page !== 'dashboard'}
        onBack={goBack}
        onSignOut={handleSignOut}
        onOpenProfile={() => setPage('profile')}
        onOpenLeaderboard={() => setPage('leaderboard')}
      />

      {!loggedIn ? (
        <AuthScreen onGuest={handleGuest} />
      ) : page === 'work' && openWork ? (
        <WorkPage
          key={openWork.id}
          work={openWork}
          uid={uid}
          onBack={goBack}
          onWorkUpdate={handleWorkUpdate}
        />
      ) : page === 'profile' ? (
        <ProfilePage user={user} isGuest={authState === 'guest'} uid={uid} myPoints={myPoints} />
      ) : page === 'leaderboard' ? (
        <Leaderboard uid={uid} myPoints={myPoints} />
      ) : (
        <Dashboard
          works={works}
          setWorks={setWorks}
          uid={uid}
          onOpenWork={openWorkPage}
          onOpenProfile={() => setPage('profile')}
        />
      )}
    </div>
  );
}
