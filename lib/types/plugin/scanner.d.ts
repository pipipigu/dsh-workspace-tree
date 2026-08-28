import type { SubprojectInfo } from '../shared/types.ts';
/**
 * Scan workspace root for valid subprojects (max 2 levels depth).
 */
export declare function scanSubprojects(rootPath: string, maxDepth?: number): Promise<SubprojectInfo[]>;
