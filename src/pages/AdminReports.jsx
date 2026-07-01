import { useState } from 'react';
import { useDataVersion } from '../context/DataContext';
import { listPosts, listUsers, exportPostsCSV, getAffiliateStats } from '../lib/db';
import { PERIODS, PUBLISHED_STATUSES } from '../lib/constants';
import { startOfWeek, startOfMonth } from '../lib/points';
import Stat from '../components/ui/Stat';

function periodStart(period) {
  if (period === 'week') return startOfWeek(new Date());
  if (period === 'month') return startOfMonth(new Date());
  return null;
}

export default function AdminReports() {
  useDataVersion();
  const [period, setPeriod] = useState('month');
  const affiliates = listUsers({ role: 'affiliate' });
  const start = periodStart(period);
  const fromISO = start ? start.toISOString().slice(0, 10) : undefined;
  const posts = listPosts({ from: fromISO });
  const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  const feedbacks = posts.filter((p) => p.feedback && p.feedback.trim()).length;
  const leads = posts.reduce((s, p) => s + (Number(p.reported_leads) || 0), 0);
  const sales = posts.reduce((s, p) => s + (Number(p.reported_sales) || 0), 0);

  const handleExport = () => {
    const csv = exportPostsCSV(posts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-posts-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screen">
      <h1>Reports</h1>

      <div className="tab-row">
        {PERIODS.map((p) => (
          <button key={p.key} className={`tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-section-title">Summary — {PERIODS.find((p) => p.key === period)?.label}</div>
        <div className="stat-grid stat-grid-admin">
          <Stat label="Posts published" value={published.length} accent />
          <Stat label="Feedbacks collected" value={feedbacks} />
          <Stat label="Reported leads" value={leads} />
          <Stat label="Reported sales" value={sales} />
          <Stat label="Affiliates" value={affiliates.length} />
        </div>
      </section>

      <section className="card">
        <div className="card-section-title">Export</div>
        <p className="muted">Download all posts in this period as a CSV file, including reported results and points.</p>
        <button className="btn btn-primary" onClick={handleExport}>Export posts (.csv)</button>
      </section>

      <section className="card">
        <div className="card-section-title">Per-affiliate snapshot</div>
        {affiliates.length === 0 ? (
          <p className="muted">No affiliates yet.</p>
        ) : (
          affiliates.map((a) => {
            const stats = getAffiliateStats(a.id, period);
            return (
              <div key={a.id} className="admin-list-row">
                <span>{a.name}</span>
                <span>{stats.posts} posts · {stats.feedback} feedback · {stats.points} pts</span>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
