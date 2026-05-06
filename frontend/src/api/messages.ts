import client from './client'
import type { Message } from '../types'

export async function sendMessage(
  ciphertext: string,
  nonce: string,
): Promise<Message> {
  const res = await client.post('/messages', { ciphertext, nonce })
  return res.data.data
}

export async function getMessages(
  limit?: number,
  afterId?: number,
): Promise<Message[]> {
  const params: Record<string, number> = {}
  if (limit !== undefined) params.limit = limit
  if (afterId !== undefined) params.after_id = afterId
  const res = await client.get('/messages', { params })
  return res.data.data
}
