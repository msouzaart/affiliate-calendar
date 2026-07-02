import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listUsers, listPosts, getLeaderboard, getPostsNeedingReview,
  getBestFeedback, getBestPerformingIdeas, isAffiliateActive, manuallyAwardBadge,
} from '../lib/db';
import { PUBLISHED_STATUSES } from '../lib/constants';
import { startOfWeek } from '../lib/points';
import Stat from '../components/ui/Stat';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [weekPublished, setWeekPublished] = useState([]);
  const [feedbacks, setFeedbacks] = useState(0);
  const [leads, setLeads] = useState(0);
  const [sales, setSales] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [topFive, setTopFive] = useState([]);
  const [winnerCandidate, setWinnerCandidate] = useState(null);
  const [reviewPosts, setReviewPosts] = useState([]);
  const [bestFeedback, setBestFeedback] = useState([]);
  const [bestIdeas, setBestIdeas] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const affs = await listUsers({ role: 'affiliate' });
      const start = startOfWeek(new Date());
      const allPosts = await listPosts({});
      const weekPosts = allPosts.filter((p) => new Date(p.date) >= start);
      const published = weekPosts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
      const fb = weekPosts.filter((p) => p.feedback && p.feedback.trim()).length;
      const ld = weekPosts.reduce((s, p) => s + (Number(p.reported_leads) || 0), 0);
      const sl = weekPosts.reduce((s, p) => s + (Number(p.reported_sales) || 0), 0);
      const activeFlags = await Promise.all(affs.map((a) => isAffiliateActive(a.id)));
      const active = activeFlags.filter(Boolean).length;

      const leaderboard = await getLeaderboard({ period: 'week', metric: 'overall' });
      const review = await getPostsNeedingReview();
      const feedback = await getBestFeedback(5);
      const ideas = await getBestPerformingIdeas(5);

      if (!alive) return;
      setAffiliates(affs);
      setWeekPublished(published);
      setFeedbacks(fb);
      setLeads(ld);
      setSales(sl);
      setActiveCount(active);
      setTopFive(leaderboard.slice(0, 5));
      setWinnerCandidate(leaderboard[0] || null);
      setReviewPosts(review);
      setBestFeedback(feedback);
      setBestIdeas(ideas);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [refreshTick]);

  const copyInviteLink = () => {
    const link = window.location.origin;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const awardWeeklyWinner = async () => {
    await manuallyAwardBadge(winnerCandidate.user.id, 'Weekly Winner');
    reload();
  };

  const headerActions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/ideas')}>Add idea</button>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/reports')}>Export report</button>
    </div>
  );

  const inviteCard = (
    <section className="card">
      <div className="card-section-title">Invite affiliates</div>
      <p className="muted" style={{ marginBottom: 10 }}>
        Affiliates create their own account from the app's sign-up screen (choose "Create affiliate account").
        Share this link so they can join.
      </p>
      <button className="btn btn-secondary btn-sm" onClick={copyInviteLink}>
        {copied ? 'Link copied ✓' : '🔗 Copy invite link'}
      </button>
    </section>
  );

  if (loading) {
    return <div className="screen"><p className="muted">Loading…</p></div>;
  }

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
        {inviteCard}
        <EmptyState emoji="👋" title="No affiliates yet" subtitle="Share the invite link above so affiliates can create their own accounts." />
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

      {inviteCard}

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
          <button className="btn btn-primary btn-sm" onClick={awardWeeklyWinner}>
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
