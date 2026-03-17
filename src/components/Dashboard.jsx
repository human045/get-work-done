import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import { generateId, saveWork, archiveWork } from '../storage';

export default function Dashboard({ works, setWorks, uid, onOpenWork, onOpenProfile }) {
  const [showModal, setShowModal] = useState(false);
  const [editWork, setEditWork] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);

  const sorted = [...works].sort((a, b) => b.stars - a.stars);

  async function handleAdd({ title, stars }) {
    const work = {
      id: generateId(), title, stars,
      todos: [], history: [], note: '',
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
    // Hard delete — goes to archive too for history
    setWorks(works.filter(w => w.id !== deleteTarget.id));
    await archiveWork(uid, { ...deleteTarget, finishedAt: null });
    setDeleteTarget(null);
  }

  async function handleFinish() {
    if (!finishTarget) return;
    setWorks(works.filter(w => w.id !== finishTarget.id));
    await archiveWork(uid, { ...finishTarget, finishedAt: Date.now() });
    setFinishTarget(null);
  }

  const activeCount = w => (w.todos || []).length;
  const doneCount = w => (w.history || []).length;

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Your Work</div>
          <div className="dashboard-subtitle">
            {works.length === 0
              ? "Nothing added yet — let's start."
              : `${works.length} item${works.length !== 1 ? 's' : ''}, sorted by priority`}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
          <Plus size={15} /> Add Work
        </button>
      </div>

      <div className="works-grid">
        {sorted.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Nothing here yet</div>
            <div className="empty-state-sub">Add your first work item to get started</div>
          </div>
        )}

        {sorted.map((work, i) => (
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
                  style={{ color: 'var(--success)' }}
                  onClick={e => { e.stopPropagation(); setFinishTarget(work); }}
                  title="Mark as finished"
                >
                  <CheckCircle2 size={14} />
                </button>
                <button
                  className="btn-icon"
                  onClick={e => { e.stopPropagation(); setEditWork(work); }}
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="btn-icon"
                  style={{ color: 'var(--danger)' }}
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
              <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
            </div>
          </div>
        ))}

        <button className="add-work-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Work Item
        </button>
      </div>

      {showModal && <AddWorkModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      {editWork && <AddWorkModal existing={editWork} onAdd={handleEdit} onClose={() => setEditWork(null)} />}

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
