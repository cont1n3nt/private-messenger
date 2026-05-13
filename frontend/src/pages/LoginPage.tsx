import { useState } from 'react'
import { useAuth } from '../store/AuthContext'
import WallpaperLayer from '../components/wallpaper/WallpaperLayer'
import LoginCard from '../components/login/LoginCard'
import type { ImportedKeys } from '../types'

export default function LoginPage() {
  const { login, resetKeys } = useAuth()
  const [username, setUsername] = useState('')
  const [keyJson, setKeyJson] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleResetKeys() {
    const name = username.trim()
    if (!name) return
    try {
      await resetKeys(name)
      setError('')
    } catch {
      setError('Failed to reset keys')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let imported: ImportedKeys | undefined
    if (keyJson.trim()) {
      try {
        imported = JSON.parse(keyJson.trim())
      } catch {
        setError('Invalid JSON format for keys')
        setLoading(false)
        return
      }
    }

    try {
      await login(username.trim(), imported)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
      <WallpaperLayer showOrbs />

      <div className="relative z-10 flex items-center justify-center w-full">
        <LoginCard
          username={username}
          onUsernameChange={setUsername}
          keyJson={keyJson}
          onKeyJsonChange={setKeyJson}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onResetKeys={handleResetKeys}
        />
      </div>
    </div>
  )
}
