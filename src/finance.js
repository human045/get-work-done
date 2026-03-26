import { db, doc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from './firebase';

const LOCAL_FINANCE_KEY = 'gwd_finance';

function localGet() {
  const def = { accounts: [], transactions: [], categories: [], budgets: [] };
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_FINANCE_KEY));
    return d ? { ...def, ...d } : def;
  } catch {
    return def;
  }
}
function localSet(data) {
  localStorage.setItem(LOCAL_FINANCE_KEY, JSON.stringify(data));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── CLOUD COLLECTIONS ───────────────────────────────────────────
async function cloudGet(uid, colName) {
  try {
    const q = query(collection(db, 'users', uid, colName), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error(`Error reading ${colName} (did you deploy your firestore.rules?):`, error);
    return [];
  }
}

async function cloudSave(uid, colName, item) {
  try {
    await setDoc(doc(db, 'users', uid, colName, item.id), item);
  } catch (error) {
    console.error(`Error saving ${colName}:`, error);
    throw error;
  }
}

async function cloudDelete(uid, colName, itemId) {
  try {
    await deleteDoc(doc(db, 'users', uid, colName, itemId));
  } catch (error) {
    console.error(`Error deleting ${colName}:`, error);
    throw error;
  }
}


// ─── UNIFIED API: ACCOUNTS ────────────────────────────────────────
export async function getAccounts(uid) {
  if (!uid) return localGet().accounts;
  return await cloudGet(uid, 'accounts');
}

export async function saveAccount(uid, account) {
  const item = { ...account, createdAt: account.createdAt || Date.now() };
  if (!uid) {
    const data = localGet();
    const idx = data.accounts.findIndex(a => a.id === item.id);
    if (idx >= 0) data.accounts[idx] = item; else data.accounts.push(item);
    localSet(data);
  } else {
    await cloudSave(uid, 'accounts', item);
  }
}

export async function deleteAccount(uid, accountId) {
  if (!uid) {
    const data = localGet();
    data.accounts = data.accounts.filter(a => a.id !== accountId);
    localSet(data);
  } else {
    await cloudDelete(uid, 'accounts', accountId);
  }
}

// ─── UNIFIED API: TRANSACTIONS ────────────────────────────────────
export async function getTransactions(uid) {
  if (!uid) return localGet().transactions;
  return await cloudGet(uid, 'transactions');
}

export async function saveTransaction(uid, transaction) {
  const item = { ...transaction, createdAt: transaction.createdAt || Date.now() };
  if (!uid) {
    const data = localGet();
    const idx = data.transactions.findIndex(t => t.id === item.id);
    if (idx >= 0) data.transactions[idx] = item; else data.transactions.push(item);
    localSet(data);
  } else {
    await cloudSave(uid, 'transactions', item);
  }
}

export async function deleteTransaction(uid, transactionId) {
  if (!uid) {
    const data = localGet();
    data.transactions = data.transactions.filter(t => t.id !== transactionId);
    localSet(data);
  } else {
    await cloudDelete(uid, 'transactions', transactionId);
  }
}

// ─── UNIFIED API: CATEGORIES ──────────────────────────────────────
export async function getCategories(uid) {
  if (!uid) return localGet().categories;
  return await cloudGet(uid, 'categories');
}

export async function saveCategory(uid, category) {
  const item = { ...category, createdAt: category.createdAt || Date.now() };
  if (!uid) {
    const data = localGet();
    const idx = data.categories.findIndex(c => c.id === item.id);
    if (idx >= 0) data.categories[idx] = item; else data.categories.push(item);
    localSet(data);
  } else {
    await cloudSave(uid, 'categories', item);
  }
}

export async function deleteCategory(uid, categoryId) {
  if (!uid) {
    const data = localGet();
    data.categories = data.categories.filter(c => c.id !== categoryId);
    localSet(data);
  } else {
    await cloudDelete(uid, 'categories', categoryId);
  }
}

// ─── UNIFIED API: BUDGETS ─────────────────────────────────────────
export async function getBudgets(uid) {
  if (!uid) return localGet().budgets;
  return await cloudGet(uid, 'budgets');
}

export async function saveBudget(uid, budget) {
  const item = { ...budget, createdAt: budget.createdAt || Date.now() };
  if (!uid) {
    const data = localGet();
    const idx = data.budgets.findIndex(b => b.id === item.id);
    if (idx >= 0) data.budgets[idx] = item; else data.budgets.push(item);
    localSet(data);
  } else {
    await cloudSave(uid, 'budgets', item);
  }
}

export async function deleteBudget(uid, budgetId) {
  if (!uid) {
    const data = localGet();
    data.budgets = data.budgets.filter(b => b.id !== budgetId);
    localSet(data);
  } else {
    await cloudDelete(uid, 'budgets', budgetId);
  }
}
