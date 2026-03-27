import { useState } from 'react';
import { CheckCircle2, Cloud, LaptopMinimal } from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from '../firebase';

export default function AuthScreen({ onGuest }) {
  const [mode, setMode] = useState('signin'); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    if (nextMode !== 'signup') setName('');
  }

  async function handleGoogle() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Reset email sent. Check your inbox and spam folder.');
    } catch (e) {
      const msg =
        e.code === 'auth/user-not-found' ? 'No account found with this email.' :
        e.code === 'auth/invalid-email' ? 'Please enter a valid email.' :
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-shell fade-in">
        <section className="auth-hero">
          <div className="auth-badge">Get Work Done</div>
          <h1 className="auth-hero-title">A simpler place to plan, focus, and finish.</h1>
          <p className="auth-hero-copy">
            Sign in with Firebase to keep your data synced, or keep things local with guest mode.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Track tasks, notes, and progress in one workspace.</span>
            </div>
            <div className="auth-feature-item">
              <Cloud size={18} />
              <span>Use Google or email sign-in without needing an extra paid auth layer.</span>
            </div>
            <div className="auth-feature-item">
              <LaptopMinimal size={18} />
              <span>Continue as guest when you want everything to stay on this device.</span>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <div>
              <div className="auth-title">
                {mode === 'forgot'
                  ? 'Reset password'
                  : mode === 'signup'
                    ? 'Create your account'
                    : 'Welcome back'}
              </div>
              <p className="auth-sub">
                {mode === 'forgot'
                  ? 'Enter your email and we will send you a reset link.'
                  : mode === 'signup'
                    ? 'Create an account to sync your work across devices.'
                    : 'Sign in to pick up where you left off.'}
              </p>
            </div>

            {mode !== 'forgot' && (
              <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
                <button
                  className={`auth-mode-pill ${mode === 'signin' ? 'active' : ''}`}
                  type="button"
                  onClick={() => switchMode('signin')}
                >
                  Sign in
                </button>
                <button
                  className={`auth-mode-pill ${mode === 'signup' ? 'active' : ''}`}
                  type="button"
                  onClick={() => switchMode('signup')}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          <div className="auth-widget">
            {mode !== 'forgot' && (
              <>
                <button
                  className="btn btn-outline auth-social-button"
                  onClick={handleGoogle}
                  disabled={loading}
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{loading ? 'Please wait...' : 'Continue with Google'}</span>
                </button>

                <div className="auth-divider">
                  <span>or use email</span>
                </div>
              </>
            )}

            <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleEmail}>
              {mode === 'signup' && (
                <input
                  className="auth-input"
                  placeholder="Your name"
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
                autoComplete="email"
                required
              />

              {mode !== 'forgot' && (
                <input
                  className="auth-input"
                  type="password"
                  placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              )}

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              {mode === 'signin' && (
                <div className="auth-inline-action">
                  <button type="button" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button className="btn btn-primary auth-submit-button" type="submit" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : mode === 'signup'
                      ? 'Create account'
                      : 'Sign in'}
              </button>
            </form>

            {mode === 'forgot' && (
              <div className="auth-inline-center">
                <button type="button" onClick={() => switchMode('signin')}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>

          <div className="auth-divider">
            <span>or keep it local</span>
          </div>

          <button
            className="btn btn-outline auth-guest-button"
            onClick={onGuest}
            type="button"
          >
            Continue as guest
            <span className="auth-guest-label">local only</span>
          </button>

          <p className="auth-guest-note">
            Guest mode stores your data on this device only until you sign in later.
          </p>
        </section>
      </div>
    </div>
  );
}
