// Guided walkthrough / onboarding tour definitions.
//
// Each step points at a `[data-tour="..."]` element somewhere in the app.
// `route`  — path the tour should navigate to before showing this step
//            (null = stay on whatever page the user is currently on, used
//            for steps that highlight a persistent nav item).
// `optional` — if the target element can't be found after a few retries
//            (e.g. a card that only renders when there's data, like "Next
//            Action" for a brand-new affiliate with no posts yet), the tour
//            silently skips to the next step instead of getting stuck.
// `beforeShow` — a named action the current page should react to before the
//            step is measured (e.g. expanding a collapsed form section).

export const CURRENT_WALKTHROUGH_VERSION = 1;

export const AFFILIATE_STEPS = [
  {
    id: 'welcome',
    route: '/',
    selector: '[data-tour="home-welcome"]',
    title: 'Welcome to Affiliate Calendar',
    text: 'This is your place to plan posts, track what you published, add reported results, collect parent feedback, and earn points on the leaderboard.',
  },
  {
    id: 'week-summary',
    route: '/',
    selector: '[data-tour="week-summary"]',
    title: 'Track your weekly progress',
    text: 'Here you can see how many posts you published, how many are planned, how many feedbacks you collected, and your current rank.',
  },
  {
    id: 'next-action',
    route: '/',
    selector: '[data-tour="next-action"]',
    title: 'Know what to do next',
    text: 'This section shows the most important action for you right now, like updating results or marking a planned post as posted.',
    optional: true,
  },
  {
    id: 'today-card',
    route: '/',
    selector: '[data-tour="today-card"]',
    title: "See what's planned for today",
    text: 'Planned posts appear here so you know what content to publish next.',
  },
  {
    id: 'mark-posted',
    route: '/',
    selector: '[data-tour="mark-posted-btn"]',
    title: 'Mark posts after publishing',
    text: 'After you publish your content on Instagram, Facebook, TikTok, or another platform, come back here and mark it as posted.',
    optional: true,
  },
  {
    id: 'nav-add-post',
    route: null,
    selector: '[data-tour="nav-add-post"]',
    title: 'Add a new post',
    text: 'Use this button to plan a future post or register a post you already published.',
  },
  {
    id: 'add-post-form',
    route: '/add',
    selector: '[data-tour="add-post-form"]',
    title: 'Fill in the post details',
    text: 'Add the title, platform, content type, date, status, and post link. Results are optional and can be added later.',
  },
  {
    id: 'reported-results',
    route: '/add',
    selector: '[data-tour="reported-results-toggle"]',
    beforeShow: 'expandResults',
    title: 'Add reported results',
    text: "Because this MVP doesn't connect to social media yet, you'll manually add views, comments, leads, and reported sales. This helps keep your progress organized — you can always update this later.",
  },
  {
    id: 'feedback-field',
    route: '/add',
    selector: '[data-tour="feedback-field"]',
    beforeShow: 'expandResults',
    title: 'Collect useful feedback',
    text: 'Add parent questions, objections, comments, or anything people ask after seeing your post. Feedback is just as valuable as sales — it helps Chalky understand what parents need.',
  },
  {
    id: 'nav-ideas',
    route: null,
    selector: '[data-tour="nav-ideas"]',
    title: 'Get post ideas',
    text: "Not sure what to post? Use the Ideas library. Pick an idea and add it directly to your calendar.",
  },
  {
    id: 'nav-calendar',
    route: null,
    selector: '[data-tour="nav-calendar"]',
    title: 'Plan your posting schedule',
    text: 'The calendar helps you organize planned posts, posted content, and posts that still need results.',
  },
  {
    id: 'nav-ranking',
    route: null,
    selector: '[data-tour="nav-ranking"]',
    title: 'Earn points and climb the leaderboard',
    text: 'You earn points by planning posts, publishing posts, updating results, collecting feedback, reporting leads, and reporting sales.',
  },
  {
    id: 'badges',
    route: '/',
    selector: '[data-tour="badges-section"]',
    title: 'Unlock badges',
    text: 'Badges celebrate milestones like your first post, consistent posting, helpful feedback, or reported sales.',
    optional: true,
  },
  {
    id: 'finish',
    route: '/',
    selector: '[data-tour="home-welcome"]',
    title: "You're ready to start",
    text: "You're all set. Start by adding your first post or checking today's planned content.",
    isFinish: true,
  },
];

export const ADMIN_STEPS = [
  {
    id: 'welcome',
    route: '/admin',
    selector: '[data-tour="admin-welcome"]',
    title: 'Welcome to the Admin Dashboard',
    text: 'This dashboard helps you see affiliate activity, reported results, feedback, leaderboard performance, and weekly reward opportunities.',
  },
  {
    id: 'week-stats',
    route: '/admin',
    selector: '[data-tour="admin-week-stats"]',
    title: 'See the program at a glance',
    text: 'These cards show total posts, total feedbacks, reported leads, reported sales, and active affiliates for the selected period.',
  },
  {
    id: 'affiliate-table',
    route: '/admin/affiliates',
    selector: '[data-tour="affiliate-table"]',
    title: 'Monitor affiliate activity',
    text: 'Use this table to see who is posting, who is active, who needs support, and who is generating the most engagement.',
  },
  {
    id: 'reported-results-table',
    route: '/admin/posts',
    selector: '[data-tour="reported-results-table"]',
    title: 'Review reported results',
    text: 'Results are manually entered by affiliates. Treat them as reported data, not verified analytics.',
  },
  {
    id: 'admin-feedback',
    route: '/admin',
    selector: '[data-tour="admin-feedback"]',
    title: 'Learn from parent feedback',
    text: 'This section shows parent questions, objections, and comments collected by affiliates. These insights can help improve marketing, product messaging, and content ideas.',
  },
  {
    id: 'nav-admin-ranking',
    route: null,
    selector: '[data-tour="nav-admin-ranking"]',
    title: 'Review leaderboard performance',
    text: 'The leaderboard ranks affiliates based on posts, consistency, feedback, leads, and reported sales.',
  },
  {
    id: 'weekly-winner',
    route: '/admin',
    selector: '[data-tour="weekly-winner"]',
    title: 'Identify weekly winners',
    text: 'Use rankings and activity data to choose gift card winners fairly. Consider both sales performance and useful feedback.',
    optional: true,
  },
  {
    id: 'ideas-management',
    route: '/admin/ideas',
    selector: '[data-tour="ideas-admin-toggle"]',
    title: 'Manage post ideas',
    text: 'Add, edit, or deactivate ideas that affiliates can use when planning content.',
  },
  {
    id: 'filters',
    route: '/admin/posts',
    selector: '[data-tour="admin-filters"]',
    title: 'Filter by week, campaign, or affiliate',
    text: 'Use filters to review activity by time period, platform, status, or individual affiliate.',
  },
  {
    id: 'export',
    route: '/admin/reports',
    selector: '[data-tour="export-btn"]',
    title: 'Create weekly summaries',
    text: 'Use reports to summarize what happened this week, which posts worked, what parents asked, and who performed well.',
  },
  {
    id: 'finish',
    route: '/admin',
    selector: '[data-tour="admin-welcome"]',
    title: "You're ready to manage the program",
    text: "Start by reviewing active affiliates, checking feedback, or looking at this week's leaderboard.",
    isFinish: true,
  },
];

export function stepsForRole(role) {
  return role === 'admin' ? ADMIN_STEPS : AFFILIATE_STEPS;
}
