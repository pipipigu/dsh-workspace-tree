import React from 'react';
import type { SessionId, WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client';
export interface EnhancedWorkspaceBrowserProps {
    useWorkspaces?: (selector: (s: any) => any) => any;
    useSessions?: (selector: (s: any) => any) => any;
    startSession?: (workspaceId?: WorkspaceId) => void;
    startSessionInFolder?: (workspaceId: WorkspaceId, wsPath: string, folderId: string) => Promise<void>;
    open?: (sessionId: SessionId) => void;
    renameWorkspace?: (workspaceId: WorkspaceId, title: string) => Promise<void>;
    deleteWorkspace?: (workspaceId: WorkspaceId) => Promise<void>;
    createWorkspace?: (input: {
        path: string;
    }) => Promise<WorkspaceView>;
    renameSession?: (sessionId: SessionId, title: string) => Promise<void>;
    archiveSession?: (sessionId: SessionId) => Promise<void>;
    forkSession?: (sessionId: SessionId) => void;
}
export declare const EnhancedWorkspaceBrowser: React.FC<EnhancedWorkspaceBrowserProps>;
