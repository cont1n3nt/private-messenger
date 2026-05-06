import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js'
import type { KeyPair, ImportedKeys } from '../types'

const DB_NAME = 'private-messenger'
const STORE = 'keys'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function b64Encode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function b64Decode(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateKeyPair(): KeyPair {
  const sign = ed25519.keygen()
  const dhSecretKey = ed25519.utils.toMontgomerySecret(sign.secretKey)
  const dhPublicKey = x25519.getPublicKey(dhSecretKey)

  return {
    signSecretKey: sign.secretKey,
    signPublicKey: sign.publicKey,
    dhSecretKey,
    dhPublicKey,
  }
}

export async function saveKeyPair(
  username: string,
  keys: KeyPair,
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  store.put(
    {
      signSecretKey: b64Encode(keys.signSecretKey),
      signPublicKey: b64Encode(keys.signPublicKey),
      dhSecretKey: b64Encode(keys.dhSecretKey),
      dhPublicKey: b64Encode(keys.dhPublicKey),
    },
    username,
  )
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadKeyPair(
  username: string,
): Promise<KeyPair | null> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  const req = store.get(username)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const row = req.result
      if (!row) {
        resolve(null)
        return
      }
      resolve({
        signSecretKey: b64Decode(row.signSecretKey),
        signPublicKey: b64Decode(row.signPublicKey),
        dhSecretKey: b64Decode(row.dhSecretKey),
        dhPublicKey: b64Decode(row.dhPublicKey),
      })
    }
    req.onerror = () => reject(req.error)
  })
}

export function importKeysFromJson(json: ImportedKeys): KeyPair {
  const seed32 = b64Decode(json.sign_private_key)
  const expanded = ed25519.keygen(seed32)
  return {
    signSecretKey: expanded.secretKey,
    signPublicKey: expanded.publicKey,
    dhSecretKey: b64Decode(json.dh_private_key),
    dhPublicKey: b64Decode(json.dh_public_key),
  }
}

export async function deleteKeyPair(username: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  store.delete(username)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export { b64Encode, b64Decode, bytesToHex, hexToBytes }
