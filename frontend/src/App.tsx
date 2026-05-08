import { AuthProvider, useAuth } from './store/AuthContext'
import { ChatProvider } from './store/ChatContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import WallpaperLayer from './components/wallpaper/WallpaperLayer'

function LoadingScreen() {
  return (
    <div className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
      <WallpaperLayer seed={0} density={24} showOrbs />
      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className="w-1.5 h-1.5 rounded-full bg-accent/40"
          style={{ animation: 'pulse-soft 2.5s ease-in-out infinite' }}
        />
        <span className="text-[13px] text-text-muted">Loading...</span>
      </div>
    </div>
  )
}

function AppInner() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
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
