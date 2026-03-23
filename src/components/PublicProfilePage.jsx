import { useState, useEffect } from 'react';
import { CheckCircle2, Zap, Trophy, UserPlus, UserMinus, Check } from 'lucide-react';
import { getPublicProfile, POINTS } from '../points';
import {
  listenFriends, listenOutgoingRequests, sendFriendRequest,
  removeFriend, listenIncomingRequests, acceptFriendRequest,
} from '../friends';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PublicProfilePage({ targetUid, myUid, myName, myInitials, onBack, onOpenChat }) {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [friends, setFriends]   = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const isMe = targetUid === myUid;

  useEffect(() => {
    getPublicProfile(targetUid).then(d => { setProfile(d); setLoading(false); });
  }, [targetUid]);

  useEffect(() => {
    if (!myUid || isMe) return;
    const u1 = listenFriends(myUid, setFriends);
    const u2 = listenOutgoingRequests(myUid, setOutgoing);
    const u3 = listenIncomingRequests(myUid, setIncoming);
    return () => { u1(); u2(); u3(); };
  }, [myUid, isMe]);

  const isFriend  = friends.some(f => f.uid === targetUid);
  const isPending = outgoing.some(r => r.to === targetUid);
  const hasIncoming = incoming.find(r => r.from === targetUid);

  async function handleAddFriend() {
    await sendFriendRequest(myUid, myName, myInitials, targetUid);
  }
  async function handleAccept() {
    if (!hasIncoming) return;
    await acceptFriendRequest(hasIncoming, myUid, myName, myInitials);
  }
  async function handleRemove() {
    await removeFriend(myUid, targetUid);
  }

  const taskPts = profile ? (profile.tasksCompleted || 0) * POINTS.TASK_COMPLETE : 0;
  const workPts = profile ? (profile.totalPoints || 0) - taskPts : 0;
  const total   = profile?.totalPoints || 0;
  const taskPct = total > 0 ? Math.round((taskPts / total) * 100) : 0;
  const finished = (profile?.finishedWorks || []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="loading-spinner" />
          <div style={{ color: 'var(--md-outline)', fontSize: 13 }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-outline)' }}>
        Profile not found.
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      background: 'var(--md-surface)',
    }}>
      {/* ── Cover / Hero ───────────────────────────────── */}
      <div style={{
        height: 120,
        background: `linear-gradient(135deg,
          color-mix(in srgb, var(--md-primary) 30%, var(--md-surface-1)),
          color-mix(in srgb, var(--md-tertiary) 30%, var(--md-surface-2)))`,
        position: 'relative', flexShrink: 0,
      }} />

      {/* ── Profile card ───────────────────────────────── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 40px' }}>

        {/* Avatar — overlaps cover */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--md-primary-container), var(--md-primary))',
            color: 'var(--md-on-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700,
            border: '4px solid var(--md-surface)',
            boxShadow: 'var(--md-elev-2)',
            flexShrink: 0,
          }}>
            {(profile.initials || profile.displayName?.[0] || '?').toUpperCase()}
          </div>

          {/* Action buttons */}
          {!isMe && (
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              {isFriend ? (
                <>
                  <button
                    onClick={handleRemove}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 'var(--md-shape-full)',
                      background: 'var(--md-surface-2)',
                      border: '1px solid var(--md-outline-var)',
                      color: 'var(--md-on-surface)', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'var(--md-font)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--md-error)'; e.currentTarget.style.color = 'var(--md-error)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--md-outline-var)'; e.currentTarget.style.color = 'var(--md-on-surface)'; }}
                  >
                    <UserMinus size={14} /> Friends
                  </button>
                </>
              ) : hasIncoming ? (
                <button
                  onClick={handleAccept}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--md-shape-full)',
                    background: 'var(--md-primary)', color: 'var(--md-on-primary)',
                    border: 'none', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--md-font)',
                  }}
                >
                  <Check size={14} /> Accept Request
                </button>
              ) : isPending ? (
                <div style={{
                  padding: '8px 16px', borderRadius: 'var(--md-shape-full)',
                  background: 'var(--md-surface-2)',
                  border: '1px solid var(--md-outline-var)',
                  color: 'var(--md-outline)', fontSize: 13, fontWeight: 500,
                }}>
                  Request Sent
                </div>
              ) : (
                <button
                  onClick={handleAddFriend}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--md-shape-full)',
                    background: 'var(--md-primary)', color: 'var(--md-on-primary)',
                    border: 'none', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--md-font)',
                    boxShadow: 'var(--md-elev-1)',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--md-elev-2)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--md-elev-1)'}
                >
                  <UserPlus size={14} /> Add Friend
                </button>
              )}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
            {profile.displayName || 'User'}
            {isMe && (
              <span style={{
                fontSize: 11, background: 'var(--md-primary-container)', color: 'var(--md-primary)',
                borderRadius: 'var(--md-shape-full)', padding: '2px 8px',
                marginLeft: 8, fontWeight: 600, verticalAlign: 'middle',
              }}>You</span>
            )}
          </div>
          {profile.status ? (
            <div style={{
              fontSize: 14, color: 'var(--md-on-surface-var)', fontStyle: 'italic',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              "{profile.status}"
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--md-outline)' }}>No status set</div>
          )}
        </div>

        {/* ── Stats row ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { icon: <Trophy size={16} />,       value: total,                       label: 'Points',   color: 'var(--md-star)' },
            { icon: <CheckCircle2 size={16} />, value: profile.tasksCompleted || 0, label: 'Tasks',    color: 'var(--md-success)' },
            { icon: <Zap size={16} />,          value: profile.worksFinished || 0,  label: 'Finished', color: 'var(--md-primary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--md-surface-1)',
              border: '1px solid var(--md-outline-var)',
              borderRadius: 'var(--md-shape-lg)', padding: '14px 10px',
              textAlign: 'center',
              boxShadow: 'var(--md-elev-1)',
            }}>
              <div style={{ color: s.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: 'var(--md-mono)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--md-outline)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Points split bar ─────────────────────────── */}
        {total > 0 && (
          <div style={{
            background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
            borderRadius: 'var(--md-shape-lg)', padding: '16px 18px',
            marginBottom: 24, boxShadow: 'var(--md-elev-1)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-outline)', marginBottom: 10, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Points Breakdown
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 8, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
              <div style={{ width: `${taskPct}%`, background: 'var(--md-success)', borderRadius: '8px 0 0 8px', minWidth: taskPts > 0 ? 6 : 0 }} />
              <div style={{ flex: 1, background: 'var(--md-star)', borderRadius: '0 8px 8px 0', minWidth: workPts > 0 ? 6 : 0 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--md-success)' }}>Tasks: <strong>{taskPts}</strong> pts</span>
              <span style={{ color: 'var(--md-star)' }}>Finishes: <strong>{workPts}</strong> pts</span>
            </div>
          </div>
        )}

        {/* ── Finished works ───────────────────────────── */}
        {finished.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              Finished Work
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finished.slice(0, 5).map(w => (
                <div key={w.id} style={{
                  background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
                  borderRadius: 'var(--md-shape-lg)', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'var(--md-elev-1)',
                }}>
                  <CheckCircle2 size={16} color="var(--md-success)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{w.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--md-outline)', marginTop: 2 }}>
                      {'★'.repeat(w.stars || 0)} · {formatDate(w.finishedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
