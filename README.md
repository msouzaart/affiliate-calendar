# Chalky CampaignFlow (MVP)

Affiliate posting calendar & campaign tracker. Affiliates plan posts, log what they published,
add manually reported results and parent feedback, and see their ranking against other affiliates.
Admins manage affiliates, review activity, and identify top performers.

## Status of this build

This app runs on a **real, shared Firebase backend** — Firestore (database) and Firebase
Authentication (real email/password accounts). There is no local/mock data anymore: every
affiliate and the admin read and write the same live database, from any device.

The data layer (`src/lib/db.js`) talks to five Firestore collections — `profiles`, `posts`,
`ideas`, `points`, `badges` — matching the fields described in the original product brief.
Security rules enforcing who can read/write what live in `firestore.rules`.

Sign-up/sign-in uses **real Firebase Authentication**: affiliates create their own account
from the app's "Create affiliate account" screen with a real password (minimum 6 characters),
and the first admin account is created the first time someone opens "Admin sign in" with no
admin yet configured. Passwords are never stored in the database — Firebase handles that.

The Ideas & Examples library ships with 14 starter content ideas across all categories, each with
a sample caption, "why this works" notes, suggested audience, and best time to post — that's
product content, seeded once into the `ideas` collection. Affiliates and posts start empty until
people sign up and post.

## Run it locally

You need a `.env.local` file in this folder with your Firebase project's config (never commit
this file — it's already in `.gitignore`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

(`.env.example` shows the exact variable names — copy it to `.env.local` and fill in the
values from Firebase console → Project settings → Your apps → SDK setup and configuration.)

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to http://localhost:5173). You'll land on "Find your
program" — enter anything (e.g. "Chalky") and continue, then choose to create an affiliate
account, sign in as an affiliate, or sign in as admin. The very first time anyone opens admin
sign-in with no admin account yet, they'll be prompted to create one.

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## What's implemented

- **Auth flow (real):** workspace/program entry → access choice → create affiliate account /
  affiliate sign in / admin sign in, backed by Firebase Authentication (email + password).
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
- **Profile:** affiliate's own stats, badges, and editable display name/email.
- **Admin Dashboard:** weekly totals, invite-link sharing, top-affiliate-of-the-week
  callout, posts needing review, best feedback, best performing ideas.
- **Admin Affiliates / Posts / Reports:** filterable tables (period, affiliate, platform,
  status) and a CSV export of posts.
- **Admin Settings:** change admin password (real Firebase Auth password change), view
  brand/program config.
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

## How affiliates join

There's no "admin creates the account for you" flow — Firebase's client-side sign-up would
sign the admin out and sign in as the new account if we did that. Instead, admins share the
app's link (Admin Dashboard → "Copy invite link"), and each affiliate creates their own
account from "Create affiliate account" with their own email and password.

## What was intentionally left out of this MVP

Per the brief: no social media integrations, no automatic click tracking, no payments, no
advanced analytics, no native app, no complex notifications.
