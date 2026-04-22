import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

function requestProxy(): PluginOption {
  return {
    name: 'request-proxy',
    configureServer(server) {
      server.middlewares.use('/api/request', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('method not allowed')
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk)
        const raw = Buffer.concat(chunks).toString()

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
          const target = new URL(url)
          if (params) {
            for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v)
          }

          const opts: RequestInit = { method }
          if (body && method !== 'GET' && method !== 'HEAD') {
            opts.body = typeof body === 'string' ? body : JSON.stringify(body)
            opts.headers = { 'Content-Type': 'application/json' }
          }

          const response = await fetch(target.toString(), opts)
          const respBody = await response.text()

          const headers: Record<string, string> = {}
          response.headers.forEach((v, k) => { headers[k] = v })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: response.status,
            headers,
            body: respBody,
            ok: response.status >= 200 && response.status < 300,
          }))
        } catch (err) {
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
