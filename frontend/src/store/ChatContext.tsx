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
}

const ChatContext = createContext<ChatContextValue | null>(null)

const GROUP_KEY_STORAGE = 'groupKey'

function storeGroupKey(key: Uint8Array): void {
  localStorage.setItem(GROUP_KEY_STORAGE, b64Encode(key))
}

function loadGroupKey(): Uint8Array | null {
  const b64 = localStorage.getItem(GROUP_KEY_STORAGE)
  if (!b64) return null
  return b64Decode(b64)
}

function findFounder(users: User[]): User {
  return users.reduce((min, u) => (u.id < min.id ? u : min), users[0])
}

async function establishGroupKey(
  myUserId: number,
  keyPair: KeyPair,
): Promise<Uint8Array | null> {
  let groupKey = loadGroupKey()
  if (groupKey) return groupKey

  const users = await keysApi.getKeys()
  const secrets = computePairwiseSecrets(myUserId, keyPair.dhSecretKey, users)

  const messages = await msgApi.getMessages()

  for (const msg of messages) {
    const secret = secrets.get(msg.sender_id)
    if (!secret) continue
    const plaintext = decrypt(msg.ciphertext, msg.nonce, secret)
    if (!plaintext) continue
    try {
      const payload: MessagePayload = JSON.parse(plaintext)
      if (payload.type === 'key_setup') {
        groupKey = b64Decode(payload.key)
        storeGroupKey(groupKey)
        return groupKey
      }
    } catch {
      continue
    }
  }

  const isFounder = users.every((u) => myUserId <= u.id)
  if (isFounder) {
    groupKey = crypto.getRandomValues(new Uint8Array(32))
    storeGroupKey(groupKey)

    for (const [, secret] of secrets) {
      const payload: MessagePayload = {
        type: 'key_setup',
        key: b64Encode(groupKey),
      }
      const { ciphertext, nonce } = encrypt(JSON.stringify(payload), secret)
      await msgApi.sendMessage(ciphertext, nonce)
    }
    return groupKey
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
        // not JSON, ignore
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
  const wsRef = useRef<WebSocket | null>(null)
  const groupKeyRef = useRef<Uint8Array | null>(null)
  const lastMsgIdRef = useRef<number>(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    groupKeyRef.current = groupKey
  }, [groupKey])

  useEffect(() => {
    if (!isAuthenticated || !user || !keyPair) return

    const myUser = user
    const myKeyPair = keyPair
    let cancelled = false

    async function init() {
      const allUsers = await keysApi.getKeys()
      if (cancelled) return
      setUsers(allUsers)

      const founder = findFounder(allUsers)
      setFounderUsername(founder.username)

      const gk = await establishGroupKey(myUser.id, myKeyPair)
      if (cancelled) return

      if (gk) {
        setGroupKey(gk)
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
    }

    init()
    return () => {
      cancelled = true
      wsRef.current?.close()
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [isAuthenticated, user?.id, keyPair])

  async function startGroupKeyPoll() {
    if (!user || !keyPair) return

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

    pollTimerRef.current = setTimeout(startGroupKeyPoll, GROUP_KEY_POLL_MS)
  }

  async function fetchMissedMessages() {
    if (!groupKeyRef.current) return
    const afterId = lastMsgIdRef.current
    if (afterId === 0) return
    const rawMsgs = await msgApi.getMessages(undefined, afterId)
    const gk = groupKeyRef.current
    for (const msg of rawMsgs) {
      const d = tryDecryptMessage(msg, gk)
      if (d) {
        lastMsgIdRef.current = Math.max(lastMsgIdRef.current, d.id)
        setMessages((prev) => [...prev, d])
      }
    }
  }

  function connectWs() {
    const token = localStorage.getItem('token')
    if (!token) return

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/api/v0/ws?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

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
        // ignore malformed
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (localStorage.getItem('token')) {
        setTimeout(() => {
          fetchMissedMessages().then(() => connectWs())
        }, 3000)
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
