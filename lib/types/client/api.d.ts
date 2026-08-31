/**
 * Client API bridge for dsh-workspace-tree.
 */
import type { SubprojectInfo, WorkspaceTreeMeta } from '../shared/types.ts';
export declare const ROUTE_PREFIX = "/api/dsh-workspace-tree";
export declare function fetchTreeMeta(workspaceRoot: string): Promise<WorkspaceTreeMeta | null>;
export declare function saveTreeMeta(workspaceRoot: string, meta: WorkspaceTreeMeta): Promise<WorkspaceTreeMeta | null>;
export declare function scanSubprojects(workspaceRoot: string): Promise<SubprojectInfo[]>;
export interface DirectoryListResult {
    currentPath: string;
    parentPath: string | null;
    homePath: string;
    directories: Array<{
        name: string;
        path: string;
    }>;
    error?: string;
}
export declare function fetchDirectoryList(dirPath?: string, showHidden?: boolean): Promise<DirectoryListResult>;
export declare function createFsDirectory(parentPath: string, name: string): Promise<{
    success: boolean;
    path?: string;
    error?: string;
}>;
