import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDraggable, pointerWithin,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import WorkspaceBar from './WorkspaceBar';
import { generateId, saveWork, archiveWork, getWorkspaces } from '../storage';
import { awardFinishPoints } from '../points';

// MD3 motion
const EASING = {
  emphasizedDecel: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  emphasized:      'cubic-bezier(0.2, 0, 0, 1)',
};

// ── Drag overlay — the floating ghost card ────────────────────────
function DragGhost({ work }) {
  if (!work) return null;
  return (
    <div style={{
      width: 260,
      background: 'var(--md-surface-2)',
      borderRadius: 'var(--md-shape-lg)',
      padding: '14px 16px',
      border: '2px solid var(--md-primary)',
      boxShadow: `
        0 8px 24px rgba(0,0,0,0.35),
        0 2px 8px rgba(0,0,0,0.2),
        0 0 0 1px color-mix(in srgb, var(--md-primary) 40%, transparent)
      `,
      transform: 'rotate(2.5deg) scale(1.05)',
      opacity: 0.95,
      cursor: 'grabbing',
      pointerEvents: 'none',
      // Entrance animation for the ghost
      animation: `ghost-lift 200ms ${EASING.emphasizedDecel} forwards`,
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: 'var(--md-on-surface)' }}>
        {work.title}
      </div>
      <StarRating value={work.stars} onChange={() => {}} readonly />
      <div style={{
        marginTop: 10, fontSize: 11, color: 'var(--md-primary)',
        fontWeight: 600, letterSpacing: '0.3px',
      }}>
        ↑ Drop on a workspace tab
      </div>
    </div>
  );
}

// ── Draggable card ────────────────────────────────────────────────
function DraggableCard({ work, onOpen, onFinish, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, isDragging: thisDragging } = useDraggable({ id: work.id });

  const activeCount = (work.todos || []).length;
  const doneCount   = (work.history || []).length;

  // MD3: card shrinks and fades on pickup — emphasized accelerate out
  const cardStyle = {
    transform: thisDragging
      ? 'scale(0.94) translateY(2px)'
      : CSS.Translate.toString(transform) || undefined,
    opacity: thisDragging ? 0.45 : 1,
    filter: thisDragging ? 'blur(0.5px)' : 'none',
    transition: thisDragging
      ? `transform 200ms ${EASING.emphasized}, opacity 180ms ${EASING.emphasized}, filter 180ms ${EASING.emphasized}`
      : `transform 250ms ${EASING.emphasizedDecel}, opacity 200ms ${EASING.emphasizedDecel}, filter 200ms ${EASING.emphasizedDecel}`,
    cursor: thisDragging ? 'grabbing' : 'grab',
    willChange: 'transform, opacity',
    outline: thisDragging ? `2px dashed color-mix(in srgb, var(--md-primary) 50%, transparent)` : 'none',
    outlineOffset: 4,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      {...listeners}
      className="work-card"
      data-stars={work.stars}
      onClick={() => !thisDragging && onOpen(work)}
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

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard({ works, setWorks, uid, onOpenWork }) {
  const [showModal, setShowModal]       = useState(false);
  const [editWork, setEditWork]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);
  const [workspaces, setWorkspaces]     = useState([]);
  const [activeWsId, setActiveWsId]     = useState('general');
  const [draggingWork, setDraggingWork] = useState(null);
  const [dropSuccess, setDropSuccess]   = useState(null);

  useEffect(() => { getWorkspaces(uid).then(setWorkspaces); }, [uid]);

  const allWs = [{ id: 'general', name: 'General' }, ...workspaces];
  const filtered = works
    .filter(w => (w.workspaceId || 'general') === activeWsId)
    .sort((a, b) => b.stars - a.stars);

  // Require 8px movement — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart({ active }) {
    const work = works.find(w => w.id === active.id);
    setDraggingWork(work || null);
  }

  async function handleDragEnd({ active, over }) {
    setDraggingWork(null);
    if (!over) return;

    const work = works.find(w => w.id === active.id);
    if (!work) return;
    const targetWsId = over.id;
    if ((work.workspaceId || 'general') === targetWsId) return;

    // Flash success on the target tab
    setDropSuccess({ workId: active.id, wsId: targetWsId });
    setTimeout(() => setDropSuccess(null), 700);

    // Switch view to target workspace
    setActiveWsId(targetWsId);

    const updated = { ...work, workspaceId: targetWsId };
    setWorks(works.map(w => w.id === active.id ? updated : w));
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
    <>
      <style>{`
        @keyframes ghost-lift {
          from { transform: rotate(0deg) scale(1);    opacity: 0.7; }
          to   { transform: rotate(2.5deg) scale(1.05); opacity: 0.95; }
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
            dropSuccess={dropSuccess}
          />

          <div className="dashboard fade-in">
            <div className="dashboard-header">
              <div>
                <div className="dashboard-title">
                  {allWs.find(w => w.id === activeWsId)?.name || 'General'}
                </div>
                <div className="dashboard-subtitle" style={{
                  color: draggingWork ? 'var(--md-primary)' : undefined,
                  transition: `color 200ms ${EASING.emphasized}`,
                }}>
                  {draggingWork
                    ? '↑ Drag up to the workspace bar to move'
                    : filtered.length === 0
                      ? 'No work items here yet'
                      : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} · drag cards to workspace tabs to move`}
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

              {filtered.map(work => (
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

        {/* Ghost card that follows the pointer */}
        <DragOverlay
          dropAnimation={{
            duration: 280,
            easing: EASING.emphasizedDecel,
          }}
        >
          <DragGhost work={draggingWork} />
        </DragOverlay>

        {showModal && <AddWorkModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
        {editWork  && <AddWorkModal existing={editWork} onAdd={handleEdit} onClose={() => setEditWork(null)} />}

        {finishTarget && (
          <ConfirmModal
            title="Mark as finished?"
            message={`"${finishTarget.title}" will be moved to your profile history.`}
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
    </>
  );
}
