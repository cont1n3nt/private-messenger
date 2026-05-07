export interface User {
  id: number
  username: string
  sign_public_key: string | null
  dh_public_key: string | null
}

export interface Message {
  id: number
  sender_id: number
  ciphertext: string
  nonce: string
  created_at: string
}

export interface KeyPair {
  signSecretKey: Uint8Array
  signPublicKey: Uint8Array
  dhSecretKey: Uint8Array
  dhPublicKey: Uint8Array
}

export interface ImportedKeys {
  username: string
  sign_private_key: string
  sign_public_key: string
  dh_private_key: string
  dh_public_key: string
}

export type ChatPayload = { type: 'chat'; text: string }
export type KeySetupPayload = { type: 'key_setup'; key: string }
export type MessagePayload = ChatPayload | KeySetupPayload
