import client from './client'
import type { Message } from '../types'

export async function sendMessage(
  ciphertext: string,
  nonce: string,
  replyToMessage?: number,
): Promise<Message> {
  const payload: Record<string, string | number> = { ciphertext, nonce }
  if (replyToMessage !== undefined && replyToMessage >= 0) {
    payload.reply_to_message = replyToMessage
  }
  const res = await client.post('/messages', payload)
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

export async function editMessage(
  id: number,
  ciphertext: string,
  nonce: string,
): Promise<Message> {
  const res = await client.post('/messages/edit', {
    message_id: id,
    ciphertext,
    nonce,
  })
  return res.data.data
}

export async function deleteMessage(id: number): Promise<Message> {
  const res = await client.post('/messages/delete', { message_id: id })
  return res.data.data
}
