import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { randomBytes, hexToBytes, bytesToHex } from '@noble/ciphers/utils.js'
import { b64Encode, b64Decode } from './keys'

export function encrypt(
  plaintext: string,
  key: Uint8Array,
): { ciphertext: string; nonce: string } {
  const nonce = randomBytes(24)
  const cipher = xchacha20poly1305(key, nonce)
  const plaintextBytes = new TextEncoder().encode(plaintext)
  const ciphertextBytes = cipher.encrypt(plaintextBytes)
  return {
    ciphertext: b64Encode(ciphertextBytes),
    nonce: bytesToHex(nonce),
  }
}

export function decrypt(
  ciphertextB64: string,
  nonceHex: string,
  key: Uint8Array,
): string | null {
  try {
    const nonce = hexToBytes(nonceHex)
    const ciphertext = b64Decode(ciphertextB64)
    const cipher = xchacha20poly1305(key, nonce)
    const plaintextBytes = cipher.decrypt(ciphertext)
    return new TextDecoder().decode(plaintextBytes)
  } catch {
    return null
  }
}
