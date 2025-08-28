'use client'
import { useEffect, useMemo, useState } from 'react'
import { Line, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement } from 'chart.js'
import { Switch } from '@/components/ui/switch'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement)

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
  const [filters, setFilters] = useState({ listingId: 'all', channel: 'all', minRating: 0, sentiment: 'all', source: 'all', search: '' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const baseUrl =typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    : ''
    const res = await fetch(`${baseUrl}/api/reviews/hostaway?summary=1`, { cache: 'no-store' })
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
      if (filters.search && !r.text.toLowerCase().includes(filters.search.toLowerCase())) return false
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

  const sentimentData = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 }
    for (const r of filtered) counts[r.sentiment.label]++
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [counts.positive, counts.neutral, counts.negative],
        backgroundColor: ['#22c55e', '#64748b', '#ef4444']
      }]
    }
  }, [filtered])

  async function toggleApproval(id: string, approved: boolean) {
    await fetch('/api/reviews/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved })
    })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-indigo-400">📊 Manager Dashboard</h1>

      {loading ? <div className="card">Loading reviews…</div> : (
        <>
          {/* KPI Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Total Reviews" value={summary?.overall.total ?? filtered.length} color="bg-blue-700" />
            <KPI title="Avg Rating" value={(summary?.overall.avgRating ?? 0).toFixed(2)} color="bg-green-700" />
            <KPI title="Positive %" value={(summary?.overall.posPct ?? 0) + '%'} color="bg-emerald-700" />
            <KPI title="Negative %" value={(summary?.overall.negPct ?? 0) + '%'} color="bg-red-700" />
          </section>

          {/* Filters */}
          <section className="card space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <input
                type="text"
                placeholder="🔍 Search reviews..."
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 flex-1"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              {/* Other filters remain same */}
            </div>
          </section>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="card">
              <h2 className="font-medium mb-4">Trend — Avg Rating by Month</h2>
              <Line data={{
                labels: trendData.labels,
                datasets: [{ label: 'Avg rating', data: trendData.data, borderColor: '#4ade80', backgroundColor: '#86efac' }]
              }} options={{ responsive: true, scales: { y: { suggestedMin: 1, suggestedMax: 5 } } }} />
            </section>

            <section className="card">
              <h2 className="font-medium mb-4">Sentiment Breakdown</h2>
              <Pie data={sentimentData} />
            </section>
          </div>

          {/* Reviews Table */}
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
                    <tr key={r.id} className="align-top hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 whitespace-nowrap">{new Date(r.publishedAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap">
                        <a href={`/properties/${r.listingId}`} className="hover:underline text-blue-400">
                          {r.listingName}
                        </a>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-indigo-700/50 text-indigo-200 text-xs">
                          {r.channel}
                        </span>
                      </td>
                      <td>{r.rating ?? '—'}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          r.sentiment.label === 'positive' ? 'bg-green-700/50 text-green-200'
                          : r.sentiment.label === 'negative' ? 'bg-red-700/50 text-red-200'
                          : 'bg-gray-700/50 text-gray-200'
                        }`}>
                          {r.sentiment.label}
                        </span>
                      </td>
                      <td className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {r.categories.map(c => (
                            <span key={c} className="px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 text-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="max-w-[540px]">
                        <p className="text-slate-200 line-clamp-3">{r.text}</p>
                      </td>
                      <td>
                        <Switch checked={!!r.approved} onCheckedChange={val => toggleApproval(r.id, val)} />
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

function KPI({ title, value, color }: { title: string, value: string | number, color: string }) {
  return (
    <div className={`card ${color} text-white`}>
      <div className="text-xs">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
