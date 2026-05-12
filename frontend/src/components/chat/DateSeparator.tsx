import { memo } from 'react'
import { motion } from 'framer-motion'

interface DateSeparatorProps {
  label: string
}

const DateSeparator = memo(function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <motion.div
      className="flex items-center justify-center py-4 gap-3"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
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
