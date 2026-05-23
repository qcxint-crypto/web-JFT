// Seeded random number generator for consistent randomization per session
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Fisher-Yates shuffle with seed
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let seedVal = seed

  for (let i = result.length - 1; i > 0; i--) {
    seedVal = (seedVal * 9301 + 49297) % 233280
    const j = Math.floor((seedVal / 233280) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

// Convert string to seed number
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Get or create session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = localStorage.getItem('jft_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('jft_session_id', sessionId)
  }
  return sessionId
}

// Clear session
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jft_session_id')
  }
}
