import { memo } from 'react'
import clsx from 'clsx'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Avatar = memo(function Avatar({ name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-12 h-12 text-[15px]',
  }

  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={clsx(
        'rounded-full',
        'bg-gradient-to-br from-accent/20 to-neon-purple/20',
        'flex items-center justify-center font-semibold text-text-primary shrink-0',
        'border border-white/[0.08]',
        sizeClasses[size],
        className,
      )}
    >
      {initial}
    </div>
  )
})

export default Avatar
