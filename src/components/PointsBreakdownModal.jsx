import { CheckCircle2, Zap, X } from 'lucide-react';
import { POINTS } from '../points';

export default function PointsBreakdownModal({ myPoints, onClose }) {
  const taskPts = (myPoints?.tasksCompleted || 0) * POINTS.TASK_COMPLETE;
  const workPts = myPoints?.totalPoints - taskPts || 0;
  const total = myPoints?.totalPoints || 0;

  const taskPct = total > 0 ? Math.round((taskPts / total) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scale-in" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>🏆 Points Breakdown</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Total */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent2)22, var(--bg3))',
          border: '1px solid var(--accent)',
          borderRadius: 10, padding: '16px',
          textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--star-active)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>Total Points Earned</div>
        </div>

        {/* Bar */}
        {total > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{
                width: `${taskPct}%`, background: 'var(--success)',
                borderRadius: '6px 0 0 6px', transition: 'width 0.5s ease',
                minWidth: taskPts > 0 ? 6 : 0,
              }} />
              <div style={{
                flex: 1, background: 'var(--star-active)',
                borderRadius: '0 6px 6px 0',
                minWidth: workPts > 0 ? 6 : 0,
              }} />
            </div>
          </div>
        )}

        {/* Breakdown rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>

          {/* Tasks row */}
          <div style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(63,185,80,0.12)', border: '1px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle2 size={17} color="var(--success)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tasks Completed</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                {myPoints?.tasksCompleted || 0} tasks × {POINTS.TASK_COMPLETE} pts each
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--mono)' }}>
              {taskPts}
            </div>
          </div>

          {/* Work finished row */}
          <div style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(240,136,62,0.12)', border: '1px solid var(--star-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Zap size={17} color="var(--star-active)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Work Finished</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                {myPoints?.worksFinished || 0} works · {POINTS.WORK_FINISH} base + stars bonus
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--star-active)', fontFamily: 'var(--mono)' }}>
              {workPts}
            </div>
          </div>
        </div>

        {/* How pts are earned */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px',
          fontSize: 11, color: 'var(--text3)', lineHeight: 1.7,
          borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>How points are earned</div>
          <div>✓ Complete a task → <strong style={{ color: 'var(--success)' }}>+10 pts</strong></div>
          <div>🏁 Finish a work → <strong style={{ color: 'var(--star-active)' }}>+50 pts base</strong></div>
          <div>⭐ Stars bonus on finish → <strong style={{ color: 'var(--accent)' }}>+stars × 5 pts</strong></div>
          <div style={{ marginTop: 4, color: 'var(--text3)' }}>Example: finishing a 5★ work = 50 + 25 = <strong>75 pts</strong></div>
        </div>

      </div>
    </div>
  );
}
