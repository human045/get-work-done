import { useState, useEffect } from 'react';
import { Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { getLeaderboard } from '../points';

const MEDAL = ['🥇', '🥈', '🥉'];

function RankBadge({ rank }) {
  if (rank < 3) return <span style={{ fontSize: 18, lineHeight: 1 }}>{MEDAL[rank]}</span>;
  return (
    <span style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--bg3)', border: '1px solid var(--border)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'var(--text3)',
      fontFamily: 'var(--mono)',
    }}>
      {rank + 1}
    </span>
  );
}

export default function Leaderboard({ uid, myPoints }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getLeaderboard(20);
      setBoard(data);
      setLoading(false);
    }
    load();
  }, []);

  const myRank = board.findIndex(u => u.uid === uid);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', overflowY: 'auto',
      padding: '32px 20px 40px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }} className="fade-in">
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Leaderboard</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Top users ranked by total points earned
          </div>
        </div>

        {/* Point guide */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', gap: 20, justifyContent: 'center',
          marginBottom: 24, flexWrap: 'wrap',
        }} className="fade-in">
          {[
            { icon: <CheckCircle2 size={13} />, label: 'Task done', pts: '+10 pts', color: 'var(--success)' },
            { icon: <Zap size={13} />, label: 'Work finished', pts: '+50–75 pts', color: 'var(--star-active)' },
            { icon: <Trophy size={13} />, label: '5★ work bonus', pts: '+25 pts', color: 'var(--accent)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: item.color }}>{item.icon}</span>
              <span style={{ color: 'var(--text2)' }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 600, fontFamily: 'var(--mono)' }}>{item.pts}</span>
            </div>
          ))}
        </div>

        {/* My rank callout */}
        {uid && myPoints && myRank >= 0 && (
          <div style={{
            background: 'linear-gradient(135deg, var(--accent2)22, var(--accent)11)',
            border: '1px solid var(--accent)',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }} className="fade-in">
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
              Your rank: #{myRank + 1}
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>
              {myPoints.totalPoints} pts
            </div>
          </div>
        )}

        {/* Board */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
            Loading...
          </div>
        )}

        {!loading && board.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>No one's on the board yet</div>
            <div style={{ fontSize: 12 }}>Complete tasks to be the first!</div>
          </div>
        )}

        {!loading && board.map((entry, i) => {
          const isMe = entry.uid === uid;
          return (
            <div
              key={entry.uid}
              className="fade-in"
              style={{
                background: isMe ? 'linear-gradient(135deg, var(--accent2)18, var(--bg2))' : 'var(--bg2)',
                border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '13px 16px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                animationDelay: `${i * 0.03}s`,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { if (!isMe) e.currentTarget.style.borderColor = 'var(--text3)'; }}
              onMouseLeave={e => { if (!isMe) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {/* Rank */}
              <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <RankBadge rank={i} />
              </div>

              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isMe ? 'var(--accent2)' : 'var(--bg3)',
                border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: isMe ? '#fff' : 'var(--text2)',
                flexShrink: 0,
              }}>
                {entry.initials || entry.displayName?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Name + stats */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isMe ? 'var(--accent)' : 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {entry.displayName || 'User'}
                  {isMe && (
                    <span style={{
                      fontSize: 9, background: 'var(--accent)', color: '#fff',
                      borderRadius: 3, padding: '1px 5px', letterSpacing: '0.05em',
                      fontWeight: 600,
                    }}>YOU</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 10 }}>
                  <span>{entry.tasksCompleted || 0} tasks</span>
                  <span>{entry.worksFinished || 0} finished</span>
                </div>
              </div>

              {/* Points */}
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: i === 0 ? '#f0883e' : i === 1 ? '#8b949e' : i === 2 ? '#b08a60' : 'var(--text)',
                fontFamily: 'var(--mono)',
                flexShrink: 0,
              }}>
                {entry.totalPoints || 0}
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text3)', marginLeft: 3 }}>pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
