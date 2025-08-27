# Design & API Notes

## Tech stack
- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS** for modern, responsive UI
- **API routes** (`/app/api/*`) for server logic
- **Chart.js** via `react-chartjs-2` for a slim chart
- **Zod** (available for schema validation/extensions)

## Data model & normalization
The server exposes a normalized `NormalizedReview` shape used by the UI.

```ts
type NormalizedReview = {
  id: string
  source: 'hostaway' | 'google'
  listingId: number
  listingName: string
  channel: string
  reviewType?: 'guest-to-host' | 'host-to-guest'
  status?: string
  rating: number | null
  text: string
  publishedAt: string // ISO
  categories: string[]            // heuristic keyword mapping
  sentiment: { score: number, label: 'positive'|'neutral'|'negative' } // lightweight
  approved?: boolean              // set by manager
  url?: string | null             // link to Google place/reviewer if available
}
```

- **Categories** are extracted from keywords (see `lib/categories.ts`).  
- **Sentiment** uses a tiny lexicon-based heuristic (fast, explainable).

## API behaviors

### `GET /api/reviews/hostaway`
- Authenticates to Hostaway (if env is present), calls `GET /v1/reviews` and
  merges with **mocked** JSON when sandbox returns empty.
- Supports query params:  
  - `listingId`, `channel`, `type`, `status`, `from`, `to`, `q`, `summary=1`

- Returns:
```jsonc
{
  "reviews": [ /* NormalizedReview[] */ ],
  "summary": { /* optional ReviewSummary when summary=1 */ }
}
```

### `PATCH /api/reviews/approve`
- Body: `{ "id": string, "approved": boolean }`
- Persists to `data/approved.json` (for local/demo). For production,
  replace with DB persistence.

### `GET /api/reviews/google?placeId=...&listingId=...&listingName=...`
- Calls **Places API (New) `places.get`** and returns up to **5 reviews**.
- Requires `GOOGLE_MAPS_API_KEY` and `X-Goog-FieldMask: reviews,googleMapsUri`.
- Findings:
  - Places API returns **max 5** reviews (no pagination). For more,
    use **Google Business Profile API** `accounts.locations.reviews.list` (OAuth).
  - Replies to reviews are not always returned by Places API.

> See citations in the assignment response for the documentation links.

## UX design choices
- Focused on **actionability**: quick KPIs, aggressive filtering, and
  “approve for site” toggle in the same table.
- Color‑minimal UI for readability; accessible contrasts; responsive layout.
- **Trend chart** and **top issues** (summary) help spot recurring problems.
- Property page reproduces a Flex Living–style card layout and only shows
  **approved** reviews to keep the website tidy.

## Local testing tips
- Edit `data/mockReviews.json` to add more listings/reviews.
- Try approving some reviews in `/dashboard`, then check `/properties/{id}`.
- Add your own `placeId` to `.env.local` and call
  `/api/reviews/google?placeId=YOUR_PLACE_ID&listingId=1001&listingName=Shoreditch`

## Future work
- Persist approvals and manager actions in a DB with audit trail.
- Import reviews from other sources (Airbnb public pages, Booking, etc.) where permitted.
- Replace keyword categories with ML classifiers; add topic modeling.
- SLA alerts on sudden drops in rating or spikes in negative sentiment.
