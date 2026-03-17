import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import { generateId, saveWork, deleteWork } from '../storage';

export default function Dashboard({ works, setWorks, uid, onOpenWork }) {
  const [showModal, setShowModal] = useState(false);
  const [editWork, setEditWork] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const sorted = [...works].sort((a, b) => b.stars - a.stars);

  async function handleAdd({ title, stars }) {
    const work = {
      id: generateId(),
      title,
      stars,
      todos: [],
      history: [],
      note: '',
      createdAt: Date.now(),
    };
    const next = [...works, work];
    setWorks(next);
    await saveWork(uid, work);
    setShowModal(false);
  }

  async function handleEdit({ title, stars }) {
    const updated = { ...editWork, title, stars };
    const next = works.map(w => w.id === editWork.id ? updated : w);
    setWorks(next);
    await saveWork(uid, updated);
    setEditWork(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const next = works.filter(w => w.id !== deleteTarget.id);
    setWorks(next);
    await deleteWork(uid, deleteTarget.id);
    setDeleteTarget(null);
  }

  const completedCount = w => (w.history || []).length;
  const activeCount = w => (w.todos || []).length;

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
                {activeCount(work)} active · {completedCount(work)} done
              </span>
              <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
            </div>
          </div>
        ))}

        <button className="add-work-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Work Item
        </button>
      </div>

      {showModal && (
        <AddWorkModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
      {editWork && (
        <AddWorkModal existing={editWork} onAdd={handleEdit} onClose={() => setEditWork(null)} />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete work item?"
          message={`"${deleteTarget.title}" and all its tasks and notes will be permanently deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
