import { memo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { DecryptedMessage } from '../../store/ChatContext'

interface ReplyPreviewProps {
  message: DecryptedMessage
  senderName: string
  senderId: number
  userColors?: Record<number, string>
  onClose: () => void
}

const ReplyPreview = memo(function ReplyPreview({
  message,
  senderName,
  senderId,
  userColors,
  onClose,
}: ReplyPreviewProps) {
  const reduced = useReducedMotion()
  const previewText = message.text.length > 80
    ? message.text.slice(0, 80) + '...'
    : message.text

  const nickColor = userColors?.[senderId] ?? '#6ab2f5'

  const handleClick = () => {
    const el = document.getElementById(`msg-${message.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <motion.div
      className="flex items-start gap-2 px-1 pt-1.5 pb-1 border-l-[3px] cursor-pointer overflow-hidden"
      style={{ borderLeftColor: nickColor }}
      initial={!reduced ? { opacity: 0, y: -8 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      exit={!reduced ? { opacity: 0, y: -6 } : undefined}
      transition={!reduced ? { duration: 0.12, ease: 'easeOut' } : undefined}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0 pl-2">
        <div
          className="text-[12px] font-semibold mb-0.5"
          style={{ color: nickColor }}
        >
          @{senderName}
        </div>
        <div className="text-[13px] text-text-secondary/60 truncate">
          {previewText}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="shrink-0 p-1 rounded-full text-text-muted/40 hover:text-text-primary hover:bg-white/[0.06] transition-colors duration-150"
        aria-label="Cancel reply"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  )
})

export default ReplyPreview
