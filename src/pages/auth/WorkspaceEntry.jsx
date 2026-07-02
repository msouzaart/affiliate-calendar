import { useState } from 'react';
import Logo from '../../components/ui/Logo';
import { APP_NAME, PROGRAM_NAME } from '../../lib/config';

export default function WorkspaceEntry({ onContinue }) {
  const [value, setValue] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const matchesProgram = (text) => text.trim().toLowerCase() === PROGRAM_NAME.toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!matchesProgram(value)) {
      setError(`We couldn't find that workspace. Try "${PROGRAM_NAME}".`);
      return;
    }
    setError('');
    onContinue(PROGRAM_NAME);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!matchesProgram(inviteCode)) {
      setError(`That invite code doesn't match a workspace. Try "${PROGRAM_NAME}".`);
      return;
    }
    setError('');
    onContinue(PROGRAM_NAME);
  };

  return (
    <div className="auth-screen">
      <div>
        <div className="auth-card">
          <div className="auth-card-header">
            <Logo size={40} />
          </div>
          <h1 className="auth-heading">Find your program</h1>
          <p className="auth-subtext">
            Enter your company name, program name, or invite code to continue to the correct workspace.
          </p>

          {!showInvite ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field-label">Company or program</label>
              <input
                className="input"
                placeholder={`e.g. ${PROGRAM_NAME}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <div className="field-note">Examples: {PROGRAM_NAME}, {PROGRAM_NAME.toLowerCase()}, or your invite code</div>
              {error && <div className="chip chip-amber" style={{ margin: '4px 0 10px' }}>{error}</div>}
              <button type="submit" className="btn btn-primary btn-block">Continue →</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleInvite}>
              <label className="field-label">Invite link or code</label>
              <input
                className="input"
                placeholder="Paste your invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              {error && <div className="chip chip-amber" style={{ margin: '4px 0 10px' }}>{error}</div>}
              <button type="submit" className="btn btn-primary btn-block">Continue →</button>
            </form>
          )}

          <div className="auth-footer-link">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowInvite((s) => !s); setError(''); }}>
              {showInvite ? 'Search by company or program instead' : 'I have an invite link'}
            </button>
          </div>

          <div className="auth-divider">or</div>

          <div className="card-section-title" style={{ textAlign: 'center' }}>What happens next?</div>
          <div className="auth-steps">
            <div className="auth-step">
              <div className="auth-step-icon">🔍</div>
              <div className="auth-step-label">1. We find your workspace</div>
            </div>
            <div className="auth-step-arrow">›</div>
            <div className="auth-step">
              <div className="auth-step-icon">👥</div>
              <div className="auth-step-label">2. You choose affiliate or admin access</div>
            </div>
            <div className="auth-step-arrow">›</div>
            <div className="auth-step">
              <div className="auth-step-icon">🛡️</div>
              <div className="auth-step-label">3. You sign in securely</div>
            </div>
          </div>

          <div className="auth-security-note">
            <span>🔒</span>
            <span>Your program name only helps route you to the correct workspace.</span>
          </div>
        </div>
        <div className="auth-outer-footer">Example destination: <strong>{APP_NAME}</strong></div>
      </div>
    </div>
  );
}
