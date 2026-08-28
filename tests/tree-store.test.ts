import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TreeStore } from '../src/client/tree-store.ts'

// Mock api methods
vi.mock('../src/client/api.ts', () => ({
  fetchTreeMeta: vi.fn().mockResolvedValue(null),
  saveTreeMeta: vi.fn().mockResolvedValue(null),
  scanSubprojects: vi.fn().mockResolvedValue([]),
}))

describe('TreeStore', () => {
  let store: TreeStore
  const ws1 = '/workspace/project-alpha'
  const ws2 = '/workspace/project-beta'

  beforeEach(() => {
    store = new TreeStore()
  })

  it('should initialize and maintain independent workspace metadata', async () => {
    const meta1 = store.getMetaForWorkspace(ws1)
    const meta2 = store.getMetaForWorkspace(ws2)
    expect(meta1.folders).toEqual([])
    expect(meta2.folders).toEqual([])

    // Create folder in ws1
    const f1Id = await store.createFolder(ws1, 'DSH Folder', '#4ade80')
    expect(store.getMetaForWorkspace(ws1).folders.length).toBe(1)
    expect(store.getMetaForWorkspace(ws2).folders.length).toBe(0)

    // Create folder in ws2
    await store.createFolder(ws2, 'Desktop Folder', '#60a5fa')
    expect(store.getMetaForWorkspace(ws1).folders[0]?.name).toBe('DSH Folder')
    expect(store.getMetaForWorkspace(ws2).folders[0]?.name).toBe('Desktop Folder')

    // Rename folder in ws1
    await store.renameFolder(ws1, f1Id, 'Renamed DSH Folder')
    expect(store.getMetaForWorkspace(ws1).folders[0]?.name).toBe('Renamed DSH Folder')
  })

  it('should move session into folder and delete folder', async () => {
    const fId = await store.createFolder(ws1, 'Dev Work')
    await store.moveSession(ws1, 'sess-1', fId)

    let meta = store.getMetaForWorkspace(ws1)
    expect(meta.folders[0]?.sessionIds).toEqual(['sess-1'])

    // Move out
    await store.moveSession(ws1, 'sess-1', null)
    meta = store.getMetaForWorkspace(ws1)
    expect(meta.folders[0]?.sessionIds).toEqual([])

    // Delete folder
    await store.deleteFolder(ws1, fId)
    meta = store.getMetaForWorkspace(ws1)
    expect(meta.folders.length).toBe(0)
  })

  it('should toggle pin session in specific workspace', async () => {
    await store.togglePinSession(ws1, 'sess-pin-1')
    let meta = store.getMetaForWorkspace(ws1)
    expect(meta.pinnedSessionIds).toContain('sess-pin-1')

    await store.togglePinSession(ws1, 'sess-pin-1')
    meta = store.getMetaForWorkspace(ws1)
    expect(meta.pinnedSessionIds).not.toContain('sess-pin-1')
  })
})
