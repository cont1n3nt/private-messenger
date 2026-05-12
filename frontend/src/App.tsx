import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './store/AuthContext'
import { ChatProvider } from './store/ChatContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import WallpaperLayer from './components/wallpaper/WallpaperLayer'

function LoadingScreen() {
  return (
    <div className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
      <WallpaperLayer seed={0} density={24} showOrbs />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-accent/50"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[13px] text-text-muted">Loading...</span>
        </motion.div>
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
