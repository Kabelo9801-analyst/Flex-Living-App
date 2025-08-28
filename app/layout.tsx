import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Flex Living –  Dashboard',
  description: 'Assess per‑property performance based on guest reviews'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800/80 bg-slate-900 sticky top-0 z-10">
          <div className="container flex items-center justify-between h-14">
            <a href="/" className="font-semibold tracking-wide">Flex Living • Reviews</a>
            <nav className="flex gap-4 text-sm">
              <a className="hover:underline" href="/dashboard">Dashboard</a>
              <a className="hover:underline" href="/properties/1001">Property page</a>
              <a className="hover:underline" href="https://developers.google.com/maps/documentation/places/web-service/place-details" target="_blank">Google Reviews</a>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
        <footer className="container py-10 text-xs text-slate-400">
          Created by Kabelo Thato Ratshefola [Flex Living AI Engineer 😉].
        </footer>
      </body>
    </html>
  )
}
