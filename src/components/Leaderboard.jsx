import { useState, useEffect } from 'react';
import { Trophy, Zap, CheckCircle2, ShoppingCart } from 'lucide-react';
import { getLeaderboard, buyShopItem } from '../points';

const MEDAL = ['🥇', '🥈', '🥉'];

function getLeague(trophies) {
  if (trophies >= 4100) return { name: 'Legend', color: '#c46bfa', icon: '🔥' };
  if (trophies >= 3200) return { name: 'Titan', color: '#f54242', icon: '⚔️' };
  if (trophies >= 2600) return { name: 'Champion', color: '#ff4d4d', icon: '🌟' };
  if (trophies >= 2000) return { name: 'Master', color: '#000000', icon: '🖤', textColor: '#fff' };
  if (trophies >= 1400) return { name: 'Crystal', color: '#e838c6', icon: '💎' };
  if (trophies >= 800) return { name: 'Gold', color: '#f0ce3e', icon: '🏆' };
  if (trophies >= 400) return { name: 'Silver', color: '#b5b5b5', icon: '🥈' };
  return { name: 'Bronze', color: '#c48956', icon: '🥉' };
}

function RankBadge({ rank }) {
  if (rank < 3) return <span style={{ fontSize: 18, lineHeight: 1 }}>{MEDAL[rank]}</span>;
  return (
    <span style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--bg3)', border: '1px solid var(--border)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--mono)',
    }}>
      {rank + 1}
    </span>
  );
}

export default function Leaderboard({ uid, myPoints, onViewProfile }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getLeaderboard(20);
    setBoard(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const myRank = board.findIndex(u => u.uid === uid);
  const ptsBalance = myPoints?.pointsBalance !== undefined ? myPoints.pointsBalance : (myPoints?.totalPoints || 0);

  async function handleBuy(itemId, cost) {
    if (buying) return;
    setBuying(true);
    const success = await buyShopItem(uid, cost, itemId);
    if (success) {
      // Optimistically update myPoints object reference
      myPoints.pointsBalance = ptsBalance - cost;
      if (!myPoints.purchasedItems) myPoints.purchasedItems = [];
      myPoints.purchasedItems.push(itemId);
      alert('Purchase successful!');
    } else {
      alert('Purchase failed. Not enough points or already owned.');
    }
    setBuying(false);
  }

  const hasUpgrade = myPoints?.purchasedItems?.includes('todoUpgrade5');

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
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Leaderboard & Shop</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Climb the leagues and spend your points!
          </div>
        </div>

        {/* Point Shop */}
        {uid && myPoints && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px',
            marginBottom: 24,
          }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <ShoppingCart size={16} style={{ color: 'var(--accent)' }} />
                Point Shop
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                Balance: {ptsBalance} pts
              </div>
            </div>

            {/* Shop Item */}
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>5 Extra To-Dos Upgrade</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Increases max task limit to 8 per work.</div>
              </div>
              <button
                disabled={hasUpgrade || ptsBalance < 500 || buying}
                onClick={() => handleBuy('todoUpgrade5', 500)}
                style={{
                  background: hasUpgrade ? 'var(--bg3)' : 'var(--accent)',
                  color: hasUpgrade ? 'var(--text3)' : '#fff',
                  border: 'none', padding: '6px 12px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600, cursor: (hasUpgrade || ptsBalance < 500) ? 'not-allowed' : 'pointer',
                  opacity: (hasUpgrade || ptsBalance < 500) ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {hasUpgrade ? 'Owned' : '500 pts'}
              </button>
            </div>
          </div>
        )}

        {/* Trophy guide */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', gap: 20, justifyContent: 'center',
          marginBottom: 24, flexWrap: 'wrap',
        }} className="fade-in">
          <div style={{ width: '100%', fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Earn Trophies & Points</div>
          {[
            { icon: <CheckCircle2 size={13} />, label: 'Task done', pts: '+10', color: 'var(--success)' },
            { icon: <Zap size={13} />, label: 'Work finished', pts: '+50', color: 'var(--star-active)' },
            { icon: <Trophy size={13} />, label: '5★ work', pts: '+25', color: 'var(--accent)' },
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
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent2)22, var(--accent)11)',
              border: '1px solid var(--accent)',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, cursor: 'pointer',
            }}
            onClick={() => onViewProfile(uid)}
            className="fade-in"
          >
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
              Your rank: #{myRank + 1}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{getLeague(myPoints.totalPoints || 0).icon}</span>
              <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>
                {myPoints.totalPoints} Trophies
              </div>
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
          const league = getLeague(entry.totalPoints || 0);

          return (
            <div
              key={entry.uid}
              className="fade-in"
              onClick={() => onViewProfile(entry.uid)}
              style={{
                background: isMe ? 'linear-gradient(135deg, var(--accent2)18, var(--bg2))' : 'var(--bg2)',
                border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding: '13px 16px',
                marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
                animationDelay: `${i * 0.03}s`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
                if (!isMe) e.currentTarget.style.borderColor = 'var(--text3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                if (!isMe) e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <RankBadge rank={i} />
              </div>

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
                      borderRadius: 3, padding: '1px 5px',
                      fontWeight: 600, letterSpacing: '0.05em',
                    }}>YOU</span>
                  )}
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                    background: 'color-mix(in srgb, ' + league.color + ' 20%, transparent)',
                    color: league.color, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 3
                  }}>
                    {league.icon} {league.name}
                  </div>
                </div>
                {entry.status ? (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{entry.status}"
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                    {entry.tasksCompleted || 0} tasks · {entry.worksFinished || 0} finished
                  </div>
                )}
              </div>

              <div style={{
                fontSize: 15, fontWeight: 700,
                color: league.color,
                fontFamily: 'var(--mono)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Trophy size={14} />
                {entry.totalPoints || 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
