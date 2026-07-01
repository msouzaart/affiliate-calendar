import { APP_NAME } from '../../lib/config';

const [topWord, ...restWords] = APP_NAME.split(' ');
const mainWord = restWords.join(' ');

export default function Logo({ size = 36, withWordmark = true, reversed = false, compact = false }) {
  const navy = reversed ? '#FFFFFF' : '#102033';
  const coral = '#FF6B4A';

  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M46 15.5A22 22 0 1 0 46 48.5"
          stroke={navy}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <polyline
          points="15,41 27,31 39,36 50,22"
          stroke={coral}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="15" cy="41" r="4.5" fill={coral} />
        <circle cx="27" cy="31" r="4.5" fill={coral} />
        <circle cx="50" cy="22" r="4.5" fill={coral} />
      </svg>
      {withWordmark && (
        <span className={`brand-wordmark ${reversed ? 'brand-wordmark-reversed' : ''}`}>
          <span className="brand-wordmark-top">{topWord}</span>
          <span className="brand-wordmark-main">{mainWord}</span>
        </span>
      )}
    </span>
  );
}
