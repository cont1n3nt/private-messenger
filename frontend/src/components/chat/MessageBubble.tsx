import { Suspense, lazy, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import type { DecryptedMessage } from '../../store/ChatContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const MarkdownMessage = lazy(() => import('./MarkdownMessage'))

export interface ContextMenuEvent {
  x: number
  y: number
  message: DecryptedMessage
  senderName: string
}

interface MessageBubbleProps {
  msg: DecryptedMessage
  myUserId: number
  userMap: Map<number, string>
  userColors: Record<number, string>
  isConsecutive: boolean
  isLastInGroup: boolean
  onContextMenu: (event: ContextMenuEvent) => void
  allMessages?: DecryptedMessage[]
}

function getBubbleRadius(isMine: boolean, isLastInGroup: boolean): string {
  if (!isLastInGroup) return '18px'
  if (isMine) return '18px 18px 6px 18px'
  return '6px 18px 18px 18px'
}

const MessageBubble = memo(function MessageBubble({
  msg,
  myUserId,
  userMap,
  userColors,
  isConsecutive,
  isLastInGroup,
  onContextMenu,
  allMessages,
}: MessageBubbleProps) {
  const isMine = msg.sender_id === myUserId
  const reduced = useReducedMotion()
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const senderName = userMap.get(msg.sender_id) ?? `User ${msg.sender_id}`
  const showSender = !isMine && !isConsecutive
  const nickColor = userColors[msg.sender_id]

  const time = (() => {
    const isoString = msg.created_at.endsWith('Z') ? msg.created_at : `${msg.created_at}Z`
    const localDate = new Date(isoString)
    return localDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  })()

  const radius = getBubbleRadius(isMine, isLastInGroup)
  const repliedMsg =
    msg.reply_to_message >= 0 && allMessages
      ? allMessages.find((message) => message.id === msg.reply_to_message)
      : null

  const replyNickColor = repliedMsg
    ? (userColors[repliedMsg.sender_id] ?? '#6ab2f5')
    : undefined

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg,
      senderName,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchTimer.current = setTimeout(() => {
      onContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        message: msg,
        senderName,
      })
    }, 500)
  }

  const clearTouchTimer = () => {
    if (!touchTimer.current) return
    clearTimeout(touchTimer.current)
    touchTimer.current = undefined
  }

  return (
    <motion.div
      id={`msg-${msg.id}`}
      className={clsx(
        'flex',
        isMine ? 'justify-end' : 'justify-start',
        !isConsecutive ? 'mt-3' : 'mt-[2px]',
      )}
      layout={!reduced}
      initial={!reduced ? { opacity: 0, y: 12 } : undefined}
      animate={!reduced ? { opacity: 1, y: 0 } : undefined}
      exit={!reduced ? { opacity: 0, y: -8 } : undefined}
      transition={
        !reduced
          ? {
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
              layout: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            }
          : undefined
      }
    >
      <div
        className={clsx(
          'bubble-hover',
          isMine
            ? isConsecutive ? 'bubble-mine-consecutive' : 'bubble-mine'
            : isConsecutive ? 'bubble-other-consecutive' : 'bubble-other',
          'relative max-w-[78%] sm:max-w-[68%] min-w-[80px] px-3.5 pt-2.5 pb-2',
        )}
        style={{ borderRadius: radius }}
        tabIndex={0}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
            const selection = window.getSelection()
            if (selection && selection.toString().trim()) {
              navigator.clipboard.writeText(selection.toString())
            }
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearTouchTimer}
        onTouchMove={clearTouchTimer}
      >
        {showSender && (
          <div
            className="text-[13px] font-semibold mb-[1px] leading-[16px]"
            style={{ color: nickColor }}
          >
            @{senderName}
          </div>
        )}

        {repliedMsg && (
          <div
            className={clsx(
              'flex items-start gap-1.5 mb-1 px-2 py-1 rounded-lg text-[12px] leading-[15px]',
              'border-l-[3px]',
              isMine ? 'bg-white/[0.06]' : 'bg-white/[0.04]',
            )}
            style={{ borderLeftColor: replyNickColor }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="font-medium text-[12px]"
                style={{ color: replyNickColor }}
              >
                @{userMap.get(repliedMsg.sender_id) ?? `User ${repliedMsg.sender_id}`}
              </div>
              <div className="text-text-muted truncate">{repliedMsg.text}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-1">
          <div className="markdown-content text-[15px] leading-[21px] text-text-primary break-words min-w-0">
            <Suspense fallback={<div className="whitespace-pre-wrap">{msg.text}</div>}>
              <MarkdownMessage text={msg.text} />
            </Suspense>
          </div>
          <div className="shrink-0 flex items-center gap-[3px] text-[10px] text-white/35 tabular-nums leading-none whitespace-nowrap msg-time">
            {msg.edited && (
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted/40 shrink-0"
              >
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            )}
            {time}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default MessageBubble
