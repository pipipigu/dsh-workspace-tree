import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { WorkspaceTreeMeta } from '../shared/types.ts'
import { scanSubprojects } from './scanner.ts'

const META_FILE_NAME = 'workspace-tree.json'

/**
 * Get the path to .dsh/workspace-tree.json for a given workspace root.
 */
export function getMetaFilePath(workspaceRoot: string): string {
  return join(resolve(workspaceRoot), '.dsh', META_FILE_NAME)
}

/**
 * Read workspace tree metadata, automatically initializing and scanning subprojects if missing.
 */
export async function readWorkspaceTreeMeta(workspaceRoot: string): Promise<WorkspaceTreeMeta> {
  const filePath = getMetaFilePath(workspaceRoot)
  try {
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as Partial<WorkspaceTreeMeta>

    // Fill missing fields with defaults
    return {
      version: 1,
      inboxSessionIds: Array.isArray(parsed.inboxSessionIds) ? parsed.inboxSessionIds : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      subprojects: Array.isArray(parsed.subprojects) ? parsed.subprojects : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    // If not exists or invalid, scan subprojects and initialize fresh
    const subprojects = await scanSubprojects(workspaceRoot)
    const freshMeta: WorkspaceTreeMeta = {
      version: 1,
      inboxSessionIds: [],
      folders: [],
      subprojects,
      updatedAt: Date.now(),
    }

    // Save initial metadata quietly
    try {
      await writeWorkspaceTreeMeta(workspaceRoot, freshMeta)
    } catch {
      // Ignore write errors during read fallback
    }

    return freshMeta
  }
}

/**
 * Atomically write workspace tree metadata.
 */
export async function writeWorkspaceTreeMeta(workspaceRoot: string, meta: WorkspaceTreeMeta): Promise<void> {
  const filePath = getMetaFilePath(workspaceRoot)
  const dir = dirname(filePath)

  await mkdir(dir, { recursive: true })

  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
  const serialized = JSON.stringify(
    {
      ...meta,
      version: 1,
      updatedAt: Date.now(),
    },
    null,
    2,
  )

  await writeFile(tmpPath, serialized, 'utf-8')
  await rename(tmpPath, filePath)
}
