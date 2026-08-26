// Cloudflare serves exact static assets and the SPA fallback before invoking
// this Worker. Unmatched non-navigation requests intentionally remain 404.
export default {
  fetch() {
    return new Response('Not Found', { status: 404 })
  },
}
