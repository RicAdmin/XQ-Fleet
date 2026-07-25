import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { cn } from '#/lib/utils'

type BackToTopButtonProps = {
  threshold?: number
  className?: string
}

export function BackToTopButton({ threshold = 320, className }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!visible) return null

  return (
    <button
      type="button"
      className={cn('admin-back-to-top', className)}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <ArrowUp className="size-4" aria-hidden />
      <span>Top</span>
    </button>
  )
}
