import { NextRequest, NextResponse } from 'next/server'
import { submitToIndexNow } from '@/lib/indexnow'

const BASE = 'https://www.maisonduprestige.com'

// POST /api/indexnow
// Body: { paths: string[] }   — relative paths like ["/product/my-watch", "/collection"]
// Query: ?secret=REVALIDATE_SECRET
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const { paths } = await req.json().catch(() => ({ paths: [] }))
  const urls: string[] = (paths ?? []).map((p: string) =>
    p.startsWith('http') ? p : `${BASE}${p.startsWith('/') ? p : `/${p}`}`
  )

  if (urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
  }

  await submitToIndexNow(urls)
  return NextResponse.json({ submitted: true, urls })
}
