import { describe, expect, it } from 'vitest'
import { scanSubprojects } from '../src/plugin/scanner.ts'
import { join } from 'node:path'

describe('scanSubprojects', () => {
  it('should scan subprojects in /home/ppz/project/dsh', async () => {
    const root = '/home/ppz/project/dsh'
    const results = await scanSubprojects(root)
    expect(results.length).toBeGreaterThan(0)

    const names = results.map((r) => r.name)
    expect(names).toContain('dsh-dbkit')
    expect(names).toContain('dsh-genui')
    expect(names).toContain('dsh-memory-tdai')

    const dbkit = results.find((r) => r.name === 'dsh-dbkit')
    expect(dbkit?.projectType).toBe('node')
    expect(dbkit?.relativePath).toBe('dsh-dbkit')
  })
})
