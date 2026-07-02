import { useEffect, useState } from 'react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_ADMIN_EMAIL } from '../../lib/config';

export default function AdminSignIn({ onBack }) {
  const { signInAdminUser, createFirstAdmin, adminNeedsSetup } = useAuth();
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    adminNeedsSetup()
      .then((result) => {
        if (alive) { setNeedsSetup(result); setChecking(false); }
      })
      .catch(() => {
        // If the check itself fails (e.g. rules not published yet), don't hang
        // forever — fall back to the normal sign-in form.
        if (alive) { setNeedsSetup(false); setChecking(false); }
      });
    return () => { alive = false; };
  }, [adminNeedsSetup]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) return setError('Please fill in your name and email.');
    if (password.length < 6) return setError('Choose a password with at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    const result = await createFirstAdmin({ name, email, password });
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signInAdminUser({ email, password });
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card-header">
          <Logo size={40} />
        </div>
        <h1 className="auth-heading">Admin sign in</h1>
        <p className="auth-subtext">Restricted access for program administrators.</p>

        {checking ? (
          <p className="muted" style={{ textAlign: 'center' }}>Checking admin setup…</p>
        ) : needsSetup ? (
          <>
            <div className="notice-banner" style={{ marginBottom: 8 }}>
              <span>👋</span>
              <span>No admin account exists yet — create the first one now.</span>
            </div>
            <form className="auth-form" onSubmit={handleSetup}>
              <label className="field-label">Your name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Program Admin" />

              <label className="field-label">Admin email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label className="field-label">New password</label>
              <div className="input-icon-wrap">
                <input
                  className="input" style={{ paddingLeft: 12, paddingRight: 38 }}
                  type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create an admin password"
                />
                <button type="button" className="input-icon-toggle" onClick={() => setShowPw((s) => !s)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>

              <label className="field-label">Confirm password</label>
              <input
                className="input" type={showPw ? 'text' : 'password'} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password"
              />

              {error && <div className="chip chip-amber" style={{ margin: '10px 0' }}>{error}</div>}

              <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create admin account →'}
              </button>
            </form>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSignIn}>
            <label className="field-label">Admin email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. admin@chalky.com" />

            <label className="field-label">Password</label>
            <div className="input-icon-wrap">
              <input
                className="input" style={{ paddingLeft: 12, paddingRight: 38 }}
                type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button type="button" className="input-icon-toggle" onClick={() => setShowPw((s) => !s)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            <label className="checkbox-row"><input type="checkbox" /> Remember me</label>

            {error && <div className="chip chip-amber" style={{ margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in as admin →'}
            </button>
          </form>
        )}

        <div className="auth-security-note">
          <span>🛡️</span>
          <span>Only authorized admins can access the admin dashboard. All access is logged and monitored for your security.</span>
        </div>

        <div className="auth-footer-link">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to affiliate access</button>
        </div>
      </div>
    </div>
  );
}
