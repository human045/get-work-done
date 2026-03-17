import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { getDeletedWorks, permanentDelete } from '../storage';
import ConfirmModal from './ConfirmModal';

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--accent)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, letterSpacing: '0.03em' }}>
        {label}
      </div>
    </div>
  );
}

export default function ProfilePage({ user, isGuest, uid }) {
  const [deleted, setDeleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [purgeAll, setPurgeAll] = useState(false);
  const [tab, setTab] = useState('all'); // all | finished | deleted

  useEffect(() => {
    async function load() {
      setLoading(true);
      const items = await getDeletedWorks(uid);
      items.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
      setDeleted(items);
      setLoading(false);
    }
    load();
  }, [uid]);

  async function handlePurge() {
    await permanentDelete(uid, purgeTarget.id);
    setDeleted(d => d.filter(w => w.id !== purgeTarget.id));
    setPurgeTarget(null);
  }

  async function handlePurgeAll() {
    for (const w of filtered) await permanentDelete(uid, w.id);
    setDeleted(d => d.filter(w => !filtered.find(f => f.id === w.id)));
    setPurgeAll(false);
  }

  const finished = deleted.filter(w => w.finishedAt);
  const removed = deleted.filter(w => !w.finishedAt);
  const filtered = tab === 'finished' ? finished : tab === 'deleted' ? removed : deleted;

  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.[0]?.toUpperCase() || 'U')
    : 'G';

  const displayName = user?.displayName || (isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User');

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      padding: '32px 20px 40px',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* ── Avatar + Name ─────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }} className="fade-in">
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            color: '#fff', fontSize: 22, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 0 0 4px var(--bg), 0 0 0 6px var(--border)',
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>{displayName}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
            {user?.email || (isGuest ? 'Guest — local storage only' : '')}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 8, fontSize: 11,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '3px 10px', color: 'var(--text3)',
          }}>
            {isGuest ? '🔒 Local only' : '☁️ Cloud sync on'}
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }} className="fade-in">
          <StatCard value={deleted.length} label="Total" />
          <StatCard value={finished.length} label="Finished" color="var(--success)" />
          <StatCard value={removed.length} label="Deleted" color="var(--danger)" />
        </div>

        {/* ── History Section ───────────────────────────── */}
        <div className="fade-in">
          {/* Tab row + clear button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'finished', label: 'Finished' },
                { key: 'deleted', label: 'Deleted' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s',
                    background: tab === t.key ? 'var(--accent)' : 'transparent',
                    color: tab === t.key ? '#fff' : 'var(--text3)',
                    fontFamily: 'var(--font)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {filtered.length > 0 && (
              <button
                onClick={() => setPurgeAll(true)}
                style={{
                  fontSize: 11, background: 'none', border: 'none',
                  color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font)',
                  padding: '4px 8px', borderRadius: 6,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                onMouseLeave={e => e.target.style.color = 'var(--text3)'}
              >
                Clear {tab === 'all' ? 'all' : tab}
              </button>
            )}
          </div>

          {/* List */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>
                {tab === 'finished' ? '🏁' : tab === 'deleted' ? '🗑️' : '🗂️'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>
                No {tab === 'all' ? 'history' : tab + ' work'} yet
              </div>
              <div style={{ fontSize: 12 }}>
                {tab === 'finished'
                  ? 'Mark work as finished to see it here'
                  : tab === 'deleted'
                  ? 'Deleted work items will appear here'
                  : 'Finish or delete work to build your history'}
              </div>
            </div>
          )}

          {!loading && filtered.map((work, i) => (
            <div
              key={work.id}
              className="fade-in"
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '13px 14px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 11,
                animationDelay: `${i * 0.03}s`,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Icon */}
              <div style={{ paddingTop: 1, flexShrink: 0 }}>
                {work.finishedAt
                  ? <CheckCircle2 size={15} color="var(--success)" />
                  : <XCircle size={15} color="var(--danger)" />
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, lineHeight: 1.3 }}>
                  {work.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--star-active)', letterSpacing: '1px' }}>
                    {'★'.repeat(work.stars)}
                    <span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - work.stars)}</span>
                  </span>
                  {work.history?.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {work.history.length} task{work.history.length !== 1 ? 's' : ''} done
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {work.finishedAt ? `✓ ${formatDate(work.finishedAt)}` : `✕ ${formatDate(work.deletedAt)}`}
                  </span>
                </div>
                {work.note?.trim() && (
                  <div style={{
                    fontSize: 11, color: 'var(--text3)', marginTop: 5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                  }}>
                    "{work.note.trim().slice(0, 80)}{work.note.trim().length > 80 ? '…' : ''}"
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => setPurgeTarget(work)}
                title="Remove from history"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', padding: '2px 4px', borderRadius: 5,
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {purgeTarget && (
        <ConfirmModal
          title="Remove from history?"
          message={`"${purgeTarget.title}" will be permanently removed.`}
          confirmLabel="Remove"
          danger
          onConfirm={handlePurge}
          onClose={() => setPurgeTarget(null)}
        />
      )}
      {purgeAll && (
        <ConfirmModal
          title={`Clear ${tab === 'all' ? 'all history' : tab + ' history'}?`}
          message="These items will be permanently deleted and cannot be recovered."
          confirmLabel="Clear"
          danger
          onConfirm={handlePurgeAll}
          onClose={() => setPurgeAll(false)}
        />
      )}
    </div>
  );
}
