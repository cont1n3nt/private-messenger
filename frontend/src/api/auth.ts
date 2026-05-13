import client from './client'

export async function requestChallenge(username: string): Promise<string> {
  const res = await client.post('/auth/challenge', { username })
  return res.data.data.challenge
}

export async function verifySignature(
  username: string,
  challenge: string,
  signature: string,
): Promise<{ token: string; expires_at: string }> {
  const res = await client.post('/auth/verify', {
    username,
    challenge,
    signature,
  })
  return res.data.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function getMe(): Promise<{ id: number; username: string }> {
  const res = await client.get('/auth/me')
  return res.data.data
}
