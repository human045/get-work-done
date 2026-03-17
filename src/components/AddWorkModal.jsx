import { useState } from 'react';
import StarRating from './StarRating';

export default function AddWorkModal({ onAdd, onClose, existing = null }) {
  const [title, setTitle] = useState(existing?.title || '');
  const [stars, setStars] = useState(existing?.stars || 3);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), stars });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{existing ? 'Edit Work' : 'Add New Work'}</div>
        <form onSubmit={handleSubmit}>
          <input
            className="modal-input"
            placeholder="What do you need to get done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            maxLength={80}
          />
          <div className="modal-label">Priority (1 = low, 5 = critical)</div>
          <StarRating value={stars} onChange={setStars} />
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
