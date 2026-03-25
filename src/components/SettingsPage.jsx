import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, CheckCircle2, Camera, X } from 'lucide-react';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { updateProfile as updateLeaderboardProfile, isUsernameTaken } from '../points';

export const AVATAR_COLORS = [
  { id: 'default',  bg: 'linear-gradient(135deg, var(--md-primary-container), var(--md-primary))', label: 'Default' },
  { id: 'rose',     bg: 'linear-gradient(135deg, #f43f5e, #e11d48)',   label: 'Rose'    },
  { id: 'orange',   bg: 'linear-gradient(135deg, #f97316, #ea580c)',   label: 'Orange'  },
  { id: 'amber',    bg: 'linear-gradient(135deg, #f59e0b, #d97706)',   label: 'Amber'   },
  { id: 'emerald',  bg: 'linear-gradient(135deg, #10b981, #059669)',   label: 'Emerald' },
  { id: 'cyan',     bg: 'linear-gradient(135deg, #06b6d4, #0891b2)',   label: 'Cyan'    },
  { id: 'violet',   bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',   label: 'Violet'  },
  { id: 'pink',     bg: 'linear-gradient(135deg, #ec4899, #db2777)',   label: 'Pink'    },
];

export function resolveAvatarBg(colorId) {
  return AVATAR_COLORS.find(c => c.id === colorId)?.bg || AVATAR_COLORS[0].bg;
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--md-surface-2)',
  border: '1px solid var(--md-outline-var)',
  borderRadius: 'var(--md-shape-sm)',
  padding: '11px 14px',
  color: 'var(--md-on-surface)',
  fontSize: 14, fontFamily: 'var(--md-font)',
  outline: 'none', transition: 'border-color 0.2s',
};

function Field({ label, hint, error, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 5 }}>{label}</div>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: 'var(--md-outline)', marginTop: 4 }}>{hint}</div>}
      {error && (
        <div style={{ fontSize: 11, color: 'var(--md-error)', marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage({ user, myPoints, onPointsRefresh }) {
  const [displayName, setDisplayName]     = useState(user?.displayName || '');
  const [username, setUsername]           = useState(myPoints?.username || '');
  const [status, setStatus]               = useState(myPoints?.status || '');
  const [avatarColor, setAvatarColor]     = useState(myPoints?.avatarColor || 'default');
  const [photoPreview, setPhotoPreview]   = useState(myPoints?.photoURL || user?.photoURL || null);
  const [photoFile, setPhotoFile]         = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [errors, setErrors]               = useState({});
  const usernameTimer = useRef(null);
  const fileInputRef  = useRef(null);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setUsername(myPoints?.username || '');
    setStatus(myPoints?.status || '');
    setAvatarColor(myPoints?.avatarColor || 'default');
    setPhotoPreview(myPoints?.photoURL || user?.photoURL || null);
  }, [user, myPoints]);

  // Username check
  useEffect(() => {
    const val = username.trim().toLowerCase();
    if (!val || val === (myPoints?.username || '').toLowerCase()) { setUsernameStatus('idle'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(val)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      const taken = await isUsernameTaken(val, user.uid);
      setUsernameStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(usernameTimer.current);
  }, [username, myPoints?.username, user?.uid]);

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors({ photo: 'Image must be under 5MB' }); return; }
    if (!file.type.startsWith('image/')) { setErrors({ photo: 'Please select an image file' }); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors({});
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const errs = {};
    if (!displayName.trim()) errs.displayName = 'Name cannot be empty';
    const uval = username.trim().toLowerCase();
    if (uval && !/^[a-z0-9_]{3,20}$/.test(uval)) errs.username = 'Username: 3–20 chars, letters/numbers/underscores only';
    if (usernameStatus === 'taken') errs.username = 'This username is taken';
    if (usernameStatus === 'checking') errs.username = 'Checking availability...';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true); setErrors({});
    try {
      let photoURL = myPoints?.photoURL || null;

      // Upload new photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
        setUploadingPhoto(false);
      } else if (!photoPreview) {
        // User removed photo
        photoURL = null;
      }

      // Update Firebase Auth
      await updateFirebaseProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL || null,
      });

      // Update leaderboard doc
      await updateLeaderboardProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase() || null,
        avatarColor,
        status,
        photoURL: photoURL || null,
      });

      await onPointsRefresh();
      setPhotoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Save failed. Please try again.' });
    }
    setSaving(false); setUploadingPhoto(false);
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'U');

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 48px', background: 'var(--md-surface)' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Settings</div>
          <div style={{ fontSize: 14, color: 'var(--md-outline)', marginTop: 3 }}>Manage your profile and preferences</div>
        </div>

        {/* ── Avatar card ── */}
        <div style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)', borderRadius: 'var(--md-shape-xl)', padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--md-elev-1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 16 }}>Avatar</div>

          {/* Preview row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* Avatar with upload overlay */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: photoPreview ? 'transparent' : resolveAvatarBg(avatarColor),
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, boxShadow: 'var(--md-elev-2)',
                overflow: 'hidden', transition: 'background 0.3s',
              }}>
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              {/* Camera overlay button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--md-surface-3)', border: '2px solid var(--md-surface-1)',
                  color: 'var(--md-on-surface)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                title="Upload photo"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--md-primary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--md-surface-3)'}
              >
                <Camera size={13} />
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{displayName || 'Your Name'}</div>
              {username && <div style={{ fontSize: 12, color: 'var(--md-outline)', marginTop: 2 }}>@{username}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 'var(--md-shape-full)',
                    background: 'var(--md-primary)', color: 'var(--md-on-primary)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--md-font)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Camera size={12} /> Upload Photo
                </button>
                {photoPreview && (
                  <button
                    onClick={removePhoto}
                    style={{
                      fontSize: 12, padding: '5px 12px', borderRadius: 'var(--md-shape-full)',
                      background: 'var(--md-surface-2)', color: 'var(--md-error)',
                      border: '1px solid var(--md-outline-var)', cursor: 'pointer', fontFamily: 'var(--md-font)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
              {errors.photo && <div style={{ fontSize: 11, color: 'var(--md-error)', marginTop: 4 }}>{errors.photo}</div>}
            </div>
          </div>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

          {/* Color label */}
          <div style={{ fontSize: 12, color: 'var(--md-outline)', marginBottom: 10 }}>
            Background color (shown when no photo)
          </div>

          {/* Color swatches */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {AVATAR_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setAvatarColor(c.id)}
                title={c.label}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: c.bg,
                  border: avatarColor === c.id ? '3px solid var(--md-on-surface)' : '3px solid transparent',
                  outline: avatarColor === c.id ? '2px solid var(--md-primary)' : 'none',
                  outlineOffset: 2, cursor: 'pointer', padding: 0,
                  transition: 'transform 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {avatarColor === c.id && !photoPreview && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Profile fields ── */}
        <div style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)', borderRadius: 'var(--md-shape-xl)', padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--md-elev-1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 16 }}>Profile Info</div>

          <Field label="Display Name" hint="Shown everywhere on the app" error={errors.displayName}>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" maxLength={40}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
            />
          </Field>

          <Field label="Username" hint="@username — others can search you by this" error={errors.username}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-outline)', fontSize: 15, pointerEvents: 'none' }}>@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                placeholder="yourname" maxLength={20}
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
              />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {usernameStatus === 'checking' && <div className="loading-spinner" style={{ width: 14, height: 14 }} />}
                {usernameStatus === 'available' && <CheckCircle2 size={16} color="var(--md-success)" />}
                {usernameStatus === 'taken' && <AlertCircle size={16} color="var(--md-error)" />}
              </div>
            </div>
            {usernameStatus === 'available' && <div style={{ fontSize: 11, color: 'var(--md-success)', marginTop: 4 }}>@{username.trim()} is available ✓</div>}
            {usernameStatus === 'taken'     && <div style={{ fontSize: 11, color: 'var(--md-error)',   marginTop: 4 }}>This username is taken</div>}
            {usernameStatus === 'invalid'   && <div style={{ fontSize: 11, color: 'var(--md-error)',   marginTop: 4 }}>3–20 chars, letters/numbers/underscores only</div>}
          </Field>

          <Field label="Status" hint="Short message shown on your profile" last>
            <input value={status} onChange={e => setStatus(e.target.value)} placeholder="What are you working on?" maxLength={80}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
            />
            <div style={{ fontSize: 11, color: 'var(--md-outline)', textAlign: 'right', marginTop: 4 }}>{80 - status.length} left</div>
          </Field>
        </div>

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
            <><div className="loading-spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} />
              {uploadingPhoto ? 'Uploading photo...' : 'Saving...'}</>
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
