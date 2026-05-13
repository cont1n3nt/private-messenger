const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export function getSafeExternalUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null

  try {
    const parsed = new URL(rawUrl, window.location.origin)
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
