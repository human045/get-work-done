import { useState } from 'react';
import posthog from 'posthog-js';
import { Plus, Pencil, Trash2, ChevronRight, CheckCircle2, Calendar } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDraggable,
  pointerWithin, closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import StarRating from './StarRating';
import AddWorkModal from './AddWorkModal';
import ConfirmModal from './ConfirmModal';
import WorkspaceBar from './WorkspaceBar';
import { generateId, saveWork, archiveWork } from '../storage';
import { awardFinishPoints } from '../points';

const EASING = {
  emphasizedDecel: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  emphasized:      'cubic-bezier(0.2, 0, 0, 1)',
};

// Due date helpers
function getDueStatus(dueDate) {
  if (!dueDate) return null;
  const now  = Date.now();
  const due  = new Date(dueDate).getTime();
  const diff = due - now;
  if (diff < 0)         return 'overdue';
  if (diff < 86400000)  return 'today';
  if (diff < 172800000) return 'tomorrow';
  return 'upcoming';
}

function DueBadge({ dueDate }) {
  const status = getDueStatus(dueDate);
  if (!status) return null;
  const cfg = {
    overdue:  { label: 'Overdue',  bg: 'var(--md-error-cont)',                          color: 'var(--md-on-error-cont)' },
    today:    { label: 'Today',    bg: 'color-mix(in srgb, var(--md-star) 22%, var(--md-surface-2))',  color: 'var(--md-star)' },
    tomorrow: { label: 'Tomorrow', bg: 'color-mix(in srgb, var(--md-primary) 14%, var(--md-surface-2))', color: 'var(--md-primary)' },
    upcoming: { label: new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), bg: 'var(--md-surface-3)', color: 'var(--md-outline)' },
  }[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px',
      borderRadius: 'var(--md-shape-full)',
      background: cfg.bg, color: cfg.color,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      flexShrink: 0,
    }}>
      <Calendar size={9} /> {cfg.label}
    </span>
  );
}

// Drag ghost
function DragGhost({ work }) {
  if (!work) return null;
  return (
    <div style={{
      width: 260, background: 'var(--md-surface-2)',
      borderRadius: 'var(--md-shape-lg)', padding: '14px 16px',
      border: '2px solid var(--md-primary)',
      boxShadow: '0 8px 24px rgba(0,0,0,.35), 0 2px 8px rgba(0,0,0,.2)',
      transform: 'rotate(2.5deg) scale(1.05)', opacity: 0.95,
      cursor: 'grabbing', pointerEvents: 'none',
      animation: `ghost-lift 200ms ${EASING.emphasizedDecel} forwards`,
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{work.title}</div>
      <StarRating value={work.stars} onChange={() => {}} readonly />
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--md-primary)', fontWeight: 600 }}>
        ↑ Drop on workspace tab
      </div>
    </div>
  );
}

// Draggable card
function DraggableCard({ work, onOpen, onFinish, onEdit, onDelete, isDragging: thisIsDragging }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: work.id });
  const activeCount = (work.todos  || []).length;
  const doneCount   = (work.history || []).length;
  const dueStatus   = getDueStatus(work.dueDate);

  const cardStyle = {
    transform: isDragging ? 'scale(0.94) translateY(2px)' : CSS.Translate.toString(transform) || undefined,
    opacity:   isDragging ? 0.45 : 1,
    filter:    isDragging ? 'blur(0.5px)' : 'none',
    transition: isDragging
      ? `transform 200ms ${EASING.emphasized}, opacity 180ms ${EASING.emphasized}`
      : `transform 250ms ${EASING.emphasizedDecel}, opacity 200ms ${EASING.emphasizedDecel}`,
    cursor:      isDragging ? 'grabbing' : 'grab',
    willChange:  'transform, opacity',
    outline:     isDragging ? `2px dashed color-mix(in srgb, var(--md-primary) 50%, transparent)` : 'none',
    outlineOffset: 4,
    touchAction: 'none',
    userSelect:  'none',
    borderLeft:  dueStatus === 'overdue' ? '3px solid var(--md-error)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} {...listeners}
      className="work-card" data-stars={work.stars}
      onClick={() => !isDragging && onOpen(work)}
    >
      <div className="work-card-header">
        <div className="work-card-title">{work.title}</div>
        <div className="work-card-actions">
          <button className="btn-icon" style={{ color: 'var(--md-success)', width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onFinish(work); }} title="Mark finished">
            <CheckCircle2 size={14} />
          </button>
          <button className="btn-icon" style={{ width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(work); }} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="btn-icon" style={{ color: 'var(--md-error)', width: 32, height: 32 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(work); }} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <StarRating value={work.stars} onChange={() => {}} readonly />

      {/* Description */}
      {work.desc && (
        <div style={{ fontSize: 12, color: 'var(--md-outline)', marginTop: 7, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {work.desc}
        </div>
      )}

      <div className="work-card-footer" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="work-progress">{activeCount} active · {doneCount} done</span>
          {work.dueDate && <DueBadge dueDate={work.dueDate} />}
        </div>
        <ChevronRight size={14} style={{ color: 'var(--md-outline)', flexShrink: 0 }} />
      </div>
    </div>
  );
}

// Main Dashboard
export default function Dashboard({
  works, setWorks, uid, onOpenWork,
  workspaces, setWorkspaces, activeWsId, setActiveWsId,
  showAddWork, setShowAddWork,
}) {
  const [editWork, setEditWork]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);
  const [draggingWork, setDraggingWork] = useState(null);
  const [dropSuccess, setDropSuccess]   = useState(null);

  const allWs   = [{ id: 'general', name: 'General' }, ...(workspaces || [])];
  const filtered = works
    .filter(w => (w.workspaceId || 'general') === activeWsId)
    .sort((a, b) => {
      // Sort: overdue first, then by due date, then by stars
      const as = getDueStatus(a.dueDate);
      const bs = getDueStatus(b.dueDate);
      if (as === 'overdue' && bs !== 'overdue') return -1;
      if (bs === 'overdue' && as !== 'overdue') return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return b.stars - a.stars;
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 10 } }),
  );

  function collisionDetection(args) {
    const ptr = pointerWithin(args);
    return ptr.length > 0 ? ptr : closestCenter(args);
  }

  function handleDragStart({ active }) {
    setDraggingWork(works.find(w => w.id === active.id) || null);
  }

  async function handleDragEnd({ active, over }) {
    setDraggingWork(null);
    if (!over) return;
    const work = works.find(w => w.id === active.id);
    if (!work || (work.workspaceId || 'general') === over.id) return;
    setDropSuccess({ workId: active.id, wsId: over.id });
    setTimeout(() => setDropSuccess(null), 700);
    setActiveWsId(over.id);
    const updated = { ...work, workspaceId: over.id };
    setWorks(works.map(w => w.id === active.id ? updated : w));
    await saveWork(uid, updated);
  }

  async function handleAdd({ title, stars, dueDate, desc }) {
    const work = {
      id: generateId(), title, stars,
      dueDate: dueDate || null,
      desc: desc || '',
      todos: [], history: [], note: '',
      workspaceId: activeWsId,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setWorks([...works, work]);
    await saveWork(uid, work);
    posthog.capture('work_created', { priority: stars, has_due_date: !!dueDate });
    setShowAddWork(false);
  }

  async function handleEdit({ title, stars, dueDate, desc }) {
    const updated = { ...editWork, title, stars, dueDate: dueDate || null, desc: desc || '', updatedAt: Date.now() };
    setWorks(works.map(w => w.id === editWork.id ? updated : w));
    await saveWork(uid, updated);
    setEditWork(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setWorks(works.filter(w => w.id !== deleteTarget.id));
    await archiveWork(uid, { ...deleteTarget, finishedAt: null });
    posthog.capture('work_deleted', { priority: deleteTarget.stars });
    setDeleteTarget(null);
  }

  async function handleFinish() {
    if (!finishTarget) return;
    setWorks(works.filter(w => w.id !== finishTarget.id));
    await archiveWork(uid, { ...finishTarget, finishedAt: Date.now() });
    if (uid) await awardFinishPoints(uid, finishTarget.stars, finishTarget.title, finishTarget.id);
    posthog.capture('work_finished', { priority: finishTarget.stars, tasks_completed: (finishTarget.history || []).length });
    setFinishTarget(null);
  }

  return (
    <>
      <style>{`
        @keyframes ghost-lift {
          from { transform: rotate(0deg) scale(1); opacity: 0.7; }
          to   { transform: rotate(2.5deg) scale(1.05); opacity: 0.95; }
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={collisionDetection}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <WorkspaceBar
            workspaces={workspaces || []}
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
                    ? '↑ Drag to a workspace tab to move'
                    : filtered.length === 0
                      ? 'No work items here yet'
                      : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} · overdue shown first`}
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: 'auto' }}
                onClick={() => setShowAddWork(true)}>
                <Plus size={16} /> Add Work
              </button>
            </div>

            <div className="works-grid">
              {filtered.length === 0 && !draggingWork && (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">Nothing here yet</div>
                  <div className="empty-state-sub">Add a work item to get started</div>
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

              <button className="add-work-btn" onClick={() => setShowAddWork(true)}>
                <Plus size={18} /> New Work Item
              </button>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 220, easing: EASING.emphasizedDecel }}>
          <DragGhost work={draggingWork} />
        </DragOverlay>

        {showAddWork && <AddWorkModal onAdd={handleAdd} onClose={() => setShowAddWork(false)} />}
        {editWork    && <AddWorkModal existing={editWork} onAdd={handleEdit} onClose={() => setEditWork(null)} />}

        {finishTarget && (
          <ConfirmModal title="Mark as finished?" confirmLabel="Mark Finished ✓"
            message={`"${finishTarget.title}" will be moved to your profile history.`}
            onConfirm={handleFinish} onClose={() => setFinishTarget(null)} />
        )}
        {deleteTarget && (
          <ConfirmModal title="Delete this work?" confirmLabel="Delete" danger
            message={`"${deleteTarget.title}" will be removed. Visible in profile history.`}
            onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
        )}
      </DndContext>
    </>
  );
}
