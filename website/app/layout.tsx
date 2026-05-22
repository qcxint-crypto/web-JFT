import type { Metadata } from 'next'
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const bodyFont = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700', '900'],
})

export const metadata: Metadata = {
  title: 'rananwari JFT + Kanji Lab',
  description: 'Practice JFT and Kanji with weekly rankings, light and dark mode, and calmer long-session study flows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body suppressHydrationWarning>
        <div className="app-shell">
          <div className="app-shell__glow app-shell__glow--top" aria-hidden="true" />
          <div className="app-shell__glow app-shell__glow--bottom" aria-hidden="true" />

          <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
            <SiteHeader />
            <main className="pt-6">
            {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
