import { NavLink } from 'react-router-dom';

const AFFILIATE_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓️' },
  { to: '/add', label: 'Add', icon: '➕' },
  { to: '/ideas', label: 'Ideas', icon: '💡' },
  { to: '/ranking', label: 'Ranking', icon: '🏆' },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/affiliates', label: 'Affiliates', icon: '👥' },
  { to: '/admin/posts', label: 'Posts', icon: '📝' },
  { to: '/admin/ranking', label: 'Leaderboard', icon: '🏆' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

export default function BottomNav({ role = 'affiliate' }) {
  const items = role === 'admin' ? ADMIN_ITEMS : AFFILIATE_ITEMS;
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
