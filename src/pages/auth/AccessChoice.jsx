import Logo from '../../components/ui/Logo';
import { APP_DESCRIPTOR } from '../../lib/config';

export default function AccessChoice({ workspaceName, onPick, onBack }) {
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card-wide">
        <div className="auth-card-header">
          <Logo size={40} />
          <div className="muted-sm">{APP_DESCRIPTOR}</div>
        </div>
        <h1 className="auth-heading" style={{ textAlign: 'center' }}>Choose how you want to continue</h1>
        {workspaceName && (
          <p className="auth-subtext" style={{ textAlign: 'center' }}>Workspace: <strong>{workspaceName}</strong></p>
        )}

        <div className="access-choice-grid">
          <div className="access-choice-card">
            <div className="access-choice-icon">➕</div>
            <div className="access-choice-title">Create affiliate account</div>
            <div className="access-choice-desc">New here? Set up your profile and password.</div>
            <button className="btn btn-primary btn-block" onClick={() => onPick('create')}>Create account →</button>
          </div>
          <div className="access-choice-card">
            <div className="access-choice-icon">🔑</div>
            <div className="access-choice-title">Sign in as affiliate</div>
            <div className="access-choice-desc">Access your own dashboard, calendar, ideas, and post history.</div>
            <button className="btn btn-primary btn-block" onClick={() => onPick('affiliate')}>Sign in as affiliate →</button>
          </div>
          <div className="access-choice-card">
            <div className="access-choice-icon">🛡️</div>
            <div className="access-choice-title">Admin sign in</div>
            <div className="access-choice-desc">Manage affiliates, posts, rankings, reports, and ideas.</div>
            <button className="btn btn-navy btn-block" onClick={() => onPick('admin')}>Admin sign in →</button>
          </div>
        </div>

        <div className="reassurance-row">
          <div className="reassurance-item"><span className="reassurance-icon">🔒</span> Secure access for everyone</div>
          <div className="reassurance-item"><span className="reassurance-icon">✓</span> Remember me on this device</div>
        </div>

        <div className="auth-footer-link">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
