import { useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import SendButton from './SendButton'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface MessageInputProps {
  onSend: (text: string) => Promise<void>
  disabled: boolean
}

const MessageInput = memo(function MessageInput({
  onSend,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const reduced = useReducedMotion()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = text.trim()
      if (!trimmed || sending || disabled) return
      try {
        setSending(true)
        await onSend(trimmed)
        setText('')
      } catch {
        // preserve text for retry
      } finally {
        setSending(false)
      }
    },
    [text, sending, disabled, onSend],
  )

  const canSend = text.trim().length > 0 && !disabled && !sending

  return (
    <motion.div
      className="pb-[env(safe-area-inset-bottom)] relative edge-light-top"
      initial={!reduced ? { opacity: 0 } : undefined}
      animate={!reduced ? { opacity: 1 } : undefined}
      transition={!reduced ? { duration: 0.2, delay: 0.05 } : undefined}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 px-3 sm:px-0 pt-2.5 pb-2"
      >
        <div className="flex-1 min-w-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            disabled={disabled || sending}
            autoFocus
            className={clsx(
              'w-full h-[40px] px-4 rounded-[20px] text-text-primary text-[16px] leading-[22px]',
              'bg-white/[0.06] border border-white/[0.08] outline-none',
              'transition-all duration-200',
              'placeholder:text-text-muted/40',
              'focus:bg-white/[0.08] focus:border-white/[0.14]',
              'backdrop-blur-sm',
            )}
          />
        </div>

        <SendButton
          type="submit"
          active={canSend}
          disabled={!canSend}
          aria-label="Send message"
        />
      </form>
    </motion.div>
  )
})

export default MessageInput
