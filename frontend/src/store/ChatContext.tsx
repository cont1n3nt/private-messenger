import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { Message, KeyPair, ChatPayload, MessagePayload, User } from '../types'
import { useAuth } from './AuthContext'
import * as msgApi from '../api/messages'
import * as keysApi from '../api/keys'
import { computePairwiseSecrets } from '../crypto/ecdh'
import { encrypt, decrypt } from '../crypto/cipher'
import { b64Decode, b64Encode } from '../crypto/keys'

export interface DecryptedMessage {
  id: number
  sender_id: number
  text: string
  created_at: string
  isKeySetup: boolean
}

interface ChatContextValue {
  messages: DecryptedMessage[]
  groupKeyReady: boolean
  founderUsername: string | null
  users: User[]
  sendMessage: (text: string) => Promise<void>
  initError: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

const GROUP_KEY_STORAGE_PREFIX = 'groupKey_'

function groupKeyStorageKey(userId: number): string {
  return `${GROUP_KEY_STORAGE_PREFIX}${userId}`
}

function storeGroupKey(userId: number, key: Uint8Array): void {
  localStorage.setItem(groupKeyStorageKey(userId), b64Encode(key))
}

function loadGroupKey(userId: number): Uint8Array | null {
  const b64 = localStorage.getItem(groupKeyStorageKey(userId))
  if (!b64) return null
  try {
    const key = b64Decode(b64)
    if (key.length !== 32) {
      localStorage.removeItem(groupKeyStorageKey(userId))
      return null
    }
    return key
  } catch {
    localStorage.removeItem(groupKeyStorageKey(userId))
    return null
  }
}

function findFounder(users: User[]): User | null {
  if (users.length === 0) return null
  return users.reduce((min, u) => (u.id < min.id ? u : min), users[0])
}

function isUserFounder(myUserId: number, users: User[]): boolean {
  return users.length > 0 && users.every((u) => myUserId <= u.id)
}

async function establishGroupKey(
  myUserId: number,
  keyPair: KeyPair,
): Promise<Uint8Array | null> {
  let groupKey = loadGroupKey(myUserId)

  const users = await keysApi.getKeys()
  const founder = findFounder(users)
  const founderId = founder ? founder.id : -1
  const secrets = await computePairwiseSecrets(myUserId, keyPair.dhSecretKey, users)

  if (isUserFounder(myUserId, users)) {
    if (!groupKey) {
      groupKey = crypto.getRandomValues(new Uint8Array(32))
      storeGroupKey(myUserId, groupKey)
    }
    return groupKey
  }

  if (groupKey) return groupKey

  const messages = await msgApi.getMessages()

  for (const msg of messages) {
    if (msg.sender_id !== founderId) continue
    const secret = secrets.get(msg.sender_id)
    if (!secret) continue
    const plaintext = decrypt(msg.ciphertext, msg.nonce, secret)
    if (!plaintext) continue
    try {
      const payload: MessagePayload = JSON.parse(plaintext)
      if (payload.type === 'key_setup') {
        const decoded = b64Decode(payload.key)
        if (decoded.length !== 32) continue
        groupKey = decoded
        storeGroupKey(myUserId, groupKey)
        return groupKey
      }
    } catch {
      continue
    }
  }

  return null
}

function tryDecryptMessage(
  msg: Message,
  groupKey: Uint8Array | null,
): DecryptedMessage | null {
  if (groupKey) {
    const plaintext = decrypt(msg.ciphertext, msg.nonce, groupKey)
    if (plaintext) {
      try {
        const payload: MessagePayload = JSON.parse(plaintext)
        if (payload.type === 'chat') {
          return {
            id: msg.id,
            sender_id: msg.sender_id,
            text: payload.text,
            created_at: msg.created_at,
            isKeySetup: false,
          }
        }
      } catch {
      }
    }
  }
  return null
}

const GROUP_KEY_POLL_MS = 3000

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, keyPair, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [groupKey, setGroupKey] = useState<Uint8Array | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [founderUsername, setFounderUsername] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const groupKeyRef = useRef<Uint8Array | null>(null)
  const lastMsgIdRef = useRef<number>(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(3000)
  const distributedToRef = useRef<Set<number>>(new Set())
  const founderDistributeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    groupKeyRef.current = groupKey
  }, [groupKey])

  useEffect(() => {
    if (!isAuthenticated || !user || !keyPair) return

    const myUser = user
    const myKeyPair = keyPair
    let cancelled = false

    async function init() {
      try {
        const allUsers = await keysApi.getKeys()
        if (cancelled) return
        setUsers(allUsers)

        const founder = findFounder(allUsers)
        setFounderUsername(founder?.username ?? null)

        const gk = await establishGroupKey(myUser.id, myKeyPair)
        if (cancelled) return

        if (gk) {
          setGroupKey(gk)

          if (isUserFounder(myUser.id, allUsers)) {
            await distributeKeyToNewUsers(gk)
            startFounderDistribute()
          }

          const rawMsgs = await msgApi.getMessages()
          if (cancelled) return
          const decrypted: DecryptedMessage[] = []
          for (const msg of rawMsgs) {
            const d = tryDecryptMessage(msg, gk)
            if (d) decrypted.push(d)
          }
          if (decrypted.length > 0) {
            lastMsgIdRef.current = decrypted[decrypted.length - 1].id
          }
          setMessages(decrypted)
          connectWs()
        } else {
          startGroupKeyPoll()
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Chat init failed:', err)
          setInitError('Failed to initialize chat. Please try reloading.')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current)
      if (founderDistributeTimerRef.current) clearTimeout(founderDistributeTimerRef.current)
    }
  }, [isAuthenticated, user?.id, keyPair])

  async function distributeKeyToNewUsers(gk: Uint8Array) {
    if (!user || !keyPair) return
    try {
      const allUsers = await keysApi.getKeys()
      const secrets = await computePairwiseSecrets(user.id, keyPair.dhSecretKey, allUsers)
      const distributed = distributedToRef.current

      for (const [userId, secret] of secrets) {
        if (distributed.has(userId)) continue
        const payload: MessagePayload = {
          type: 'key_setup',
          key: b64Encode(gk),
        }
        const { ciphertext, nonce } = encrypt(JSON.stringify(payload), secret)
        await msgApi.sendMessage(ciphertext, nonce)
        distributed.add(userId)
      }
      setUsers(allUsers)
    } catch (err) {
      console.error('Distribute key failed:', err)
    }
  }

  function startFounderDistribute() {
    founderDistributeTimerRef.current = setTimeout(async () => {
      if (!groupKeyRef.current) return
      await distributeKeyToNewUsers(groupKeyRef.current)
      startFounderDistribute()
    }, GROUP_KEY_POLL_MS)
  }

  async function startGroupKeyPoll() {
    if (!user || !keyPair) return

    try {
      const gk = await establishGroupKey(user.id, keyPair)
      if (gk) {
        setGroupKey(gk)
        const rawMsgs = await msgApi.getMessages()
        const decrypted: DecryptedMessage[] = []
        for (const msg of rawMsgs) {
          const d = tryDecryptMessage(msg, gk)
          if (d) decrypted.push(d)
        }
        if (decrypted.length > 0) {
          lastMsgIdRef.current = decrypted[decrypted.length - 1].id
        }
        setMessages(decrypted)
        connectWs()
        return
      }
    } catch (err) {
      console.error('Group key poll failed:', err)
    }

    pollTimerRef.current = setTimeout(startGroupKeyPoll, GROUP_KEY_POLL_MS)
  }

  async function fetchMissedMessages() {
    if (!groupKeyRef.current) return
    try {
      const afterId = lastMsgIdRef.current
      const rawMsgs = afterId === 0
        ? await msgApi.getMessages()
        : await msgApi.getMessages(undefined, afterId)
      const gk = groupKeyRef.current
      for (const msg of rawMsgs) {
        const d = tryDecryptMessage(msg, gk)
        if (d) {
          lastMsgIdRef.current = Math.max(lastMsgIdRef.current, d.id)
          setMessages((prev) => [...prev, d])
        }
      }
    } catch (err) {
      console.error('Fetch missed messages failed:', err)
    }
  }

  function connectWs() {
    const token = localStorage.getItem('token')
    if (!token) return

    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/api/v0/ws`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
      reconnectDelayRef.current = 3000
    }

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data.type !== 'new_message') return
        const msg: Message = data.data
        const gk = groupKeyRef.current
        const d = tryDecryptMessage(msg, gk)
        if (d) {
          lastMsgIdRef.current = Math.max(lastMsgIdRef.current, d.id)
          setMessages((prev) => [...prev, d])
        }
      } catch {
      }
    }

    ws.onclose = (ev) => {
      wsRef.current = null
      if (ev.code === 4003) return
      if (localStorage.getItem('token')) {
        const delay = reconnectDelayRef.current
        reconnectDelayRef.current = Math.min(delay * 2, 30000)
        wsReconnectTimerRef.current = setTimeout(() => {
          fetchMissedMessages().then(() => connectWs()).catch(() => {})
        }, delay)
      }
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!groupKeyRef.current) return
      const payload: ChatPayload = { type: 'chat', text }
      const { ciphertext, nonce } = encrypt(
        JSON.stringify(payload),
        groupKeyRef.current,
      )
      await msgApi.sendMessage(ciphertext, nonce)
    },
    [],
  )

  return (
    <ChatContext.Provider
      value={{
        messages,
        groupKeyReady: groupKey !== null,
        founderUsername,
        users,
        sendMessage,
        initError,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be inside ChatProvider')
  return ctx
}
