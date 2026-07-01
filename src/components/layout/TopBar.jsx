import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const goToProfile = () => navigate(currentUser?.role === 'admin' ? '/admin/settings' : '/profile');

  return (
    <header className="top-bar">
      <div className="top-bar-title">{title}</div>
      <div className="top-bar-actions">
        <button className="avatar avatar-sm" style={{ border: 'none' }} onClick={goToProfile} aria-label="Profile">
          {currentUser?.name?.[0]?.toUpperCase() || '?'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
