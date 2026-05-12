import { forwardRef } from 'react'
import clsx from 'clsx'

interface SendButtonProps {
  active?: boolean
  disabled?: boolean
  type?: 'submit' | 'button' | 'reset'
  className?: string
  'aria-label'?: string
}

const SendButton = forwardRef<HTMLButtonElement, SendButtonProps>(
  function SendButton({ active = false, className, disabled, type, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0',
          'transition-all duration-200 focus:outline-none',
          active
            ? 'text-accent hover:bg-accent/[0.10] active:scale-[0.85] hover:shadow-[0_0_14px_-2px_rgba(106,178,245,0.2)]'
            : 'text-text-muted/30 hover:bg-white/[0.04] active:scale-[0.88]',
          className,
        )}
        disabled={disabled}
        {...rest}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    )
  },
)

export default SendButton
