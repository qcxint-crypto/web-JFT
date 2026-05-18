'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type QuizStats = {
  totalQuestions?: number
  availableQuizQuestions?: number
  categories?: Record<string, number>
}

type LeaderboardMode = 'jft' | 'kanji'

type ModeStats = {
  attempts: number
  totalQuestionsAnswered: number
  averagePercentage: number
  bestPercentage: number
  bestCorrectAnswers: number
  bestQuestions: number
  lastPlayedAt: string | null
}

type RankedEntry = {
  rank: number
  id: string
  name: string
  attempts: number
  totalQuestionsAnswered: number
  averagePercentage: number
  bestPercentage: number
  bestCorrectAnswers: number
  bestQuestions: number
  lastPlayedAt: string | null
}

type LeaderboardData = {
  cycleLabel: string
  resetAt: string
  totalPlayers: number
  leaderboards: Record<LeaderboardMode, RankedEntry[]>
  player: {
    id: string
    name: string
    jft: ModeStats
    kanji: ModeStats
  } | null
}

const PLAYER_NAME_KEY = 'rananwari_player_name'

function getResetCountdown(resetAt: string) {
  const distance = new Date(resetAt).getTime() - Date.now()

  if (!Number.isFinite(distance) || distance <= 0) {
    return 'reset minggu ini'
  }

  const totalHours = Math.floor(distance / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days <= 0) {
    return `${hours} jam lagi`
  }

  return `${days} hari ${hours} jam lagi`
}

function formatBestScore(stats: ModeStats) {
  if (stats.bestQuestions <= 0) return 'belum ada'
  return `${stats.bestCorrectAnswers}/${stats.bestQuestions}`
}

function formatAverage(stats: ModeStats) {
  if (stats.totalQuestionsAnswered <= 0) return '0%'
  return `${stats.averagePercentage}%`
}

export default function Home() {
  const [playerName, setPlayerName] = useState('')
  const [draftName, setDraftName] = useState('')
  const [activeBoard, setActiveBoard] = useState<LeaderboardMode>('jft')
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem(PLAYER_NAME_KEY) || ''
    setPlayerName(storedName)
    setDraftName(storedName)
  }, [])

  useEffect(() => {
    if (!playerName) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadDashboard = async () => {
      setLoading(true)

      try {
        const [statsResponse, leaderboardResponse] = await Promise.all([
          fetch('/api/quiz/stats', { cache: 'no-store' }),
          fetch(`/api/leaderboard?name=${encodeURIComponent(playerName)}`, { cache: 'no-store' }),
        ])

        const [statsPayload, leaderboardPayload] = await Promise.all([statsResponse.json(), leaderboardResponse.json()])

        if (cancelled) return

        setStats(statsPayload)
        setLeaderboard(leaderboardPayload)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [playerName])

  const saveName = () => {
    const nextName = draftName.replace(/\s+/g, ' ').trim().slice(0, 32)
    if (nextName.length < 2) return

    setSavingName(true)
    localStorage.setItem(PLAYER_NAME_KEY, nextName)
    window.dispatchEvent(new Event('storage'))
    setPlayerName(nextName)
    setDraftName(nextName)
    setSavingName(false)
  }

  const clearName = () => {
    localStorage.removeItem(PLAYER_NAME_KEY)
    window.dispatchEvent(new Event('storage'))
    setPlayerName('')
    setDraftName('')
    setLeaderboard(null)
  }

  const currentModeStats = leaderboard?.player?.[activeBoard] || null
  const topRows = leaderboard?.leaderboards?.[activeBoard] || []

  if (!playerName) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-2xl items-center justify-center px-2">
        <section className="panel fade-up w-full max-w-xl p-6 sm:p-8">
          <div className="mx-auto max-w-md space-y-5 text-center">
            <span className="eyebrow">enter study mode</span>
            <div className="space-y-3">
              <h1 className="font-display text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                Masuk dulu pakai nama Anda agar skor bisa tampil di leaderboard mingguan.
              </h1>
              <p className="dashboard-copy">
                Tidak perlu akun dan tidak perlu password. Nama ini akan dipakai untuk menampilkan rank JFT dan Kanji,
                total soal yang sudah dikerjakan, serta rata-rata skor Anda.
              </p>
            </div>

            <div className="panel-soft space-y-4 p-5 text-left">
              <label className="eyebrow" htmlFor="player-name">
                Nama display
              </label>
              <input
                id="player-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    saveName()
                  }
                }}
                placeholder="Masukkan nama Anda"
                className="input-shell"
                maxLength={32}
              />
              <button
                type="button"
                onClick={saveName}
                disabled={draftName.trim().length < 2 || savingName}
                className="button-primary tap-feedback disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingName ? 'Menyimpan...' : 'Masuk ke Dashboard'}
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="panel fade-up p-6 sm:p-8">
        <div className="dashboard-hero">
          <div className="space-y-5">
            <span className="eyebrow">welcome back</span>
            <p className="dashboard-copy max-w-2xl">
              Hi, {playerName}. Semua sesi tetap cepat dimulai, tapi sekarang skor, rata-rata akurasi, dan rank mingguan
              Anda langsung kebaca dari satu layar yang lebih simpel.
            </p>

            <div className="metric-strip">
              <div className="metric-pill">
                <span className="metric-pill__label">Soal siap quiz</span>
                <strong>{loading ? '...' : stats?.availableQuizQuestions || 0}</strong>
              </div>
              <div className="metric-pill">
                <span className="metric-pill__label">Top rank reset</span>
                <strong>{leaderboard ? getResetCountdown(leaderboard.resetAt) : '...'}</strong>
              </div>
              <div className="metric-pill">
                <span className="metric-pill__label">Pemain minggu ini</span>
                <strong>{leaderboard?.totalPlayers || 0}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link href="/quiz" className="mode-card tap-feedback">
              <span className="mode-card__tag">JFT session</span>
              <h2>Start JFT Quiz</h2>
              <p>60 soal random terstruktur: kosakata, kaiwa, listening, dan reading.</p>
            </Link>

            <Link href="/kanji" className="mode-card mode-card--inverse tap-feedback">
              <span className="mode-card__tag">Kanji drill</span>
              <h2>Start Kanji Quiz</h2>
              <p>Feedback lengkap per pilihan, cocok untuk hafalan dan review cepat.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel fade-up p-6" style={{ animationDelay: '0.06s' }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">your run</span>
              <h2>Stat pribadi</h2>
            </div>
            <button type="button" onClick={clearName} className="button-ghost tap-feedback">
              Ganti nama
            </button>
          </div>

          <div className="mode-summary-grid">
            {(['jft', 'kanji'] as LeaderboardMode[]).map((mode) => {
              const modeStats = leaderboard?.player?.[mode]

              return (
                <div key={mode} className={`summary-card ${activeBoard === mode ? 'summary-card--active' : ''}`}>
                  <div className="summary-card__top">
                    <span className="eyebrow">{mode === 'jft' ? 'JFT' : 'Kanji'}</span>
                    <button type="button" onClick={() => setActiveBoard(mode)} className="button-ghost tap-feedback">
                      Lihat rank
                    </button>
                  </div>
                  <strong>{modeStats ? `${modeStats.bestPercentage}%` : '0%'}</strong>
                  <p>{modeStats ? `${modeStats.totalQuestionsAnswered} soal • avg ${formatAverage(modeStats)}` : 'Belum ada attempt'}</p>
                  <div className="summary-card__meta">
                    <span>Best {modeStats ? formatBestScore(modeStats) : 'belum ada'}</span>
                    <span>{modeStats?.attempts || 0} sesi</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="panel-soft mt-5 p-5">
            <div className="section-head">
              <div>
                <span className="eyebrow">question bank</span>
                <h3>Bank soal aktif</h3>
              </div>
            </div>

            <div className="bank-summary-grid">
              <div>
                <span className="bank-label">Total data</span>
                <strong>{loading ? '...' : stats?.totalQuestions || 0}</strong>
              </div>
              <div>
                <span className="bank-label">Kosakata</span>
                <strong>{loading ? '...' : stats?.categories?.moji_goi || 0}</strong>
              </div>
              <div>
                <span className="bank-label">Kaiwa</span>
                <strong>{loading ? '...' : stats?.categories?.kaiwa_hyougen || 0}</strong>
              </div>
              <div>
                <span className="bank-label">Listening</span>
                <strong>{loading ? '...' : stats?.categories?.choukai || 0}</strong>
              </div>
              <div>
                <span className="bank-label">Reading</span>
                <strong>{loading ? '...' : stats?.categories?.dokkai || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="panel fade-up p-6" style={{ animationDelay: '0.1s' }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">weekly leaderboard</span>
              <h2>Top rank best score</h2>
            </div>
            <div className="leaderboard-tabs">
              {(['jft', 'kanji'] as LeaderboardMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveBoard(mode)}
                  className={`tab-button tap-feedback ${activeBoard === mode ? 'tab-button--active' : ''}`}
                >
                  {mode === 'jft' ? 'JFT' : 'Kanji'}
                </button>
              ))}
            </div>
          </div>

          <div className="leaderboard-meta">
            <span>{leaderboard?.cycleLabel || 'Memuat leaderboard...'}</span>
            <strong>Reset {leaderboard ? getResetCountdown(leaderboard.resetAt) : '...'}</strong>
          </div>

          <div className="leaderboard-list">
            {topRows.length === 0 ? (
              <div className="leaderboard-empty">
                Belum ada skor yang masuk untuk mode {activeBoard === 'jft' ? 'JFT' : 'Kanji'} minggu ini.
              </div>
            ) : (
              topRows.slice(0, 8).map((entry) => (
                <div
                  key={`${activeBoard}-${entry.id}`}
                  className={`leaderboard-row ${leaderboard?.player?.id === entry.id ? 'leaderboard-row--self' : ''}`}
                >
                  <div className="leaderboard-row__rank">#{entry.rank}</div>
                  <div className="leaderboard-row__body">
                    <strong>{entry.name}</strong>
                    <span>
                      best {entry.bestPercentage}% • avg {entry.averagePercentage}% • {entry.totalQuestionsAnswered} soal
                    </span>
                  </div>
                  <div className="leaderboard-row__score">{entry.bestCorrectAnswers}/{entry.bestQuestions}</div>
                </div>
              ))
            )}
          </div>

          <div className="panel-soft mt-5 p-5">
            <span className="eyebrow">active tab summary</span>
            <div className="current-run">
              <div>
                <span className="bank-label">Best score</span>
                <strong>{currentModeStats ? `${currentModeStats.bestPercentage}%` : '0%'}</strong>
              </div>
              <div>
                <span className="bank-label">Rata-rata</span>
                <strong>{currentModeStats ? formatAverage(currentModeStats) : '0%'}</strong>
              </div>
              <div>
                <span className="bank-label">Sudah dikerjakan</span>
                <strong>{currentModeStats?.totalQuestionsAnswered || 0} soal</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
