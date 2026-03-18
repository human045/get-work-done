import { db, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, orderBy, limit } from './firebase';

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
      tasksCompleted: 0,
      worksFinished: 0,
      updatedAt: Date.now(),
    });
  } else {
    // Always keep name fresh
    await updateDoc(ref, { displayName: displayName || 'User', initials: initials || '?', updatedAt: Date.now() });
  }
}

export async function awardTaskPoints(uid) {
  if (!uid) return;
  const ref = doc(db, 'leaderboard', uid);
  await updateDoc(ref, {
    totalPoints: increment(POINTS.TASK_COMPLETE),
    tasksCompleted: increment(1),
    updatedAt: Date.now(),
  });
}

export async function awardFinishPoints(uid, stars) {
  if (!uid) return;
  const pts = finishBonus(stars);
  const ref = doc(db, 'leaderboard', uid);
  await updateDoc(ref, {
    totalPoints: increment(pts),
    worksFinished: increment(1),
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
