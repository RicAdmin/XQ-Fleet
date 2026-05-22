import { useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'

/** Landing canvas — same as cxq-landing-scoped.css `--canvas` */
export const CXQ_CANVAS = '#f4f5f7'

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'auto'
}

export function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)

  if (mode === 'auto') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }

  root.style.colorScheme = resolved
}

/** Dashboard surfaces always use the landing light palette (ignores user dark/auto preference). */
export function useForceLightTheme() {
  useEffect(() => {
    applyThemeMode('light')

    return () => {
      applyThemeMode(getStoredThemeMode())
    }
  }, [])
}
