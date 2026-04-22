/**
 * Vite configuration.
 *
 * Contains the `requestProxy()` plugin which provides the `/api/request`
 * endpoint during development. This eliminates the need to run a separate
 * Go backend process during development.
 *
 * How it works:
 *   - The plugin uses Vite's `configureServer` hook to add a custom
 *     middleware to the dev server
 *   - When the browser sends `POST /api/request`, the middleware:
 *     1. Parses the JSON body (url, method, params, body)
 *     2. Makes the actual HTTP request server-side using Node's fetch
 *     3. Returns the response (status, headers, body, ok) as JSON
 *   - This avoids browser CORS restrictions because the request
 *     originates from the server, not the browser
 *
 * For production, the Go backend (`server/main.go`) handles this instead.
 *
 * The plugin is placed BEFORE the react() plugin in the plugins array
 * so that the middleware is registered before React's middleware.
 */
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Vite plugin that adds a `/api/request` endpoint to the dev server.
 * This proxies HTTP requests server-side to avoid CORS restrictions.
 */
function requestProxy(): PluginOption {
  return {
    name: 'request-proxy',
    configureServer(server) {
      server.middlewares.use('/api/request', async (req: IncomingMessage, res: ServerResponse) => {
        // Only POST is supported
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('method not allowed')
          return
        }

        // Read the request body
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk)
        const raw = Buffer.concat(chunks).toString()

        // Parse the JSON payload
        let parsed: { url?: string; method?: string; params?: Record<string, string>; body?: string }
        try { parsed = JSON.parse(raw) } catch {
          res.statusCode = 400
          res.end('invalid json')
          return
        }

        const { url, method = 'GET', params, body } = parsed
        if (!url) {
          res.statusCode = 400
          res.end('missing url')
          return
        }

        try {
          // Build the target URL with query parameters
          const target = new URL(url)
          if (params) {
            for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v)
          }

          // Build fetch options (only send body for non-GET/HEAD methods)
          const opts: RequestInit = { method }
          if (body && method !== 'GET' && method !== 'HEAD') {
            opts.body = typeof body === 'string' ? body : JSON.stringify(body)
            opts.headers = { 'Content-Type': 'application/json' }
          }

          // Make the actual HTTP request server-side
          const response = await fetch(target.toString(), opts)
          const respBody = await response.text()

          // Collect response headers into a plain object
          const headers: Record<string, string> = {}
          response.headers.forEach((v, k) => { headers[k] = v })

          // Return the proxied response as JSON
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: response.status,
            headers,
            body: respBody,
            ok: response.status >= 200 && response.status < 300,
          }))
        } catch (err) {
          // Forward errors (DNS failure, network timeout, etc.)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 0,
            headers: {},
            body: `request failed: ${err}`,
            ok: false,
          }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [requestProxy(), react()],
})
