import { forwardRef } from 'react'
import clsx from 'clsx'

interface LoginFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

const LoginField = forwardRef<HTMLInputElement, LoginFieldProps>(
  function LoginField({ label, id, className, ...rest }, ref) {
    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className="block text-[12px] font-medium text-text-muted mb-1.5"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full h-11 px-4 bg-white/[0.04] rounded-xl text-text-primary text-[16px] leading-[22px]',
            'border border-white/[0.06] outline-none transition-all duration-200',
            'placeholder:text-text-muted/40',
            'focus:bg-white/[0.06] focus:border-accent/20',
            className,
          )}
          {...rest}
        />
      </div>
    )
  },
)

export default LoginField
