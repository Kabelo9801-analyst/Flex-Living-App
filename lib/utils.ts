import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// app/lib/utils.ts

// Convert a date string to ISO (or fallback)
export function toISO(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString()
  return (typeof date === 'string' ? new Date(date) : date).toISOString()
}

// Clamp ratings between 1 and 5 stars
export function clampRating(rating: number | null | undefined): number | null {
  if (rating == null) return null
  return Math.max(1, Math.min(5, rating))
}

