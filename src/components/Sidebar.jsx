import { useState } from 'react';
import {
  Home, Clock, ChevronDown,
  FolderOpen, Plus, Folder, PanelLeftClose, PanelLeftOpen,
  Star, Calendar
} from 'lucide-react';

const E = {
  decel: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  std:   'cubic-bezier(0.2, 0, 0, 1)',
};

function NavItem({ icon, label, active, onClick, indent = false, badge, sub }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: indent ? '7px 12px 7px 28px' : '8px 12px',
        borderRadius: 'var(--md-shape-md)',
        border: 'none', background: active
          ? 'color-mix(in srgb, var(--md-primary) 16%, transparent)'
          : 'transparent',
        color: active ? 'var(--md-primary)' : 'var(--md-on-surface-var)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        fontFamily: 'var(--md-font)', cursor: 'pointer', textAlign: 'left',
        transition: `background 150ms ${E.std}, color 150ms ${E.std}`,
        position: 'relative', overflow: 'hidden',
        marginBottom: 1,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'color-mix(in srgb, var(--md-on-surface) 8%, transparent)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: active ? 'var(--md-primary)' : 'var(--md-outline)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '1px 6px',
          borderRadius: 'var(--md-shape-full)',
          background: active ? 'var(--md-primary)' : 'var(--md-surface-3)',
          color: active ? 'var(--md-on-primary)' : 'var(--md-outline)',
          flexShrink: 0,
        }}>{badge}</span>
      )}
      {sub && <span style={{ color: 'var(--md-outline)', flexShrink: 0 }}>{sub}</span>}
    </button>
  );
}

function SectionHeader({ label, open, onToggle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 2px', marginTop: 6 }}>
      <button
        onClick={onToggle}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: 'var(--md-outline)',
          letterSpacing: '0.6px', textTransform: 'uppercase',
          fontFamily: 'var(--md-font)', padding: 0,
        }}
      >
        <span style={{
          display: 'inline-flex', transition: `transform 200ms ${E.std}`,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>
          <ChevronDown size={12} />
        </span>
        {label}
      </button>
      {action && (
        <button
          onClick={action.onClick}
          title={action.title}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--md-outline)', padding: '2px 4px',
            borderRadius: 4, display: 'flex', alignItems: 'center',
            transition: `color 150ms ${E.std}`,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--md-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--md-outline)'}
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

function dueBadge(work) {
  if (!work.dueDate) return null;
  const now = Date.now();
  const due = new Date(work.dueDate).getTime();
  const diff = due - now;
  if (diff < 0) return 'overdue';
  if (diff < 86400000) return 'today';
  if (diff < 172800000) return 'tomorrow';
  return null;
}

export default function Sidebar({
  collapsed, onToggle,
  works, workspaces, activeWsId, setActiveWsId,
  page, setPage, onOpenWork, onNewWork, onNewWorkspace,
}) {
  const [recentOpen, setRecentOpen]     = useState(true);
  const [workspacesOpen, setWsOpen]     = useState(true);

  const allWs = [{ id: 'general', name: 'General' }, ...workspaces];

  // Recent = last 5 opened/modified works
  const recent = [...works]
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

  const sidebarW = collapsed ? 56 : 220;

  return (
    <div style={{
      width: sidebarW, minWidth: sidebarW, flexShrink: 0,
      background: 'var(--md-surface-1)',
      borderRight: '1px solid var(--md-outline-var)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: `width 280ms ${E.decel}, min-width 280ms ${E.decel}`,
      willChange: 'width',
    }}>
      {/* ── Top actions ── */}
      <div style={{ padding: collapsed ? '8px 6px' : '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Toggle collapse */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            alignSelf: collapsed ? 'center' : 'flex-end',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--md-outline)', padding: 6, borderRadius: 'var(--md-shape-sm)',
            display: 'flex', alignItems: 'center',
            transition: `color 150ms ${E.std}`,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--md-on-surface)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--md-outline)'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Home */}
        {collapsed ? (
          <button
            onClick={() => setPage('dashboard')}
            title="Home"
            style={{
              alignSelf: 'center', background: page === 'dashboard' ? 'color-mix(in srgb, var(--md-primary) 16%, transparent)' : 'none',
              border: 'none', cursor: 'pointer', color: page === 'dashboard' ? 'var(--md-primary)' : 'var(--md-outline)',
              padding: 8, borderRadius: 'var(--md-shape-md)', display: 'flex', alignItems: 'center',
            }}
          >
            <Home size={18} />
          </button>
        ) : (
          <NavItem icon={<Home size={16} />} label="Home" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
        )}

        {/* New Work FAB-like */}
        {!collapsed && (
          <button
            onClick={onNewWork}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 'var(--md-shape-full)',
              background: 'var(--md-primary)', color: 'var(--md-on-primary)',
              border: 'none', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--md-font)',
              boxShadow: 'var(--md-elev-1)',
              transition: `box-shadow 150ms ${E.std}`,
              marginTop: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--md-elev-2)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--md-elev-1)'}
          >
            <Plus size={15} /> New Work
          </button>
        )}
        {collapsed && (
          <button
            onClick={onNewWork}
            title="New Work"
            style={{
              alignSelf: 'center', background: 'var(--md-primary)', border: 'none',
              cursor: 'pointer', color: 'var(--md-on-primary)',
              padding: 8, borderRadius: 'var(--md-shape-md)', display: 'flex', alignItems: 'center',
            }}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* ── Scrollable nav ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '0 6px' : '0 10px 16px' }}>

        {/* ── Recent ── */}
        {!collapsed && (
          <>
            <SectionHeader label="Recent" open={recentOpen} onToggle={() => setRecentOpen(o => !o)} />
            {recentOpen && (
              <div style={{ marginBottom: 4 }}>
                {recent.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--md-outline)', padding: '4px 12px 4px 28px' }}>No recent work</div>
                )}
                {recent.map(w => {
                  const badge = dueBadge(w);
                  return (
                    <NavItem
                      key={w.id}
                      icon={<Clock size={13} />}
                      label={w.title}
                      indent
                      onClick={() => onOpenWork(w)}
                      sub={badge ? (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px',
                          borderRadius: 4,
                          background: badge === 'overdue' ? 'var(--md-error-cont)' : 'color-mix(in srgb, var(--md-star) 20%, transparent)',
                          color: badge === 'overdue' ? 'var(--md-on-error-cont)' : 'var(--md-star)',
                        }}>
                          {badge}
                        </span>
                      ) : null}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Workspaces ── */}
        {!collapsed && (
          <>
            <SectionHeader
              label="Workspaces"
              open={workspacesOpen}
              onToggle={() => setWsOpen(o => !o)}
              action={{ onClick: onNewWorkspace, title: 'New workspace' }}
            />
            {workspacesOpen && (
              <div style={{ marginBottom: 4 }}>
                {allWs.map(ws => {
                  const count = works.filter(w => (w.workspaceId || 'general') === ws.id).length;
                  return (
                    <NavItem
                      key={ws.id}
                      icon={ws.id === 'general' ? <FolderOpen size={13} /> : <Folder size={13} />}
                      label={ws.name}
                      indent
                      active={page === 'dashboard' && activeWsId === ws.id}
                      badge={count}
                      onClick={() => { setActiveWsId(ws.id); setPage('dashboard'); }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Collapsed workspace icons */}
        {collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 4 }}>
            {allWs.map(ws => {
              const active = page === 'dashboard' && activeWsId === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => { setActiveWsId(ws.id); setPage('dashboard'); }}
                  title={ws.name}
                  style={{
                    background: active ? 'color-mix(in srgb, var(--md-primary) 16%, transparent)' : 'none',
                    border: 'none', cursor: 'pointer',
                    color: active ? 'var(--md-primary)' : 'var(--md-outline)',
                    padding: 8, borderRadius: 'var(--md-shape-md)', display: 'flex',
                  }}
                >
                  {ws.id === 'general' ? <FolderOpen size={16} /> : <Folder size={16} />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Upcoming (placeholder) ── */}
        {!collapsed && (
          <>
            <div style={{ height: 1, background: 'var(--md-outline-var)', margin: '10px 4px' }} />
            <div style={{ padding: '4px 12px', fontSize: 11, color: 'var(--md-outline)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
              Coming Soon
            </div>
            {[
              { icon: <Star size={13} />, label: 'Priorities' },
              { icon: <Calendar size={13} />, label: 'Calendar' },
            ].map(item => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                indent
                onClick={() => {}}
                sub={<span style={{ fontSize: 9, color: 'var(--md-outline)', background: 'var(--md-surface-3)', padding: '1px 5px', borderRadius: 4 }}>soon</span>}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
