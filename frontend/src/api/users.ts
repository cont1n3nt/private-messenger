import client from './client'
import type { User } from '../types'

export async function getUsers(): Promise<User[]> {
  const res = await client.get('/users')
  return res.data.data
}
