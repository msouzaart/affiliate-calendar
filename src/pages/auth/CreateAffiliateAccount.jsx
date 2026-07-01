import { useState } from 'react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../lib/config';

export default function CreateAffiliateAccount({ onGoAffiliateSignIn, onGoAdminSignIn }) {
  const { signUpAffiliateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
      setError('Please fill in every field.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    const result = signUpAffiliateUser({
      name: form.name, email: form.email, username: form.username, password: form.password,
    });
    if (result.error) setError(result.error);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card-header">
          <Logo size={40} />
        </div>
        <h1 className="auth-heading">Create affiliate account</h1>
        <p className="auth-subtext">Set up your profile so you can access your own {APP_NAME} workspace.</p>
        <div className="auth-security-note">
          <span>🔒</span>
          <span>Each affiliate can only access their own page.</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label">Full name</label>
          <input className="input" value={form.name} onChange={update('name')} placeholder="Enter your full name" />

          <label className="field-label">Email</label>
          <input className="input" type="email" value={form.email} onChange={update('email')} placeholder="Enter your email address" />

          <label className="field-label">Username</label>
          <input className="input" value={form.username} onChange={update('username')} placeholder="Choose a username" />

          <label className="field-label">Password</label>
          <div className="input-icon-wrap">
            <input
              className="input" style={{ paddingLeft: 12, paddingRight: 38 }}
              type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')}
              placeholder="Create a password"
            />
            <button type="button" className="input-icon-toggle" onClick={() => setShowPw((s) => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          <label className="field-label">Confirm password</label>
          <div className="input-icon-wrap">
            <input
              className="input" style={{ paddingLeft: 12, paddingRight: 38 }}
              type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')}
              placeholder="Confirm your password"
            />
            <button type="button" className="input-icon-toggle" onClick={() => setShowConfirm((s) => !s)}>
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" defaultChecked /> Keep me signed in on this device
          </label>

          {error && <div className="chip chip-amber" style={{ marginBottom: 8 }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-block">Create account →</button>
        </form>

        <div className="auth-divider">or</div>
        <button className="btn btn-ghost btn-block" onClick={onGoAffiliateSignIn}>Already have an account? Sign in as affiliate</button>
        <div className="auth-footer-link">
          Admin? <button className="btn btn-ghost btn-sm" onClick={onGoAdminSignIn}>Sign in here</button>
        </div>
      </div>
    </div>
  );
}
