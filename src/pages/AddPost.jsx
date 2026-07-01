import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPost, updatePost, getPost, getIdea, incrementIdeaUsage } from '../lib/db';
import { PLATFORMS, CONTENT_TYPES, STATUSES } from '../lib/constants';

const emptyForm = {
  title: '',
  platform: 'Instagram',
  content_type: 'Reel',
  date: new Date().toISOString().slice(0, 10),
  status: 'Planned',
  post_link: '',
  reported_views: '',
  reported_likes: '',
  reported_comments: '',
  reported_shares: '',
  reported_leads: '',
  reported_sales: '',
  feedback: '',
  notes: '',
  idea_id: null,
};

export default function AddPost({ editMode }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (editMode && id) {
      const post = getPost(id);
      if (post) {
        setForm({ ...emptyForm, ...post });
        const hasResults = [post.reported_views, post.reported_likes, post.reported_comments, post.reported_shares, post.reported_leads, post.reported_sales, post.feedback]
          .some((v) => v !== '' && v != null);
        setShowResults(hasResults || !!location.state?.focusResults);
      }
    } else if (location.state?.ideaId) {
      const idea = getIdea(location.state.ideaId);
      if (idea) {
        setForm({
          ...emptyForm,
          title: idea.title,
          platform: idea.suggested_platform,
          content_type: idea.suggested_content_type,
          notes: `Hook: ${idea.hook}\nCTA: ${idea.cta}`,
          idea_id: idea.id,
        });
      }
    }
  }, [editMode, id, location.state]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editMode && id) {
      updatePost(id, form);
      navigate(`/post/${id}`);
    } else {
      const post = createPost(currentUser.id, form);
      if (form.idea_id) incrementIdeaUsage(form.idea_id);
      navigate(`/post/${post.id}`);
    }
  };

  return (
    <div className="screen">
      <h1>{editMode ? 'Edit Post' : 'Add Post'}</h1>
      <p className="screen-subtitle">Takes less than a minute. Results fields are optional.</p>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="field-label">Post title *</label>
        <input className="input" value={form.title} onChange={update('title')} placeholder="Summer Math Practice Reel" required />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label">Platform *</label>
            <select className="select" value={form.platform} onChange={update('platform')}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="field-col">
            <label className="field-label">Content type *</label>
            <select className="select" value={form.content_type} onChange={update('content_type')}>
              {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field-col">
            <label className="field-label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={update('date')} required />
          </div>
          <div className="field-col">
            <label className="field-label">Status</label>
            <select className="select" value={form.status} onChange={update('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <label className="field-label">Post link</label>
        <input className="input" type="url" value={form.post_link} onChange={update('post_link')} placeholder="https://instagram.com/p/..." />

        <button type="button" className="collapse-toggle" onClick={() => setShowResults((s) => !s)}>
          {showResults ? '− Hide reported results & feedback' : '+ Add reported results & feedback (optional)'}
        </button>

        {showResults && (
          <div className="collapse-body">
            <div className="field-note">Manual numbers reported by you — not pulled automatically from any platform.</div>
            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Reported views</label>
                <input className="input" type="number" min="0" value={form.reported_views} onChange={update('reported_views')} />
              </div>
              <div className="field-col">
                <label className="field-label">Reported likes</label>
                <input className="input" type="number" min="0" value={form.reported_likes} onChange={update('reported_likes')} />
              </div>
            </div>
            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Reported comments</label>
                <input className="input" type="number" min="0" value={form.reported_comments} onChange={update('reported_comments')} />
              </div>
              <div className="field-col">
                <label className="field-label">Reported shares</label>
                <input className="input" type="number" min="0" value={form.reported_shares} onChange={update('reported_shares')} />
              </div>
            </div>
            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Reported leads / interested parents</label>
                <input className="input" type="number" min="0" value={form.reported_leads} onChange={update('reported_leads')} />
              </div>
              <div className="field-col">
                <label className="field-label">Reported sales</label>
                <input className="input" type="number" min="0" value={form.reported_sales} onChange={update('reported_sales')} />
              </div>
            </div>
            <label className="field-label">Feedback / parent questions</label>
            <textarea className="textarea" rows={3} value={form.feedback} onChange={update('feedback')} placeholder="What did parents say or ask?" />
          </div>
        )}

        <label className="field-label">Notes</label>
        <textarea className="textarea" rows={2} value={form.notes} onChange={update('notes')} placeholder="Anything you want to remember about this post" />

        <button type="submit" className="btn btn-primary btn-block">
          {editMode ? 'Save changes' : 'Save post'}
        </button>
      </form>
    </div>
  );
}
