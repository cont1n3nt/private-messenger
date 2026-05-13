import { memo, useCallback, useState } from 'react'
import WallpaperLayer from '../wallpaper/WallpaperLayer'
import FloatingHeader from './FloatingHeader'
import ChatMessages from './ChatMessages'
import MessageInput from '../input/MessageInput'
import type { InputMode } from '../input/MessageInput'
import MessageContextMenu from './MessageContextMenu'
import type { ContextMenuEvent } from './MessageBubble'
import { userNickColors } from '../../theme/colors'
import type { DecryptedMessage } from '../../store/ChatContext'
import type { User } from '../../types'

interface ChatScreenProps {
  messages: DecryptedMessage[]
  groupKeyReady: boolean
  founderUsername: string | null
  initError: string | null
  user: User
  users: User[]
  onSend: (text: string, replyToId?: number) => Promise<void>
  onEdit: (id: number, text: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onLogout: () => void
}

const ChatScreen = memo(function ChatScreen({
  messages,
  groupKeyReady,
  founderUsername,
  initError,
  user,
  users,
  onSend,
  onEdit,
  onDelete,
  onLogout,
}: ChatScreenProps) {
  const userMap = new Map(users.map((u) => [u.id, u.username]))

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    message: DecryptedMessage
    senderName: string
  } | null>(null)

  const [inputMode, setInputMode] = useState<InputMode>({ type: 'compose' })

  const handleContextMenu = useCallback((event: ContextMenuEvent) => {
    setContextMenu({
      x: event.x,
      y: event.y,
      message: event.message,
      senderName: event.senderName,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleReply = useCallback(() => {
    if (!contextMenu) return
    setInputMode({
      type: 'reply',
      message: contextMenu.message,
      senderName: contextMenu.senderName,
      senderId: contextMenu.message.sender_id,
    })
  }, [contextMenu])

  const handleCopy = useCallback(async () => {
    if (!contextMenu) return
    try {
      await navigator.clipboard.writeText(contextMenu.message.text)
    } catch (error) {
      console.warn('Clipboard is unavailable', error)
    }
  }, [contextMenu])

  const handleEdit = useCallback(() => {
    if (!contextMenu) return
    setInputMode({ type: 'edit', message: contextMenu.message })
  }, [contextMenu])

  const handleDelete = useCallback(() => {
    if (!contextMenu) return
    onDelete(contextMenu.message.id)
    closeContextMenu()
  }, [contextMenu, onDelete, closeContextMenu])

  const clearInputMode = useCallback(() => {
    setInputMode({ type: 'compose' })
  }, [])

  const handleSendOrEdit = useCallback(
    async (text: string, replyToId?: number) => {
      if (inputMode.type === 'edit') {
        await onEdit(inputMode.message.id, text)
        setInputMode({ type: 'compose' })
      } else {
        await onSend(text, replyToId)
      }
    },
    [inputMode, onEdit, onSend],
  )

  const contextMenuItems = !contextMenu
    ? []
    : [
        {
          label: 'Reply',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          ),
          action: handleReply,
        },
        {
          label: 'Copy',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          ),
          action: handleCopy,
        },
        ...(contextMenu.message.sender_id === user.id
          ? [
              {
                label: 'Edit',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ),
                action: handleEdit,
              },
            ]
          : []),
        ...(contextMenu.message.sender_id === user.id
          ? [
              {
                label: 'Delete',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                ),
                action: handleDelete,
                danger: true,
              },
            ]
          : []),
      ]

  const waitingContent = initError
    ? initError
    : !groupKeyReady && founderUsername
      ? `Waiting for @${founderUsername} to set up the group key...`
      : null

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <WallpaperLayer />

      <div className="relative z-10 flex flex-col h-full w-full">
        <FloatingHeader
          title="Private Messenger"
          username={user.username}
          onLogout={onLogout}
        />

        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 flex justify-center">
            <div className="flex flex-col h-full w-full max-w-[720px] sm:px-4">
              <ChatMessages
                messages={messages}
                myUserId={user.id}
                userMap={userMap}
                userColors={userNickColors}
                waitingContent={waitingContent ?? undefined}
                onContextMenu={handleContextMenu}
                scrollOffset={0}
              />
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 z-[15] flex justify-center px-3">
            <div className="w-full max-w-[720px]">
              <MessageInput
                onSend={handleSendOrEdit}
                disabled={!groupKeyReady}
                inputMode={inputMode}
                onClearInputMode={clearInputMode}
                userColors={userNickColors}
              />
            </div>
          </div>
        </div>
      </div>

      <MessageContextMenu
        isOpen={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />
    </div>
  )
})

export default ChatScreen
