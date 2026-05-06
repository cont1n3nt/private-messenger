import client from './client'
import type { User } from '../types'

export async function initKeys(
  signPublicKey: string,
  dhPublicKey: string,
): Promise<void> {
  await client.post('/keys/init', {
    sign_public_key: signPublicKey,
    dh_public_key: dhPublicKey,
  })
}

export async function getKeys(): Promise<User[]> {
  const res = await client.get('/keys')
  return res.data.data
}
