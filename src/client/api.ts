/**
 * Client API bridge for dsh-workspace-tree.
 */

import type { SubprojectInfo, WorkspaceTreeMeta } from '../shared/types.ts'

export const ROUTE_PREFIX = '/api/dsh-workspace-tree'

export async function fetchTreeMeta(workspaceRoot: string): Promise<WorkspaceTreeMeta | null> {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/meta?workspaceRoot=${encodeURIComponent(workspaceRoot)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { success: boolean; meta: WorkspaceTreeMeta }
    return json.success ? json.meta : null
  } catch (err) {
    console.warn('[dsh-workspace-tree] Failed to fetch meta:', err)
    return null
  }
}

export async function saveTreeMeta(workspaceRoot: string, meta: WorkspaceTreeMeta): Promise<WorkspaceTreeMeta | null> {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/meta`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceRoot, meta }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { success: boolean; meta: WorkspaceTreeMeta }
    return json.success ? json.meta : null
  } catch (err) {
    console.warn('[dsh-workspace-tree] Failed to save meta:', err)
    return null
  }
}

export async function scanSubprojects(workspaceRoot: string): Promise<SubprojectInfo[]> {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/scan?workspaceRoot=${encodeURIComponent(workspaceRoot)}`)
    if (!res.ok) return []
    const json = (await res.json()) as { success: boolean; subprojects: SubprojectInfo[] }
    return json.success ? json.subprojects : []
  } catch (err) {
    console.warn('[dsh-workspace-tree] Failed to scan subprojects:', err)
    return []
  }
}

export interface DirectoryListResult {
  currentPath: string
  parentPath: string | null
  homePath: string
  directories: Array<{ name: string; path: string }>
  error?: string
}

export async function fetchDirectoryList(dirPath?: string, showHidden?: boolean): Promise<DirectoryListResult> {
  try {
    const params = new URLSearchParams()
    if (dirPath) params.set('path', dirPath)
    if (showHidden) params.set('showHidden', 'true')
    const res = await fetch(`${ROUTE_PREFIX}/fs-list?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { success: boolean } & DirectoryListResult
    return json
  } catch (err: any) {
    console.warn('[dsh-workspace-tree] Failed to fetch fs-list:', err)
    return {
      currentPath: dirPath || '/',
      parentPath: null,
      homePath: '/',
      directories: [],
      error: err?.message || '读取目录失败',
    }
  }
}

export async function createFsDirectory(parentPath: string, name: string): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/fs-mkdir`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parentPath, name }),
    })
    const json = (await res.json()) as { success: boolean; path?: string; error?: string }
    return json
  } catch (err: any) {
    return { success: false, error: err?.message || '创建文件夹失败' }
  }
}
