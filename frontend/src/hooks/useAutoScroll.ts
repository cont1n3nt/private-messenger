import { useRef, useCallback, useEffect, useLayoutEffect } from 'react'

const SCROLL_THRESHOLD = 100

export function useAutoScroll(_deps: unknown[], scrollOffset = 0) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const smoothScrollEnabledRef = useRef(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current
    if (!container) return
    const target = Math.max(0, container.scrollHeight - container.clientHeight - scrollOffset)
    container.scrollTo({ top: target, behavior })
  }, [scrollOffset])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight - scrollOffset)
  }, [scrollOffset])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD + scrollOffset
      userScrolledUpRef.current = !isNearBottom
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    const observer = new MutationObserver(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!userScrolledUpRef.current) {
          const behavior = smoothScrollEnabledRef.current ? 'smooth' : 'instant'
          const target = Math.max(0, container.scrollHeight - container.clientHeight - scrollOffset)
          container.scrollTo({ top: target, behavior })
          smoothScrollEnabledRef.current = true
        }
      })
    })

    observer.observe(container, { childList: true, subtree: false })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      observer.disconnect()
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [scrollOffset])

  return { bottomRef, containerRef, scrollToBottom }
}
