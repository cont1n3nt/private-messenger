import { forwardRef } from 'react'
import clsx from 'clsx'

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  neonFocus?: boolean
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField({ neonFocus = true, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full h-10 px-4 rounded-pill text-text-primary text-[16px] leading-[22px]',
          'bg-white/[0.04] border border-white/[0.06] outline-none',
          'transition-all duration-200',
          'placeholder:text-text-muted/50',
          neonFocus &&
            'focus:bg-white/[0.07] focus:border-accent/20',
          className,
        )}
        {...rest}
      />
    )
  },
)

export default InputField
