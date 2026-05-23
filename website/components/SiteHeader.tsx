'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const PLAYER_NAME_KEY = 'rananwari_player_name'
const THEME_KEY = 'rananwari_theme'

type ThemeMode = 'light' | 'dark'

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function SiteHeader() {
  const pathname = usePathname()
  const [playerName, setPlayerName] = useState('')
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const sync = () => {
      const storedName = localStorage.getItem(PLAYER_NAME_KEY) || ''
      const nextTheme = readStoredTheme()
      setPlayerName(storedName)
      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem(THEME_KEY, nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <header className="site-header fade-up">
      <div className="site-header__brand">
        <Link href="/" className="site-header__owner tap-feedback">
          <span className="avatar-shell">
            <Image
              src="/PP.JPG"
              alt="Rananwari profile"
              width={56}
              height={56}
              className="h-14 w-14 rounded-[18px] object-cover"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="eyebrow">rananwari studyverse</span>
            <span className="brand-title">JFT + Kanji Lab</span>
          </span>
        </Link>

        <a
          href="https://rananwari-web.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="owner-link tap-feedback"
        >
          rananwari-web.vercel.app
        </a>
      </div>

      <div className="site-header__actions">
        {playerName ? <span className="player-chip">Hi, {playerName}</span> : null}

        <button type="button" onClick={toggleTheme} className="icon-button tap-feedback" aria-label="Toggle theme">
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>

        {pathname !== '/' ? (
          <Link href="/" className="button-secondary tap-feedback">
            Menu Utama
          </Link>
        ) : null}
      </div>
    </header>
  )
}
