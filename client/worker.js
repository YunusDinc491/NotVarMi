// Cloudflare serves the React build and forwards same-origin API requests to Render.
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url)
    if (!incoming.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    let origin
    try { origin = new URL(env.API_ORIGIN) } catch { return new Response('API yapılandırması eksik.', { status: 503 }) }
    if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.onrender.com') || origin.username || origin.password || origin.port || origin.pathname !== '/' || origin.search || origin.hash) {
      return new Response('API yapılandırması geçersiz.', { status: 503 })
    }
    const target = new URL(incoming.pathname + incoming.search, origin)
    try {
      const upstream = await fetch(new Request(target, request), { redirect: 'manual' })
      const headers = new Headers(upstream.headers)
      headers.set('Cache-Control', 'no-store')
      return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers })
    } catch {
      return new Response('Sunucuya ulaşılamadı. Biraz sonra tekrar dene.', { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
  },
}
