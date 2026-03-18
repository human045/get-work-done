import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, FolderOpen } from 'lucide-react';
import { saveWorkspace, deleteWorkspace, generateId } from '../storage';

const DEFAULT_WS = { id: 'general', name: 'General', isDefault: true };

export default function WorkspaceBar({ workspaces, setWorkspaces, activeId, setActiveId, uid, works, setWorks, onSaveWork }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [contextWsId, setContextWsId] = useState(null); // right-click / long-press menu
  const inputRef = useRef(null);
  const editRef = useRef(null);

  const allWs = [DEFAULT_WS, ...workspaces];

  useEffect(() => { if (creating && inputRef.current) inputRef.current.focus(); }, [creating]);
  useEffect(() => { if (editId && editRef.current) editRef.current.focus(); }, [editId]);

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
    const next = workspaces.map(w => w.id === ws.id ? updated : w);
    setWorkspaces(next);
    await saveWorkspace(uid, updated);
    setEditId(null);
  }

  async function handleDelete(ws) {
    // Move all works in this workspace to General
    const affected = works.filter(w => w.workspaceId === ws.id);
    const updatedWorks = works.map(w => w.workspaceId === ws.id ? { ...w, workspaceId: 'general' } : w);
    setWorks(updatedWorks);
    for (const w of affected) await onSaveWork({ ...w, workspaceId: 'general' });

    const next = workspaces.filter(w => w.id !== ws.id);
    setWorkspaces(next);
    await deleteWorkspace(uid, ws.id);
    if (activeId === ws.id) setActiveId('general');
    setContextWsId(null);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '0 20px', height: 44,
      borderBottom: '1px solid var(--md-outline-var)',
      background: 'var(--md-surface-1)',
      overflowX: 'auto', flexShrink: 0,
    }}>
      {/* Workspace tabs */}
      {allWs.map(ws => (
        <div key={ws.id} style={{ position: 'relative', flexShrink: 0 }}>
          {editId === ws.id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                ref={editRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(ws); if (e.key === 'Escape') setEditId(null); }}
                style={{
                  background: 'var(--md-surface-2)', border: '1px solid var(--md-primary)',
                  borderRadius: 'var(--md-shape-sm)', padding: '3px 8px',
                  color: 'var(--md-on-surface)', fontSize: 13, width: 100,
                  fontFamily: 'var(--md-font)', outline: 'none',
                }}
              />
              <button onClick={() => handleRename(ws)} className="btn-icon" style={{ width: 24, height: 24 }}>
                <Check size={12} />
              </button>
              <button onClick={() => setEditId(null)} className="btn-icon" style={{ width: 24, height: 24 }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveId(ws.id)}
              onContextMenu={e => { e.preventDefault(); if (!ws.isDefault) setContextWsId(ws.id === contextWsId ? null : ws.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 'var(--md-shape-full)',
                fontSize: 13, fontWeight: activeId === ws.id ? 600 : 400,
                fontFamily: 'var(--md-font)', cursor: 'pointer', border: 'none',
                background: activeId === ws.id
                  ? 'color-mix(in srgb, var(--md-primary) 16%, transparent)'
                  : 'transparent',
                color: activeId === ws.id ? 'var(--md-primary)' : 'var(--md-outline)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeId !== ws.id) e.currentTarget.style.background = 'color-mix(in srgb, var(--md-on-surface) 8%, transparent)'; }}
              onMouseLeave={e => { if (activeId !== ws.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {ws.isDefault && <FolderOpen size={13} />}
              {ws.name}
              {activeId === ws.id && !ws.isDefault && (
                <span style={{ display: 'flex', gap: 1, marginLeft: 2 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditName(ws.name); setEditId(ws.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-outline)', padding: 1, display: 'flex' }}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(ws); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-error)', padding: 1, display: 'flex' }}
                  >
                    <Trash2 size={10} />
                  </button>
                </span>
              )}
            </button>
          )}
        </div>
      ))}

      {/* New workspace */}
      {creating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <input
            ref={inputRef}
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
          <button onClick={handleCreate} className="btn-icon" style={{ width: 26, height: 26 }}>
            <Check size={13} />
          </button>
          <button onClick={() => { setCreating(false); setNewName(''); }} className="btn-icon" style={{ width: 26, height: 26 }}>
            <X size={13} />
          </button>
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
  );
}
