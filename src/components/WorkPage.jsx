import { useState, useRef, useCallback } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import StarRating from './StarRating';
import { saveWork, generateId } from '../storage';
import { awardTaskPoints } from '../points';

const MAX_TODOS = 3;

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Floating +pts toast
function PointsToast({ pts, visible }) {
  return (
    <span style={{
      position: 'fixed',
      bottom: 80,
      right: 28,
      background: 'var(--success)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 14,
      padding: '6px 14px',
      borderRadius: 20,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
      transition: 'all 0.25s ease',
      pointerEvents: 'none',
      zIndex: 999,
      fontFamily: 'var(--mono)',
    }}>
      +{pts} pts
    </span>
  );
}

export default function WorkPage({ work: initialWork, uid, onBack, onWorkUpdate }) {
  const [work, setWork] = useState(initialWork);
  const [todoInput, setTodoInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ visible: false, pts: 0 });
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);

  const activeTodos = work.todos || [];
  const history = work.history || [];

  function showToast(pts) {
    setToast({ visible: true, pts });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ visible: false, pts }), 1800);
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
    // Award points
    if (uid) {
      await awardTaskPoints(uid);
      showToast(10);
    }
  }

  function deleteTodo(id) {
    persist({ ...work, todos: activeTodos.filter(t => t.id !== id) });
  }

  function clearHistory() {
    persist({ ...work, history: [] });
  }

  function handleStars(stars) {
    persist({ ...work, stars });
  }

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
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                No tasks yet. Add up to 3 focused tasks.
              </div>
            )}

            {activeTodos.map(todo => (
              <div key={todo.id} className="todo-item slide-in">
                <button
                  className="todo-check"
                  onClick={() => toggleTodo(todo.id)}
                  title="Mark complete (+10 pts)"
                >
                  <Check size={10} color="transparent" />
                </button>
                <span className="todo-text">{todo.text}</span>
                <button className="btn-icon" style={{ padding: 3 }} onClick={() => deleteTodo(todo.id)}>
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
                  style={{ background: 'var(--accent)', color: '#fff', padding: '7px', borderRadius: 'var(--radius)' }}
                  onClick={addTodo}
                  disabled={!todoInput.trim()}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {activeTodos.length >= MAX_TODOS && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                ✓ Max 3 tasks. Complete one to add more.
              </div>
            )}
          </div>

          {/* Completed history */}
          <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Completed
            </span>
            {history.length > 0 && (
              <button className="btn-danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={clearHistory}>Clear</button>
            )}
          </div>

          <div className="history-section">
            {history.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Completed tasks will appear here.</div>
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
            {saved && (
              <span className="notepad-saved">
                <Check size={11} /> Saved
              </span>
            )}
          </div>
          <textarea
            className="notepad-textarea"
            placeholder="Write anything about this work — ideas, context, progress, blockers..."
            value={work.note || ''}
            onChange={handleNote}
          />
        </div>
      </div>

      <PointsToast pts={toast.pts} visible={toast.visible} />
    </div>
  );
}
