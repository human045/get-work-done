import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Search, Check, X, MessageCircle, UserMinus, Bell, ChevronDown } from 'lucide-react';
import {
  searchUsers, sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, listenFriends, listenIncomingRequests, listenOutgoingRequests,
} from '../friends';
import PrivateChat from './PrivateChat';

// MD3 easing
const E = {
  decel:  'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  accel:  'cubic-bezier(0.3, 0, 0.8, 0.15)',
  std:    'cubic-bezier(0.2, 0, 0, 1)',
};

function Avatar({ name, size = 36, bg = 'var(--md-primary-container)', color = 'var(--md-on-primary-cont)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 700,
    }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
}

const TABS = [
  { id: 'friends',  label: 'Friends',  Icon: Users  },
  { id: 'requests', label: 'Requests', Icon: Bell   },
  { id: 'search',   label: 'Add',      Icon: UserPlus },
];

export default function FriendsPanel({ user, isGuest, onViewProfile }) {
  const [open, setOpen]             = useState(false);
  const [tab, setTab]               = useState('friends');
  const [friends, setFriends]       = useState([]);
  const [incoming, setIncoming]     = useState([]);
  const [outgoing, setOutgoing]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [openChat, setOpenChat]     = useState(null);
  const [unreadReqs, setUnreadReqs] = useState(0);
  const searchTimer = useRef(null);

  const uid      = user?.uid;
  const myName   = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myInits  = myName[0]?.toUpperCase() || 'U';

  // Listeners
  useEffect(() => {
    if (!uid || isGuest) return;
    const u1 = listenFriends(uid, setFriends);
    const u2 = listenIncomingRequests(uid, reqs => {
      setIncoming(reqs);
      if (!open) setUnreadReqs(reqs.length);
    });
    const u3 = listenOutgoingRequests(uid, setOutgoing);
    return () => { u1(); u2(); u3(); };
  }, [uid, isGuest]); // eslint-disable-line

  useEffect(() => { if (open) setUnreadReqs(0); }, [open]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchUsers(searchTerm, uid);
      setResults(r);
      setSearching(false);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm, uid]);

  function isFriend(id)        { return friends.some(f => f.uid === id); }
  function isPending(id)       { return outgoing.some(r => r.to === id); }

  async function handleAccept(req) {
    await acceptFriendRequest(req, uid, myName, myInits);
  }

  // When chat opens, close the panel. When chat closes, reopen panel.
  function openChatWith(friend) {
    setOpenChat(friend);
    setOpen(false);
  }
  function closeChat() {
    setOpenChat(null);
    setOpen(true);
  }

  if (isGuest) return null;

  // Panel is visible when open=true and no chat active
  const panelVisible = open && !openChat;
  // FAB icon state
  const fabActive = open || !!openChat;

  return (
    <>
      {/* ── FAB ──────────────────────────────────────── */}
      <button
        className="friends-fab"
        onClick={() => {
          if (openChat) { closeChat(); return; }
          setOpen(o => !o);
        }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56,
          borderRadius: 'var(--md-shape-lg)',
          background: fabActive ? 'var(--md-surface-2)' : 'var(--md-primary)',
          color: fabActive ? 'var(--md-primary)' : 'var(--md-on-primary)',
          border: fabActive ? '2px solid var(--md-primary)' : '2px solid transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--md-elev-3)',
          transition: `
            background 250ms ${E.std},
            color 250ms ${E.std},
            border-color 250ms ${E.std},
            transform 300ms ${E.decel},
            box-shadow 200ms ${E.std}
          `,
          transform: fabActive ? 'rotate(180deg) scale(0.9)' : 'scale(1)',
          zIndex: 410,
          outline: 'none',
        }}
        title={openChat ? 'Back to friends' : open ? 'Close' : 'Friends'}
      >
        {fabActive ? <ChevronDown size={22} /> : <Users size={22} />}

        {/* Badge */}
        {!fabActive && unreadReqs > 0 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 20, height: 20, borderRadius: 10,
            background: 'var(--md-error)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--md-surface)',
            animation: `md-scale-in 0.22s ${E.decel}`,
          }}>
            {unreadReqs}
          </div>
        )}
      </button>

      {/* ── Friends Panel ─────────────────────────────── */}
      <div className="friends-panel-container" style={{
        position: 'fixed', bottom: 92, right: 24,
        width: 320, height: 490,
        background: 'var(--md-surface-1)',
        border: '1px solid var(--md-outline-var)',
        borderRadius: 'var(--md-shape-xl)',
        boxShadow: 'var(--md-elev-4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 399,
        // Slide down + fade out when chat opens, scale up when fully closing
        opacity:  panelVisible ? 1 : 0,
        transform: panelVisible
          ? 'translateY(0) scale(1)'
          : openChat
            ? 'translateX(24px) scale(0.96)' // slide right when chat takes over
            : 'translateY(24px) scale(0.95)', // slide down when just closing
        pointerEvents: panelVisible ? 'all' : 'none',
        transition: panelVisible
          ? `opacity 320ms ${E.decel}, transform 320ms ${E.decel}`
          : `opacity 200ms ${E.accel}, transform 200ms ${E.accel}`,
        willChange: 'transform, opacity',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 14px 0', background: 'var(--md-surface-2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Avatar name={myName} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Friends</div>
              <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>
                {friends.length} friend{friends.length !== 1 ? 's' : ''}
                {incoming.length > 0 && ` · ${incoming.length} pending`}
              </div>
            </div>
            <button className="btn-icon" onClick={() => setOpen(false)} style={{ width: 30, height: 30 }}>
              <X size={15} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', position: 'relative' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '7px 4px',
                  border: 'none', background: 'transparent',
                  color: tab === t.id ? 'var(--md-primary)' : 'var(--md-outline)',
                  fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
                  fontFamily: 'var(--md-font)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: `color 200ms ${E.std}, font-weight 150ms ${E.std}`,
                  paddingBottom: 9,
                }}
              >
                <t.Icon size={12} />
                {t.label}
                {t.id === 'requests' && incoming.length > 0 && (
                  <span style={{
                    background: 'var(--md-error)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                  }}>
                    {incoming.length}
                  </span>
                )}
                {t.id === 'friends' && friends.length > 0 && (
                  <span style={{
                    background: 'var(--md-primary-container)', color: 'var(--md-primary)',
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                  }}>
                    {friends.length}
                  </span>
                )}
              </button>
            ))}

            {/* Sliding indicator */}
            <div style={{
              position: 'absolute', bottom: 0, height: 2,
              background: 'var(--md-primary)',
              borderRadius: '2px 2px 0 0',
              width: `${100 / TABS.length}%`,
              left: `${(TABS.findIndex(t => t.id === tab) / TABS.length) * 100}%`,
              transition: `left 280ms ${E.decel}`,
            }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--md-outline-var)', flexShrink: 0 }} />

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

          {/* ── Friends ── */}
          {tab === 'friends' && (
            friends.length === 0 ? (
              <EmptyState icon="👥" title="No friends yet" sub="Use Add tab to find users" />
            ) : (
              friends.map((f, i) => (
                <FriendRow
                  key={f.uid}
                  friend={f}
                  index={i}
                  onChat={() => openChatWith(f)}
                  onRemove={() => removeFriend(uid, f.uid)}
                  onViewProfile={() => { setOpen(false); onViewProfile(f.uid); }}
                />
              ))
            )
          )}

          {/* ── Requests ── */}
          {tab === 'requests' && (
            incoming.length === 0 && outgoing.length === 0 ? (
              <EmptyState icon="📬" title="No pending requests" sub="" />
            ) : (
              <>
                {incoming.length > 0 && (
                  <>
                    <SectionLabel>Incoming</SectionLabel>
                    {incoming.map((req, i) => (
                      <IncomingRow
                        key={req.id}
                        req={req}
                        index={i}
                        onAccept={() => handleAccept(req)}
                        onDecline={() => declineFriendRequest(req.id)}
                      />
                    ))}
                  </>
                )}
                {outgoing.length > 0 && (
                  <>
                    <SectionLabel style={{ marginTop: incoming.length > 0 ? 10 : 0 }}>Sent</SectionLabel>
                    {outgoing.map((req, i) => (
                      <OutgoingRow
                        key={req.id}
                        req={req}
                        index={i}
                        onCancel={() => declineFriendRequest(req.id)}
                      />
                    ))}
                  </>
                )}
              </>
            )
          )}

          {/* ── Search ── */}
          {tab === 'search' && (
            <>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
              />
              {searching && (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--md-outline)', fontSize: 13 }}>
                  <div className="loading-spinner" style={{ width: 20, height: 20, margin: '0 auto 8px' }} />
                  Searching...
                </div>
              )}
              {!searching && searchTerm && searchResults.length === 0 && (
                <EmptyState icon="🔍" title={`No results for "${searchTerm}"`} sub="" />
              )}
              {!searching && searchResults.map((u, i) => (
                <SearchResultRow
                  key={u.uid}
                  user={u}
                  index={i}
                  alreadyFriend={isFriend(u.uid)}
                  pending={isPending(u.uid)}
                  onAdd={() => sendFriendRequest(uid, myName, myInits, u.uid)}
                  onViewProfile={() => { setOpen(false); onViewProfile(u.uid); }}
                />
              ))}
              {!searchTerm && (
                <EmptyState icon="🔍" title="Search by name" sub="Find users to add as friends" />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Private Chat ─────────────────────────────── */}
      {openChat && (
        <PrivateChat
          myUid={uid}
          myName={myName}
          friend={openChat}
          onClose={closeChat}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--md-outline)' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--md-outline)',
      letterSpacing: '0.5px', textTransform: 'uppercase',
      padding: '2px 4px 6px', ...style,
    }}>
      {children}
    </div>
  );
}

function RowWrap({ index, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
      marginBottom: 4, background: 'var(--md-surface-2)',
      animation: `md-fade-in 0.22s cubic-bezier(0.05,0.7,0.1,1)`,
      animationDelay: `${index * 0.04}s`,
      animationFillMode: 'both',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--md-surface-3)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--md-surface-2)'}
    >
      {children}
    </div>
  );
}

function FriendRow({ friend, index, onChat, onRemove, onViewProfile }) {
  return (
    <RowWrap index={index}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--md-primary-container)',
        color: 'var(--md-on-primary-cont)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
        cursor: 'pointer',
      }} onClick={onViewProfile} title="View profile">
        {(friend.displayName || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onViewProfile}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {friend.displayName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>View profile →</div>
      </div>
      <button onClick={onChat} className="btn-icon" style={{ color: 'var(--md-primary)', width: 32, height: 32 }} title="Chat">
        <MessageCircle size={16} />
      </button>
      <button onClick={onRemove} className="btn-icon" style={{ color: 'var(--md-error)', width: 32, height: 32 }} title="Remove">
        <UserMinus size={15} />
      </button>
    </RowWrap>
  );
}

function IncomingRow({ req, index, onAccept, onDecline }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 'var(--md-shape-md)',
      marginBottom: 4, background: 'var(--md-surface-2)',
      border: '1px solid color-mix(in srgb, var(--md-primary) 20%, transparent)',
      animation: `md-fade-in 0.22s cubic-bezier(0.05,0.7,0.1,1)`,
      animationDelay: `${index * 0.04}s`,
      animationFillMode: 'both',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--md-primary-container)',
        color: 'var(--md-on-primary-cont)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>
        {(req.fromName || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {req.fromName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>wants to be friends</div>
      </div>
      <button onClick={onAccept}  className="btn-icon" style={{ color: 'var(--md-success)', width: 30, height: 30 }} title="Accept"><Check size={16} /></button>
      <button onClick={onDecline} className="btn-icon" style={{ color: 'var(--md-error)',   width: 30, height: 30 }} title="Decline"><X size={15} /></button>
    </div>
  );
}

function OutgoingRow({ req, index, onCancel }) {
  return (
    <RowWrap index={index}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--md-surface-3)', color: 'var(--md-outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>?</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--md-on-surface-var)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Request pending…
        </div>
      </div>
      <button onClick={onCancel} className="btn-icon" style={{ color: 'var(--md-outline)', width: 30, height: 30 }} title="Cancel"><X size={14} /></button>
    </RowWrap>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <Search size={14} style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--md-outline)', pointerEvents: 'none',
      }} />
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
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
  );
}

function SearchResultRow({ user, index, alreadyFriend, pending, onAdd, onViewProfile }) {
  return (
    <RowWrap index={index}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--md-primary-container)',
        color: 'var(--md-on-primary-cont)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }} onClick={onViewProfile}>
        {(user.displayName || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onViewProfile}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.displayName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>{user.totalPoints || 0} pts</div>
      </div>
      {alreadyFriend ? (
        <span style={{ fontSize: 11, color: 'var(--md-success)', fontWeight: 500, whiteSpace: 'nowrap' }}>Friends ✓</span>
      ) : pending ? (
        <span style={{ fontSize: 11, color: 'var(--md-outline)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>Pending…</span>
      ) : (
        <button onClick={onAdd} className="btn-icon" style={{ color: 'var(--md-primary)', width: 32, height: 32 }} title="Add friend">
          <UserPlus size={16} />
        </button>
      )}
    </RowWrap>
  );
}
