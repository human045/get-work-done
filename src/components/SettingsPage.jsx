import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { updateProfile as updateLeaderboardProfile, isUsernameTaken } from '../points';

const AVATAR_COLORS = [
  { id: 'default',  bg: 'linear-gradient(135deg, var(--md-primary-container), var(--md-primary))', label: 'Default' },
  { id: 'rose',     bg: 'linear-gradient(135deg, #f43f5e, #e11d48)', label: 'Rose' },
  { id: 'orange',   bg: 'linear-gradient(135deg, #f97316, #ea580c)', label: 'Orange' },
  { id: 'amber',    bg: 'linear-gradient(135deg, #f59e0b, #d97706)', label: 'Amber' },
  { id: 'emerald',  bg: 'linear-gradient(135deg, #10b981, #059669)', label: 'Emerald' },
  { id: 'cyan',     bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', label: 'Cyan' },
  { id: 'violet',   bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', label: 'Violet' },
  { id: 'pink',     bg: 'linear-gradient(135deg, #ec4899, #db2777)', label: 'Pink' },
];

function getAvatarBg(colorId) {
  return AVATAR_COLORS.find(c => c.id === colorId)?.bg || AVATAR_COLORS[0].bg;
}

export function resolveAvatarBg(colorId) {
  const c = AVATAR_COLORS.find(c => c.id === colorId);
  return c?.bg || AVATAR_COLORS[0].bg;
}

export default function SettingsPage({ user, myPoints, onPointsRefresh }) {
  const [displayName, setDisplayName]   = useState(user?.displayName || '');
  const [username, setUsername]         = useState(myPoints?.username || '');
  const [status, setStatus]             = useState(myPoints?.status || '');
  const [avatarColor, setAvatarColor]   = useState(myPoints?.avatarColor || 'default');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | taken | available
  const [errors, setErrors]             = useState({});
  const usernameTimer = useRef(null);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setUsername(myPoints?.username || '');
    setStatus(myPoints?.status || '');
    setAvatarColor(myPoints?.avatarColor || 'default');
  }, [user, myPoints]);

  // Username availability check
  useEffect(() => {
    const val = username.trim().toLowerCase();
    if (!val || val === (myPoints?.username || '').toLowerCase()) {
      setUsernameStatus('idle'); return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(val)) {
      setUsernameStatus('invalid'); return;
    }
    setUsernameStatus('checking');
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      const taken = await isUsernameTaken(val, user.uid);
      setUsernameStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(usernameTimer.current);
  }, [username, myPoints?.username, user?.uid]);

  function validate() {
    const errs = {};
    if (!displayName.trim()) errs.displayName = 'Name cannot be empty';
    const uval = username.trim().toLowerCase();
    if (uval && !/^[a-z0-9_]{3,20}$/.test(uval))
      errs.username = 'Username: 3–20 chars, letters, numbers, underscores only';
    if (usernameStatus === 'taken') errs.username = 'This username is taken';
    if (usernameStatus === 'checking') errs.username = 'Checking availability...';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true); setErrors({});
    try {
      // Update Firebase Auth display name
      if (displayName.trim() !== user.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: displayName.trim() });
      }
      // Update leaderboard doc
      await updateLeaderboardProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase() || null,
        avatarColor,
        status,
      });
      await onPointsRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErrors({ general: 'Save failed. Please try again.' });
    }
    setSaving(false);
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'U');

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px 48px',
      background: 'var(--md-surface)',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.2px' }}>Settings</div>
          <div style={{ fontSize: 14, color: 'var(--md-outline)', marginTop: 3 }}>Manage your profile and preferences</div>
        </div>

        {/* ── Avatar preview + color picker ── */}
        <div style={{
          background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-xl)', padding: '20px 22px', marginBottom: 16,
          boxShadow: 'var(--md-elev-1)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 16 }}>
            Avatar
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: getAvatarBg(avatarColor),
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700,
              boxShadow: 'var(--md-elev-2)',
              transition: 'background 0.3s',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{displayName || 'Your Name'}</div>
              {username && <div style={{ fontSize: 12, color: 'var(--md-outline)' }}>@{username}</div>}
            </div>
          </div>

          {/* Color swatches */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {AVATAR_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setAvatarColor(c.id)}
                title={c.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: c.bg,
                  border: avatarColor === c.id ? '3px solid var(--md-on-surface)' : '3px solid transparent',
                  outline: avatarColor === c.id ? '2px solid var(--md-primary)' : 'none',
                  outlineOffset: 2,
                  cursor: 'pointer', padding: 0,
                  transition: 'transform 0.15s, outline 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {avatarColor === c.id && <Check size={14} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Profile fields ── */}
        <div style={{
          background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-xl)', padding: '20px 22px', marginBottom: 16,
          boxShadow: 'var(--md-elev-1)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 16 }}>
            Profile Info
          </div>

          {/* Display name */}
          <Field
            label="Display Name"
            hint="Shown everywhere on the app"
            error={errors.displayName}
          >
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
              maxLength={40}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
            />
          </Field>

          {/* Username */}
          <Field
            label="Username"
            hint="@username — others can search you by this"
            error={errors.username}
          >
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--md-outline)', fontSize: 15, pointerEvents: 'none',
              }}>@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                placeholder="yourname"
                maxLength={20}
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
              />
              {/* Status indicator */}
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {usernameStatus === 'checking' && <div className="loading-spinner" style={{ width: 14, height: 14 }} />}
                {usernameStatus === 'available' && <CheckCircle2 size={16} color="var(--md-success)" />}
                {usernameStatus === 'taken' && <AlertCircle size={16} color="var(--md-error)" />}
              </div>
            </div>
            {usernameStatus === 'available' && (
              <div style={{ fontSize: 11, color: 'var(--md-success)', marginTop: 4 }}>@{username.trim().toLowerCase()} is available</div>
            )}
            {usernameStatus === 'taken' && (
              <div style={{ fontSize: 11, color: 'var(--md-error)', marginTop: 4 }}>This username is taken</div>
            )}
            {usernameStatus === 'invalid' && (
              <div style={{ fontSize: 11, color: 'var(--md-error)', marginTop: 4 }}>3–20 chars, letters/numbers/underscores only</div>
            )}
          </Field>

          {/* Status */}
          <Field label="Status" hint="Short message shown on your profile" last>
            <input
              value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="What are you working on?"
              maxLength={80}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
            />
            <div style={{ fontSize: 11, color: 'var(--md-outline)', textAlign: 'right', marginTop: 4 }}>
              {80 - status.length} left
            </div>
          </Field>
        </div>

        {/* ── Save button ── */}
        {errors.general && (
          <div style={{ fontSize: 13, color: 'var(--md-error)', marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={14} /> {errors.general}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || usernameStatus === 'checking' || usernameStatus === 'taken'}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 'var(--md-shape-full)',
            background: saved ? 'var(--md-success)' : 'var(--md-primary)',
            color: saved ? '#fff' : 'var(--md-on-primary)',
            border: 'none', fontSize: 15, fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--md-font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.25s, transform 0.15s',
            transform: saving ? 'scale(0.98)' : 'scale(1)',
            boxShadow: 'var(--md-elev-1)',
            opacity: (usernameStatus === 'taken' || usernameStatus === 'checking') ? 0.6 : 1,
          }}
        >
          {saving ? (
            <><div className="loading-spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> Saving...</>
          ) : saved ? (
            <><Check size={18} /> Saved!</>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--md-surface-2)',
  border: '1px solid var(--md-outline-var)',
  borderRadius: 'var(--md-shape-sm)',
  padding: '11px 14px',
  color: 'var(--md-on-surface)',
  fontSize: 14, fontFamily: 'var(--md-font)',
  outline: 'none',
  transition: 'border-color 0.2s',
};

function Field({ label, hint, error, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 5 }}>
        {label}
      </div>
      {children}
      {hint && !error && (
        <div style={{ fontSize: 11, color: 'var(--md-outline)', marginTop: 4 }}>{hint}</div>
      )}
      {error && (
        <div style={{ fontSize: 11, color: 'var(--md-error)', marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  );
}
