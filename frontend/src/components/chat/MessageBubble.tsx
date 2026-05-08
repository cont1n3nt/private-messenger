import { memo, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { DecryptedMessage } from '../../store/ChatContext'
import CheckMark from '../ui/CheckMark'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface MessageBubbleProps {
  msg: DecryptedMessage
  myUserId: number
  userMap: Map<number, string>
  isConsecutive: boolean
  isLastInGroup: boolean
}

function getBubbleRadius(
  isMine: boolean,
  isConsecutive: boolean,
  isLastInGroup: boolean,
): CSSProperties['borderRadius'] {
  const R = 18
  const S = 4

  if (isMine) {
    if (!isConsecutive) return `${R}px ${R}px ${S}px ${R}px`
    if (isConsecutive && isLastInGroup) return `${S}px ${R}px ${S}px ${R}px`
    return `${S}px ${S}px ${S}px ${R}px`
  }

  if (!isConsecutive) return `${R}px ${R}px ${R}px ${S}px`
  if (isConsecutive && isLastInGroup) return `${R}px ${S}px ${R}px ${S}px`
  return `${R}px ${S}px ${S}px ${S}px`
}

const MessageBubble = memo(function MessageBubble({
  msg,
  myUserId,
  userMap,
  isConsecutive,
  isLastInGroup,
}: MessageBubbleProps) {
  const isMine = msg.sender_id === myUserId
  const reduced = useReducedMotion()

  const senderName = userMap.get(msg.sender_id) ?? `User ${msg.sender_id}`
  const showSender = !isMine && !isConsecutive

  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const radius = getBubbleRadius(isMine, isConsecutive, isLastInGroup)

  return (
    <motion.div
      className={clsx(
        'flex',
        isMine ? 'justify-end' : 'justify-start',
        !isConsecutive ? 'mt-3' : 'mt-0.5',
      )}
      initial={!reduced ? { opacity: 0, y: 4 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      transition={!reduced ? { duration: 0.15, ease: 'easeOut' as const } : undefined}
    >
      <div
        className={clsx(
          isMine ? 'bubble-mine' : 'bubble-other',
          'max-w-[75%] sm:max-w-[65%] px-[12px] pt-[8px] pb-[7px]',
          'highlight-sheen',
        )}
        style={{ borderRadius: radius }}
      >
        {showSender && (
          <div className="text-[13px] font-medium text-accent/70 mb-[2px]">
            @{senderName}
          </div>
        )}
        <div className="flex items-end gap-2">
          <span className="text-[15px] leading-[21px] text-text-primary break-words min-w-0">
            {msg.text}
          </span>
          <span className="flex items-center gap-0.5 shrink-0 self-end translate-y-[1px]">
            <span className="text-[11px] text-text-muted/60 tabular-nums">{time}</span>
            {isMine && (
              <CheckMark read={false} size={13} className="text-accent/35" />
            )}
          </span>
        </div>
      </div>
    </motion.div>
  )
})

export default MessageBubble
