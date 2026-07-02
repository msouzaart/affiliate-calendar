import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listPosts } from '../lib/db';
import { PUBLISHED_STATUSES, STATUSES } from '../lib/constants';
import { startOfWeek, startOfMonth } from '../lib/points';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

const TABS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'list', label: 'List' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildMonthMatrix(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function buildWeekDays(anchorDate) {
  const start = startOfWeek(anchorDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function Calendar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('month');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [dayModal, setDayModal] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listPosts({ userId: currentUser.id }).then((posts) => {
      if (alive) { setAllPosts(posts); setLoading(false); }
    });
    return () => { alive = false; };
  }, [currentUser.id]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return allPosts;
    return allPosts.filter((p) => p.status === statusFilter);
  }, [allPosts, statusFilter]);

  const postsByDate = useMemo(() => {
    const map = new Map();
    statusFiltered.forEach((p) => {
      if (!map.has(p.date)) map.set(p.date, []);
      map.get(p.date).push(p);
    });
    return map;
  }, [statusFiltered]);

  const todayISO = toISODate(new Date());

  const monthWeeks = useMemo(() => buildMonthMatrix(monthAnchor), [monthAnchor]);
  const weekDays = useMemo(() => buildWeekDays(weekAnchor), [weekAnchor]);

  const listGrouped = useMemo(() => {
    const start = startOfMonth(new Date());
    const posts = statusFiltered.filter((p) => new Date(p.date) >= start);
    const map = new Map();
    [...posts]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((p) => {
        if (!map.has(p.date)) map.set(p.date, []);
        map.get(p.date).push(p);
      });
    return Array.from(map.entries());
  }, [statusFiltered]);

  const goToday = () => { setMonthAnchor(new Date()); setWeekAnchor(new Date()); };

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

      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <select className="select select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {tab !== 'list' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (tab === 'month') {
                  setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                } else {
                  setWeekAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
                }
              }}
            >
              ←
            </button>
            <strong style={{ fontSize: 14, minWidth: 130, textAlign: 'center' }}>
              {tab === 'month'
                ? monthAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
            </strong>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (tab === 'month') {
                  setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
                } else {
                  setWeekAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
                }
              }}
            >
              →
            </button>
            <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tab === 'month' ? (
        <div className="month-grid">
          <div className="month-grid-daynames">
            {DAY_NAMES.map((d) => <div key={d} className="month-grid-dayname">{d}</div>)}
          </div>
          <div className="month-grid-weeks">
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="month-grid-week">
                {week.map((day) => {
                  const iso = toISODate(day);
                  const isOutside = day.getMonth() !== monthAnchor.getMonth();
                  const isToday = iso === todayISO;
                  const dayPosts = postsByDate.get(iso) || [];
                  const visible = dayPosts.slice(0, 2);
                  const extra = dayPosts.length - visible.length;
                  return (
                    <div
                      key={iso}
                      className={`month-cell ${isOutside ? 'outside' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => {
                        if (dayPosts.length === 1) navigate(`/post/${dayPosts[0].id}`);
                        else if (dayPosts.length > 1) setDayModal({ date: iso, posts: dayPosts });
                        else navigate('/add', { state: { defaultDate: iso } });
                      }}
                    >
                      <div className="month-cell-date">{day.getDate()}</div>
                      {visible.map((p) => (
                        <div key={p.id} className="month-cell-post" title={p.title}>{p.title}</div>
                      ))}
                      {extra > 0 && <div className="month-cell-more">+{extra} more</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'week' ? (
        <div className="week-grid">
          {weekDays.map((day) => {
            const iso = toISODate(day);
            const isToday = iso === todayISO;
            const dayPosts = postsByDate.get(iso) || [];
            return (
              <div key={iso} className={`week-day-col ${isToday ? 'today' : ''}`}>
                <div className="week-day-header">
                  {DAY_NAMES[day.getDay()]} {day.getDate()}
                </div>
                {dayPosts.length === 0 ? (
                  <button className="week-day-post" style={{ opacity: 0.5 }} onClick={() => navigate('/add', { state: { defaultDate: iso } })}>
                    + Add
                  </button>
                ) : (
                  dayPosts.map((p) => (
                    <button key={p.id} className="week-day-post" onClick={() => navigate(`/post/${p.id}`)}>
                      <div>{p.title}</div>
                      <StatusChip status={p.status} />
                    </button>
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : listGrouped.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="No posts in this view"
          subtitle="Try a different tab or add a new post."
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/add')}>+ Add post</button>}
        />
      ) : (
        <div className="calendar-list">
          {listGrouped.map(([date, posts]) => (
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

      {dayModal && (
        <div className="modal-overlay" onClick={() => setDayModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-title-row">
              <strong>{formatDateHeader(dayModal.date)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayModal.posts.map((p) => (
                <button
                  key={p.id}
                  className="calendar-item"
                  onClick={() => { setDayModal(null); navigate(`/post/${p.id}`); }}
                >
                  <div className="calendar-item-main">
                    <span className="calendar-item-platform">{p.platform}</span>
                    <span className="calendar-item-divider">·</span>
                    <span>{p.content_type}</span>
                  </div>
                  <div className="calendar-item-title">{p.title}</div>
                  <StatusChip status={p.status} />
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setDayModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
