/**
 * dsh-workspace-tree browser client entry.
 *
 * Direct takeover of `sidebar.workspaces` with priority: -10.
 * Injects virtual folders, drag & drop grouping, and nested subprojects directly
 * inside the native workspace list rows, with zero DOM pollution.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const name = "@dsh-external/dsh-workspace-tree/client";
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
