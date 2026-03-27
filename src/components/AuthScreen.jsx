import { useState } from 'react';
import posthog from 'posthog-js';
import { SignIn, SignUp, Show } from '@clerk/react';

export default function AuthScreen({ onGuest, isLoaded, clerkTimedOut }) {
  const [mode, setMode] = useState('signin'); // signin | signup

  const clerkAppearance = {
    elements: {
      card: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
      },
      headerTitle: { color: 'var(--md-text)' },
      headerSubtitle: { color: 'var(--md-outline)' },
      socialButtonsBlockButtonText: { color: 'var(--md-text)' },
      socialButtonsBlockButton: {
        background: 'var(--md-surface-variant)',
        border: '1px solid var(--md-outline-variant)',
        '&:hover': { background: 'var(--md-surface-variant-hover)' },
      },
      dividerText: { color: 'var(--md-outline)' },
      dividerLine: { background: 'var(--md-outline-variant)' },
      formFieldLabel: { color: 'var(--md-text)' },
      formFieldInput: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--md-outline-variant)',
        color: 'var(--md-text)',
        '&:focus': { borderColor: 'var(--md-primary)' },
      },
      formButtonPrimary: {
        backgroundColor: 'var(--md-primary)',
        color: 'var(--md-on-primary)',
        '&:hover': { backgroundColor: 'var(--md-primary-hover)' },
      },
      footerActionText: { color: 'var(--md-outline)' },
      footerActionLink: { color: 'var(--md-primary)' },
      identityPreviewText: { color: 'var(--md-text)' },
      identityPreviewEditButtonIcon: { color: 'var(--md-primary)' },
      formResendCodeLink: { color: 'var(--md-primary)' },
    },
  };

  return (
    <div className="auth-screen">
      <div className="auth-card scale-in" style={{ padding: '0px 12px 24px 12px' }}>
        {!isLoaded ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">Initializing...</div>
            {clerkTimedOut ? (
              <div style={{ color: 'var(--error)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
                <p>⚠️ Auth Provider failed to load.</p>
                <p style={{ marginTop: 8, opacity: 0.8 }}>
                  Check your Internet or Clerk Key.
                </p>
              </div>
            ) : (
              <div className="loading-spinner" style={{ margin: '20px auto' }} />
            )}
          </div>
        ) : (
          <Show when="signed-out">
            <div style={{ transform: 'translateY(-10px)' }}>
              {mode === 'signin' ? (
                <SignIn 
                  routing="hash"
                  appearance={clerkAppearance}
                  afterSignInUrl="/"
                />
              ) : (
                <SignUp 
                  routing="hash"
                  appearance={clerkAppearance}
                  afterSignUpUrl="/"
                />
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '-20px' }}>
              <div className="auth-toggle">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                <button 
                  type="button" 
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ marginLeft: 8, color: 'var(--md-primary)', fontWeight: 600 }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </div>
          </Show>
        )}

        <div className="auth-divider">or</div>

        <div style={{ padding: '0 32px' }}>
          <button className="btn btn-outline" onClick={onGuest} type="button" style={{ width: '100%', justifyContent: 'center' }}>
            Continue as Guest
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>(local only)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
