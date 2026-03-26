import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './firebase';
import { getWorks, getWorkspaces } from './storage';
import { applyTheme } from './themes';
import { ensureLeaderboardEntry, getMyPoints } from './points';
import './App.css';

import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import WorkPage from './components/WorkPage';
import ProfilePage from './components/ProfilePage';
import PublicProfilePage from './components/PublicProfilePage';
import Leaderboard from './components/Leaderboard';
import FriendsPanel from './components/FriendsPanel';
import SettingsPage from './components/SettingsPage';
import PomodoroTimer from './components/PomodoroTimer';
import UpcomingPage from './components/UpcomingPage';
import ExpenseTracker from './components/ExpenseTracker';
<<<<<<< HEAD
=======
import BottomNav from './components/BottomNav';
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)

const THEME_KEY  = 'gwd_theme';
const GUEST_KEY  = 'gwd_guest';
const NAV_KEY    = 'gwd_nav';
const SIDEBAR_KEY = 'gwd_sidebar';

function getInitials(user) {
  if (!user) return 'G';
  if (user.displayName) return user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return user.email?.[0]?.toUpperCase() || 'U';
}

function readNav() {
  try { return JSON.parse(sessionStorage.getItem(NAV_KEY)) || {}; }
  catch { return {}; }
}
function saveNav(state) { sessionStorage.setItem(NAV_KEY, JSON.stringify(state)); }

export default function App() {
  const [authState, setAuthState]   = useState('loading');
  const [user, setUser]             = useState(null);
  const [works, setWorks]           = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [myPoints, setMyPoints]     = useState(null);
  const [page, setPageState]        = useState(() => readNav().page || 'dashboard');
  const [openWork, setOpenWork]     = useState(null);
  const [publicUid, setPublicUid]   = useState(() => readNav().publicUid || null);
  const [activeWsId, setActiveWsId] = useState('general');
  const [showAddWork, setShowAddWork] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setThemeState]      = useState(() => localStorage.getItem(THEME_KEY) || 'github-dark');

  function setPage(p, extra = {}) {
    setPageState(p);
    saveNav({ page: p, ...extra });
    setMobileMenuOpen(false);
  }

  useEffect(() => { applyTheme(theme); localStorage.setItem(THEME_KEY, theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setAuthState('authed');
        const [loaded, wss] = await Promise.all([getWorks(u.uid), getWorkspaces(u.uid)]);
        setWorks(loaded);
        setWorkspaces(wss);
        await ensureLeaderboardEntry(u.uid, u.displayName || u.email?.split('@')[0], getInitials(u));
        setMyPoints(await getMyPoints(u.uid));

        const nav = readNav();
        if (nav.page === 'work' && nav.workId) {
          const work = loaded.find(w => w.id === nav.workId);
          if (work) setOpenWork(work); else setPage('dashboard');
        }
        if (nav.page === 'publicProfile' && nav.publicUid) setPublicUid(nav.publicUid);
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

  async function refreshPoints() {
    if (!user?.uid) return;
    setMyPoints(await getMyPoints(user.uid));
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
    setUser(null); setWorks([]); setWorkspaces([]); setMyPoints(null);
    setOpenWork(null); setPublicUid(null); setPage('dashboard');
  }

  function openWorkPage(work) {
    // stamp updatedAt for recents
    const stamped = { ...work, updatedAt: Date.now() };
    setOpenWork(stamped);
    setPage('work', { workId: work.id });
  }

  function openPublicProfile(uid) {
    setPublicUid(uid);
    setPage('publicProfile', { publicUid: uid });
  }

  function goBack() {
    if (page === 'work' && user) refreshPoints();
    setPublicUid(null); setOpenWork(null);
    setPage('dashboard');
  }

  function toggleSidebar() {
    setSidebarCollapsed(c => {
      const next = !c;
      localStorage.setItem(SIDEBAR_KEY, next);
      return next;
    });
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

  const uid      = user?.uid || null;
  const loggedIn = authState === 'authed' || authState === 'guest';
  const showSidebar = loggedIn && page !== 'work';

  return (
    <div className="app">
      <Topbar
        user={user}
        myPoints={myPoints}
        isGuest={authState === 'guest'}
        theme={theme}
        setTheme={setThemeState}
        showBack={page !== 'dashboard'}
        onBack={goBack}
        onHome={goBack}
        onSignOut={handleSignOut}
        onOpenProfile={() => setPage('profile')}
        onOpenLeaderboard={() => setPage('leaderboard')}
        onOpenSettings={() => setPage('settings')}
        onMenuToggle={() => setMobileMenuOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar overlay for mobile */}
        <div className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            collapsed={sidebarCollapsed}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            onToggle={toggleSidebar}
            works={works}
            workspaces={workspaces}
            activeWsId={activeWsId}
            setActiveWsId={setActiveWsId}
            page={page}
            setPage={setPage}
            onOpenWork={openWorkPage}
            onNewWork={() => { setShowAddWork(true); setMobileMenuOpen(false); }}
            onNewWorkspace={() => {/* handled inside Dashboard/WorkspaceBar */}}
          />
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!loggedIn ? (
            <AuthScreen onGuest={handleGuest} />
          ) : page === 'work' && openWork ? (
            <WorkPage key={openWork.id} work={openWork} uid={uid} myPoints={myPoints} onBack={goBack} onWorkUpdate={handleWorkUpdate} />
          ) : page === 'profile' ? (
            <ProfilePage user={user} isGuest={authState === 'guest'} uid={uid} myPoints={myPoints} onViewPublicProfile={openPublicProfile} />
          ) : page === 'leaderboard' ? (
            <Leaderboard uid={uid} myPoints={myPoints} onViewProfile={openPublicProfile} />
          ) : page === 'settings' ? (
            <SettingsPage user={user} myPoints={myPoints} onPointsRefresh={refreshPoints} />
          ) : page === 'publicProfile' && publicUid ? (
            <PublicProfilePage targetUid={publicUid} myUid={uid} myName={user?.displayName || user?.email?.split('@')[0] || 'User'} myInitials={getInitials(user)} />
          ) : page === 'pomodoro' ? (
            <PomodoroTimer works={works} onWorkUpdate={handleWorkUpdate} uid={uid} />
          ) : page === 'expense-tracker' ? (
            <ExpenseTracker uid={uid} user={user} isGuest={authState === 'guest'} />
          ) : page === 'upcoming' ? (
            <UpcomingPage works={works} onOpenWork={openWorkPage} workspaces={workspaces} />
          ) : (
            <Dashboard
              works={works}
              setWorks={setWorks}
              uid={uid}
              onOpenWork={openWorkPage}
              onOpenProfile={() => setPage('profile')}
              workspaces={workspaces}
              setWorkspaces={setWorkspaces}
              activeWsId={activeWsId}
              setActiveWsId={setActiveWsId}
              showAddWork={showAddWork}
              setShowAddWork={setShowAddWork}
            />
          )}
        </div>
      </div>

      {loggedIn && (
        <FriendsPanel user={user} isGuest={authState === 'guest'} myPoints={myPoints} onViewProfile={openPublicProfile} />
      )}
      
      {showSidebar && (
        <BottomNav page={page} setPage={setPage} onMenuToggle={() => setMobileMenuOpen(true)} />
      )}
    </div>
  );
}
