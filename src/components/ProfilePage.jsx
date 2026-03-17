import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { getDeletedWorks, permanentDelete } from '../storage';
import ConfirmModal from './ConfirmModal';

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export default function ProfilePage({ user, isGuest, uid, onBack }) {
  const [deleted, setDeleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [purgeAll, setPurgeAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const items = await getDeletedWorks(uid);
      // Sort newest first
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
    for (const w of deleted) await permanentDelete(uid, w.id);
    setDeleted([]);
    setPurgeAll(false);
  }

  const finished = deleted.filter(w => w.finishedAt);
  const removed = deleted.filter(w => !w.finishedAt);

  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.[0]?.toUpperCase() || 'U')
    : 'G';

  return (
    <div className="dashboard fade-in">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={onBack} title="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="dashboard-title">Profile</div>
            <div className="dashboard-subtitle">Your account and work history</div>
          </div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Account Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px 22px',
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--accent2)', color: '#fff',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {user?.displayName || (isGuest ? 'Guest User' : user?.email?.split('@')[0] || 'User')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
              {user?.email || 'Guest mode — data saved locally'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              {isGuest ? '🔒 Local storage only' : '☁️ Cloud sync enabled'}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Archived', value: deleted.length },
            { label: 'Finished', value: finished.length },
            { label: 'Deleted', value: removed.length },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Work History
            </div>
            {deleted.length > 0 && (
              <button className="btn-danger" onClick={() => setPurgeAll(true)} style={{ fontSize: 11 }}>
                Clear All
              </button>
            )}
          </div>

          {loading && (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading history...</div>
          )}

          {!loading && deleted.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">🗂️</div>
              <div className="empty-state-title">No history yet</div>
              <div className="empty-state-sub">Finished or deleted work items will appear here</div>
            </div>
          )}

          {!loading && deleted.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deleted.map(work => (
                <div key={work.id} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 12
                }}>
                  {/* Status icon */}
                  <div style={{ paddingTop: 2, flexShrink: 0 }}>
                    {work.finishedAt
                      ? <CheckCircle2 size={16} color="var(--success)" />
                      : <XCircle size={16} color="var(--danger)" />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{work.title}</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {/* Stars */}
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {'★'.repeat(work.stars)}{'☆'.repeat(5 - work.stars)} priority
                      </span>
                      {/* Tasks done */}
                      {(work.history?.length > 0) && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {work.history.length} task{work.history.length !== 1 ? 's' : ''} completed
                        </span>
                      )}
                      {/* Date */}
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {work.finishedAt ? `Finished ${formatDate(work.finishedAt)}` : `Deleted ${formatDate(work.deletedAt)}`}
                      </span>
                    </div>
                    {/* Note preview */}
                    {work.note?.trim() && (
                      <div style={{
                        fontSize: 12, color: 'var(--text3)', marginTop: 6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        📝 {work.note.trim()}
                      </div>
                    )}
                  </div>

                  {/* Delete from history */}
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--text3)', flexShrink: 0 }}
                    onClick={() => setPurgeTarget(work)}
                    title="Remove from history"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {purgeTarget && (
        <ConfirmModal
          title="Remove from history?"
          message={`"${purgeTarget.title}" will be permanently removed from your history.`}
          confirmLabel="Remove"
          danger
          onConfirm={handlePurge}
          onClose={() => setPurgeTarget(null)}
        />
      )}
      {purgeAll && (
        <ConfirmModal
          title="Clear all history?"
          message="All archived work items will be permanently deleted. This cannot be undone."
          confirmLabel="Clear All"
          danger
          onConfirm={handlePurgeAll}
          onClose={() => setPurgeAll(false)}
        />
      )}
    </div>
  );
}
