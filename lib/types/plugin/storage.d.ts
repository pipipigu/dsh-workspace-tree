import type { WorkspaceTreeMeta } from '../shared/types.ts';
/**
 * Get the path to .dsh/workspace-tree.json for a given workspace root.
 */
export declare function getMetaFilePath(workspaceRoot: string): string;
/**
 * Read workspace tree metadata, automatically initializing and scanning subprojects if missing.
 */
export declare function readWorkspaceTreeMeta(workspaceRoot: string): Promise<WorkspaceTreeMeta>;
/**
 * Atomically write workspace tree metadata.
 */
export declare function writeWorkspaceTreeMeta(workspaceRoot: string, meta: WorkspaceTreeMeta): Promise<void>;
