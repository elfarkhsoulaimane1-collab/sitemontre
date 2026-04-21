import { isIPv4, isIPv6 } from 'node:net'

function isPrivateIPv4(addr: string): boolean {
  const p = addr.split('.').map(Number)
  return (
    p[0] === 0   ||
    p[0] === 10  ||
    p[0] === 127 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168)
  )
}

function isPrivateIPv6(addr: string): boolean {
  const lower = addr.toLowerCase()

  if (lower === '::1') return true

  if (lower.startsWith('::ffff:')) {
    const rest = lower.slice(7)
    if (isIPv4(rest)) return isPrivateIPv4(rest)
    const m = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
    if (m) {
      const hi = parseInt(m[1], 16), lo = parseInt(m[2], 16)
      return isPrivateIPv4(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`)
    }
  }

  const firstVal = parseInt((lower.split(':')[0] || '0').padStart(4, '0'), 16)
  if ((firstVal & 0xfe00) === 0xfc00) return true  // fc00::/7  unique-local
  if ((firstVal & 0xffc0) === 0xfe80) return true  // fe80::/10 link-local

  return false
}

function isPrivateHost(hostname: string): boolean {
  if (/^localhost$/i.test(hostname)) return true
  const addr = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname
  if (isIPv4(addr)) return isPrivateIPv4(addr)
  if (isIPv6(addr)) return isPrivateIPv6(addr)
  return false
}

/** Returns true when the URL should be blocked (private/loopback address or non-http/s scheme). */
export function isBlockedUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw)
    if (protocol !== 'https:' && protocol !== 'http:') return true
    return isPrivateHost(hostname)
  } catch {
    return true
  }
}
