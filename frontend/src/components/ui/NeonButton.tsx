import { forwardRef } from 'react'
import clsx from 'clsx'

interface NeonButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'submit' | 'button' | 'reset'
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  function NeonButton(
    { variant = 'primary', size = 'md', className, children, disabled, type, onClick },
    ref,
  ) {
    const baseClasses =
      'relative font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96]'

    const variantClasses = {
      primary:
        'bg-accent/80 text-white hover:bg-accent hover:shadow-[0_0_20px_-4px_rgba(106,178,245,0.25)]',
      ghost:
        'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.07] hover:text-text-primary hover:border-white/[0.10]',
      danger:
        'bg-danger/15 text-danger border border-danger/15 hover:bg-danger/25 hover:shadow-[0_0_16px_-4px_rgba(239,83,80,0.2)]',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[13px]',
      md: 'px-5 py-2.5 text-[15px]',
      lg: 'px-6 py-3 text-[16px]',
    }

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    )
  },
)

export default NeonButton
