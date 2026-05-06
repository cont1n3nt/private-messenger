import { useState } from 'react'
import { useAuth } from '../store/AuthContext'
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
    <div className="login-page">
      <div className="login-card">
        <h1>Private Messenger</h1>
        <p className="login-subtitle">E2E encrypted group chat</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. kosmo"
            required
            autoFocus
          />

          <details className="key-import-section">
            <summary>Import keys (optional)</summary>
            <p className="key-import-hint">
              Paste the content of <code>keys/username.json</code> from the
              backend. Only needed on first login from this browser.
            </p>
            <textarea
              value={keyJson}
              onChange={(e) => setKeyJson(e.target.value)}
              placeholder='{"username":"...","sign_private_key":"...","sign_public_key":"...","dh_private_key":"...","dh_public_key":"..."}'
              rows={5}
            />
          </details>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading || !username.trim()}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            className="reset-keys-btn"
            onClick={handleResetKeys}
            disabled={!username.trim()}
          >
            Reset stored keys
          </button>
        </form>
      </div>
    </div>
  )
}
