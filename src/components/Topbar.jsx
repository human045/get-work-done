import { useState, useEffect, useRef } from 'react';
import { Palette, LogOut, ArrowLeft, User, Trophy, Moon, Sun, Settings } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { themes } from '../themes';

export default function Topbar({ user, isGuest, theme, setTheme, showBack, onBack, onSignOut, onOpenProfile, onOpenLeaderboard, onOpenSettings, myPoints, onHome }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const themeRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email ? user.email[0].toUpperCase() : 'U')
    : 'G';

  async function handleSignOut() {
    setUserOpen(false);
    if (!isGuest) { try { await signOut(auth); } catch (e) {} }
    onSignOut();
  }

  const darkThemes = Object.entries(themes).filter(([, t]) => t.dark);
  const lightThemes = Object.entries(themes).filter(([, t]) => !t.dark);

  return (
    <div className="topbar">
      {showBack && (
        <button className="btn-icon" onClick={onBack} title="Back" style={{ marginRight: 4 }}>
          <ArrowLeft size={20} />
        </button>
      )}

      <button
        onClick={onHome}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--md-font)', padding: '4px 8px',
        }}
      >
        <div className="topbar-logo">Get Work Done</div>
      </button>

      {isGuest && (
        <span style={{
          fontSize: 11, background: 'color-mix(in srgb, var(--md-primary) 12%, transparent)',
          color: 'var(--md-primary)', borderRadius: 'var(--md-shape-full)',
          padding: '3px 10px', fontWeight: 500, letterSpacing: '0.3px',
        }}>Guest</span>
      )}

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        {/* Points pill */}
        {myPoints !== null && !isGuest && (
          <button
            onClick={onOpenLeaderboard}
            title="View leaderboard"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'color-mix(in srgb, var(--md-tertiary) 16%, transparent)',
              border: 'none', borderRadius: 'var(--md-shape-full)',
              padding: '6px 14px', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--md-mono)', color: 'var(--md-star)',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--md-tertiary) 24%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--md-tertiary) 16%, transparent)'}
          >
            <Trophy size={12} />
            {myPoints?.totalPoints ?? 0}
          </button>
        )}

        {isGuest && (
          <button className="btn-icon" onClick={onOpenLeaderboard} title="Leaderboard">
            <Trophy size={20} />
          </button>
        )}

        {/* Theme picker */}
        <div className="theme-picker" ref={themeRef}>
          <button className="btn-icon" onClick={() => setThemeOpen(o => !o)} title="Change theme">
            <Palette size={20} />
          </button>
          {themeOpen && (
            <div className="theme-menu scale-in" style={{ minWidth: 220 }}>
              <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Moon size={11} /> Dark
              </div>
              {darkThemes.map(([key, t]) => (
                <button
                  key={key}
                  className={`theme-option ${theme === key ? 'active' : ''}`}
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                >
                  <span className="theme-dot" style={{ background: t.primary, boxShadow: `0 0 0 2px ${t.surface}, 0 0 0 3.5px ${t.primary}` }} />
                  {t.name}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--md-outline-var)', margin: '4px 0' }} />
              <div style={{ padding: '4px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sun size={11} /> Light
              </div>
              {lightThemes.map(([key, t]) => (
                <button
                  key={key}
                  className={`theme-option ${theme === key ? 'active' : ''}`}
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                >
                  <span className="theme-dot" style={{ background: t.primary, boxShadow: `0 0 0 2px ${t.surface}, 0 0 0 3.5px ${t.primary}` }} />
                  {t.name}
                </button>
              ))}
              <div style={{ height: 8 }} />
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="user-menu" ref={userRef}>
          <button className="user-avatar" onClick={() => setUserOpen(o => !o)}>{initials}</button>
          {userOpen && (
            <div className="user-dropdown scale-in">
              <div className="user-info">
                <div className="user-name">
                  {user?.displayName || (isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User')}
                </div>
                <div className="user-email">
                  {user?.email || (isGuest ? 'Data saved locally' : '')}
                </div>
                {myPoints && (
                  <div style={{ fontSize: 12, color: 'var(--md-star)', marginTop: 5, fontWeight: 600 }}>
                    🏆 {myPoints.totalPoints} points
                  </div>
                )}
              </div>
              {!isGuest && (
                <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenProfile(); }}>
                  <User size={16} /> View Profile
                </button>
              )}
              {!isGuest && (
                <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenSettings(); }}>
                  <Settings size={16} /> Settings
                </button>
              )}
              <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenLeaderboard(); }}>
                <Trophy size={16} /> Leaderboard
              </button>
              <button className="dropdown-item danger" onClick={handleSignOut}>
                <LogOut size={16} />
                {isGuest ? 'Exit guest mode' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
