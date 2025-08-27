export const CATEGORIES = [
  'Cleanliness','Communication','Check-in','Accuracy','Location','Value',
  'Amenities','Noise','WiFi','Comfort','Parking','Host','Heating','AC','Safety'
] as const

// very light-weight keyword hints; tune as needed
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Cleanliness: ['clean', 'spotless', 'dirty', 'dust', 'smell', 'stain'],
  Communication: ['communication', 'responsive', 'respond', 'quick', 'host'],
  'Check-in': ['check-in', 'checkin', 'self check', 'lockbox', 'code'],
  Accuracy: ['accurate', 'exactly as', 'as described', 'misleading'],
  Location: ['location', 'area', 'neighborhood', 'central', 'walk', 'metro'],
  Value: ['value', 'price', 'worth'],
  Amenities: ['amenities', 'kitchen', 'coffee', 'towels', 'hairdryer','washer','dryer'],
  Noise: ['noise', 'noisy', 'quiet', 'street', 'traffic'],
  WiFi: ['wifi', 'wi-fi', 'internet', 'speed'],
  Comfort: ['bed', 'comfortable', 'mattress', 'pillow', 'sofa','shower'],
  Parking: ['parking', 'garage', 'park'],
  Host: ['host', 'helpful', 'friendly','rude'],
  Heating: ['heating', 'heater', 'radiator'],
  AC: ['ac', 'air conditioning', 'aircon'],
  Safety: ['safe', 'unsafe', 'security']
}
