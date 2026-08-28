/**
 * dsh-workspace-tree host plugin.
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerHttpRoutes } from './http.ts'

export const name = '@dsh-external/dsh-workspace-tree'
export const inject = ['webServer']

export function apply(ctx: Context): void {
  ctx.effect(() => {
    return registerHttpRoutes(ctx)
  })
}
