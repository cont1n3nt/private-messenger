export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer)
  return new Uint8Array(hash)
}

export async function deriveGroupKey(
  pairwiseSecrets: Map<number, Uint8Array>,
): Promise<Uint8Array> {
  const ids = Array.from(pairwiseSecrets.keys()).sort((a, b) => a - b)
  const chunks: Uint8Array[] = []
  for (const id of ids) {
    const secret = pairwiseSecrets.get(id)!
    const idBytes = new Uint8Array(4)
    new DataView(idBytes.buffer).setUint32(0, id, false)
    chunks.push(idBytes, secret)
  }
  const combined = concatUint8Arrays(chunks)
  return sha256(combined)
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}
