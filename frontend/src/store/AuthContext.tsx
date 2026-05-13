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

async function loadAuthenticatedUser(username: string, expectedUserId?: number): Promise<User> {
  const users = await keysApi.getKeys()
  const found = users.find((u) =>
    expectedUserId !== undefined ? u.id === expectedUserId : u.username === username,
  )

  if (!found) {
    throw new Error('Authenticated user was not found in the key registry')
  }

  return found
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)
  const [isLoading, setIsLoading] = useState(() => localStorage.getItem('token') !== null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }
    let cancelled = false

    authApi
      .getMe()
      .then(async (me) => {
        const storedKeys = await loadKeyPair(me.username)
        if (!storedKeys) {
          localStorage.removeItem('token')
          return
        }

        if (cancelled) return
        const found = await loadAuthenticatedUser(me.username, me.id)
        if (cancelled) return
        setUser(found)
        setKeyPair(storedKeys)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
        setKeyPair(null)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (username: string, importedJson?: ImportedKeys) => {
      if (importedJson) {
        if (importedJson.username !== username) {
          throw new Error('Imported key file does not match the entered username')
        }

        const keys = importKeysFromJson(importedJson)
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

          await saveKeyPair(username, keys)
          const found = await loadAuthenticatedUser(username)
          setUser(found)
          setKeyPair(keys)
          return
        } catch (err) {
          localStorage.removeItem('token')
          throw err
        }
      }

      const keys = await loadKeyPair(username)
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

        const found = await loadAuthenticatedUser(username)
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
    } catch (error) {
      console.warn('Logout request failed', error)
    }
    localStorage.removeItem('token')
    if (user) localStorage.removeItem(`groupKey_${user.id}`)
    setUser(null)
    setKeyPair(null)
  }, [user])

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
