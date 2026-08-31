import React from 'react';
export interface DirectoryBrowserModalProps {
    initialPath?: string;
    open: boolean;
    onClose: () => void;
    onConfirm: (selectedPath: string) => void;
}
export declare const DirectoryBrowserModal: React.FC<DirectoryBrowserModalProps>;
