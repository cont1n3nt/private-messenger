import { memo } from 'react'
import { motion } from 'framer-motion'
import Avatar from '../ui/Avatar'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface FloatingHeaderProps {
  title: string
  username: string
  onLogout: () => void
}

const FloatingHeader = memo(function FloatingHeader({
  title,
  username,
  onLogout,
}: FloatingHeaderProps) {
  const reduced = useReducedMotion()

  return (
    <motion.header
      className="sticky top-0 z-20 glass-header pt-[env(safe-area-inset-top)] relative edge-light"
      initial={!reduced ? { opacity: 0, y: -8 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      transition={!reduced ? { duration: 0.25, ease: [0.16, 1, 0.3, 1] } : undefined}
    >
      <div className="flex justify-center w-full">
        <div className="flex items-center gap-3 px-4 sm:px-0 h-[52px] w-full max-w-[720px]">
          <Avatar name={title} size="sm" />

          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold leading-[20px] text-text-primary truncate">
              {title}
            </h1>
            <p className="text-[12px] leading-[16px] text-text-muted truncate">
              @{username}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-text-muted/60 hover:text-danger transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  )
})

export default FloatingHeader
