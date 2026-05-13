import { ed25519, x25519 } from '@noble/curves/ed25519.js'
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
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
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
    let resolved = false
    req.onsuccess = () => {
      const row = req.result
      if (!row) {
        resolved = true
        db.close()
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
    tx.oncomplete = () => { if (!resolved) db.close() }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export function importKeysFromJson(json: ImportedKeys): KeyPair {
  const rawKey = b64Decode(json.sign_private_key)
  let signSecretKey: Uint8Array
  let signPublicKey: Uint8Array

  if (rawKey.length === 32) {
    const expanded = ed25519.keygen(rawKey)
    signSecretKey = expanded.secretKey
    signPublicKey = expanded.publicKey
  } else if (rawKey.length === 64) {
    signSecretKey = rawKey
    signPublicKey = b64Decode(json.sign_public_key)
    const expectedPub = rawKey.subarray(32)
    if (!signPublicKey.every((b, i) => b === expectedPub[i])) {
      throw new Error('Sign secret key does not match sign public key')
    }
  } else {
    throw new Error(`Invalid sign key length: ${rawKey.length}`)
  }

  const dhSecretKey = b64Decode(json.dh_private_key)
  const dhPublicKey = b64Decode(json.dh_public_key)
  if (dhSecretKey.length !== 32) throw new Error(`Invalid DH private key length: ${dhSecretKey.length}, expected 32`)
  if (dhPublicKey.length !== 32) throw new Error(`Invalid DH public key length: ${dhPublicKey.length}, expected 32`)
  const expectedDhPub = x25519.getPublicKey(dhSecretKey)
  if (!dhPublicKey.every((b, i) => b === expectedDhPub[i])) {
    throw new Error('DH public key does not match DH private key')
  }

  return {
    signSecretKey,
    signPublicKey,
    dhSecretKey,
    dhPublicKey,
  }
}

export async function deleteKeyPair(username: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  store.delete(username)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export { b64Encode, b64Decode }
