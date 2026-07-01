import { STATUS_COLORS } from '../../lib/constants';

export default function StatusChip({ status }) {
  const cls = STATUS_COLORS[status] || 'chip-gray';
  return <span className={`chip ${cls}`}>{status}</span>;
}
