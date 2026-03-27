# Manual Tasks — Get Work Done

## 🔐 Clerk Auth Setup (required before login works)
- [x] Add Clerk Publishable Key to Vercel (User confirmed)
- [/] Fix Clerk loading state (Explicit key + Timeout fallback — Pushing now)

## 🔥 Firebase — Deploy Updated Security Rules
- [ ] Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore → Rules**
- [ ] Replace the rules with the contents of `firebase-rules/firestore.rules`
- [ ] Click **Publish**
- [ ] Enable **Anonymous sign-in**: Firebase Console → Authentication → Sign-in method → Anonymous → Enable

## 📊 PostHog — Remove Debug Mode

- [ ] Once PostHog events are confirmed working in the dashboard, remove `debug: true` from `src/index.js`:
  ```js
  posthog.init('phc_SS5g...', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
    // debug: true  ← remove this line
  });
  ```
- [ ] Push the change after removing it

## 🔑 GitHub PAT — Regenerate (Security)

- [ ] Go to [github.com/settings/tokens](https://github.com/settings/tokens)
- [ ] Delete the leaked token (the one ending in `GQR3`)
- [ ] Generate a new token with `repo` scope

## 🌐 SEO — Google Search Console

- [ ] Go to [search.google.com/search-console](https://search.google.com/search-console)
- [ ] Add property: `work.gamersdc.in`
- [ ] Submit sitemap: `https://work.gamersdc.in/sitemap.xml`
- [ ] Request indexing for each landing page URL

## ✅ Verification After Clerk Setup

- [ ] Visit `work.gamersdc.in` → click Sign In → Clerk modal opens
- [ ] Sign in with Google → redirected back to app, data loads
- [ ] Sign out → redirected to `/`
- [ ] Guest mode still works (no login needed)
- [ ] Check PostHog Live Events for `$pageview` and `signed_in` events
