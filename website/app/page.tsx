'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type QuizStats = {
  totalQuestions?: number
  availableQuizQuestions?: number
  categories?: Record<string, number>
}

export default function Home() {
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [availableQuizQuestions, setAvailableQuizQuestions] = useState(0)
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quiz/stats')
      .then(res => res.json())
      .then(data => {
        setTotalQuestions(data.totalQuestions || 0)
        setAvailableQuizQuestions(data.availableQuizQuestions || data.totalQuestions || 0)
        setStats(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch stats:', error)
        setLoading(false)
      })
  }, [])

  const categoryOverview = [
    { key: 'moji_goi', label: 'Moji Goi', value: stats?.categories?.moji_goi ?? 0, tone: 'bg-emerald-100 text-emerald-900' },
    { key: 'kaiwa_hyougen', label: 'Kaiwa / Hyougen', value: stats?.categories?.kaiwa_hyougen ?? 0, tone: 'bg-orange-100 text-orange-900' },
    { key: 'choukai', label: 'Choukai', value: stats?.categories?.choukai ?? 0, tone: 'bg-sky-100 text-sky-900' },
    { key: 'dokkai', label: 'Dokkai', value: stats?.categories?.dokkai ?? 0, tone: 'bg-amber-100 text-amber-900' },
  ]

  return (
    <div className="space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[40px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div
          aria-hidden="true"
          className="float-drift absolute right-[-4rem] top-[-3rem] h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,122,89,0.28),_transparent_70%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-[-5rem] left-[-3rem] h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,_rgba(0,215,160,0.24),_transparent_72%)] blur-3xl"
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Focused Study Mode
            </span>

            <div className="max-w-3xl space-y-4">
              <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                Belajar JFT dan Kanji dengan tampilan yang lebih fresh, rapi, dan tidak bikin cepat lelah.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Semua sesi dirancang untuk latihan panjang: bank soal Google Forms yang diacak per kategori, listening yang bisa langsung diputar, dan quiz Kanji dengan feedback lengkap untuk setiap pilihan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white soft-raise">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 pulse-glow" />
                {loading ? 'Memuat data...' : `${availableQuizQuestions} soal siap quiz`}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700">
                {totalQuestions} soal tersimpan
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700">
                610 kosakata Kanji
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[30px] bg-slate-900 p-6 text-white soft-raise">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Why it feels better</div>
                <div className="mt-3 font-display text-2xl font-bold tracking-[-0.05em]">
                  Random tapi tetap terstruktur.
                </div>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Urutan tetap JFT-friendly: kosakata, percakapan, listening, lalu reading. Jadi flow belajarnya tidak acak sembarang.
                </p>
              </div>

              <div className="rounded-[26px] border border-slate-900/10 bg-white/88 p-6 soft-raise">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Long session ready</div>
                <div className="mt-3 font-display text-2xl font-bold tracking-[-0.05em] text-slate-950">
                  Kontras lembut, fokus tetap enak.
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Warna dibuat lebih adem untuk sesi panjang, tapi tetap punya aksen yang terasa muda dan energik.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:pt-8">
            <Link
              href="/quiz"
              className="group glass-panel relative overflow-hidden rounded-[34px] border-slate-900/10 p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white/90"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
              />
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="inline-flex rounded-[14px] bg-sky-100 px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-sky-900">
                    JFT Session
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.05em] text-slate-950">
                    JFT-Basic Quiz
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Moji Goi, Kaiwa / Hyougen, Choukai, dan Dokkai dalam satu flow yang rapi dan modern.
                  </p>
                </div>
                <span className="rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.8)]">
                  Start
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-white/90 px-3 py-1.5">{loading ? '...' : `${availableQuizQuestions} soal live`}</span>
                <span className="rounded-full bg-white/80 px-3 py-1.5">Audio + gambar + reading</span>
              </div>
            </Link>

            <Link
              href="/kanji"
              className="group relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-900 p-6 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.72)] transition duration-300 hover:-translate-y-1"
            >
              <div
                aria-hidden="true"
                className="absolute right-[-2rem] top-[-2rem] h-28 w-28 rounded-full bg-[radial-gradient(circle_at_center,_rgba(0,215,160,0.3),_transparent_70%)] blur-2xl"
              />
              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <div className="inline-flex rounded-[14px] bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                    Kanji Drill
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.05em]">
                    Kanji Enhanced
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                    Semua pilihan tetap muncul di feedback, jadi tiap salah jawab tetap terasa seperti belajar, bukan cuma gagal.
                  </p>
                </div>
                <span className="rounded-[18px] bg-white px-4 py-3 text-sm font-black text-slate-900">
                  Start
                </span>
              </div>
              <div className="relative mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/75">
                <span className="rounded-full bg-white/10 px-3 py-1.5">610 item</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">Feedback lengkap</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">Random pasangan field</span>
              </div>
            </Link>

            <div className="glass-panel rounded-[30px] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Category Radar</div>
                  <div className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Snapshot bank soal
                  </div>
                </div>
                <div className="rounded-full border border-slate-900/10 bg-white/80 px-3 py-1 text-xs font-bold text-slate-600">
                  Live data
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {categoryOverview.map(item => (
                  <div key={item.key} className="rounded-[22px] border border-slate-900/8 bg-white/78 p-4">
                    <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${item.tone}`}>
                      {item.label}
                    </div>
                    <div className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-slate-950">
                      {loading ? '...' : item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center text-sm text-slate-500">
        © 2026 JFT Master • built for focused study on desktop and mobile
      </div>
    </div>
  )
}
