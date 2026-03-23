import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Search, Check, X, MessageCircle, UserMinus, Bell, ChevronDown } from 'lucide-react';
import {
  searchUsers, sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, listenFriends, listenIncomingRequests, listenOutgoingRequests,
} from '../friends';
import PrivateChat from './PrivateChat';

function Avatar({ name, size = 36, bg = 'var(--md-primary-container)', color = 'var(--md-on-primary-cont)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700,
    }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
}

export default function FriendsPanel({ user, isGuest, myPoints }) {
  const [open, setOpen]               = useState(false);
  const [tab, setTab]                 = useState('friends'); // friends | search | requests
  const [friends, setFriends]         = useState([]);
  const [incoming, setIncoming]       = useState([]);
  const [outgoing, setOutgoing]       = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [openChat, setOpenChat]       = useState(null); // friend object
  const [unreadReqs, setUnreadReqs]   = useState(0);
  const searchTimer = useRef(null);
  const panelRef = useRef(null);

  const uid = user?.uid;
  const myName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myInitials = myName[0]?.toUpperCase() || 'U';

  // Real-time listeners
  useEffect(() => {
    if (!uid || isGuest) return;
    const u1 = listenFriends(uid, setFriends);
    const u2 = listenIncomingRequests(uid, reqs => {
      setIncoming(reqs);
      if (!open) setUnreadReqs(reqs.length);
    });
    const u3 = listenOutgoingRequests(uid, setOutgoing);
    return () => { u1(); u2(); u3(); };
  }, [uid, isGuest, open]);

  useEffect(() => {
    if (open) setUnreadReqs(0);
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchUsers(searchTerm, uid);
      setSearchResults(results);
      setSearching(false);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm, uid]);

  async function handleSendRequest(targetUid) {
    await sendFriendRequest(uid, myName, myInitials, targetUid);
  }

  async function handleAccept(req) {
    await acceptFriendRequest(req, uid, myName, myInitials);
  }

  function isFriend(targetUid) {
    return friends.some(f => f.uid === targetUid);
  }

  function hasPendingRequest(targetUid) {
    return outgoing.some(r => r.to === targetUid);
  }

  if (isGuest) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56,
          borderRadius: 'var(--md-shape-lg)',
          background: open ? 'var(--md-surface-2)' : 'var(--md-primary)',
          color: open ? 'var(--md-primary)' : 'var(--md-on-primary)',
          border: open ? '2px solid var(--md-primary)' : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--md-elev-3)',
          transition: 'all 0.28s cubic-bezier(0.2,0,0,1)',
          transform: open ? 'rotate(180deg) scale(0.9)' : 'scale(1)',
          zIndex: 400,
        }}
        title={open ? 'Close friends' : 'Friends'}
      >
        {open ? <ChevronDown size={22} /> : <Users size={22} />}

        {/* Pending requests badge */}
        {!open && unreadReqs > 0 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 20, height: 20, borderRadius: 10,
            background: 'var(--md-error)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--md-surface)',
            animation: 'md-scale-in 0.2s cubic-bezier(0.2,0,0,1)',
          }}>
            {unreadReqs}
          </div>
        )}
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', bottom: 92, right: 24,
          width: 320, height: 480,
          background: 'var(--md-surface-1)',
          border: '1px solid var(--md-outline-var)',
          borderRadius: 'var(--md-shape-xl)',
          boxShadow: 'var(--md-elev-4)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 399,
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          pointerEvents: open ? 'all' : 'none',
          transition: open
            ? 'opacity 300ms cubic-bezier(0.05,0.7,0.1,1), transform 300ms cubic-bezier(0.05,0.7,0.1,1)'
            : 'opacity 180ms cubic-bezier(0.3,0,0.8,0.15), transform 180ms cubic-bezier(0.3,0,0.8,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 14px 0',
          background: 'var(--md-surface-2)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Avatar name={myName} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Friends</div>
              <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>
                {friends.length} friend{friends.length !== 1 ? 's' : ''}
                {incoming.length > 0 && ` · ${incoming.length} request${incoming.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <button className="btn-icon" onClick={() => setOpen(false)} style={{ width: 30, height: 30 }}>
              <X size={15} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 0 }}>
            {[
              { id: 'friends', label: 'Friends', icon: <Users size={12} />, count: friends.length },
              { id: 'requests', label: 'Requests', icon: <Bell size={12} />, count: incoming.length },
              { id: 'search', label: 'Add', icon: <UserPlus size={12} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '7px 4px',
                  border: 'none', background: 'transparent',
                  borderBottom: tab === t.id ? '2px solid var(--md-primary)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--md-primary)' : 'var(--md-outline)',
                  fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
                  fontFamily: 'var(--md-font)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                  marginBottom: -1,
                }}
              >
                {t.icon}
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    background: t.id === 'requests' ? 'var(--md-error)' : 'var(--md-primary-container)',
                    color: t.id === 'requests' ? '#fff' : 'var(--md-primary)',
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--md-outline-var)', flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

          {/* ── Friends tab ── */}
          {tab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--md-outline)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                  <div style={{ fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 4 }}>No friends yet</div>
                  <div style={{ fontSize: 12 }}>Search for users to add them</div>
                </div>
              ) : (
                friends.map(f => (
                  <div
                    key={f.uid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
                      marginBottom: 4, background: 'var(--md-surface-2)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--md-surface-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--md-surface-2)'}
                  >
                    <Avatar name={f.displayName} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.displayName}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenChat(f)}
                      className="btn-icon"
                      style={{ color: 'var(--md-primary)', width: 32, height: 32 }}
                      title="Chat"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => removeFriend(uid, f.uid)}
                      className="btn-icon"
                      style={{ color: 'var(--md-error)', width: 32, height: 32 }}
                      title="Remove friend"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── Requests tab ── */}
          {tab === 'requests' && (
            <>
              {incoming.length === 0 && outgoing.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--md-outline)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                  <div style={{ fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 4 }}>No pending requests</div>
                </div>
              )}

              {incoming.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '2px 4px 6px' }}>
                    Incoming
                  </div>
                  {incoming.map(req => (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
                        marginBottom: 4, background: 'var(--md-surface-2)',
                        border: '1px solid color-mix(in srgb, var(--md-primary) 20%, transparent)',
                      }}
                    >
                      <Avatar name={req.fromName} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.fromName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>wants to be friends</div>
                      </div>
                      <button
                        onClick={() => handleAccept(req)}
                        className="btn-icon"
                        style={{ color: 'var(--md-success)', width: 30, height: 30 }}
                        title="Accept"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="btn-icon"
                        style={{ color: 'var(--md-error)', width: 30, height: 30 }}
                        title="Decline"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {outgoing.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-outline)', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '8px 4px 6px' }}>
                    Sent
                  </div>
                  {outgoing.map(req => (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
                        marginBottom: 4, background: 'var(--md-surface-2)', opacity: 0.7,
                      }}
                    >
                      <Avatar name={req.fromName} size={34} bg="var(--md-surface-3)" color="var(--md-outline)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--md-on-surface-var)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Request sent · pending
                        </div>
                      </div>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="btn-icon"
                        style={{ color: 'var(--md-outline)', width: 30, height: 30 }}
                        title="Cancel request"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── Search tab ── */}
          {tab === 'search' && (
            <>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={14} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--md-outline)', pointerEvents: 'none',
                }} />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  style={{
                    width: '100%', background: 'var(--md-surface-2)',
                    border: '1px solid var(--md-outline-var)',
                    borderRadius: 'var(--md-shape-full)',
                    padding: '9px 14px 9px 32px',
                    color: 'var(--md-on-surface)', fontSize: 13,
                    fontFamily: 'var(--md-font)', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
                />
              </div>

              {searching && (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--md-outline)', fontSize: 13 }}>
                  <div className="loading-spinner" style={{ width: 20, height: 20, margin: '0 auto 8px' }} />
                  Searching...
                </div>
              )}

              {!searching && searchTerm && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--md-outline)', fontSize: 13 }}>
                  No users found for "{searchTerm}"
                </div>
              )}

              {!searching && searchResults.map(u => {
                const alreadyFriend = isFriend(u.uid);
                const pendingOut = hasPendingRequest(u.uid);
                return (
                  <div
                    key={u.uid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
                      marginBottom: 4, background: 'var(--md-surface-2)',
                    }}
                  >
                    <Avatar name={u.displayName} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.displayName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>
                        {u.totalPoints || 0} pts
                      </div>
                    </div>
                    {alreadyFriend ? (
                      <span style={{ fontSize: 11, color: 'var(--md-success)', fontWeight: 500 }}>Friends ✓</span>
                    ) : pendingOut ? (
                      <span style={{ fontSize: 11, color: 'var(--md-outline)', fontStyle: 'italic' }}>Pending…</span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u.uid)}
                        className="btn-icon"
                        style={{ color: 'var(--md-primary)', width: 32, height: 32 }}
                        title="Add friend"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {!searchTerm && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--md-outline)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 13 }}>Type a name to find users</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Private chat window */}
      {openChat && (
        <PrivateChat
          myUid={uid}
          myName={myName}
          friend={openChat}
          onClose={() => setOpenChat(null)}
        />
      )}
    </>
  );
}
