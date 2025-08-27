export const CHANNELS: Record<number, string> = {
  2005: 'Airbnb',
  2001: 'Booking.com',
  2010: 'Vrbo',
  2007: 'Hostaway',
  2002: 'Expedia',
  2013: 'Marriott'
}

export const channelName = (id?: number | null) => {
  if (!id && id !== 0) return 'Unknown'
  return CHANNELS[id] || `Channel ${id}`
}
