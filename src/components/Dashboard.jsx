import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import WorkspaceBar from './WorkspaceBar';
import { generateId, saveWork, archiveWork, getWorkspaces } from '../storage';
import { awardFinishPoints } from '../points';

// ── Draggable work card ───────────────────────────────────────────
function DraggableCard({ work, onOpen, onFinish, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: work.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const activeCount = (work.todos || []).length;
  const doneCount = (work.history || []).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="work-card"
      data-stars={work.stars}
      onClick={() => onOpen(work)}
    >
      <div className="work-card-header">
        <div className="work-card-title">{work.title}</div>
        <div className="work-card-actions">
          <button
            className="btn-icon"
            style={{ color: 'var(--md-success)', width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onFinish(work); }}
            title="Mark as finished"
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(work); }}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            className="btn-icon"
            style={{ color: 'var(--md-error)', width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(work); }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <StarRating value={work.stars} onChange={() => {}} readonly />
      <div className="work-card-footer">
        <span className="work-progress">{activeCount} active · {doneCount} done</span>
        <ChevronRight size={14} style={{ color: 'var(--md-outline)' }} />
      </div>
    </div>
  );
}

// ── Drag overlay card (follows cursor) ───────────────────────────
function OverlayCard({ work }) {
  if (!work) return null;
  return (
    <div
      className="work-card"
      data-stars={work.stars}
      style={{
        width: 260, cursor: 'grabbing',
        boxShadow: 'var(--md-elev-4)',
        transform: 'rotate(2deg) scale(1.04)',
        opacity: 0.96,
        pointerEvents: 'none',
        border: '2px solid var(--md-primary)',
      }}
    >
      <div className="work-card-title" style={{ marginBottom: 8 }}>{work.title}</div>
      <StarRating value={work.stars} onChange={() => {}} readonly />
    </div>
  );
}

// ── Droppable workspace tab ───────────────────────────────────────
export function DroppableWsTab({ ws, isActive, onClick, onEdit, onDelete, editId, editName, setEditName, onRename, onCancelEdit, inputRef, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: ws.id });

  return (
    <div ref={setNodeRef} style={{ position: 'relative', flexShrink: 0 }}>
      {isOver && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 'var(--md-shape-full)',
          background: 'color-mix(in srgb, var(--md-primary) 20%, transparent)',
          border: '2px solid var(--md-primary)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'md-scale-in 0.15s ease',
        }} />
      )}
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard({ works, setWorks, uid, onOpenWork }) {
  const [showModal, setShowModal] = useState(false);
  const [editWork, setEditWork] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState('general');
  const [draggingWork, setDraggingWork] = useState(null); // work being dragged
  const [dropSuccess, setDropSuccess] = useState(null); // { workId, wsId }

  useEffect(() => { getWorkspaces(uid).then(setWorkspaces); }, [uid]);

  const allWs = [{ id: 'general', name: 'General' }, ...workspaces];
  const filtered = works
    .filter(w => (w.workspaceId || 'general') === activeWsId)
    .sort((a, b) => b.stars - a.stars);

  // dnd-kit sensors — require 8px move before drag starts (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart(event) {
    const work = works.find(w => w.id === event.active.id);
    setDraggingWork(work || null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setDraggingWork(null);
    if (!over) return;

    const workId = active.id;
    const targetWsId = over.id;
    const work = works.find(w => w.id === workId);
    if (!work) return;
    if ((work.workspaceId || 'general') === targetWsId) return; // same ws, no-op

    // Animate success flash
    setDropSuccess({ workId, wsId: targetWsId });
    setTimeout(() => setDropSuccess(null), 700);

    // Switch to target workspace so user sees the card land there
    setActiveWsId(targetWsId);

    const updated = { ...work, workspaceId: targetWsId };
    setWorks(works.map(w => w.id === workId ? updated : w));
    await saveWork(uid, updated);
  }

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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          isDragging={!!draggingWork}
          allWs={allWs}
          dropSuccess={dropSuccess}
        />

        <div className="dashboard fade-in">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-title">
                {allWs.find(w => w.id === activeWsId)?.name || 'General'}
              </div>
              <div className="dashboard-subtitle">
                {draggingWork
                  ? '↓ Drag to a workspace tab to move'
                  : filtered.length === 0
                    ? 'No work items here yet'
                    : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} · drag to move between workspaces`}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Work
            </button>
          </div>

          <div className="works-grid">
            {filtered.length === 0 && !draggingWork && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">Nothing here yet</div>
                <div className="empty-state-sub">Add a work item, or drag one here from another workspace</div>
              </div>
            )}

            {filtered.map((work) => (
              <DraggableCard
                key={work.id}
                work={work}
                isDragging={draggingWork?.id === work.id}
                onOpen={onOpenWork}
                onFinish={setFinishTarget}
                onEdit={setEditWork}
                onDelete={setDeleteTarget}
              />
            ))}

            <button className="add-work-btn" onClick={() => setShowModal(true)}>
              <Plus size={18} /> New Work Item
            </button>
          </div>
        </div>
      </div>

      {/* Drag overlay — the ghost card that follows cursor */}
      <DragOverlay dropAnimation={{
        duration: 220,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      }}>
        <OverlayCard work={draggingWork} />
      </DragOverlay>

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
          message={`"${deleteTarget.title}" will be removed. You can still see it in profile history.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </DndContext>
  );
}
