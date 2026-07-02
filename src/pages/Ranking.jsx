import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../lib/db';
import { RANKING_TABS, PERIODS } from '../lib/constants';
import EmptyState from '../components/ui/EmptyState';

const METRIC_VALUE_KEY = {
  overall: 'points',
  posts: 'posts',
  feedback: 'feedback',
  consistency: 'consistency',
  leads: 'leads',
  sales: 'sales',
};

const METRIC_SUFFIX = {
  overall: 'pts',
  posts: 'posts',
  feedback: 'feedback',
  consistency: 'wks active',
  leads: 'leads',
  sales: 'sales',
};

export default function Ranking({ adminView = false }) {
  const { currentUser } = useAuth();
  const [metric, setMetric] = useState('overall');
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLeaderboard({ period, metric }).then((r) => {
      if (alive) { setRows(r); setLoading(false); }
    });
    return () => { alive = false; };
  }, [period, metric]);

  const valueKey = METRIC_VALUE_KEY[metric];
  const myRow = !adminView && currentUser.role === 'affiliate' ? rows.find((r) => r.user.id === currentUser.id) : null;
  const periodLabel = PERIODS.find((p) => p.key === period)?.label;

  let nudgeMessage = null;
  if (myRow && myRow.position > 3 && rows.length >= 3) {
    const thirdPlace = rows[2];
    const gap = thirdPlace[valueKey] - myRow[valueKey];
    if (gap > 0) {
      nudgeMessage = `You're only ${gap} ${METRIC_SUFFIX[metric]} away from Top 3 ${periodLabel.toLowerCase()}.`;
    }
  }

  return (
    <div className="screen">
      <h1>Leaderboard — {periodLabel}</h1>

      <div className="tab-row">
        {PERIODS.map((p) => (
          <button key={p.key} className={`tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="chip-filter-row">
        {RANKING_TABS.map((t) => (
          <button key={t.key} className={`chip-filter ${metric === t.key ? 'active' : ''}`} onClick={() => setMetric(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState emoji="🏆" title="No affiliates yet" subtitle="Rankings will appear once affiliates start posting." />
      ) : (
        <div className="card leaderboard-card">
          {rows.map((r) => (
            <div
              key={r.user.id}
              className={`leaderboard-row ${myRow && r.user.id === myRow.user.id ? 'is-you' : ''} ${r.position <= 3 ? 'is-top3' : ''}`}
            >
              <div className="leaderboard-position">
                {r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : `#${r.position}`}
              </div>
              <div className="avatar avatar-sm">{r.user.name[0]?.toUpperCase()}</div>
              <div className="leaderboard-name">
                {myRow && r.user.id === myRow.user.id ? 'You' : r.user.name}
              </div>
              <div className="leaderboard-value">{r[valueKey]} {METRIC_SUFFIX[metric]}</div>
            </div>
          ))}
        </div>
      )}

      {nudgeMessage && <div className="nudge-banner">🎯 {nudgeMessage}</div>}
    </div>
  );
}
