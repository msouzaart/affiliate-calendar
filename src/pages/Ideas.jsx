import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataVersion } from '../context/DataContext';
import { listIdeas, createIdea } from '../lib/db';
import { IDEA_CATEGORIES, PLATFORMS, CONTENT_TYPES, DIFFICULTIES } from '../lib/constants';
import EmptyState from '../components/ui/EmptyState';

const emptyIdea = {
  title: '', category: 'Reading', suggested_platform: 'Instagram', suggested_content_type: 'Reel',
  hook: '', cta: '', difficulty: 'Easy', estimated_time: '15 min',
};

export default function Ideas({ adminView = false }) {
  useDataVersion();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyIdea);

  let ideas = listIdeas({ category: category || undefined });
  if (adminView) ideas = [...ideas].sort((a, b) => (b.used_count || 0) - (a.used_count || 0));

  const addToCalendar = (idea) => navigate('/add', { state: { ideaId: idea.id } });

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
        <h1>Ideas</h1>
        {adminView && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ Add idea'}
          </button>
        )}
      </div>
      <p className="screen-subtitle">{adminView ? 'Sorted by how often affiliates use them.' : 'Browse content ideas and add them straight to your calendar.'}</p>

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

      <div className="chip-filter-row">
        <button className={`chip-filter ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
        {IDEA_CATEGORIES.map((c) => (
          <button key={c} className={`chip-filter ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {ideas.length === 0 ? (
        <EmptyState emoji="💡" title="No ideas in this category yet" />
      ) : (
        <div className="idea-grid">
          {ideas.map((idea) => (
            <div key={idea.id} className="card idea-card">
              <div className="idea-card-category">{idea.category}</div>
              <h3 className="idea-card-title">{idea.title}</h3>
              <div className="idea-card-meta">
                <span>Best for: {idea.suggested_platform} / {idea.suggested_content_type}</span>
                <span>Difficulty: {idea.difficulty}</span>
                <span>~{idea.estimated_time}</span>
              </div>
              {idea.hook && <p className="idea-card-hook">"{idea.hook}"</p>}
              {idea.cta && <p className="idea-card-cta">CTA: {idea.cta}</p>}
              {adminView ? (
                <div className="idea-card-usage">Used {idea.used_count || 0} time{idea.used_count === 1 ? '' : 's'}</div>
              ) : (
                <button className="btn btn-primary btn-block" onClick={() => addToCalendar(idea)}>Add to calendar</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
