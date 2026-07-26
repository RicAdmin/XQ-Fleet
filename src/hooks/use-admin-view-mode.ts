import { useCallback, useEffect, useState } from 'react'

import type { AdminViewMode } from '#/lib/auth-model'

const STORAGE_KEY = 'xqcar.adminViewMode'

function isAdminViewMode(value: string | null): value is AdminViewMode {
  return value === 'customer_service' || value === 'operations' || value === 'admin'
}

export function readAdminViewMode(): AdminViewMode {
  if (typeof window === 'undefined') return 'admin'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return isAdminViewMode(raw) ? raw : 'admin'
}

export function writeAdminViewMode(mode: AdminViewMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function useAdminViewMode(enabled: boolean) {
  const [viewMode, setViewModeState] = useState<AdminViewMode>('admin')

  useEffect(() => {
    if (!enabled) return
    setViewModeState(readAdminViewMode())
  }, [enabled])

  const setViewMode = useCallback((mode: AdminViewMode) => {
    writeAdminViewMode(mode)
    setViewModeState(mode)
  }, [])

  return { viewMode, setViewMode }
}
