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
