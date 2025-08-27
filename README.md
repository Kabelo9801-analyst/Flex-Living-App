# Flex Living — Reviews Dashboard

A full-stack reference implementation for a property reviews dashboard that
ingests Hostaway reviews (sandbox + mocked), normalizes multi-channel data,
lets managers filter/sort/approve reviews, and publishes approved reviews
into a property details page.

> Built with **Next.js (App Router) + TypeScript + Tailwind CSS**.  
> API routes implement normalization under `/api/reviews/*`.

---

## Quick start (local)

1) **Requirements**
   - Node.js 18+
   - pnpm (recommended) or npm/yarn

2) **Clone & install**
```bash
pnpm install
# or
npm install
```

3) **Environment variables** — create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

Update the following values:
- `HOSTAWAY_ACCOUNT_ID` and `HOSTAWAY_API_KEY` (sandbox).  
- `GOOGLE_MAPS_API_KEY` (optional; for Google Reviews exploration).

> Note: this project will automatically **fall back** to `/data/mockReviews.json`
> when the Hostaway sandbox returns 0 reviews.

4) **Run**
```bash
pnpm dev
# or
npm run dev
```
Open http://localhost:3000

- Manager Dashboard → `/dashboard`
- Sample Property Page → `/properties/1001` (IDs in `data/mockReviews.json`)

---

## What’s included

- **API**  
  - `GET /api/reviews/hostaway` → fetch & normalize Hostaway (or mocked) reviews.  
    Query params supported: `listingId`, `channel`, `type`, `status`, `from`, `to`, `q`, `summary`.
  - `GET /api/reviews/google?placeId=...` → basic Google Places (New) reviews integration (up to 5 reviews).  
  - `PATCH /api/reviews/approve` → toggle approval of a review (persisted to `data/approved.json`).

- **Dashboard UI** (`/dashboard`)  
  - Filters by **listing**, **channel**, **rating**, **category**, **date range**, **source**, **status**.  
  - Sort by rating/date.  
  - Trend line & top recurring issues.  
  - Approve/Unapprove reviews for public display.

- **Property page** (`/properties/[id]`)  
  - Simple Flex-Living-like layout with a **Reviews** section that only renders **approved** reviews.

- **Docs**  
  - `/docs/Design-and-API.md` → Tech stack, design choices, API behaviors, Google Reviews findings.

---

## Scripts

```jsonc
pnpm dev         # start dev server
pnpm build       # build for production
pnpm start       # run production build
pnpm lint        # eslint
```

---

## Notes
- This is a **reference** implementation. For production, wire the approval store
  to a persistent DB (Postgres/SQLite) instead of the file-based store.
- The Hostaway sandbox often returns **no reviews**. The route gracefully falls
  back to mocked reviews supplied under `data/mockReviews.json`.
