import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const AFFILIATE_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓️', tour: 'nav-calendar' },
  { to: '/add', label: 'Add Post', icon: '➕', tour: 'nav-add-post' },
  { to: '/ideas', label: 'Ideas & Examples', icon: '💡', tour: 'nav-ideas' },
  { to: '/ranking', label: 'Ranking', icon: '🏆', tour: 'nav-ranking' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/affiliates', label: 'Affiliates', icon: '👥' },
  { to: '/admin/posts', label: 'Posts', icon: '📝' },
  { to: '/admin/ideas', label: 'Ideas Library', icon: '💡' },
  { to: '/admin/ranking', label: 'Leaderboard', icon: '🏆', tour: 'nav-admin-ranking' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ role }) {
  const { currentUser, logout } = useAuth();
  const items = role === 'admin' ? ADMIN_ITEMS : AFFILIATE_ITEMS;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand-wrap">
        <Logo size={32} compact />
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-tour={item.tour}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{currentUser?.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="sidebar-user-name">{currentUser?.name}</div>
            <div className="sidebar-user-role">{currentUser?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}
