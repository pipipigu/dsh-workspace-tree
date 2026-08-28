/**
 * dsh-workspace-tree browser client entry.
 *
 * Direct takeover of `sidebar.workspaces` with priority: -10.
 * Injects virtual folders, drag & drop grouping, and nested subprojects directly
 * inside the native workspace list rows, with zero DOM pollution.
 */

import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import { EnhancedWorkspaceBrowser } from './EnhancedWorkspaceBrowser.tsx'
import { globalTreeStore } from './tree-store.ts'

export const name = '@dsh-external/dsh-workspace-tree/client'
export const inject = ['slots', 'sessions', 'workspaces']

export function apply(ctx: ClientContext): void {
  try {
    ;(ctx.slots.inject as any)('sidebar.workspaces', () => {
      return (ctx.slots.register as any)(
        {
          name: 'sidebar.workspaces',
          priority: -10, // intentional shadow over stock workspace browser (lowest renders)
          inject: () => ({
            startSession: (workspaceId?: WorkspaceId) => ctx.workspaces?.startSession?.(workspaceId),
            startSessionInFolder: async (workspaceId: WorkspaceId, wsPath: string, folderId: string) => {
              try {
                // @ts-ignore
                const sessionId = await ctx.workspaces?.connectWorkspace?.(workspaceId)
                if (sessionId) {
                  await globalTreeStore.addSessionToFolder(wsPath, folderId, sessionId as unknown as string)
                  ctx.sessions?.open?.(sessionId)
                }
              } catch (err) {
                console.error('[dsh-workspace-tree] startSessionInFolder failed:', err)
              }
            },
            open: (sessionId: SessionId) => ctx.sessions?.open?.(sessionId),
            renameWorkspace: async (workspaceId: WorkspaceId, title: string) => {
              await ctx.workspaces?.rename?.(workspaceId, title)
            },
            deleteWorkspace: async (workspaceId: WorkspaceId) => {
              await ctx.workspaces?.delete?.(workspaceId)
            },
            createWorkspace: (input: { path: string }) => ctx.workspaces?.create?.(input),
            pickDirectory: () => ctx.workspaces?.pickDirectory?.(),
            renameSession: async (sessionId: SessionId, title: string) => {
              const session = ctx.sessions?.binding?.(sessionId)?.session
              if (session) {
                await session.rename(title)
              }
            },
            archiveSession: async (sessionId: SessionId) => {
              await ctx.workspaces?.archiveSession?.(sessionId)
            },
            forkSession: (sessionId: SessionId) => {
              ctx.sessions?.fork?.({ sessionId, increaseTitle: true })
                .then((childId) => { ctx.sessions?.open?.(childId) })
                .catch(() => {})
            },
          }),
        },
        EnhancedWorkspaceBrowser,
      )
    })
  } catch (err) {
    console.error('[dsh-workspace-tree] Slot injection failed:', err)
  }
}
