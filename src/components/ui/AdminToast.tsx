import { useEffect, useState } from 'react'

type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export function showAdminToast(message: string) {
  for (const listener of listeners) listener(message)
}

function useAdminToastMessage() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const listener: ToastListener = (next) => {
      if (timer) window.clearTimeout(timer)
      setMessage(next)
      timer = window.setTimeout(() => setMessage(null), 3500)
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  return message
}

export function AdminToastHost() {
  const message = useAdminToastMessage()
  if (!message) return null

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[var(--z-toast)] max-w-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--sea-ink)] shadow-md"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
