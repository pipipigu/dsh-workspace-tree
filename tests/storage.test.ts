import { describe, expect, it, afterAll } from 'vitest'
import { getMetaFilePath, readWorkspaceTreeMeta, writeWorkspaceTreeMeta } from '../src/plugin/storage.ts'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('storage', () => {
  const testRoot = join(tmpdir(), `dsh-test-storage-${Date.now()}`)

  afterAll(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('should initialize and read fresh metadata when missing', async () => {
    const meta = await readWorkspaceTreeMeta(testRoot)
    expect(meta.version).toBe(1)
    expect(Array.isArray(meta.folders)).toBe(true)
    expect(Array.isArray(meta.inboxSessionIds)).toBe(true)
  })

  it('should write and read back metadata atomically', async () => {
    const freshMeta = {
      version: 1,
      inboxSessionIds: ['sess-1', 'sess-2'],
      folders: [
        {
          id: 'f-1',
          name: 'Folder Test',
          collapsed: false,
          color: '#4ade80',
          sessionIds: ['sess-1'],
        },
      ],
      subprojects: [],
      updatedAt: Date.now(),
    }

    await writeWorkspaceTreeMeta(testRoot, freshMeta)
    const readBack = await readWorkspaceTreeMeta(testRoot)
    expect(readBack.inboxSessionIds).toEqual(['sess-1', 'sess-2'])
    expect(readBack.folders.length).toBe(1)
    expect(readBack.folders[0]?.name).toBe('Folder Test')
  })
})
