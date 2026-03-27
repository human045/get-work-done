import { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, LaptopMinimal } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/react';

function getModeFromHash() {
  if (typeof window === 'undefined') return 'sign-in';
  return window.location.hash === '#/sign-up' ? 'sign-up' : 'sign-in';
}

export default function AuthScreen({ onGuest, isLoaded, clerkTimedOut }) {
  const [mode, setMode] = useState(getModeFromHash);

  useEffect(() => {
    function syncMode() {
      setMode(getModeFromHash());
    }

    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '/sign-in';
    } else {
      syncMode();
    }

    window.addEventListener('hashchange', syncMode);
    return () => window.removeEventListener('hashchange', syncMode);
  }, []);

  function switchMode(nextMode) {
    window.location.hash = nextMode === 'sign-up' ? '/sign-up' : '/sign-in';
  }

  const clerkAppearance = {
    elements: {
      rootBox: {
        width: '100%',
      },
      cardBox: {
        width: '100%',
        boxShadow: 'none',
      },
      card: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: '0',
        width: '100%',
      },
      header: {
        display: 'none',
      },
      headerTitle: {
        display: 'none',
      },
      headerSubtitle: {
        display: 'none',
      },
      socialButtonsBlockButton: {
        minHeight: '48px',
        background: 'var(--md-surface-2)',
        border: '1px solid var(--md-outline-var)',
        borderRadius: '14px',
        boxShadow: 'none',
      },
      socialButtonsBlockButtonText: {
        color: 'var(--md-on-surface)',
        fontSize: '14px',
        fontWeight: 600,
      },
      dividerLine: {
        background: 'var(--md-outline-var)',
      },
      dividerText: {
        color: 'var(--md-outline)',
        fontSize: '12px',
        fontWeight: 500,
      },
      formFieldLabel: {
        color: 'var(--md-on-surface)',
        fontSize: '13px',
        fontWeight: 600,
      },
      formFieldInput: {
        minHeight: '48px',
        background: 'var(--md-surface-2)',
        border: '1px solid var(--md-outline-var)',
        borderRadius: '14px',
        color: 'var(--md-on-surface)',
        fontSize: '15px',
        boxShadow: 'none',
      },
      formFieldInputShowPasswordButton: {
        color: 'var(--md-outline)',
      },
      formButtonPrimary: {
        minHeight: '48px',
        background: 'linear-gradient(135deg, var(--md-primary), color-mix(in srgb, var(--md-primary) 68%, white))',
        color: 'var(--md-on-primary)',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: 700,
        textTransform: 'none',
        boxShadow: '0 14px 30px -18px color-mix(in srgb, var(--md-primary) 85%, transparent)',
      },
      footer: {
        display: 'none',
      },
      footerAction: {
        display: 'none',
      },
      identityPreviewText: {
        color: 'var(--md-on-surface)',
      },
      formResendCodeLink: {
        color: 'var(--md-primary)',
        fontWeight: 600,
      },
      alertText: {
        color: 'var(--md-on-surface)',
      },
      otpCodeFieldInput: {
        background: 'var(--md-surface-2)',
        border: '1px solid var(--md-outline-var)',
        borderRadius: '12px',
        color: 'var(--md-on-surface)',
      },
    },
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell fade-in">
        <section className="auth-hero">
          <div className="auth-badge">Get Work Done</div>
          <h1 className="auth-hero-title">A simpler place to plan, focus, and finish.</h1>
          <p className="auth-hero-copy">
            Sign in to sync your work across devices, or keep things local with guest mode.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Track tasks, notes, and progress in one workspace.</span>
            </div>
            <div className="auth-feature-item">
              <Cloud size={18} />
              <span>Use Clerk for sign-in and keep cloud sync straightforward.</span>
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
                {mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
              </div>
              <p className="auth-sub">
                {mode === 'sign-up'
                  ? 'Start with a clean account and sync your work anywhere.'
                  : 'Sign in to pick up where you left off.'}
              </p>
            </div>

            <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
              <button
                className={`auth-mode-pill ${mode === 'sign-in' ? 'active' : ''}`}
                type="button"
                onClick={() => switchMode('sign-in')}
              >
                Sign in
              </button>
              <button
                className={`auth-mode-pill ${mode === 'sign-up' ? 'active' : ''}`}
                type="button"
                onClick={() => switchMode('sign-up')}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="auth-widget">
            {clerkTimedOut ? (
              <div className="auth-provider-error">
                <div className="auth-provider-error-title">Sign-in is taking longer than expected.</div>
                <p>Refresh the page or use guest mode for now.</p>
              </div>
            ) : !isLoaded ? (
              <div className="auth-loading">
                <div className="loading-spinner" />
                <p>Loading secure sign-in...</p>
              </div>
            ) : mode === 'sign-up' ? (
              <SignUp
                routing="hash"
                signInUrl="#/sign-in"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="hash"
                signUpUrl="#/sign-up"
                appearance={clerkAppearance}
              />
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
