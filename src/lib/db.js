// Firestore-backed data layer.
// Collections: profiles, posts, ideas, points, badges (see /firestore.rules for
// the matching security rules). Every function here is async and talks to a
// real, shared Firebase project — there is no local/mock fallback anymore.

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot,
} from 'firebase/firestore';
import { db as firestore } from './firebaseClient';
import { diffPostForPoints, startOfWeek, startOfMonth, weekKey, POINT_VALUES } from './points';
import { PUBLISHED_STATUSES } from './constants';

const col = (name) => collection(firestore, name);
const docToObj = (d) => ({ id: d.id, ...d.data() });

// ---------------------------------------------------------------------------
// Admin status (public flag — lets the sign-in screen check "does an admin
// account exist yet?" before anyone is authenticated)
// ---------------------------------------------------------------------------

export async function checkAdminExists() {
  try {
    const snap = await getDoc(doc(firestore, 'meta', 'adminStatus'));
    return snap.exists() && snap.data().exists === true;
  } catch (e) {
    return false;
  }
}

export async function markAdminCreated() {
  await setDoc(doc(firestore, 'meta', 'adminStatus'), { exists: true });
}

// ---------------------------------------------------------------------------
// Profiles (users)
// ---------------------------------------------------------------------------

export async function getUser(id) {
  if (!id) return null;
  const snap = await getDoc(doc(firestore, 'profiles', id));
  return snap.exists() ? docToObj(snap) : null;
}

export async function listUsers({ role } = {}) {
  const q = role ? query(col('profiles'), where('role', '==', role)) : col('profiles');
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

export function subscribeUsers({ role } = {}, callback) {
  const q = role ? query(col('profiles'), where('role', '==', role)) : col('profiles');
  return onSnapshot(q, (snap) => callback(snap.docs.map(docToObj)), () => callback([]));
}

function generateAffiliateCode(name) {
  const base = (name || 'AFF').trim().split(/\s+/)[0].toUpperCase().slice(0, 6);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

export async function createProfile(uid, { name, email, role = 'affiliate' }) {
  const now = new Date().toISOString();
  const profile = {
    name: name?.trim() || 'New Affiliate',
    email: email?.trim() || '',
    role,
    affiliate_code: role === 'affiliate' ? generateAffiliateCode(name) : null,
    avatar_url: null,
    saved_idea_ids: [],
    created_at: now,
    last_active_at: now,
  };
  await setDoc(doc(firestore, 'profiles', uid), profile);
  return { id: uid, ...profile };
}

export async function touchUserActive(id) {
  if (!id) return;
  try {
    await updateDoc(doc(firestore, 'profiles', id), { last_active_at: new Date().toISOString() });
  } catch (e) {
    /* ignore — best effort */
  }
}

export async function updateUser(id, patch) {
  await updateDoc(doc(firestore, 'profiles', id), patch);
  return getUser(id);
}

export async function isIdeaSaved(userId, ideaId) {
  const u = await getUser(userId);
  return !!u?.saved_idea_ids?.includes(ideaId);
}

export async function toggleSavedIdea(userId, ideaId) {
  const u = await getUser(userId);
  if (!u) return;
  const has = (u.saved_idea_ids || []).includes(ideaId);
  const next = has
    ? (u.saved_idea_ids || []).filter((id) => id !== ideaId)
    : [...(u.saved_idea_ids || []), ideaId];
  await updateDoc(doc(firestore, 'profiles', userId), { saved_idea_ids: next });
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function listPosts({ userId, platform, status, from, to } = {}) {
  const clauses = [];
  if (userId) clauses.push(where('user_id', '==', userId));
  if (platform) clauses.push(where('platform', '==', platform));
  if (status) clauses.push(where('status', '==', status));
  const q = clauses.length ? query(col('posts'), ...clauses) : col('posts');
  const snap = await getDocs(q);
  let posts = snap.docs.map(docToObj);
  if (from) posts = posts.filter((p) => p.date >= from);
  if (to) posts = posts.filter((p) => p.date <= to);
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function subscribePosts({ userId } = {}, callback) {
  const q = userId ? query(col('posts'), where('user_id', '==', userId)) : col('posts');
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(docToObj).sort((a, b) => (a.date < b.date ? 1 : -1))),
    () => callback([])
  );
}

export async function getPost(id) {
  if (!id) return null;
  const snap = await getDoc(doc(firestore, 'posts', id));
  return snap.exists() ? docToObj(snap) : null;
}

async function addPointEntry(userId, postId, action_type, points, periodKey) {
  if (!points) return;
  await addDoc(col('points'), {
    user_id: userId,
    post_id: postId || null,
    action_type,
    points,
    period_key: periodKey || null,
    created_at: new Date().toISOString(),
  });
}

async function recomputePostPoints(postId) {
  const snap = await getDocs(query(col('points'), where('post_id', '==', postId)));
  const total = snap.docs.reduce((sum, d) => sum + (d.data().points || 0), 0);
  await updateDoc(doc(firestore, 'posts', postId), { points: total });
  return total;
}

async function maybeAwardWeeklyConsistencyBonus(userId) {
  const wk = weekKey(new Date());
  const existing = await getDocs(
    query(col('points'), where('user_id', '==', userId), where('action_type', '==', 'consistency_bonus_week'))
  );
  if (existing.docs.some((d) => d.data().period_key === wk)) return;

  const start = startOfWeek(new Date());
  const posts = await listPosts({ userId });
  const postedThisWeek = posts.filter(
    (p) => PUBLISHED_STATUSES.includes(p.status) && new Date(p.date) >= start
  ).length;
  if (postedThisWeek >= 3) {
    await addPointEntry(userId, null, 'consistency_bonus_week', POINT_VALUES.consistency_bonus_week, wk);
  }
}

async function maybeAwardFourWeekBadge(userId) {
  const existing = await getDocs(
    query(col('badges'), where('user_id', '==', userId), where('badge_name', '==', 'Consistent Creator'))
  );
  if (existing.docs.length > 0) return;

  const posts = await listPosts({ userId });
  const weeksWithPost = new Set(
    posts.filter((p) => PUBLISHED_STATUSES.includes(p.status)).map((p) => weekKey(p.date))
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
    await awardBadge(userId, 'Consistent Creator');
    await addPointEntry(userId, null, 'consistency_badge_4weeks', POINT_VALUES.consistency_badge_4weeks, 'badge');
  }
}

async function checkAutoBadges(userId) {
  const posts = await listPosts({ userId });
  const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  if (published.length >= 1) await awardBadge(userId, 'First Post');

  const feedbackCount = posts.filter((p) => p.feedback && p.feedback.trim()).length;
  if (feedbackCount >= 10) await awardBadge(userId, 'Feedback Hero');

  const totalLeads = posts.reduce((sum, p) => sum + (Number(p.reported_leads) || 0), 0);
  if (totalLeads >= 1) await awardBadge(userId, 'Lead Starter');

  const totalSales = posts.reduce((sum, p) => sum + (Number(p.reported_sales) || 0), 0);
  if (totalSales >= 1) await awardBadge(userId, 'First Sale');

  await maybeAwardFourWeekBadge(userId);
}

export async function createPost(userId, data) {
  const now = new Date().toISOString();
  const post = {
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
    created_at: now,
    updated_at: now,
  };
  const ref = await addDoc(col('posts'), post);

  const { events } = diffPostForPoints(null, post);
  for (const e of events) await addPointEntry(userId, ref.id, e.action_type, e.points);
  await recomputePostPoints(ref.id);

  await maybeAwardWeeklyConsistencyBonus(userId);
  await checkAutoBadges(userId);
  await touchUserActive(userId);
  return getPost(ref.id);
}

export async function updatePost(id, patch) {
  const prev = await getPost(id);
  if (!prev) return null;
  const next = { ...prev, ...patch, updated_at: new Date().toISOString() };
  delete next.id;

  const { events } = diffPostForPoints(prev, next);
  for (const e of events) await addPointEntry(next.user_id, id, e.action_type, e.points);

  await updateDoc(doc(firestore, 'posts', id), next);
  await recomputePostPoints(id);

  await maybeAwardWeeklyConsistencyBonus(next.user_id);
  await checkAutoBadges(next.user_id);
  await touchUserActive(next.user_id);
  return getPost(id);
}

export async function deletePost(id) {
  const pointsSnap = await getDocs(query(col('points'), where('post_id', '==', id)));
  await Promise.all(pointsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(firestore, 'posts', id));
}

export async function duplicatePostAsNew(id, overrides = {}) {
  const original = await getPost(id);
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

export async function duplicatePostAsIdea(id) {
  const original = await getPost(id);
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

export async function listIdeas({ category, activeOnly = true } = {}) {
  const snap = await getDocs(col('ideas'));
  return snap.docs
    .map(docToObj)
    .filter((i) => (activeOnly ? i.is_active !== false : true))
    .filter((i) => (category ? i.category === category : true));
}

export function subscribeIdeas(callback) {
  return onSnapshot(col('ideas'), (snap) => callback(snap.docs.map(docToObj)), () => callback([]));
}

export async function getIdea(id) {
  if (!id) return null;
  const snap = await getDoc(doc(firestore, 'ideas', id));
  return snap.exists() ? docToObj(snap) : null;
}

export async function createIdea(data) {
  const idea = {
    title: data.title,
    category: data.category,
    suggested_platform: data.suggested_platform,
    suggested_content_type: data.suggested_content_type,
    hook: data.hook || '',
    cta: data.cta || '',
    reference_video_url: data.reference_video_url || '',
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
  const ref = await addDoc(col('ideas'), idea);
  return { id: ref.id, ...idea };
}

export async function incrementIdeaUsage(id) {
  const idea = await getIdea(id);
  if (!idea) return;
  await updateDoc(doc(firestore, 'ideas', id), { used_count: (idea.used_count || 0) + 1 });
}

// ---------------------------------------------------------------------------
// Points & Badges
// ---------------------------------------------------------------------------

export async function listPoints({ userId } = {}) {
  const q = userId ? query(col('points'), where('user_id', '==', userId)) : col('points');
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

export async function getUserTotalPoints(userId, { since } = {}) {
  const points = await listPoints({ userId });
  return points
    .filter((pt) => (since ? new Date(pt.created_at) >= since : true))
    .reduce((sum, pt) => sum + pt.points, 0);
}

export async function listBadges({ userId } = {}) {
  const q = userId ? query(col('badges'), where('user_id', '==', userId)) : col('badges');
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

export async function awardBadge(userId, badgeName) {
  const existing = await getDocs(
    query(col('badges'), where('user_id', '==', userId), where('badge_name', '==', badgeName))
  );
  if (existing.docs.length > 0) return null;
  const badge = { user_id: userId, badge_name: badgeName, earned_at: new Date().toISOString() };
  const ref = await addDoc(col('badges'), badge);
  return { id: ref.id, ...badge };
}

export async function manuallyAwardBadge(userId, badgeName) {
  return awardBadge(userId, badgeName);
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

export async function getAffiliateStats(userId, period = 'all') {
  const start = periodStart(period);
  const allPosts = await listPosts({ userId });
  const posts = allPosts.filter((p) => (start ? new Date(p.date) >= start : true));
  const published = posts.filter((p) => PUBLISHED_STATUSES.includes(p.status));
  const feedback = posts.filter((p) => p.feedback && p.feedback.trim()).length;
  const leads = posts.reduce((sum, p) => sum + (Number(p.reported_leads) || 0), 0);
  const sales = posts.reduce((sum, p) => sum + (Number(p.reported_sales) || 0), 0);
  const points = await getUserTotalPoints(userId, { since: start || undefined });

  const weeksWithPost = new Set(
    allPosts.filter((p) => PUBLISHED_STATUSES.includes(p.status)).map((p) => weekKey(p.date))
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

export async function getLeaderboard({ period = 'week', metric = 'overall' } = {}) {
  const affiliates = await listUsers({ role: 'affiliate' });
  const rows = await Promise.all(
    affiliates.map(async (u) => {
      const stats = await getAffiliateStats(u.id, period);
      return { user: u, ...stats };
    })
  );

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

export async function getPostsNeedingReview() {
  const posts = await listPosts({});
  return posts.filter(
    (p) =>
      PUBLISHED_STATUSES.includes(p.status) &&
      !p.feedback &&
      ![p.reported_views, p.reported_likes, p.reported_comments, p.reported_shares].some((v) => v !== '' && v != null)
  );
}

export async function getBestFeedback(limit = 5) {
  const posts = await listPosts({});
  return posts
    .filter((p) => p.feedback && p.feedback.trim())
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, limit);
}

export async function getBestPerformingIdeas(limit = 5) {
  const ideas = await listIdeas({});
  return [...ideas].sort((a, b) => (b.used_count || 0) - (a.used_count || 0)).slice(0, limit);
}

export async function isAffiliateActive(userId, days = 7) {
  const u = await getUser(userId);
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
