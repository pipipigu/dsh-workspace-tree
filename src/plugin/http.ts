/**
 * HTTP routes for dsh-workspace-tree host backend.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readdir, mkdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
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

        // 🌟 目录树列表 API (供可视化目录选择器使用)
        if (req.method === 'GET' && subPath === '/fs-list') {
          const rawTarget = url.searchParams.get('path')
          const showHidden = url.searchParams.get('showHidden') === 'true'
          const home = homedir()
          const target = rawTarget ? resolve(rawTarget) : home

          try {
            const dirents = await readdir(target, { withFileTypes: true })
            const directories: Array<{ name: string; path: string }> = []

            for (const dirent of dirents) {
              if (!dirent.isDirectory()) continue
              if (!showHidden && dirent.name.startsWith('.')) continue
              directories.push({
                name: dirent.name,
                path: join(target, dirent.name),
              })
            }

            directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

            const parentPath = target === '/' ? null : dirname(target)
            sendJson(res, 200, {
              success: true,
              currentPath: target,
              parentPath,
              homePath: home,
              directories,
            })
          } catch (fsErr: any) {
            sendJson(res, 200, {
              success: false,
              error: fsErr?.message || '无法读取该目录',
              currentPath: target,
              parentPath: target === '/' ? null : dirname(target),
              homePath: home,
              directories: [],
            })
          }
          return
        }

        // 🌟 新建目录 API
        if (req.method === 'POST' && subPath === '/fs-mkdir') {
          const body = await readBodyJson<{ parentPath?: string; name?: string }>(req)
          if (!body.parentPath || !body.name) {
            sendJson(res, 400, { success: false, error: 'Missing parentPath or name' })
            return
          }
          const fullPath = join(resolve(body.parentPath), body.name.trim())
          await mkdir(fullPath, { recursive: true })
          sendJson(res, 200, { success: true, path: fullPath })
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
