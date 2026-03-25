import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Check, Search, Trash2 } from 'lucide-react';
import { generateId, saveWork } from '../storage';
import { awardTaskPoints } from '../points';
import './PomodoroTimer.css';

export default function PomodoroTimer({ works, onWorkUpdate, uid }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [showSettings, setShowSettings] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [toast, setToast] = useState({ visible: false, pts: 0 });

  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  // Sync timeLeft when durations change and timer is reset
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    }
  }, [workDuration, breakDuration, mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, workDuration, breakDuration]);

  function handleComplete() {
    setIsRunning(false);
    clearInterval(timerRef.current);
    // Auto-switch mode or play sound can be added here
    setMode(mode === 'work' ? 'break' : 'work');
  }

  function toggleTimer() {
    setIsRunning(!isRunning);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filteredWorks = works.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedWork = works.find(w => w.id === selectedWorkId);
  const activeTodos = selectedWork?.todos || [];

  function showToast(pts) {
    setToast({ visible: true, pts });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 1800);
  }

  async function persist(updatedWork) {
    onWorkUpdate(updatedWork);
    if (uid) await saveWork(uid, updatedWork);
  }

  async function toggleTodo(id) {
    if (!selectedWork) return;
    const todo = activeTodos.find(t => t.id === id);
    if (!todo || todo.done) return;
    const newTodos = activeTodos.filter(t => t.id !== id);
    const newHistory = [{ ...todo, done: true, completedAt: Date.now() }, ...(selectedWork.history || [])];
    await persist({ ...selectedWork, todos: newTodos, history: newHistory });
    if (uid) { await awardTaskPoints(uid); showToast(10); }
  }

  return (
    <div className="pomodoro-page fade-in">
      <div className="pomodoro-container">
        {/* Timer Section */}
        <div className="timer-section">
          <div className="timer-header">
            <h2 className="dashboard-title">Pomodoro Timer</h2>
            <button className="btn-icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={20} />
            </button>
          </div>

          {showSettings && (
            <div className="timer-settings slide-in">
              <label className="settings-label">
                Work Duration (min):
                <input 
                  type="number" 
                  className="settings-input" 
                  value={workDuration} 
                  onChange={e => setWorkDuration(Math.max(1, Number(e.target.value)))} 
                />
              </label>
              <label className="settings-label">
                Break Duration (min):
                <input 
                  type="number" 
                  className="settings-input" 
                  value={breakDuration} 
                  onChange={e => setBreakDuration(Math.max(1, Number(e.target.value)))} 
                />
              </label>
            </div>
          )}

          <div className="mode-selector">
            <button 
              className={`mode-btn ${mode === 'work' ? 'active' : ''}`}
              onClick={() => { setMode('work'); setIsRunning(false); }}
            >
              Work
            </button>
            <button 
              className={`mode-btn ${mode === 'break' ? 'active' : ''}`}
              onClick={() => { setMode('break'); setIsRunning(false); }}
            >
              Break
            </button>
          </div>

          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>

          <div className="timer-controls">
            <button className="btn btn-primary control-btn" onClick={toggleTimer}>
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="btn btn-outline control-btn" onClick={resetTimer}>
              <RotateCcw size={20} /> Reset
            </button>
          </div>
        </div>

        {/* Work Selection & Tasks Section */}
        <div className="tasks-integration-section">
          <div className="tasks-header">
            <h3>Link a Work to this Session</h3>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search works..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {!selectedWork ? (
            <div className="works-list">
              {filteredWorks.length === 0 ? (
                <div className="no-works">No works found.</div>
              ) : (
                filteredWorks.map(w => (
                  <button 
                    key={w.id} 
                    className="work-select-item"
                    onClick={() => setSelectedWorkId(w.id)}
                  >
                    {w.title}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="selected-work-panel slide-in">
              <div className="selected-work-header">
                <span className="selected-work-title">{selectedWork.title}</span>
                <button className="btn-danger" onClick={() => setSelectedWorkId(null)}>Change</button>
              </div>
              
              <div className="pomodoro-tasks">
                {activeTodos.length === 0 ? (
                  <div className="no-tasks">No active tasks in this work. You can add them from the Work Page.</div>
                ) : (
                  activeTodos.map(todo => (
                    <div key={todo.id} className="todo-item slide-in">
                      <button
                        className="todo-check"
                        onClick={() => toggleTodo(todo.id)}
                        title="Complete (+10 pts)"
                      />
                      <span className="todo-text">{todo.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <span className="points-toast" style={{
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
      }}>
        +{toast.pts} pts ✓
      </span>
    </div>
  );
}
