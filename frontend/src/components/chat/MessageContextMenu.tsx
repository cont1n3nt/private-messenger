import { useEffect, useRef, useLayoutEffect, useState } from 'react'

interface MenuItem {
  label: string
  icon: React.ReactNode
  action: () => void
  danger?: boolean
}

interface MessageContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function MessageContextMenu({
  isOpen,
  x,
  y,
  items,
  onClose,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let px = x
    let py = y
    const menuHeight = rect.height

    if (rect.right > window.innerWidth) px = window.innerWidth - rect.width - 12
    if (px < 12) px = 12

    if (y + menuHeight > window.innerHeight) {
      py = y - menuHeight
    }

    py = Math.max(12, Math.min(py, window.innerHeight - menuHeight - 12))
    setPosition({ x: px, y: py })
  }, [isOpen, x, y])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={onClose}
          onContextMenu={(e) => { e.preventDefault(); onClose() }}
        />
      )}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[101] min-w-[190px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[rgba(26,26,29,0.7)] backdrop-blur-[40px] saturate-[180%] py-2 shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)] animate-in"
          style={{ left: position.x, top: position.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              className={[
                'flex w-full items-center gap-3 px-3 py-2.5 mx-1 text-[13px] font-medium leading-none transition-all duration-150 rounded-[10px]',
                'focus-visible:outline-none focus-visible:bg-white/[0.06]',
                item.danger
                  ? 'text-danger hover:bg-red-500/[0.10] active:bg-red-500/[0.15]'
                  : 'text-text-primary hover:bg-white/[0.06] active:bg-white/[0.10]',
              ].join(' ')}
              style={{
                animation: `slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${0.03 * i}s both`,
              }}
              onClick={() => { item.action(); onClose() }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="flex items-center justify-center w-4 h-4 shrink-0 opacity-70">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
