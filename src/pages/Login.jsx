import { useState } from 'react';
import { listUsers } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useDataVersion } from '../context/DataContext';

export default function Login() {
  useDataVersion();
  const { login, signUp } = useAuth();
  const affiliates = listUsers({ role: 'affiliate' });
  const admin = listUsers({ role: 'admin' })[0];
  const [showForm, setShowForm] = useState(affiliates.length === 0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    signUp({ name, email, role: 'affiliate' });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">✏️</div>
        <h1>Affiliate Calendar</h1>
        <p className="login-tagline">Plan it. Post it. Track it. Get recognized.</p>

        {affiliates.length > 0 && !showForm && (
          <>
            <div className="login-section-label">Who's posting today?</div>
            <div className="login-affiliate-list">
              {affiliates.map((u) => (
                <button key={u.id} className="login-affiliate-row" onClick={() => login(u.id)}>
                  <span className="avatar">{u.name[0]?.toUpperCase()}</span>
                  <span className="login-affiliate-info">
                    <span className="login-affiliate-name">{u.name}</span>
                    <span className="login-affiliate-code">{u.affiliate_code}</span>
                  </span>
                  <span className="login-affiliate-arrow">→</span>
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-block" onClick={() => setShowForm(true)}>
              + New affiliate
            </button>
          </>
        )}

        {showForm && (
          <form className="login-form" onSubmit={handleCreate}>
            <div className="login-section-label">Create your affiliate profile</div>
            <label className="field-label">Your name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amanda Lee" required />
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amanda@email.com" />
            <button type="submit" className="btn btn-primary btn-block">Start tracking my posts</button>
            {affiliates.length > 0 && (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setShowForm(false)}>
                Back to profile list
              </button>
            )}
          </form>
        )}

        <div className="login-admin-link">
          <button className="btn btn-ghost btn-sm" onClick={() => admin && login(admin.id)}>
            Continue as Admin →
          </button>
        </div>
      </div>
    </div>
  );
}
