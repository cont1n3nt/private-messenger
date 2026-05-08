import { memo } from 'react'

interface DateSeparatorProps {
  label: string
}

const DateSeparator = memo(function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="px-3 py-1 rounded-pill text-[12px] font-medium text-text-secondary/70 bg-white/[0.06] backdrop-blur-sm border border-white/[0.05]">
        {label}
      </span>
    </div>
  )
})

export default DateSeparator
