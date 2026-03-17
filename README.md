# Get Work Done

A minimal, focused productivity app. Add work items with priority stars (1–5), break each into up to 3 tasks, write notes, and track completed history — without the clutter.

---

## Features

- **Google login** — one-click sign in, data synced to cloud
- **Email login** — sign up / sign in with email & password, cloud sync
- **Guest mode** — no account needed, data saved to your browser (localStorage)
- **Priority stars** — rate each work item 1–5; dashboard sorts by priority automatically
- **3-task limit per work item** — enforced by design to keep focus
- **Task completion history** — completed tasks move to history with timestamps
- **Per-work notepad** — auto-saves as you type (debounced 800ms)
- **Three themes** — GitHub Dark, Dark (indigo), Light (warm off-white)
- **Smooth animations** — fade, scale, and slide transitions throughout

---

## Tech Stack

- React (Create React App)
- Firebase — Auth (Google + Email) + Firestore (cloud storage)
- Lucide React — icons
- DM Sans + DM Mono — typography (Google Fonts)

---

## Setup

### 1. Install dependencies

    npm install

### 2. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Add project → give it a name → Create
3. Click the Web icon (</>) to add a web app
4. Copy the firebaseConfig object shown

### 3. Enable Authentication

Firebase Console → Authentication → Sign-in method:
- Enable Google
- Enable Email/Password

### 4. Enable Firestore

Firebase Console → Firestore Database → Create database
- Choose production mode
- Pick a region (e.g. asia-south1 for India)

Set Firestore security rules:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/works/{workId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }

### 5. Add your Firebase config

Open src/firebase.js and replace the YOUR_* placeholder values with your actual config.

### 6. Run locally

    npm start

App opens at http://localhost:3000

---

## Deploy on Hetzner VPS (Nginx)

### Build

    npm run build

### Upload build/ folder to your server

    rsync -avz build/ user@your-vps-ip:/var/www/getworkdone/

### Nginx config (/etc/nginx/sites-available/getworkdone)

    server {
        listen 80;
        server_name getworkdone.yourdomain.com;
        root /var/www/getworkdone;
        index index.html;
        location / {
            try_files $uri $uri/ /index.html;
        }
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

Enable it:

    sudo ln -s /etc/nginx/sites-available/getworkdone /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx

### SSL

    sudo certbot --nginx -d getworkdone.yourdomain.com

### Add your domain to Firebase authorized domains

Firebase Console → Authentication → Settings → Authorized domains → Add your domain

---

## Project Structure

    src/
    ├── App.js                  Root component — auth state, routing
    ├── App.css                 All styles and CSS theme variables
    ├── firebase.js             Firebase init and helpers
    ├── storage.js              Unified data layer (cloud or localStorage)
    ├── themes.js               Theme definitions and applyTheme()
    └── components/
        ├── AuthScreen.jsx      Login UI (Google, Email, Guest)
        ├── Topbar.jsx          Navigation bar
        ├── Dashboard.jsx       Work cards grid
        ├── WorkPage.jsx        Per-work tasks and notepad
        ├── StarRating.jsx      1–5 star priority picker
        ├── AddWorkModal.jsx    Add/edit work item modal
        └── ConfirmModal.jsx    Styled confirmation dialog

---

## Firestore Data Structure

    users/{uid}/works/{workId}
    {
      id: string,
      title: string,
      stars: number (1-5),
      todos: [{ id, text, done, createdAt }],
      history: [{ id, text, done, createdAt, completedAt }],
      note: string,
      createdAt: timestamp
    }

---

## Guest Mode Notes

- Data stored in localStorage under key gwd_data
- Guest preference persists across reloads
- To exit: user menu → "Exit guest mode"
- Data does NOT sync to cloud
