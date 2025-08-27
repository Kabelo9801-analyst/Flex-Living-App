import { NextRequest, NextResponse } from 'next/server'
import { normalizeHostawayReview, buildSummary } from '@/lib/normalize'
import type { NormalizedReview, HostawayRawReview } from '@/lib/types'
import { Redis } from '@upstash/redis'
import fs from 'node:fs/promises'
import path from 'node:path'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ✅ load approved reviews from Redis
async function loadApproved(): Promise<Record<string, boolean>> {
  const keys = await redis.keys('*')
  const entries = await Promise.all(keys.map(async key => [key, await redis.get<boolean>(key)]))
  return Object.fromEntries(entries)
}

const HOSTAWAY_BASE = 'https://api.hostaway.com/v1'

async function getAccessToken(): Promise<string | null> {
  const id = process.env.HOSTAWAY_ACCOUNT_ID
  const key = process.env.HOSTAWAY_API_KEY
  if (!id || !key) return null

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: key,
      scope: 'general',
    })

    const r = await fetch(`${HOSTAWAY_BASE}/accessTokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!r.ok) throw new Error(`Token error: ${r.status}`)
    const j = await r.json()
    return j?.access_token || null
  } catch {
    return null
  }
}

async function fetchHostawayReviews(token: string | null, searchParams: URLSearchParams) {
  if (!token) return { status: 'fail', result: [] }
  const url = new URL(`${HOSTAWAY_BASE}/reviews`)
  for (const k of [
    'listingMapIds[]',
    'limit',
    'offset',
    'sortBy',
    'sortOrder',
    'reservationId',
    'type',
    'statuses[]',
    'from',
    'to',
  ]) {
    if (searchParams.has(k)) url.searchParams.set(k, searchParams.get(k)!)
  }
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return { status: 'fail', result: [] }
  return r.json()
}

// Load mock reviews (fallback if Hostaway returns nothing)
async function loadMock(): Promise<any[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', 'mockReviews.json'), 'utf-8'))
  } catch {
    return []
  }}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = await getAccessToken()
  const api = await fetchHostawayReviews(token, searchParams).catch(() => ({ status: 'fail', result: [] }))
  const hostawayItems = Array.isArray(api?.result) ? api.result : []

  const mocked = await loadMock()
  const items = hostawayItems.length ? hostawayItems : mocked

  const approvedMap = await loadApproved()

  let normalized: NormalizedReview[] = items.map((r: HostawayRawReview) =>
    normalizeHostawayReview(r, approvedMap)
  )

  const listingIdParam = searchParams.get('listingId')
  const channel = searchParams.get('channel')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : null
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : null
  const q = searchParams.get('q')?.toLowerCase()

  if (listingIdParam) normalized = normalized.filter(r => String(r.listingId) === String(listingIdParam))
  if (channel) normalized = normalized.filter(r => r.channel.toLowerCase() === channel.toLowerCase())
  if (type) normalized = normalized.filter(r => (r.reviewType || '').toLowerCase() === type.toLowerCase())
  if (status) normalized = normalized.filter(r => (r.status || '').toLowerCase() === status.toLowerCase())
  if (from) normalized = normalized.filter(r => new Date(r.publishedAt) >= from)
  if (to) normalized = normalized.filter(r => new Date(r.publishedAt) <= to!)
  if (q) normalized = normalized.filter(r => (r.text || '').toLowerCase().includes(q))

  const withSummary = searchParams.get('summary') === '1'
  const payload = withSummary
    ? { reviews: normalized, summary: buildSummary(normalized) }
    : { reviews: normalized }

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}
