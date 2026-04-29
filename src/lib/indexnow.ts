const HOST = 'www.maisonduprestige.com'
const KEY  = '619b19515c0145e4b1b73a11351b24ec'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export async function submitToIndexNow(urls: string | string[]): Promise<void> {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
  if (urlList.length === 0) return

  await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  })
}
