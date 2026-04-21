// HMAC-signed session tokens — works in both Edge (middleware) and Node.js (API routes).
// Cookie value: `{uuid}.{hex-hmac-sha256}`
// The ADMIN_SECRET never appears in the cookie. Validation recomputes the HMAC and
// compares with a constant-time XOR loop so timing attacks can't leak the key.

const ALGO = { name: 'HMAC', hash: 'SHA-256' } as const

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGO,
    false,
    ['sign'],
  )
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSession(secret: string): Promise<string> {
  const token = crypto.randomUUID()
  const key   = await hmacKey(secret)
  const sig   = await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(token))
  return `${token}.${toHex(sig)}`
}

export async function verifySession(
  cookieValue: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!cookieValue || !secret) return false
  const dot = cookieValue.lastIndexOf('.')
  if (dot === -1) return false
  const token = cookieValue.slice(0, dot)
  const sig   = cookieValue.slice(dot + 1)
  if (!token || !sig) return false
  try {
    const key      = await hmacKey(secret)
    const expected = toHex(await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(token)))
    if (expected.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
