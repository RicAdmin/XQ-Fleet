import { useEffect, useRef } from 'react'

type UseInfiniteScrollOptions = {
  enabled: boolean
  onLoadMore: () => void
  rootMargin?: string
}

export function useInfiniteScroll({
  enabled,
  onLoadMore,
  rootMargin = '240px 0px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!enabled || !el) return

    if (typeof IntersectionObserver === 'undefined') {
      onLoadMoreRef.current()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMoreRef.current()
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
