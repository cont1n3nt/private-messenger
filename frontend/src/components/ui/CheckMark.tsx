import { memo, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface CheckMarkProps {
  read?: boolean
  size?: number
  className?: string
}

const CheckMark = memo(function CheckMark({
  read = false,
  size = 16,
  className,
}: CheckMarkProps) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const length = el.getTotalLength()
    el.style.strokeDasharray = `${length}`
    el.style.strokeDashoffset = `${length}`
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      el.style.strokeDashoffset = '0'
    })
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={clsx('inline-block shrink-0', className)}
    >
      {read ? (
        <path
          ref={pathRef}
          d="M2 12l5 5L20 3M7 12l5 5L22 5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          ref={pathRef}
          d="M4 12l5 5L20 3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
})

export default CheckMark
