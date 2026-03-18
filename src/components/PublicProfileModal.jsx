import { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Trophy } from 'lucide-react';
import { getPublicProfile, POINTS } from '../points';

export default function PublicProfileModal({ targetUid, myUid, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPublicProfile(targetUid);
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [targetUid]);

  const taskPts = profile ? (profile.tasksCompleted || 0) * POINTS.TASK_COMPLETE : 0;
  const workPts = profile ? (profile.totalPoints || 0) - taskPts : 0;
  const total = profile?.totalPoints || 0;
  const taskPct = total > 0 ? Math.round((taskPts / total) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scale-in" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 10px' }} />
            Loading profile...
          </div>
        )}

        {!loading && !profile && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
            Profile not found.
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Avatar + name */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                color: '#fff', fontSize: 20, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
                boxShadow: '0 0 0 3px var(--bg), 0 0 0 5px var(--border)',
              }}>
                {profile.initials || profile.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {profile.displayName || 'User'}
                {profile.uid === myUid && (
                  <span style={{
                    fontSize: 9, background: 'var(--accent)', color: '#fff',
                    borderRadius: 3, padding: '1px 5px', marginLeft: 7,
                    fontWeight: 600, letterSpacing: '0.05em',
                  }}>YOU</span>
                )}
              </div>
              {/* Status */}
              {profile.status && (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  fontSize: 12, color: 'var(--text2)',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '4px 12px',
                  fontStyle: 'italic',
                }}>
                  "{profile.status}"
                </div>
              )}
            </div>

            {/* Total points */}
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px', textAlign: 'center', marginBottom: 14,
            }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--star-active)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Total Points</div>
            </div>

            {/* Bar */}
            {total > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
                  <div style={{ width: `${taskPct}%`, background: 'var(--success)', borderRadius: '6px 0 0 6px', minWidth: taskPts > 0 ? 4 : 0 }} />
                  <div style={{ flex: 1, background: 'var(--star-active)', borderRadius: '0 6px 6px 0', minWidth: workPts > 0 ? 4 : 0 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--text3)' }}>
                  <span style={{ color: 'var(--success)' }}>Tasks: {taskPts} pts</span>
                  <span style={{ color: 'var(--star-active)' }}>Finishes: {workPts} pts</span>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: <CheckCircle2 size={14} />, value: profile.tasksCompleted || 0, label: 'Tasks', color: 'var(--success)' },
                { icon: <Zap size={14} />, value: profile.worksFinished || 0, label: 'Finished', color: 'var(--star-active)' },
                { icon: <Trophy size={14} />, value: total, label: 'Points', color: 'var(--accent)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 9, padding: '12px 8px', textAlign: 'center',
                }}>
                  <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
