import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataVersion } from '../context/DataContext';
import {
  listUsers, listPosts, getLeaderboard, getPostsNeedingReview,
  getBestFeedback, getBestPerformingIdeas, isAffiliateActive, manuallyAwardBadge, signUpAffiliate,
} from '../lib/db';
import { PUBLISHED_STATUSES } from '../lib/constants';
import { startOfWeek } from '../lib/points';
import Stat from '../components/ui/Stat';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

const emptyAffiliateForm = { name: '', email: '', username: '', password: '' };

export default function AdminDashboard() {
  useDataVersion();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyAffiliateForm);
  const [error, setError] = useState('');

  const affiliates = listUsers({ role: 'affiliate' });
  const start = startOfWeek(new Date());
  const allPosts = listPosts({});
  const weekPosts = allPosts.filter((p) => new Date(p.date) >= start);
  const weekPublished = weekPosts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  const feedbacks = weekPosts.filter((p) => p.feedback && p.feedback.trim()).length;
  const leads = weekPosts.reduce((s, p) => s + (Number(p.reported_leads) || 0), 0);
  const sales = weekPosts.reduce((s, p) => s + (Number(p.reported_sales) || 0), 0);
  const activeCount = affiliates.filter((a) => isAffiliateActive(a.id)).length;

  const leaderboard = getLeaderboard({ period: 'week', metric: 'overall' });
  const topFive = leaderboard.slice(0, 5);
  const reviewPosts = getPostsNeedingReview();
  const bestFeedback = getBestFeedback(5);
  const bestIdeas = getBestPerformingIdeas(5);
  const winnerCandidate = leaderboard[0];

  const handleCreateAffiliate = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
      setError('Please fill in every field.');
      return;
    }
    const result = signUpAffiliate(form);
    if (result.error) { setError(result.error); return; }
    setForm(emptyAffiliateForm);
    setShowCreate(false);
  };

  const headerActions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn btn-primary btn-sm" onClick={() => setShowCreate((s) => !s)}>+ Create affiliate</button>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/ideas')}>Add idea</button>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/reports')}>Export report</button>
    </div>
  );

  const createForm = showCreate && (
    <form className="card form" onSubmit={handleCreateAffiliate}>
      <div className="card-section-title">Create affiliate account</div>
      <div className="field-row">
        <div className="field-col">
          <label className="field-label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="field-col">
          <label className="field-label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div className="field-row">
        <div className="field-col">
          <label className="field-label">Username</label>
          <input className="input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
        </div>
        <div className="field-col">
          <label className="field-label">Temporary password</label>
          <input className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </div>
      </div>
      {error && <div className="chip chip-amber" style={{ margin: '8px 0' }}>{error}</div>}
      <button type="submit" className="btn btn-primary btn-block">Create affiliate</button>
    </form>
  );

  if (affiliates.length === 0) {
    return (
      <div className="screen">
        <div className="screen-header">
          <div>
            <h1>Admin dashboard</h1>
            <p className="screen-subtitle">Here's what's happening with your program this week.</p>
          </div>
          {headerActions}
        </div>
        {createForm}
        <EmptyState emoji="👋" title="No affiliates yet" subtitle="Create the first affiliate account above, or wait for affiliates to self-sign-up." />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <h1>Admin dashboard</h1>
          <p className="screen-subtitle">Here's what's happening with your program this week.</p>
        </div>
        {headerActions}
      </div>

      {createForm}

      <section className="card">
        <div className="card-section-title">This week</div>
        <div className="stat-grid stat-grid-admin">
          <Stat label="Posts this week" value={weekPublished.length} accent />
          <Stat label="Feedbacks" value={feedbacks} />
          <Stat label="Reported leads" value={leads} />
          <Stat label="Reported sales" value={sales} />
          <Stat label="Active affiliates" value={`${activeCount}/${affiliates.length}`} />
        </div>
      </section>

      {winnerCandidate && (
        <section className="card card-action">
          <div className="card-section-title">Top affiliate of the week</div>
          <p>
            🎉 <strong>{winnerCandidate.user.name}</strong> is leading this week with {winnerCandidate.points} points,
            {' '}{winnerCandidate.posts} posts and {winnerCandidate.sales} reported sales.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => manuallyAwardBadge(winnerCandidate.user.id, 'Weekly Winner')}>
            Award "Weekly Winner" badge
          </button>
        </section>
      )}

      <section className="card">
        <div className="card-section-title">Top affiliates this week</div>
        {topFive.map((r) => (
          <div key={r.user.id} className="admin-list-row">
            <span>#{r.position} {r.user.name}</span>
            <span>{r.points} pts</span>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-section-title">Posts needing review ({reviewPosts.length})</div>
        {reviewPosts.length === 0 ? (
          <p className="muted">All caught up — no posted content is missing results.</p>
        ) : (
          reviewPosts.slice(0, 5).map((p) => (
            <button key={p.id} className="admin-list-row admin-list-row-link" onClick={() => navigate('/admin/posts')}>
              <span>{p.title}</span>
              <StatusChip status={p.status} />
            </button>
          ))
        )}
      </section>

      <section className="card">
        <div className="card-section-title">Best feedback</div>
        {bestFeedback.length === 0 ? (
          <p className="muted">No feedback collected yet.</p>
        ) : (
          bestFeedback.map((p) => (
            <div key={p.id} className="admin-feedback-row">
              <p className="feedback-text">"{p.feedback}"</p>
              <span className="muted-sm">{p.title}</span>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <div className="card-section-title">Best performing ideas</div>
        {bestIdeas.map((idea) => (
          <div key={idea.id} className="admin-list-row">
            <span>{idea.title}</span>
            <span>{idea.used_count || 0} uses</span>
          </div>
        ))}
      </section>
    </div>
  );
}
