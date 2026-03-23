import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Smile, Trash2 } from 'lucide-react';
import { db, collection, query, orderBy, limit, onSnapshot, setDoc, deleteDoc, doc } from '../firebase';
import { generateId } from '../storage';

const CHAT_LIMIT = 80;
const REACTIONS = ['👍', '🔥', '💪', '🎯', '✅', '😄'];

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

async function sendReaction(msgId, emoji, uid, currentReactions) {
  const ref = doc(db, 'chat', msgId);
  const existing = currentReactions || [];
  const alreadyReacted = existing.find(r => r.emoji === emoji && r.uid === uid);
  const next = alreadyReacted
    ? existing.filter(r => !(r.emoji === emoji && r.uid === uid))
    : [...existing, { emoji, uid }];
  await setDoc(ref, { reactions: next }, { merge: true });
}

function groupReactions(reactions = []) {
  const map = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = [];
    map[r.emoji].push(r.uid);
  }
  return Object.entries(map).map(([emoji, uids]) => ({ emoji, count: uids.length, uids }));
}

// ── Reaction emoji picker popup ───────────────────────────────────
function ReactionPicker({ msgId, uid, reactions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-icon"
        style={{ width: 26, height: 26 }}
        title="React"
      >
        <Smile size={13} />
      </button>
      {open && (
        <div
          className="scale-in"
          style={{
            position: 'absolute', bottom: 32, left: 0,
            background: 'var(--md-surface-2)',
            border: '1px solid var(--md-outline-var)',
            borderRadius: 'var(--md-shape-lg)',
            padding: '6px 8px',
            display: 'flex', gap: 2,
            boxShadow: 'var(--md-elev-3)',
            zIndex: 60, whiteSpace: 'nowrap',
          }}
        >
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { sendReaction(msgId, emoji, uid, reactions); setOpen(false); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, padding: '3px 5px', borderRadius: 6,
                transition: 'transform 0.12s cubic-bezier(0.2,0,0,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────
function MessageBubble({ msg, isMe, uid, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const grouped = groupReactions(msg.reactions);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: 10,
        animation: 'md-fade-in 0.22s cubic-bezier(0.2,0,0,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sender name — only for others */}
      {!isMe && (
        <div style={{ fontSize: 11, color: 'var(--md-outline)', marginBottom: 3, marginLeft: 38, fontWeight: 500 }}>
          {msg.displayName || 'User'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
        {/* Avatar circle */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isMe ? 'var(--md-primary-container)' : 'var(--md-surface-3)',
          color: isMe ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          {(msg.displayName || 'U')[0].toUpperCase()}
        </div>

        {/* Bubble + reactions */}
        <div style={{ maxWidth: '70%', minWidth: 0 }}>
          <div style={{
            background: isMe ? 'var(--md-primary)' : 'var(--md-surface-2)',
            color: isMe ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '9px 13px',
            fontSize: 14, lineHeight: 1.45,
            wordBreak: 'break-word',
            boxShadow: 'var(--md-elev-1)',
          }}>
            {msg.text}
          </div>

          <div style={{
            fontSize: 10, color: 'var(--md-outline)', marginTop: 3,
            textAlign: isMe ? 'right' : 'left', paddingInline: 2,
          }}>
            {formatTime(msg.createdAt)}
          </div>

          {grouped.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4,
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}>
              {grouped.map(({ emoji, count, uids }) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(msg.id, emoji, uid, msg.reactions)}
                  style={{
                    background: uids.includes(uid)
                      ? 'color-mix(in srgb, var(--md-primary) 16%, var(--md-surface-2))'
                      : 'var(--md-surface-2)',
                    border: `1px solid ${uids.includes(uid) ? 'var(--md-primary)' : 'var(--md-outline-var)'}`,
                    borderRadius: 'var(--md-shape-full)',
                    padding: '2px 8px', fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    color: 'var(--md-on-surface)', fontFamily: 'var(--md-font)',
                    transition: 'all 0.15s',
                  }}
                >
                  {emoji} <span style={{ fontSize: 11 }}>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons — appear on hover */}
        <div style={{
          display: 'flex', gap: 2, flexShrink: 0,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexDirection: isMe ? 'row-reverse' : 'row',
        }}>
          {uid && <ReactionPicker msgId={msg.id} uid={uid} reactions={msg.reactions} />}
          {isMe && (
            <button
              onClick={() => onDelete(msg.id)}
              className="btn-icon"
              style={{ width: 26, height: 26, color: 'var(--md-error)' }}
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Chat component ───────────────────────────────────────────
export default function Chat({ user, isGuest }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const openRef      = useRef(false);     // track open without re-subscribing
  const lastSeenRef  = useRef(Date.now());

  // Sync openRef without restarting the listener
  useEffect(() => { openRef.current = open; }, [open]);

  // Single real-time listener — never restarts
  useEffect(() => {
    const q = query(
      collection(db, 'chat'),
      orderBy('createdAt', 'desc'),
      limit(CHAT_LIMIT)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      setMessages(msgs);

      if (!openRef.current) {
        const fresh = msgs.filter(
          m => m.createdAt > lastSeenRef.current && m.uid !== user?.uid
        );
        if (fresh.length > 0) setUnread(n => n + fresh.length);
        // Advance lastSeen to newest so we don't re-count on next snapshot
        if (fresh.length > 0)
          lastSeenRef.current = Math.max(...fresh.map(m => m.createdAt));
      }
    });
    return unsub;
  }, [user?.uid]); // only restarts if uid changes (login/logout)

  // Scroll bottom + reset unread when opened
  useEffect(() => {
    if (open) {
      lastSeenRef.current = Date.now();
      setUnread(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        inputRef.current?.focus();
      }, 80);
    }
  }, [open]);

  // Scroll to bottom on new messages (only when already open)
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open]);

  async function sendMessage() {
    if (!text.trim() || sending || isGuest) return;
    setSending(true);
    const id = generateId();
    await setDoc(doc(db, 'chat', id), {
      id,
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      text: text.trim(),
      createdAt: Date.now(),
      reactions: [],
    });
    setText('');
    setSending(false);
  }

  async function deleteMessage(msgId) {
    await deleteDoc(doc(db, 'chat', msgId));
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const charsLeft = 500 - text.length;

  return (
    <>
      {/* ── FAB ───────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56,
          borderRadius: 'var(--md-shape-lg)',
          background: 'var(--md-primary)',
          color: 'var(--md-on-primary)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--md-elev-3)',
          transition: 'transform 280ms cubic-bezier(0.2,0,0,1), box-shadow 200ms',
          transform: open ? 'rotate(90deg) scale(0.88)' : 'scale(1)',
          zIndex: 400,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.boxShadow = 'var(--md-elev-4)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--md-elev-3)'; }}
        title={open ? 'Close chat' : 'Community chat'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 20, height: 20, borderRadius: 10,
            background: 'var(--md-error)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'md-scale-in 0.2s cubic-bezier(0.2,0,0,1)',
            border: '2px solid var(--md-surface)',
          }}>
            {unread > 99 ? '99+' : unread}
          </div>
        )}
      </button>

      {/* ── Chat panel ────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 92, right: 24,
        width: 340, height: 500,
        background: 'var(--md-surface-1)',
        border: '1px solid var(--md-outline-var)',
        borderRadius: 'var(--md-shape-xl)',
        boxShadow: 'var(--md-elev-4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 399,
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        pointerEvents: open ? 'all' : 'none',
        transition: open
          ? 'opacity 300ms cubic-bezier(0.05,0.7,0.1,1), transform 300ms cubic-bezier(0.05,0.7,0.1,1)'
          : 'opacity 180ms cubic-bezier(0.3,0,0.8,0.15), transform 180ms cubic-bezier(0.3,0,0.8,0.15)',
        willChange: 'transform, opacity',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--md-outline-var)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--md-surface-2)', flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--md-primary-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MessageCircle size={16} color="var(--md-on-primary-cont)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Community Chat</div>
            <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>
              Public · {messages.length} message{messages.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button className="btn-icon" onClick={() => setOpen(false)} style={{ width: 32, height: 32, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 10px 6px',
          display: 'flex', flexDirection: 'column',
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', color: 'var(--md-outline)',
              padding: '48px 16px', fontSize: 13, lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
              <div style={{ fontWeight: 500, color: 'var(--md-on-surface-var)', marginBottom: 4 }}>
                No messages yet
              </div>
              Be the first to say hello!
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.uid === user?.uid}
              uid={user?.uid}
              onDelete={deleteMessage}
            />
          ))}
          <div ref={bottomRef} style={{ height: 4 }} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '8px 10px 10px',
          borderTop: '1px solid var(--md-outline-var)',
          background: 'var(--md-surface-2)', flexShrink: 0,
        }}>
          {isGuest ? (
            <div style={{
              fontSize: 13, color: 'var(--md-outline)',
              padding: '10px 8px', fontStyle: 'italic', textAlign: 'center',
            }}>
              Sign in to send messages
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message everyone... (Enter to send)"
                  maxLength={500}
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'var(--md-surface-3)',
                    border: '1px solid var(--md-outline-var)',
                    borderRadius: 'var(--md-shape-lg)',
                    padding: '9px 13px',
                    color: 'var(--md-on-surface)',
                    fontSize: 14, fontFamily: 'var(--md-font)',
                    resize: 'none', outline: 'none',
                    lineHeight: 1.4, maxHeight: 88, overflowY: 'auto',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: text.trim() ? 'var(--md-primary)' : 'var(--md-surface-3)',
                    color: text.trim() ? 'var(--md-on-primary)' : 'var(--md-outline)',
                    border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.2,0,0,1)',
                    transform: text.trim() ? 'scale(1)' : 'scale(0.88)',
                    boxShadow: text.trim() ? 'var(--md-elev-1)' : 'none',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              {/* Char counter — only shows when near limit */}
              {charsLeft < 100 && (
                <div style={{
                  fontSize: 10, color: charsLeft < 30 ? 'var(--md-error)' : 'var(--md-outline)',
                  textAlign: 'right', marginTop: 4, paddingRight: 2,
                  fontFamily: 'var(--md-mono)',
                  transition: 'color 0.2s',
                }}>
                  {charsLeft}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
