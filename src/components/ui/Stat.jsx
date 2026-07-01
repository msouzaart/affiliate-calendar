export default function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <div className={`stat-value ${accent ? 'stat-value-accent' : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
