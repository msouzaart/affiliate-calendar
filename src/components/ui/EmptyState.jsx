export default function EmptyState({ emoji = '✨', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-emoji">{emoji}</div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {action}
    </div>
  );
}
