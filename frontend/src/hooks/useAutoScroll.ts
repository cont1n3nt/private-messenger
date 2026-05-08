import { useRef, useCallback, useEffect } from 'react'

export function useAutoScroll(deps: unknown[]) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      scrollToBottom()
      return
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120

    if (isNearBottom) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { bottomRef, containerRef, scrollToBottom }
}
