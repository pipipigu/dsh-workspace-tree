/**
 * Multi-Workspace Reactive TreeStore for managing virtual folders, subprojects,
 * and session placements across all workspaces concurrently.
 */
import type { WorkspaceTreeMeta } from '../shared/types.ts';
export type Listener = () => void;
export declare class TreeStore {
    private cache;
    private listeners;
    private isSavingMap;
    private version;
    constructor();
    getVersion(): number;
    subscribe(listener: Listener): () => void;
    private notify;
    /**
     * Get metadata for a specific workspace path.
     */
    getMetaForWorkspace(workspaceRoot: string): WorkspaceTreeMeta;
    /**
     * Load metadata from backend for a specific workspace.
     */
    loadWorkspace(workspaceRoot: string): Promise<void>;
    /**
     * Create a new folder under a specific workspace.
     */
    createFolder(workspaceRoot: string, name: string, color?: string): Promise<string>;
    /**
     * Rename a folder in a specific workspace.
     */
    renameFolder(workspaceRoot: string, folderId: string, name: string): Promise<void>;
    /**
     * Delete a folder in a specific workspace.
     */
    deleteFolder(workspaceRoot: string, folderId: string): Promise<void>;
    /**
     * Toggle collapse status of a folder in a specific workspace.
     */
    toggleFolder(workspaceRoot: string, folderId: string): Promise<void>;
    /**
     * Set color for a folder in a specific workspace.
     */
    setFolderColor(workspaceRoot: string, folderId: string, color: string): Promise<void>;
    /**
     * Move a session into a specific folder or to uncategorized (targetFolderId = null).
     */
    moveSession(workspaceRoot: string, sessionId: string, targetFolderId: string | null): Promise<void>;
    /**
     * Add a newly created session directly into a folder.
     */
    addSessionToFolder(workspaceRoot: string, folderId: string, sessionId: string): Promise<void>;
    /**
     * Toggle pinned status of a session in a specific workspace.
     */
    togglePinSession(workspaceRoot: string, sessionId: string): Promise<void>;
    /**
     * Completely remove a deleted session from all folders and pinned list in a workspace.
     */
    purgeSession(workspaceRoot: string, sessionId: string): Promise<void>;
    private persist;
}
export declare const globalTreeStore: TreeStore;
