import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children, title }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'affiliate';

  return (
    <div className={`app-shell role-${role}`}>
      <Sidebar role={role} />
      <div className="app-main">
        <TopBar title={title} />
        <main className="app-content">{children}</main>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
