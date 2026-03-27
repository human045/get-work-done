<div align="center">

# 🚀 Get Work Done

**A premium, all-in-one productivity app — beautifully minimal, powerfully focused.**

[![Live App](https://img.shields.io/badge/Live%20App-work.gamersdc.in-2f81f7?style=for-the-badge&logo=vercel&logoColor=white)](https://work.gamersdc.in)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-CRA-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

**[→ Try it live at work.gamersdc.in](https://work.gamersdc.in)**

</div>

---

## What Is It?

**Get Work Done** is a free, cloud-synced productivity suite that combines task management, a Pomodoro focus timer, a full expense tracker, and a gamified points/league system — all in one beautifully designed web app. No subscription, no ads, no paywalls.

> Built for students, developers, freelancers, and anyone who wants to get more done with less friction.

---

## ✨ Features

### 📋 Task & Work Management
- **Works & Workspaces** — group related tasks into named "Works" and switch between multiple workspaces (personal, professional, side projects)
- **Priority stars** — rate each work item 1–5 stars; dashboard sorts automatically by priority
- **3-task focus limit** — enforced by design to keep your attention on what matters most
- **Task completion history** — completed tasks move to history with timestamps
- **Per-work notepad** — auto-saves as you type (debounced)
- **Upcoming view** — a prioritised cross-workspace view of what's due next

### ⏱ Pomodoro Timer
- **Minimal, clean design** — large monospace countdown digits + thin linear progress bar
- **Customisable durations** — set focus (1–90 min) and break (1–30 min) to your rhythm
- **Project linking** — pin a Work to the session; tick tasks off without leaving the timer
- **Auto mode switching** — timer transitions between Focus and Break automatically
- **Points integration** — earn 10 pts per completed task during a session

### 💰 Expense Tracker
- **Multiple accounts** — add savings, current, cash, and digital wallet accounts (INR, USD, EUR, GBP)
- **Income / Expense / Transfer** — record all three transaction types; balances update automatically
- **Net worth dashboard** — gradient hero card showing total assets + income/expense/balance chips
- **7-day activity chart** — bar chart comparing daily income vs expenses over the past week
- **Real-time Firestore sync** — transactions persist instantly across all devices
- **Recent transactions panel** — quick view of your latest 6 entries

### 🏆 Gamification & Social
- **Points system** — earn points by completing tasks (10 pts each)
- **Trophy leagues** — Bronze → Silver → Gold → Platinum → Diamond → Legend
- **Leaderboard** — see how you rank against other users globally
- **Friends panel** — add friends, track their progress, stay accountable together
- **Shop** — spend points to unlock higher task limits and workspace expansions

### 🎨 Themes & UI
- **7 premium themes** — Purple Night, GitHub Dark, Ocean Blue, Forest Green, Sunset Red, Daylight, Mint Fresh
- **Material Design 3 tokens** — consistent surface hierarchy, elevation, and shape scales
- **Glassmorphism topbar** — frosted-glass effect with blur
- **Smooth animations** — fade, scale, and slide transitions throughout
- **Mobile-first layout** — bottom navigation bar, off-canvas right sidebar, safe-area insets

### 🔐 Auth & Data
- **Google Sign-In** — one-click login, instant cloud sync
- **Email / Password** — sign up and sign in with email
- **Guest mode** — no account needed; data saved to localStorage
- **Firestore security rules** — only you can read/write your own data

---

## 🖥 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App) |
| Auth | Firebase Authentication (Google + Email) |
| Database | Firebase Firestore |
| Hosting | Vercel |
| Icons | Lucide React |
| Typography | Inter + JetBrains Mono (Google Fonts) |
| Styling | Vanilla CSS with CSS custom properties (no Tailwind) |

---

## 🗂 Project Structure

```
src/
├── App.js                    Root component — auth state, view routing
├── App.css                   Global styles + CSS theme variable system
├── firebase.js               Firebase init and auth helpers
├── storage.js                Unified data layer (Firestore or localStorage)
├── finance.js                Expense tracker Firestore helpers
├── points.js                 Points and leaderboard logic
├── themes.js                 Theme definitions and applyTheme()
└── components/
    ├── AuthScreen.jsx         Login UI (Google, Email, Guest)
    ├── Topbar.jsx             Navigation bar (glassmorphism)
    ├── Sidebar.jsx            Left sidebar + Pomodoro timer
    ├── BottomNav.jsx          Mobile bottom navigation bar
    ├── Dashboard.jsx          Work cards grid
    ├── WorkPage.jsx           Per-work tasks and notepad
    ├── PomodoroTimer.jsx      Minimal focus timer with project linking
    ├── PomodoroTimer.css      Timer-specific styles
    ├── ExpenseTracker.jsx     Finance dashboard, accounts, transactions
    ├── ExpenseTracker.css     Expense tracker styles
    ├── ProfilePage.jsx        User profile and stats
    ├── PublicProfilePage.jsx  Public-facing profile
    ├── Leaderboard.jsx        Global points leaderboard
    ├── FriendsPanel.jsx       Friends list and social features
    ├── SettingsPage.jsx       App and account settings
    └── UpcomingPage.jsx       Cross-workspace upcoming tasks view
```

---

## 🔥 Firestore Data Structure

```
users/{uid}/
├── works/{workId}
│   ├── id, title, stars (1-5)
│   ├── todos: [{ id, text, done, createdAt }]
│   ├── history: [{ id, text, done, createdAt, completedAt }]
│   ├── note: string
│   └── createdAt: timestamp
│
├── accounts/{accountId}
│   ├── id, name, type (asset/expense/revenue)
│   ├── balance: number
│   └── currency: string
│
└── transactions/{txId}
    ├── id, description, amount
    ├── type: 'deposit' | 'withdrawal' | 'transfer'
    ├── sourceAccountId, destAccountId
    └── createdAt: timestamp
```

---

## ⚙️ Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/human045/get-work-done.git
cd get-work-done
npm install
```

### 2. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project → add a **Web app** (`</>`)
3. Copy the `firebaseConfig` object

### 3. Enable Firebase Services

| Service | Steps |
|---|---|
| **Authentication** | Console → Authentication → Sign-in method → Enable Google + Email/Password |
| **Firestore** | Console → Firestore Database → Create (production mode) → pick a region |

### 4. Configure Firebase

Open `src/firebase.js` and replace the placeholder values with your actual config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Run Locally

```bash
npm start
# Opens at http://localhost:3000
```

---

## 🚢 Deploy on Vercel

The easiest way to deploy: connect your GitHub repo to [Vercel](https://vercel.com) and it deploys automatically on every push to `main`.

No additional configuration needed for Vercel — the CRA build output is auto-detected.

> **Add your Vercel domain to Firebase authorized domains:**  
> Firebase Console → Authentication → Settings → Authorized domains → Add domain

---

## 🌐 SEO Landing Pages

| Page | URL | Target Keyword |
|---|---|---|
| App | [work.gamersdc.in](https://work.gamersdc.in) | — |
| Best Pomodoro Timer | [/best-pomodoro-timer](https://work.gamersdc.in/best-pomodoro-timer) | best pomodoro timer |
| Best Productivity App | [/best-productivity-app](https://work.gamersdc.in/best-productivity-app) | best productivity app |
| Expense Tracker | [/expense-tracker-app](https://work.gamersdc.in/expense-tracker-app) | expense tracker app |
| Pomodoro Timer | [/pomodoro-timer](https://work.gamersdc.in/pomodoro-timer) | pomodoro timer |

---

## 🔒 Guest Mode Notes

- Data stored in `localStorage` under key `gwd_data`
- All features accessible without logging in
- Guest preference persists across page reloads
- To exit: user menu → **Exit guest mode**
- Data does **not** sync to cloud until you sign in

---

## 📄 License

MIT © 2026 [GamersDC](https://gamersdc.in)

---

<div align="center">

**[🚀 Open the App](https://work.gamersdc.in)** · **[Report a Bug](https://github.com/human045/get-work-done/issues)** · **[Request a Feature](https://github.com/human045/get-work-done/issues)**

Made with ❤️ for deep workers everywhere.

</div>
