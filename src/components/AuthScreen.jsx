import posthog from 'posthog-js';
import { SignIn, SignUp, Show } from '@clerk/react';

export default function AuthScreen({ onGuest, isLoaded, clerkTimedOut }) {
  const clerkAppearance = {
    elements: {
      card: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: '0 8px',
      },
      headerTitle: { color: 'var(--md-text)', fontSize: '22px' },
      headerSubtitle: { color: 'var(--md-outline)', fontSize: '14px' },
      socialButtonsBlockButton: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--md-outline-variant)',
        '&:hover': { background: 'rgba(255, 255, 255, 0.08)' },
      },
      socialButtonsBlockButtonText: { color: 'var(--md-text)', fontWeight: 500 },
      dividerLine: { background: 'var(--md-outline-variant)' },
      dividerText: { color: 'var(--md-outline)' },
      formFieldLabel: { color: 'var(--md-text)', fontWeight: 500 },
      formFieldInput: {
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--md-outline-variant)',
        color: 'var(--md-text)',
        borderRadius: '8px',
        '&:focus': { borderColor: 'var(--md-primary)', boxShadow: '0 0 0 1px var(--md-primary)' },
      },
      formButtonPrimary: {
        backgroundColor: 'var(--md-primary)',
        color: 'var(--md-on-primary)',
        borderRadius: '8px',
        textTransform: 'none',
        fontSize: '15px',
        '&:hover': { backgroundColor: 'var(--md-primary-hover)' },
      },
      footer: { background: 'transparent' },
      footerActionText: { color: 'var(--md-outline)' },
      footerActionLink: { color: 'var(--md-primary)', fontWeight: 600 },
      identityPreviewText: { color: 'var(--md-text)' },
      formResendCodeLink: { color: 'var(--md-primary)' },
    },
  };

  return (
    <div className="auth-screen">
      <div className="auth-card scale-in" style={{ padding: '24px 12px', minWidth: '400px' }}>
        {!isLoaded ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="auth-title">Welcome back</div>
            {clerkTimedOut ? (
              <div style={{ color: 'var(--error)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
                <p>⚠️ Auth Provider failed to load.</p>
                <p style={{ marginTop: 8 }}>Try refreshing or check your connection.</p>
              </div>
            ) : (
              <div className="loading-spinner" style={{ margin: '20px auto' }} />
            )}
          </div>
        ) : (
          <Show when="signed-out">
            <div style={{ marginBottom: 12 }}>
              <SignIn 
                routing="hash"
                signUpUrl="#/sign-up"
                appearance={clerkAppearance}
              />
            </div>
          </Show>
        )}

        <div className="auth-divider" style={{ margin: '12px 0' }}>or</div>

        <div style={{ padding: '0 32px' }}>
          <button 
            className="btn btn-outline" 
            onClick={onGuest} 
            type="button" 
            style={{ width: '100%', justifyContent: 'center', height: '42px' }}
          >
            Continue as Guest
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>(local only)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
