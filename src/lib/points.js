import { PUBLISHED_STATUSES } from './constants';

// Suggested point values for the MVP.
export const POINT_VALUES = {
  post_planned: 2,
  post_published: 10,
  post_link_added: 5,
  results_updated: 5,
  feedback_added: 10,
  lead_reported: 15, // per reported lead
  sale_reported: 30, // per reported sale
  consistency_bonus_week: 20, // posted 3x in one week
  consistency_badge_4weeks: 50, // posted every week for 4 weeks
};

export const ACTION_LABELS = {
  post_planned: 'Post planned',
  post_published: 'Post published',
  post_link_added: 'Post link added',
  results_updated: 'Reported results updated',
  feedback_added: 'Feedback added',
  lead_reported: 'Reported lead',
  sale_reported: 'Reported sale',
  consistency_bonus_week: 'Weekly consistency bonus (3 posts)',
  consistency_badge_4weeks: '4-week consistency badge',
};

const hasResultData = (p) =>
  [p.reported_views, p.reported_likes, p.reported_comments, p.reported_shares].some(
    (v) => v !== undefined && v !== null && v !== ''
  );

/**
 * Compares the previous and next version of a post and returns the list of
 * point-earning events that should be newly awarded. Each post tracks an
 * internal `_awarded` flag list so events are only granted once.
 */
export function diffPostForPoints(prevPost, nextPost) {
  const events = [];
  const awarded = new Set(nextPost._awarded || []);

  const award = (action_type, points, note) => {
    events.push({ action_type, points, note });
    awarded.add(action_type);
  };

  // Planning a post (creation) always earns the planning points, once.
  if (!prevPost && !awarded.has('post_planned')) {
    award('post_planned', POINT_VALUES.post_planned);
  }

  const wasPublished = prevPost ? PUBLISHED_STATUSES.includes(prevPost.status) : false;
  const isPublished = PUBLISHED_STATUSES.includes(nextPost.status);
  if (isPublished && !wasPublished && !awarded.has('post_published')) {
    award('post_published', POINT_VALUES.post_published);
  }

  const hadLink = !!(prevPost && prevPost.post_link);
  const hasLink = !!nextPost.post_link;
  if (hasLink && !hadLink && !awarded.has('post_link_added')) {
    award('post_link_added', POINT_VALUES.post_link_added);
  }

  const hadResults = prevPost ? hasResultData(prevPost) : false;
  const hasResults = hasResultData(nextPost);
  if (hasResults && !hadResults && !awarded.has('results_updated')) {
    award('results_updated', POINT_VALUES.results_updated);
  }

  const hadFeedback = !!(prevPost && prevPost.feedback && prevPost.feedback.trim());
  const hasFeedback = !!(nextPost.feedback && nextPost.feedback.trim());
  if (hasFeedback && !hadFeedback && !awarded.has('feedback_added')) {
    award('feedback_added', POINT_VALUES.feedback_added);
  }

  const prevLeads = Number(prevPost?.reported_leads) || 0;
  const nextLeads = Number(nextPost.reported_leads) || 0;
  if (nextLeads > prevLeads) {
    award('lead_reported', (nextLeads - prevLeads) * POINT_VALUES.lead_reported);
  }

  const prevSales = Number(prevPost?.reported_sales) || 0;
  const nextSales = Number(nextPost.reported_sales) || 0;
  if (nextSales > prevSales) {
    award('sale_reported', (nextSales - prevSales) * POINT_VALUES.sale_reported);
  }

  return { events, awarded: Array.from(awarded) };
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekKey(date) {
  const s = startOfWeek(date);
  return s.toISOString().slice(0, 10);
}

export function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
