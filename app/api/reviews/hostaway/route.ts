import { NextRequest, NextResponse } from 'next/server'
import { normalizeHostawayReview, buildSummary } from '@/lib/normalize'
import { NormalizedReview } from '@/lib/types'
import fs from 'node:fs/promises'
import path from 'node:path'

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
      scope: 'general'
    })
    const r = await fetch(`${HOSTAWAY_BASE}/accessTokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!r.ok) throw new Error(`Token error: ${r.status}`)
    const j = await r.json()
    return j?.access_token || null
  } catch (e) {
    console.warn('Hostaway token error', e)
    return null
  }
}

async function fetchHostawayReviews(token: string | null, searchParams: URLSearchParams) {
  if (!token) return { status: 'fail', result: [] }
  const url = new URL(`${HOSTAWAY_BASE}/reviews`)
  // Supported query params we forward
  for (const k of ['listingMapIds[]','limit','offset','sortBy','sortOrder','reservationId','type','statuses[]','from','to']) {
    if (searchParams.has(k)) url.searchParams.set(k, searchParams.get(k)!)
  }
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return { status: 'fail', result: [] }
  return r.json()
}

async function loadMock(): Promise<any[]> {
  const file = path.join(process.cwd(), 'data', 'mockReviews.json')
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function loadApproved(): Promise<Record<string, boolean>> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(),'data','approved.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = await getAccessToken()
  const api = await fetchHostawayReviews(token, searchParams).catch(()=>({ status:'fail', result: [] }))

  // Combine sandbox (likely empty) with mocked JSON
  const hostawayItems = Array.isArray(api?.result) ? api.result : []
  const mocked = await loadMock()
  const items = (hostawayItems.length ? hostawayItems : mocked)

  const approvedMap = await loadApproved()

  // Filter client-side by query parameters (channel, date, rating, q)
  const channel = searchParams.get('channel')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : null
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : null
  const q = searchParams.get('q')?.toLowerCase()

  let normalized: NormalizedReview[] = items.map((r:any) => normalizeHostawayReview(r, approvedMap))

  if (channel) normalized = normalized.filter(r => r.channel.toLowerCase() === channel.toLowerCase())
  if (type) normalized = normalized.filter(r => (r.reviewType||'').toLowerCase() === type.toLowerCase())
  if (status) normalized = normalized.filter(r => (r.status||'').toLowerCase() === status.toLowerCase())
  if (from) normalized = normalized.filter(r => new Date(r.publishedAt) >= from)
  if (to) normalized = normalized.filter(r => new Date(r.publishedAt) <= to!)
  if (q) normalized = normalized.filter(r => (r.text||'').toLowerCase().includes(q))

  const withSummary = searchParams.get('summary') === '1'
  const payload = withSummary ? { reviews: normalized, summary: buildSummary(normalized) } : { reviews: normalized }

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}
