import { memo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface DateSeparatorProps {
  label: string
}

const DateSeparator = memo(function DateSeparator({ label }: DateSeparatorProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className="flex items-center justify-center py-3 gap-3"
      initial={!reduced ? { opacity: 0, scale: 0.92, y: -4 } : undefined}
      animate={!reduced ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={!reduced ? { duration: 0.2, ease: [0.16, 1, 0.3, 1] } : undefined}
    >
      <div className="h-px flex-1 bg-white/5" />
      <span className="px-4 py-1.5 rounded-full text-[12px] font-medium text-text-secondary/80 glass-subtle shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/5" />
    </motion.div>
  )
})

export default DateSeparator
