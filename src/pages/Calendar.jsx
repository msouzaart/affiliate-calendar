import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataVersion } from '../context/DataContext';
import { listPosts } from '../lib/db';
import { PUBLISHED_STATUSES, STATUSES } from '../lib/constants';
import { startOfWeek, startOfMonth } from '../lib/points';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

const TABS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'list', label: 'List' },
];

function needsResults(p) {
  return (
    PUBLISHED_STATUSES.includes(p.status) &&
    !p.feedback &&
    ![p.reported_views, p.reported_likes, p.reported_comments, p.reported_shares].some((v) => v !== '' && v != null)
  );
}

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function Calendar() {
  useDataVersion();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');
  const [statusFilter, setStatusFilter] = useState('');

  const allPosts = listPosts({ userId: currentUser.id });

  const filtered = useMemo(() => {
    let posts = allPosts;
    if (tab === 'week') {
      const start = startOfWeek(new Date());
      posts = posts.filter((p) => new Date(p.date) >= start);
    } else if (tab === 'month') {
      const start = startOfMonth(new Date());
      posts = posts.filter((p) => new Date(p.date) >= start);
    }
    if (statusFilter) posts = posts.filter((p) => p.status === statusFilter);
    return posts;
  }, [allPosts, tab, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    [...filtered]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((p) => {
        if (!map.has(p.date)) map.set(p.date, []);
        map.get(p.date).push(p);
      });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Calendar</h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/add')}>+ Add post</button>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <select className="select select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="No posts in this view"
          subtitle="Try a different tab or add a new post."
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/add')}>+ Add post</button>}
        />
      ) : (
        <div className="calendar-list">
          {grouped.map(([date, posts]) => (
            <div key={date} className="calendar-day-group">
              <div className="calendar-day-header">{formatDateHeader(date)}</div>
              {posts.map((p) => (
                <button key={p.id} className="calendar-item" onClick={() => navigate(`/post/${p.id}`)}>
                  <div className="calendar-item-main">
                    <span className="calendar-item-platform">{p.platform}</span>
                    <span className="calendar-item-divider">·</span>
                    <span>{p.content_type}</span>
                  </div>
                  <div className="calendar-item-title">{p.title}</div>
                  <div className="calendar-item-footer">
                    <StatusChip status={p.status} />
                    {needsResults(p) && <span className="chip chip-amber-outline">Needs results</span>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
