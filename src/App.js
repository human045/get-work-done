import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './firebase';
import { getWorks } from './storage';
import { applyTheme } from './themes';
import './App.css';

import Topbar from './components/Topbar';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import WorkPage from './components/WorkPage';

const THEME_KEY = 'gwd_theme';
const GUEST_KEY = 'gwd_guest';

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [openWork, setOpenWork] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'github-dark');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function setTheme(t) { setThemeState(t); }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setAuthState('authed');
        const loaded = await getWorks(u.uid);
        setWorks(loaded);
      } else {
        const isGuest = localStorage.getItem(GUEST_KEY) === '1';
        if (isGuest) {
          setUser(null);
          setAuthState('guest');
          const loaded = await getWorks(null);
          setWorks(loaded);
        } else {
          setUser(null);
          setAuthState('unauthed');
        }
      }
    });
    return unsub;
  }, []);

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
    setUser(null);
    setWorks([]);
    setOpenWork(null);
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
        setTheme={setTheme}
        showBack={!!openWork}
        onBack={() => setOpenWork(null)}
        onSignOut={handleSignOut}
      />

      {!loggedIn ? (
        <AuthScreen onGuest={handleGuest} />
      ) : openWork ? (
        <WorkPage
          key={openWork.id}
          work={openWork}
          uid={uid}
          onBack={() => setOpenWork(null)}
          onWorkUpdate={handleWorkUpdate}
        />
      ) : (
        <Dashboard
          works={works}
          setWorks={setWorks}
          uid={uid}
          onOpenWork={setOpenWork}
        />
      )}
    </div>
  );
}
