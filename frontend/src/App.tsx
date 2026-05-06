import { AuthProvider, useAuth } from './store/AuthContext'
import { ChatProvider } from './store/ChatContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'

function AppInner() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
