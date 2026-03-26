import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { 
  Wallet, Landmark, ArrowRightLeft, PieChart, 
  Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, 
  X
} from 'lucide-react';
import { 
  getAccounts, saveAccount, deleteAccount,
  getTransactions, saveTransaction, deleteTransaction,
  generateId
} from '../finance';

const E = {
  decel: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  std:   'cubic-bezier(0.2, 0, 0, 1)',
};

// ─── UTILS ─────────────────────────────────────────────────────────
function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}
function formatDate(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts));
}

// ─── STYLED COMPONENTS ──────────────────────────────────────────────
function Card({ children, style, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--md-surface-1)',
      border: '1px solid var(--md-outline-var)',
      borderRadius: 'var(--md-shape-xl)',
      padding: 24,
      boxShadow: 'var(--md-elev-1)',
      ...style
    }}>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-var)' }}>{label} {required && '*'}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          background: 'var(--md-surface-2)',
          border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-md)',
          padding: '10px 14px', fontSize: 14,
          color: 'var(--md-on-surface)',
          outline: 'none', fontFamily: 'var(--md-font)',
          transition: `border-color 150ms ${E.std}, box-shadow 150ms ${E.std}`,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--md-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--md-primary) 16%, transparent)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--md-outline-var)';
          e.currentTarget.style.boxShadow = 'none';
        }}
=======
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
const E = { std: 'cubic-bezier(0.2,0,0,1)', decel: 'cubic-bezier(0.05,0.7,0.1,1)' };

function FieldInput({ label, value, onChange, type = 'text', required }) {
  return (
    <div className="et-field">
      {label && <label className="et-label">{label}{required && ' *'}</label>}
      <input
        type={type} value={value} onChange={onChange} required={required}
        className="et-input"
        onFocus={e => (e.target.style.borderColor = 'var(--md-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--md-outline-var)')}
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
      />
    </div>
  );
}

<<<<<<< HEAD
function Select({ label, value, onChange, options, required = false, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-var)' }}>{label} {required && '*'}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          background: 'var(--md-surface-2)',
          border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-md)',
          padding: '10px 14px', fontSize: 14,
          color: 'var(--md-on-surface)',
          outline: 'none', fontFamily: 'var(--md-font)', cursor: 'pointer',
          appearance: 'none',
        }}
      >
        <option value="" disabled>Select...</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
=======
function FieldSelect({ label, value, onChange, options, required }) {
  return (
    <div className="et-field">
      {label && <label className="et-label">{label}{required && ' *'}</label>}
      <select value={value} onChange={onChange} required={required} className="et-input et-select">
        <option value="" disabled>Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
      </select>
    </div>
  );
}

<<<<<<< HEAD
function Button({ children, onClick, variant = 'primary', icon, type = 'button', disabled = false, style }) {
  const bg = variant === 'primary' ? 'var(--md-primary)' : variant === 'danger' ? 'var(--md-error)' : 'var(--md-surface-3)';
  const c = variant === 'primary' ? 'var(--md-on-primary)' : variant === 'danger' ? 'var(--md-on-error)' : 'var(--md-on-surface)';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: bg, color: c, border: 'none',
        padding: '10px 18px', borderRadius: 'var(--md-shape-full)',
        fontSize: 14, fontWeight: 600, fontFamily: 'var(--md-font)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        transition: `all 150ms ${E.std}`,
        boxShadow: variant === 'primary' ? 'var(--md-elev-1)' : 'none',
        ...style
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.filter = 'none'; }}
    >
      {icon} {children}
=======
function Btn({ children, onClick, variant = 'primary', icon, type = 'button', disabled, style }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`et-btn et-btn-${variant}`}
      style={style}
    >
      {icon}{children}
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
    </button>
  );
}

<<<<<<< HEAD
// ─── TABS ────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: <PieChart size={16} /> },
  { id: 'accounts', label: 'Accounts', icon: <Landmark size={16} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={16} /> },
];

function TabNav({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 16px' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 'var(--md-shape-full)',
            background: active === t.id ? 'var(--md-primary)' : 'var(--md-surface-2)',
            color: active === t.id ? 'var(--md-on-primary)' : 'var(--md-on-surface-var)',
            border: active === t.id ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-var)',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--md-font)', cursor: 'pointer',
            transition: `all 200ms ${E.std}`,
          }}
        >
          {t.icon} {t.label}
=======
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
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
        </button>
      ))}
    </div>
  );
}

<<<<<<< HEAD
// ─── SUB-COMPONENTS ──────────────────────────────────────────────
function DashboardView({ accounts, transactions }) {
  // calculate totals
  const assetAccounts = accounts.filter(a => a.type === 'asset');
  const totalAssets = assetAccounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  
  const recentTransactions = [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const data = [];
  const now = new Date();
  now.setHours(0,0,0,0);
  for (let i = 6; i >= 0; i--) {
     const d = new Date(now.getTime() - i * 86400000);
     const dayStart = d.getTime();
     const dayEnd = dayStart + 86400000;
     const dayTxns = transactions.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd);
     const income = dayTxns.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
     const expense = dayTxns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
     data.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), income, expense });
  }
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: `fadeIn 400ms ${E.decel}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <Card style={{ background: 'linear-gradient(135deg, var(--md-primary), color-mix(in srgb, var(--md-primary) 60%, black))', color: 'var(--md-on-primary)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.9, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={16}/> Net Worth (Assets)</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>{formatCurrency(totalAssets)}</div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Income vs Expenses (7 Days)</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--md-primary)'}}></span> Income</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--md-error)'}}></span> Expense</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 10 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', maxWidth: 40 }}>
                 <div title={`Income: ${formatCurrency(d.income)}`} style={{ flex: 1, height: `${(d.income / maxVal) * 100}%`, background: 'color-mix(in srgb, var(--md-primary) 80%, transparent)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }} />
                 <div title={`Expense: ${formatCurrency(d.expense)}`} style={{ flex: 1, height: `${(d.expense / maxVal) * 100}%`, background: 'color-mix(in srgb, var(--md-error) 80%, transparent)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--md-outline)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Recent Transactions</span>
          </div>
          {recentTransactions.length === 0 ? (
            <div style={{ color: 'var(--md-outline)', fontSize: 14, fontStyle: 'italic' }}>No transactions yet.</div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentTransactions.map(tx => {
                   const isIncome = tx.type === 'deposit';
                   const isTransfer = tx.type === 'transfer';
                   return (
                     <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--md-surface-2)', borderRadius: 'var(--md-shape-md)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         <div style={{ width: 40, height: 40, borderRadius: '50%', background: isIncome ? 'color-mix(in srgb, var(--md-primary) 20%, transparent)' : isTransfer ? 'color-mix(in srgb, var(--md-outline) 20%, transparent)' : 'color-mix(in srgb, var(--md-error) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isIncome ? 'var(--md-primary)' : isTransfer ? 'var(--md-outline)' : 'var(--md-error)' }}>
                           {isIncome ? <ArrowDownRight size={20}/> : isTransfer ? <RefreshCcw size={18}/> : <ArrowUpRight size={20}/>}
                         </div>
                         <div>
                           <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--md-on-surface)' }}>{tx.description || (isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense')}</div>
                           <div style={{ fontSize: 12, color: 'var(--md-on-surface-var)' }}>{formatDate(tx.date)}</div>
                         </div>
                       </div>
                       <div style={{ fontWeight: 700, fontSize: 15, color: isIncome ? 'var(--md-primary)' : isTransfer ? 'var(--md-on-surface)' : 'var(--md-error)' }}>
                         {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount)}
                       </div>
                     </div>
                   );
                })}
             </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Accounts</div>
          {assetAccounts.length === 0 ? (
            <div style={{ color: 'var(--md-outline)', fontSize: 14, fontStyle: 'italic' }}>No asset accounts found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assetAccounts.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--md-outline-var)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Landmark size={16} color="var(--md-outline)" />
                    <span style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>{a.name}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(a.balance)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: `fadeIn 300ms ${E.decel}`
    }}>
      <div style={{
        background: 'var(--md-surface-1)', borderRadius: 'var(--md-shape-xl)',
        width: '100%', maxWidth: 500, padding: 24,
        boxShadow: 'var(--md-elev-3)', display: 'flex', flexDirection: 'column', gap: 20,
        transform: 'translateY(0)', animation: `slideUp 400ms ${E.decel}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, margin: 0, fontFamily: 'var(--md-font)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-outline-var)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
=======
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
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
    </div>
  );
}

<<<<<<< HEAD
export default function ExpenseTracker({ uid, user, isGuest }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Modals
  const [showAccModal, setShowAccModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);

  // Forms
  const [accForm, setAccForm] = useState({ name: '', type: 'asset', balance: '0', currency: 'INR' });
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'withdrawal', sourceAccountId: '', destAccountId: '', date: Date.now() });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [accs, txns] = await Promise.all([
          getAccounts(uid), getTransactions(uid)
        ]);
        setAccounts(accs || []);
        setTransactions(txns || []);
      } catch (err) {
        console.error("Failed to load finance data:", err);
      }
      setLoading(false);
    };
    loadData();
  }, [uid]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    const newAcc = { id: generateId(), ...accForm, balance: Number(accForm.balance) };
    await saveAccount(uid, newAcc);
    setAccounts(prev => [newAcc, ...prev]);
    setShowAccModal(false);
    setAccForm({ name: '', type: 'asset', balance: '0', currency: 'USD' });
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    await deleteAccount(uid, id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const newTx = { id: generateId(), ...txForm, amount: Number(txForm.amount), createdAt: Date.now() };
    
    // Apply balance changes
    const amt = newTx.amount;
    const sId = newTx.sourceAccountId;
    const dId = newTx.destAccountId;
    let upAccounts = [...accounts];

    if (newTx.type === 'withdrawal' && sId) {
      upAccounts = upAccounts.map(a => a.id === sId ? { ...a, balance: a.balance - amt } : a);
    } else if (newTx.type === 'deposit' && dId) {
      upAccounts = upAccounts.map(a => a.id === dId ? { ...a, balance: a.balance + amt } : a);
    } else if (newTx.type === 'transfer' && sId && dId) {
      upAccounts = upAccounts.map(a => a.id === sId ? { ...a, balance: a.balance - amt } : a.id === dId ? { ...a, balance: a.balance + amt } : a);
    }

    // Save transaction and updated accounts
    await saveTransaction(uid, newTx);
    for (const a of upAccounts) {
      if (accounts.find(old => old.id === a.id && old.balance !== a.balance)) {
        await saveAccount(uid, a);
      }
    }

    // Update local state
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(upAccounts);
    setShowTxModal(false);
    setTxForm({ description: '', amount: '', type: 'withdrawal', sourceAccountId: '', destAccountId: '', date: Date.now() });
  };

  const handleDeleteTransaction = async (tx) => {
    if (!window.confirm('Are you sure you want to delete this transaction? Balance will not be automatically reverted.')) return;
    await deleteTransaction(uid, tx.id);
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
  };

  // ─── RENDER COMPONENTS ───────────────────────────────────────
  const renderAccounts = () => (
    <div style={{ animation: `fadeIn 400ms ${E.decel}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>Accounts</h2>
        <Button icon={<Plus size={16} />} onClick={() => setShowAccModal(true)}>New Account</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {accounts.map(a => (
          <Card key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'var(--md-surface-2)', padding: 10, borderRadius: '50%', color: 'var(--md-primary)' }}>
                  <Landmark size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--md-on-surface-var)', textTransform: 'capitalize' }}>{a.type} Account</div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteAccount(a.id)}
                style={{ background: 'none', border: 'none', color: 'var(--md-error)', cursor: 'pointer', padding: 4, borderRadius: 4 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{formatCurrency(a.balance, a.currency)}</div>
          </Card>
        ))}
        {accounts.length === 0 && <div style={{ color: 'var(--md-on-surface-var)' }}>No accounts created yet.</div>}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div style={{ animation: `fadeIn 400ms ${E.decel}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>Transactions</h2>
        <Button icon={<Plus size={16} />} onClick={() => setShowTxModal(true)}>New Transaction</Button>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--md-on-surface-var)' }}>No transactions yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.map((tx, idx) => {
              const isIncome = tx.type === 'deposit';
              const isTransfer = tx.type === 'transfer';
              const sAcc = accounts.find(a => a.id === tx.sourceAccountId);
              const dAcc = accounts.find(a => a.id === tx.destAccountId);

              return (
                <div key={tx.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px',
                  borderBottom: idx !== transactions.length - 1 ? '1px solid var(--md-outline-var)' : 'none',
                  transition: `background 150ms ${E.std}`
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--md-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: isIncome ? 'color-mix(in srgb, var(--md-primary) 15%, transparent)' : isTransfer ? 'color-mix(in srgb, var(--md-outline) 15%, transparent)' : 'color-mix(in srgb, var(--md-error) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isIncome ? 'var(--md-primary)' : isTransfer ? 'var(--md-outline)' : 'var(--md-error)' }}>
                      {isIncome ? <ArrowDownRight size={20}/> : isTransfer ? <RefreshCcw size={18}/> : <ArrowUpRight size={20}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--md-on-surface)', marginBottom: 2 }}>{tx.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--md-on-surface-var)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {tx.type === 'withdrawal' && sAcc && <span>From: {sAcc.name}</span>}
                        {tx.type === 'deposit' && dAcc && <span>To: {dAcc.name}</span>}
                        {tx.type === 'transfer' && sAcc && dAcc && <span>{sAcc.name} <ArrowRightLeft size={10} style={{margin:'0 2px'}}/> {dAcc.name}</span>}
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: isIncome ? 'var(--md-primary)' : isTransfer ? 'var(--md-on-surface)' : 'var(--md-on-surface)' }}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <button onClick={() => handleDeleteTransaction(tx)} style={{ background: 'none', border: 'none', color: 'var(--md-outline)', cursor: 'pointer', padding: 4 }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Finance Engine...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--md-surface-1)', color: 'var(--md-on-surface)', padding: '32px 40px', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wallet size={32} color="var(--md-primary)" />
          Expense Tracker
        </h1>
        <div style={{ fontSize: 13, color: 'var(--md-on-surface-var)' }}>
          Secured by Firestore
        </div>
      </div>

      <TabNav active={tab} onChange={setTab} />

      <div style={{ marginTop: 24 }}>
        {tab === 'dashboard' && <DashboardView accounts={accounts} transactions={transactions} />}
        {tab === 'accounts' && renderAccounts()}
        {tab === 'transactions' && renderTransactions()}
      </div>

      {/* Account Modal */}
      <Modal isOpen={showAccModal} onClose={() => setShowAccModal(false)} title="Create Account">
        <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Account Name" value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} required />
          <Select label="Account Type" value={accForm.type} onChange={e => setAccForm({...accForm, type: e.target.value})} options={[
            { value: 'asset', label: 'Asset (Bank, Cash, etc.)' },
            { value: 'expense', label: 'Expense Account' },
            { value: 'revenue', label: 'Revenue Account' },
          ]} required />
          <Select label="Currency" value={accForm.currency} onChange={e => setAccForm({...accForm, currency: e.target.value})} options={[
            { value: 'INR', label: 'INR (₹)' },
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' },
          ]} required />
          <Input label="Initial Balance" type="number" value={accForm.balance} onChange={e => setAccForm({...accForm, balance: e.target.value})} required />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={showTxModal} onClose={() => setShowTxModal(false)} title="New Transaction">
        <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Transaction Type" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value, sourceAccountId: '', destAccountId: ''})} options={[
            { value: 'withdrawal', label: 'Expense (Withdrawal)' },
            { value: 'deposit', label: 'Income (Deposit)' },
            { value: 'transfer', label: 'Transfer' },
          ]} required />
          
          <Input label="Description" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} required />
          <Input label="Amount" type="number" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} required />
          
          {(txForm.type === 'withdrawal' || txForm.type === 'transfer') && (
            <Select label="Source Account" value={txForm.sourceAccountId} onChange={e => setTxForm({...txForm, sourceAccountId: e.target.value})} options={accounts.filter(a => a.type === 'asset').map(a => ({ value: a.id, label: a.name }))} required />
          )}

          {(txForm.type === 'deposit' || txForm.type === 'transfer') && (
            <Select label="Destination Account" value={txForm.destAccountId} onChange={e => setTxForm({...txForm, destAccountId: e.target.value})} options={accounts.filter(a => a.type === 'asset').map(a => ({ value: a.id, label: a.name }))} required />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit">Save Transaction</Button>
          </div>
        </form>
      </Modal>

=======
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
  const icon       = isIncome ? ArrowDownRight : isTransfer ? RefreshCcw : ArrowUpRight;
  const Icon       = icon;
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
    if (type === 'withdrawal' && sid)        upAccs = upAccs.map(a => a.id === sid ? { ...a, balance: a.balance - amt } : a);
    else if (type === 'deposit' && did)      upAccs = upAccs.map(a => a.id === did ? { ...a, balance: a.balance + amt } : a);
    else if (type === 'transfer' && sid && did) upAccs = upAccs.map(a => a.id === sid ? { ...a, balance: a.balance - amt } : a.id === did ? { ...a, balance: a.balance + amt } : a);
    await saveTransaction(uid, tx);
    for (const a of upAccs) if (accounts.find(o => o.id === a.id && o.balance !== a.balance)) await saveAccount(uid, a);
    setTransactions(p => [tx, ...p]);
    setAccounts(upAccs);
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
>>>>>>> 5ad34d6 (chore: mobile UI polish, expense tracker redesign, timer redesign, github-dark theme fix)
    </div>
  );
}
