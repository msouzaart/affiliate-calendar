import { useMemo, useState } from 'react';
import { useDataVersion } from '../context/DataContext';
import { listUsers, listPosts, getUserTotalPoints, isAffiliateActive, manuallyAwardBadge } from '../lib/db';
import { PUBLISHED_STATUSES, PLATFORMS, STATUSES, PERIODS } from '../lib/constants';
import { startOfWeek, startOfMonth } from '../lib/points';
import EmptyState from '../components/ui/EmptyState';

function periodStart(period) {
  if (period === 'week') return startOfWeek(new Date());
  if (period === 'month') return startOfMonth(new Date());
  return null;
}

function formatRelative(iso) {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function AdminAffiliates() {
  useDataVersion();
  const [period, setPeriod] = useState('week');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');

  const affiliates = listUsers({ role: 'affiliate' });
  const start = periodStart(period);
  const fromISO = start ? start.toISOString().slice(0, 10) : undefined;

  const rows = useMemo(() => {
    return affiliates
      .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
      .map((a) => {
        const posts = listPosts({ userId: a.id, platform: platform || undefined, status: status || undefined, from: fromISO });
        const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
        const feedbacks = posts.filter((p) => p.feedback && p.feedback.trim()).length;
        const leads = posts.reduce((s, p) => s + (Number(p.reported_leads) || 0), 0);
        const sales = posts.reduce((s, p) => s + (Number(p.reported_sales) || 0), 0);
        const points = getUserTotalPoints(a.id, { since: start || undefined });
        return { affiliate: a, posts: published.length, feedbacks, leads, sales, points };
      })
      .sort((a, b) => b.points - a.points);
  }, [affiliates, search, platform, status, fromISO, period]);

  return (
    <div className="screen">
      <h1>Affiliates</h1>

      <div className="filter-bar">
        <select className="select select-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <input className="input input-sm" placeholder="Search affiliate" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select select-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="👥" title="No affiliates match these filters" />
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Affiliate</th><th>Posts</th><th>Feedbacks</th><th>Leads</th>
                <th>Reported sales</th><th>Points</th><th>Last active</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.affiliate.id}>
                  <td>
                    <div className="table-affiliate">
                      <span className="avatar avatar-sm">{r.affiliate.name[0]?.toUpperCase()}</span>
                      <div>
                        <div>{r.affiliate.name}</div>
                        <div className="muted-sm">{r.affiliate.affiliate_code}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.posts}</td>
                  <td>{r.feedbacks}</td>
                  <td>{r.leads}</td>
                  <td>{r.sales}</td>
                  <td><strong>{r.points}</strong></td>
                  <td>{formatRelative(r.affiliate.last_active_at)}</td>
                  <td>
                    <span className={`chip ${isAffiliateActive(r.affiliate.id) ? 'chip-green' : 'chip-gray'}`}>
                      {isAffiliateActive(r.affiliate.id) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => manuallyAwardBadge(r.affiliate.id, 'Top Helper')}>
                      🏅 Award
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
