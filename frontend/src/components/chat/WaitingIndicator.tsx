import { memo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const dotVariants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [1, 1.25, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

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
      transition={!reduced ? { duration: 0.35, ease: 'easeOut' as const } : undefined}
    >
      <div className="glass-subtle rounded-pill px-4 py-2 text-text-secondary text-[13px] text-center">
        <motion.span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent/50 mr-2"
          variants={reduced ? undefined : dotVariants}
          animate="animate"
        />
        {children}
      </div>
    </motion.div>
  )
})

export default WaitingIndicator
