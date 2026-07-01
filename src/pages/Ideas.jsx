import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataVersion } from '../context/DataContext';
import { listIdeas, createIdea, toggleSavedIdea, isIdeaSaved } from '../lib/db';
import { IDEA_CATEGORIES, PLATFORMS, CONTENT_TYPES, DIFFICULTIES } from '../lib/constants';
import EmptyState from '../components/ui/EmptyState';

const emptyIdea = {
  title: '', category: 'Reading', suggested_platform: 'Instagram', suggested_content_type: 'Reel',
  hook: '', cta: '', difficulty: 'Easy', estimated_time: '15 min',
};

const PLATFORM_ICON = {
  Instagram: '📷', Facebook: '📘', TikTok: '🎵', YouTube: '▶️',
  Pinterest: '📌', Blog: '📝', Email: '✉️', Other: '🔗',
};

export default function Ideas({ adminView = false }) {
  useDataVersion();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [contentType, setContentType] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyIdea);
  const [copied, setCopied] = useState(false);

  let ideas = listIdeas({ category: category || undefined });
  if (platform) ideas = ideas.filter((i) => i.suggested_platform === platform);
  if (contentType) ideas = ideas.filter((i) => i.suggested_content_type === contentType);
  if (savedOnly) ideas = ideas.filter((i) => isIdeaSaved(currentUser.id, i.id));
  if (adminView) ideas = [...ideas].sort((a, b) => (b.used_count || 0) - (a.used_count || 0));

  const selected = useMemo(
    () => ideas.find((i) => i.id === selectedId) || ideas[0] || null,
    [ideas, selectedId]
  );

  const addToCalendar = (idea) => navigate('/add', { state: { ideaId: idea.id } });

  const copyCaption = (text) => {
    navigator.clipboard?.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const clearFilters = () => { setCategory(''); setPlatform(''); setContentType(''); setSavedOnly(false); };

  const submitIdea = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createIdea(form);
    setForm(emptyIdea);
    setShowForm(false);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <h1>{adminView ? 'Ideas library' : 'Post ideas & examples'}</h1>
          <p className="screen-subtitle">
            {adminView
              ? 'Sorted by how often affiliates use them.'
              : `Browse ready-to-use content ideas, captions, and example videos.`}
          </p>
        </div>
        {adminView ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ Add idea'}
          </button>
        ) : (
          <button className={`btn btn-sm ${savedOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSavedOnly((s) => !s)}>
            🔖 Saved ideas
          </button>
        )}
      </div>

      {showForm && adminView && (
        <form className="card form" onSubmit={submitIdea}>
          <label className="field-label">Idea title</label>
          <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <div className="field-row">
            <div className="field-col">
              <label className="field-label">Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {IDEA_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field-col">
              <label className="field-label">Difficulty</label>
              <select className="select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-col">
              <label className="field-label">Suggested platform</label>
              <select className="select" value={form.suggested_platform} onChange={(e) => setForm((f) => ({ ...f, suggested_platform: e.target.value }))}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field-col">
              <label className="field-label">Suggested content type</label>
              <select className="select" value={form.suggested_content_type} onChange={(e) => setForm((f) => ({ ...f, suggested_content_type: e.target.value }))}>
                {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <label className="field-label">Hook</label>
          <input className="input" value={form.hook} onChange={(e) => setForm((f) => ({ ...f, hook: e.target.value }))} />
          <label className="field-label">CTA</label>
          <input className="input" value={form.cta} onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))} />
          <label className="field-label">Estimated time</label>
          <input className="input" value={form.estimated_time} onChange={(e) => setForm((f) => ({ ...f, estimated_time: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-block">Add idea to library</button>
        </form>
      )}

      <div className="card" style={{ padding: 12 }}>
        <div className="filter-bar">
          <select className="select select-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="select select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All topics</option>
            {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select select-sm" value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="">All types</option>
            {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>

      {ideas.length === 0 ? (
        <EmptyState emoji="💡" title="No ideas match these filters" />
      ) : (
        <div className="ideas-layout">
          <div className="idea-list">
            <div className="muted-sm" style={{ marginBottom: 2 }}>{ideas.length} ideas found</div>
            {ideas.map((idea) => {
              const saved = !adminView && isIdeaSaved(currentUser.id, idea.id);
              const isSelected = selected?.id === idea.id;
              return (
                <div
                  key={idea.id}
                  className={`idea-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedId(idea.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="idea-list-item-top">
                    <span className="idea-list-item-badges">
                      <span>{PLATFORM_ICON[idea.suggested_platform] || '🔗'}</span>
                      <span className="chip chip-blue">{idea.category}</span>
                    </span>
                    {!adminView ? (
                      <button
                        className={`bookmark-btn ${saved ? 'saved' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleSavedIdea(currentUser.id, idea.id); }}
                        aria-label="Save idea"
                      >
                        {saved ? '★' : '☆'}
                      </button>
                    ) : (
                      <span className="muted-sm">{idea.used_count || 0} uses</span>
                    )}
                  </div>
                  <div className="idea-list-item-title">{idea.title}</div>
                  <div className="idea-list-item-hook">Hook: "{idea.hook}"</div>
                  <div className="idea-list-item-actions">
                    {!adminView && (
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); addToCalendar(idea); }}>
                        Use idea
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); copyCaption(idea.sample_caption || idea.hook); }}>
                      Copy caption
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="card idea-detail">
              <div className="idea-detail-header">
                <span className="idea-list-item-badges">
                  <span className="chip chip-gray">{PLATFORM_ICON[selected.suggested_platform]} {selected.suggested_platform}</span>
                  <span className="chip chip-blue">{selected.category}</span>
                </span>
                {!adminView && (
                  <button
                    className={`bookmark-btn ${isIdeaSaved(currentUser.id, selected.id) ? 'saved' : ''}`}
                    onClick={() => toggleSavedIdea(currentUser.id, selected.id)}
                  >
                    {isIdeaSaved(currentUser.id, selected.id) ? '★ Saved' : '☆ Save'}
                  </button>
                )}
              </div>

              <div className="idea-detail-media">
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{PLATFORM_ICON[selected.suggested_platform]}</div>
                  <strong style={{ color: 'var(--navy)' }}>{selected.title}</strong>
                </div>
              </div>

              <div>
                <div className="idea-detail-block-title">Sample caption</div>
                <div className="idea-caption-box">{selected.sample_caption || selected.hook}</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => copyCaption(selected.sample_caption || selected.hook)}>
                  {copied ? 'Copied ✓' : '📋 Copy'}
                </button>
              </div>

              <div className="idea-detail-grid">
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Why this works</div>
                  <ul className="idea-why-list">
                    {(selected.why_this_works || []).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Assets & references</div>
                  <ul className="idea-why-list">
                    {(selected.assets || []).map((a, i) => <li key={i} style={{ }}>{a}</li>)}
                  </ul>
                </div>
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Suggested CTA</div>
                  <p style={{ margin: 0, fontSize: 13 }}>{selected.suggested_cta || selected.cta}</p>
                </div>
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Recommended audience</div>
                  <p style={{ margin: 0, fontSize: 13 }}>{selected.recommended_audience || '—'}</p>
                </div>
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Best time to post</div>
                  <p style={{ margin: 0, fontSize: 13 }}>{selected.best_time_to_post || '—'}</p>
                </div>
                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="idea-detail-block-title">Difficulty & time</div>
                  <p style={{ margin: 0, fontSize: 13 }}>{selected.difficulty} · ~{selected.estimated_time}</p>
                </div>
              </div>

              {!adminView && (
                <button className="btn btn-primary btn-block" onClick={() => addToCalendar(selected)}>Use idea → Add to calendar</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
