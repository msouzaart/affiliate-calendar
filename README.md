# Affiliate Calendar (MVP)

A mobile-first tracking tool for affiliates: plan posts, log what you published,
add manually reported results and parent feedback, and see your ranking against other affiliates.

## Status of this build

This MVP runs entirely on **mock local data** (stored in the browser's `localStorage`),
per the brief. There is no backend yet — no Supabase, no real auth. This was an intentional
choice so the app is fully clickable today with zero setup. The data layer (`src/lib/db.js`)
mirrors the planned Supabase schema (`users`, `posts`, `ideas`, `points`, `badges`) field-for-field,
so swapping it for real Supabase calls later should not require touching any screen.

The Ideas library ships with ~14 starter content ideas across all 10 categories — that's
product content, not demo data. Affiliates and posts start empty, as requested.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173). On first load you'll land
on the Login screen — create an affiliate profile, or tap "Continue as Admin" to see the
admin views.

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## What's implemented

- **Login (mock):** pick/create an affiliate profile, or enter as the built-in Admin account.
- **Affiliate Home:** weekly summary, next action, today's planned post, badges.
- **Calendar:** Week / Month / List views, status chips, "needs results" indicator.
- **Add Post:** short-form flow with a collapsed, optional "reported results" section.
- **Post Detail:** all fields + Update results / Mark as posted / Mark as completed /
  Duplicate as new post / Duplicate as idea.
- **Ideas library:** filterable by category, "Add to calendar" pre-fills the Add Post form.
- **Ranking:** Overall / Most Posts / Most Feedback / Most Consistent / Most Leads /
  Most Reported Sales, each with Week / Month / All-time, highlights "You", and a
  "X away from Top 3" nudge.
- **Admin Dashboard:** weekly totals, gift-card winner suggestion, top affiliates, posts
  needing review, best feedback, best performing ideas.
- **Admin Affiliates / Posts / Reports:** filterable tables (period, affiliate, platform,
  status) and a CSV export of posts.
- **Points & badges engine:** awards points automatically based on the rules in the brief
  (planning, publishing, link added, results updated, feedback, leads, sales, weekly/4-week
  consistency) and auto-grants First Post / Lead Starter / First Sale / Feedback Hero /
  Consistent Creator badges. Weekly Winner and Top Helper are admin-awarded.
- **PWA basics:** manifest + a simple service worker so it can be installed on a phone.

## Swapping in real Supabase later

1. Create the five tables from the brief (`users`, `posts`, `ideas`, `points`, `badges`) with
   matching column names — `src/lib/db.js` already uses those names.
2. Replace the function bodies in `src/lib/db.js` with `supabase-js` calls (the public function
   signatures — `listPosts`, `createPost`, `updatePost`, `getLeaderboard`, etc. — can stay the same).
3. Swap the mock Login screen for Supabase Auth, and drive `currentUser` from the authenticated
   session instead of `localStorage`.
4. Nothing in `src/pages/*` or `src/components/*` should need to change.

## What was intentionally left out of this MVP

Per the brief: no social media integrations, no automatic click tracking, no payments, no
advanced analytics, no native app, no complex notifications.

## Deploying it

This app is meant to be deployed under your own accounts, not Chalky's — see [DEPLOY.md](./DEPLOY.md)
for the exact GitHub + Vercel steps. Once deployed it's reachable from any phone over HTTPS and
installable as a PWA.

## Rebranding for a different program

The product name is "Affiliate Calendar" everywhere (manifest, page title) so it stays neutral.
The built-in Ideas library content is generic too — no program name baked into the copy. To point
the app at a specific program later, edit `src/lib/config.js`.
