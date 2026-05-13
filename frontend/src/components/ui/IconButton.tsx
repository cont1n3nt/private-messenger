import { forwardRef } from 'react'
import clsx from 'clsx'

interface IconButtonProps {
  children: React.ReactNode
  size?: 'sm' | 'md'
  variant?: 'default' | 'ghost' | 'neon'
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ children, size = 'md', variant = 'default', className, onClick, ...rest }, ref) {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
    }

    const variantClasses = {
      default:
        'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]',
      ghost: 'text-text-muted hover:text-text-secondary',
      neon: 'text-neon-cyan hover:text-neon-cyan/80 hover:bg-neon-cyan/[0.06]',
    }

    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/30 active:scale-[0.88]',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    )
  },
)

export default IconButton
