import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, FolderOpen } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { saveWorkspace, deleteWorkspace, generateId } from '../storage';

// MD3 motion curves
// emphasized = cubic-bezier(0.2, 0, 0, 1)       — standard spatial moves
// emphasized-decelerate = cubic-bezier(0.05, 0.7, 0.1, 1.0) — elements entering
// emphasized-accelerate = cubic-bezier(0.3, 0, 0.8, 0.15)   — elements exiting

const EASING = {
  emphasized:           'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecel:      'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  emphasizedAccel:      'cubic-bezier(0.3, 0, 0.8, 0.15)',
  standard:             'cubic-bezier(0.2, 0, 0, 1)',
};

const DEFAULT_WS = { id: 'general', name: 'General', isDefault: true };

function WsTab({ ws, isActive, isDragging, dropSuccess, onClick, onStartEdit, onDelete }) {
  const { isOver, setNodeRef } = useDroppable({ id: ws.id });
  const isSuccess = dropSuccess?.wsId === ws.id;

  // Compute state-based styles
  const isDropTarget = isDragging && isOver;
  const isIdle        = isDragging && !isOver;

  const tabScale    = isDropTarget ? 'scale(1.14)' : 'scale(1)';
  const tabBg       = isSuccess
    ? 'color-mix(in srgb, var(--md-success) 22%, transparent)'
    : isDropTarget
      ? 'color-mix(in srgb, var(--md-primary) 28%, transparent)'
      : isActive
        ? 'color-mix(in srgb, var(--md-primary) 16%, transparent)'
        : isIdle
          ? 'color-mix(in srgb, var(--md-on-surface) 6%, transparent)'
          : 'transparent';

  const borderColor = isSuccess
    ? 'var(--md-success)'
    : isDropTarget
      ? 'var(--md-primary)'
      : isIdle
        ? 'var(--md-outline-var)'
        : 'transparent';

  const textColor = isSuccess
    ? 'var(--md-success)'
    : isDropTarget || isActive
      ? 'var(--md-primary)'
      : 'var(--md-outline)';

  const fontSize = isDragging ? 14 : 13; // tabs grow slightly during drag

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        flexShrink: 0,
        borderRadius: 'var(--md-shape-full)',
        border: `2px solid ${borderColor}`,
        transform: tabScale,
        transformOrigin: 'center bottom',
        transition: `transform 300ms ${EASING.emphasizedDecel},
                     border-color 200ms ${EASING.standard},
                     background 200ms ${EASING.standard}`,
        willChange: 'transform',
      }}
    >
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isDragging ? '7px 16px' : '5px 12px',
          borderRadius: 'var(--md-shape-full)',
          fontSize, fontWeight: isActive || isDropTarget ? 600 : 400,
          fontFamily: 'var(--md-font)', cursor: 'pointer', border: 'none',
          background: tabBg,
          color: textColor,
          transition: `padding 300ms ${EASING.emphasizedDecel},
                       font-size 300ms ${EASING.emphasizedDecel},
                       font-weight 150ms ${EASING.standard},
                       background 200ms ${EASING.standard},
                       color 200ms ${EASING.standard}`,
          whiteSpace: 'nowrap',
        }}
      >
        {ws.isDefault && <FolderOpen size={isDragging ? 15 : 13} style={{ transition: `all 300ms ${EASING.emphasizedDecel}` }} />}
        {ws.name}
        {isActive && !ws.isDefault && (
          <span style={{ display: 'flex', gap: 1, marginLeft: 2 }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onStartEdit(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-outline)', padding: 1, display: 'flex' }}
            >
              <Pencil size={10} />
            </button>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-error)', padding: 1, display: 'flex' }}
            >
              <Trash2 size={10} />
            </button>
          </span>
        )}
      </button>

      {/* Ripple ring when hovering during drag */}
      {isDropTarget && (
        <div style={{
          position: 'absolute', inset: -5,
          borderRadius: 'var(--md-shape-full)',
          border: '2px solid var(--md-primary)',
          opacity: 0.6,
          animation: 'ws-ring-pulse 1s cubic-bezier(0.2,0,0,1) infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Success flash overlay */}
      {isSuccess && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 'var(--md-shape-full)',
          background: 'color-mix(in srgb, var(--md-success) 30%, transparent)',
          animation: 'ws-success-flash 0.6s cubic-bezier(0.2,0,0,1) forwards',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

export default function WorkspaceBar({
  workspaces, setWorkspaces, activeId, setActiveId,
  uid, works, setWorks, onSaveWork,
  isDragging, dropSuccess,
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  async function handleCreate() {
    if (!newName.trim()) { setCreating(false); return; }
    const ws = { id: generateId(), name: newName.trim(), createdAt: Date.now() };
    setWorkspaces([...workspaces, ws]);
    await saveWorkspace(uid, ws);
    setActiveId(ws.id);
    setNewName(''); setCreating(false);
  }

  async function handleRename(ws) {
    if (!editName.trim() || editName.trim() === ws.name) { setEditId(null); return; }
    const updated = { ...ws, name: editName.trim() };
    setWorkspaces(workspaces.map(w => w.id === ws.id ? updated : w));
    await saveWorkspace(uid, updated);
    setEditId(null);
  }

  async function handleDelete(ws) {
    const updatedWorks = works.map(w => w.workspaceId === ws.id ? { ...w, workspaceId: 'general' } : w);
    setWorks(updatedWorks);
    for (const w of works.filter(w => w.workspaceId === ws.id))
      await onSaveWork({ ...w, workspaceId: 'general' });
    setWorkspaces(workspaces.filter(w => w.id !== ws.id));
    await deleteWorkspace(uid, ws.id);
    if (activeId === ws.id) setActiveId('general');
  }

  const displayWs = [DEFAULT_WS, ...workspaces];

  // Bar height expands during drag — MD3 emphasized decelerate
  const barHeight = isDragging ? 68 : 48;

  return (
    <>
      <style>{`
        @keyframes ws-ring-pulse {
          0%   { opacity: 0.7; transform: scale(1); }
          50%  { opacity: 0.2; transform: scale(1.12); }
          100% { opacity: 0.7; transform: scale(1); }
        }
        @keyframes ws-success-flash {
          0%   { opacity: 1; }
          60%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes ws-bar-hint {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isDragging ? 8 : 4,
        padding: isDragging ? '0 20px' : '0 16px',
        height: barHeight,
        minHeight: barHeight,
        borderBottom: `${isDragging ? 2 : 1}px solid ${isDragging ? 'var(--md-primary)' : 'var(--md-outline-var)'}`,
        background: isDragging
          ? 'color-mix(in srgb, var(--md-primary) 6%, var(--md-surface-1))'
          : 'var(--md-surface-1)',
        overflowX: 'auto',
        flexShrink: 0,
        transition: `height 350ms ${EASING.emphasizedDecel},
                     min-height 350ms ${EASING.emphasizedDecel},
                     padding 350ms ${EASING.emphasizedDecel},
                     gap 350ms ${EASING.emphasizedDecel},
                     border-color 200ms ${EASING.standard},
                     border-width 200ms ${EASING.standard},
                     background 250ms ${EASING.standard}`,
        willChange: 'height',
      }}>

        {/* Drop hint label — fades in when drag starts */}
        <div style={{
          fontSize: 11, fontWeight: 600,
          color: 'var(--md-primary)',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          maxWidth: isDragging ? 90 : 0,
          overflow: 'hidden',
          opacity: isDragging ? 1 : 0,
          transition: `max-width 350ms ${EASING.emphasizedDecel},
                       opacity 250ms ${EASING.emphasizedDecel}`,
          animation: isDragging ? `ws-bar-hint 300ms ${EASING.emphasizedDecel}` : 'none',
        }}>
          Drop here →
        </div>

        {displayWs.map(ws => (
          editId === ws.id ? (
            <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(ws);
                  if (e.key === 'Escape') setEditId(null);
                }}
                style={{
                  background: 'var(--md-surface-2)', border: '1px solid var(--md-primary)',
                  borderRadius: 'var(--md-shape-sm)', padding: '3px 8px',
                  color: 'var(--md-on-surface)', fontSize: 13, width: 110,
                  fontFamily: 'var(--md-font)', outline: 'none',
                }}
              />
              <button onClick={() => handleRename(ws)} className="btn-icon" style={{ width: 24, height: 24 }}><Check size={12} /></button>
              <button onClick={() => setEditId(null)} className="btn-icon" style={{ width: 24, height: 24 }}><X size={12} /></button>
            </div>
          ) : (
            <WsTab
              key={ws.id}
              ws={ws}
              isActive={activeId === ws.id}
              isDragging={isDragging}
              dropSuccess={dropSuccess}
              onClick={() => setActiveId(ws.id)}
              onStartEdit={() => { setEditName(ws.name); setEditId(ws.id); }}
              onDelete={() => handleDelete(ws)}
            />
          )
        ))}

        {/* New workspace button */}
        {!isDragging && (
          creating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
                placeholder="Workspace name"
                maxLength={30}
                style={{
                  background: 'var(--md-surface-2)', border: '1px solid var(--md-primary)',
                  borderRadius: 'var(--md-shape-sm)', padding: '3px 10px',
                  color: 'var(--md-on-surface)', fontSize: 13, width: 130,
                  fontFamily: 'var(--md-font)', outline: 'none',
                }}
              />
              <button onClick={handleCreate} className="btn-icon" style={{ width: 26, height: 26 }}><Check size={13} /></button>
              <button onClick={() => { setCreating(false); setNewName(''); }} className="btn-icon" style={{ width: 26, height: 26 }}><X size={13} /></button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="btn-icon"
              title="New workspace"
              style={{ flexShrink: 0, width: 28, height: 28 }}
            >
              <Plus size={15} />
            </button>
          )
        )}
      </div>
    </>
  );
}
