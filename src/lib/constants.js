export const PLATFORMS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'YouTube',
  'Pinterest',
  'Blog',
  'Email',
  'Other',
];

export const CONTENT_TYPES = [
  'Reel',
  'Video',
  'Story',
  'Static post',
  'Carousel',
  'Group post',
  'Comment',
  'Live',
  'Blog post',
  'Email',
  'Other',
];

export const STATUSES = [
  'Planned',
  'Posted',
  'Needs results',
  'Got feedback',
  'Got lead',
  'Got sale',
  'Completed',
];

// Statuses that count as "published" (post is live)
export const PUBLISHED_STATUSES = [
  'Posted',
  'Needs results',
  'Got feedback',
  'Got lead',
  'Got sale',
  'Completed',
];

export const STATUS_COLORS = {
  Planned: 'chip-gray',
  Posted: 'chip-blue',
  'Needs results': 'chip-amber',
  'Got feedback': 'chip-purple',
  'Got lead': 'chip-teal',
  'Got sale': 'chip-green',
  Completed: 'chip-dark',
};

export const IDEA_CATEGORIES = [
  'Reading',
  'Math',
  'Summer learning',
  'Homeschool',
  'Parent pain points',
  'Testimonials',
  'Product demo',
  'FAQ',
  'Comparison',
  'Personal story',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Advanced'];

export const BADGE_DEFS = {
  'First Post': { emoji: '🎉', description: 'Published your first post' },
  'Consistent Creator': { emoji: '🔥', description: 'Posted every week for 4 weeks' },
  'Feedback Hero': { emoji: '💬', description: 'Collected 10+ pieces of parent feedback' },
  'Lead Starter': { emoji: '🌱', description: 'Reported your first lead' },
  'First Sale': { emoji: '💰', description: 'Reported your first sale' },
  'Weekly Winner': { emoji: '🏆', description: 'Top affiliate of the week' },
  'Summer Sprint': { emoji: '☀️', description: 'Crushed the summer content sprint' },
  'Top Helper': { emoji: '⭐', description: 'Recognized by the team' },
};

export const RANKING_TABS = [
  { key: 'overall', label: 'Overall' },
  { key: 'posts', label: 'Most Posts' },
  { key: 'feedback', label: 'Most Feedback' },
  { key: 'consistency', label: 'Most Consistent' },
  { key: 'leads', label: 'Most Leads' },
  { key: 'sales', label: 'Most Reported Sales' },
];

export const PERIODS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];
