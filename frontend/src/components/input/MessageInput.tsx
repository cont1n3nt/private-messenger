import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import SendButton from './SendButton'
import ReplyPreview from '../chat/ReplyPreview'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { DecryptedMessage } from '../../store/ChatContext'

export type InputMode =
  | { type: 'compose' }
  | { type: 'reply'; message: DecryptedMessage; senderName: string; senderId: number }
  | { type: 'edit'; message: DecryptedMessage }

interface MessageInputProps {
  onSend: (text: string, replyToId?: number) => Promise<void>
  disabled: boolean
  inputMode: InputMode
  onClearInputMode: () => void
  userColors?: Record<number, string>
}



const MessageInput = memo(function MessageInput({
  onSend,
  disabled,
  inputMode,
  onClearInputMode,
  userColors,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const reduced = useReducedMotion()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevEditId = useRef<number | null>(null)

  useEffect(() => {
    if (inputMode.type === 'edit' && inputMode.message.id !== prevEditId.current) {
      setText(inputMode.message.text)
      prevEditId.current = inputMode.message.id
      inputRef.current?.focus()
    } else if (inputMode.type === 'compose' && prevEditId.current !== null) {
      prevEditId.current = null
    }
  }, [inputMode])

  useEffect(() => {
    if (inputMode.type === 'reply') {
      inputRef.current?.focus()
    }
  }, [inputMode.type])

  useEffect(() => {
    inputRef.current?.focus()
  }, [sending])

  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [text])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = text.trim()
      if (!trimmed || sending || disabled) return
      try {
        setSending(true)
        if (inputMode.type === 'edit') {
          await onSend(trimmed)
        } else if (inputMode.type === 'reply') {
          await onSend(trimmed, inputMode.message.id)
        } else {
          await onSend(trimmed)
        }
        setText('')
        onClearInputMode()
      } catch {
        /* keep text for retry */
      } finally {
        setSending(false)
      }
    },
    [text, sending, disabled, onSend, inputMode, onClearInputMode],
  )

  const isEditing = inputMode.type === 'edit'
  const isReplying = inputMode.type === 'reply'
  const canSend = !disabled && !sending

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
      <div className="glass-input flex-1 rounded-2xl shadow-lg shadow-black/30 px-3 py-2 sm:px-4">
        <AnimatePresence>
          {isReplying && (
            <ReplyPreview
              key={`reply-${inputMode.message.id}`}
              message={inputMode.message}
              senderName={inputMode.senderName}
              senderId={inputMode.senderId}
              userColors={userColors}
              onClose={onClearInputMode}
            />
          )}
          {isEditing && (
            <motion.div
              key="edit-indicator"
              initial={!reduced ? { opacity: 0, y: -8 } : undefined}
              animate={!reduced ? { opacity: 1, y: 0 } : undefined}
              exit={!reduced ? { opacity: 0, y: -6 } : undefined}
              className="flex items-center gap-2 py-1.5 text-[13px] text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="flex-1">Editing</span>
              <button
                type="button"
                onClick={onClearInputMode}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label="Cancel editing"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          )}
          {(isReplying || isEditing) && (
            <motion.div
              key="input-mode-sep"
              className="h-[1px] bg-white/[0.05] my-1 overflow-hidden"
              initial={!reduced ? { opacity: 0, scaleY: 0 } : undefined}
              animate={!reduced ? { opacity: 1, scaleY: 1 } : undefined}
              exit={!reduced ? { opacity: 0, scaleY: 0 } : undefined}
              transition={!reduced ? { duration: 0.1, ease: 'easeOut' } : undefined}
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder={isEditing ? 'Edit message' : 'Message'}
              disabled={disabled || sending}
              autoFocus
              rows={1}
              className={clsx(
                'w-full max-h-[168px] text-text-primary text-[15px] leading-[20px]',
                'bg-transparent outline-none resize-none p-0 border-0',
                'placeholder:text-text-muted/30',
                'focus:placeholder:text-text-muted/15',
                'scrollbar-input',
              )}
            />
          </div>
        </div>
      </div>

      <div className="w-[44px] h-[44px] rounded-full glass-input shadow-lg shadow-black/30 flex items-center justify-center shrink-0">
        <SendButton
          type="submit"
          active={canSend}
          aria-label={isEditing ? 'Save edit' : 'Send message'}
        />
      </div>
    </form>
  )
})

export default MessageInput
