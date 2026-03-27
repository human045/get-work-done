import { db, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from './firebase';

const LOCAL_KEY = 'gwd_data';
const MIGRATION_PREFIX = 'gwd_migrated_legacy_user_';
const MIGRATABLE_USER_COLLECTIONS = [
  'works',
  'deletedWorks',
  'workspaces',
  'accounts',
  'transactions',
  'categories',
  'budgets',
];

function localGet() {
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return d || { works: [], deletedWorks: [], workspaces: [], notebooks: [], notebookPages: [] };
  } catch { return { works: [], deletedWorks: [], workspaces: [], notebooks: [], notebookPages: [] }; }
}
function localSet(data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }

function migrationMarker(fromUid, toUid) {
  return `${MIGRATION_PREFIX}${fromUid}_${toUid}`;
}

function hasMeaningfulLeaderboardData(data) {
  if (!data) return false;
  return Boolean(
    data.totalPoints ||
    data.pointsBalance ||
    data.tasksCompleted ||
    data.worksFinished ||
    data.username ||
    data.status ||
    data.avatarColor ||
    data.photoURL ||
    (Array.isArray(data.finishedWorks) && data.finishedWorks.length) ||
    (Array.isArray(data.purchasedItems) && data.purchasedItems.length)
  );
}

async function readUserCollection(uid, colName) {
  const snap = await getDocs(collection(db, 'users', uid, colName));
  return snap.docs;
}

export async function migrateLegacyUserData(fromUid, toUid) {
  if (!fromUid || !toUid || fromUid === toUid) {
    return { migrated: false, reason: 'invalid-source-or-target' };
  }

  const marker = migrationMarker(fromUid, toUid);
  if (localStorage.getItem(marker) === '1') {
    return { migrated: false, reason: 'already-migrated' };
  }

  const [legacyBoardSnap, targetBoardSnap, ...collectionSnaps] = await Promise.all([
    getDoc(doc(db, 'leaderboard', fromUid)),
    getDoc(doc(db, 'leaderboard', toUid)),
    ...MIGRATABLE_USER_COLLECTIONS.flatMap(colName => [
      readUserCollection(fromUid, colName),
      readUserCollection(toUid, colName),
    ]),
  ]);

  const perCollection = {};
  let legacyDocCount = 0;
  let targetDocCount = 0;

  MIGRATABLE_USER_COLLECTIONS.forEach((colName, index) => {
    const legacyDocs = collectionSnaps[index * 2];
    const targetDocs = collectionSnaps[(index * 2) + 1];
    legacyDocCount += legacyDocs.length;
    targetDocCount += targetDocs.length;
    perCollection[colName] = legacyDocs;
  });

  const legacyHasData = legacyBoardSnap.exists() || legacyDocCount > 0;
  const targetHasMeaningfulData =
    hasMeaningfulLeaderboardData(targetBoardSnap.exists() ? targetBoardSnap.data() : null) ||
    targetDocCount > 0;

  if (!legacyHasData) {
    return { migrated: false, reason: 'no-legacy-data-found' };
  }

  if (targetHasMeaningfulData) {
    return { migrated: false, reason: 'target-already-has-data' };
  }

  const writes = [];

  if (legacyBoardSnap.exists()) {
    writes.push(
      setDoc(doc(db, 'leaderboard', toUid), {
        ...legacyBoardSnap.data(),
        uid: toUid,
        migratedFromUid: fromUid,
        updatedAt: Date.now(),
      })
    );
  }

  for (const colName of MIGRATABLE_USER_COLLECTIONS) {
    for (const itemDoc of perCollection[colName]) {
      writes.push(
        setDoc(doc(db, 'users', toUid, colName, itemDoc.id), itemDoc.data())
      );
    }
  }

  await Promise.all(writes);
  localStorage.setItem(marker, '1');

  return {
    migrated: true,
    fromUid,
    toUid,
    migratedCollections: MIGRATABLE_USER_COLLECTIONS.filter(colName => perCollection[colName].length > 0),
    migratedDocs: legacyDocCount + (legacyBoardSnap.exists() ? 1 : 0),
  };
}

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

// ─── CLOUD NOTEBOOKS ──────────────────────────────────────────────
async function cloudGetNotebooks(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'notebooks'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function cloudSaveNotebook(uid, notebook) {
  await setDoc(doc(db, 'users', uid, 'notebooks', notebook.id), notebook);
}
async function cloudDeleteNotebook(uid, notebookId) {
  await deleteDoc(doc(db, 'users', uid, 'notebooks', notebookId));
}
async function cloudGetNotebookPages(uid, notebookId) {
  const snap = await getDocs(collection(db, 'users', uid, 'notebooks', notebookId, 'pages'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function cloudSaveNotebookPage(uid, notebookId, page) {
  await setDoc(doc(db, 'users', uid, 'notebooks', notebookId, 'pages', page.id), page);
}
async function cloudDeleteNotebookPage(uid, notebookId, pageId) {
  await deleteDoc(doc(db, 'users', uid, 'notebooks', notebookId, 'pages', pageId));
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

// ─── NOTEBOOKS ────────────────────────────────────────────────────
export async function getNotebooks(uid) {
  if (!uid) return localGet().notebooks || [];
  return await cloudGetNotebooks(uid);
}

export async function saveNotebook(uid, notebook) {
  if (!uid) {
    const data = localGet();
    const idx = (data.notebooks || []).findIndex(n => n.id === notebook.id);
    if (idx >= 0) data.notebooks[idx] = notebook; else (data.notebooks ||= []).push(notebook);
    localSet(data);
  } else {
    await cloudSaveNotebook(uid, notebook);
  }
}

export async function deleteNotebook(uid, notebookId) {
  if (!uid) {
    const data = localGet();
    data.notebooks = (data.notebooks || []).filter(n => n.id !== notebookId);
    data.notebookPages = (data.notebookPages || []).filter(p => p.notebookId !== notebookId);
    localSet(data);
  } else {
    const pages = await cloudGetNotebookPages(uid, notebookId);
    await Promise.all([
      ...pages.map(page => cloudDeleteNotebookPage(uid, notebookId, page.id)),
      cloudDeleteNotebook(uid, notebookId),
    ]);
  }
}

export async function getNotebookPages(uid, notebookId) {
  if (!notebookId) return [];
  if (!uid) return (localGet().notebookPages || []).filter(p => p.notebookId === notebookId);
  return await cloudGetNotebookPages(uid, notebookId);
}

export async function saveNotebookPage(uid, notebookId, page) {
  if (!notebookId) return;
  if (!uid) {
    const data = localGet();
    const idx = (data.notebookPages || []).findIndex(p => p.id === page.id && p.notebookId === notebookId);
    if (idx >= 0) data.notebookPages[idx] = page; else (data.notebookPages ||= []).push(page);
    localSet(data);
  } else {
    await cloudSaveNotebookPage(uid, notebookId, page);
  }
}

export async function deleteNotebookPage(uid, notebookId, pageId) {
  if (!notebookId || !pageId) return;
  if (!uid) {
    const data = localGet();
    const doomedIds = new Set([pageId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const page of (data.notebookPages || [])) {
        if (page.notebookId === notebookId && doomedIds.has(page.parentId) && !doomedIds.has(page.id)) {
          doomedIds.add(page.id);
          changed = true;
        }
      }
    }
    data.notebookPages = (data.notebookPages || []).filter(p => !(p.notebookId === notebookId && doomedIds.has(p.id)));
    localSet(data);
  } else {
    const pages = await cloudGetNotebookPages(uid, notebookId);
    const doomedIds = new Set([pageId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const page of pages) {
        if (doomedIds.has(page.parentId) && !doomedIds.has(page.id)) {
          doomedIds.add(page.id);
          changed = true;
        }
      }
    }
    await Promise.all([...doomedIds].map(id => cloudDeleteNotebookPage(uid, notebookId, id)));
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
