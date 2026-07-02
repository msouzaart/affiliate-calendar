import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { useWalkthrough } from '../../context/WalkthroughContext';

export default function AppShell({ children, title }) {
  const { currentUser } = useAuth();
  const { active, start } = useWalkthrough();
  const role = currentUser?.role || 'affiliate';

  return (
    <div className={`app-shell role-${role}`}>
      <Sidebar role={role} />
      <div className="app-main">
        <TopBar title={title} />
        <main className="app-content">{children}</main>
      </div>
      <BottomNav role={role} />
      {!active && (
        <button
          className="tour-fab"
          onClick={() => start(role)}
          aria-label="Replay guided tour"
          title="Replay guided tour"
        >
          ?
        </button>
      )}
    </div>
  );
}
