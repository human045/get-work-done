import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, CheckCircle2, FolderSymlink } from 'lucide-react';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import WorkspaceBar from './WorkspaceBar';
import { generateId, saveWork, archiveWork, getWorkspaces } from '../storage';
import { awardFinishPoints } from '../points';

export default function Dashboard({ works, setWorks, uid, onOpenWork }) {
  const [showModal, setShowModal] = useState(false);
  const [editWork, setEditWork] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState('general');

  useEffect(() => {
    getWorkspaces(uid).then(setWorkspaces);
  }, [uid]);

  const allWs = [{ id: 'general', name: 'General' }, ...workspaces];
  const filtered = works
    .filter(w => (w.workspaceId || 'general') === activeWsId)
    .sort((a, b) => b.stars - a.stars);

  async function handleAdd({ title, stars }) {
    const work = {
      id: generateId(), title, stars,
      todos: [], history: [], note: '',
      workspaceId: activeWsId,
      createdAt: Date.now(),
    };
    setWorks([...works, work]);
    await saveWork(uid, work);
    setShowModal(false);
  }

  async function handleEdit({ title, stars }) {
    const updated = { ...editWork, title, stars };
    setWorks(works.map(w => w.id === editWork.id ? updated : w));
    await saveWork(uid, updated);
    setEditWork(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setWorks(works.filter(w => w.id !== deleteTarget.id));
    await archiveWork(uid, { ...deleteTarget, finishedAt: null });
    setDeleteTarget(null);
  }

  async function handleFinish() {
    if (!finishTarget) return;
    setWorks(works.filter(w => w.id !== finishTarget.id));
    await archiveWork(uid, { ...finishTarget, finishedAt: Date.now() });
    if (uid) await awardFinishPoints(uid, finishTarget.stars);
    setFinishTarget(null);
  }

  async function handleMove(workId, wsId) {
    const updated = works.map(w => w.id === workId ? { ...w, workspaceId: wsId } : w);
    setWorks(updated);
    const work = updated.find(w => w.id === workId);
    await saveWork(uid, work);
    setMoveTarget(null);
  }

  const activeCount = w => (w.todos || []).length;
  const doneCount = w => (w.history || []).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorkspaceBar
        workspaces={workspaces}
        setWorkspaces={setWorkspaces}
        activeId={activeWsId}
        setActiveId={setActiveWsId}
        uid={uid}
        works={works}
        setWorks={setWorks}
        onSaveWork={w => saveWork(uid, w)}
      />

      <div className="dashboard fade-in">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">
              {allWs.find(w => w.id === activeWsId)?.name || 'General'}
            </div>
            <div className="dashboard-subtitle">
              {filtered.length === 0
                ? 'No work items here yet'
                : `${filtered.length} item${filtered.length !== 1 ? 's' : ''}, sorted by priority`}
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Work
          </button>
        </div>

        <div className="works-grid">
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Nothing here yet</div>
              <div className="empty-state-sub">Add your first work item to get started</div>
            </div>
          )}

          {filtered.map((work, i) => (
            <div
              key={work.id}
              className="work-card fade-in"
              data-stars={work.stars}
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => onOpenWork(work)}
            >
              <div className="work-card-header">
                <div className="work-card-title">{work.title}</div>
                <div className="work-card-actions">
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--md-success)', width: 32, height: 32 }}
                    onClick={e => { e.stopPropagation(); setFinishTarget(work); }}
                    title="Mark as finished"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ width: 32, height: 32 }}
                    onClick={e => { e.stopPropagation(); setMoveTarget(work); }}
                    title="Move to workspace"
                  >
                    <FolderSymlink size={13} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ width: 32, height: 32 }}
                    onClick={e => { e.stopPropagation(); setEditWork(work); }}
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--md-error)', width: 32, height: 32 }}
                    onClick={e => { e.stopPropagation(); setDeleteTarget(work); }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <StarRating value={work.stars} onChange={() => {}} readonly />

              <div className="work-card-footer">
                <span className="work-progress">
                  {activeCount(work)} active · {doneCount(work)} done
                </span>
                <ChevronRight size={14} style={{ color: 'var(--md-outline)' }} />
              </div>
            </div>
          ))}

          <button className="add-work-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Work Item
          </button>
        </div>
      </div>

      {showModal && <AddWorkModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      {editWork && <AddWorkModal existing={editWork} onAdd={handleEdit} onClose={() => setEditWork(null)} />}

      {/* Move to workspace modal */}
      {moveTarget && (
        <div className="modal-overlay" onClick={() => setMoveTarget(null)}>
          <div className="modal scale-in" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Move to Workspace</div>
            <div style={{ fontSize: 13, color: 'var(--md-outline)', marginBottom: 16 }}>
              "{moveTarget.title}"
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allWs.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => handleMove(moveTarget.id, ws.id)}
                  style={{
                    padding: '11px 14px', borderRadius: 'var(--md-shape-md)',
                    textAlign: 'left', fontSize: 14, fontFamily: 'var(--md-font)',
                    border: '1px solid',
                    borderColor: (moveTarget.workspaceId || 'general') === ws.id ? 'var(--md-primary)' : 'var(--md-outline-var)',
                    background: (moveTarget.workspaceId || 'general') === ws.id
                      ? 'color-mix(in srgb, var(--md-primary) 10%, transparent)'
                      : 'var(--md-surface-2)',
                    color: (moveTarget.workspaceId || 'general') === ws.id ? 'var(--md-primary)' : 'var(--md-on-surface)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  {ws.name}
                  {(moveTarget.workspaceId || 'general') === ws.id && (
                    <span style={{ fontSize: 12, color: 'var(--md-primary)' }}>current</span>
                  )}
                </button>
              ))}
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setMoveTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {finishTarget && (
        <ConfirmModal
          title="Mark as finished?"
          message={`"${finishTarget.title}" will be moved to your profile history as completed work.`}
          confirmLabel="Mark Finished ✓"
          onConfirm={handleFinish}
          onClose={() => setFinishTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete this work?"
          message={`"${deleteTarget.title}" will be removed. You can still see it in your profile history.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
