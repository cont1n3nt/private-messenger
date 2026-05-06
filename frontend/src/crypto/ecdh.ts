import { x25519 } from '@noble/curves/ed25519.js'
import type { User } from '../types'
import { b64Decode } from './keys'

export function computePairwiseSecrets(
  myUserId: number,
  myDhSecretKey: Uint8Array,
  users: User[],
): Map<number, Uint8Array> {
  const secrets = new Map<number, Uint8Array>()
  for (const user of users) {
    if (user.id === myUserId) continue
    const theirDhPublic = b64Decode(user.dh_public_key)
    const shared = x25519.getSharedSecret(myDhSecretKey, theirDhPublic)
    secrets.set(user.id, shared)
  }
  return secrets
}
