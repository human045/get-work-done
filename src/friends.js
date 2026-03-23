import { db, doc, setDoc, deleteDoc, collection, getDocs, query, where, orderBy, onSnapshot, limit } from './firebase';
import { generateId } from './storage';

// chatId is always sorted uids joined by _ so both users get the same id
export function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

// ── Search users by displayName prefix (from leaderboard collection) ──────────
export async function searchUsers(searchTerm, myUid) {
  if (!searchTerm.trim()) return [];
  const snap = await getDocs(collection(db, 'leaderboard'));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => d.data())
    .filter(u => u.uid !== myUid && u.displayName?.toLowerCase().includes(term))
    .slice(0, 10);
}

// ── Friend requests ───────────────────────────────────────────────────────────
export async function sendFriendRequest(fromUid, fromName, fromInitials, toUid) {
  const id = generateId();
  await setDoc(doc(db, 'friendRequests', id), {
    id, from: fromUid, fromName, fromInitials,
    to: toUid, status: 'pending', createdAt: Date.now(),
  });
}

export async function acceptFriendRequest(req, myUid, myName, myInitials) {
  // Write to both users' friends lists
  await setDoc(doc(db, 'friends', myUid, 'list', req.from), {
    uid: req.from, displayName: req.fromName, initials: req.fromInitials,
    since: Date.now(),
  });
  await setDoc(doc(db, 'friends', req.from, 'list', myUid), {
    uid: myUid, displayName: myName, initials: myInitials,
    since: Date.now(),
  });
  // Pre-create the private chat document with both participants
  // so Firestore rules can verify membership for both users immediately
  const cid = chatId(myUid, req.from);
  await setDoc(doc(db, 'privateChats', cid), {
    participants: [myUid, req.from],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true });

  await deleteDoc(doc(db, 'friendRequests', req.id));
}

export async function declineFriendRequest(reqId) {
  await deleteDoc(doc(db, 'friendRequests', reqId));
}

export async function removeFriend(myUid, friendUid) {
  await deleteDoc(doc(db, 'friends', myUid, 'list', friendUid));
  await deleteDoc(doc(db, 'friends', friendUid, 'list', myUid));
}

// ── Real-time listeners ───────────────────────────────────────────────────────
export function listenFriends(uid, cb) {
  return onSnapshot(collection(db, 'friends', uid, 'list'), snap => {
    cb(snap.docs.map(d => d.data()));
  });
}

export function listenIncomingRequests(uid, cb) {
  const q = query(collection(db, 'friendRequests'), where('to', '==', uid), where('status', '==', 'pending'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data())));
}

export function listenOutgoingRequests(uid, cb) {
  const q = query(collection(db, 'friendRequests'), where('from', '==', uid));
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data())));
}

// ── Private chat ──────────────────────────────────────────────────────────────
export async function sendMessage(myUid, myName, friendUid, text) {
  const cid = chatId(myUid, friendUid);

  // Ensure the parent chat doc exists with participants list
  // (setDoc with merge won't overwrite if already exists)
  await setDoc(doc(db, 'privateChats', cid), {
    participants: [myUid, friendUid],
    updatedAt: Date.now(),
  }, { merge: true });

  const id = generateId();
  await setDoc(doc(db, 'privateChats', cid, 'messages', id), {
    id, uid: myUid, displayName: myName,
    text: text.trim(), createdAt: Date.now(),
  });
}

export function listenMessages(myUid, friendUid, cb) {
  const cid = chatId(myUid, friendUid);
  const q = query(
    collection(db, 'privateChats', cid, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data())));
}

export async function deleteMessage(myUid, friendUid, msgId) {
  const cid = chatId(myUid, friendUid);
  await deleteDoc(doc(db, 'privateChats', cid, 'messages', msgId));
}
