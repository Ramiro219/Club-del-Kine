export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Exact files are served before the Worker. For a non-file SPA route,
    // fetch the exact root asset through the same public origin so the current
    // pathname is preserved without relying on an ASSETS runtime binding.
    const indexUrl = new URL('/', request.url)
    return fetch(new Request(indexUrl, request))
  },
}
