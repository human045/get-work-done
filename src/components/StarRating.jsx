export default function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="stars" onClick={e => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= value ? 'active' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={!readonly ? () => onChange(n) : undefined}
          title={readonly ? `${value}/5` : `Set priority ${n}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
