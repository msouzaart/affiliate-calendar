import { useState } from 'react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';

export default function AffiliateSignIn({ onGoCreate, onGoAdminSignIn }) {
  const { signInAffiliateUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signInAffiliateUser({ identifier, password });
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card-header">
          <Logo size={40} />
        </div>
        <h1 className="auth-heading">Sign in as affiliate</h1>
        <p className="auth-subtext">Access your own dashboard, calendar, post ideas, and activity.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <div className="input-icon-wrap">
            <span className="input-icon-left">👤</span>
            <input className="input" type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter your email" />
          </div>

          <label className="field-label">Password</label>
          <div className="input-icon-wrap">
            <span className="input-icon-left">🔒</span>
            <input
              className="input" style={{ paddingRight: 38 }}
              type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" className="input-icon-toggle" onClick={() => setShowPw((s) => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0' }}>
            <label className="checkbox-row" style={{ margin: 0 }}>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13 }}>Forgot password?</a>
          </div>

          <div className="notice-banner">
            <span>🔒</span>
            <span>You will only be able to access your own affiliate page.</span>
          </div>

          {error && <div className="chip chip-amber" style={{ margin: '10px 0' }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <button className="btn btn-ghost btn-block" onClick={onGoCreate} style={{ marginTop: 10 }}>Create affiliate account →</button>

        <div className="auth-divider">or</div>
        <div className="auth-footer-link">
          Need admin access? <button className="btn btn-ghost btn-sm" onClick={onGoAdminSignIn}>Admin sign in</button>
        </div>
      </div>
    </div>
  );
}
