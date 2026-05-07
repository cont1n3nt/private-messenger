import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, KeyPair, ImportedKeys } from '../types'
import * as authApi from '../api/auth'
import * as keysApi from '../api/keys'
import { loadKeyPair, saveKeyPair, importKeysFromJson, b64Encode, deleteKeyPair } from '../crypto/keys'
import { signChallenge } from '../crypto/auth'

interface AuthContextValue {
  user: User | null
  keyPair: KeyPair | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, importedJson?: ImportedKeys) => Promise<void>
  logout: () => Promise<void>
  resetKeys: (username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .getMe()
      .then(async (me) => {
        const keys = await loadKeyPair(me.username)
        if (keys) {
          const users = await keysApi.getKeys()
          const found = users.find((u) => u.id === me.id) ?? null
          setUser(found)
          setKeyPair(keys)
        } else {
          localStorage.removeItem('token')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(
    async (username: string, importedJson?: ImportedKeys) => {
      let keys: KeyPair | null = null

      if (importedJson) {
        keys = importKeysFromJson(importedJson)
        await saveKeyPair(username, keys)
      } else {
        keys = await loadKeyPair(username)
      }

      if (!keys) {
        throw new Error(
          'No keys found. You must import keys from backend/keys/<username>.json on first login.',
        )
      }

      const challenge = await authApi.requestChallenge(username)
      const signature = signChallenge(challenge, keys.signSecretKey)
      const { token } = await authApi.verifySignature(
        username,
        challenge,
        signature,
      )

      localStorage.setItem('token', token)

      try {
        await keysApi.initKeys(
          b64Encode(keys.signPublicKey),
          b64Encode(keys.dhPublicKey),
        )

        const users = await keysApi.getKeys()
        const found = users.find((u) => u.username === username) ?? null
        setUser(found)
        setKeyPair(keys)
      } catch (err) {
        localStorage.removeItem('token')
        throw err
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    if (user) localStorage.removeItem(`groupKey_${user.id}`)
    setUser(null)
    setKeyPair(null)
  }, [])

  const resetKeys = useCallback(async (username: string) => {
    await deleteKeyPair(username)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        keyPair,
        isAuthenticated: user !== null && keyPair !== null,
        isLoading,
        login,
        logout,
        resetKeys,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
