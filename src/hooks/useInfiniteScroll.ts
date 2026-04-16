import { useState, useRef, useCallback, useEffect } from 'react'

const PAGE_SIZE = 20

export function useInfiniteScroll<T>(items: T[], pageSize = PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // items 교체(카테고리 전환·새 검색) 시 처음으로 리셋
  useEffect(() => {
    setVisibleCount(pageSize)
  }, [items, pageSize])

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect()
      if (!node) return
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + pageSize, items.length))
          }
        },
        { threshold: 0.1 },
      )
      observerRef.current.observe(node)
    },
    // items.length가 바뀌면 sentinel을 새 observer로 교체
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, pageSize],
  )

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    total: items.length,
    sentinelRef,
  }
}
