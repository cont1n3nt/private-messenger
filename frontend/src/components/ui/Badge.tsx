import { memo } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'danger'
  className?: string
}

const Badge = memo(function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-white/[0.06] text-text-secondary/70 border-white/[0.05]',
    accent: 'bg-accent/[0.08] text-accent/80 border-accent/15',
    danger: 'bg-danger/15 text-danger border-danger/15',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-pill text-[12px] font-medium border backdrop-blur-sm',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
})

export default Badge
