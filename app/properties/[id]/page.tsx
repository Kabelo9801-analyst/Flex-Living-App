import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizeHostawayReview } from '@/lib/normalize'
import type { NormalizedReview, HostawayRawReview } from '@/lib/types'

async function loadApproved() {
  try {
    return JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'approved.json'), 'utf-8')
    )
  } catch {
    return {}
  }
}

async function loadMock() {
  return JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data', 'mockReviews.json'), 'utf-8')
  )
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const mocked: HostawayRawReview[] = await loadMock()
  const approvedMap = await loadApproved()

  // ✅ Explicit typing for each step
  const reviews: NormalizedReview[] = mocked
    .filter((r: HostawayRawReview) => Number(r.listingMapId ?? r.listingId) === id)
    .map((r: HostawayRawReview) => normalizeHostawayReview(r, approvedMap))
    .filter((r: NormalizedReview) => r.approved)

  const listingName = reviews[0]?.listingName || `Listing ${id}`

  return (
    <div className="space-y-6">
      <section className="rounded-xl overflow-hidden border border-slate-800">
        <div className="h-56 bg-[url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="p-5 bg-slate-800/50">
          <h1 className="text-2xl font-semibold">{listingName}</h1>
          <p className="text-slate-400 text-sm mt-1">
            2 guests · 1 bed · 1 bath · WiFi · Kitchen
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Guest reviews</h2>
          <span className="text-sm text-slate-400">Only approved reviews are shown</span>
        </div>

        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm">No approved reviews yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <article key={r.id} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{r.author || 'Guest'}</div>
                  <div className="text-sm">⭐ {r.rating ?? r.derivedRating ?? '—'}</div>
                </div>
                <p className="text-slate-200">{r.text}</p>
                <div className="mt-2 text-xs text-slate-400">
                  {new Date(r.publishedAt).toLocaleDateString()} · {r.channel}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}