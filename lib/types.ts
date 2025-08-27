export type NormalizedReview = {
  id: string
  source: 'hostaway' | 'google'
  listingId: number
  listingName: string
  channel: string
  reviewType?: 'guest-to-host' | 'host-to-guest'
  status?: string
  rating: number | null
  title?: string | null
  text: string
  language?: string | null
  publishedAt: string // ISO
  author?: string | null
  categories: string[]
  sentiment: { score: number; label: 'positive' | 'neutral' | 'negative' }
  approved?: boolean
  url?: string | null
}

export type ReviewSummary = {
  byListing: Record<string, {
    listingId: number
    listingName: string
    count: number
    avgRating: number | null
    posPct: number
    negPct: number
    latest: string | null
    channels: Record<string, number>
    topIssues: { category: string; count: number }[]
  }>
  overall: {
    total: number
    avgRating: number | null
    posPct: number
    negPct: number
  }
}
