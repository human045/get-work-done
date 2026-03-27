import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  FilePlus2,
  FileText,
  NotebookPen,
  Plus,
  Trash2,
  Sparkles,
  Settings,
  Trophy,
  LogOut,
  User,
} from 'lucide-react';
import {
  deleteNotebook,
  deleteNotebookPage,
  generateId,
  getNotebookPages,
  getNotebooks,
  saveNotebook,
  saveNotebookPage,
} from '../storage';

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
    while (stack.length > targetDepth) html.push(`</${stack.pop()}>`);
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);

    if (!match) {
      closeToDepth(0);
      html.push(line.trim() ? `<p>${renderInlineHtml(line)}</p>` : '<p><br></p>');
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
    if (node.nodeType === Node.ELEMENT_NODE && ['P', 'DIV', 'LI'].includes(node.tagName)) return node;
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

function formatUpdated(ts) {
  if (!ts) return 'Just now';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function buildTree(pages, parentId = null) {
  return pages
    .filter(page => (page.parentId || null) === parentId)
    .sort((a, b) => (a.order ?? a.createdAt ?? 0) - (b.order ?? b.createdAt ?? 0))
    .map(page => ({ ...page, children: buildTree(pages, page.id) }));
}

function PageNode({ node, depth, activePageId, expanded, setExpanded, onSelect }) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded[node.id] ?? true;
  return (
    <>
      <button
        className={`notebook-page-node ${activePageId === node.id ? 'active' : ''}`}
        style={{ paddingLeft: 14 + depth * 18 }}
        onClick={() => onSelect(node.id)}
      >
        <span
          className="notebook-page-caret"
          onClick={e => {
            e.stopPropagation();
            if (hasChildren) setExpanded(prev => ({ ...prev, [node.id]: !isOpen }));
          }}
        >
          {hasChildren ? (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : <span style={{ width: 13 }} />}
        </span>
        <FileText size={13} />
        <span className="notebook-page-label">{node.title || 'Untitled page'}</span>
      </button>
      {hasChildren && isOpen && node.children.map(child => (
        <PageNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activePageId={activePageId}
          expanded={expanded}
          setExpanded={setExpanded}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function NotebooksPage({
  uid,
  user,
  isGuest,
  myPoints,
  socialsEnabled,
  onExit,
  onOpenProfile,
  onOpenSettings,
  onOpenLeaderboard,
  onSignOut,
}) {
  const [notebooks, setNotebooks] = useState([]);
  const [pages, setPages] = useState([]);
  const [activeNotebookId, setActiveNotebookId] = useState(null);
  const [activePageId, setActivePageId] = useState(null);
  const [boldActive, setBoldActive] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [indexCollapsed, setIndexCollapsed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const userRef = useRef(null);

  const activeNotebook = notebooks.find(notebook => notebook.id === activeNotebookId) || null;
  const activePage = pages.find(page => page.id === activePageId) || null;
  const pageTree = useMemo(() => buildTree(pages), [pages]);
  const wordCount = activePage?.content?.trim() ? activePage.content.trim().split(/\s+/).length : 0;
  const charCount = activePage?.content?.length || 0;
  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email ? user.email[0].toUpperCase() : 'U')
    : 'G';
  const avatarUrl = myPoints?.photoURL || user?.photoURL || null;

  const loadNotebooks = useCallback(async () => {
    const loaded = await getNotebooks(uid);
    const sorted = [...loaded].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    setNotebooks(sorted);
    setActiveNotebookId(current => current && sorted.find(item => item.id === current)?.id ? current : (sorted[0]?.id || null));
  }, [uid]);

  const loadPages = useCallback(async (notebookId) => {
    if (!notebookId) {
      setPages([]);
      setActivePageId(null);
      return;
    }
    const loaded = await getNotebookPages(uid, notebookId);
    const sorted = [...loaded].sort((a, b) => (a.order ?? a.createdAt ?? 0) - (b.order ?? b.createdAt ?? 0));
    setPages(sorted);
    setActivePageId(current => current && sorted.find(item => item.id === current)?.id ? current : (sorted[0]?.id || null));
  }, [uid]);

  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  useEffect(() => {
    loadPages(activeNotebookId);
  }, [activeNotebookId, loadPages]);

  useEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = activePage?.contentHtml || noteToHtml(activePage?.content || '');
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [activePage?.id, activePage?.contentHtml, activePage?.content]);

  useEffect(() => {
    function syncBoldState() {
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const insideEditor = editorRef.current && anchorNode && editorRef.current.contains(anchorNode);
      setBoldActive(Boolean(insideEditor) && document.queryCommandState('bold'));
    }
    document.addEventListener('selectionchange', syncBoldState);
    return () => document.removeEventListener('selectionchange', syncBoldState);
  }, []);

  useEffect(() => {
    function closeMenus(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  async function createNotebook() {
    const notebook = {
      id: generateId(),
      name: `Notebook ${notebooks.length + 1}`,
      icon: '📘',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const page = {
      id: generateId(),
      notebookId: notebook.id,
      parentId: null,
      title: 'Welcome',
      content: '',
      contentHtml: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
    };
    await Promise.all([
      saveNotebook(uid, notebook),
      saveNotebookPage(uid, notebook.id, page),
    ]);
    await loadNotebooks();
    setActiveNotebookId(notebook.id);
    setPages([page]);
    setActivePageId(page.id);
  }

  async function createPage(parentId = null) {
    if (!activeNotebookId) return;
    const siblings = pages.filter(page => (page.parentId || null) === parentId);
    const page = {
      id: generateId(),
      notebookId: activeNotebookId,
      parentId,
      title: parentId ? 'New subpage' : 'New page',
      content: '',
      contentHtml: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: siblings.length,
    };
    setPages(prev => [...prev, page]);
    setActivePageId(page.id);
    if (parentId) setExpanded(prev => ({ ...prev, [parentId]: true }));
    await saveNotebookPage(uid, activeNotebookId, page);
    if (activeNotebook) {
      const updatedNotebook = { ...activeNotebook, updatedAt: Date.now() };
      setNotebooks(prev => prev.map(notebook => notebook.id === updatedNotebook.id ? updatedNotebook : notebook));
      await saveNotebook(uid, updatedNotebook);
    }
  }

  async function removePage(pageId) {
    if (!activeNotebookId || !pageId) return;
    await deleteNotebookPage(uid, activeNotebookId, pageId);
    await loadPages(activeNotebookId);
  }

  async function removeNotebook() {
    if (!activeNotebookId) return;
    const doomedId = activeNotebookId;
    await deleteNotebook(uid, doomedId);
    setActiveNotebookId(null);
    setActivePageId(null);
    await loadNotebooks();
  }

  function persistPage(nextHtml) {
    if (!activeNotebookId || !activePage) return;
    const sanitizedHtml = sanitizeNoteHtml(nextHtml);
    const content = htmlToPlainText(sanitizedHtml);
    const updated = {
      ...activePage,
      content,
      contentHtml: sanitizedHtml,
      updatedAt: Date.now(),
    };
    setPages(prev => prev.map(page => page.id === updated.id ? updated : page));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveNotebookPage(uid, activeNotebookId, updated);
      if (activeNotebook) {
        const updatedNotebook = { ...activeNotebook, updatedAt: Date.now() };
        setNotebooks(prev => prev.map(notebook => notebook.id === updatedNotebook.id ? updatedNotebook : notebook));
        await saveNotebook(uid, updatedNotebook);
      }
    }, 500);
  }

  function handleEditorInput(e) {
    persistPage(e.currentTarget.innerHTML);
  }

  function toggleBold() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('bold');
    persistPage(editorRef.current.innerHTML);
    setBoldActive(document.queryCommandState('bold'));
  }

  function handleEditorKeyDown(e) {
    if (!editorRef.current) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleBold();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (isInsideList(editorRef.current)) {
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        persistPage(editorRef.current.innerHTML);
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      const block = getClosestBlock(editorRef.current);
      const text = block?.textContent?.trim() || '';
      if (text === '-' || text === '*') {
        e.preventDefault();
        block.textContent = '';
        document.execCommand('insertUnorderedList');
        persistPage(editorRef.current.innerHTML);
        return;
      }
      if (/^\d+\.$/.test(text)) {
        e.preventDefault();
        block.textContent = '';
        document.execCommand('insertOrderedList');
        persistPage(editorRef.current.innerHTML);
      }
    }
  }

  function handleEditorPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    persistPage(editorRef.current?.innerHTML || '');
  }

  async function renameNotebook(name) {
    if (!activeNotebook) return;
    const updated = { ...activeNotebook, name, updatedAt: Date.now() };
    setNotebooks(prev => prev.map(notebook => notebook.id === updated.id ? updated : notebook));
    await saveNotebook(uid, updated);
  }

  async function renamePage(title) {
    if (!activePage || !activeNotebookId) return;
    const updated = { ...activePage, title, updatedAt: Date.now() };
    setPages(prev => prev.map(page => page.id === updated.id ? updated : page));
    await saveNotebookPage(uid, activeNotebookId, updated);
  }

  return (
    <div className={`notebooks-app fade-in ${railCollapsed ? 'notebooks-app-rail-collapsed' : ''} ${indexCollapsed ? 'notebooks-app-index-collapsed' : ''}`}>
      <header className="notebooks-brandbar">
        <div className="notebooks-brandblock">
          <div>
            <div className="notebooks-brand">NOTEBOOKS</div>
            <div className="notebooks-brand-sub">
              A product of <button type="button" className="notebooks-brand-link" onClick={onExit}>Get Work Done</button>
            </div>
          </div>
        </div>
        <div className="notebooks-brand-actions">
          <div className="notebooks-brand-pill">
            <Sparkles size={14} />
            <span>Focused writing app</span>
          </div>
          <div className="user-menu" ref={userRef}>
            <button
              className="user-avatar"
              onClick={() => setUserOpen(o => !o)}
              style={{ overflow: 'hidden', padding: 0 }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials
              }
            </button>
            {userOpen && (
              <div className="user-dropdown scale-in">
                <div className="user-info">
                  <div className="user-name">
                    {user?.displayName || (isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User')}
                  </div>
                  <div className="user-email">
                    {user?.email || (isGuest ? 'Data saved locally' : '')}
                  </div>
                  {myPoints && (
                    <div style={{ fontSize: 12, color: 'var(--md-star)', marginTop: 5, fontWeight: 600 }}>
                      🏆 {myPoints.totalPoints} points
                    </div>
                  )}
                </div>
                {!isGuest && socialsEnabled && (
                  <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenProfile(); }}>
                    <User size={16} /> View Profile
                  </button>
                )}
                {!isGuest && (
                  <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenSettings(); }}>
                    <Settings size={16} /> Settings
                  </button>
                )}
                {socialsEnabled ? (
                  <button className="dropdown-item" onClick={() => { setUserOpen(false); onOpenLeaderboard(); }}>
                    <Trophy size={16} /> Leaderboard
                  </button>
                ) : (
                  <div className="notebooks-social-note">
                    Notebook socials are off in Settings.
                  </div>
                )}
                <button className="dropdown-item danger" onClick={() => { setUserOpen(false); onSignOut(); }}>
                  <LogOut size={16} />
                  {isGuest ? 'Exit guest mode' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="notebooks-rail">
        <div className="notebooks-rail-header">
          <div>
            <div className="notebooks-eyebrow">New app</div>
            <div className="notebooks-rail-title">Notebooks</div>
          </div>
          <div className="notebooks-index-actions">
            <button className="btn-icon" onClick={createNotebook} title="Create notebook">
              <Plus size={15} />
            </button>
            <button className="btn-icon" onClick={() => setRailCollapsed(v => !v)} title={railCollapsed ? 'Expand notebooks rail' : 'Collapse notebooks rail'}>
              {railCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
        </div>

        <div className="notebooks-rail-list">
          {notebooks.length === 0 ? (
            <div className="notebooks-empty-side">
              <BookOpen size={18} />
              <span>Create your first notebook</span>
            </div>
          ) : notebooks.map(notebook => (
            <button
              key={notebook.id}
              className={`notebook-card ${activeNotebookId === notebook.id ? 'active' : ''}`}
              onClick={() => setActiveNotebookId(notebook.id)}
            >
              <span className="notebook-card-icon">{notebook.icon || '📘'}</span>
              <span className="notebook-card-copy">
                <span className="notebook-card-title">{notebook.name}</span>
                <span className="notebook-card-sub">{formatUpdated(notebook.updatedAt)}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <aside className="notebooks-index">
        <div className="notebooks-index-header">
          <div>
            <div className="notebooks-eyebrow">Index</div>
            {activeNotebook ? (
              <input
                className="notebooks-index-name-input"
                value={activeNotebook.name || ''}
                onChange={e => renameNotebook(e.target.value)}
                placeholder="Notebook name"
              />
            ) : (
              <div className="notebooks-index-title">No notebook selected</div>
            )}
          </div>
          <div className="notebooks-index-actions">
            <button className="btn-icon" onClick={() => createPage(null)} title="New page" disabled={!activeNotebookId}>
              <FilePlus2 size={15} />
            </button>
            <button className="btn-icon" onClick={removeNotebook} title="Delete notebook" disabled={!activeNotebookId}>
              <Trash2 size={15} />
            </button>
            <button className="btn-icon" onClick={() => setIndexCollapsed(v => !v)} title={indexCollapsed ? 'Expand index' : 'Collapse index'}>
              {indexCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
        </div>

        <div className="notebooks-index-tree">
          {activeNotebookId && pageTree.length === 0 && (
            <button className="notebooks-empty-tree" onClick={() => createPage(null)}>
              <Plus size={16} />
              Create first page
            </button>
          )}
          {pageTree.map(node => (
            <PageNode
              key={node.id}
              node={node}
              depth={0}
              activePageId={activePageId}
              expanded={expanded}
              setExpanded={setExpanded}
              onSelect={setActivePageId}
            />
          ))}
        </div>
      </aside>

      <section className="notebooks-workspace">
        {!activeNotebookId ? (
          <div className="notebooks-empty-main">
            <BookOpen size={30} />
            <div className="notebooks-empty-title">Start your NOTEBOOKS workspace</div>
            <div className="notebooks-empty-copy">Create notebooks, nest pages inside pages, and save everything to the same account.</div>
            <button className="btn" onClick={createNotebook}>Create Notebook</button>
          </div>
        ) : !activePage ? (
          <div className="notebooks-empty-main">
            <FileText size={30} />
            <div className="notebooks-empty-title">This notebook has no pages yet</div>
            <button className="btn" onClick={() => createPage(null)}>Create First Page</button>
          </div>
        ) : (
          <div className="notebook-editor-shell">
            <div className="notebooks-editor-header">
              <div className="notebooks-editor-meta">
                <span className="notebooks-eyebrow">Notebook page</span>
                <input
                  className="notebooks-page-title-input"
                  value={activePage.title || ''}
                  onChange={e => renamePage(e.target.value)}
                  placeholder="Untitled page"
                />
              </div>
              <div className="notebooks-editor-stats">
                <span className="notepad-chip">{wordCount} words</span>
                <span className="notepad-chip">{charCount} chars</span>
                <span className="notepad-chip">{pages.length} pages</span>
              </div>
            </div>

            <div className="notepad-toolbar notebooks-editor-toolbar">
              <div className="notebooks-editor-actions notebooks-editor-actions-primary">
                <button
                  className={`notepad-tool-btn ${boldActive ? 'notepad-tool-btn-active' : ''}`}
                  type="button"
                  onClick={toggleBold}
                  title="Bold (Ctrl/Cmd+B)"
                >
                  <strong>B</strong>
                  <span>Bold</span>
                </button>
                <button className="notepad-tool-btn" type="button" onClick={() => createPage(activePage.id)} title="Create subpage">
                  <Plus size={14} />
                  <span>Subpage</span>
                </button>
                <button className="notepad-tool-btn notepad-tool-btn-danger" type="button" onClick={() => removePage(activePage.id)} title="Delete page">
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
              <div className="notepad-toolbar-hint">
                <NotebookPen size={13} />
                <span>Cloud-saved in this notebook</span>
              </div>
            </div>

            <div className="notepad-sheet-wrap notebooks-sheet-wrap">
              <div className="notepad-sheet-top">
                <input
                  className="notebooks-notebook-name-input"
                  value={activeNotebook.name || ''}
                  onChange={e => renameNotebook(e.target.value)}
                  placeholder="Notebook name"
                />
                <span className="notepad-sheet-date">{formatUpdated(activePage.updatedAt || activePage.createdAt)}</span>
              </div>

              <div className="notepad-sheet">
                <div className="notepad-margin" aria-hidden="true" />
                <div
                  ref={editorRef}
                  className={`notepad-editor ${activePage.content ? '' : 'notepad-editor-empty'}`}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Write notes, plans, references, and nested outlines here..."
                  onInput={handleEditorInput}
                  onKeyDown={handleEditorKeyDown}
                  onPaste={handleEditorPaste}
                  onFocus={() => setBoldActive(document.queryCommandState('bold'))}
                  onKeyUp={() => setBoldActive(document.queryCommandState('bold'))}
                  onMouseUp={() => setBoldActive(document.queryCommandState('bold'))}
                  onBlur={() => setBoldActive(false)}
                  spellCheck="true"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
