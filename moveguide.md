# Firebase Auth → Clerk Migration Guide

> **App**: Get Work Done (CRA — `react-scripts`, not Vite)  
> **Database**: Firebase Firestore (staying — only auth is changing)  
> **Goal**: Replace Firebase Auth with Clerk for all sign-in flows  

---

## ⚠️ Critical Architecture Note

Firestore security rules work by checking `request.auth.uid` from a **Firebase JWT**. Clerk issues its own JWTs, not Firebase ones. This migration uses **Clerk's Firebase JWT template** to mint Firebase-compatible tokens, so your Firestore rules stay intact.

> **Clerk's Firebase integration requires the Pro plan** ($25/mo). If you are on the free plan:  
> - Option A: Upgrade Clerk to Pro (enables Firebase JWT template)  
> - Option B: Use `allow read, write: if true;` rules temporarily (accept for a personal app)  
> - Option C: Keep Firebase Auth for Firestore + use Clerk only for UI (not recommended)  
>  
> This guide covers **Option A (recommended)**. Option B notes are added where relevant.

---

## Phase 1 — Install Clerk

### 1.1 Install the SDK

```bash
npm install @clerk/react@latest
```

### 1.2 Add your Publishable Key

Create (or add to) `.env.local` in the project root:

```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
```

Get this from **Clerk Dashboard → API Keys → React** section.

> ⚠️ CRA uses `REACT_APP_` prefix — NOT `VITE_CLERK_PUBLISHABLE_KEY`.

---

## Phase 2 — Wrap the App with ClerkProvider

Open `src/index.js` and update it:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App';
import { ClerkProvider } from '@clerk/react';

posthog.init('phc_SS5g62UUVqA4fgyCprePiSmV0HvsQ7pl6eyFgQhPmMg', {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  debug: true,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

> `<ClerkProvider>` reads `REACT_APP_CLERK_PUBLISHABLE_KEY` automatically — do NOT pass `publishableKey` as a prop.

---

## Phase 3 — Set Up the Clerk → Firebase Bridge

This is the most important step. Clerk can generate Firebase-compatible JWTs so your Firestore security rules keep working.

### 3.1 Create a Firebase JWT Template in Clerk

1. Go to **Clerk Dashboard → JWT Templates**
2. Click **New template → Firebase**
3. Copy your **Firebase service account** credentials from:  
   Firebase Console → Project Settings → Service Accounts → **Generate new private key**
4. Paste the private key JSON into Clerk's Firebase template
5. Save — Clerk will now be able to mint Firebase-compatible JWTs

### 3.2 Create `src/clerkFirebaseBridge.js`

```js
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Exchanges a Clerk Firebase JWT for a Firebase Auth session.
 * Call this once after the user is signed in with Clerk.
 * @param {Function} getToken - clerk.session.getToken from useSession()
 */
export async function signIntoFirebaseWithClerk(getToken) {
  const token = await getToken({ template: 'firebase' });
  if (!token) throw new Error('Could not get Firebase token from Clerk');
  await signInWithCustomToken(auth, token);
  return getAuth().currentUser;
}
```

---

## Phase 4 — Update App.js

Replace the Firebase `onAuthStateChanged` block with Clerk hooks.

### 4.1 New imports at the top of `App.js`

```js
// Remove these Firebase auth imports:
// import { auth, onAuthStateChanged } from './firebase';

// Add these Clerk imports:
import { useUser, useAuth, useSession } from '@clerk/react';
import { signIntoFirebaseWithClerk } from './clerkFirebaseBridge';
```

### 4.2 Replace the auth useEffect

**Before (Firebase):**
```js
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    if (u) {
      setUser(u); setAuthState('authed');
      posthog.identify(u.uid, { name: u.displayName || u.email?.split('@')[0] });
      // ... load works, workspaces etc
    } else { ... }
  });
  return unsub;
}, []);
```

**After (Clerk):**
```js
const { isLoaded, isSignedIn, user } = useUser();
const { getToken } = useAuth();

useEffect(() => {
  if (!isLoaded) return; // Clerk still loading

  async function onSignIn() {
    // Bridge Clerk JWT → Firebase Auth so Firestore rules work
    await signIntoFirebaseWithClerk(getToken);

    setUser(user);
    setAuthState('authed');
    posthog.identify(user.id, {
      name: user.fullName || user.primaryEmailAddress?.emailAddress,
    });

    const uid = user.id; // Use Clerk userId as Firestore key
    const [loaded, wss] = await Promise.all([getWorks(uid), getWorkspaces(uid)]);
    setWorks(loaded);
    setWorkspaces(wss);
    await ensureLeaderboardEntry(
      uid,
      user.fullName || user.primaryEmailAddress?.emailAddress,
      getInitials({ displayName: user.fullName })
    );
    setMyPoints(await getMyPoints(uid));
  }

  if (isSignedIn) {
    onSignIn();
  } else {
    const isGuest = localStorage.getItem(GUEST_KEY) === '1';
    if (isGuest) {
      setUser(null); setAuthState('guest');
      getWorks(null).then(setWorks);
    } else {
      setUser(null); setAuthState('unauthed');
      setPage('dashboard');
    }
  }
}, [isLoaded, isSignedIn]);
```

### 4.3 Update `getInitials` helper

```js
// Before — worked with Firebase user shape
function getInitials(user) {
  if (!user) return 'G';
  if (user.displayName) return user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return user.email?.[0]?.toUpperCase() || 'U';
}

// After — works with both old shape and Clerk shape
function getInitials(user) {
  if (!user) return 'G';
  const name = user.displayName || user.fullName;
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const email = user.email || user.primaryEmailAddress?.emailAddress;
  return email?.[0]?.toUpperCase() || 'U';
}
```

### 4.4 Update handleSignOut

```js
// Before
function handleSignOut() {
  auth.signOut(); // Firebase sign out
  posthog.reset();
  // ...
}

// After — Clerk handles sign out via <UserButton> automatically.
// BUT keep a manual version for the settings page:
const { signOut } = useAuth();

async function handleSignOut() {
  await signOut();        // Clerk sign out
  posthog.reset();
  localStorage.removeItem(GUEST_KEY);
  sessionStorage.removeItem(NAV_KEY);
  setAuthState('unauthed');
  setUser(null); setWorks([]); setWorkspaces([]); setMyPoints(null);
  setOpenWork(null); setPublicUid(null); setPage('dashboard');
}
```

---

## Phase 5 — Replace AuthScreen with Clerk Components

### 5.1 What to remove from `AuthScreen.jsx`

Remove or empty the entire component. Clerk provides sign-in/up UI.

### 5.2 Simple replacement

Replace the `{authState === 'unauthed' && <AuthScreen />}` render in `App.js` with:

```jsx
import { Show, SignInButton, SignUpButton } from '@clerk/react';

// In your render, where you show the auth screen:
{authState === 'unauthed' && (
  <div className="auth-screen">
    <h1>Get Work Done</h1>
    <p>Sign in to sync your work across devices.</p>
    <div className="auth-btns">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="btn-primary">Sign In</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="btn-ghost">Create Account</button>
        </SignUpButton>
      </Show>
    </div>
    <button onClick={handleGuest} className="btn-ghost">
      Continue as Guest
    </button>
  </div>
)}
```

---

## Phase 6 — Replace the Topbar User Button

In `Topbar.jsx`, replace the custom avatar/sign-out button:

```jsx
// Remove: custom avatar, sign-out logic, Firebase user display

// Add:
import { UserButton } from '@clerk/react';

// In the topbar JSX, where the user avatar was:
<UserButton afterSignOutUrl="/" />
```

`<UserButton>` gives the user a dropdown with account management, profile, and sign-out — all handled by Clerk automatically.

---

## Phase 7 — Update Firestore Security Rules

Your Firestore rules already use `request.auth.uid == userId`. Because you are using Clerk's Firebase JWT template (Phase 3), **the rules do not need to change** — Clerk maps its `userId` to the Firebase JWT `uid` claim automatically.

**Verify** by checking the Clerk Firebase JWT template — the `uid` field should be set to `{{user.id}}`.

### Option B — If NOT using Clerk's Firebase JWT template

Temporarily relax rules during migration on a personal app (revert when done):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ INSECURE — personal use only
    }
  }
}
```

In this case, use `user.id` (from `useUser()`) as the Firestore document key.

---

## Phase 8 — Guest Mode

Clerk doesn't have a built-in guest mode. Keep your existing localStorage guest flow as-is — it doesn't interact with Firebase Auth or Clerk at all.

```js
function handleGuest() {
  posthog.capture('guest_mode_started');
  localStorage.setItem(GUEST_KEY, '1');
  setAuthState('guest');
  const stored = JSON.parse(localStorage.getItem('gwd_data') || '{"works":[]}');
  setWorks(stored.works || []);
}
```

No changes needed here.

---

## Phase 9 — Update storage.js and Other Places That Use `uid`

Everywhere `user.uid` (Firebase) is used, replace with `user.id` (Clerk):

| File | Old | New |
|---|---|---|
| `App.js` | `user.uid` | `user.id` |
| `storage.js` | `uid` parameter (no change — it's passed in) | — |
| `points.js` | `uid` parameter (no change — it's passed in) | — |
| `finance.js` | `uid` parameter (no change — it's passed in) | — |
| `Topbar.jsx` | `user.photoURL`, `user.displayName` | `user.imageUrl`, `user.fullName` |
| `ProfilePage.jsx` | `user.photoURL`, `user.displayName`, `user.email` | `user.imageUrl`, `user.fullName`, `user.primaryEmailAddress?.emailAddress` |

---

## Phase 10 — Remove Firebase Auth (Optional Cleanup)

Once everything is working:

1. In `src/firebase.js`, remove the Firebase Auth imports and exports:
   ```js
   // Remove:
   import { getAuth, GoogleAuthProvider, signInWithPopup, ... } from 'firebase/auth';
   export const auth = getAuth(app);
   export const googleProvider = new GoogleAuthProvider();
   // and all auth function exports
   ```

2. Keep `db`, `storage`, and all Firestore/Storage imports — these still work.

3. Uninstall Firebase Auth from the project is **not** needed (it's part of the `firebase` package).

---

## Checklist

- [ ] `npm install @clerk/react@latest`
- [ ] Add `REACT_APP_CLERK_PUBLISHABLE_KEY` to `.env.local`
- [ ] Wrap `index.js` with `<ClerkProvider>`
- [ ] Create `clerkFirebaseBridge.js`
- [ ] Set up Firebase JWT template in Clerk Dashboard
- [ ] Update `App.js` — replace `onAuthStateChanged` with `useUser` + `useAuth`
- [ ] Update `getInitials()` helper
- [ ] Update `handleSignOut()`
- [ ] Replace `AuthScreen` with Clerk `<SignInButton>` / `<SignUpButton>`
- [ ] Replace topbar avatar with `<UserButton>`
- [ ] Update all `user.uid` → `user.id` references
- [ ] Update `user.displayName` → `user.fullName`, `user.photoURL` → `user.imageUrl`
- [ ] Test auth flow: sign in, sign out, guest mode
- [ ] Test Firestore reads/writes after Clerk sign-in
- [ ] Remove old Firebase Auth imports from `firebase.js`
- [ ] Add Vercel domain to Clerk's allowed redirect URLs

---

## Vercel Environment Variable

After `.env.local` is working locally, add the key to Vercel:

**Vercel Dashboard → Your Project → Settings → Environment Variables**

```
Name:  REACT_APP_CLERK_PUBLISHABLE_KEY
Value: pk_live_xxxxxxxxxxxxxxxx
```

---

## Clerk Dashboard — Allowed Redirect URLs

**Clerk Dashboard → Paths → Allowed redirect origins**

Add:
```
https://work.gamersdc.in
http://localhost:3000
```
