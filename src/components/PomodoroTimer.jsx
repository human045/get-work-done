import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Search, X, ChevronRight } from 'lucide-react';
import { saveWork } from '../storage';
import { awardTaskPoints } from '../points';
import './PomodoroTimer.css';

export default function PomodoroTimer({ works, onWorkUpdate, uid }) {
  const [timeLeft, setTimeLeft]         = useState(25 * 60);
  const [isRunning, setIsRunning]       = useState(false);
  const [mode, setMode]                 = useState('work');
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [toast, setToast]               = useState({ visible: false, pts: 0 });

  const timerRef   = useRef(null);
  const toastTimer = useRef(null);

  const totalSeconds = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress     = 1 - timeLeft / totalSeconds; // 0→1 fills left→right

  useEffect(() => {
    if (!isRunning) setTimeLeft(totalSeconds);
  }, [workDuration, breakDuration, mode]); // eslint-disable-line

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setMode(m => (m === 'work' ? 'break' : 'work'));
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { handleComplete(); return 0; } return p - 1; });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRunning, handleComplete]);

  const formatTime = s => {
    const m  = Math.floor(s / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  function showToast(pts) {
    setToast({ visible: true, pts });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 1800);
  }

  async function persist(w) { onWorkUpdate(w); if (uid) await saveWork(uid, w); }

  async function toggleTodo(id) {
    if (!selectedWork) return;
    const todo = activeTodos.find(t => t.id === id);
    if (!todo || todo.done) return;
    const newTodos   = activeTodos.filter(t => t.id !== id);
    const newHistory = [{ ...todo, done: true, completedAt: Date.now() }, ...(selectedWork.history || [])];
    await persist({ ...selectedWork, todos: newTodos, history: newHistory });
    if (uid) { await awardTaskPoints(uid); showToast(10); }
  }

  const filteredWorks = works.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedWork = works.find(w => w.id === selectedWorkId);
  const activeTodos  = selectedWork?.todos || [];

  const progressPct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div className="pomodoro-page fade-in">
      <div className="pomodoro-container">

        {/* ── Timer card ───────────────────────────── */}
        <div className="timer-section">

          {/* Header */}
          <div className="timer-header">
            <div className="timer-mode-label">
              {mode === 'work' ? 'Focus' : 'Break'}
            </div>
            <button
              className="btn-icon"
              onClick={() => setShowSettings(s => !s)}
              style={showSettings ? { color: 'var(--md-primary)' } : {}}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="timer-settings slide-in">
              <label className="settings-label">
                Focus (min)
                <input type="number" className="settings-input" value={workDuration}
                  onChange={e => setWorkDuration(Math.max(1, +e.target.value))} />
              </label>
              <label className="settings-label">
                Break (min)
                <input type="number" className="settings-input" value={breakDuration}
                  onChange={e => setBreakDuration(Math.max(1, +e.target.value))} />
              </label>
            </div>
          )}

          {/* Mode pills */}
          <div className="mode-selector">
            {['work', 'break'].map(m => (
              <button
                key={m}
                className={`mode-btn ${mode === m ? 'active' : ''}`}
                onClick={() => { setMode(m); setIsRunning(false); }}
              >
                {m === 'work' ? 'Focus' : 'Break'}
              </button>
            ))}
          </div>

          {/* Digits */}
          <div className="timer-display">
            <span className={`timer-time ${isRunning ? 'running' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Thin progress bar */}
          <div className="timer-progress-track">
            <div className="timer-progress-fill" style={{ width: progressPct }} />
          </div>

          {/* Controls */}
          <div className="timer-controls">
            <button className="timer-play-btn" onClick={() => setIsRunning(r => !r)}>
              {isRunning ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="timer-reset-btn" onClick={() => { setIsRunning(false); setTimeLeft(totalSeconds); }} title="Reset">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* ── Tasks panel ──────────────────────────── */}
        <div className="tasks-integration-section">
          <p className="tasks-panel-title">Session Work</p>

          {!selectedWork ? (
            <>
              <div className="search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search works..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="works-list">
                {filteredWorks.length === 0
                  ? <div className="no-works">No works found.</div>
                  : filteredWorks.map(w => (
                    <button key={w.id} className="work-select-item" onClick={() => setSelectedWorkId(w.id)}>
                      <span>{w.title}</span>
                      <ChevronRight size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
                    </button>
                  ))
                }
              </div>
            </>
          ) : (
            <div className="selected-work-panel slide-in">
              <div className="selected-work-header">
                <span className="selected-work-title">{selectedWork.title}</span>
                <button
                  className="btn-icon"
                  style={{ color: 'var(--md-outline)', width: 26, height: 26 }}
                  onClick={() => setSelectedWorkId(null)}
                  title="Unlink"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="pomodoro-tasks">
                {activeTodos.length === 0
                  ? <div className="no-tasks">No active tasks. Add them from the Work Page.</div>
                  : activeTodos.map(todo => (
                    <div key={todo.id} className="todo-item slide-in">
                      <button className="todo-check" onClick={() => toggleTodo(todo.id)} title="+10 pts" />
                      <span className="todo-text">{todo.text}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <span className="points-toast" style={{
        opacity:   toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
      }}>
        +{toast.pts} pts ✓
      </span>
    </div>
  );
}
