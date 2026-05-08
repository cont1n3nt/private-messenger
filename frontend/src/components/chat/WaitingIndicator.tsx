import { memo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const WaitingIndicator = memo(function WaitingIndicator({
  children,
}: {
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className="flex items-center justify-center py-10 px-4"
      initial={!reduced ? { opacity: 0, y: 6 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      transition={!reduced ? { duration: 0.25, ease: 'easeOut' as const } : undefined}
    >
      <div className="liquid-glass-subtle rounded-pill px-4 py-2 text-text-secondary text-[13px] text-center">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent/50 mr-2"
          style={{ animation: 'pulse-soft 2.5s ease-in-out infinite' }}
        />
        {children}
      </div>
    </motion.div>
  )
})

export default WaitingIndicator
