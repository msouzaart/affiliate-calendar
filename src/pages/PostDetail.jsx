import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost, updatePost, duplicatePostAsNew, duplicatePostAsIdea } from '../lib/db';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

const RESULT_FIELDS = [
  ['reported_views', 'Reported views', '👁'],
  ['reported_likes', 'Reported likes', '❤️'],
  ['reported_comments', 'Comments', '💬'],
  ['reported_shares', 'Shares', '🔁'],
  ['reported_leads', 'Leads', '🌱'],
  ['reported_sales', 'Sales', '🛒'],
];

const PLATFORM_ICON = {
  Instagram: '📷', Facebook: '📘', TikTok: '🎵', YouTube: '▶️',
  Pinterest: '📌', Blog: '📝', Email: '✉️', Other: '🔗',
};

function parseHookCta(notes) {
  if (!notes) return null;
  const hookMatch = notes.match(/Hook:\s*([\s\S]*?)(\nCTA:|$)/i);
  const ctaMatch = notes.match(/CTA:\s*([\s\S]*)$/i);
  if (!hookMatch && !ctaMatch) return null;
  return {
    hook: hookMatch ? hookMatch[1].trim() : '',
    cta: ctaMatch ? ctaMatch[1].trim() : '',
  };
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPost(id).then((p) => {
      if (alive) { setPost(p); setLoading(false); }
    });
    return () => { alive = false; };
  }, [id, refreshTick]);

  const changeStatus = async (status) => {
    setBusy(true);
    setError('');
    try {
      await updatePost(post.id, { status });
      reload();
    } catch (e) {
      setError(e?.message || 'Could not update this post. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const asNewPost = async () => {
    setBusy(true);
    setError('');
    try {
      const copy = await duplicatePostAsNew(post.id);
      navigate(`/post/${copy.id}/edit`);
    } catch (e) {
      setError(e?.message || 'Could not duplicate this post. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const asIdea = async () => {
    setBusy(true);
    setError('');
    try {
      await duplicatePostAsIdea(post.id);
      navigate('/ideas');
    } catch (e) {
      setError(e?.message || 'Could not duplicate this post as an idea. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="screen"><p className="muted">Loading…</p></div>;
  }

  if (!post) {
    return (
      <div className="screen">
        <EmptyState emoji="🔍" title="Post not found" subtitle="It may have been removed." />
      </div>
    );
  }

  const hasAnyResult = RESULT_FIELDS.some(([key]) => post[key] !== '' && post[key] != null);
  const hookCta = parseHookCta(post.notes);

  let nextStep = null;
  if (post.status === 'Planned') {
    nextStep = {
      title: 'This post is planned.',
      subtitle: 'Publish it first, then come back to add the link and results.',
      action: { label: 'Mark as posted', onClick: () => changeStatus('Posted'), icon: '📤' },
    };
  } else if (!hasAnyResult && !post.feedback && post.status !== 'Completed') {
    nextStep = {
      title: 'This post is live.',
      subtitle: 'Add reported results and feedback when you have a moment.',
      action: { label: 'Update results', onClick: () => navigate(`/post/${post.id}/edit`, { state: { focusResults: true } }), icon: '📊' },
    };
  }

  return (
    <div className="screen">
      <button className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: 4 }} onClick={() => navigate('/calendar')}>
        ← Back to Calendar
      </button>

      <div className="screen-header">
        <h1>{post.title}</h1>
      </div>

      <div className="post-detail-meta" style={{ marginBottom: 6 }}>
        <span>{PLATFORM_ICON[post.platform] || '🔗'} {post.platform}</span>
        <span className="calendar-item-divider">·</span>
        <span>{post.content_type}</span>
        <span className="calendar-item-divider">·</span>
        <span>{new Date(post.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <StatusChip status={post.status} />
        <span className="post-points" style={{ margin: 0 }}>+{post.points || 0} pts for this post</span>
      </div>

      {nextStep && (
        <section className="next-step-banner" style={{ marginBottom: 16 }}>
          <div className="icon-circle">🗓️</div>
          <div className="next-step-text">
            <div className="next-step-label">Next step</div>
            <div className="next-step-title">{nextStep.title}</div>
            <div className="next-step-subtitle">{nextStep.subtitle}</div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={nextStep.action.onClick}>
            {nextStep.action.icon} {nextStep.action.label}
          </button>
        </section>
      )}

      {error && <div className="chip chip-amber" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="detail-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card">
            <div className="card-title-row">
              <div className="icon-circle">📄</div>
              <strong>Post Content</strong>
            </div>
            {hookCta ? (
              <>
                {hookCta.hook && (
                  <div className="kv-row">
                    <span className="kv-label">Hook</span>
                    <span className="kv-value">{hookCta.hook}</span>
                  </div>
                )}
                {hookCta.cta && (
                  <div className="kv-row">
                    <span className="kv-label">CTA</span>
                    <span className="kv-value">{hookCta.cta}</span>
                  </div>
                )}
              </>
            ) : post.notes ? (
              <div className="kv-row">
                <span className="kv-label">Notes</span>
                <span className="kv-value">{post.notes}</span>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>No notes added yet.</p>
            )}
            {(post.post_link || post.reference_link) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {post.post_link && (
                  <a className="post-link" href={post.post_link} target="_blank" rel="noreferrer">View live post ↗</a>
                )}
                {post.reference_link && (
                  <a className="post-link" href={post.reference_link} target="_blank" rel="noreferrer">View reference link ↗</a>
                )}
              </div>
            )}
            <button
              className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}
              onClick={() => navigate(`/post/${post.id}/edit`)}
            >
              ✏️ Edit post
            </button>
          </section>

          <section className="card">
            <div className="card-title-row">
              <div className="icon-circle">💬</div>
              <strong>Feedback / Parent Questions</strong>
            </div>
            {post.feedback ? (
              <p className="feedback-text">"{post.feedback}"</p>
            ) : (
              <div className="empty-illustration">
                <div className="icon-circle icon-circle-lg">💬</div>
                <strong>No feedback yet</strong>
                <p>Parent questions and comments will appear here after this post goes live.</p>
                <button
                  className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}
                  onClick={() => navigate(`/post/${post.id}/edit`, { state: { focusResults: true } })}
                >
                  ➕ Add feedback
                </button>
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card">
            <div className="card-title-row">
              <div className="icon-circle">📊</div>
              <strong>Reported Results</strong>
            </div>
            {!hasAnyResult && (
              <div className="empty-illustration">
                <div className="icon-circle icon-circle-lg">📈</div>
                <strong>No results yet</strong>
                <p>Results can be added 24–48h after publishing so you have time to collect accurate data.</p>
              </div>
            )}
            {RESULT_FIELDS.map(([key, label, icon]) => (
              <div key={key} className="result-field-row">
                <span className="result-field-label">{icon} {label}</span>
                <span>{post[key] === '' || post[key] == null ? '—' : post[key]}</span>
              </div>
            ))}
            <button
              className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }}
              onClick={() => navigate(`/post/${post.id}/edit`, { state: { focusResults: true } })}
            >
              📊 Update results
            </button>
          </section>

          <section className="card">
            <div className="card-title-row">
              <div className="icon-circle">⚡</div>
              <strong>More actions</strong>
            </div>
            <div className="more-actions-grid">
              <button className="btn btn-secondary btn-sm" disabled={busy} onClick={asNewPost}>
                📋 Duplicate as new post
              </button>
              <button className="btn btn-secondary btn-sm" disabled={busy} onClick={asIdea}>
                💡 Duplicate as idea
              </button>
              {post.status !== 'Completed' && (
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => changeStatus('Completed')}>
                  ✅ Mark as completed
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
