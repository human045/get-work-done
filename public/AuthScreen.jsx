import { useState } from 'react';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function AuthScreen({ onGuest }) {
  const [mode, setMode] = useState('signin'); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError(''); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed. Try again.');
    }
    finally { setLoading(false); }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msg =
        e.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
        e.code === 'auth/user-not-found' ? 'No account found with this email.' :
        e.code === 'auth/wrong-password' ? 'Incorrect password.' :
        e.code === 'auth/email-already-in-use' ? 'Email already in use.' :
        e.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        e.code === 'auth/invalid-email' ? 'Please enter a valid email.' :
        'Something went wrong. Please try again.';
      setError(msg);
    } finally { setLoading(false); }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Reset email sent! Check your inbox (and spam folder).');
    } catch (e) {
      const msg =
        e.code === 'auth/user-not-found' ? 'No account found with this email.' :
        e.code === 'auth/invalid-email' ? 'Please enter a valid email.' :
        'Something went wrong. Please try again.';
      setError(msg);
    } finally { setLoading(false); }
  }

  function switchMode(m) {
    setMode(m);
    setError(''); setSuccess('');
    setEmail(''); setPassword(''); setName('');
  }

  // ── Forgot Password Screen ──────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="auth-screen">
        <div className="auth-card scale-in">
          <div className="auth-title">Reset password</div>
          <div className="auth-sub">
            Enter your email and we'll send you a link to reset your password.
          </div>
          <form onSubmit={handleForgot}>
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && <div className="auth-error">{error}</div>}
            {success && (
              <div style={{ fontSize: 13, color: 'var(--success)', marginBottom: 10, lineHeight: 1.5 }}>
                ✓ {success}
              </div>
            )}
            {!success && (
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? '...' : 'Send Reset Email'}
              </button>
            )}
          </form>
          <div className="auth-toggle">
            <button type="button" onClick={() => switchMode('signin')}>
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign In / Sign Up Screen ────────────────────────────────────
  return (
    <div className="auth-screen">
      <div className="auth-card scale-in">
        <div className="auth-title">
          {mode === 'signin' ? 'Welcome back' : 'Get started'}
        </div>
        <div className="auth-sub">
          {mode === 'signin'
            ? 'Sign in to access your work across devices.'
            : 'Create an account to sync your work to the cloud.'}
        </div>

        <button className="btn btn-outline" onClick={handleGoogle} disabled={loading} type="button">
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">or</div>

        <form onSubmit={handleEmail}>
          {mode === 'signup' && (
            <input
              className="auth-input"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="auth-input"
            type="password"
            placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {error && <div className="auth-error">{error}</div>}

          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginBottom: 12, marginTop: -4 }}>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                style={{ background: 'none', color: 'var(--text3)', fontSize: 12, padding: 0, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="btn btn-outline" onClick={onGuest} type="button">
          Continue as Guest
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>(local only)</span>
        </button>

        <div className="auth-toggle">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
