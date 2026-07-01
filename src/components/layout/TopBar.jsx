import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title }) {
  const { currentUser, logout } = useAuth();
  return (
    <header className="top-bar">
      <div className="top-bar-title">{title || 'Affiliate Calendar'}</div>
      <div className="top-bar-actions">
        <div className="avatar avatar-sm">{currentUser?.name?.[0]?.toUpperCase() || '?'}</div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Switch</button>
      </div>
    </header>
  );
}
