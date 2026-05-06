import { ed25519 } from '@noble/curves/ed25519.js'
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js'

export function signChallenge(
  challengeHex: string,
  signSecretKey: Uint8Array,
): string {
  const message = hexToBytes(challengeHex)
  const signature = ed25519.sign(message, signSecretKey)
  return bytesToHex(signature)
}
