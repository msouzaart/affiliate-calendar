// Mock "Supabase-like" local data layer.
// Schema mirrors the planned Supabase tables (users, posts, ideas, points, badges)
// so this module can be swapped for real Supabase calls later without touching
// the UI layer — every function here returns plain objects/arrays.

import { buildSeedIdeas } from './seedIdeas';
import { diffPostForPoints, startOfWeek, startOfMonth, weekKey, POINT_VALUES } from './points';
import { PUBLISHED_STATUSES } from './constants';
import { DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL } from './config';

const STORAGE_KEY = 'affiliate_calendar_db_v1';
const listeners = new Set();

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultDB() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin_default',
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL,
        role: 'admin',
        affiliate_code: null,
        avatar_url: null,
        username: null,
        password: null, // set on first admin sign-in — mock only, not real security
        saved_idea_ids: [],
        created_at: now,
        last_active_at: now,
      },
    ],
    posts: [],
    ideas: buildSeedIdeas(),
    points: [],
    badges: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    // Backfill in case of older shape / missing keys
    return { ...defaultDB(), ...parsed, ideas: parsed.ideas?.length ? parsed.ideas : buildSeedIdeas() };
  } catch (e) {
    const fresh = defaultDB();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

let DB = load();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  listeners.forEach((cb) => cb());
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetAllData() {
  DB = defaultDB();
  persist();
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function listUsers({ role } = {}) {
  return DB.users.filter((u) => (role ? u.role === role : true));
}

export function getUser(id) {
  return DB.users.find((u) => u.id === id) || null;
}

function generateAffiliateCode(name) {
  const base = (name || 'AFF').trim().split(/\s+/)[0].toUpperCase().slice(0, 6);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

export function createUser({ name, email, role = 'affiliate', username, password }) {
  const now = new Date().toISOString();
  const user = {
    id: uid('user'),
    name: name?.trim() || 'New Affiliate',
    email: email?.trim() || '',
    role,
    affiliate_code: role === 'affiliate' ? generateAffiliateCode(name) : null,
    avatar_url: null,
    username: username?.trim() || null,
    password: password || null, // mock only — plaintext, local device storage, not real security
    saved_idea_ids: [],
    created_at: now,
    last_active_at: now,
  };
  DB.users.push(user);
  persist();
  return user;
}

export function touchUserActive(id) {
  const u = getUser(id);
  if (!u) return;
  u.last_active_at = new Date().toISOString();
  persist();
}

export function updateUser(id, patch) {
  const u = getUser(id);
  if (!u) return null;
  Object.assign(u, patch);
  persist();
  return u;
}

export function changeAdminPassword(oldPassword, newPassword) {
  const admin = DB.users.find((u) => u.role === 'admin');
  if (!admin) return { error: 'No admin account found.' };
  if (admin.password && admin.password !== oldPassword) return { error: 'Current password is incorrect.' };
  admin.password = newPassword;
  persist();
  return { user: admin };
}

// ---------------------------------------------------------------------------
// Mock auth (local device only — no real backend/security)
// ---------------------------------------------------------------------------

function findByIdentifier(identifier, role) {
  const needle = (identifier || '').trim().toLowerCase();
  if (!needle) return null;
  return (
    DB.users.find(
      (u) =>
        u.role === role &&
        ((u.email && u.email.toLowerCase() === needle) || (u.username && u.username.toLowerCase() === needle))
    ) || null
  );
}

export function isEmailOrUsernameTaken(identifier) {
  const needle = (identifier || '').trim().toLowerCase();
  if (!needle) return false;
  return DB.users.some(
    (u) => (u.email && u.email.toLowerCase() === needle) || (u.username && u.username.toLowerCase() === needle)
  );
}

export function signUpAffiliate({ name, email, username, password }) {
  if (isEmailOrUsernameTaken(email) || isEmailOrUsernameTaken(username)) {
    return { error: 'That email or username is already in use.' };
  }
  const user = createUser({ name, email, role: 'affiliate', username, password });
  return { user };
}

export function signInAffiliate({ identifier, password }) {
  const user = findByIdentifier(identifier, 'affiliate');
  if (!user) return { error: 'No affiliate found with that email or username.' };
  if (!user.password) return { error: 'This account has no password set yet. Create a new account instead.' };
  if (user.password !== password) return { error: 'Incorrect password.' };
  return { user };
}

export function adminNeedsSetup() {
  const admin = DB.users.find((u) => u.role === 'admin');
  return !!admin && !admin.password;
}

export function setAdminPassword(password) {
  const admin = DB.users.find((u) => u.role === 'admin');
  if (!admin) return null;
  admin.password = password;
  persist();
  return admin;
}

export function signInAdmin({ email, password }) {
  const admin = DB.users.find((u) => u.role === 'admin');
  if (!admin) return { error: 'No admin account found.' };
  if (admin.email.toLowerCase() !== (email || '').trim().toLowerCase()) {
    return { error: 'No admin found with that email.' };
  }
  if (!admin.password) return { error: 'Admin password has not been set up yet.' };
  if (admin.password !== password) return { error: 'Incorrect password.' };
  return { user: admin };
}

// ---------------------------------------------------------------------------
// Saved ideas (bookmarks)
// ---------------------------------------------------------------------------

export function isIdeaSaved(userId, ideaId) {
  const u = getUser(userId);
  return !!u?.saved_idea_ids?.includes(ideaId);
}

export function toggleSavedIdea(userId, ideaId) {
  const u = getUser(userId);
  if (!u) return;
  if (!u.saved_idea_ids) u.saved_idea_ids = [];
  if (u.saved_idea_ids.includes(ideaId)) {
    u.saved_idea_ids = u.saved_idea_ids.filter((id) => id !== ideaId);
  } else {
    u.saved_idea_ids.push(ideaId);
  }
  persist();
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export function listPosts({ userId, platform, status, from, to } = {}) {
  return DB.posts
    .filter((p) => (userId ? p.user_id === userId : true))
    .filter((p) => (platform ? p.platform === platform : true))
    .filter((p) => (status ? p.status === status : true))
    .filter((p) => (from ? p.date >= from : true))
    .filter((p) => (to ? p.date <= to : true))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(id) {
  return DB.posts.find((p) => p.id === id) || null;
}

function addPointEntry(userId, postId, action_type, points, periodKey) {
  if (!points) return;
  DB.points.push({
    id: uid('pt'),
    user_id: userId,
    post_id: postId,
    action_type,
    points,
    period_key: periodKey || null,
    created_at: new Date().toISOString(),
  });
}

function recomputePostPoints(post) {
  post.points = DB.points
    .filter((pt) => pt.post_id === post.id)
    .reduce((sum, pt) => sum + pt.points, 0);
}

function maybeAwardWeeklyConsistencyBonus(userId) {
  const wk = weekKey(new Date());
  const already = DB.points.some(
    (pt) => pt.user_id === userId && pt.action_type === 'consistency_bonus_week' && pt.period_key === wk
  );
  if (already) return;
  const start = startOfWeek(new Date());
  const postedThisWeek = DB.posts.filter(
    (p) =>
      p.user_id === userId &&
      PUBLISHED_STATUSES.includes(p.status) &&
      new Date(p.date) >= start
  ).length;
  if (postedThisWeek >= 3) {
    addPointEntry(userId, null, 'consistency_bonus_week', POINT_VALUES.consistency_bonus_week, wk);
  }
}

function maybeAwardFourWeekBadge(userId) {
  const already = DB.badges.some((b) => b.user_id === userId && b.badge_name === 'Consistent Creator');
  if (already) return;
  // Check the last 4 ISO week buckets each have at least one published post.
  const weeksWithPost = new Set(
    DB.posts
      .filter((p) => p.user_id === userId && PUBLISHED_STATUSES.includes(p.status))
      .map((p) => weekKey(p.date))
  );
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    if (weeksWithPost.has(weekKey(d))) {
      streak++;
      if (streak >= 4) break;
    } else if (i > 0) {
      break;
    }
  }
  if (streak >= 4) {
    awardBadge(userId, 'Consistent Creator');
    addPointEntry(userId, null, 'consistency_badge_4weeks', POINT_VALUES.consistency_badge_4weeks, 'badge');
  }
}

function checkAutoBadges(userId) {
  const posts = DB.posts.filter((p) => p.user_id === userId);
  const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  if (published.length >= 1) awardBadge(userId, 'First Post');

  const feedbackCount = posts.filter((p) => p.feedback && p.feedback.trim()).length;
  if (feedbackCount >= 10) awardBadge(userId, 'Feedback Hero');

  const totalLeads = posts.reduce((sum, p) => sum + (Number(p.reported_leads) || 0), 0);
  if (totalLeads >= 1) awardBadge(userId, 'Lead Starter');

  const totalSales = posts.reduce((sum, p) => sum + (Number(p.reported_sales) || 0), 0);
  if (totalSales >= 1) awardBadge(userId, 'First Sale');

  maybeAwardFourWeekBadge(userId);
}

export function createPost(userId, data) {
  const now = new Date().toISOString();
  const post = {
    id: uid('post'),
    user_id: userId,
    title: data.title?.trim() || 'Untitled post',
    platform: data.platform || 'Instagram',
    content_type: data.content_type || 'Static post',
    date: data.date || now.slice(0, 10),
    status: data.status || 'Planned',
    post_link: data.post_link || '',
    reported_views: data.reported_views ?? '',
    reported_likes: data.reported_likes ?? '',
    reported_comments: data.reported_comments ?? '',
    reported_shares: data.reported_shares ?? '',
    reported_leads: data.reported_leads ?? '',
    reported_sales: data.reported_sales ?? '',
    feedback: data.feedback || '',
    notes: data.notes || '',
    idea_id: data.idea_id || null,
    points: 0,
    _awarded: [],
    created_at: now,
    updated_at: now,
  };
  DB.posts.push(post);

  const { events, awarded } = diffPostForPoints(null, post);
  events.forEach((e) => addPointEntry(userId, post.id, e.action_type, e.points));
  post._awarded = awarded;
  recomputePostPoints(post);

  maybeAwardWeeklyConsistencyBonus(userId);
  checkAutoBadges(userId);
  touchUserActive(userId);
  persist();
  return post;
}

export function updatePost(id, patch) {
  const post = getPost(id);
  if (!post) return null;
  const prevSnapshot = { ...post };
  const next = { ...post, ...patch, updated_at: new Date().toISOString() };

  const { events, awarded } = diffPostForPoints(prevSnapshot, next);
  events.forEach((e) => addPointEntry(next.user_id, next.id, e.action_type, e.points));
  next._awarded = awarded;

  Object.assign(post, next);
  recomputePostPoints(post);

  maybeAwardWeeklyConsistencyBonus(post.user_id);
  checkAutoBadges(post.user_id);
  touchUserActive(post.user_id);
  persist();
  return post;
}

export function deletePost(id) {
  DB.posts = DB.posts.filter((p) => p.id !== id);
  DB.points = DB.points.filter((pt) => pt.post_id !== id);
  persist();
}

export function duplicatePostAsNew(id, overrides = {}) {
  const original = getPost(id);
  if (!original) return null;
  return createPost(original.user_id, {
    title: `${original.title} (copy)`,
    platform: original.platform,
    content_type: original.content_type,
    date: new Date().toISOString().slice(0, 10),
    status: 'Planned',
    notes: original.notes,
    ...overrides,
  });
}

export function duplicatePostAsIdea(id) {
  const original = getPost(id);
  if (!original) return null;
  return createIdea({
    title: original.title,
    category: 'Personal story',
    suggested_platform: original.platform,
    suggested_content_type: original.content_type,
    hook: original.notes || '',
    cta: 'Try it this summer.',
    difficulty: 'Easy',
    estimated_time: '20 min',
  });
}

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

export function listIdeas({ category, activeOnly = true } = {}) {
  return DB.ideas
    .filter((i) => (activeOnly ? i.is_active : true))
    .filter((i) => (category ? i.category === category : true));
}

export function getIdea(id) {
  return DB.ideas.find((i) => i.id === id) || null;
}

export function createIdea(data) {
  const idea = {
    id: uid('idea'),
    title: data.title,
    category: data.category,
    suggested_platform: data.suggested_platform,
    suggested_content_type: data.suggested_content_type,
    hook: data.hook || '',
    cta: data.cta || '',
    difficulty: data.difficulty || 'Easy',
    estimated_time: data.estimated_time || '15 min',
    is_active: true,
    used_count: 0,
    sample_caption: data.sample_caption || data.hook || '',
    why_this_works: data.why_this_works || [],
    assets: data.assets || [],
    suggested_cta: data.suggested_cta || data.cta || '',
    recommended_audience: data.recommended_audience || '',
    best_time_to_post: data.best_time_to_post || '',
    created_at: new Date().toISOString(),
  };
  DB.ideas.unshift(idea);
  persist();
  return idea;
}

export function incrementIdeaUsage(id) {
  const idea = getIdea(id);
  if (!idea) return;
  idea.used_count = (idea.used_count || 0) + 1;
  persist();
}

// ---------------------------------------------------------------------------
// Points & Badges
// ---------------------------------------------------------------------------

export function listPoints({ userId } = {}) {
  return DB.points.filter((pt) => (userId ? pt.user_id === userId : true));
}

export function getUserTotalPoints(userId, { since } = {}) {
  return DB.points
    .filter((pt) => pt.user_id === userId)
    .filter((pt) => (since ? new Date(pt.created_at) >= since : true))
    .reduce((sum, pt) => sum + pt.points, 0);
}

export function listBadges({ userId } = {}) {
  return DB.badges.filter((b) => (userId ? b.user_id === userId : true));
}

export function awardBadge(userId, badgeName) {
  const exists = DB.badges.some((b) => b.user_id === userId && b.badge_name === badgeName);
  if (exists) return null;
  const badge = { id: uid('badge'), user_id: userId, badge_name: badgeName, earned_at: new Date().toISOString() };
  DB.badges.push(badge);
  return badge;
}

export function manuallyAwardBadge(userId, badgeName) {
  const badge = awardBadge(userId, badgeName);
  persist();
  return badge;
}

// ---------------------------------------------------------------------------
// Leaderboard / aggregation
// ---------------------------------------------------------------------------

function periodStart(period) {
  const now = new Date();
  if (period === 'week') return startOfWeek(now);
  if (period === 'month') return startOfMonth(now);
  return null; // all time
}

export function getAffiliateStats(userId, period = 'all') {
  const start = periodStart(period);
  const posts = DB.posts.filter((p) => p.user_id === userId).filter((p) => (start ? new Date(p.date) >= start : true));
  const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  const feedback = posts.filter((p) => p.feedback && p.feedback.trim()).length;
  const leads = posts.reduce((sum, p) => sum + (Number(p.reported_leads) || 0), 0);
  const sales = posts.reduce((sum, p) => sum + (Number(p.reported_sales) || 0), 0);
  const points = getUserTotalPoints(userId, { since: start || undefined });

  const weeksWithPost = new Set(
    DB.posts
      .filter((p) => p.user_id === userId && PUBLISHED_STATUSES.includes(p.status))
      .map((p) => weekKey(p.date))
  );
  let consistency = 0;
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    if (weeksWithPost.has(weekKey(d))) consistency++;
  }

  return {
    posts: published.length,
    plannedPosts: posts.filter((p) => p.status === 'Planned').length,
    feedback,
    leads,
    sales,
    points,
    consistency,
  };
}

export function getLeaderboard({ period = 'week', metric = 'overall' } = {}) {
  const affiliates = listUsers({ role: 'affiliate' });
  const rows = affiliates.map((u) => {
    const stats = getAffiliateStats(u.id, period);
    return { user: u, ...stats };
  });

  const sortKey = {
    overall: 'points',
    posts: 'posts',
    feedback: 'feedback',
    consistency: 'consistency',
    leads: 'leads',
    sales: 'sales',
  }[metric] || 'points';

  rows.sort((a, b) => b[sortKey] - a[sortKey] || b.points - a.points);
  rows.forEach((r, idx) => (r.position = idx + 1));
  return rows;
}

// ---------------------------------------------------------------------------
// Admin helpers
// ---------------------------------------------------------------------------

export function getPostsNeedingReview() {
  return DB.posts.filter(
    (p) =>
      PUBLISHED_STATUSES.includes(p.status) &&
      !p.feedback &&
      ![p.reported_views, p.reported_likes, p.reported_comments, p.reported_shares].some((v) => v !== '' && v != null)
  );
}

export function getBestFeedback(limit = 5) {
  return DB.posts
    .filter((p) => p.feedback && p.feedback.trim())
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, limit);
}

export function getBestPerformingIdeas(limit = 5) {
  return [...DB.ideas].sort((a, b) => (b.used_count || 0) - (a.used_count || 0)).slice(0, limit);
}

export function isAffiliateActive(userId, days = 7) {
  const u = getUser(userId);
  if (!u || !u.last_active_at) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(u.last_active_at) >= cutoff;
}

export function exportPostsCSV(posts) {
  const headers = [
    'title', 'platform', 'content_type', 'date', 'status', 'post_link',
    'reported_views', 'reported_likes', 'reported_comments', 'reported_shares',
    'reported_leads', 'reported_sales', 'feedback', 'points',
  ];
  const rows = posts.map((p) => headers.map((h) => `"${String(p[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}
