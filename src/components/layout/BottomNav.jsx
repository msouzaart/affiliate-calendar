import { NavLink } from 'react-router-dom';

const AFFILIATE_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓️', tour: 'nav-calendar' },
  { to: '/add', label: 'Add', icon: '➕', tour: 'nav-add-post' },
  { to: '/ideas', label: 'Ideas', icon: '💡', tour: 'nav-ideas' },
  { to: '/ranking', label: 'Ranking', icon: '🏆', tour: 'nav-ranking' },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/affiliates', label: 'Affiliates', icon: '👥' },
  { to: '/admin/posts', label: 'Posts', icon: '📝' },
  { to: '/admin/ranking', label: 'Leaderboard', icon: '🏆', tour: 'nav-admin-ranking' },
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
          data-tour={item.tour}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
