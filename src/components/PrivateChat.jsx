import { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2 } from 'lucide-react';
import { sendMessage, listenMessages, deleteMessage } from '../friends';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function Bubble({ msg, isMe, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        animation: 'md-fade-in 0.2s cubic-bezier(0.2,0,0,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
        {/* Avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: isMe ? 'var(--md-primary-container)' : 'var(--md-surface-3)',
          color: isMe ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
        }}>
          {(msg.displayName || 'U')[0].toUpperCase()}
        </div>

        {/* Bubble */}
        <div style={{ maxWidth: '72%' }}>
          <div style={{
            background: isMe ? 'var(--md-primary)' : 'var(--md-surface-2)',
            color: isMe ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
            borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
            padding: '8px 12px', fontSize: 14, lineHeight: 1.45,
            wordBreak: 'break-word', boxShadow: 'var(--md-elev-1)',
          }}>
            {msg.text}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--md-outline)', marginTop: 2,
            textAlign: isMe ? 'right' : 'left', paddingInline: 2,
          }}>
            {formatTime(msg.createdAt)}
          </div>
        </div>

        {/* Delete button */}
        {isMe && (
          <button
            onClick={() => onDelete(msg.id)}
            className="btn-icon"
            style={{
              width: 22, height: 22, flexShrink: 0,
              color: 'var(--md-error)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s',
            }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PrivateChat({ myUid, myName, friend, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsub = listenMessages(myUid, friend.uid, setMessages);
    return unsub;
  }, [myUid, friend.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(myUid, myName, friend.uid, text);
    setText('');
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const charsLeft = 500 - text.length;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 320, height: 460,
      background: 'var(--md-surface-1)',
      border: '1px solid var(--md-outline-var)',
      borderRadius: 'var(--md-shape-xl)',
      boxShadow: 'var(--md-elev-4)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 402,
      animation: 'chat-slide-in 0.32s cubic-bezier(0.05,0.7,0.1,1) forwards',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 14px',
        borderBottom: '1px solid var(--md-outline-var)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--md-surface-2)', flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--md-primary-container)',
          color: 'var(--md-on-primary-cont)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {(friend.displayName || 'U')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {friend.displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--md-outline)' }}>Private · end-to-end visible only to you both</div>
        </div>
        <button className="btn-icon" onClick={onClose} style={{ width: 30, height: 30, flexShrink: 0 }}>
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 6px', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--md-outline)', padding: '40px 16px', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
            Start a conversation with {friend.displayName}
          </div>
        )}
        {messages.map(msg => (
          <Bubble
            key={msg.id}
            msg={msg}
            isMe={msg.uid === myUid}
            onDelete={id => deleteMessage(myUid, friend.uid, id)}
          />
        ))}
        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 10px 10px',
        borderTop: '1px solid var(--md-outline-var)',
        background: 'var(--md-surface-2)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message ${friend.displayName}...`}
            maxLength={500}
            rows={1}
            style={{
              flex: 1, background: 'var(--md-surface-3)',
              border: '1px solid var(--md-outline-var)',
              borderRadius: 'var(--md-shape-lg)',
              padding: '8px 12px', color: 'var(--md-on-surface)',
              fontSize: 13, fontFamily: 'var(--md-font)',
              resize: 'none', outline: 'none',
              lineHeight: 1.4, maxHeight: 80, overflowY: 'auto',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: text.trim() ? 'var(--md-primary)' : 'var(--md-surface-3)',
              color: text.trim() ? 'var(--md-on-primary)' : 'var(--md-outline)',
              cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.2,0,0,1)',
              transform: text.trim() ? 'scale(1)' : 'scale(0.88)',
            }}
          >
            <Send size={15} />
          </button>
        </div>
        {charsLeft < 100 && (
          <div style={{
            fontSize: 10, color: charsLeft < 30 ? 'var(--md-error)' : 'var(--md-outline)',
            textAlign: 'right', marginTop: 3, fontFamily: 'var(--md-mono)',
          }}>
            {charsLeft}
          </div>
        )}
      </div>
    </div>
  );
}
