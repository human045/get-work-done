import posthog from 'posthog-js';
import { SignInButton, SignUpButton, Show } from '@clerk/react';

export default function AuthScreen({ onGuest, isLoaded, clerkTimedOut }) {
  return (
    <div className="auth-screen">
      <div className="auth-card scale-in">
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">
          Sign in to sync your work and access it on any device.
        </div>

        {!isLoaded ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            {clerkTimedOut ? (
              <div style={{ color: 'var(--error)', fontSize: 13, lineHeight: 1.5 }}>
                <p>⚠️ Auth Provider failed to load.</p>
                <p style={{ marginTop: 8, opacity: 0.8 }}>
                  This usually means the <strong>Publishable Key</strong> is missing or invalid in Vercel settings.
                </p>
              </div>
            ) : (
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            )}
          </div>
        ) : (
          <Show when="signed-out">
            <SignInButton mode="modal" afterSignInUrl="/">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => posthog.capture('sign_in_opened', { method: 'clerk' })}
              >
                Sign In
              </button>
            </SignInButton>

            <div className="auth-divider">or</div>

            <SignUpButton mode="modal" afterSignUpUrl="/">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => posthog.capture('sign_up_opened', { method: 'clerk' })}
              >
                Create Account
              </button>
            </SignUpButton>
          </Show>
        )}

        <div className="auth-divider">or</div>

        <button className="btn btn-outline" onClick={onGuest} type="button">
          Continue as Guest
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>(local only)</span>
        </button>
      </div>
    </div>
  );
}
