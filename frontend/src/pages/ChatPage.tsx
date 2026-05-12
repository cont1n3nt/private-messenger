import { useAuth } from '../store/AuthContext'
import { useChat } from '../store/ChatContext'
import ChatScreen from '../components/chat/ChatScreen'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const { messages, groupKeyReady, founderUsername, users, sendMessage, editMessage, deleteMessage, initError } = useChat()

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
      onEdit={editMessage}
      onDelete={deleteMessage}
      onLogout={logout}
    />
  )
}
