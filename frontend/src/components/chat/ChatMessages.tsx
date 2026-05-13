import { useMemo, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { DecryptedMessage } from '../../store/ChatContext'
import MessageBubble from './MessageBubble'
import type { ContextMenuEvent } from './MessageBubble'
import DateSeparator from './DateSeparator'
import WaitingIndicator from './WaitingIndicator'
import { isSameDay, formatDateLabel } from '../../utils/date'
import { useAutoScroll } from '../../hooks/useAutoScroll'

type RenderItem =
  | { type: 'date'; label: string; key: string }
  | {
      type: 'message'
      msg: DecryptedMessage
      isConsecutive: boolean
      isLastInGroup: boolean
      key: string
    }

function processMessages(messages: DecryptedMessage[]): RenderItem[] {
  const items: RenderItem[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const prev = i > 0 ? messages[i - 1] : null
    const next = i < messages.length - 1 ? messages[i + 1] : null

    const msgDate = new Date(msg.created_at)

    if (!prev || !isSameDay(msgDate, new Date(prev.created_at))) {
      items.push({
        type: 'date',
        label: formatDateLabel(msgDate),
        key: `date-${msgDate.toDateString()}`,
      })
    }

    const isConsecutive =
      prev !== null &&
      prev.sender_id === msg.sender_id &&
      !msg.isKeySetup &&
      !prev.isKeySetup &&
      msgDate.getTime() - new Date(prev.created_at).getTime() < 300000

    const isLastInGroup =
      !next ||
      next.sender_id !== msg.sender_id ||
      next.isKeySetup ||
      new Date(next.created_at).getTime() - msgDate.getTime() >= 300000

    items.push({
      type: 'message',
      msg,
      isConsecutive,
      isLastInGroup,
      key: `msg-${msg.id}`,
    })
  }

  return items
}

interface ChatMessagesProps {
  messages: DecryptedMessage[]
  myUserId: number
  userMap: Map<number, string>
  userColors: Record<number, string>
  waitingContent?: ReactNode
  onContextMenu: (event: ContextMenuEvent) => void
  scrollOffset?: number
}

export default function ChatMessages({
  messages,
  myUserId,
  userMap,
  userColors,
  waitingContent,
  onContextMenu,
  scrollOffset = 0,
}: ChatMessagesProps) {
  const { bottomRef, containerRef } = useAutoScroll([messages], scrollOffset)

  const items = useMemo(() => processMessages(messages), [messages])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-hidden px-3 sm:px-1 pt-2 pb-[88px]"
    >
      {waitingContent && <WaitingIndicator>{waitingContent}</WaitingIndicator>}

      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          if (item.type === 'date') {
            return <DateSeparator key={item.key} label={item.label} />
          }

          return (
            <MessageBubble
              key={item.key}
              msg={item.msg}
              myUserId={myUserId}
              userMap={userMap}
              userColors={userColors}
              isConsecutive={item.isConsecutive}
              isLastInGroup={item.isLastInGroup}
              onContextMenu={onContextMenu}
              allMessages={messages}
            />
          )
        })}
      </AnimatePresence>

      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
