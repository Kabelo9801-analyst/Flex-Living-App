import { NextRequest, NextResponse } from 'next/server'
import { normalizeGoogleReview } from '@/lib/normalize'
import type { NormalizedReview } from '@/lib/types'
import fs from 'node:fs/promises'
import path from 'node:path'

const PLACES_BASE = 'https://places.googleapis.com/v1'

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
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  const placeId = searchParams.get('placeId')
  const listingId = Number(searchParams.get('listingId') || 0)
  const listingName = searchParams.get('listingName') || `Listing ${listingId || ''}`
  if (!apiKey || !placeId) {
    return NextResponse.json({ reviews: [], error: 'Missing GOOGLE_MAPS_API_KEY or placeId' }, { status: 200 })
  }

  // Places API (New) - Get Place with reviews field
  // Docs: https://developers.google.com/maps/documentation/places/web-service/place-details
  const url = new URL(`${PLACES_BASE}/places/${placeId}`)
  url.searchParams.set('fields', 'reviews,googleMapsUri,name')
  try {
    const r = await fetch(url.toString(), {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews,googleMapsUri,name'
      }
    })
    const j = await r.json()
    const approvedMap = await loadApproved()
    const reviews = (j.reviews || []).slice(0, 5).map((rv:any) =>
      normalizeGoogleReview(rv, listingId, listingName, j.googleMapsUri, approvedMap)
    ) as NormalizedReview[]
    return NextResponse.json({ reviews })
  } catch (e) {
    return NextResponse.json({ reviews: [], error: String(e) }, { status: 200 })
  }
}
