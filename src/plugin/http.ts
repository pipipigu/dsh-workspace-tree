/**
 * HTTP routes for dsh-workspace-tree host backend.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WorkspaceTreeMeta } from '../shared/types.ts'
import { readWorkspaceTreeMeta, writeWorkspaceTreeMeta } from './storage.ts'
import { scanSubprojects } from './scanner.ts'

export const ROUTE_PREFIX = '/api/dsh-workspace-tree'

export interface WebServerLike {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer?: WebServerLike
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function readBodyJson<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8')
        resolve(text.length > 0 ? JSON.parse(text) : ({} as T))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

export function registerHttpRoutes(ctx: Context): () => void {
  if (!ctx.webServer) {
    return () => {}
  }

  const cleanup = ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const subPath = url.pathname.slice(ROUTE_PREFIX.length)

      try {
        if (req.method === 'GET' && subPath === '/meta') {
          const workspaceRoot = url.searchParams.get('workspaceRoot') || process.cwd()
          const meta = await readWorkspaceTreeMeta(workspaceRoot)
          sendJson(res, 200, { success: true, meta })
          return
        }

        if (req.method === 'POST' && subPath === '/meta') {
          const body = await readBodyJson<{ workspaceRoot?: string; meta?: WorkspaceTreeMeta }>(req)
          const workspaceRoot = body.workspaceRoot || process.cwd()
          if (!body.meta) {
            sendJson(res, 400, { success: false, error: 'Missing meta payload' })
            return
          }
          await writeWorkspaceTreeMeta(workspaceRoot, body.meta)
          const updated = await readWorkspaceTreeMeta(workspaceRoot)
          sendJson(res, 200, { success: true, meta: updated })
          return
        }

        if (req.method === 'GET' && subPath === '/scan') {
          const workspaceRoot = url.searchParams.get('workspaceRoot') || process.cwd()
          const subprojects = await scanSubprojects(workspaceRoot)
          sendJson(res, 200, { success: true, subprojects })
          return
        }

        sendJson(res, 404, { success: false, error: `Not found: ${url.pathname}` })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        sendJson(res, 500, { success: false, error: message })
      }
    },
  })

  return cleanup
}
