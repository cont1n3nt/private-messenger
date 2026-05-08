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
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
          'transition-all duration-200 active:scale-90',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40',
          active
            ? 'text-accent'
            : 'text-text-muted/30',
          !disabled && active && 'hover:drop-shadow-[0_0_6px_rgba(0,212,224,0.3)]',
          className,
        )}
        disabled={disabled}
        {...rest}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    )
  },
)

export default SendButton
