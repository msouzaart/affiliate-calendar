# Deploy guide (your own GitHub + Vercel)

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
4. Click **Deploy** and wait ~1 minute.

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

- Data is stored in each visitor's browser (`localStorage`), so every affiliate sees
  their own local data, not a shared database. That's expected for this MVP — see the
  README's "Swapping in real Supabase later" section for the upgrade path to a shared
  backend everyone reads/writes to.
- Custom domain: once deployed, Vercel → Project → Settings → Domains lets you attach
  your own domain instead of the `*.vercel.app` one.
