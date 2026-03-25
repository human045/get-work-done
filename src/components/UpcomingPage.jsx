import { Calendar, ChevronRight } from 'lucide-react';

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

export default function UpcomingPage({ works, onOpenWork, workspaces }) {
  const upcomingWorks = works
    .filter(w => w.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const getWorkspaceName = (id) => {
    if (!id || id === 'general') return 'General';
    return workspaces?.find(w => w.id === id)?.name || 'General';
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--md-surface)', padding: '32px 24px' }} className="fade-in">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Calendar size={24} style={{ color: 'var(--md-primary)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Upcoming Work</h1>
        </div>

        {upcomingWorks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--md-outline)' }}>
            <Calendar size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>No upcoming tasks.</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Works with due dates will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingWorks.map((work, i) => (
              <div
                key={work.id}
                onClick={() => onOpenWork(work)}
                className="slide-in"
                style={{
                  animationDelay: `${i * 0.04}s`,
                  background: 'var(--md-surface-1)',
                  borderRadius: 'var(--md-shape-lg)',
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid var(--md-outline-var)',
                  transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                  boxShadow: 'var(--md-elev-1)',
                  borderLeft: getDueStatus(work.dueDate) === 'overdue' ? '4px solid var(--md-error)' : '1px solid var(--md-outline-var)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--md-elev-2)';
                  e.currentTarget.style.background = 'var(--md-surface-2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--md-elev-1)';
                  e.currentTarget.style.background = 'var(--md-surface-1)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DueBadge dueDate={work.dueDate} />
                    <span style={{ fontSize: 11, color: 'var(--md-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {getWorkspaceName(work.workspaceId)}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--md-on-surface)' }}>
                    {work.title}
                  </div>
                  {work.desc && (
                    <div style={{ fontSize: 13, color: 'var(--md-on-surface-var)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {work.desc}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--md-outline)', textAlign: 'right' }}>
                    {(work.todos || []).length} active<br/>
                    {(work.history || []).length} done
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--md-outline)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
