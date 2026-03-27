import { db, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, orderBy, limit, where } from './firebase';

// ── Point values ─────────────────────────────────────────────────
export const POINTS = {
  TASK_COMPLETE: 10,       // completing a single task
  WORK_FINISH: 50,         // marking entire work as finished
  // stars multiplier: stars * 5 bonus on work finish (5-star = +25 bonus)
};

export function finishBonus(stars) {
  return POINTS.WORK_FINISH + (stars * 5);
}

// ── User points doc: /leaderboard/{uid} ──────────────────────────
// { uid, displayName, initials, totalPoints, tasksCompleted, worksFinished, updatedAt }

export async function ensureLeaderboardEntry(uid, displayName, initials) {
  if (!uid) return;
  const ref = doc(db, 'leaderboard', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName: displayName || 'User',
      initials: initials || '?',
      totalPoints: 0,
      pointsBalance: 0,
      purchasedItems: [],
      tasksCompleted: 0,
      worksFinished: 0,
      notebooksEnabled: true,
      notebookSocialsEnabled: false,
      updatedAt: Date.now(),
    });
  } else {
    // Always keep name fresh
    const data = snap.data();
    const updates = { displayName: displayName || 'User', initials: initials || '?', updatedAt: Date.now() };
    if (data.pointsBalance === undefined) {
      updates.pointsBalance = data.totalPoints || 0;
    }
    if (data.notebooksEnabled === undefined) {
      updates.notebooksEnabled = true;
    }
    if (data.notebookSocialsEnabled === undefined) {
      updates.notebookSocialsEnabled = false;
    }
    await updateDoc(ref, updates);
  }
}

export async function awardTaskPoints(uid) {
  if (!uid) return;
  const ref = doc(db, 'leaderboard', uid);
  await updateDoc(ref, {
    totalPoints: increment(POINTS.TASK_COMPLETE),
    pointsBalance: increment(POINTS.TASK_COMPLETE),
    tasksCompleted: increment(1),
    updatedAt: Date.now(),
  });
}

export async function awardFinishPoints(uid, stars, workTitle, workId) {
  if (!uid) return;
  const pts = finishBonus(stars);
  const ref = doc(db, 'leaderboard', uid);
  // Get current finishedWorks array and append
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().finishedWorks || []) : [];
  const entry = {
    id: workId || Date.now().toString(),
    title: workTitle || 'Untitled',
    stars,
    finishedAt: Date.now(),
  };
  // Keep last 10 only
  const updated = [entry, ...current].slice(0, 10);
  await updateDoc(ref, {
    totalPoints: increment(pts),
    pointsBalance: increment(pts),
    worksFinished: increment(1),
    finishedWorks: updated,
    updatedAt: Date.now(),
  });
}

export async function getMyPoints(uid) {
  if (!uid) return null;
  const ref = doc(db, 'leaderboard', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function getLeaderboard(n = 20) {
  const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'desc'), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function buyShopItem(uid, cost, itemId) {
  if (!uid) return false;
  const ref = doc(db, 'leaderboard', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  
  const data = snap.data();
  const balance = data.pointsBalance !== undefined ? data.pointsBalance : (data.totalPoints || 0);
  
  if (balance < cost) return false;
  if ((data.purchasedItems || []).includes(itemId)) return false;
  
  await updateDoc(ref, {
    pointsBalance: increment(-cost),
    purchasedItems: [...(data.purchasedItems || []), itemId],
    updatedAt: Date.now()
  });
  return true;
}

export async function setUserStatus(uid, status) {
  if (!uid) return;
  const ref = doc(db, 'leaderboard', uid);
  await updateDoc(ref, { status: status.trim().slice(0, 80), updatedAt: Date.now() });
}

export async function getPublicProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, 'leaderboard', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ── Profile editing ───────────────────────────────────────────────
export async function updateProfile(uid, { displayName, username, avatarColor, status, photoURL, notebooksEnabled, notebookSocialsEnabled }) {
  if (!uid) return;
  const ref = doc(db, 'leaderboard', uid);
  const updates = { updatedAt: Date.now() };
  if (displayName !== undefined) updates.displayName = displayName.trim().slice(0, 40);
  if (username   !== undefined) updates.username    = username.trim().toLowerCase().slice(0, 20);
  if (avatarColor !== undefined) updates.avatarColor = avatarColor;
  if (status     !== undefined) updates.status      = status.trim().slice(0, 80);
  if (photoURL !== undefined) updates.photoURL = photoURL || null;
  if (notebooksEnabled !== undefined) updates.notebooksEnabled = Boolean(notebooksEnabled);
  if (notebookSocialsEnabled !== undefined) updates.notebookSocialsEnabled = Boolean(notebookSocialsEnabled);
  await updateDoc(ref, updates);
}

export async function isUsernameTaken(username, myUid) {
  if (!username.trim()) return false;
  const q = query(collection(db, 'leaderboard'), where('username', '==', username.trim().toLowerCase()));
  const snap = await getDocs(q);
  // taken if exists and not by current user
  return snap.docs.some(d => d.id !== myUid);
}
