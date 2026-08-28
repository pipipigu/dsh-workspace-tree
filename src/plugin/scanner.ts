import { readdir, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import type { SubprojectInfo, SubprojectType } from '../shared/types.ts'

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.agents',
  '.dsh',
  '.scratch',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'target',
  'lib',
  'coverage',
  '.turbo',
  '.next',
])

/**
 * Detect subproject type based on markers inside directory.
 */
async function detectProjectType(dirPath: string): Promise<SubprojectType | null> {
  try {
    const entries = await readdir(dirPath)
    const set = new Set(entries)

    if (set.has('package.json')) return 'node'
    if (set.has('Cargo.toml')) return 'rust'
    if (set.has('pyproject.toml') || set.has('requirements.txt') || set.has('setup.py')) return 'python'
    if (set.has('pom.xml') || set.has('build.gradle')) return 'java'
    if (set.has('go.mod')) return 'go'
    if (set.has('AGENTS.md') || set.has('.git')) return 'general'

    return null
  } catch {
    return null
  }
}

/**
 * Scan workspace root for valid subprojects (max 2 levels depth).
 */
export async function scanSubprojects(rootPath: string, maxDepth = 2): Promise<SubprojectInfo[]> {
  const results: SubprojectInfo[] = []
  const resolvedRoot = resolve(rootPath)

  async function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return

    let entries: string[] = []
    try {
      entries = await readdir(currentDir)
    } catch {
      return
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue

      const fullPath = join(currentDir, entry)
      try {
        const fileStat = await stat(fullPath)
        if (!fileStat.isDirectory()) continue

        const pType = await detectProjectType(fullPath)
        if (pType !== null) {
          const rel = relative(resolvedRoot, fullPath)
          results.push({
            id: `sp-${rel.replace(/[\/\\]/g, '-')}`,
            name: entry,
            relativePath: rel,
            absolutePath: fullPath,
            projectType: pType,
            enabled: true,
          })
          // If project detected, don't recurse deeper inside this subproject
          continue
        }

        // Recurse into normal folders
        if (depth < maxDepth) {
          await walk(fullPath, depth + 1)
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  await walk(resolvedRoot, 1)
  return results.sort((a, b) => a.name.localeCompare(b.name))
}
