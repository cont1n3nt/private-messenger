import { memo } from 'react'
import clsx from 'clsx'

interface KeyImportSectionProps {
  value: string
  onChange: (value: string) => void
}

const KeyImportSection = memo(function KeyImportSection({
  value,
  onChange,
}: KeyImportSectionProps) {
  return (
    <details className="mt-4">
      <summary
        className={clsx(
          'cursor-pointer text-[13px] font-medium text-accent/50',
          'hover:text-accent/70 transition-colors duration-150',
          'select-none',
        )}
      >
        Import keys (optional)
      </summary>

      <div className="mt-2">
        <p className="text-[11px] text-text-muted mb-2 leading-relaxed">
          Paste the content of{' '}
          <code className="text-accent/40 font-mono text-[10px]">
            keys/username.json
          </code>{' '}
          from the backend. Only needed on first login.
        </p>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"username":"...","sign_private_key":"...",...}'
          rows={4}
          className={clsx(
            'w-full px-3 py-2 bg-white/[0.03] rounded-xl',
            'border border-white/[0.05] outline-none transition-all duration-200',
            'text-[12px] font-mono leading-relaxed text-text-primary',
            'placeholder:text-text-muted/30 resize-y',
            'focus:border-accent/15',
          )}
        />
      </div>
    </details>
  )
})

export default KeyImportSection
