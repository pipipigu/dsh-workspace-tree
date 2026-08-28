/**
 * Multi-Workspace Reactive TreeStore for managing virtual folders, subprojects,
 * and session placements across all workspaces concurrently.
 */

import type { VirtualFolder, WorkspaceTreeMeta, SubprojectInfo } from '../shared/types.ts'
import { fetchTreeMeta, saveTreeMeta, scanSubprojects } from './api.ts'

export type Listener = () => void

const DEFAULT_META = (workspaceRoot: string): WorkspaceTreeMeta => ({
  version: 1,
  inboxSessionIds: [],
  pinnedSessionIds: [],
  folders: [],
  subprojects: [],
  updatedAt: Date.now(),
})

export class TreeStore {
  private cache: Map<string, WorkspaceTreeMeta> = new Map()
  private listeners: Set<Listener> = new Set()
  private isSavingMap: Map<string, boolean> = new Map()
  private version = 0

  constructor() {}

  getVersion(): number {
    return this.version
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    this.version++
    for (const listener of this.listeners) {
      listener()
    }
  }

  /**
   * Get metadata for a specific workspace path.
   */
  getMetaForWorkspace(workspaceRoot: string): WorkspaceTreeMeta {
    if (!workspaceRoot) return DEFAULT_META('')
    const existing = this.cache.get(workspaceRoot)
    if (existing) return existing

    const fresh = DEFAULT_META(workspaceRoot)
    this.cache.set(workspaceRoot, fresh)
    // Async load in background
    this.loadWorkspace(workspaceRoot)
    return fresh
  }

  /**
   * Load metadata from backend for a specific workspace.
   */
  async loadWorkspace(workspaceRoot: string): Promise<void> {
    if (!workspaceRoot) return
    const loaded = await fetchTreeMeta(workspaceRoot)
    if (loaded) {
      this.cache.set(workspaceRoot, {
        ...loaded,
        pinnedSessionIds: Array.isArray(loaded.pinnedSessionIds) ? loaded.pinnedSessionIds : [],
      })
      this.notify()
    }
  }

  /**
   * Create a new folder under a specific workspace.
   */
  async createFolder(workspaceRoot: string, name: string, color: string = '#60a5fa'): Promise<string> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const trimmed = name.trim() || '新建文件夹'
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newFolder: VirtualFolder = {
      id,
      name: trimmed,
      collapsed: false,
      color,
      sessionIds: [],
      createdAt: Date.now(),
    }

    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: [...meta.folders, newFolder],
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
    return id
  }

  /**
   * Rename a folder in a specific workspace.
   */
  async renameFolder(workspaceRoot: string, folderId: string, name: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const trimmed = name.trim()
    if (!trimmed) return

    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: meta.folders.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)),
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Delete a folder in a specific workspace.
   */
  async deleteFolder(workspaceRoot: string, folderId: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: meta.folders.filter((f) => f.id !== folderId),
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Toggle collapse status of a folder in a specific workspace.
   */
  async toggleFolder(workspaceRoot: string, folderId: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: meta.folders.map((f) => (f.id === folderId ? { ...f, collapsed: !f.collapsed } : f)),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Set color for a folder in a specific workspace.
   */
  async setFolderColor(workspaceRoot: string, folderId: string, color: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: meta.folders.map((f) => (f.id === folderId ? { ...f, color } : f)),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Move a session into a specific folder or to uncategorized (targetFolderId = null).
   */
  async moveSession(workspaceRoot: string, sessionId: string, targetFolderId: string | null): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const updatedFolders = meta.folders.map((folder) => {
      const filtered = folder.sessionIds.filter((id) => id !== sessionId)
      if (targetFolderId !== null && folder.id === targetFolderId) {
        return {
          ...folder,
          collapsed: false, // 🌟 移入或新建时自动展开文件夹，会话立即可见
          sessionIds: [sessionId, ...filtered],
        }
      }
      return {
        ...folder,
        sessionIds: filtered,
      }
    })

    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: updatedFolders,
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Add a newly created session directly into a folder.
   */
  async addSessionToFolder(workspaceRoot: string, folderId: string, sessionId: string): Promise<void> {
    await this.moveSession(workspaceRoot, sessionId, folderId)
  }

  /**
   * Toggle pinned status of a session in a specific workspace.
   */
  async togglePinSession(workspaceRoot: string, sessionId: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const currentPinned = new Set(meta.pinnedSessionIds || [])
    if (currentPinned.has(sessionId)) {
      currentPinned.delete(sessionId)
    } else {
      currentPinned.add(sessionId)
    }

    const updated: WorkspaceTreeMeta = {
      ...meta,
      pinnedSessionIds: Array.from(currentPinned),
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  /**
   * Completely remove a deleted session from all folders and pinned list in a workspace.
   */
  async purgeSession(workspaceRoot: string, sessionId: string): Promise<void> {
    const meta = this.getMetaForWorkspace(workspaceRoot)
    const updatedFolders = meta.folders.map((folder) => ({
      ...folder,
      sessionIds: folder.sessionIds.filter((id) => id !== sessionId),
    }))
    const updatedPinned = (meta.pinnedSessionIds || []).filter((id) => id !== sessionId)

    const updated: WorkspaceTreeMeta = {
      ...meta,
      folders: updatedFolders,
      pinnedSessionIds: updatedPinned,
      updatedAt: Date.now(),
    }

    this.cache.set(workspaceRoot, updated)
    this.notify()
    await this.persist(workspaceRoot)
  }

  private async persist(workspaceRoot: string): Promise<void> {
    if (!workspaceRoot || this.isSavingMap.get(workspaceRoot)) return
    this.isSavingMap.set(workspaceRoot, true)
    try {
      const meta = this.getMetaForWorkspace(workspaceRoot)
      await saveTreeMeta(workspaceRoot, meta)
    } finally {
      this.isSavingMap.set(workspaceRoot, false)
    }
  }
}

export const globalTreeStore = new TreeStore()
