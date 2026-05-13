import { ChatProvider } from '../store/ChatContext'
import ChatPage from '../pages/ChatPage'

export default function AuthenticatedApp() {
  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  )
}
