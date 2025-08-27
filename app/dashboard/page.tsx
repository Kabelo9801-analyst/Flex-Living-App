'use client'
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

type Review = {
  id: string
  source: 'hostaway' | 'google'
  listingId: number
  listingName: string
  channel: string
  rating: number | null
  text: string
  publishedAt: string
  categories: string[]
  sentiment: { score: number, label: 'positive' | 'neutral' | 'negative' }
  approved?: boolean
  status?: string
}

type Summary = {
  byListing: Record<string, { listingId: number, listingName: string, count: number, avgRating: number|null, posPct: number, negPct: number, latest: string|null, channels: Record<string,number>, topIssues: {category:string,count:number}[] }>
  overall: { total: number, avgRating: number | null, posPct: number, negPct: number }
}

export default function Dashboard() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ listingId: 'all', channel: 'all', minRating: 0, sentiment: 'all', source: 'all' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/reviews/hostaway?summary=1', { cache: 'no-store' })
      const j = await res.json()
      setReviews(j.reviews || [])
      setSummary(j.summary || null)
      setLoading(false)
    }
    load()
  }, [])

  const listings = useMemo(() => {
    const ids = Array.from(new Set(reviews.map(r => `${r.listingId}:::${r.listingName}`)))
    return ids.map(s => ({ id: Number(s.split(':::')[0]), name: s.split(':::')[1] }))
  }, [reviews])

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (filters.listingId !== 'all' && String(r.listingId) !== filters.listingId) return false
      if (filters.channel !== 'all' && r.channel !== filters.channel) return false
      if (filters.source !== 'all' && r.source !== filters.source) return false
      if (filters.minRating && (r.rating ?? 0) < filters.minRating) return false
      if (filters.sentiment !== 'all' && r.sentiment.label !== filters.sentiment) return false
      return true
    })
  }, [reviews, filters])

  const trendData = useMemo(() => {
    const byMonth: Record<string, number[]> = {}
    for (const r of filtered) {
      const d = new Date(r.publishedAt)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
      if (!byMonth[key]) byMonth[key] = []
      if (r.rating != null) byMonth[key].push(r.rating)
    }
    const labels = Object.keys(byMonth).sort()
    const data = labels.map(l => {
      const arr = byMonth[l]
      return arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*100)/100 : null
    })
    return { labels, data }
  }, [filtered])

  async function toggleApproval(id: string, approved: boolean) {
    await fetch('/api/reviews/approve', { method: 'PATCH', body: JSON.stringify({ id, approved }) })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manager Dashboard</h1>

      {loading ? <div className="card">Loading reviews…</div> : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPI title="Total reviews" value={summary?.overall.total ?? filtered.length} />
            <KPI title="Avg rating" value={(summary?.overall.avgRating ?? 0).toFixed(2)} />
            <KPI title="Positive %" value={(summary?.overall.posPct ?? 0) + '%'} />
            <KPI title="Negative %" value={(summary?.overall.negPct ?? 0) + '%'} />
          </section>

          <section className="card space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-400">Listing</label>
                <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  value={filters.listingId}
                  onChange={e => setFilters(f => ({ ...f, listingId: e.target.value }))}>
                  <option value="all">All</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400">Channel</label>
                <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  value={filters.channel}
                  onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}>
                  <option value="all">All</option>
                  {Array.from(new Set(reviews.map(r => r.channel))).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400">Source</label>
                <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  value={filters.source}
                  onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
                  <option value="all">All</option>
                  <option value="hostaway">Hostaway</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400">Min rating</label>
                <input type="number" step="0.5" min="0" max="5"
                  className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  value={filters.minRating}
                  onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Sentiment</label>
                <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  value={filters.sentiment}
                  onChange={e => setFilters(f => ({ ...f, sentiment: e.target.value }))}>
                  <option value="all">All</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="font-medium mb-4">Trend — Avg rating by month</h2>
            <Line data={{
              labels: trendData.labels,
              datasets: [{ label: 'Avg rating', data: trendData.data }]
            }} options={{ responsive: true, scales: { y: { suggestedMin: 1, suggestedMax: 5 } } }} />
          </section>

          <section className="card">
            <h2 className="font-medium mb-4">Reviews</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left">Listing</th>
                    <th className="text-left">Channel</th>
                    <th className="text-left">Rating</th>
                    <th className="text-left">Sentiment</th>
                    <th className="text-left">Categories</th>
                    <th className="text-left">Text</th>
                    <th className="text-left">Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filtered.map(r => (
                    <tr key={r.id} className="align-top">
                      <td className="py-3 whitespace-nowrap">{new Date(r.publishedAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap">
                        <a href={`/properties/${r.listingId}`} className="hover:underline">{r.listingName}</a>
                      </td>
                      <td className="whitespace-nowrap"><span className="badge">{r.channel}</span></td>
                      <td>{r.rating ?? '—'}</td>
                      <td>
                        <span className="badge">{r.sentiment.label}</span>
                      </td>
                      <td className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {r.categories.map(c => <span key={c} className="badge">{c}</span>)}
                        </div>
                      </td>
                      <td className="max-w-[540px]">
                        <p className="text-slate-200 line-clamp-4">{r.text}</p>
                      </td>
                      <td>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!r.approved}
                            onChange={e => toggleApproval(r.id, e.currentTarget.checked)}
                          />
                          <span className="text-xs text-slate-400">Show on site</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function KPI({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="card">
      <div className="text-slate-400 text-xs">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
