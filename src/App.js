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
import PublicProfilePage from './components/PublicProfilePage';
import Leaderboard from './components/Leaderboard';
import FriendsPanel from './components/FriendsPanel';

const THEME_KEY  = 'gwd_theme';
const GUEST_KEY  = 'gwd_guest';
const NAV_KEY    = 'gwd_nav'; // sessionStorage key for page persistence

function getInitials(user) {
  if (!user) return 'G';
  if (user.displayName) return user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return user.email?.[0]?.toUpperCase() || 'U';
}

// Read last nav state from sessionStorage
function readNav() {
  try { return JSON.parse(sessionStorage.getItem(NAV_KEY)) || {}; }
  catch { return {}; }
}
function saveNav(state) {
  sessionStorage.setItem(NAV_KEY, JSON.stringify(state));
}

export default function App() {
  const [authState, setAuthState]   = useState('loading');
  const [user, setUser]             = useState(null);
  const [works, setWorks]           = useState([]);
  const [myPoints, setMyPoints]     = useState(null);
  const [page, setPageState]        = useState(() => readNav().page || 'dashboard');
  const [openWork, setOpenWork]     = useState(null);
  const [publicUid, setPublicUid]   = useState(() => readNav().publicUid || null);
  const [theme, setThemeState]      = useState(() => localStorage.getItem(THEME_KEY) || 'github-dark');

  // Persist page state so reload restores the same view
  function setPage(p, extra = {}) {
    setPageState(p);
    saveNav({ page: p, ...extra });
  }

  useEffect(() => { applyTheme(theme); localStorage.setItem(THEME_KEY, theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setAuthState('authed');
        const loaded = await getWorks(u.uid);
        setWorks(loaded);
        await ensureLeaderboardEntry(u.uid, u.displayName || u.email?.split('@')[0], getInitials(u));
        const pts = await getMyPoints(u.uid);
        setMyPoints(pts);

        // Restore open work from sessionStorage if needed
        const nav = readNav();
        if (nav.page === 'work' && nav.workId) {
          const work = loaded.find(w => w.id === nav.workId);
          if (work) setOpenWork(work);
          else setPage('dashboard');
        }
        if (nav.page === 'publicProfile' && nav.publicUid) {
          setPublicUid(nav.publicUid);
        }
      } else {
        const isGuest = localStorage.getItem(GUEST_KEY) === '1';
        if (isGuest) {
          setUser(null); setAuthState('guest');
          setWorks(await getWorks(null));
        } else {
          setUser(null); setAuthState('unauthed');
          setPage('dashboard');
        }
      }
    });
    return unsub;
  }, []);

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
    sessionStorage.removeItem(NAV_KEY);
    setAuthState('unauthed');
    setUser(null); setWorks([]); setMyPoints(null);
    setOpenWork(null); setPublicUid(null); setPage('dashboard');
  }

  function openWorkPage(work) {
    setOpenWork(work);
    setPage('work', { workId: work.id });
  }

  function openPublicProfile(uid) {
    setPublicUid(uid);
    setPage('publicProfile', { publicUid: uid });
  }

  function goBack() {
    if (page === 'work' && user) refreshPoints(user.uid);
    setPublicUid(null);
    setOpenWork(null);
    setPage('dashboard');
  }

  if (authState === 'loading') {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="loading-spinner" />
          <div style={{ color: 'var(--md-outline)', fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  const uid     = user?.uid || null;
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
        onHome={goBack}
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
        <ProfilePage
          user={user}
          isGuest={authState === 'guest'}
          uid={uid}
          myPoints={myPoints}
          onViewPublicProfile={openPublicProfile}
        />
      ) : page === 'leaderboard' ? (
        <Leaderboard
          uid={uid}
          myPoints={myPoints}
          onViewProfile={openPublicProfile}
        />
      ) : page === 'publicProfile' && publicUid ? (
        <PublicProfilePage
          targetUid={publicUid}
          myUid={uid}
          myName={user?.displayName || user?.email?.split('@')[0] || 'User'}
          myInitials={getInitials(user)}
          onBack={goBack}
        />
      ) : (
        <Dashboard
          works={works}
          setWorks={setWorks}
          uid={uid}
          onOpenWork={openWorkPage}
          onOpenProfile={() => setPage('profile')}
        />
      )}

      {loggedIn && (
        <FriendsPanel
          user={user}
          isGuest={authState === 'guest'}
          myPoints={myPoints}
          onViewProfile={openPublicProfile}
        />
      )}
    </div>
  );
}
