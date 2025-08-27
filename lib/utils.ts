export const toISO = (dt?: string | null) => {
  if (!dt) return new Date(0).toISOString()
  const d = new Date(dt)
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}
export const clampRating = (n?: number | null) => {
  if (n == null) return null
  const c = Math.max(1, Math.min(5, Number(n)))
  return Math.round(c * 10) / 10
}
