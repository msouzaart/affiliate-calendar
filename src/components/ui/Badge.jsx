import { BADGE_DEFS } from '../../lib/constants';

export default function Badge({ name }) {
  const def = BADGE_DEFS[name] || { emoji: '🏅', description: '' };
  return (
    <span className="badge-pill" title={def.description}>
      <span>{def.emoji}</span> {name}
    </span>
  );
}
