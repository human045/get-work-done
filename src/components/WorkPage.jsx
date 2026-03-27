import { useState, useRef, useCallback, useEffect } from 'react';
import posthog from 'posthog-js';
import { Check, Maximize2, Minimize2, NotebookPen, Plus, Trash2 } from 'lucide-react';
import StarRating from './StarRating';
import { saveWork, generateId } from '../storage';
import { awardTaskPoints } from '../points';

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

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInlineHtml(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function noteToHtml(note) {
  if (!note?.trim()) return '';

  const lines = note.split('\n');
  const html = [];
  const stack = [];

  const closeToDepth = (targetDepth) => {
    while (stack.length > targetDepth) {
      html.push(`</${stack.pop()}>`);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);

    if (!match) {
      closeToDepth(0);
      if (line.trim()) {
        html.push(`<p>${renderInlineHtml(line)}</p>`);
      } else {
        html.push('<p><br></p>');
      }
      continue;
    }

    const depth = Math.floor(match[1].length / 2);
    const nextTag = /\d+\./.test(match[2]) ? 'ol' : 'ul';
    closeToDepth(depth);

    while (stack.length < depth + 1) {
      stack.push(nextTag);
      html.push(`<${nextTag}>`);
    }

    if (stack[stack.length - 1] !== nextTag) {
      html.push(`</${stack.pop()}>`);
      stack.push(nextTag);
      html.push(`<${nextTag}>`);
    }

    html.push(`<li>${renderInlineHtml(match[3] || '')}</li>`);
  }

  closeToDepth(0);
  return html.join('');
}

function sanitizeNoteHtml(rawHtml) {
  if (typeof document === 'undefined') return rawHtml;
  const root = document.createElement('div');
  root.innerHTML = rawHtml;
  const allowed = new Set(['P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'B']);

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.remove();
      return;
    }

    const tagName = node.tagName.toUpperCase();
    if (tagName === 'DIV') {
      const replacement = document.createElement('p');
      while (node.firstChild) replacement.appendChild(node.firstChild);
      node.replaceWith(replacement);
      walk(replacement);
      return;
    }

    if (!allowed.has(tagName)) {
      const fragment = document.createDocumentFragment();
      while (node.firstChild) fragment.appendChild(node.firstChild);
      node.replaceWith(fragment);
      return;
    }

    Array.from(node.attributes).forEach(attr => node.removeAttribute(attr.name));
    Array.from(node.childNodes).forEach(walk);
  };

  Array.from(root.childNodes).forEach(walk);
  return root.innerHTML;
}

function htmlToPlainText(html) {
  if (typeof document === 'undefined') return '';
  const root = document.createElement('div');
  root.innerHTML = html;
  return root.innerText.replace(/\n{3,}/g, '\n\n').trimEnd();
}

function getClosestBlock(editor) {
  const selection = window.getSelection();
  let node = selection?.anchorNode;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && ['P', 'DIV', 'LI'].includes(node.tagName)) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

function isInsideList(editor) {
  const selection = window.getSelection();
  let node = selection?.anchorNode;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') return true;
    node = node.parentNode;
  }
  return false;
}

export default function WorkPage({ work: initialWork, uid, myPoints, onBack, onWorkUpdate }) {
  const [work, setWork] = useState(initialWork);
  const [todoInput, setTodoInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ visible: false, pts: 0 });
  const [noteFocus, setNoteFocus] = useState(false);
  const [boldActive, setBoldActive] = useState(false);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const noteRef = useRef(null);
  const pageRef = useRef(null);

  const activeTodos = work.todos || [];
  const history = work.history || [];
  const noteValue = work.note || '';
  const noteHtmlValue = work.noteHtml || noteToHtml(noteValue);
  const trimmedNote = noteValue.trim();
  const wordCount = trimmedNote ? trimmedNote.split(/\s+/).length : 0;
  const charCount = noteValue.length;
  const lineCount = noteValue ? noteValue.split('\n').length : 1;

  const hasUpgrade = myPoints?.purchasedItems?.includes('todoUpgrade5');
  const MAX_TODOS = hasUpgrade ? 8 : 3;

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

  useEffect(() => {
    setWork(initialWork);
    setSaved(false);
    setBoldActive(false);
    setNoteFocus(false);
  }, [initialWork]);

  useEffect(() => {
    if (!noteRef.current) return;
    if (noteRef.current.innerHTML !== noteHtmlValue) {
      noteRef.current.innerHTML = noteHtmlValue;
    }
  }, [noteHtmlValue]);

  useEffect(() => {
    function syncBoldState() {
      if (!noteRef.current) return;
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const insideEditor = anchorNode && noteRef.current.contains(anchorNode);
      setBoldActive(insideEditor ? document.queryCommandState('bold') : false);
    }

    document.addEventListener('selectionchange', syncBoldState);
    return () => document.removeEventListener('selectionchange', syncBoldState);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement && noteFocus) {
        setNoteFocus(false);
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [noteFocus]);

  function persistEditorState(nextHtml) {
    const sanitizedHtml = sanitizeNoteHtml(nextHtml);
    const note = htmlToPlainText(sanitizedHtml);
    clearTimeout(saveTimer.current);
    setSaved(false);
    setWork(prev => ({ ...prev, note, noteHtml: sanitizedHtml }));
    saveTimer.current = setTimeout(() => persist({ ...work, note, noteHtml: sanitizedHtml }), 800);
  }

  function handleNoteInput(e) {
    persistEditorState(e.currentTarget.innerHTML);
  }

  function toggleBold() {
    if (!noteRef.current) return;
    noteRef.current.focus();
    document.execCommand('bold');
    persistEditorState(noteRef.current.innerHTML);
    setBoldActive(document.queryCommandState('bold'));
  }

  function handleNoteKeyDown(e) {
    if (!noteRef.current) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleBold();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (isInsideList(noteRef.current)) {
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        persistEditorState(noteRef.current.innerHTML);
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      const block = getClosestBlock(noteRef.current);
      const text = block?.textContent?.trim() || '';
      if (text === '-' || text === '*') {
        e.preventDefault();
        block.textContent = '';
        document.execCommand('insertUnorderedList');
        persistEditorState(noteRef.current.innerHTML);
        return;
      }
      if (/^\d+\.$/.test(text)) {
        e.preventDefault();
        block.textContent = '';
        document.execCommand('insertOrderedList');
        persistEditorState(noteRef.current.innerHTML);
      }
    }
  }

  function handleNotePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    persistEditorState(noteRef.current?.innerHTML || '');
  }

  async function toggleFocusMode() {
    const nextFocus = !noteFocus;
    setNoteFocus(nextFocus);

    try {
      if (nextFocus) {
        if (window.innerWidth > 768 && pageRef.current && document.fullscreenElement !== pageRef.current) {
          await pageRef.current.requestFullscreen();
        }
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by browser policy; keep the layout focus mode either way.
    }

    requestAnimationFrame(() => noteRef.current?.focus());
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
    posthog.capture('task_completed');
  }

  function deleteTodo(id) {
    persist({ ...work, todos: activeTodos.filter(t => t.id !== id) });
  }

  function clearHistory() { persist({ ...work, history: [] }); }
  function handleStars(stars) { persist({ ...work, stars }); }

  return (
    <div ref={pageRef} className={`work-page fade-in ${noteFocus ? 'work-page-fullscreen' : ''}`}>
      <div className="work-page-header">
        <div className="work-page-title">{work.title}</div>
        <StarRating value={work.stars} onChange={handleStars} />
      </div>

      <div className={`work-page-body ${noteFocus ? 'work-page-body-focus' : ''}`}>
        <div className={`tasks-panel ${noteFocus ? 'tasks-panel-focus' : ''}`}>
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

        <div className={`notepad-panel ${noteFocus ? 'notepad-panel-focus' : ''}`}>
          <div className="notepad-header">
            <div className="notepad-heading">
              <span className="notepad-kicker">Work notes</span>
              <div className="notepad-title-row">
                <span className="notepad-title">Notes</span>
                {saved && (
                  <span className="notepad-saved">
                    <Check size={11} /> Saved
                  </span>
                )}
              </div>
            </div>
            <button
              className="notepad-focus-btn"
              type="button"
              onClick={toggleFocusMode}
              title={noteFocus ? 'Exit focus mode' : 'Enter focus mode'}
            >
              {noteFocus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{noteFocus ? 'Normal' : 'Focus'}</span>
            </button>
          </div>

          <div className="notepad-toolbar">
            <div className="notepad-tools">
              <button
                className={`notepad-tool-btn ${boldActive ? 'notepad-tool-btn-active' : ''}`}
                type="button"
                onClick={toggleBold}
                title="Bold (Ctrl/Cmd+B)"
              >
                <strong>B</strong>
                <span>Bold</span>
              </button>
            </div>
            <div className="notepad-stats">
              <span className="notepad-chip">{wordCount} words</span>
              <span className="notepad-chip">{charCount} chars</span>
              <span className="notepad-chip">{lineCount} lines</span>
            </div>
            <div className="notepad-toolbar-hint">
              <NotebookPen size={13} />
              <span>Autosaves inside this work</span>
            </div>
          </div>

          <div className="notepad-sheet-wrap">
            <div className="notepad-sheet-top">
              <span className="notepad-sheet-label">{work.title}</span>
              <span className="notepad-sheet-date">{formatTime(Date.now())}</span>
            </div>
            <div className="notepad-sheet">
              <div className="notepad-margin" aria-hidden="true" />
              <div
                ref={noteRef}
                className={`notepad-editor ${noteValue ? '' : 'notepad-editor-empty'}`}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Write ideas, blockers, next steps, links, or rough plans here..."
                onInput={handleNoteInput}
                onKeyDown={handleNoteKeyDown}
                onPaste={handleNotePaste}
                onFocus={() => setBoldActive(document.queryCommandState('bold'))}
                onKeyUp={() => setBoldActive(document.queryCommandState('bold'))}
                onMouseUp={() => setBoldActive(document.queryCommandState('bold'))}
                onBlur={() => setBoldActive(false)}
                spellCheck="true"
              />
            </div>
          </div>
        </div>
      </div>

      <PointsToast pts={toast.pts} visible={toast.visible} />
    </div>
  );
}
