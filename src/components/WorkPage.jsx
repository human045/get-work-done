import { useState, useRef, useCallback } from 'react';
import { Check, Plus, Trash2, Eye, Pencil } from 'lucide-react';
import { marked } from 'marked';
import StarRating from './StarRating';
import { saveWork, generateId } from '../storage';
import { awardTaskPoints } from '../points';

// Configure marked for safe, clean output
marked.setOptions({ breaks: true, gfm: true });

const MAX_TODOS = 3;

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function PointsToast({ pts, visible }) {
  return (
    <span style={{
      position: 'fixed', bottom: 80, right: 28,
      background: 'var(--md-primary)', color: 'var(--md-on-primary)',
      fontWeight: 700, fontSize: 14, padding: '8px 16px',
      borderRadius: 'var(--md-shape-full)',
      boxShadow: 'var(--md-elev-3)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
      transition: 'all 0.28s cubic-bezier(0.2,0,0,1)',
      pointerEvents: 'none', zIndex: 999,
      fontFamily: 'var(--md-mono)',
    }}>
      +{pts} pts ✓
    </span>
  );
}

export default function WorkPage({ work: initialWork, uid, onBack, onWorkUpdate }) {
  const [work, setWork] = useState(initialWork);
  const [todoInput, setTodoInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ visible: false, pts: 0 });
  const [noteMode, setNoteMode] = useState('edit'); // 'edit' | 'preview'
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);

  const activeTodos = work.todos || [];
  const history = work.history || [];

  function showToast(pts) {
    setToast({ visible: true, pts });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 1800);
  }

  const persist = useCallback(async (updated) => {
    setWork(updated);
    onWorkUpdate(updated);
    await saveWork(uid, updated);
    setSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2000);
  }, [uid, onWorkUpdate]);

  function handleNote(e) {
    const note = e.target.value;
    clearTimeout(saveTimer.current);
    setWork(w => ({ ...w, note }));
    saveTimer.current = setTimeout(() => persist({ ...work, note }), 800);
  }

  function addTodo() {
    if (!todoInput.trim() || activeTodos.length >= MAX_TODOS) return;
    const todo = { id: generateId(), text: todoInput.trim(), done: false, createdAt: Date.now() };
    persist({ ...work, todos: [...activeTodos, todo] });
    setTodoInput('');
  }

  async function toggleTodo(id) {
    const todo = activeTodos.find(t => t.id === id);
    if (!todo || todo.done) return;
    const newTodos = activeTodos.filter(t => t.id !== id);
    const newHistory = [{ ...todo, done: true, completedAt: Date.now() }, ...history];
    await persist({ ...work, todos: newTodos, history: newHistory });
    if (uid) { await awardTaskPoints(uid); showToast(10); }
  }

  function deleteTodo(id) {
    persist({ ...work, todos: activeTodos.filter(t => t.id !== id) });
  }

  function clearHistory() { persist({ ...work, history: [] }); }
  function handleStars(stars) { persist({ ...work, stars }); }

  // Markdown preview HTML
  const previewHtml = marked.parse(work.note || '*No notes yet. Switch to edit mode to write.*');

  return (
    <div className="work-page fade-in">
      <div className="work-page-header">
        <div className="work-page-title">{work.title}</div>
        <StarRating value={work.stars} onChange={handleStars} />
      </div>

      <div className="work-page-body">
        {/* ── Left: Tasks ── */}
        <div className="tasks-panel">
          <div className="panel-section">
            <div className="panel-section-title">
              <span>Tasks</span>
              <span className="todo-limit">{activeTodos.length}/{MAX_TODOS}</span>
            </div>

            {activeTodos.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--md-outline)', marginBottom: 10 }}>
                No tasks yet. Add up to 3 focused tasks.
              </div>
            )}

            {activeTodos.map(todo => (
              <div key={todo.id} className="todo-item slide-in">
                <button
                  className="todo-check"
                  onClick={() => toggleTodo(todo.id)}
                  title="Complete (+10 pts)"
                />
                <span className="todo-text">{todo.text}</span>
                <button className="btn-icon" style={{ padding: 3, width: 28, height: 28 }} onClick={() => deleteTodo(todo.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {activeTodos.length < MAX_TODOS && (
              <div className="todo-add-row">
                <input
                  className="todo-add-input"
                  placeholder="Add a task..."
                  value={todoInput}
                  onChange={e => setTodoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodo()}
                  maxLength={120}
                />
                <button
                  className="btn-icon"
                  style={{
                    background: 'var(--md-primary)', color: 'var(--md-on-primary)',
                    width: 36, height: 36, borderRadius: 'var(--md-shape-sm)',
                  }}
                  onClick={addTodo}
                  disabled={!todoInput.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            {activeTodos.length >= MAX_TODOS && (
              <div style={{ fontSize: 12, color: 'var(--md-outline)', marginTop: 8 }}>
                ✓ Max 3 tasks. Complete one to add more.
              </div>
            )}
          </div>

          {/* Completed history */}
          <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="panel-section-title" style={{ marginBottom: 0 }}>Completed</span>
            {history.length > 0 && (
              <button className="btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={clearHistory}>Clear</button>
            )}
          </div>

          <div className="history-section">
            {history.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--md-outline)' }}>Completed tasks appear here.</div>
            )}
            {history.map(item => (
              <div key={item.id + item.completedAt} className="history-item">
                <Check size={12} className="history-icon" />
                <span className="history-text">{item.text}</span>
                <span className="history-time">{item.completedAt ? formatTime(item.completedAt) : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Notepad ── */}
        <div className="notepad-panel">
          <div className="notepad-header">
            <span>Notes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saved && (
                <span className="notepad-saved">
                  <Check size={11} /> Saved
                </span>
              )}
              {/* Edit / Preview toggle */}
              <div style={{
                display: 'flex', gap: 2,
                background: 'var(--md-surface-2)',
                border: '1px solid var(--md-outline-var)',
                borderRadius: 'var(--md-shape-full)',
                padding: 2,
              }}>
                {[
                  { mode: 'edit', icon: <Pencil size={12} />, label: 'Edit' },
                  { mode: 'preview', icon: <Eye size={12} />, label: 'Preview' },
                ].map(btn => (
                  <button
                    key={btn.mode}
                    onClick={() => setNoteMode(btn.mode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 'var(--md-shape-full)',
                      fontSize: 11, fontWeight: 500, border: 'none',
                      fontFamily: 'var(--md-font)', cursor: 'pointer',
                      background: noteMode === btn.mode ? 'var(--md-primary)' : 'transparent',
                      color: noteMode === btn.mode ? 'var(--md-on-primary)' : 'var(--md-outline)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {noteMode === 'edit' ? (
            <textarea
              className="notepad-textarea"
              placeholder={`Write notes in **Markdown**...\n\n# Heading\n**bold**, *italic*, \`code\`\n- list item\n> blockquote`}
              value={work.note || ''}
              onChange={handleNote}
            />
          ) : (
            <div
              className="md-preview"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      </div>

      <PointsToast pts={toast.pts} visible={toast.visible} />
    </div>
  );
}
