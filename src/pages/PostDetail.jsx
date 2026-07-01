import { useNavigate, useParams } from 'react-router-dom';
import { useDataVersion } from '../context/DataContext';
import { getPost, updatePost, duplicatePostAsNew, duplicatePostAsIdea } from '../lib/db';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

const RESULT_FIELDS = [
  ['reported_views', 'Reported views'],
  ['reported_likes', 'Reported likes'],
  ['reported_comments', 'Reported comments'],
  ['reported_shares', 'Reported shares'],
  ['reported_leads', 'Reported leads'],
  ['reported_sales', 'Reported sales'],
];

export default function PostDetail() {
  useDataVersion();
  const { id } = useParams();
  const navigate = useNavigate();
  const post = getPost(id);

  if (!post) {
    return (
      <div className="screen">
        <EmptyState emoji="🔍" title="Post not found" subtitle="It may have been removed." />
      </div>
    );
  }

  const hasAnyResult = RESULT_FIELDS.some(([key]) => post[key] !== '' && post[key] != null);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>{post.title}</h1>
      </div>

      <section className="card">
        <div className="post-detail-meta">
          <span>{post.platform}</span>
          <span className="calendar-item-divider">·</span>
          <span>{post.content_type}</span>
          <span className="calendar-item-divider">·</span>
          <span>{new Date(post.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <StatusChip status={post.status} />
        {post.post_link && (
          <a className="post-link" href={post.post_link} target="_blank" rel="noreferrer">View live post ↗</a>
        )}
        <div className="post-points">+{post.points || 0} pts earned from this post</div>
      </section>

      <section className="card">
        <div className="card-section-title">Reported results</div>
        {hasAnyResult ? (
          <div className="stat-grid">
            {RESULT_FIELDS.map(([key, label]) => (
              <Stat key={key} label={label} value={post[key] === '' || post[key] == null ? '—' : post[key]} />
            ))}
          </div>
        ) : (
          <p className="muted">No reported results yet — add them when you have a moment.</p>
        )}
      </section>

      <section className="card">
        <div className="card-section-title">Feedback / parent questions</div>
        {post.feedback ? <p className="feedback-text">"{post.feedback}"</p> : <p className="muted">No feedback collected yet.</p>}
      </section>

      {post.notes && (
        <section className="card">
          <div className="card-section-title">Notes</div>
          <p>{post.notes}</p>
        </section>
      )}

      <section className="card action-list">
        <button className="btn btn-primary btn-block" onClick={() => navigate(`/post/${post.id}/edit`, { state: { focusResults: true } })}>
          Update results
        </button>
        {post.status === 'Planned' && (
          <button className="btn btn-secondary btn-block" onClick={() => updatePost(post.id, { status: 'Posted' })}>
            Mark as posted
          </button>
        )}
        {post.status !== 'Completed' && (
          <button className="btn btn-secondary btn-block" onClick={() => updatePost(post.id, { status: 'Completed' })}>
            Mark as completed
          </button>
        )}
        <button className="btn btn-ghost btn-block" onClick={() => {
          const copy = duplicatePostAsNew(post.id);
          navigate(`/post/${copy.id}/edit`);
        }}>
          Duplicate as new post
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => {
          duplicatePostAsIdea(post.id);
          navigate('/ideas');
        }}>
          Duplicate as idea
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
