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
  edited: boolean
  reply_to_message: number
}

interface ChatContextValue {
  messages: DecryptedMessage[]
  groupKeyReady: boolean
  founderUsername: string | null
  users: User[]
  sendMessage: (text: string, replyToId?: number) => Promise<void>
  editMessage: (id: number, text: string) => Promise<void>
  deleteMessage: (id: number) => Promise<void>
  initError: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

const GROUP_KEY_STORAGE_PREFIX = 'groupKey_'
const GROUP_KEY_POLL_MS = 3000

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
  if (!groupKey) {
    return null
  }

  const plaintext = decrypt(msg.ciphertext, msg.nonce, groupKey)
  if (!plaintext) {
    return null
  }

  try {
    const payload: MessagePayload = JSON.parse(plaintext)
    if (payload.type !== 'chat') {
      return null
    }

    return {
      id: msg.id,
      sender_id: msg.sender_id,
      text: payload.text,
      created_at: msg.created_at,
      isKeySetup: false,
      edited: msg.edited_content ?? false,
      reply_to_message: msg.reply_to_message ?? -1,
    }
  } catch {
    return null
  }
}

function decryptMessages(
  messages: Message[],
  groupKey: Uint8Array,
): DecryptedMessage[] {
  const decrypted: DecryptedMessage[] = []

  for (const message of messages) {
    const nextMessage = tryDecryptMessage(message, groupKey)
    if (nextMessage) {
      decrypted.push(nextMessage)
    }
  }

  return decrypted
}

function mergeUniqueMessages(
  currentMessages: DecryptedMessage[],
  incomingMessages: DecryptedMessage[],
): DecryptedMessage[] {
  const existingIds = new Set(currentMessages.map((message) => message.id))
  const toAdd = incomingMessages.filter((message) => !existingIds.has(message.id))
  if (toAdd.length === 0) return currentMessages
  return [...currentMessages, ...toAdd]
}

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

  const distributeKeyToNewUsers = useCallback(
    async (gk: Uint8Array) => {
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
      } catch (error) {
        console.error('Distribute key failed:', error)
      }
    },
    [keyPair, user],
  )

  const fetchMissedMessages = useCallback(async () => {
    const gk = groupKeyRef.current
    if (!gk) return

    try {
      const afterId = lastMsgIdRef.current
      const rawMessages = afterId === 0
        ? await msgApi.getMessages()
        : await msgApi.getMessages(undefined, afterId)
      const decrypted = decryptMessages(rawMessages, gk)

      for (const message of decrypted) {
        lastMsgIdRef.current = Math.max(lastMsgIdRef.current, message.id)
      }

      if (decrypted.length > 0) {
        setMessages((prev) => mergeUniqueMessages(prev, decrypted))
      }
    } catch (error) {
      console.error('Fetch missed messages failed:', error)
    }
  }, [])

  const connectWs = useCallback(function openConnection() {
    const token = localStorage.getItem('token')
    if (!token) return

    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current)
      wsReconnectTimerRef.current = null
    }

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
        const gk = groupKeyRef.current
        if (!gk) return

        switch (data.type) {
          case 'new_message': {
            const msg: Message = data.data
            const decrypted = tryDecryptMessage(msg, gk)
            if (decrypted) {
              lastMsgIdRef.current = Math.max(lastMsgIdRef.current, decrypted.id)
              setMessages((prev) => {
                if (prev.some((message) => message.id === decrypted.id)) return prev
                return [...prev, decrypted]
              })
            }
            break
          }
          case 'edit_message': {
            const msg: Message = data.data
            const decrypted = tryDecryptMessage(msg, gk)
            if (decrypted) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === decrypted.id
                    ? { ...message, text: decrypted.text, edited: true }
                    : message,
                ),
              )
            }
            break
          }
          case 'delete_message': {
            const { message_id } = data.data as { message_id: number }
            setMessages((prev) => prev.filter((message) => message.id !== message_id))
            break
          }
        }
      } catch {
        console.warn('Ignored invalid websocket payload')
      }
    }

    ws.onclose = (ev) => {
      wsRef.current = null
      if (ev.code === 4003) return

      if (localStorage.getItem('token')) {
        const delay = reconnectDelayRef.current
        reconnectDelayRef.current = Math.min(delay * 2, 30000)
        wsReconnectTimerRef.current = setTimeout(() => {
          fetchMissedMessages()
            .catch((error) => {
              console.warn('Failed to fetch missed messages before reconnect', error)
            })
            .finally(() => {
              openConnection()
            })
        }, delay)
      }
    }
  }, [fetchMissedMessages])

  const startFounderDistribute = useCallback(() => {
    if (founderDistributeTimerRef.current) {
      clearTimeout(founderDistributeTimerRef.current)
    }

    const tick = async () => {
      const currentGroupKey = groupKeyRef.current
      if (!currentGroupKey) return

      await distributeKeyToNewUsers(currentGroupKey)
      founderDistributeTimerRef.current = setTimeout(tick, GROUP_KEY_POLL_MS)
    }

    founderDistributeTimerRef.current = setTimeout(tick, GROUP_KEY_POLL_MS)
  }, [distributeKeyToNewUsers])

  const startGroupKeyPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
    }

    const poll = async () => {
      if (!user || !keyPair) return

      try {
        const gk = await establishGroupKey(user.id, keyPair)
        if (gk) {
          setGroupKey(gk)
          const rawMessages = await msgApi.getMessages()
          const decrypted = decryptMessages(rawMessages, gk)
          if (decrypted.length > 0) {
            lastMsgIdRef.current = decrypted[decrypted.length - 1].id
          }
          setMessages(decrypted)
          connectWs()
          return
        }
      } catch (error) {
        console.error('Group key poll failed:', error)
      }

      pollTimerRef.current = setTimeout(poll, GROUP_KEY_POLL_MS)
    }

    void poll()
  }, [connectWs, keyPair, user])

  useEffect(() => {
    if (!isAuthenticated || !user || !keyPair) return

    const currentUser = user
    const currentKeyPair = keyPair
    let cancelled = false

    async function init() {
      try {
        setInitError(null)
        const allUsers = await keysApi.getKeys()
        if (cancelled) return
        setUsers(allUsers)

        const founder = findFounder(allUsers)
        setFounderUsername(founder?.username ?? null)

        const gk = await establishGroupKey(currentUser.id, currentKeyPair)
        if (cancelled) return

        if (gk) {
          setGroupKey(gk)

          if (isUserFounder(currentUser.id, allUsers)) {
            await distributeKeyToNewUsers(gk)
            if (cancelled) return
            startFounderDistribute()
          }

          const rawMessages = await msgApi.getMessages()
          if (cancelled) return
          const decrypted = decryptMessages(rawMessages, gk)
          if (decrypted.length > 0) {
            lastMsgIdRef.current = decrypted[decrypted.length - 1].id
          }
          setMessages(decrypted)
          connectWs()
        } else {
          startGroupKeyPoll()
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Chat init failed:', error)
          setInitError('Failed to initialize chat. Please try reloading.')
        }
      }
    }

    void init()

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
  }, [
    connectWs,
    distributeKeyToNewUsers,
    isAuthenticated,
    keyPair,
    startFounderDistribute,
    startGroupKeyPoll,
    user,
  ])

  const sendMessage = useCallback(
    async (text: string, replyToId?: number) => {
      if (!groupKeyRef.current) return
      const payload: ChatPayload = { type: 'chat', text }
      const { ciphertext, nonce } = encrypt(
        JSON.stringify(payload),
        groupKeyRef.current,
      )
      await msgApi.sendMessage(ciphertext, nonce, replyToId)
    },
    [],
  )

  const editMessage = useCallback(
    async (id: number, text: string) => {
      if (!groupKeyRef.current) return
      let previousMessages: DecryptedMessage[] = []
      const payload: ChatPayload = { type: 'chat', text }
      const { ciphertext, nonce } = encrypt(
        JSON.stringify(payload),
        groupKeyRef.current,
      )
      setMessages((prev) => {
        previousMessages = prev
        return prev.map((message) => (
          message.id === id ? { ...message, text, edited: true } : message
        ))
      })
      try {
        await msgApi.editMessage(id, ciphertext, nonce)
      } catch {
        setMessages(previousMessages)
      }
    },
    [],
  )

  const deleteMessage = useCallback(
    async (id: number) => {
      let previousMessages: DecryptedMessage[] = []
      setMessages((prev) => {
        previousMessages = prev
        return prev.filter((message) => message.id !== id)
      })
      try {
        await msgApi.deleteMessage(id)
      } catch {
        setMessages(previousMessages)
      }
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
        editMessage,
        deleteMessage,
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
