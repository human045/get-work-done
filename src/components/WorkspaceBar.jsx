import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, FolderOpen } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { saveWorkspace, deleteWorkspace, generateId } from '../storage';

const DEFAULT_WS = { id: 'general', name: 'General', isDefault: true };

// ── Single droppable tab ──────────────────────────────────────────
function WsTab({ ws, isActive, isDragging, dropSuccess, onClick, onStartEdit, onDelete }) {
  const { isOver, setNodeRef } = useDroppable({ id: ws.id });

  const isSuccess = dropSuccess?.wsId === ws.id;

  let bg = 'transparent';
  let border = 'transparent';
  let color = isActive ? 'var(--md-primary)' : 'var(--md-outline)';
  let fontWeight = isActive ? 600 : 400;

  if (isActive) {
    bg = 'color-mix(in srgb, var(--md-primary) 16%, transparent)';
  }
  if (isDragging && isOver) {
    bg = 'color-mix(in srgb, var(--md-primary) 22%, transparent)';
    border = 'var(--md-primary)';
    color = 'var(--md-primary)';
    fontWeight = 600;
  }
  if (isDragging && !isOver && !isActive) {
    bg = 'color-mix(in srgb, var(--md-on-surface) 5%, transparent)';
    border = 'var(--md-outline-var)';
  }
  if (isSuccess) {
    bg = 'color-mix(in srgb, var(--md-success) 22%, transparent)';
    border = 'var(--md-success)';
    color = 'var(--md-success)';
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative', flexShrink: 0,
        borderRadius: 'var(--md-shape-full)',
        border: `2px solid ${border}`,
        transition: 'all 0.18s cubic-bezier(0.2,0,0,1)',
        transform: isDragging && isOver ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 'var(--md-shape-full)',
          fontSize: 13, fontWeight,
          fontFamily: 'var(--md-font)', cursor: 'pointer', border: 'none',
          background: bg, color,
          transition: 'all 0.18s cubic-bezier(0.2,0,0,1)',
          whiteSpace: 'nowrap',
        }}
      >
        {ws.isDefault && <FolderOpen size={13} />}
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

      {/* Drop indicator pulse ring */}
      {isDragging && isOver && (
        <div style={{
          position: 'absolute', inset: -3,
          borderRadius: 'var(--md-shape-full)',
          border: '2px solid var(--md-primary)',
          animation: 'drop-pulse 0.8s ease infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

export default function WorkspaceBar({ workspaces, setWorkspaces, activeId, setActiveId, uid, works, setWorks, onSaveWork, isDragging, allWs, dropSuccess }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef(null);
  const editRef = useRef(null);

  async function handleCreate() {
    if (!newName.trim()) { setCreating(false); return; }
    const ws = { id: generateId(), name: newName.trim(), createdAt: Date.now() };
    const next = [...workspaces, ws];
    setWorkspaces(next);
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
    const affected = works.filter(w => w.workspaceId === ws.id);
    const updatedWorks = works.map(w => w.workspaceId === ws.id ? { ...w, workspaceId: 'general' } : w);
    setWorks(updatedWorks);
    for (const w of affected) await onSaveWork({ ...w, workspaceId: 'general' });
    setWorkspaces(workspaces.filter(w => w.id !== ws.id));
    await deleteWorkspace(uid, ws.id);
    if (activeId === ws.id) setActiveId('general');
  }

  const displayWs = [DEFAULT_WS, ...workspaces];

  return (
    <>
      {/* Drop pulse keyframe injected inline */}
      <style>{`
        @keyframes drop-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 16px', height: 48,
        borderBottom: '1px solid var(--md-outline-var)',
        background: isDragging
          ? 'color-mix(in srgb, var(--md-primary) 5%, var(--md-surface-1))'
          : 'var(--md-surface-1)',
        overflowX: 'auto', flexShrink: 0,
        transition: 'background 0.3s',
      }}>
        {/* Drag hint */}
        {isDragging && (
          <span style={{
            fontSize: 11, color: 'var(--md-primary)', fontWeight: 500,
            marginRight: 6, whiteSpace: 'nowrap', animation: 'md-fade-in 0.2s ease',
          }}>
            Drop on a tab →
          </span>
        )}

        {displayWs.map(ws => (
          editId === ws.id ? (
            <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <input
                ref={editRef}
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(ws); if (e.key === 'Escape') setEditId(null); }}
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

        {/* New workspace */}
        {creating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <input
              ref={inputRef}
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
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
        )}
      </div>
    </>
  );
}
