// src/plugin/http.ts
import { readdir as readdir2, mkdir as mkdir2 } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve as resolve3, dirname as dirname2, join as join3 } from "node:path";

// src/plugin/storage.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join as join2, resolve as resolve2 } from "node:path";

// src/plugin/scanner.ts
import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
var IGNORED_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".agents",
  ".dsh",
  ".scratch",
  ".vscode",
  ".idea",
  "dist",
  "build",
  "target",
  "lib",
  "coverage",
  ".turbo",
  ".next"
]);
async function detectProjectType(dirPath) {
  try {
    const entries = await readdir(dirPath);
    const set = new Set(entries);
    if (set.has("package.json")) return "node";
    if (set.has("Cargo.toml")) return "rust";
    if (set.has("pyproject.toml") || set.has("requirements.txt") || set.has("setup.py")) return "python";
    if (set.has("pom.xml") || set.has("build.gradle")) return "java";
    if (set.has("go.mod")) return "go";
    if (set.has("AGENTS.md") || set.has(".git")) return "general";
    return null;
  } catch {
    return null;
  }
}
async function scanSubprojects(rootPath, maxDepth = 2) {
  const results = [];
  const resolvedRoot = resolve(rootPath);
  async function walk(currentDir, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = await readdir(currentDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry) || entry.startsWith(".")) continue;
      const fullPath = join(currentDir, entry);
      try {
        const fileStat = await stat(fullPath);
        if (!fileStat.isDirectory()) continue;
        const pType = await detectProjectType(fullPath);
        if (pType !== null) {
          const rel = relative(resolvedRoot, fullPath);
          results.push({
            id: `sp-${rel.replace(/[\/\\]/g, "-")}`,
            name: entry,
            relativePath: rel,
            absolutePath: fullPath,
            projectType: pType,
            enabled: true
          });
          continue;
        }
        if (depth < maxDepth) {
          await walk(fullPath, depth + 1);
        }
      } catch {
      }
    }
  }
  await walk(resolvedRoot, 1);
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

// src/plugin/storage.ts
var META_FILE_NAME = "workspace-tree.json";
function getMetaFilePath(workspaceRoot) {
  return join2(resolve2(workspaceRoot), ".dsh", META_FILE_NAME);
}
async function readWorkspaceTreeMeta(workspaceRoot) {
  const filePath = getMetaFilePath(workspaceRoot);
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    return {
      version: 1,
      inboxSessionIds: Array.isArray(parsed.inboxSessionIds) ? parsed.inboxSessionIds : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      subprojects: Array.isArray(parsed.subprojects) ? parsed.subprojects : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now()
    };
  } catch {
    const subprojects = await scanSubprojects(workspaceRoot);
    const freshMeta = {
      version: 1,
      inboxSessionIds: [],
      folders: [],
      subprojects,
      updatedAt: Date.now()
    };
    try {
      await writeWorkspaceTreeMeta(workspaceRoot, freshMeta);
    } catch {
    }
    return freshMeta;
  }
}
async function writeWorkspaceTreeMeta(workspaceRoot, meta) {
  const filePath = getMetaFilePath(workspaceRoot);
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const serialized = JSON.stringify(
    {
      ...meta,
      version: 1,
      updatedAt: Date.now()
    },
    null,
    2
  );
  await writeFile(tmpPath, serialized, "utf-8");
  await rename(tmpPath, filePath);
}

// src/plugin/http.ts
var ROUTE_PREFIX = "/api/dsh-workspace-tree";
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}
function readBodyJson(req) {
  return new Promise((resolve4, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf-8");
        resolve4(text.length > 0 ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
function registerHttpRoutes(ctx) {
  if (!ctx.webServer) {
    return () => {
    };
  }
  const cleanup = ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const subPath = url.pathname.slice(ROUTE_PREFIX.length);
      try {
        if (req.method === "GET" && subPath === "/meta") {
          const workspaceRoot = url.searchParams.get("workspaceRoot") || process.cwd();
          const meta = await readWorkspaceTreeMeta(workspaceRoot);
          sendJson(res, 200, { success: true, meta });
          return;
        }
        if (req.method === "POST" && subPath === "/meta") {
          const body = await readBodyJson(req);
          const workspaceRoot = body.workspaceRoot || process.cwd();
          if (!body.meta) {
            sendJson(res, 400, { success: false, error: "Missing meta payload" });
            return;
          }
          await writeWorkspaceTreeMeta(workspaceRoot, body.meta);
          const updated = await readWorkspaceTreeMeta(workspaceRoot);
          sendJson(res, 200, { success: true, meta: updated });
          return;
        }
        if (req.method === "GET" && subPath === "/scan") {
          const workspaceRoot = url.searchParams.get("workspaceRoot") || process.cwd();
          const subprojects = await scanSubprojects(workspaceRoot);
          sendJson(res, 200, { success: true, subprojects });
          return;
        }
        if (req.method === "GET" && subPath === "/fs-list") {
          const rawTarget = url.searchParams.get("path");
          const showHidden = url.searchParams.get("showHidden") === "true";
          const home = homedir();
          const target = rawTarget ? resolve3(rawTarget) : home;
          try {
            const dirents = await readdir2(target, { withFileTypes: true });
            const directories = [];
            for (const dirent of dirents) {
              if (!dirent.isDirectory()) continue;
              if (!showHidden && dirent.name.startsWith(".")) continue;
              directories.push({
                name: dirent.name,
                path: join3(target, dirent.name)
              });
            }
            directories.sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }));
            const parentPath = target === "/" ? null : dirname2(target);
            sendJson(res, 200, {
              success: true,
              currentPath: target,
              parentPath,
              homePath: home,
              directories
            });
          } catch (fsErr) {
            sendJson(res, 200, {
              success: false,
              error: fsErr?.message || "\u65E0\u6CD5\u8BFB\u53D6\u8BE5\u76EE\u5F55",
              currentPath: target,
              parentPath: target === "/" ? null : dirname2(target),
              homePath: home,
              directories: []
            });
          }
          return;
        }
        if (req.method === "POST" && subPath === "/fs-mkdir") {
          const body = await readBodyJson(req);
          if (!body.parentPath || !body.name) {
            sendJson(res, 400, { success: false, error: "Missing parentPath or name" });
            return;
          }
          const fullPath = join3(resolve3(body.parentPath), body.name.trim());
          await mkdir2(fullPath, { recursive: true });
          sendJson(res, 200, { success: true, path: fullPath });
          return;
        }
        sendJson(res, 404, { success: false, error: `Not found: ${url.pathname}` });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        sendJson(res, 500, { success: false, error: message });
      }
    }
  });
  return cleanup;
}

// src/plugin/index.ts
var name = "@dsh-external/dsh-workspace-tree";
var inject = ["webServer"];
function apply(ctx) {
  ctx.effect(() => {
    return registerHttpRoutes(ctx);
  });
}
export {
  apply,
  inject,
  name
};
