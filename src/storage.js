import { db, doc, setDoc, deleteDoc, collection, getDocs } from './firebase';

// ─── LOCAL STORAGE (Guest) ───────────────────────────────────────────────────

const LOCAL_KEY = 'gwd_data';

function localGet() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { works: [] }; }
  catch { return { works: [] }; }
}

function localSet(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// ─── CLOUD STORAGE (Firebase) ────────────────────────────────────────────────

async function cloudGetWorks(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'works'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function cloudSaveWork(uid, work) {
  await setDoc(doc(db, 'users', uid, 'works', work.id), work);
}

async function cloudDeleteWork(uid, workId) {
  await deleteDoc(doc(db, 'users', uid, 'works', workId));
}

// ─── UNIFIED API ─────────────────────────────────────────────────────────────

export async function getWorks(uid) {
  if (!uid) return localGet().works;
  return await cloudGetWorks(uid);
}

export async function saveWork(uid, work) {
  if (!uid) {
    const data = localGet();
    const idx = data.works.findIndex(w => w.id === work.id);
    if (idx >= 0) data.works[idx] = work;
    else data.works.push(work);
    localSet(data);
  } else {
    await cloudSaveWork(uid, work);
  }
}

export async function deleteWork(uid, workId) {
  if (!uid) {
    const data = localGet();
    data.works = data.works.filter(w => w.id !== workId);
    localSet(data);
  } else {
    await cloudDeleteWork(uid, workId);
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
