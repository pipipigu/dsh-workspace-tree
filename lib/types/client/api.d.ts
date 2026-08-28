/**
 * Client API bridge for dsh-workspace-tree.
 */
import type { SubprojectInfo, WorkspaceTreeMeta } from '../shared/types.ts';
export declare const ROUTE_PREFIX = "/api/dsh-workspace-tree";
export declare function fetchTreeMeta(workspaceRoot: string): Promise<WorkspaceTreeMeta | null>;
export declare function saveTreeMeta(workspaceRoot: string, meta: WorkspaceTreeMeta): Promise<WorkspaceTreeMeta | null>;
export declare function scanSubprojects(workspaceRoot: string): Promise<SubprojectInfo[]>;
