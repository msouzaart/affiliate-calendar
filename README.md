# Chalky CampaignFlow (MVP)

Affiliate posting calendar & campaign tracker. Affiliates plan posts, log what they published,
add manually reported results and parent feedback, and see their ranking against other affiliates.
Admins manage affiliates, review activity, and identify top performers.

## Status of this build

This MVP runs entirely on **mock local data** (stored in the browser's `localStorage`) — there
is no backend/database yet. The data layer (`src/lib/db.js`) mirrors a Supabase-style schema
(`users`, `posts`, `ideas`, `points`, `badges`) field-for-field, so swapping it for real Supabase
calls later shouldn't require touching any screen.

Sign-up/sign-in uses **simulated passwords**: accounts are created and checked against a password
stored in `localStorage` on the same device. This is enough to demo the real flow (workspace entry
→ choose access → create account/sign in) but is **not real security** — nothing is encrypted or
sent to a server. Don't reuse real passwords when testing this.

The Ideas & Examples library ships with 14 starter content ideas across all categories, each with
a sample caption, "why this works" notes, suggested audience, and best time to post — that's
product content, not demo data. Affiliates and posts start empty until people sign up and post.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to http://localhost:5173). You'll land on "Find your
program" — enter anything (e.g. "Chalky") and continue, then choose to create an affiliate
account, sign in as an affiliate, or sign in as admin. The admin account has no password yet
the first time — you'll be prompted to set one.

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## What's implemented

- **Auth flow (mock):** workspace/program entry → access choice → create affiliate account /
  affiliate sign in / admin sign in, each with simulated password fields.
- **Affiliate Home:** weekly summary, next action, today's planned post, badges.
- **Calendar:** Week / Month / List views, status chips, "needs results" indicator.
- **Add Post:** short-form flow with a collapsed, optional "reported results" section.
- **Post Detail:** all fields + Update results / Mark as posted / Mark as completed /
  Duplicate as new post / Duplicate as idea.
- **Ideas & Examples:** two-column browser (list + detail panel) with sample captions, "why
  this works", assets, suggested CTA, audience, and best time to post. Bookmark ideas for later.
- **Ranking:** Overall / Most Posts / Most Feedback / Most Consistent / Most Leads /
  Most Reported Sales, each with Week / Month / All-time, highlights "You", and a
  "X away from Top 3" nudge.
- **Profile:** affiliate's own stats, badges, and editable name/email.
- **Admin Dashboard:** weekly totals, create-affiliate shortcut, top-affiliate-of-the-week
  callout, posts needing review, best feedback, best performing ideas.
- **Admin Affiliates / Posts / Reports:** filterable tables (period, affiliate, platform,
  status) and a CSV export of posts.
- **Admin Settings:** change admin password, view brand/program config.
- **Points & badges engine:** awards points automatically based on the rules in the brief
  (planning, publishing, link added, results updated, feedback, leads, sales, weekly/4-week
  consistency) and auto-grants First Post / Lead Starter / First Sale / Feedback Hero /
  Consistent Creator badges. Weekly Winner and Top Helper are admin-awarded.
- **PWA basics:** manifest + a simple service worker so it can be installed on a phone.

## Brand

The product name, descriptor, and default admin identity all live in `src/lib/config.js` —
edit that file to point the app at a different program later. The logo is an inline SVG
component (`src/components/ui/Logo.jsx`), not an image file, so its colors follow the CSS
variables in `src/index.css` (`--navy`, `--coral`).

## Swapping in real Supabase later

1. Create the five tables from the brief (`users`, `posts`, `ideas`, `points`, `badges`) with
   matching column names — `src/lib/db.js` already uses those names.
2. Replace the function bodies in `src/lib/db.js` with `supabase-js` calls (the public function
   signatures — `listPosts`, `createPost`, `updatePost`, `getLeaderboard`, etc. — can stay the same).
3. Swap the mock sign-up/sign-in functions for Supabase Auth (hashed passwords, real sessions,
   password reset), and drive `currentUser` from the authenticated session instead of `localStorage`.
4. Nothing in `src/pages/*` (besides the auth screens) or `src/components/*` should need to change.

## What was intentionally left out of this MVP

Per the brief: no social media integrations, no automatic click tracking, no payments, no
advanced analytics, no native app, no complex notifications.
