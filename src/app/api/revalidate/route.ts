import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { submitToIndexNow } from '@/lib/indexnow'

const BASE = 'https://maisonduprestige.com'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const { path } = await req.json().catch(() => ({}))
  const target: string = path ?? '/'
  revalidatePath(target, 'layout')

  // Notify search engines immediately after cache purge
  const url = target.startsWith('http') ? target : `${BASE}${target}`
  await submitToIndexNow(url)

  return NextResponse.json({ revalidated: true, path: target })
}
