import { memo } from 'react'
import WallpaperLayer from '../wallpaper/WallpaperLayer'
import FloatingHeader from './FloatingHeader'
import ChatMessages from './ChatMessages'
import MessageInput from '../input/MessageInput'
import type { DecryptedMessage } from '../../store/ChatContext'
import type { User } from '../../types'

interface ChatScreenProps {
  messages: DecryptedMessage[]
  groupKeyReady: boolean
  founderUsername: string | null
  initError: string | null
  user: User
  users: User[]
  onSend: (text: string) => Promise<void>
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
  onLogout,
}: ChatScreenProps) {
  const userMap = new Map(users.map((u) => [u.id, u.username]))

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

        <div className="flex justify-center flex-1 min-h-0">
          <div className="flex flex-col h-full w-full max-w-[720px] sm:px-4">
            <ChatMessages
              messages={messages}
              myUserId={user.id}
              userMap={userMap}
              waitingContent={waitingContent ?? undefined}
            />
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-full max-w-[720px] sm:px-4">
            <MessageInput onSend={onSend} disabled={!groupKeyReady} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default ChatScreen
