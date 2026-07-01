import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDataVersion } from '../context/DataContext';
import { changeAdminPassword } from '../lib/db';
import { APP_NAME, APP_DESCRIPTOR, PROGRAM_NAME } from '../lib/config';

export default function AdminSettings() {
  useDataVersion();
  const { currentUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 4) return setMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
    if (newPassword !== confirm) return setMessage({ type: 'error', text: 'New passwords do not match.' });
    const result = changeAdminPassword(oldPassword, newPassword);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setMessage({ type: 'success', text: 'Password updated.' });
      setOldPassword(''); setNewPassword(''); setConfirm('');
    }
  };

  return (
    <div className="screen">
      <h1>Settings</h1>

      <section className="card">
        <div className="card-section-title">Program</div>
        <div className="admin-list-row"><span>Product name</span><span>{APP_NAME}</span></div>
        <div className="admin-list-row"><span>Descriptor</span><span>{APP_DESCRIPTOR}</span></div>
        <div className="admin-list-row"><span>Program</span><span>{PROGRAM_NAME}</span></div>
        <p className="field-note" style={{ marginTop: 10 }}>
          To rebrand for a different program, edit <code>src/lib/config.js</code> in the codebase.
        </p>
      </section>

      <section className="card">
        <div className="card-section-title">Admin account</div>
        <div className="admin-list-row"><span>Name</span><span>{currentUser.name}</span></div>
        <div className="admin-list-row"><span>Email</span><span>{currentUser.email}</span></div>
      </section>

      <section className="card">
        <div className="card-section-title">Change password</div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field-label">Current password</label>
          <input className="input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <label className="field-label">New password</label>
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <label className="field-label">Confirm new password</label>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {message && (
            <div className={`chip ${message.type === 'error' ? 'chip-amber' : 'chip-green'}`} style={{ marginTop: 8 }}>
              {message.text}
            </div>
          )}
          <button type="submit" className="btn btn-navy">Update password</button>
        </form>
      </section>
    </div>
  );
}
