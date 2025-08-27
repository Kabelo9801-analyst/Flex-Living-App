// Extremely lightweight sentiment approximation (lexicon based)
const POS = ['great','amazing','awesome','clean','spotless','friendly','helpful','perfect','excellent','fantastic','spacious','cozy','quiet','recommend','comfortable','love']
const NEG = ['bad','dirty','smell','noisy','rude','terrible','awful','disappoint','broken','unsafe','issue','problem','bug','delay','poor','worst']

export function scoreSentiment(text: string) {
  const lc = (text || '').toLowerCase()
  let s = 0
  for (const w of POS) if (lc.includes(w)) s += 1
  for (const w of NEG) if (lc.includes(w)) s -= 1
  const label = s > 0 ? 'positive' : s < 0 ? 'negative' : 'neutral'
  return { score: s, label } as const
}
