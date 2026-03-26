import { Home, Calendar, Timer, Wallet, Menu } from 'lucide-react';

export default function BottomNav({ page, setPage, onMenuToggle }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'pomodoro', label: 'Timer', icon: Timer },
    { id: 'expense-tracker', label: 'Finance', icon: Wallet },
  ];

  return (
    <div className="bottom-nav">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = page === t.id;
        return (
          <button
            key={t.id}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => setPage(t.id)}
          >
            <Icon size={active ? 22 : 20} className="bottom-nav-icon" />
            <span className="bottom-nav-label">{t.label}</span>
          </button>
        );
      })}
      <button className="bottom-nav-item" onClick={onMenuToggle}>
        <Menu size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Menu</span>
      </button>
    </div>
  );
}
