import { describe, expect, it } from 'vitest'
import { scanSubprojects } from '../src/plugin/scanner.ts'
import { resolve } from 'node:path'

describe('scanSubprojects', () => {
  it('should scan subprojects dynamically in parent workspace root', async () => {
    const root = resolve(__dirname, '../..')
    const results = await scanSubprojects(root)
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)

    const names = results.map((r) => r.name)
    expect(names).toContain('dsh-workspace-tree')

    const selfProj = results.find((r) => r.name === 'dsh-workspace-tree')
    expect(selfProj?.projectType).toBe('node')
    expect(selfProj?.relativePath).toBe('dsh-workspace-tree')
  })
})
