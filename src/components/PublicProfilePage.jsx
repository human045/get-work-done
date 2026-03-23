import { useState, useEffect } from 'react';
import { CheckCircle2, Zap, Trophy, UserPlus, UserMinus, Check } from 'lucide-react';
import { getPublicProfile, POINTS } from '../points';
import { resolveAvatarBg } from './SettingsPage';
import {
  listenFriends, listenOutgoingRequests, listenIncomingRequests,
  sendFriendRequest, removeFriend, acceptFriendRequest,
} from '../friends';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PublicProfilePage({ targetUid, myUid, myName, myInitials }) {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [friends, setFriends]   = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const isMe = targetUid === myUid;

  useEffect(() => {
    setLoading(true);
    getPublicProfile(targetUid).then(d => { setProfile(d); setLoading(false); });
  }, [targetUid]);

  useEffect(() => {
    if (!myUid || isMe) return;
    const u1 = listenFriends(myUid, setFriends);
    const u2 = listenOutgoingRequests(myUid, setOutgoing);
    const u3 = listenIncomingRequests(myUid, setIncoming);
    return () => { u1(); u2(); u3(); };
  }, [myUid, isMe]);

  const isFriend    = friends.some(f => f.uid === targetUid);
  const isPending   = outgoing.some(r => r.to === targetUid);
  const hasIncoming = incoming.find(r => r.from === targetUid);

  async function handleAddFriend()  { await sendFriendRequest(myUid, myName, myInitials, targetUid); }
  async function handleAccept()     { if (hasIncoming) await acceptFriendRequest(hasIncoming, myUid, myName, myInitials); }
  async function handleRemove()     { await removeFriend(myUid, targetUid); }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="loading-spinner" />
        <div style={{ color: 'var(--md-outline)', fontSize: 13 }}>Loading profile...</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-outline)' }}>
      Profile not found.
    </div>
  );

  const taskPts = (profile.tasksCompleted || 0) * POINTS.TASK_COMPLETE;
  const workPts = (profile.totalPoints || 0) - taskPts;
  const total   = profile.totalPoints || 0;
  const taskPct = total > 0 ? Math.round((taskPts / total) * 100) : 0;
  const avatarBg = resolveAvatarBg(profile.avatarColor);
  const initials = (profile.initials || profile.displayName?.[0] || '?').toUpperCase();
  const finished = profile.finishedWorks || [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--md-surface)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 48px' }} className="fade-in">

        {/* ── Profile header card ─────────────────────── */}
        <div style={{
          background: 'var(--md-surface-1)',
          border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-xl)',
          padding: '24px 24px 20px',
          marginBottom: 16,
          boxShadow: 'var(--md-elev-1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: avatarBg,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700,
            boxShadow: 'var(--md-elev-2)',
            marginBottom: 14,
          }}>
            {initials}
          </div>

          {/* Name */}
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
            {profile.displayName || 'User'}
            {isMe && (
              <span style={{
                fontSize: 11, background: 'var(--md-primary-container)',
                color: 'var(--md-primary)', borderRadius: 'var(--md-shape-full)',
                padding: '2px 8px', marginLeft: 8, fontWeight: 600, verticalAlign: 'middle',
              }}>You</span>
            )}
          </div>

          {/* Username */}
          {profile.username && (
            <div style={{ fontSize: 13, color: 'var(--md-outline)', marginBottom: 8, fontFamily: 'var(--md-mono)' }}>
              @{profile.username}
            </div>
          )}

          {/* Status */}
          {profile.status && (
            <div style={{
              fontSize: 13, color: 'var(--md-on-surface-var)', fontStyle: 'italic',
              background: 'var(--md-surface-2)', borderRadius: 'var(--md-shape-full)',
              padding: '5px 14px', marginBottom: 16, maxWidth: 280,
            }}>
              "{profile.status}"
            </div>
          )}

          {/* Action buttons */}
          {!isMe && myUid && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isFriend ? (
                <button
                  onClick={handleRemove}
                  style={btnStyle('outline')}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--md-error)'; e.currentTarget.style.color = 'var(--md-error)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--md-outline-var)'; e.currentTarget.style.color = 'var(--md-on-surface)'; }}
                >
                  <UserMinus size={14} /> Friends
                </button>
              ) : hasIncoming ? (
                <button onClick={handleAccept} style={btnStyle('primary')}>
                  <Check size={14} /> Accept Request
                </button>
              ) : isPending ? (
                <div style={btnStyle('muted')}>Request Sent</div>
              ) : (
                <button onClick={handleAddFriend} style={btnStyle('primary')}>
                  <UserPlus size={14} /> Add Friend
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Stats grid ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { icon: <Trophy size={15} />,       value: total,                       label: 'Points',   color: 'var(--md-star)' },
            { icon: <CheckCircle2 size={15} />, value: profile.tasksCompleted || 0, label: 'Tasks',    color: 'var(--md-success)' },
            { icon: <Zap size={15} />,          value: profile.worksFinished || 0,  label: 'Finished', color: 'var(--md-primary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
              borderRadius: 'var(--md-shape-lg)', padding: '16px 10px', textAlign: 'center',
              boxShadow: 'var(--md-elev-1)',
            }}>
              <div style={{ color: s.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: 'var(--md-mono)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--md-outline)', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Points split bar ─────────────────────────── */}
        {total > 0 && (
          <div style={{
            background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
            borderRadius: 'var(--md-shape-lg)', padding: '16px 18px', marginBottom: 16,
            boxShadow: 'var(--md-elev-1)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 10 }}>
              Points Breakdown
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 8 }}>
              <div style={{ width: `${taskPct}%`, background: 'var(--md-success)', borderRadius: '6px 0 0 6px', minWidth: taskPts > 0 ? 4 : 0 }} />
              <div style={{ flex: 1, background: 'var(--md-star)', borderRadius: '0 6px 6px 0', minWidth: workPts > 0 ? 4 : 0 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--md-success)' }}>Tasks: <strong>{taskPts}</strong></span>
              <span style={{ color: 'var(--md-star)' }}>Finishes: <strong>{workPts}</strong></span>
            </div>
          </div>
        )}

        {/* ── Finished works ───────────────────────────── */}
        {finished.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 12 }}>
              Finished Work
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finished.slice(0, 6).map((w, i) => (
                <div key={w.id || i} style={{
                  background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-var)',
                  borderRadius: 'var(--md-shape-md)', padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'var(--md-elev-1)',
                  animation: 'md-fade-in 0.22s cubic-bezier(0.05,0.7,0.1,1)',
                  animationDelay: `${i * 0.04}s`, animationFillMode: 'both',
                }}>
                  <CheckCircle2 size={15} color="var(--md-success)" style={{ flexShrink: 0 }} />
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

function btnStyle(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 'var(--md-shape-full)',
    fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--md-font)',
    transition: 'all 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'var(--md-primary)', color: 'var(--md-on-primary)', border: 'none', boxShadow: 'var(--md-elev-1)' };
  if (variant === 'outline') return { ...base, background: 'var(--md-surface-2)', color: 'var(--md-on-surface)', border: '1px solid var(--md-outline-var)' };
  return { ...base, background: 'var(--md-surface-2)', color: 'var(--md-outline)', border: '1px solid var(--md-outline-var)', cursor: 'default' };
}
