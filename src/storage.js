import { db, doc, setDoc, deleteDoc, collection, getDocs } from './firebase';

const LOCAL_KEY = 'gwd_data';

function localGet() {
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return d || { works: [], deletedWorks: [], workspaces: [] };
  } catch { return { works: [], deletedWorks: [], workspaces: [] }; }
}
function localSet(data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }

// ─── CLOUD WORKS ──────────────────────────────────────────────────
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
  await setDoc(doc(db, 'users', uid, 'deletedWorks', work.id), { ...work, deletedAt: Date.now() });
  await deleteDoc(doc(db, 'users', uid, 'works', work.id));
}
async function cloudDeleteWork(uid, workId) {
  await deleteDoc(doc(db, 'users', uid, 'works', workId));
}
async function cloudPermanentDelete(uid, workId) {
  await deleteDoc(doc(db, 'users', uid, 'deletedWorks', workId));
}

// ─── CLOUD WORKSPACES ─────────────────────────────────────────────
async function cloudGetWorkspaces(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'workspaces'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function cloudSaveWorkspace(uid, ws) {
  await setDoc(doc(db, 'users', uid, 'workspaces', ws.id), ws);
}
async function cloudDeleteWorkspace(uid, wsId) {
  await deleteDoc(doc(db, 'users', uid, 'workspaces', wsId));
}

// ─── UNIFIED API ──────────────────────────────────────────────────
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

export async function deleteWork(uid, workId) {
  if (!uid) {
    const data = localGet();
    data.works = data.works.filter(w => w.id !== workId);
    localSet(data);
  } else {
    await cloudDeleteWork(uid, workId);
  }
}

export async function permanentDelete(uid, workId) {
  if (!uid) {
    const data = localGet();
    data.deletedWorks = (data.deletedWorks || []).filter(w => w.id !== workId);
    localSet(data);
  } else {
    await cloudPermanentDelete(uid, workId);
  }
}

// ─── WORKSPACES ───────────────────────────────────────────────────
export async function getWorkspaces(uid) {
  if (!uid) return localGet().workspaces || [];
  return await cloudGetWorkspaces(uid);
}

export async function saveWorkspace(uid, ws) {
  if (!uid) {
    const data = localGet();
    const idx = data.workspaces.findIndex(w => w.id === ws.id);
    if (idx >= 0) data.workspaces[idx] = ws; else data.workspaces.push(ws);
    localSet(data);
  } else {
    await cloudSaveWorkspace(uid, ws);
  }
}

export async function deleteWorkspace(uid, wsId) {
  if (!uid) {
    const data = localGet();
    data.workspaces = data.workspaces.filter(w => w.id !== wsId);
    localSet(data);
  } else {
    await cloudDeleteWorkspace(uid, wsId);
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
