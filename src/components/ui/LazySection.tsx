import { useEffect, useRef, useState, type ReactNode } from 'react'

type LazySectionProps = {
  children: ReactNode
  /** Reserve space before mount to limit layout shift. */
  minHeight?: number
  rootMargin?: string
  className?: string
}

/** Defer mounting children until the section nears the viewport. */
export function LazySection({
  children,
  minHeight,
  rootMargin = '240px 0px',
  className,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  return (
    <div
      ref={ref}
      className={className}
      style={!visible && minHeight ? { minHeight } : undefined}
      aria-hidden={!visible ? true : undefined}
    >
      {visible ? children : null}
    </div>
  )
}
