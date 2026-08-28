/**
 * HTTP routes for dsh-workspace-tree host backend.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage, ServerResponse } from 'node:http';
export declare const ROUTE_PREFIX = "/api/dsh-workspace-tree";
export interface WebServerLike {
    register(route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
    }): () => void;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        webServer?: WebServerLike;
    }
}
export declare function registerHttpRoutes(ctx: Context): () => void;
