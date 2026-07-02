# Deploy guide (your own GitHub + Vercel + Firebase)

Run these from a terminal in `affiliate-calendar` on your computer (same folder where
`npm run dev` already works). This publishes the app under **your own accounts**, not
tied to Chalky's infrastructure.

## 1. Put the code in a Git repo

```bash
git init
git add -A
git commit -m "Initial commit"
```

## 2. Create an empty repo on GitHub

Go to https://github.com/new, name it (e.g. `affiliate-calendar`), keep it **empty**
(do not add a README/gitignore there — you already have one). Then:

```bash
git remote add origin https://github.com/<your-username>/affiliate-calendar.git
git branch -M main
git push -u origin main
```

## 3. Import it into Vercel

1. Go to https://vercel.com/new
2. Click "Import" next to the `affiliate-calendar` repo
3. Vercel auto-detects **Vite** — Build Command `npm run build`, Output Directory `dist`
   should already be filled in correctly. Leave them as is.
4. **Before clicking Deploy**, open "Environment Variables" and add these six (copy the
   values from your local `.env.local` file — never commit that file to Git):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **Deploy** and wait ~1 minute.

If you already deployed once before adding these variables, go to Project → Settings →
Environment Variables, add them there, then Project → Deployments → "..." on the latest
deployment → Redeploy.

You'll get a live URL like `https://affiliate-calendar-yourname.vercel.app` — that works
from any phone, anywhere, over HTTPS (required for the "install as app" PWA prompt).

## 4. Install it on your phone

Open the Vercel URL on your phone's browser, then:
- **iPhone (Safari):** Share icon → "Add to Home Screen"
- **Android (Chrome):** menu (⋮) → "Add to Home screen" / "Install app"

## 5. Shipping future changes

Every time you want to update the live app:

```bash
git add -A
git commit -m "describe what changed"
git push
```

Vercel redeploys automatically a few seconds after every push — no extra steps.

## Notes

- Data lives in a real, shared Firebase project (Firestore + Authentication) — every
  affiliate and the admin read and write the same database, from any device.
- Never commit `.env.local` — it holds your Firebase project's public config keys.
  It's already in `.gitignore`. Anyone deploying a copy of this app needs their own
  `.env.local` locally and the same six variables set in their own Vercel project.
- Firestore security rules live in `firestore.rules` — if you ever change the data
  model, update that file and redeploy the rules from the Firebase console
  (Firestore → Rules → paste → Publish).
- Custom domain: once deployed, Vercel → Project → Settings → Domains lets you attach
  your own domain instead of the `*.vercel.app` one.
