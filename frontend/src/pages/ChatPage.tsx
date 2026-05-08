import { useAuth } from '../store/AuthContext'
import { useChat } from '../store/ChatContext'
import ChatScreen from '../components/chat/ChatScreen'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const { messages, groupKeyReady, founderUsername, users, sendMessage, initError } = useChat()

  if (!user) return null

  return (
    <ChatScreen
      messages={messages}
      groupKeyReady={groupKeyReady}
      founderUsername={founderUsername}
      initError={initError}
      user={user}
      users={users}
      onSend={sendMessage}
      onLogout={logout}
    />
  )
}
