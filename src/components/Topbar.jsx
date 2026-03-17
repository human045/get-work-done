import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Github, Palette, LogOut, ArrowLeft } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { themes } from '../themes';

export default function Topbar({ user, isGuest, theme, setTheme, showBack, onBack, onSignOut }) {
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

  const themeIcons = {
    'github-dark': <Github size={13} />,
    'dark': <Moon size={13} />,
    'light': <Sun size={13} />
  };
  const themeColors = { 'github-dark': '#58a6ff', 'dark': '#7c85ff', 'light': '#f59e0b' };

  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email ? user.email[0].toUpperCase() : 'U')
    : 'G';

  async function handleSignOut() {
    setUserOpen(false);
    if (!isGuest) {
      try { await signOut(auth); } catch (e) { console.error(e); }
    }
    onSignOut();
  }

  return (
    <div className="topbar">
      {showBack && (
        <button className="btn-icon" onClick={onBack} title="Back to dashboard" style={{ marginRight: 4 }}>
          <ArrowLeft size={17} />
        </button>
      )}

      <div className="topbar-logo">
        <span style={{ color: 'var(--accent)' }}>●</span>
        {' '}Get Work <span style={{ color: 'var(--accent)' }}>Done</span>
      </div>

      {isGuest && (
        <span style={{
          fontSize: 10, background: 'var(--bg3)', color: 'var(--text3)',
          border: '1px solid var(--border)', borderRadius: 4,
          padding: '2px 7px', letterSpacing: '0.05em', fontWeight: 500,
        }}>GUEST</span>
      )}

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <div className="theme-picker" ref={themeRef}>
          <button className="btn-icon" onClick={() => setThemeOpen(o => !o)} title="Change theme">
            <Palette size={16} />
          </button>
          {themeOpen && (
            <div className="theme-menu scale-in">
              {Object.entries(themes).map(([key, t]) => (
                <button
                  key={key}
                  className={`theme-option ${theme === key ? 'active' : ''}`}
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                >
                  <span className="theme-dot" style={{ background: themeColors[key] }} />
                  {themeIcons[key]}
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu" ref={userRef}>
          <button className="user-avatar" onClick={() => setUserOpen(o => !o)}>{initials}</button>
          {userOpen && (
            <div className="user-dropdown scale-in">
              <div className="user-info">
                <div className="user-name">
                  {user?.displayName || (isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User')}
                </div>
                <div className="user-email">
                  {user?.email || (isGuest ? 'Data saved locally on this device' : '')}
                </div>
              </div>
              <button className="dropdown-item danger" onClick={handleSignOut}>
                <LogOut size={13} />
                {isGuest ? 'Exit guest mode' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
