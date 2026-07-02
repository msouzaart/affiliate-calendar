import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser, listBadges, getAffiliateStats } from '../lib/db';
import Badge from '../components/ui/Badge';
import Stat from '../components/ui/Stat';

export default function Profile() {
  const { currentUser } = useAuth();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      listBadges({ userId: currentUser.id }),
      getAffiliateStats(currentUser.id, 'all'),
    ]).then(([b, s]) => {
      if (alive) { setBadges(b); setStats(s); setLoading(false); }
    });
    return () => { alive = false; };
  }, [currentUser.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateUser(currentUser.id, { name, email });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="screen">
      <h1>Profile</h1>

      <section className="card profile-card">
        <div className="avatar profile-avatar">{currentUser.name[0]?.toUpperCase()}</div>
        <div>
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-meta">Affiliate · code {currentUser.affiliate_code}</div>
          <div className="profile-meta">{currentUser.email}</div>
        </div>
      </section>

      {loading || !stats ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <section className="card">
            <div className="card-section-title">All-time activity</div>
            <div className="stat-grid">
              <Stat label="Posts published" value={stats.posts} accent />
              <Stat label="Feedback collected" value={stats.feedback} />
              <Stat label="Reported leads" value={stats.leads} />
              <Stat label="Points" value={stats.points} />
            </div>
          </section>

          {badges.length > 0 && (
            <section className="card">
              <div className="card-section-title">Badges earned</div>
              <div className="badge-row">
                {badges.map((b) => <Badge key={b.id} name={b.badge_name} />)}
              </div>
            </section>
          )}
        </>
      )}

      <section className="card">
        <div className="card-section-title">Edit profile</div>
        <form className="form" onSubmit={handleSave}>
          <label className="field-label">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="field-label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="field-note">This updates your display email only — your sign-in email/password stay the same.</div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </form>
      </section>
    </div>
  );
}
