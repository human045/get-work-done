import { useState } from 'react';
import { Calendar } from 'lucide-react';
import StarRating from './StarRating';

export default function AddWorkModal({ onAdd, onClose, existing = null }) {
  const [title, setTitle]     = useState(existing?.title || '');
  const [stars, setStars]     = useState(existing?.stars || 3);
  const [dueDate, setDueDate] = useState(existing?.dueDate || '');
  const [desc, setDesc]       = useState(existing?.desc || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), stars, dueDate: dueDate || null, desc: desc.trim() });
  }

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{existing ? 'Edit Work' : 'New Work Item'}</div>
        <form onSubmit={handleSubmit}>

          {/* Title */}
          <input
            className="modal-input"
            placeholder="What do you need to get done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            maxLength={80}
          />

          {/* Description */}
          <textarea
            className="modal-input"
            placeholder="Brief description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
            rows={2}
            style={{ resize: 'none', lineHeight: 1.5 }}
          />

          {/* Priority + Due date row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div className="modal-label">Priority</div>
              <StarRating value={stars} onChange={setStars} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={11} /> Due Date
              </div>
              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={e => setDueDate(e.target.value)}
                style={{
                  background: 'var(--md-surface-2)',
                  border: '1px solid var(--md-outline-var)',
                  borderRadius: 'var(--md-shape-sm)',
                  padding: '7px 10px',
                  color: dueDate ? 'var(--md-on-surface)' : 'var(--md-outline)',
                  fontSize: 13, fontFamily: 'var(--md-font)',
                  outline: 'none', width: '100%', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  colorScheme: 'dark',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--md-outline-var)'}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  style={{
                    fontSize: 11, color: 'var(--md-outline)', background: 'none',
                    border: 'none', cursor: 'pointer', marginTop: 3, fontFamily: 'var(--md-font)',
                  }}
                >
                  Clear date
                </button>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {existing ? 'Save Changes' : 'Add Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
