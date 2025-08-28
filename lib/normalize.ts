import { channelName } from './channels'
import { scoreSentiment } from './sentiment'
import { CATEGORY_KEYWORDS } from './categories'
import { toISO, clampRating } from './utils'
import type { NormalizedReview, ReviewSummary } from './types'

export function normalizeHostawayReview(r: any, approvedMap: Record<string, boolean>): NormalizedReview {
  const text = (r.publicReview || r.privateFeedback || '').toString().trim()
  const cats = extractCategories(text)
  const s = scoreSentiment(text)
  const id = `hostaway:${r.id}`
  return {
    id,
    source: 'hostaway',
    listingId: r.listingMapId,
    listingName: r.listingName || `Listing ${r.listingMapId}`,
    channel: channelName(r.channelId),
    reviewType: r.type,
    status: r.status,
    rating: clampRating(r.rating),
    title: null,
    text,
    language: r.language || null,
    publishedAt: toISO(r.departureDate || r.arrivalDate),
    author: r.guestName || null,
    categories: cats,
    sentiment: s,
    approved: approvedMap[id] ?? false,        
    url: null
  }
}

// Google Places (New) 'reviews' array normalization
export function normalizeGoogleReview(g: any, listingId: number, listingName: string, placeUrl?: string, approvedMap: Record<string, boolean> = {}): NormalizedReview {
  const id = `google:${g.name || g.reviewId || g.createTime}`
  const text = g.text?.text || g.text || ''
  const cats = extractCategories(text)
  const s = scoreSentiment(text)
  return {
    id,
    source: 'google',
    listingId,
    listingName,
    channel: 'Google',
    rating: clampRating(g.rating),
    title: null,
    text,
    language: g.originalText?.languageCode || g.languageCode || null,
    publishedAt: toISO(g.createTime || g.relativePublishTimeDescription),
    author: g.authorAttribution?.displayName || null,
    categories: cats,
    sentiment: s,
    approved: Boolean(approvedMap[id]),
    url: g.authorAttribution?.uri || placeUrl || null
  }
}

export function buildSummary(reviews: NormalizedReview[]): ReviewSummary {
  const byListing: ReviewSummary['byListing'] = {}
  for (const r of reviews) {
    const key = String(r.listingId)
    if (!byListing[key]) {
      byListing[key] = {
        listingId: r.listingId,
        listingName: r.listingName,
        count: 0,
        avgRating: null,
        posPct: 0,
        negPct: 0,
        latest: null,
        channels: {},
        topIssues: []
      }
    }
    const b = byListing[key]
    b.count += 1
    if (r.rating != null) {
      const sum = (b.avgRating || 0) * (b.count - 1) + r.rating
      b.avgRating = Math.round((sum / b.count) * 100) / 100
    }
    const dt = new Date(r.publishedAt).toISOString()
    if (!b.latest || dt > b.latest) b.latest = dt
    b.channels[r.channel] = (b.channels[r.channel] || 0) + 1
  }

  // Top issues per listing (simple: most frequent categories with negative sentiment)
  for (const key of Object.keys(byListing)) {
    const catCounts: Record<string, number> = {}
    const total = reviews.filter(r => String(r.listingId) === key).length
    let pos = 0, neg = 0
    for (const r of reviews.filter(r => String(r.listingId) === key)) {
      if (r.sentiment.label === 'positive') pos++
      if (r.sentiment.label === 'negative') neg++
      for (const c of r.categories) catCounts[c] = (catCounts[c] || 0) + 1
    }
    byListing[key].posPct = total ? Math.round((pos / total) * 100) : 0
    byListing[key].negPct = total ? Math.round((neg / total) * 100) : 0
    byListing[key].topIssues = Object.entries(catCounts)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  const allRatings = reviews.map(r => r.rating).filter((n): n is number => n != null)
  const overall = {
    total: reviews.length,
    avgRating: allRatings.length ? Math.round((allRatings.reduce((a,b)=>a+b,0)/allRatings.length)*100)/100 : null,
    posPct: reviews.length ? Math.round((reviews.filter(r => r.sentiment.label==='positive').length / reviews.length) * 100) : 0,
    negPct: reviews.length ? Math.round((reviews.filter(r => r.sentiment.label==='negative').length / reviews.length) * 100) : 0
  }

  return { byListing, overall }
}

function extractCategories(text: string): string[] {
  const lc = (text || '').toLowerCase()
  const cats: string[] = []
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => lc.includes(k))) cats.push(cat)
  }
  return Array.from(new Set(cats))
}

