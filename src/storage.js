import { db, doc, setDoc, deleteDoc, collection, getDocs } from './firebase';

const LOCAL_KEY = 'gwd_data';

function localGet() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { works: [], deletedWorks: [] }; }
  catch { return { works: [], deletedWorks: [] }; }
}
function localSet(data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }

// ─── CLOUD ───────────────────────────────────────────────────────────────────
async function cloudGetWorks(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'works'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function cloudGetDeleted(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'deletedWorks'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function cloudSaveWork(uid, work) {
  await setDoc(doc(db, 'users', uid, 'works', work.id), work);
}
async function cloudArchiveWork(uid, work) {
  // Save to deletedWorks collection, remove from works
  await setDoc(doc(db, 'users', uid, 'deletedWorks', work.id), {
    ...work,
    deletedAt: Date.now()
  });
  await deleteDoc(doc(db, 'users', uid, 'works', work.id));
}
async function cloudDeleteWork(uid, workId) {
  await deleteDoc(doc(db, 'users', uid, 'works', workId));
}
async function cloudPermanentDelete(uid, workId) {
  await deleteDoc(doc(db, 'users', uid, 'deletedWorks', workId));
}

// ─── UNIFIED API ─────────────────────────────────────────────────────────────
export async function getWorks(uid) {
  if (!uid) return localGet().works;
  return await cloudGetWorks(uid);
}

export async function getDeletedWorks(uid) {
  if (!uid) return localGet().deletedWorks || [];
  return await cloudGetDeleted(uid);
}

export async function saveWork(uid, work) {
  if (!uid) {
    const data = localGet();
    const idx = data.works.findIndex(w => w.id === work.id);
    if (idx >= 0) data.works[idx] = work; else data.works.push(work);
    localSet(data);
  } else {
    await cloudSaveWork(uid, work);
  }
}

// Move work to deleted archive (finish or delete)
export async function archiveWork(uid, work) {
  const archived = { ...work, deletedAt: Date.now() };
  if (!uid) {
    const data = localGet();
    data.works = data.works.filter(w => w.id !== work.id);
    data.deletedWorks = [archived, ...(data.deletedWorks || [])];
    localSet(data);
  } else {
    await cloudArchiveWork(uid, archived);
  }
}

// Hard delete (no archive)
export async function deleteWork(uid, workId) {
  if (!uid) {
    const data = localGet();
    data.works = data.works.filter(w => w.id !== workId);
    localSet(data);
  } else {
    await cloudDeleteWork(uid, workId);
  }
}

// Permanently remove from deleted history
export async function permanentDelete(uid, workId) {
  if (!uid) {
    const data = localGet();
    data.deletedWorks = (data.deletedWorks || []).filter(w => w.id !== workId);
    localSet(data);
  } else {
    await cloudPermanentDelete(uid, workId);
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
