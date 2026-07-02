import { useEffect, useState } from 'react';
import { listUsers, listPosts } from '../lib/db';
import { PLATFORMS, STATUSES, PERIODS } from '../lib/constants';
import { startOfWeek, startOfMonth } from '../lib/points';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';

function periodStart(period) {
  if (period === 'week') return startOfWeek(new Date());
  if (period === 'month') return startOfMonth(new Date());
  return null;
}

export default function AdminPosts() {
  const [period, setPeriod] = useState('all');
  const [affiliateId, setAffiliateId] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let alive = true;
    listUsers({ role: 'affiliate' }).then((affs) => { if (alive) setAffiliates(affs); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const start = periodStart(period);
    const fromISO = start ? start.toISOString().slice(0, 10) : undefined;
    listPosts({
      userId: affiliateId || undefined,
      platform: platform || undefined,
      status: status || undefined,
      from: fromISO,
    }).then((p) => {
      if (alive) { setPosts(p); setLoading(false); }
    });
    return () => { alive = false; };
  }, [affiliateId, platform, status, period]);

  const nameById = new Map(affiliates.map((a) => [a.id, a.name]));

  return (
    <div className="screen">
      <h1>Posts</h1>

      <div className="filter-bar">
        <select className="select select-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <select className="select select-sm" value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)}>
          <option value="">All affiliates</option>
          {affiliates.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="select select-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : posts.length === 0 ? (
        <EmptyState emoji="📝" title="No posts match these filters" />
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Affiliate</th><th>Title</th><th>Platform</th><th>Type</th><th>Date</th>
                <th>Status</th><th>Leads</th><th>Sales</th><th>Feedback</th><th>Points</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{nameById.get(p.user_id) || '—'}</td>
                  <td>{p.title}</td>
                  <td>{p.platform}</td>
                  <td>{p.content_type}</td>
                  <td>{p.date}</td>
                  <td><StatusChip status={p.status} /></td>
                  <td>{p.reported_leads || 0}</td>
                  <td>{p.reported_sales || 0}</td>
                  <td>{p.feedback ? '✓' : '—'}</td>
                  <td>{p.points || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
