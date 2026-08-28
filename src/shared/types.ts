/**
 * dsh-workspace-tree shared type definitions.
 */

export interface VirtualFolder {
  id: string
  name: string
  collapsed: boolean
  color?: string
  sessionIds: string[]
  order?: number
  createdAt?: number
}

export type SubprojectType = 'node' | 'rust' | 'python' | 'java' | 'go' | 'general'

export interface SubprojectInfo {
  id: string
  name: string
  relativePath: string
  absolutePath: string
  projectType: SubprojectType
  enabled: boolean
}

export interface WorkspaceTreeMeta {
  version: number
  inboxSessionIds: string[]
  pinnedSessionIds?: string[]
  folders: VirtualFolder[]
  subprojects: SubprojectInfo[]
  updatedAt: number
}

export interface TreeOperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
