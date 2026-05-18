import type { Metadata } from 'next'
import Link from 'next/link'
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google'
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
  title: 'QCXINT JFT + Kanji Lab',
  description: 'Practice JFT and Kanji with randomized sessions, listening drills, and modern long-form study flows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <div className="relative min-h-screen overflow-x-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-[-10rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(0,215,160,0.2),_transparent_68%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-[-8rem] right-[-5rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(91,168,255,0.24),_transparent_70%)] blur-3xl"
          />

          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-[rgba(255,251,245,0.78)] px-4 py-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:px-6">
              <Link href="/" className="group flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-slate-900 text-[11px] font-black uppercase tracking-[0.28em] text-[#f7f2e8] shadow-[0_14px_32px_-18px_rgba(15,23,42,0.8)]">
                  QC
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    QCXINT STUDYVERSE
                  </div>
                  <div className="font-display truncate text-lg font-bold tracking-[-0.04em] text-slate-900 sm:text-2xl">
                    JFT + Kanji Lab
                  </div>
                </div>
              </Link>

              <Link
                href="/"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-900/10 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Menu Utama
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </header>

          <main className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
