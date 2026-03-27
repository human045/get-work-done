import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import {
  Wallet, Landmark, ArrowRightLeft, PieChart,
  Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw,
  X, TrendingUp, TrendingDown, CreditCard,
} from 'lucide-react';
import {
  getAccounts, saveAccount, deleteAccount,
  getTransactions, saveTransaction, deleteTransaction,
  generateId,
} from '../finance';
import './ExpenseTracker.css';

// ─── UTILS ────────────────────────────────────────────────────────────
function fmt(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}
function fmtFull(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}
function fmtDate(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(ts));
}

// ─── BASE PRIMITIVES ──────────────────────────────────────────────────


function FieldInput({ label, value, onChange, type = 'text', required }) {
  return (
    <div className="et-field">
      {label && <label className="et-label">{label}{required && ' *'}</label>}
      <input
        type={type} value={value} onChange={onChange} required={required}
        className="et-input"
        onFocus={e => (e.target.style.borderColor = 'var(--md-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--md-outline-var)')}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, required }) {
  return (
    <div className="et-field">
      {label && <label className="et-label">{label}{required && ' *'}</label>}
      <select value={value} onChange={onChange} required={required} className="et-input et-select">
        <option value="" disabled>Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', icon, type = 'button', disabled, style }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`et-btn et-btn-${variant}`}
      style={style}
    >
      {icon}{children}
    </button>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',    label: 'Overview',      icon: PieChart },
  { id: 'accounts',    label: 'Accounts',       icon: Landmark },
  { id: 'transactions',label: 'Transactions',   icon: ArrowRightLeft },
];

function TabBar({ active, onChange }) {
  return (
    <div className="et-tabbar">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`et-tab ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="et-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="et-modal fade-in">
        <div className="et-modal-header">
          <h2 className="et-modal-title">{title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function DashboardView({ accounts, transactions }) {
  const assets  = accounts.filter(a => a.type === 'asset');
  const netWorth = assets.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(now - (6 - i) * 86400000);
    const s   = d.getTime(); const end = s + 86400000;
    const day = transactions.filter(t => t.createdAt >= s && t.createdAt < end);
    return {
      label:   d.toLocaleDateString('en-US', { weekday: 'short' }),
      income:  day.filter(t => t.type === 'deposit').reduce((a, t) => a + t.amount, 0),
      expense: day.filter(t => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0),
    };
  });
  const maxVal = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

  const recent = [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  const totalIncome  = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="et-dashboard fade-in">
      {/* Hero net-worth card */}
      <div className="et-hero">
        <div className="et-hero-left">
          <p className="et-hero-label">Total Net Worth</p>
          <p className="et-hero-amount">{fmt(netWorth)}</p>
          <p className="et-hero-sub">{assets.length} asset account{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <Wallet size={48} className="et-hero-icon" />
      </div>

      {/* Stat chips */}
      <div className="et-stats">
        <div className="et-stat et-stat-income">
          <TrendingDown size={16} />
          <div>
            <p className="et-stat-label">Income</p>
            <p className="et-stat-val">{fmt(totalIncome)}</p>
          </div>
        </div>
        <div className="et-stat et-stat-expense">
          <TrendingUp size={16} />
          <div>
            <p className="et-stat-label">Expenses</p>
            <p className="et-stat-val">{fmt(totalExpense)}</p>
          </div>
        </div>
        <div className="et-stat et-stat-balance">
          <CreditCard size={16} />
          <div>
            <p className="et-stat-label">Balance</p>
            <p className="et-stat-val">{fmt(totalIncome - totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Chart + Recent side-by-side */}
      <div className="et-grid-2">
        {/* 7-day chart */}
        <div className="et-card">
          <p className="et-card-title">7-Day Activity</p>
          <div className="et-chart">
            {chartData.map((d, i) => (
              <div key={i} className="et-chart-col">
                <div className="et-chart-bars">
                  <div
                    className="et-bar et-bar-income"
                    style={{ height: `${(d.income / maxVal) * 100}%` }}
                    title={`Income: ${fmtFull(d.income)}`}
                  />
                  <div
                    className="et-bar et-bar-expense"
                    style={{ height: `${(d.expense / maxVal) * 100}%` }}
                    title={`Expense: ${fmtFull(d.expense)}`}
                  />
                </div>
                <span className="et-chart-label">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="et-chart-legend">
            <span className="et-legend-dot" style={{ background: 'var(--md-primary)' }} /> Income
            <span className="et-legend-dot" style={{ background: 'var(--md-error)', marginLeft: 14 }} /> Expense
          </div>
        </div>

        {/* Recent transactions */}
        <div className="et-card">
          <p className="et-card-title">Recent</p>
          {recent.length === 0
            ? <p className="et-empty">No transactions yet.</p>
            : recent.map(tx => <TxRow key={tx.id} tx={tx} accounts={[]} compact />)
          }
        </div>
      </div>
    </div>
  );
}

// ─── SHARED TX ROW ────────────────────────────────────────────────────
function TxRow({ tx, accounts, onDelete, compact }) {
  const isIncome   = tx.type === 'deposit';
  const isTransfer = tx.type === 'transfer';
  const Icon       = isIncome ? ArrowDownRight : isTransfer ? RefreshCcw : ArrowUpRight;
  const colour     = isIncome ? 'var(--md-success)' : isTransfer ? 'var(--md-outline)' : 'var(--md-error)';
  const prefix     = isIncome ? '+' : isTransfer ? '' : '-';
  const sAcc = accounts.find(a => a.id === tx.sourceAccountId);
  const dAcc = accounts.find(a => a.id === tx.destAccountId);
  const sub  = tx.type === 'withdrawal' && sAcc ? `From ${sAcc.name}` :
               tx.type === 'deposit'    && dAcc ? `To ${dAcc.name}`   :
               sAcc && dAcc ? `${sAcc.name} → ${dAcc.name}` : fmtDate(tx.date);

  return (
    <div className="et-tx-row">
      <div className="et-tx-icon" style={{ color: colour, background: `color-mix(in srgb, ${colour} 12%, var(--md-surface-2))` }}>
        <Icon size={16} />
      </div>
      <div className="et-tx-info">
        <p className="et-tx-desc">{tx.description || (isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense')}</p>
        {!compact && <p className="et-tx-sub">{sub} · {fmtDate(tx.date)}</p>}
        {compact  && <p className="et-tx-sub">{fmtDate(tx.createdAt)}</p>}
      </div>
      <span className="et-tx-amount" style={{ color: isIncome ? 'var(--md-success)' : 'var(--md-on-surface)' }}>
        {prefix}{fmt(tx.amount)}
      </span>
      {onDelete && (
        <button className="btn-icon" style={{ color: 'var(--md-outline)', width: 28, height: 28 }} onClick={() => onDelete(tx)} title="Delete">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ─── ACCOUNTS VIEW ────────────────────────────────────────────────────
function AccountsView({ accounts, onNew, onDelete }) {
  return (
    <div className="et-section fade-in">
      <div className="et-section-header">
        <p className="et-section-title">Accounts</p>
        <Btn icon={<Plus size={14} />} onClick={onNew}>New Account</Btn>
      </div>
      {accounts.length === 0
        ? <p className="et-empty">No accounts yet. Add one to get started.</p>
        : (
          <div className="et-accounts-grid">
            {accounts.map(a => (
              <div key={a.id} className="et-account-card">
                <div className="et-account-top">
                  <div className="et-account-icon"><Landmark size={18} /></div>
                  <button className="btn-icon" style={{ color: 'var(--md-error)', width: 28, height: 28 }} onClick={() => onDelete(a.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="et-account-name">{a.name}</p>
                <p className="et-account-type">{a.type} · {a.currency}</p>
                <p className="et-account-balance">{fmtFull(a.balance, a.currency)}</p>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── TRANSACTIONS VIEW ────────────────────────────────────────────────
function TransactionsView({ transactions, accounts, onNew, onDelete }) {
  return (
    <div className="et-section fade-in">
      <div className="et-section-header">
        <p className="et-section-title">Transactions</p>
        <Btn icon={<Plus size={14} />} onClick={onNew}>New Transaction</Btn>
      </div>
      {transactions.length === 0
        ? <p className="et-empty">No transactions yet.</p>
        : (
          <div className="et-card" style={{ padding: 0, overflow: 'hidden' }}>
            {transactions.map(tx => (
              <TxRow key={tx.id} tx={tx} accounts={accounts} onDelete={onDelete} />
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function ExpenseTracker({ uid, user, isGuest }) {
  const [tab,          setTab]          = useState('dashboard');
  const [loading,      setLoading]      = useState(true);
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [showAccModal, setShowAccModal] = useState(false);
  const [showTxModal,  setShowTxModal]  = useState(false);

  const [accForm, setAccForm] = useState({ name: '', type: 'asset', balance: '0', currency: 'INR' });
  const [txForm,  setTxForm]  = useState({ description: '', amount: '', type: 'withdrawal', sourceAccountId: '', destAccountId: '', date: Date.now() });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [accs, txns] = await Promise.all([getAccounts(uid), getTransactions(uid)]);
        setAccounts(accs || []); setTransactions(txns || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [uid]);

  async function handleSaveAcc(e) {
    e.preventDefault();
    const a = { id: generateId(), ...accForm, balance: Number(accForm.balance) };
    await saveAccount(uid, a);
    setAccounts(p => [a, ...p]);
    posthog.capture('account_created', { type: a.type, currency: a.currency });
    setShowAccModal(false);
    setAccForm({ name: '', type: 'asset', balance: '0', currency: 'INR' });
  }

  async function handleDeleteAcc(id) {
    if (!window.confirm('Delete this account?')) return;
    await deleteAccount(uid, id);
    setAccounts(p => p.filter(a => a.id !== id));
  }

  async function handleSaveTx(e) {
    e.preventDefault();
    const tx = { id: generateId(), ...txForm, amount: Number(txForm.amount), createdAt: Date.now() };
    let upAccs = [...accounts];
    const { amount: amt, type, sourceAccountId: sid, destAccountId: did } = tx;
    if (type === 'withdrawal' && sid)           upAccs = upAccs.map(a => a.id === sid ? { ...a, balance: a.balance - amt } : a);
    else if (type === 'deposit' && did)         upAccs = upAccs.map(a => a.id === did ? { ...a, balance: a.balance + amt } : a);
    else if (type === 'transfer' && sid && did) upAccs = upAccs.map(a => a.id === sid ? { ...a, balance: a.balance - amt } : a.id === did ? { ...a, balance: a.balance + amt } : a);
    await saveTransaction(uid, tx);
    for (const a of upAccs) if (accounts.find(o => o.id === a.id && o.balance !== a.balance)) await saveAccount(uid, a);
    setTransactions(p => [tx, ...p]);
    setAccounts(upAccs);
    posthog.capture('transaction_recorded', { type: tx.type });
    setShowTxModal(false);
    setTxForm({ description: '', amount: '', type: 'withdrawal', sourceAccountId: '', destAccountId: '', date: Date.now() });
  }

  async function handleDeleteTx(tx) {
    if (!window.confirm('Delete this transaction? Balance will not be reverted.')) return;
    await deleteTransaction(uid, tx.id);
    setTransactions(p => p.filter(t => t.id !== tx.id));
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--md-outline)', fontSize: 13 }}>Loading Finance…</p>
    </div>
  );

  return (
    <div className="et-page">
      {/* Page header */}
      <div className="et-page-header">
        <div className="et-page-title-row">
          <Wallet size={22} style={{ color: 'var(--md-primary)', flexShrink: 0 }} />
          <h1 className="et-page-title">Expense Tracker</h1>
        </div>
        <div className="et-page-actions">
          <Btn icon={<Plus size={14} />} onClick={() => setShowAccModal(true)} variant="ghost" style={{ fontSize: 13 }}>Account</Btn>
          <Btn icon={<Plus size={14} />} onClick={() => setShowTxModal(true)}>Transaction</Btn>
        </div>
      </div>

      {/* Tab bar */}
      <TabBar active={tab} onChange={setTab} />

      {/* Tab content */}
      <div className="et-content">
        {tab === 'dashboard'    && <DashboardView accounts={accounts} transactions={transactions} />}
        {tab === 'accounts'     && <AccountsView  accounts={accounts} onNew={() => setShowAccModal(true)} onDelete={handleDeleteAcc} />}
        {tab === 'transactions' && <TransactionsView transactions={transactions} accounts={accounts} onNew={() => setShowTxModal(true)} onDelete={handleDeleteTx} />}
      </div>

      {/* Account modal */}
      <Modal isOpen={showAccModal} onClose={() => setShowAccModal(false)} title="New Account">
        <form onSubmit={handleSaveAcc} className="et-form">
          <FieldInput label="Account Name" value={accForm.name} onChange={e => setAccForm({ ...accForm, name: e.target.value })} required />
          <FieldSelect label="Type" value={accForm.type} onChange={e => setAccForm({ ...accForm, type: e.target.value })} options={[
            { value: 'asset', label: 'Asset (Bank / Cash)' },
            { value: 'expense', label: 'Expense Account' },
            { value: 'revenue', label: 'Revenue Account' },
          ]} required />
          <FieldSelect label="Currency" value={accForm.currency} onChange={e => setAccForm({ ...accForm, currency: e.target.value })} options={[
            { value: 'INR', label: 'INR (₹)' }, { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' },
          ]} required />
          <FieldInput label="Opening Balance" type="number" value={accForm.balance} onChange={e => setAccForm({ ...accForm, balance: e.target.value })} required />
          <div className="et-form-actions">
            <Btn variant="ghost" onClick={() => setShowAccModal(false)}>Cancel</Btn>
            <Btn type="submit">Create Account</Btn>
          </div>
        </form>
      </Modal>

      {/* Transaction modal */}
      <Modal isOpen={showTxModal} onClose={() => setShowTxModal(false)} title="New Transaction">
        <form onSubmit={handleSaveTx} className="et-form">
          <FieldSelect label="Type" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value, sourceAccountId: '', destAccountId: '' })} options={[
            { value: 'withdrawal', label: 'Expense (withdrawal)' },
            { value: 'deposit',    label: 'Income (deposit)' },
            { value: 'transfer',   label: 'Transfer between accounts' },
          ]} required />
          <FieldInput label="Description" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} required />
          <FieldInput label="Amount" type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} required />
          {(txForm.type === 'withdrawal' || txForm.type === 'transfer') && (
            <FieldSelect label="Source Account" value={txForm.sourceAccountId} onChange={e => setTxForm({ ...txForm, sourceAccountId: e.target.value })} options={accounts.filter(a => a.type === 'asset').map(a => ({ value: a.id, label: a.name }))} required />
          )}
          {(txForm.type === 'deposit' || txForm.type === 'transfer') && (
            <FieldSelect label="Destination Account" value={txForm.destAccountId} onChange={e => setTxForm({ ...txForm, destAccountId: e.target.value })} options={accounts.filter(a => a.type === 'asset').map(a => ({ value: a.id, label: a.name }))} required />
          )}
          <div className="et-form-actions">
            <Btn variant="ghost" onClick={() => setShowTxModal(false)}>Cancel</Btn>
            <Btn type="submit">Save Transaction</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
