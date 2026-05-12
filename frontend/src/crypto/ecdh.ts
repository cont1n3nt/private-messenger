import { x25519 } from '@noble/curves/ed25519.js'
import type { User } from '../types'
import { b64Decode } from './keys'

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new Uint8Array(prk), { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', info: new Uint8Array(info), salt: new Uint8Array(0) },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

export async function computePairwiseSecrets(
  myUserId: number,
  myDhSecretKey: Uint8Array,
  users: User[],
): Promise<Map<number, Uint8Array>> {
  const secrets = new Map<number, Uint8Array>()
  for (const user of users) {
    if (user.id === myUserId) continue
    if (!user.dh_public_key) continue
    const theirDhPublic = b64Decode(user.dh_public_key)
    const rawShared = x25519.getSharedSecret(myDhSecretKey, theirDhPublic)
    const lo = Math.min(myUserId, user.id)
    const hi = Math.max(myUserId, user.id)
    const info = new TextEncoder().encode(`private-messenger-ecdh-${lo}-${hi}`)
    const derived = await hkdfExpand(new Uint8Array(rawShared), info, 32)
    secrets.set(user.id, derived)
  }
  return secrets
}
