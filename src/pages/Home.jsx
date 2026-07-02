import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listPosts, updatePost, getLeaderboard, listBadges } from '../lib/db';
import { PUBLISHED_STATUSES } from '../lib/constants';
import { startOfWeek } from '../lib/points';
import StatusChip from '../components/ui/StatusChip';
import Stat from '../components/ui/Stat';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

function isThisWeek(dateStr) {
  const start = startOfWeek(new Date());
  return new Date(dateStr) >= start;
}

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [rank, setRank] = useState('—');
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const [userPosts, userBadges, leaderboard] = await Promise.all([
        listPosts({ userId: currentUser.id }),
        listBadges({ userId: currentUser.id }),
        getLeaderboard({ period: 'week', metric: 'overall' }),
      ]);
      if (!alive) return;
      setPosts(userPosts);
      setBadges(userBadges);
      const myRow = leaderboard.find((r) => r.user.id === currentUser.id);
      setRank(myRow ? myRow.position : '—');
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [currentUser.id, refreshTick]);

  const markPosted = async (post) => {
    await updatePost(post.id, { status: 'Posted' });
    reload();
  };

  if (loading) {
    return <div className="screen"><p className="muted">Loading…</p></div>;
  }

  const thisWeekPosts = posts.filter((p) => isThisWeek(p.date));
  const published = thisWeekPosts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  const planned = thisWeekPosts.filter((p) => p.status === 'Planned');
  const feedbacks = thisWeekPosts.filter((p) => p.feedback && p.feedback.trim()).length;

  const needsResults = posts.filter(
    (p) =>
      PUBLISHED_STATUSES.includes(p.status) &&
      !p.feedback &&
      ![p.reported_views, p.reported_likes, p.reported_comments, p.reported_shares].some((v) => v !== '' && v != null)
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPost = posts.find((p) => p.date === todayStr);

  return (
    <div className="screen">
      <h1 className="greeting" data-tour="home-welcome">Hi, {currentUser.name.split(' ')[0]} 👋</h1>

      <section className="card" data-tour="week-summary">
        <div className="card-section-title">This Week</div>
        <div className="stat-grid">
          <Stat label="Posts published" value={published.length} accent />
          <Stat label="Posts planned" value={planned.length} />
          <Stat label="Feedbacks" value={feedbacks} />
          <Stat label="Current rank" value={rank === '—' ? '—' : `#${rank}`} />
        </div>
      </section>

      {needsResults.length > 0 && (
        <section className="card card-action" data-tour="next-action">
          <div className="card-section-title">Next Action</div>
          <p>
            You have {needsResults.length} post{needsResults.length > 1 ? 's' : ''} waiting for reported results.
          </p>
          <button className="btn btn-primary" onClick={() => navigate(`/post/${needsResults[0].id}`)}>
            Update results
          </button>
        </section>
      )}

      <section className="card" data-tour="today-card">
        <div className="card-section-title">Today</div>
        {todayPost ? (
          <div className="today-post">
            <div className="today-post-main">
              <div className="today-post-title">{todayPost.title}</div>
              <div className="today-post-meta">{todayPost.platform} · {todayPost.content_type}</div>
              <StatusChip status={todayPost.status} />
            </div>
            {todayPost.status === 'Planned' ? (
              <button className="btn btn-primary btn-sm" data-tour="mark-posted-btn" onClick={() => markPosted(todayPost)}>
                Mark as posted
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/post/${todayPost.id}`)}>
                View
              </button>
            )}
          </div>
        ) : (
          <EmptyState
            emoji="📭"
            title="Nothing planned for today"
            subtitle="Browse the idea library or add a post to keep your streak going."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/ideas')}>
                Browse ideas
              </button>
            }
          />
        )}
      </section>

      {badges.length > 0 && (
        <section className="card" data-tour="badges-section">
          <div className="card-section-title">Your badges</div>
          <div className="badge-row">
            {badges.map((b) => (
              <Badge key={b.id} name={b.badge_name} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <EmptyState
          emoji="🚀"
          title="Welcome to Affiliate Calendar"
          subtitle="Plan your first post or grab an idea from the library to get rolling."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/add')}>
              Add your first post
            </button>
          }
        />
      )}
    </div>
  );
}
