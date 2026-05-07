import { useRef, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useChat } from '../store/ChatContext'
import MessageBubble from '../components/MessageBubble'
import MessageInput from '../components/MessageInput'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const { messages, groupKeyReady, founderUsername, users, sendMessage, initError } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) return null

  const userMap = new Map(users.map((u) => [u.id, u.username]))

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Private Messenger</h1>
        <div className="chat-header-right">
          <span className="chat-username">@{user.username}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {initError && (
          <div className="chat-waiting">{initError}</div>
        )}
        {!groupKeyReady && !initError && founderUsername && (
          <div className="chat-waiting">
            Waiting for <strong>@{founderUsername}</strong> to set up the group key...
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} myUserId={user.id} userMap={userMap} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <MessageInput onSend={sendMessage} disabled={!groupKeyReady} />
      </div>
    </div>
  )
}
