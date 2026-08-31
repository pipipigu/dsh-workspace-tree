window.__ModuleLoader__.load({ id: "@dsh-external/dsh-workspace-tree", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/EnhancedWorkspaceBrowser.tsx
var import_react2 = require("react");

// src/client/api.ts
var ROUTE_PREFIX = "/api/dsh-workspace-tree";
async function fetchTreeMeta(workspaceRoot) {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/meta?workspaceRoot=${encodeURIComponent(workspaceRoot)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.meta : null;
  } catch (err) {
    console.warn("[dsh-workspace-tree] Failed to fetch meta:", err);
    return null;
  }
}
async function saveTreeMeta(workspaceRoot, meta) {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/meta`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceRoot, meta })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.meta : null;
  } catch (err) {
    console.warn("[dsh-workspace-tree] Failed to save meta:", err);
    return null;
  }
}
async function fetchDirectoryList(dirPath, showHidden) {
  try {
    const params = new URLSearchParams();
    if (dirPath) params.set("path", dirPath);
    if (showHidden) params.set("showHidden", "true");
    const res = await fetch(`${ROUTE_PREFIX}/fs-list?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("[dsh-workspace-tree] Failed to fetch fs-list:", err);
    return {
      currentPath: dirPath || "/",
      parentPath: null,
      homePath: "/",
      directories: [],
      error: err?.message || "\u8BFB\u53D6\u76EE\u5F55\u5931\u8D25"
    };
  }
}
async function createFsDirectory(parentPath, name2) {
  try {
    const res = await fetch(`${ROUTE_PREFIX}/fs-mkdir`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parentPath, name: name2 })
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, error: err?.message || "\u521B\u5EFA\u6587\u4EF6\u5939\u5931\u8D25" };
  }
}

// src/client/tree-store.ts
var DEFAULT_META = (workspaceRoot) => ({
  version: 1,
  inboxSessionIds: [],
  pinnedSessionIds: [],
  folders: [],
  subprojects: [],
  updatedAt: Date.now()
});
var TreeStore = class {
  cache = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  isSavingMap = /* @__PURE__ */ new Map();
  version = 0;
  constructor() {
  }
  getVersion() {
    return this.version;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  notify() {
    this.version++;
    for (const listener of this.listeners) {
      listener();
    }
  }
  /**
   * Get metadata for a specific workspace path.
   */
  getMetaForWorkspace(workspaceRoot) {
    if (!workspaceRoot) return DEFAULT_META("");
    const existing = this.cache.get(workspaceRoot);
    if (existing) return existing;
    const fresh = DEFAULT_META(workspaceRoot);
    this.cache.set(workspaceRoot, fresh);
    this.loadWorkspace(workspaceRoot);
    return fresh;
  }
  /**
   * Load metadata from backend for a specific workspace.
   */
  async loadWorkspace(workspaceRoot) {
    if (!workspaceRoot) return;
    const loaded = await fetchTreeMeta(workspaceRoot);
    if (loaded) {
      this.cache.set(workspaceRoot, {
        ...loaded,
        pinnedSessionIds: Array.isArray(loaded.pinnedSessionIds) ? loaded.pinnedSessionIds : []
      });
      this.notify();
    }
  }
  /**
   * Create a new folder under a specific workspace.
   */
  async createFolder(workspaceRoot, name2, color = "#60a5fa") {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const trimmed = name2.trim() || "\u65B0\u5EFA\u6587\u4EF6\u5939";
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newFolder = {
      id,
      name: trimmed,
      collapsed: false,
      color,
      sessionIds: [],
      createdAt: Date.now()
    };
    const updated = {
      ...meta,
      folders: [...meta.folders, newFolder],
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
    return id;
  }
  /**
   * Rename a folder in a specific workspace.
   */
  async renameFolder(workspaceRoot, folderId, name2) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const trimmed = name2.trim();
    if (!trimmed) return;
    const updated = {
      ...meta,
      folders: meta.folders.map((f) => f.id === folderId ? { ...f, name: trimmed } : f),
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Delete a folder in a specific workspace.
   */
  async deleteFolder(workspaceRoot, folderId) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const updated = {
      ...meta,
      folders: meta.folders.filter((f) => f.id !== folderId),
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Toggle collapse status of a folder in a specific workspace.
   */
  async toggleFolder(workspaceRoot, folderId) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const updated = {
      ...meta,
      folders: meta.folders.map((f) => f.id === folderId ? { ...f, collapsed: !f.collapsed } : f)
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Set color for a folder in a specific workspace.
   */
  async setFolderColor(workspaceRoot, folderId, color) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const updated = {
      ...meta,
      folders: meta.folders.map((f) => f.id === folderId ? { ...f, color } : f)
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Move a session into a specific folder or to uncategorized (targetFolderId = null).
   */
  async moveSession(workspaceRoot, sessionId, targetFolderId) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const updatedFolders = meta.folders.map((folder) => {
      const filtered = folder.sessionIds.filter((id) => id !== sessionId);
      if (targetFolderId !== null && folder.id === targetFolderId) {
        return {
          ...folder,
          collapsed: false,
          // 🌟 移入或新建时自动展开文件夹，会话立即可见
          sessionIds: [sessionId, ...filtered]
        };
      }
      return {
        ...folder,
        sessionIds: filtered
      };
    });
    const updated = {
      ...meta,
      folders: updatedFolders,
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Add a newly created session directly into a folder.
   */
  async addSessionToFolder(workspaceRoot, folderId, sessionId) {
    await this.moveSession(workspaceRoot, sessionId, folderId);
  }
  /**
   * Toggle pinned status of a session in a specific workspace.
   */
  async togglePinSession(workspaceRoot, sessionId) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const currentPinned = new Set(meta.pinnedSessionIds || []);
    if (currentPinned.has(sessionId)) {
      currentPinned.delete(sessionId);
    } else {
      currentPinned.add(sessionId);
    }
    const updated = {
      ...meta,
      pinnedSessionIds: Array.from(currentPinned),
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  /**
   * Completely remove a deleted session from all folders and pinned list in a workspace.
   */
  async purgeSession(workspaceRoot, sessionId) {
    const meta = this.getMetaForWorkspace(workspaceRoot);
    const updatedFolders = meta.folders.map((folder) => ({
      ...folder,
      sessionIds: folder.sessionIds.filter((id) => id !== sessionId)
    }));
    const updatedPinned = (meta.pinnedSessionIds || []).filter((id) => id !== sessionId);
    const updated = {
      ...meta,
      folders: updatedFolders,
      pinnedSessionIds: updatedPinned,
      updatedAt: Date.now()
    };
    this.cache.set(workspaceRoot, updated);
    this.notify();
    await this.persist(workspaceRoot);
  }
  async persist(workspaceRoot) {
    if (!workspaceRoot || this.isSavingMap.get(workspaceRoot)) return;
    this.isSavingMap.set(workspaceRoot, true);
    try {
      const meta = this.getMetaForWorkspace(workspaceRoot);
      await saveTreeMeta(workspaceRoot, meta);
    } finally {
      this.isSavingMap.set(workspaceRoot, false);
    }
  }
};
var globalTreeStore = new TreeStore();

// src/client/time.ts
function formatRelativeTime(timestamp) {
  if (!timestamp || typeof timestamp !== "number") return "";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "\u521A\u521A";
  const sec = Math.floor(diff / 1e3);
  if (sec < 60) return "\u521A\u521A";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}\u5206\u949F`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}\u5C0F\u65F6`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "\u6628\u5929";
  if (days < 30) return `${days}\u5929\u524D`;
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// src/client/components/Icons.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var ChevronRightIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M6 3.5L10.5 8L6 12.5",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var FolderIcon = ({
  size = 15,
  color,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style: { color: color || "currentColor", ...style },
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V11.75C14 12.4404 13.4404 13 12.75 13H3.25C2.55964 13 2 12.4404 2 11.75V4.25Z",
        stroke: "currentColor",
        strokeWidth: "1.25",
        fill: color ? `${color}22` : "currentColor",
        fillOpacity: color ? 0.2 : 0.1,
        strokeLinejoin: "round"
      }
    )
  }
);
var ChatIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M3 4C3 3.44772 3.44772 3 4 3H12C12.5523 3 13 3.44772 13 4V10C13 10.5523 12.5523 11 12 11H5.5L3 13.5V4Z",
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var PlusIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M8 3.5V12.5M3.5 8H12.5",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var SearchIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.5 10.5L13.5 13.5", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
    ]
  }
);
var EllipsisIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "3.5", cy: "8", r: "1.1", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "1.1", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12.5", cy: "8", r: "1.1", fill: "currentColor" })
    ]
  }
);
var EditIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z",
        stroke: "currentColor",
        strokeWidth: "1.3",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var TrashIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M3.5 4.5H12.5M6 4.5V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4.5M4.5 4.5V13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13V4.5",
        stroke: "currentColor",
        strokeWidth: "1.3",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var ForkIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "4.5", cy: "11.5", r: "1.5", stroke: "currentColor", strokeWidth: "1.2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "4.5", cy: "4.5", r: "1.5", stroke: "currentColor", strokeWidth: "1.2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "11.5", cy: "4.5", r: "1.5", stroke: "currentColor", strokeWidth: "1.2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.5 6V10M11.5 6V7.5C11.5 8.6 10.6 9.5 9.5 9.5H4.5", stroke: "currentColor", strokeWidth: "1.2" })
    ]
  }
);
var MoveToFolderIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: "M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V11.75C14 12.4404 13.4404 13 12.75 13H3.25C2.55964 13 2 12.4404 2 11.75V4.25Z",
          stroke: "currentColor",
          strokeWidth: "1.2",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: "M6 8.5H10M8 6.5L10 8.5L8 10.5",
          stroke: "currentColor",
          strokeWidth: "1.2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    ]
  }
);
var MoveOutIcon = ({
  size = 12,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M6 3.5H3.5V12.5H12.5V10M8.5 2.5H13.5V7.5M7 9L13 3",
        stroke: "currentColor",
        strokeWidth: "1.3",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var AddFolderIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V8.5M2 4.25V11.75C2 12.4404 2.55964 13 3.25 13H8M11.5 10.5V14.5M9.5 12.5H13.5",
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var PinIcon = ({
  size = 13,
  pinned = false,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M9.5 3L13 6.5M6 6.5L3.5 9L4 12L2 14L4 12L7 12.5L9.5 10M6 6.5L9.5 3M6 6.5L9.5 10",
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: pinned ? "currentColor" : "none"
      }
    )
  }
);
var CloseIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M4 4L12 12M12 4L4 12",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var HomeIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M2.5 6.5L8 2L13.5 6.5V13.5C13.5 13.7761 13.2761 14 13 14H9.5V9.5H6.5V14H3C2.72386 14 2.5 13.7761 2.5 13.5V6.5Z",
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);
var ArrowUpIcon = ({
  size = 14,
  style
}) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M8 12.5V3.5M4 7.5L8 3.5L12 7.5",
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )
  }
);

// src/client/components/StateIndicator.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var RunningDot = ({ size = 14, style }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        flexShrink: 0,
        ...style
      },
      title: "\u6B63\u5728\u5BF9\u8BDD\u4E0E\u751F\u6210\u4E2D...",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              position: "absolute",
              width: `${size * 0.75}px`,
              height: `${size * 0.75}px`,
              borderRadius: "50%",
              background: "rgba(96, 165, 250, 0.4)",
              animation: "dsh-pulse 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              position: "relative",
              width: `${size * 0.45}px`,
              height: `${size * 0.45}px`,
              borderRadius: "50%",
              background: "var(--dsw-alias-state-business-primary, #60a5fa)",
              boxShadow: "0 0 6px rgba(96, 165, 250, 0.8)"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: `
        @keyframes dsh-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      ` })
      ]
    }
  );
};
var PendingDot = ({ size = 14, style }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        flexShrink: 0,
        ...style
      },
      title: "\u7B49\u5F85\u4EA4\u4E92 (\u5BA1\u6279/\u786E\u8BA4)",
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "span",
        {
          style: {
            width: `${size * 0.45}px`,
            height: `${size * 0.45}px`,
            borderRadius: "50%",
            background: "#fbbf24",
            boxShadow: "0 0 6px rgba(251, 191, 36, 0.6)"
          }
        }
      )
    }
  );
};
var CompletedDot = ({ size = 14, style }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        flexShrink: 0,
        ...style
      },
      title: "\u5DF2\u6267\u884C\u5B8C\u6BD5 (\u672A\u8BFB)",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              position: "absolute",
              width: `${size * 0.75}px`,
              height: `${size * 0.75}px`,
              borderRadius: "50%",
              background: "rgba(74, 222, 128, 0.25)",
              animation: "dsh-completed-pulse 2.2s cubic-bezier(0.24, 0, 0.38, 1) infinite"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              position: "relative",
              width: `${size * 0.48}px`,
              height: `${size * 0.48}px`,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px rgba(74, 222, 128, 0.8)"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: `
        @keyframes dsh-completed-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.15; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      ` })
      ]
    }
  );
};

// src/client/components/DirectoryBrowserModal.tsx
var import_react = __toESM(require("react"), 1);
var import_jsx_runtime3 = require("react/jsx-runtime");
var DirectoryBrowserModal = ({
  initialPath,
  open,
  onClose,
  onConfirm
}) => {
  const [currentPath, setCurrentPath] = (0, import_react.useState)(initialPath || "");
  const [parentPath, setParentPath] = (0, import_react.useState)(null);
  const [homePath, setHomePath] = (0, import_react.useState)("");
  const [directories, setDirectories] = (0, import_react.useState)([]);
  const [selectedFolder, setSelectedFolder] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [errorMsg, setErrorMsg] = (0, import_react.useState)(null);
  const [showHidden, setShowHidden] = (0, import_react.useState)(false);
  const [isEditingRawPath, setIsEditingRawPath] = (0, import_react.useState)(false);
  const [rawPathDraft, setRawPathDraft] = (0, import_react.useState)("");
  const [isCreatingFolder, setIsCreatingFolder] = (0, import_react.useState)(false);
  const [newFolderName, setNewFolderName] = (0, import_react.useState)("");
  const [isCreatingSubmitting, setIsCreatingSubmitting] = (0, import_react.useState)(false);
  const loadPath = async (targetPath) => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedFolder(null);
    try {
      const res = await fetchDirectoryList(targetPath, showHidden);
      if (res.error && res.directories.length === 0) {
        setErrorMsg(res.error);
      }
      setCurrentPath(res.currentPath);
      setParentPath(res.parentPath);
      setHomePath(res.homePath);
      setDirectories(res.directories || []);
      setRawPathDraft(res.currentPath);
    } catch (err) {
      setErrorMsg(err?.message || "\u8BFB\u53D6\u76EE\u5F55\u5931\u8D25");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react.useEffect)(() => {
    if (open) {
      loadPath(initialPath || void 0);
      setIsCreatingFolder(false);
      setIsEditingRawPath(false);
    }
  }, [open, showHidden]);
  if (!open) return null;
  const handleNavigate = (path) => {
    setIsCreatingFolder(false);
    loadPath(path);
  };
  const handleCreateFolder = async () => {
    const name2 = newFolderName.trim();
    if (!name2) {
      setIsCreatingFolder(false);
      return;
    }
    setIsCreatingSubmitting(true);
    try {
      const res = await createFsDirectory(currentPath, name2);
      if (res.success && res.path) {
        setIsCreatingFolder(false);
        setNewFolderName("");
        await loadPath(res.path);
      } else {
        setErrorMsg(res.error || "\u521B\u5EFA\u6587\u4EF6\u5939\u5931\u8D25");
      }
    } catch (err) {
      setErrorMsg(err?.message || "\u521B\u5EFA\u6587\u4EF6\u5939\u5931\u8D25");
    } finally {
      setIsCreatingSubmitting(false);
    }
  };
  const handleConfirmSelect = () => {
    const target = isEditingRawPath && rawPathDraft.trim() ? rawPathDraft.trim() : selectedFolder || currentPath;
    if (target) {
      onConfirm(target);
    }
  };
  const renderBreadcrumbs = () => {
    if (isEditingRawPath) {
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          autoFocus: true,
          style: {
            flex: 1,
            height: "28px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(96, 165, 250, 0.4)",
            borderRadius: "4px",
            color: "#f8fafc",
            fontSize: "12px",
            padding: "0 8px",
            outline: "none"
          },
          value: rawPathDraft,
          onChange: (e) => setRawPathDraft(e.target.value),
          onBlur: () => {
            setIsEditingRawPath(false);
            if (rawPathDraft.trim() && rawPathDraft.trim() !== currentPath) {
              handleNavigate(rawPathDraft.trim());
            }
          },
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              setIsEditingRawPath(false);
              if (rawPathDraft.trim()) handleNavigate(rawPathDraft.trim());
            }
            if (e.key === "Escape") setIsEditingRawPath(false);
          }
        }
      );
    }
    let displayPath = currentPath;
    const isHomeRooted = homePath && currentPath.startsWith(homePath);
    if (isHomeRooted) {
      displayPath = "~" + currentPath.slice(homePath.length);
    }
    const segments = displayPath.split("/").filter(Boolean);
    let cumulativePath = isHomeRooted ? homePath : "";
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", minWidth: 0, flex: 1 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          style: {
            background: "transparent",
            border: "none",
            color: "#93c5fd",
            fontSize: "12px",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: "3px",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "3px"
          },
          title: homePath || "\u4E3B\u76EE\u5F55",
          onClick: () => handleNavigate(homePath || "/"),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(HomeIcon, { size: 12 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u4E3B\u76EE\u5F55" })
          ]
        }
      ),
      isHomeRooted && segments[0] === "~" && segments.slice(1).map((seg, idx) => {
        cumulativePath = `${cumulativePath}/${seg}`;
        const segPath = cumulativePath;
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_react.default.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "#64748b", fontSize: "11px" }, children: "/" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              style: {
                background: "transparent",
                border: "none",
                color: idx === segments.length - 2 ? "#f8fafc" : "#cbd5e1",
                fontWeight: idx === segments.length - 2 ? 600 : 400,
                fontSize: "12px",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "3px",
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              title: segPath,
              onClick: () => handleNavigate(segPath),
              children: seg
            }
          )
        ] }, idx);
      }),
      !isHomeRooted && segments.map((seg, idx) => {
        cumulativePath = `${cumulativePath}/${seg}`;
        const segPath = cumulativePath;
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_react.default.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "#64748b", fontSize: "11px" }, children: "/" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              style: {
                background: "transparent",
                border: "none",
                color: idx === segments.length - 1 ? "#f8fafc" : "#cbd5e1",
                fontWeight: idx === segments.length - 1 ? 600 : 400,
                fontSize: "12px",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "3px",
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              title: segPath,
              onClick: () => handleNavigate(segPath),
              children: seg
            }
          )
        ] }, idx);
      })
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        userSelect: "none",
        fontFamily: "inherit"
      },
      onClick: onClose,
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          style: {
            width: "540px",
            maxWidth: "94vw",
            height: "520px",
            maxHeight: "90vh",
            borderRadius: "12px",
            background: "#151b28",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 24px 50px rgba(0, 0, 0, 0.85)",
            display: "flex",
            flexDirection: "column",
            color: "#f8fafc",
            overflow: "hidden"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px 10px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 18, color: "#60a5fa" }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "15px", fontWeight: 600 }, children: "\u9009\u62E9\u5DE5\u4F5C\u533A\u76EE\u5F55" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "button",
                    {
                      style: {
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "inline-flex"
                      },
                      onClick: onClose,
                      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CloseIcon, { size: 14 })
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  gap: "8px"
                },
                children: [
                  parentPath && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                    "button",
                    {
                      style: {
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px 6px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "11px",
                        flexShrink: 0
                      },
                      title: `\u8FD4\u56DE\u4E0A\u4E00\u7EA7 (${parentPath})`,
                      onClick: () => handleNavigate(parentPath),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ArrowUpIcon, { size: 11 }),
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u4E0A\u7EA7" })
                      ]
                    }
                  ),
                  renderBreadcrumbs(),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "button",
                    {
                      style: {
                        background: "transparent",
                        border: "none",
                        color: isEditingRawPath ? "#60a5fa" : "#64748b",
                        cursor: "pointer",
                        padding: "4px",
                        display: "inline-flex",
                        flexShrink: 0
                      },
                      title: "\u7F16\u8F91\u5B8C\u6574\u8DEF\u5F84",
                      onClick: () => {
                        setIsEditingRawPath(!isEditingRawPath);
                        setRawPathDraft(currentPath);
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditIcon, { size: 13 })
                    }
                  )
                ]
              }
            ),
            errorMsg && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "6px 16px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }, children: errorMsg }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "div",
              {
                style: {
                  flex: 1,
                  overflowY: "auto",
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px"
                },
                children: [
                  isCreatingFolder && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 10px",
                        background: "rgba(96, 165, 250, 0.12)",
                        border: "1px dashed #60a5fa",
                        borderRadius: "6px",
                        margin: "2px 0 4px"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 15, color: "#60a5fa" }),
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                          "input",
                          {
                            autoFocus: true,
                            style: {
                              flex: 1,
                              height: "24px",
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "12px",
                              padding: "0 6px",
                              outline: "none"
                            },
                            placeholder: "\u8F93\u5165\u65B0\u6587\u4EF6\u5939\u540D\u79F0...",
                            value: newFolderName,
                            onChange: (e) => setNewFolderName(e.target.value),
                            onKeyDown: (e) => {
                              if (e.key === "Enter") handleCreateFolder();
                              if (e.key === "Escape") setIsCreatingFolder(false);
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                          "button",
                          {
                            disabled: isCreatingSubmitting || !newFolderName.trim(),
                            style: {
                              background: "#2563eb",
                              border: "none",
                              color: "#fff",
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              cursor: "pointer"
                            },
                            onClick: handleCreateFolder,
                            children: isCreatingSubmitting ? "..." : "\u786E\u5B9A"
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                          "button",
                          {
                            style: {
                              background: "transparent",
                              border: "none",
                              color: "#94a3b8",
                              fontSize: "11px",
                              padding: "3px 6px",
                              cursor: "pointer"
                            },
                            onClick: () => setIsCreatingFolder(false),
                            children: "\u53D6\u6D88"
                          }
                        )
                      ]
                    }
                  ),
                  loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "140px", color: "#94a3b8", fontSize: "12px" }, children: "\u6B63\u5728\u52A0\u8F7D\u76EE\u5F55\u5217\u8868..." }) : directories.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "140px", color: "#64748b", fontSize: "12px" }, children: "\u6B64\u76EE\u5F55\u4E0B\u65E0\u5B50\u6587\u4EF6\u5939" }) : directories.map((d) => {
                    const isSelected = selectedFolder === d.path;
                    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: "34px",
                          padding: "0 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          background: isSelected ? "rgba(96, 165, 250, 0.16)" : "transparent",
                          color: isSelected ? "#93c5fd" : "#e2e8f0",
                          fontSize: "13px",
                          fontWeight: isSelected ? 600 : 400,
                          transition: "all 0.12s ease"
                        },
                        onClick: () => setSelectedFolder(d.path),
                        onDoubleClick: () => handleNavigate(d.path),
                        onMouseEnter: (e) => {
                          if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        },
                        onMouseLeave: (e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 16, color: isSelected ? "#60a5fa" : "#94a3b8" }),
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: d.name })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                            "button",
                            {
                              style: {
                                background: "transparent",
                                border: "none",
                                color: "#64748b",
                                cursor: "pointer",
                                padding: "4px",
                                display: "inline-flex",
                                alignItems: "center"
                              },
                              title: "\u8FDB\u5165\u8BE5\u76EE\u5F55",
                              onClick: (e) => {
                                e.stopPropagation();
                                handleNavigate(d.path);
                              },
                              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronRightIcon, { size: 12 })
                            }
                          )
                        ]
                      },
                      d.path
                    );
                  })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "14px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                      "button",
                      {
                        style: {
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#cbd5e1",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        },
                        onClick: () => {
                          setIsCreatingFolder(true);
                          setNewFolderName("");
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, { size: 11 }),
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u65B0\u5EFA\u6587\u4EF6\u5939" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", cursor: "pointer" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        "input",
                        {
                          type: "checkbox",
                          checked: showHidden,
                          onChange: (e) => setShowHidden(e.target.checked),
                          style: { cursor: "pointer", accentColor: "#3b82f6" }
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u663E\u793A\u9690\u85CF\u6587\u4EF6" })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: {
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          padding: "6px 14px",
                          fontSize: "13px",
                          cursor: "pointer"
                        },
                        onClick: onClose,
                        children: "\u53D6\u6D88"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: {
                          background: "#2563eb",
                          border: "none",
                          color: "#fff",
                          borderRadius: "6px",
                          padding: "6px 18px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
                        },
                        onClick: handleConfirmSelect,
                        children: "\u6253\u5F00"
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      )
    }
  );
};

// src/client/EnhancedWorkspaceBrowser.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var DEFAULT_VISIBLE_LIMIT = 10;
function isBlankPlaceholder(id, title, isBlank = false, isActive = false) {
  if (isActive) return false;
  if (isBlank) return true;
  if (!title) return true;
  if (title === id) return true;
  if (/^session-[a-z0-9-]+$/i.test(title)) return true;
  return false;
}
var DSH_INPUT_STYLE = {
  boxSizing: "border-box",
  padding: "1px 6px",
  borderRadius: "4px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "rgba(255, 255, 255, 0.08)",
  color: "var(--dsw-alias-label-primary, #f8fafc)",
  fontSize: "13px",
  lineHeight: "20px",
  outline: "none",
  fontFamily: "inherit"
};
var TASK_STYLE_CONFIG = {
  running: {
    bg: "rgba(96, 165, 250, 0.08)",
    border: "rgba(96, 165, 250, 0.22)",
    hoverBg: "rgba(96, 165, 250, 0.16)",
    hoverBorder: "rgba(96, 165, 250, 0.45)",
    tagText: "\u8FDB\u884C\u4E2D",
    tagColor: "#60a5fa",
    tagBg: "rgba(96, 165, 250, 0.14)",
    titlePrefix: "\u6B63\u5728\u8FDB\u884C"
  },
  pending: {
    bg: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.25)",
    hoverBg: "rgba(251, 191, 36, 0.16)",
    hoverBorder: "rgba(251, 191, 36, 0.5)",
    tagText: "\u5F85\u786E\u8BA4",
    tagColor: "#fbbf24",
    tagBg: "rgba(251, 191, 36, 0.14)",
    titlePrefix: "\u7B49\u5F85\u786E\u8BA4"
  },
  completed: {
    bg: "rgba(74, 222, 128, 0.08)",
    border: "rgba(74, 222, 128, 0.25)",
    hoverBg: "rgba(74, 222, 128, 0.16)",
    hoverBorder: "rgba(74, 222, 128, 0.5)",
    tagText: "\u5F85\u8BFB",
    tagColor: "#4ade80",
    tagBg: "rgba(74, 222, 128, 0.14)",
    titlePrefix: "\u5DF2\u6267\u884C\u5B8C\u6BD5\u5F85\u9605\u8BFB"
  }
};
var EnhancedWorkspaceBrowser = (props) => {
  (0, import_react2.useSyncExternalStore)(
    (cb) => globalTreeStore.subscribe(cb),
    () => globalTreeStore.getVersion()
  );
  let workspacesState = { items: [], archivedSessionIds: [] };
  try {
    if (props.useWorkspaces) {
      workspacesState = props.useWorkspaces((s) => s) || { items: [], archivedSessionIds: [] };
    }
  } catch {
  }
  const [expandedWorkspaces, setExpandedWorkspaces] = (0, import_react2.useState)(/* @__PURE__ */ new Set());
  const [searchQuery, setSearchQuery] = (0, import_react2.useState)("");
  const [showSearch, setShowSearch] = (0, import_react2.useState)(false);
  const [isAddModalOpen, setIsAddModalOpen] = (0, import_react2.useState)(false);
  const [newWorkspacePath, setNewWorkspacePath] = (0, import_react2.useState)("");
  const [isSubmittingWs, setIsSubmittingWs] = (0, import_react2.useState)(false);
  const [addWsError, setAddWsError] = (0, import_react2.useState)(null);
  const [activeMenuWsId, setActiveMenuWsId] = (0, import_react2.useState)(null);
  const [editingWsId, setEditingWsId] = (0, import_react2.useState)(null);
  const [editWsTitle, setEditWsTitle] = (0, import_react2.useState)("");
  const [isCreatingFolderWsId, setIsCreatingFolderWsId] = (0, import_react2.useState)(null);
  const [newFolderName, setNewFolderName] = (0, import_react2.useState)("");
  const [editingFolderId, setEditingFolderId] = (0, import_react2.useState)(null);
  const [editFolderName, setEditFolderName] = (0, import_react2.useState)("");
  const [localUnreadSet, setLocalUnreadSet] = (0, import_react2.useState)(/* @__PURE__ */ new Set());
  const prevRunningMap = (0, import_react2.useRef)(/* @__PURE__ */ new Map());
  const [editingSessionId, setEditingSessionId] = (0, import_react2.useState)(null);
  const [editSessionTitle, setEditSessionTitle] = (0, import_react2.useState)("");
  const [activeMoveMenuSessionId, setActiveMoveMenuSessionId] = (0, import_react2.useState)(null);
  const [showAllSessionsMap, setShowAllSessionsMap] = (0, import_react2.useState)({});
  const menuRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const handleGlobalClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuWsId(null);
      }
      const target = e.target;
      if (!target.closest(".move-menu-container") && !target.closest(".move-menu-btn")) {
        setActiveMoveMenuSessionId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveMenuWsId(null);
        setActiveMoveMenuSessionId(null);
        setEditingWsId(null);
        setIsCreatingFolderWsId(null);
        setEditingFolderId(null);
        setEditingSessionId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  let sessionsState = { ids: [], byId: {} };
  try {
    if (props.useSessions) {
      sessionsState = props.useSessions((s) => s) || {};
    }
  } catch {
  }
  const activeSessionId = sessionsState.current;
  const items = workspacesState.items || [];
  const archivedSessionIds = workspacesState.archivedSessionIds || [];
  const archivedSet = (0, import_react2.useMemo)(() => new Set(archivedSessionIds.map(String)), [archivedSessionIds]);
  (0, import_react2.useEffect)(() => {
    for (const ws of items) {
      if (ws.path) {
        globalTreeStore.getMetaForWorkspace(ws.path);
      }
    }
  }, [items]);
  (0, import_react2.useEffect)(() => {
    const byId = sessionsState.byId || {};
    const newUnread = new Set(localUnreadSet);
    let changed = false;
    for (const [id, session] of Object.entries(byId)) {
      if (archivedSet.has(id)) {
        if (newUnread.has(id)) {
          newUnread.delete(id);
          changed = true;
        }
        continue;
      }
      const wasRunning = prevRunningMap.current.get(id) || false;
      const isNowRunning = Boolean(session?.running);
      if (wasRunning && !isNowRunning && id !== activeSessionId) {
        newUnread.add(id);
        changed = true;
      }
      if (id === activeSessionId && newUnread.has(id)) {
        newUnread.delete(id);
        changed = true;
      }
      prevRunningMap.current.set(id, isNowRunning);
    }
    if (changed) {
      setLocalUnreadSet(newUnread);
    }
  }, [sessionsState.byId, activeSessionId, archivedSet]);
  const handleOpenSession = (sessionId) => {
    if (localUnreadSet.has(sessionId)) {
      const next = new Set(localUnreadSet);
      next.delete(sessionId);
      setLocalUnreadSet(next);
    }
    props.open?.(sessionId);
  };
  (0, import_react2.useEffect)(() => {
    if (items.length > 0 && expandedWorkspaces.size === 0) {
      const targetId = workspacesState.recentWorkspaceId || items[0]?.workspaceId;
      if (targetId) {
        setExpandedWorkspaces(/* @__PURE__ */ new Set([targetId]));
        const first = items.find((w) => w.workspaceId === targetId);
        if (first?.path) globalTreeStore.loadWorkspace(first.path);
      }
    }
  }, [items, workspacesState.recentWorkspaceId]);
  const toggleWorkspace = (wsId, wsPath) => {
    const next = new Set(expandedWorkspaces);
    if (next.has(wsId)) {
      next.delete(wsId);
      setShowAllSessionsMap((prev) => ({ ...prev, [wsId]: false }));
    } else {
      next.add(wsId);
      globalTreeStore.loadWorkspace(wsPath);
    }
    setExpandedWorkspaces(next);
  };
  const handleCreateFolder = async (wsPath) => {
    if (newFolderName.trim()) {
      await globalTreeStore.createFolder(wsPath, newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolderWsId(null);
    }
  };
  const handleSaveRenameWs = async (wsId) => {
    if (editWsTitle.trim() && props.renameWorkspace) {
      await props.renameWorkspace(wsId, editWsTitle.trim());
    }
    setEditingWsId(null);
    setActiveMenuWsId(null);
  };
  const handleSaveRenameSession = async (sessionId) => {
    if (editSessionTitle.trim() && props.renameSession) {
      await props.renameSession(sessionId, editSessionTitle.trim());
    }
    setEditingSessionId(null);
  };
  const handleDeleteSession = async (wsPath, sessionId) => {
    try {
      if (localUnreadSet.has(sessionId)) {
        const next = new Set(localUnreadSet);
        next.delete(sessionId);
        setLocalUnreadSet(next);
      }
      await globalTreeStore.purgeSession(wsPath, sessionId);
      if (props.archiveSession) {
        await props.archiveSession(sessionId);
      }
    } catch (err) {
      console.error("[dsh-workspace-tree] Delete session failed:", err);
    }
  };
  const handleCreateSessionInFolder = async (wsId, wsPath, folderId) => {
    if (props.startSessionInFolder) {
      await props.startSessionInFolder(wsId, wsPath, folderId);
    } else {
      props.startSession?.(wsId);
    }
  };
  const bannerTasks = (0, import_react2.useMemo)(() => {
    const list = [];
    const byId = sessionsState.byId || {};
    for (const [sId, session] of Object.entries(byId)) {
      if (archivedSet.has(sId)) continue;
      const isRunning = Boolean(session?.running);
      const isPending = Boolean(session?.pendingInteraction);
      const isUnreadCompleted = (Boolean(session?.completed) || localUnreadSet.has(sId)) && sId !== activeSessionId;
      const ownerWs = items.find((w) => (w.sessionIds || []).includes(sId));
      const title = session?.title || sId.slice(0, 16);
      if (isRunning) {
        list.push({ sessionId: sId, title, status: "running", ws: ownerWs });
      } else if (isPending) {
        list.push({ sessionId: sId, title, status: "pending", ws: ownerWs });
      } else if (isUnreadCompleted) {
        list.push({ sessionId: sId, title, status: "completed", ws: ownerWs });
      }
    }
    const order = { running: 0, pending: 1, completed: 2 };
    return list.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0));
  }, [sessionsState.byId, items, localUnreadSet, activeSessionId, archivedSet]);
  const handleJumpToActiveTask = (sessionId, ownerWs) => {
    if (ownerWs) {
      setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, ownerWs.workspaceId]));
      const meta = globalTreeStore.getMetaForWorkspace(ownerWs.path);
      const targetFolder = meta.folders.find((f) => f.sessionIds.includes(sessionId));
      if (targetFolder && targetFolder.collapsed) {
        globalTreeStore.toggleFolder(ownerWs.path, targetFolder.id);
      }
    }
    handleOpenSession(sessionId);
  };
  const filteredWorkspaces = (0, import_react2.useMemo)(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((ws) => {
      const matchTitle = (ws.title || "").toLowerCase().includes(q);
      const matchSessions = (ws.sessionIds || []).some((sId) => {
        const sidStr = sId;
        if (archivedSet.has(sidStr)) return false;
        const title = sessionsState.byId?.[sidStr]?.title || "";
        return title.toLowerCase().includes(q);
      });
      return matchTitle || matchSessions;
    });
  }, [items, searchQuery, sessionsState.byId, archivedSet]);
  const handleOpenAddWorkspace = () => {
    setShowSearch(false);
    setIsAddModalOpen(true);
  };
  const handleConfirmAddWorkspace = async (targetPath) => {
    const trimmed = targetPath.trim();
    if (!trimmed) return;
    try {
      const res = await props.createWorkspace?.({ path: trimmed });
      if (res) {
        const wsId = res.workspaceId || res.id;
        if (wsId) {
          setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, wsId]));
          props.startSession?.(wsId);
        }
        globalTreeStore.loadWorkspace(trimmed);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error("[dsh-workspace-tree] Create workspace failed:", err);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", userSelect: "none", fontFamily: "inherit" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 6px", color: "var(--dsw-alias-label-primary, #f8fafc)", fontSize: "13px", fontWeight: 600 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5DE5\u4F5C\u533A" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            style: {
              background: isAddModalOpen ? "rgba(96, 165, 250, 0.2)" : "transparent",
              border: "none",
              color: isAddModalOpen ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #94a3b8)",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center"
            },
            title: "\u6DFB\u52A0/\u65B0\u5EFA\u5DE5\u4F5C\u533A",
            onClick: handleOpenAddWorkspace,
            children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PlusIcon, { size: 14 })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            style: {
              background: showSearch ? "rgba(96, 165, 250, 0.2)" : "transparent",
              border: "none",
              color: showSearch ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #94a3b8)",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center"
            },
            title: "\u641C\u7D22\u5DE5\u4F5C\u533A\u6216\u4F1A\u8BDD",
            onClick: () => {
              setShowSearch(!showSearch);
              setIsAddModalOpen(false);
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SearchIcon, { size: 14 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      DirectoryBrowserModal,
      {
        open: isAddModalOpen,
        onClose: () => setIsAddModalOpen(false),
        onConfirm: handleConfirmAddWorkspace
      }
    ),
    showSearch && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: "2px 10px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "input",
      {
        autoFocus: true,
        style: {
          ...DSH_INPUT_STYLE,
          width: "100%",
          height: "28px",
          padding: "0 8px",
          borderRadius: "6px"
        },
        placeholder: "\u641C\u7D22\u5DE5\u4F5C\u533A\u6216\u4F1A\u8BDD...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value)
      }
    ) }),
    showSearch && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: "2px 10px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "input",
      {
        autoFocus: true,
        style: {
          ...DSH_INPUT_STYLE,
          width: "100%",
          height: "28px",
          padding: "0 8px",
          borderRadius: "6px"
        },
        placeholder: "\u641C\u7D22\u5DE5\u4F5C\u533A\u6216\u4F1A\u8BDD...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value)
      }
    ) }),
    bannerTasks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: "2px 8px 6px", display: "flex", flexDirection: "column", gap: "4px" }, children: bannerTasks.map((task) => {
      const conf = TASK_STYLE_CONFIG[task.status];
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "28px",
            padding: "0 8px",
            borderRadius: "6px",
            background: conf.bg,
            border: `1px solid ${conf.border}`,
            cursor: "pointer",
            transition: "all 0.15s ease"
          },
          title: `${conf.titlePrefix} (\u70B9\u51FB\u76F4\u8FBE${task.status === "completed" ? "\u5E76\u6D88\u9664\u5F85\u8BFB" : ""}\uFF0C\u4F4D\u4E8E: ${task.ws?.title || "\u5F53\u524D\u5DE5\u4F5C\u533A"})`,
          onClick: () => handleJumpToActiveTask(task.sessionId, task.ws),
          onMouseEnter: (e) => {
            e.currentTarget.style.background = conf.hoverBg;
            e.currentTarget.style.borderColor = conf.hoverBorder;
            const chevron = e.currentTarget.querySelector(".task-chevron");
            if (chevron) chevron.style.color = "var(--dsw-alias-label-primary, #fff)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = conf.bg;
            e.currentTarget.style.borderColor = conf.border;
            const chevron = e.currentTarget.querySelector(".task-chevron");
            if (chevron) chevron.style.color = "var(--dsw-alias-label-tertiary, #94a3b8)";
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
              task.status === "running" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RunningDot, { size: 12 }) : task.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PendingDot, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CompletedDot, { size: 12 }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "12px", fontWeight: 500, color: "var(--dsw-alias-label-primary, #f8fafc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: task.title }),
              task.ws?.title && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #94a3b8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }, children: [
                "\xB7 ",
                task.ws.title
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "span",
                {
                  style: {
                    fontSize: "10px",
                    color: conf.tagColor,
                    background: conf.tagBg,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    lineHeight: "13px",
                    fontWeight: 500
                  },
                  children: conf.tagText
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "task-chevron", style: { color: "var(--dsw-alias-label-tertiary, #94a3b8)", paddingLeft: "2px", transition: "color 0.15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChevronRightIcon, { size: 11 }) })
            ] })
          ]
        },
        task.sessionId
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "2px", padding: "0 6px" }, children: filteredWorkspaces.map((ws) => {
      const isExpanded = expandedWorkspaces.has(ws.workspaceId);
      const wsMeta = globalTreeStore.getMetaForWorkspace(ws.path);
      const wsPinnedSet = new Set(wsMeta.pinnedSessionIds || []);
      const rawSessions = (ws.sessionIds || []).map((sId) => {
        const sidStr = sId;
        const session = sessionsState.byId?.[sidStr];
        const isUnread = Boolean(session?.completed || localUnreadSet.has(sidStr));
        return {
          id: sidStr,
          title: session?.title || sidStr.slice(0, 16),
          updatedAt: session?.updatedAt || 0,
          running: Boolean(session?.running),
          pendingInteraction: session?.pendingInteraction,
          completed: isUnread && sidStr !== activeSessionId,
          blank: Boolean(session?.blank),
          isPinned: wsPinnedSet.has(sidStr)
        };
      });
      const validSessions = rawSessions.filter((s) => !archivedSet.has(s.id)).filter((s) => !isBlankPlaceholder(s.id, s.title, s.blank, activeSessionId === s.id)).sort((a, b) => {
        if (a.running !== b.running) return a.running ? -1 : 1;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      const categorizedSessionIds = /* @__PURE__ */ new Set();
      for (const f of wsMeta.folders) {
        for (const sId of f.sessionIds) categorizedSessionIds.add(sId);
      }
      const uncategorizedSessions = validSessions.filter((s) => !categorizedSessionIds.has(s.id));
      const showAll = showAllSessionsMap[ws.workspaceId] || false;
      const visibleUncategorized = showAll ? uncategorizedSessions : uncategorizedSessions.slice(0, DEFAULT_VISIBLE_LIMIT);
      const remainingCount = uncategorizedSessions.length - DEFAULT_VISIBLE_LIMIT;
      const renderMoveDropdown = (sId) => {
        if (activeMoveMenuSessionId !== sId) return null;
        const isCategorized = categorizedSessionIds.has(sId);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            className: "move-menu-container",
            style: {
              position: "absolute",
              top: "100%",
              right: 0,
              zIndex: 9999,
              minWidth: "160px",
              background: "var(--dsw-alias-bg-layer-2, #1e293b)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "2px"
            },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #94a3b8)", padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }, children: "\u79FB\u52A8\u81F3\u76EE\u6807\u6587\u4EF6\u5939:" }),
              wsMeta.folders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: "6px 8px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #64748b)" }, children: "\u6682\u65E0\u6587\u4EF6\u5939\uFF0C\u8BF7\u5148\u521B\u5EFA" }) : wsMeta.folders.map((f) => {
                const inThisFolder = f.sessionIds.includes(sId);
                return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: inThisFolder ? "#60a5fa" : "var(--dsw-alias-label-primary, #e2e8f0)",
                      background: inThisFolder ? "rgba(96, 165, 250, 0.12)" : "transparent"
                    },
                    onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)",
                    onMouseLeave: (e) => e.currentTarget.style.background = inThisFolder ? "rgba(96, 165, 250, 0.12)" : "transparent",
                    onClick: async () => {
                      await globalTreeStore.moveSession(ws.path, sId, f.id);
                      setActiveMoveMenuSessionId(null);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FolderIcon, { size: 13, color: f.color || "#60a5fa" }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }, children: f.name }),
                      inThisFolder && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "10px", color: "#60a5fa" }, children: "\u2713" })
                    ]
                  },
                  f.id
                );
              }),
              isCategorized && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#cbd5e1",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    marginTop: "2px"
                  },
                  onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)",
                  onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                  onClick: async () => {
                    await globalTreeStore.moveSession(ws.path, sId, null);
                    setActiveMoveMenuSessionId(null);
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MoveOutIcon, { size: 12 }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u79FB\u51FA\u81F3\u672A\u5206\u7C7B" })
                  ]
                }
              )
            ]
          }
        );
      };
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "34px",
              padding: "0 8px",
              borderRadius: "6px",
              cursor: "pointer",
              background: isExpanded ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))" : "transparent",
              color: "var(--dsw-alias-label-primary, #f8fafc)",
              fontSize: "13px",
              fontWeight: 500,
              position: "relative"
            },
            onClick: () => toggleWorkspace(ws.workspaceId, ws.path),
            onMouseEnter: (e) => {
              const actions = e.currentTarget.querySelector(".ws-actions");
              if (actions) actions.style.display = "inline-flex";
            },
            onMouseLeave: (e) => {
              const actions = e.currentTarget.querySelector(".ws-actions");
              if (actions && activeMenuWsId !== ws.workspaceId) actions.style.display = "none";
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  ChevronRightIcon,
                  {
                    size: 12,
                    style: {
                      color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                      flexShrink: 0
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FolderIcon, { size: 15, color: "#60a5fa", style: { flexShrink: 0 } }),
                editingWsId === ws.workspaceId ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "input",
                  {
                    autoFocus: true,
                    style: {
                      ...DSH_INPUT_STYLE,
                      minWidth: 0,
                      flex: 1,
                      marginRight: "6px"
                    },
                    value: editWsTitle,
                    onChange: (e) => setEditWsTitle(e.target.value),
                    onBlur: () => handleSaveRenameWs(ws.workspaceId),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") handleSaveRenameWs(ws.workspaceId);
                      if (e.key === "Escape") setEditingWsId(null);
                    },
                    onClick: (e) => e.stopPropagation()
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: ws.path, children: ws.title })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "div",
                {
                  className: "ws-actions",
                  style: { display: activeMenuWsId === ws.workspaceId ? "inline-flex" : "none", alignItems: "center", gap: "4px" },
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: {
                          background: "transparent",
                          border: "none",
                          color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                          cursor: "pointer",
                          padding: "3px",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center"
                        },
                        title: "\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u65B0\u5EFA\u5206\u7C7B\u6587\u4EF6\u5939",
                        onClick: () => {
                          if (!isExpanded) toggleWorkspace(ws.workspaceId, ws.path);
                          setIsCreatingFolderWsId(ws.workspaceId);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AddFolderIcon, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: {
                          background: "transparent",
                          border: "none",
                          color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                          cursor: "pointer",
                          padding: "3px",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center"
                        },
                        title: "\u65B0\u5EFA\u4F1A\u8BDD",
                        onClick: () => props.startSession?.(ws.workspaceId),
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PlusIcon, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: {
                          background: "transparent",
                          border: "none",
                          color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                          cursor: "pointer",
                          padding: "3px",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center"
                        },
                        title: "\u66F4\u591A\u64CD\u4F5C",
                        onClick: () => setActiveMenuWsId(activeMenuWsId === ws.workspaceId ? null : ws.workspaceId),
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EllipsisIcon, { size: 14 })
                      }
                    )
                  ]
                }
              ),
              activeMenuWsId === ws.workspaceId && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "div",
                {
                  ref: menuRef,
                  style: {
                    position: "absolute",
                    right: "8px",
                    top: "32px",
                    zIndex: 100,
                    background: "var(--dsw-surface-0, #181818)",
                    border: "1px solid var(--dsw-border-default, rgba(255, 255, 255, 0.08))",
                    borderRadius: "8px",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.45)",
                    padding: "4px",
                    minWidth: "120px",
                    backdropFilter: "blur(12px)"
                  },
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "var(--dsw-alias-label-primary, #f8fafc)"
                        },
                        onMouseEnter: (e) => e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08))",
                        onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                        onClick: () => {
                          setEditingWsId(ws.workspaceId);
                          setEditWsTitle(ws.title);
                          setActiveMenuWsId(null);
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EditIcon, { size: 13 }),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u91CD\u547D\u540D" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#f87171"
                        },
                        onMouseEnter: (e) => e.currentTarget.style.background = "rgba(248, 113, 113, 0.12)",
                        onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                        onClick: () => {
                          props.deleteWorkspace?.(ws.workspaceId);
                          setActiveMenuWsId(null);
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrashIcon, { size: 13 }),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5220\u9664\u5DE5\u4F5C\u533A" })
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "1px", paddingLeft: "14px" }, children: [
          isCreatingFolderWsId === ws.workspaceId && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: "4px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              autoFocus: true,
              style: {
                ...DSH_INPUT_STYLE,
                width: "100%",
                height: "26px",
                padding: "0 8px"
              },
              placeholder: "\u8F93\u5165\u6587\u4EF6\u5939\u540D\u79F0 (\u56DE\u8F66\u521B\u5EFA, ESC\u53D6\u6D88)",
              value: newFolderName,
              onChange: (e) => setNewFolderName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") handleCreateFolder(ws.path);
                if (e.key === "Escape") setIsCreatingFolderWsId(null);
              },
              onBlur: () => {
                if (!newFolderName.trim()) setIsCreatingFolderWsId(null);
                else handleCreateFolder(ws.path);
              }
            }
          ) }),
          wsMeta.folders.map((folder) => {
            const folderSessions = folder.sessionIds.map((sId) => {
              const session = sessionsState.byId?.[sId];
              const isUnread = Boolean(session?.completed || localUnreadSet.has(sId));
              return {
                id: sId,
                title: session?.title || sId.slice(0, 16),
                updatedAt: session?.updatedAt || 0,
                running: Boolean(session?.running),
                pendingInteraction: session?.pendingInteraction,
                completed: isUnread && sId !== activeSessionId,
                blank: Boolean(session?.blank),
                isPinned: wsPinnedSet.has(sId)
              };
            }).filter((s) => !archivedSet.has(s.id)).sort((a, b) => {
              if (a.running !== b.running) return a.running ? -1 : 1;
              if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
              return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "30px",
                    padding: "0 6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "var(--dsw-alias-label-primary, #e2e8f0)",
                    background: "transparent",
                    border: "1px solid transparent",
                    fontSize: "12px",
                    transition: "all 0.15s ease"
                  },
                  onClick: () => globalTreeStore.toggleFolder(ws.path, folder.id),
                  onMouseEnter: (e) => {
                    const actions = e.currentTarget.querySelector(".folder-actions");
                    if (actions) actions.style.display = "inline-flex";
                  },
                  onMouseLeave: (e) => {
                    const actions = e.currentTarget.querySelector(".folder-actions");
                    if (actions) actions.style.display = "none";
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        ChevronRightIcon,
                        {
                          size: 10,
                          style: {
                            color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                            transform: folder.collapsed ? "rotate(0deg)" : "rotate(90deg)",
                            transition: "transform 0.15s ease",
                            flexShrink: 0
                          }
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FolderIcon, { size: 14, color: folder.color || "#60a5fa", style: { flexShrink: 0 } }),
                      editingFolderId === folder.id ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "input",
                        {
                          autoFocus: true,
                          style: {
                            ...DSH_INPUT_STYLE,
                            minWidth: 0,
                            flex: 1,
                            height: "22px",
                            fontSize: "12px",
                            marginRight: "6px"
                          },
                          value: editFolderName,
                          onChange: (e) => setEditFolderName(e.target.value),
                          onBlur: async () => {
                            if (editFolderName.trim()) await globalTreeStore.renameFolder(ws.path, folder.id, editFolderName.trim());
                            setEditingFolderId(null);
                          },
                          onKeyDown: async (e) => {
                            if (e.key === "Enter") {
                              if (editFolderName.trim()) await globalTreeStore.renameFolder(ws.path, folder.id, editFolderName.trim());
                              setEditingFolderId(null);
                            }
                            if (e.key === "Escape") setEditingFolderId(null);
                          },
                          onClick: (e) => e.stopPropagation()
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }, onDoubleClick: () => {
                        setEditingFolderId(folder.id);
                        setEditFolderName(folder.name);
                      }, children: folder.name }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #64748b)" }, children: [
                        "(",
                        folderSessions.length,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "folder-actions", style: { display: "none", alignItems: "center", gap: "4px" }, onClick: (e) => e.stopPropagation(), children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u5728\u6B64\u6587\u4EF6\u5939\u4E0B\u65B0\u5EFA\u4F1A\u8BDD",
                          onClick: () => handleCreateSessionInFolder(ws.workspaceId, ws.path, folder.id),
                          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PlusIcon, { size: 12 })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u91CD\u547D\u540D\u6587\u4EF6\u5939",
                          onClick: () => {
                            setEditingFolderId(folder.id);
                            setEditFolderName(folder.name);
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EditIcon, { size: 12 })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u5220\u9664\u6587\u4EF6\u5939 (\u5185\u90E8\u4F1A\u8BDD\u8FD4\u56DE\u672A\u5206\u7C7B)",
                          onClick: () => globalTreeStore.deleteFolder(ws.path, folder.id),
                          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrashIcon, { size: 12 })
                        }
                      )
                    ] })
                  ]
                }
              ),
              !folder.collapsed && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                    paddingLeft: "16px"
                  },
                  children: folderSessions.map((s) => {
                    const isActive = activeSessionId === s.id;
                    const relTime = formatRelativeTime(s.updatedAt);
                    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: "30px",
                          padding: "0 6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          background: isActive ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))" : "transparent",
                          color: isActive ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-primary, #cbd5e1)",
                          fontSize: "12px",
                          fontWeight: isActive ? 600 : 400,
                          border: "1px solid transparent",
                          transition: "background 0.12s ease"
                        },
                        onClick: () => handleOpenSession(s.id),
                        onDoubleClick: (e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditSessionTitle(s.title);
                        },
                        onMouseEnter: (e) => {
                          const act = e.currentTarget.querySelector(".sess-act");
                          const tm = e.currentTarget.querySelector(".sess-time");
                          if (act) act.style.display = "inline-flex";
                          if (tm) tm.style.display = "none";
                        },
                        onMouseLeave: (e) => {
                          const act = e.currentTarget.querySelector(".sess-act");
                          const tm = e.currentTarget.querySelector(".sess-time");
                          if (act) act.style.display = "none";
                          if (tm) tm.style.display = "inline";
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? "auto" : "none" }, children: [
                            s.running ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RunningDot, { size: 12 }) : s.pendingInteraction ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PendingDot, {}) : s.completed ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CompletedDot, { size: 12 }) : s.isPinned ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PinIcon, { size: 12, pinned: true, style: { color: "#fbbf24", flexShrink: 0 } }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChatIcon, { size: 13, style: { flexShrink: 0, opacity: 0.6 } }),
                            editingSessionId === s.id ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "input",
                              {
                                autoFocus: true,
                                style: {
                                  ...DSH_INPUT_STYLE,
                                  minWidth: 0,
                                  flex: 1,
                                  height: "22px",
                                  fontSize: "12px",
                                  marginRight: "6px",
                                  pointerEvents: "auto"
                                },
                                value: editSessionTitle,
                                onChange: (e) => setEditSessionTitle(e.target.value),
                                onBlur: () => handleSaveRenameSession(s.id),
                                onKeyDown: (e) => {
                                  if (e.key === "Enter") handleSaveRenameSession(s.id);
                                  if (e.key === "Escape") setEditingSessionId(null);
                                },
                                onClick: (e) => e.stopPropagation()
                              }
                            ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "span",
                              {
                                style: {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  userSelect: "none",
                                  WebkitUserSelect: "none"
                                },
                                title: s.title,
                                children: s.title
                              }
                            )
                          ] }),
                          editingSessionId !== s.id && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "span",
                            {
                              className: "sess-time",
                              style: {
                                fontSize: "11px",
                                color: s.running ? "#60a5fa" : s.completed ? "#4ade80" : "var(--dsw-alias-label-tertiary, #64748b)",
                                fontWeight: s.completed ? 500 : 400,
                                flexShrink: 0
                              },
                              children: s.running ? "\u751F\u6210\u4E2D" : s.completed ? "\u5DF2\u5B8C\u6210" : relTime
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "sess-act", style: { display: "none", alignItems: "center", gap: "4px" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: s.isPinned ? "#fbbf24" : "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: s.isPinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u4F1A\u8BDD",
                                onClick: async (e) => {
                                  e.stopPropagation();
                                  await globalTreeStore.togglePinSession(ws.path, s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PinIcon, { size: 12, pinned: s.isPinned })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: "\u91CD\u547D\u540D\u4F1A\u8BDD",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(s.id);
                                  setEditSessionTitle(s.title);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EditIcon, { size: 12 })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: "\u5206\u53C9\u4F1A\u8BDD (Fork)",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  props.forkSession?.(s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ForkIcon, { size: 12 })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { position: "relative", display: "inline-flex" }, children: [
                              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                                "button",
                                {
                                  className: "move-menu-btn",
                                  style: {
                                    background: activeMoveMenuSessionId === s.id ? "rgba(96, 165, 250, 0.2)" : "transparent",
                                    border: "none",
                                    color: activeMoveMenuSessionId === s.id ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #64748b)",
                                    cursor: "pointer",
                                    padding: "2px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    borderRadius: "4px"
                                  },
                                  title: "\u79FB\u52A8\u4F1A\u8BDD\u81F3\u5176\u4ED6\u6587\u4EF6\u5939\u6216\u672A\u5206\u7C7B...",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    setActiveMoveMenuSessionId(activeMoveMenuSessionId === s.id ? null : s.id);
                                  },
                                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MoveToFolderIcon, { size: 12 })
                                }
                              ),
                              renderMoveDropdown(s.id)
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px" },
                                title: "\u5220\u9664\u4F1A\u8BDD",
                                onClick: async (e) => {
                                  e.stopPropagation();
                                  await handleDeleteSession(ws.path, s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrashIcon, { size: 12 })
                              }
                            )
                          ] })
                        ]
                      },
                      s.id
                    );
                  })
                }
              )
            ] }, folder.id);
          }),
          visibleUncategorized.map((s) => {
            const isActive = activeSessionId === s.id;
            const relTime = formatRelativeTime(s.updatedAt);
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "30px",
                  padding: "0 6px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  background: isActive ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))" : "transparent",
                  color: isActive ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-primary, #cbd5e1)",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  border: "1px solid transparent",
                  transition: "background 0.12s ease"
                },
                onClick: () => handleOpenSession(s.id),
                onDoubleClick: (e) => {
                  e.stopPropagation();
                  setEditingSessionId(s.id);
                  setEditSessionTitle(s.title);
                },
                onMouseEnter: (e) => {
                  const act = e.currentTarget.querySelector(".sess-act");
                  const tm = e.currentTarget.querySelector(".sess-time");
                  if (act) act.style.display = "inline-flex";
                  if (tm) tm.style.display = "none";
                },
                onMouseLeave: (e) => {
                  const act = e.currentTarget.querySelector(".sess-act");
                  const tm = e.currentTarget.querySelector(".sess-time");
                  if (act) act.style.display = "none";
                  if (tm) tm.style.display = "inline";
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? "auto" : "none" }, children: [
                    s.running ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RunningDot, { size: 12 }) : s.pendingInteraction ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PendingDot, {}) : s.completed ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CompletedDot, { size: 12 }) : s.isPinned ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PinIcon, { size: 12, pinned: true, style: { color: "#fbbf24", flexShrink: 0 } }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChatIcon, { size: 13, style: { flexShrink: 0, opacity: 0.6 } }),
                    editingSessionId === s.id ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "input",
                      {
                        autoFocus: true,
                        style: {
                          ...DSH_INPUT_STYLE,
                          minWidth: 0,
                          flex: 1,
                          height: "22px",
                          fontSize: "12px",
                          marginRight: "6px",
                          pointerEvents: "auto"
                        },
                        value: editSessionTitle,
                        onChange: (e) => setEditSessionTitle(e.target.value),
                        onBlur: () => handleSaveRenameSession(s.id),
                        onKeyDown: (e) => {
                          if (e.key === "Enter") handleSaveRenameSession(s.id);
                          if (e.key === "Escape") setEditingSessionId(null);
                        },
                        onClick: (e) => e.stopPropagation()
                      }
                    ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "span",
                      {
                        style: {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                          WebkitUserSelect: "none"
                        },
                        title: s.title,
                        children: s.title
                      }
                    )
                  ] }),
                  editingSessionId !== s.id && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "span",
                    {
                      className: "sess-time",
                      style: {
                        fontSize: "11px",
                        color: s.running ? "#60a5fa" : s.completed ? "#4ade80" : "var(--dsw-alias-label-tertiary, #64748b)",
                        fontWeight: s.completed ? 500 : 400,
                        flexShrink: 0
                      },
                      children: s.running ? "\u751F\u6210\u4E2D" : s.completed ? "\u5DF2\u5B8C\u6210" : relTime
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "sess-act", style: { display: "none", alignItems: "center", gap: "4px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: s.isPinned ? "#fbbf24" : "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: s.isPinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u4F1A\u8BDD",
                        onClick: async (e) => {
                          e.stopPropagation();
                          await globalTreeStore.togglePinSession(ws.path, s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PinIcon, { size: 12, pinned: s.isPinned })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: "\u91CD\u547D\u540D\u4F1A\u8BDD",
                        onClick: (e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditSessionTitle(s.title);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(EditIcon, { size: 12 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: "\u5206\u53C9\u4F1A\u8BDD (Fork)",
                        onClick: (e) => {
                          e.stopPropagation();
                          props.forkSession?.(s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ForkIcon, { size: 12 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { position: "relative", display: "inline-flex" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                        "button",
                        {
                          className: "move-menu-btn",
                          style: {
                            background: activeMoveMenuSessionId === s.id ? "rgba(96, 165, 250, 0.2)" : "transparent",
                            border: "none",
                            color: activeMoveMenuSessionId === s.id ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #64748b)",
                            cursor: "pointer",
                            padding: "2px",
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "4px"
                          },
                          title: "\u79FB\u52A8\u4F1A\u8BDD\u81F3\u6587\u4EF6\u5939...",
                          onClick: (e) => {
                            e.stopPropagation();
                            setActiveMoveMenuSessionId(activeMoveMenuSessionId === s.id ? null : s.id);
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MoveToFolderIcon, { size: 12 })
                        }
                      ),
                      renderMoveDropdown(s.id)
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px" },
                        title: "\u5220\u9664\u4F1A\u8BDD",
                        onClick: async (e) => {
                          e.stopPropagation();
                          await handleDeleteSession(ws.path, s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrashIcon, { size: 12 })
                      }
                    )
                  ] })
                ]
              },
              s.id
            );
          }),
          !showAll && remainingCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "div",
            {
              style: {
                padding: "6px 8px",
                fontSize: "11px",
                color: "var(--dsw-alias-label-tertiary, #94a3b8)",
                cursor: "pointer",
                borderRadius: "4px"
              },
              onMouseEnter: (e) => e.currentTarget.style.color = "var(--dsw-alias-label-primary, #fff)",
              onMouseLeave: (e) => e.currentTarget.style.color = "var(--dsw-alias-label-tertiary, #94a3b8)",
              onClick: () => setShowAllSessionsMap((prev) => ({ ...prev, [ws.workspaceId]: true })),
              children: [
                "\u5C55\u5F00\u5176\u4F59 ",
                remainingCount,
                " \u4E2A\u4F1A\u8BDD"
              ]
            }
          )
        ] })
      ] }, ws.workspaceId);
    }) })
  ] });
};

// src/client/index.tsx
var name = "@dsh-external/dsh-workspace-tree/client";
var inject = ["slots", "sessions", "workspaces"];
function apply(ctx) {
  try {
    ;
    ctx.slots.inject("sidebar.workspaces", () => {
      return ctx.slots.register(
        {
          name: "sidebar.workspaces",
          priority: -10,
          // intentional shadow over stock workspace browser (lowest renders)
          inject: () => ({
            startSession: (workspaceId) => ctx.workspaces?.startSession?.(workspaceId),
            startSessionInFolder: async (workspaceId, wsPath, folderId) => {
              try {
                const sessionId = await ctx.workspaces?.connectWorkspace?.(workspaceId);
                if (sessionId) {
                  await globalTreeStore.addSessionToFolder(wsPath, folderId, sessionId);
                  ctx.sessions?.open?.(sessionId);
                }
              } catch (err) {
                console.error("[dsh-workspace-tree] startSessionInFolder failed:", err);
              }
            },
            open: (sessionId) => ctx.sessions?.open?.(sessionId),
            renameWorkspace: async (workspaceId, title) => {
              await ctx.workspaces?.rename?.(workspaceId, title);
            },
            deleteWorkspace: async (workspaceId) => {
              await ctx.workspaces?.delete?.(workspaceId);
            },
            createWorkspace: (input) => ctx.workspaces?.create?.(input),
            renameSession: async (sessionId, title) => {
              const session = ctx.sessions?.binding?.(sessionId)?.session;
              if (session) {
                await session.rename(title);
              }
            },
            archiveSession: async (sessionId) => {
              await ctx.workspaces?.archiveSession?.(sessionId);
            },
            forkSession: (sessionId) => {
              ctx.sessions?.fork?.({ sessionId, increaseTitle: true }).then((childId) => {
                ctx.sessions?.open?.(childId);
              }).catch(() => {
              });
            }
          })
        },
        EnhancedWorkspaceBrowser
      );
    });
  } catch (err) {
    console.error("[dsh-workspace-tree] Slot injection failed:", err);
  }
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC9pbmRleC50c3giLCAic3JjL2NsaWVudC9FbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXIudHN4IiwgInNyYy9jbGllbnQvYXBpLnRzIiwgInNyYy9jbGllbnQvdHJlZS1zdG9yZS50cyIsICJzcmMvY2xpZW50L3RpbWUudHMiLCAic3JjL2NsaWVudC9jb21wb25lbnRzL0ljb25zLnRzeCIsICJzcmMvY2xpZW50L2NvbXBvbmVudHMvU3RhdGVJbmRpY2F0b3IudHN4IiwgInNyYy9jbGllbnQvY29tcG9uZW50cy9EaXJlY3RvcnlCcm93c2VyTW9kYWwudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIGRzaC13b3Jrc3BhY2UtdHJlZSBicm93c2VyIGNsaWVudCBlbnRyeS5cbiAqXG4gKiBEaXJlY3QgdGFrZW92ZXIgb2YgYHNpZGViYXIud29ya3NwYWNlc2Agd2l0aCBwcmlvcml0eTogLTEwLlxuICogSW5qZWN0cyB2aXJ0dWFsIGZvbGRlcnMsIGRyYWcgJiBkcm9wIGdyb3VwaW5nLCBhbmQgbmVzdGVkIHN1YnByb2plY3RzIGRpcmVjdGx5XG4gKiBpbnNpZGUgdGhlIG5hdGl2ZSB3b3Jrc3BhY2UgbGlzdCByb3dzLCB3aXRoIHplcm8gRE9NIHBvbGx1dGlvbi5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQsIFNlc3Npb25JZCwgV29ya3NwYWNlSWQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCdcbmltcG9ydCB7IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlciB9IGZyb20gJy4vRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLnRzeCdcbmltcG9ydCB7IGdsb2JhbFRyZWVTdG9yZSB9IGZyb20gJy4vdHJlZS1zdG9yZS50cydcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAnQGRzaC1leHRlcm5hbC9kc2gtd29ya3NwYWNlLXRyZWUvY2xpZW50J1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnd29ya3NwYWNlcyddXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICA7KGN0eC5zbG90cy5pbmplY3QgYXMgYW55KSgnc2lkZWJhci53b3Jrc3BhY2VzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIChjdHguc2xvdHMucmVnaXN0ZXIgYXMgYW55KShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzaWRlYmFyLndvcmtzcGFjZXMnLFxuICAgICAgICAgIHByaW9yaXR5OiAtMTAsIC8vIGludGVudGlvbmFsIHNoYWRvdyBvdmVyIHN0b2NrIHdvcmtzcGFjZSBicm93c2VyIChsb3dlc3QgcmVuZGVycylcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBzdGFydFNlc3Npb246ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiBjdHgud29ya3NwYWNlcz8uc3RhcnRTZXNzaW9uPy4od29ya3NwYWNlSWQpLFxuICAgICAgICAgICAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI6IGFzeW5jICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5jb25uZWN0V29ya3NwYWNlPy4od29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmFkZFNlc3Npb25Ub0ZvbGRlcih3c1BhdGgsIGZvbGRlcklkLCBzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBzdGFydFNlc3Npb25JbkZvbGRlciBmYWlsZWQ6JywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpLFxuICAgICAgICAgICAgcmVuYW1lV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5yZW5hbWU/Lih3b3Jrc3BhY2VJZCwgdGl0bGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5kZWxldGU/Lih3b3Jrc3BhY2VJZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVXb3Jrc3BhY2U6IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gY3R4LndvcmtzcGFjZXM/LmNyZWF0ZT8uKGlucHV0KSxcbiAgICAgICAgICAgIHJlbmFtZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gY3R4LnNlc3Npb25zPy5iaW5kaW5nPy4oc2Vzc2lvbklkKT8uc2Vzc2lvblxuICAgICAgICAgICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlc3Npb24ucmVuYW1lKHRpdGxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJjaGl2ZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCBjdHgud29ya3NwYWNlcz8uYXJjaGl2ZVNlc3Npb24/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ya1Nlc3Npb246IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/LmZvcms/Lih7IHNlc3Npb25JZCwgaW5jcmVhc2VUaXRsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChjaGlsZElkKSA9PiB7IGN0eC5zZXNzaW9ucz8ub3Blbj8uKGNoaWxkSWQpIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLFxuICAgICAgKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIFNsb3QgaW5qZWN0aW9uIGZhaWxlZDonLCBlcnIpXG4gIH1cbn1cbiIsICJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCB1c2VTeW5jRXh0ZXJuYWxTdG9yZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uSWQsIFdvcmtzcGFjZUlkLCBXb3Jrc3BhY2VWaWV3IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnXG5pbXBvcnQgeyBnbG9iYWxUcmVlU3RvcmUgfSBmcm9tICcuL3RyZWUtc3RvcmUudHMnXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFN1YnByb2plY3RJbmZvIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJ1xuaW1wb3J0IHsgZm9ybWF0UmVsYXRpdmVUaW1lIH0gZnJvbSAnLi90aW1lLnRzJ1xuaW1wb3J0IHtcbiAgQWRkRm9sZGVySWNvbixcbiAgQ2hhdEljb24sXG4gIENoZXZyb25SaWdodEljb24sXG4gIENsb3NlSWNvbixcbiAgRWRpdEljb24sXG4gIEVsbGlwc2lzSWNvbixcbiAgRm9sZGVySWNvbixcbiAgRm9ya0ljb24sXG4gIE1vdmVPdXRJY29uLFxuICBNb3ZlVG9Gb2xkZXJJY29uLFxuICBQaW5JY29uLFxuICBQbHVzSWNvbixcbiAgU2VhcmNoSWNvbixcbiAgVHJhc2hJY29uLFxufSBmcm9tICcuL2NvbXBvbmVudHMvSWNvbnMudHN4J1xuaW1wb3J0IHsgQ29tcGxldGVkRG90LCBQZW5kaW5nRG90LCBSdW5uaW5nRG90IH0gZnJvbSAnLi9jb21wb25lbnRzL1N0YXRlSW5kaWNhdG9yLnRzeCdcbmltcG9ydCB7IERpcmVjdG9yeUJyb3dzZXJNb2RhbCB9IGZyb20gJy4vY29tcG9uZW50cy9EaXJlY3RvcnlCcm93c2VyTW9kYWwudHN4J1xuXG5leHBvcnQgaW50ZXJmYWNlIEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlclByb3BzIHtcbiAgdXNlV29ya3NwYWNlcz86IChzZWxlY3RvcjogKHM6IGFueSkgPT4gYW55KSA9PiBhbnlcbiAgdXNlU2Vzc2lvbnM/OiAoc2VsZWN0b3I6IChzOiBhbnkpID0+IGFueSkgPT4gYW55XG4gIHN0YXJ0U2Vzc2lvbj86ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiB2b2lkXG4gIHN0YXJ0U2Vzc2lvbkluRm9sZGVyPzogKHdvcmtzcGFjZUlkOiBXb3Jrc3BhY2VJZCwgd3NQYXRoOiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD5cbiAgb3Blbj86IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4gdm9pZFxuICByZW5hbWVXb3Jrc3BhY2U/OiAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGRlbGV0ZVdvcmtzcGFjZT86ICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQpID0+IFByb21pc2U8dm9pZD5cbiAgY3JlYXRlV29ya3NwYWNlPzogKGlucHV0OiB7IHBhdGg6IHN0cmluZyB9KSA9PiBQcm9taXNlPFdvcmtzcGFjZVZpZXc+XG4gIHJlbmFtZVNlc3Npb24/OiAoc2Vzc2lvbklkOiBTZXNzaW9uSWQsIHRpdGxlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD5cbiAgYXJjaGl2ZVNlc3Npb24/OiAoc2Vzc2lvbklkOiBTZXNzaW9uSWQpID0+IFByb21pc2U8dm9pZD5cbiAgZm9ya1Nlc3Npb24/OiAoc2Vzc2lvbklkOiBTZXNzaW9uSWQpID0+IHZvaWRcbn1cblxuY29uc3QgREVGQVVMVF9WSVNJQkxFX0xJTUlUID0gMTBcbmNvbnN0IFBSRVNFVF9DT0xPUlMgPSBbJyM2MGE1ZmEnLCAnIzRhZGU4MCcsICcjZmJiZjI0JywgJyNmODcxNzEnLCAnI2MwODRmYycsICcjMzhiZGY4J11cblxuLyoqIENoZWNrIGlmIGEgc2Vzc2lvbiBpcyBqdXN0IGFuIGVtcHR5IHBsYWNlaG9sZGVyIGxpa2UgXCJzZXNzaW9uLWNmNmZlMTY4XCIgKi9cbmZ1bmN0aW9uIGlzQmxhbmtQbGFjZWhvbGRlcihpZDogc3RyaW5nLCB0aXRsZT86IHN0cmluZywgaXNCbGFuayA9IGZhbHNlLCBpc0FjdGl2ZSA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGlmIChpc0FjdGl2ZSkgcmV0dXJuIGZhbHNlXG4gIGlmIChpc0JsYW5rKSByZXR1cm4gdHJ1ZVxuICBpZiAoIXRpdGxlKSByZXR1cm4gdHJ1ZVxuICBpZiAodGl0bGUgPT09IGlkKSByZXR1cm4gdHJ1ZVxuICBpZiAoL15zZXNzaW9uLVthLXowLTktXSskL2kudGVzdCh0aXRsZSkpIHJldHVybiB0cnVlXG4gIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBEU0hfSU5QVVRfU1RZTEU6IFJlYWN0LkNTU1Byb3BlcnRpZXMgPSB7XG4gIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICBwYWRkaW5nOiAnMXB4IDZweCcsXG4gIGJvcmRlclJhZGl1czogJzRweCcsXG4gIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgYmFja2dyb3VuZDogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknLFxuICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsXG4gIGZvbnRTaXplOiAnMTNweCcsXG4gIGxpbmVIZWlnaHQ6ICcyMHB4JyxcbiAgb3V0bGluZTogJ25vbmUnLFxuICBmb250RmFtaWx5OiAnaW5oZXJpdCcsXG59XG5cbmludGVyZmFjZSBCYW5uZXJUYXNrIHtcbiAgc2Vzc2lvbklkOiBzdHJpbmdcbiAgdGl0bGU6IHN0cmluZ1xuICBzdGF0dXM6ICdydW5uaW5nJyB8ICdwZW5kaW5nJyB8ICdjb21wbGV0ZWQnXG4gIHdzPzogV29ya3NwYWNlVmlld1xufVxuXG5jb25zdCBUQVNLX1NUWUxFX0NPTkZJRyA9IHtcbiAgcnVubmluZzoge1xuICAgIGJnOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMDgpJyxcbiAgICBib3JkZXI6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yMiknLFxuICAgIGhvdmVyQmc6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xNiknLFxuICAgIGhvdmVyQm9yZGVyOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuNDUpJyxcbiAgICB0YWdUZXh0OiAnXHU4RkRCXHU4ODRDXHU0RTJEJyxcbiAgICB0YWdDb2xvcjogJyM2MGE1ZmEnLFxuICAgIHRhZ0JnOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTQpJyxcbiAgICB0aXRsZVByZWZpeDogJ1x1NkI2M1x1NTcyOFx1OEZEQlx1ODg0QycsXG4gIH0sXG4gIHBlbmRpbmc6IHtcbiAgICBiZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSgyNTEsIDE5MSwgMzYsIDAuMjUpJyxcbiAgICBob3ZlckJnOiAncmdiYSgyNTEsIDE5MSwgMzYsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjUpJyxcbiAgICB0YWdUZXh0OiAnXHU1Rjg1XHU3ODZFXHU4QkE0JyxcbiAgICB0YWdDb2xvcjogJyNmYmJmMjQnLFxuICAgIHRhZ0JnOiAncmdiYSgyNTEsIDE5MSwgMzYsIDAuMTQpJyxcbiAgICB0aXRsZVByZWZpeDogJ1x1N0I0OVx1NUY4NVx1Nzg2RVx1OEJBNCcsXG4gIH0sXG4gIGNvbXBsZXRlZDoge1xuICAgIGJnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMDgpJyxcbiAgICBib3JkZXI6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4yNSknLFxuICAgIGhvdmVyQmc6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4xNiknLFxuICAgIGhvdmVyQm9yZGVyOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuNSknLFxuICAgIHRhZ1RleHQ6ICdcdTVGODVcdThCRkInLFxuICAgIHRhZ0NvbG9yOiAnIzRhZGU4MCcsXG4gICAgdGFnQmc6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4xNCknLFxuICAgIHRpdGxlUHJlZml4OiAnXHU1REYyXHU2MjY3XHU4ODRDXHU1QjhDXHU2QkQ1XHU1Rjg1XHU5NjA1XHU4QkZCJyxcbiAgfSxcbn1cblxuZXhwb3J0IGNvbnN0IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlcjogUmVhY3QuRkM8RW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyUHJvcHM+ID0gKHByb3BzKSA9PiB7XG4gIC8vIFN1YnNjcmliZSB0byBUcmVlU3RvcmUgY2hhbmdlcyB3aXRoIHJlYWN0aXZlIHZlcnNpb24gY291bnRlciAoZ3VhcmFudGVlcyBpbnN0YW50IDBtcyByZS1yZW5kZXJzKVxuICB1c2VTeW5jRXh0ZXJuYWxTdG9yZShcbiAgICAoY2IpID0+IGdsb2JhbFRyZWVTdG9yZS5zdWJzY3JpYmUoY2IpLFxuICAgICgpID0+IGdsb2JhbFRyZWVTdG9yZS5nZXRWZXJzaW9uKCksXG4gIClcblxuICBsZXQgd29ya3NwYWNlc1N0YXRlOiB7XG4gICAgaXRlbXM/OiByZWFkb25seSBXb3Jrc3BhY2VWaWV3W11cbiAgICBhcmNoaXZlZFNlc3Npb25JZHM/OiByZWFkb25seSBTZXNzaW9uSWRbXVxuICAgIHJlY2VudFdvcmtzcGFjZUlkPzogV29ya3NwYWNlSWRcbiAgfSA9IHsgaXRlbXM6IFtdLCBhcmNoaXZlZFNlc3Npb25JZHM6IFtdIH1cblxuICB0cnkge1xuICAgIGlmIChwcm9wcy51c2VXb3Jrc3BhY2VzKSB7XG4gICAgICB3b3Jrc3BhY2VzU3RhdGUgPSBwcm9wcy51c2VXb3Jrc3BhY2VzKChzOiBhbnkpID0+IHMpIHx8IHsgaXRlbXM6IFtdLCBhcmNoaXZlZFNlc3Npb25JZHM6IFtdIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIGlnbm9yZVxuICB9XG5cbiAgY29uc3QgW2V4cGFuZGVkV29ya3NwYWNlcywgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzXSA9IHVzZVN0YXRlPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpXG4gIGNvbnN0IFtzZWFyY2hRdWVyeSwgc2V0U2VhcmNoUXVlcnldID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtzaG93U2VhcmNoLCBzZXRTaG93U2VhcmNoXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbaXNBZGRNb2RhbE9wZW4sIHNldElzQWRkTW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbbmV3V29ya3NwYWNlUGF0aCwgc2V0TmV3V29ya3NwYWNlUGF0aF0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2lzU3VibWl0dGluZ1dzLCBzZXRJc1N1Ym1pdHRpbmdXc10gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2FkZFdzRXJyb3IsIHNldEFkZFdzRXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2FjdGl2ZU1lbnVXc0lkLCBzZXRBY3RpdmVNZW51V3NJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdGluZ1dzSWQsIHNldEVkaXRpbmdXc0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0V3NUaXRsZSwgc2V0RWRpdFdzVGl0bGVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtpc0NyZWF0aW5nRm9sZGVyV3NJZCwgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW25ld0ZvbGRlck5hbWUsIHNldE5ld0ZvbGRlck5hbWVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtlZGl0aW5nRm9sZGVySWQsIHNldEVkaXRpbmdGb2xkZXJJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdEZvbGRlck5hbWUsIHNldEVkaXRGb2xkZXJOYW1lXSA9IHVzZVN0YXRlKCcnKVxuXG4gIC8vIExvY2FsIHVucmVhZCBjb21wbGV0aW9uIHRyYWNrZXIgKHJlYWN0aXZlIHRvIHJ1bm5pbmcgdHJ1ZS0+ZmFsc2UgZWRnZSB3aGVuIG5vdCBhY3RpdmUpXG4gIGNvbnN0IFtsb2NhbFVucmVhZFNldCwgc2V0TG9jYWxVbnJlYWRTZXRdID0gdXNlU3RhdGU8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSlcbiAgY29uc3QgcHJldlJ1bm5pbmdNYXAgPSB1c2VSZWY8TWFwPHN0cmluZywgYm9vbGVhbj4+KG5ldyBNYXAoKSlcblxuICAvLyBTZXNzaW9uIHJlbmFtZSBzdGF0ZVxuICBjb25zdCBbZWRpdGluZ1Nlc3Npb25JZCwgc2V0RWRpdGluZ1Nlc3Npb25JZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdFNlc3Npb25UaXRsZSwgc2V0RWRpdFNlc3Npb25UaXRsZV0gPSB1c2VTdGF0ZSgnJylcbiAgXG4gIC8vIFNlc3Npb24gbW92ZS10by1mb2xkZXIgZHJvcGRvd24gbWVudSBzdGF0ZVxuICBjb25zdCBbYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQsIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIFxuICBjb25zdCBbc2hvd0FsbFNlc3Npb25zTWFwLCBzZXRTaG93QWxsU2Vzc2lvbnNNYXBdID0gdXNlU3RhdGU8UmVjb3JkPHN0cmluZywgYm9vbGVhbj4+KHt9KVxuXG4gIGNvbnN0IG1lbnVSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVHbG9iYWxDbGljayA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBpZiAobWVudVJlZi5jdXJyZW50ICYmICFtZW51UmVmLmN1cnJlbnQuY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50XG4gICAgICBpZiAoIXRhcmdldC5jbG9zZXN0KCcubW92ZS1tZW51LWNvbnRhaW5lcicpICYmICF0YXJnZXQuY2xvc2VzdCgnLm1vdmUtbWVudS1idG4nKSkge1xuICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgICAgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICAgICAgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgIH1cbiAgICB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlR2xvYmFsQ2xpY2spXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlEb3duKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVHbG9iYWxDbGljaylcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bilcbiAgICB9XG4gIH0sIFtdKVxuXG4gIGxldCBzZXNzaW9uc1N0YXRlOiB7XG4gICAgaWRzPzogU2Vzc2lvbklkW11cbiAgICBieUlkPzogUmVjb3JkPHN0cmluZywgeyBzZXNzaW9uSWQ6IFNlc3Npb25JZDsgdGl0bGU/OiBzdHJpbmc7IHVwZGF0ZWRBdD86IG51bWJlcjsgcnVubmluZz86IGJvb2xlYW47IHBlbmRpbmdJbnRlcmFjdGlvbj86IGFueTsgY29tcGxldGVkPzogYm9vbGVhbjsgYmxhbms/OiBib29sZWFuIH0+XG4gICAgY3VycmVudD86IFNlc3Npb25JZFxuICB9ID0geyBpZHM6IFtdLCBieUlkOiB7fSB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvcHMudXNlU2Vzc2lvbnMpIHtcbiAgICAgIHNlc3Npb25zU3RhdGUgPSBwcm9wcy51c2VTZXNzaW9ucygoczogYW55KSA9PiBzKSB8fCB7fVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gaWdub3JlXG4gIH1cblxuICBjb25zdCBhY3RpdmVTZXNzaW9uSWQgPSBzZXNzaW9uc1N0YXRlLmN1cnJlbnQgYXMgdW5rbm93biBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgY29uc3QgaXRlbXM6IHJlYWRvbmx5IFdvcmtzcGFjZVZpZXdbXSA9IHdvcmtzcGFjZXNTdGF0ZS5pdGVtcyB8fCBbXVxuICBjb25zdCBhcmNoaXZlZFNlc3Npb25JZHM6IHJlYWRvbmx5IFNlc3Npb25JZFtdID0gd29ya3NwYWNlc1N0YXRlLmFyY2hpdmVkU2Vzc2lvbklkcyB8fCBbXVxuICBjb25zdCBhcmNoaXZlZFNldCA9IHVzZU1lbW8oKCkgPT4gbmV3IFNldChhcmNoaXZlZFNlc3Npb25JZHMubWFwKFN0cmluZykpLCBbYXJjaGl2ZWRTZXNzaW9uSWRzXSlcblxuICAvLyBQcmVsb2FkIGFsbCB3b3Jrc3BhY2UgbWV0YWRhdGEgb25jZSBpdGVtcyBhcnJpdmVcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBmb3IgKGNvbnN0IHdzIG9mIGl0ZW1zKSB7XG4gICAgICBpZiAod3MucGF0aCkge1xuICAgICAgICBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZSh3cy5wYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW2l0ZW1zXSlcblxuICAvLyBXYXRjaCBydW5uaW5nIC0+IGNvbXBsZXRlZCB0cmFuc2l0aW9ucyBmb3IgYmFja2dyb3VuZCB1bnJlYWQgcmVtaW5kZXJzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYnlJZCA9IHNlc3Npb25zU3RhdGUuYnlJZCB8fCB7fVxuICAgIGNvbnN0IG5ld1VucmVhZCA9IG5ldyBTZXQobG9jYWxVbnJlYWRTZXQpXG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZVxuXG4gICAgZm9yIChjb25zdCBbaWQsIHNlc3Npb25dIG9mIE9iamVjdC5lbnRyaWVzKGJ5SWQpKSB7XG4gICAgICBpZiAoYXJjaGl2ZWRTZXQuaGFzKGlkKSkge1xuICAgICAgICBpZiAobmV3VW5yZWFkLmhhcyhpZCkpIHtcbiAgICAgICAgICBuZXdVbnJlYWQuZGVsZXRlKGlkKVxuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGNvbnN0IHdhc1J1bm5pbmcgPSBwcmV2UnVubmluZ01hcC5jdXJyZW50LmdldChpZCkgfHwgZmFsc2VcbiAgICAgIGNvbnN0IGlzTm93UnVubmluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZylcblxuICAgICAgLy8gVHJhbnNpdGlvbjogcnVubmluZyB0cnVlIC0+IGZhbHNlIHdoaWxlIE5PVCBhY3RpdmUgc2Vzc2lvbiA9PiBNYXJrIGFzIFVucmVhZFxuICAgICAgaWYgKHdhc1J1bm5pbmcgJiYgIWlzTm93UnVubmluZyAmJiBpZCAhPT0gYWN0aXZlU2Vzc2lvbklkKSB7XG4gICAgICAgIG5ld1VucmVhZC5hZGQoaWQpXG4gICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIC8vIElmIGFjdGl2ZSBzZXNzaW9uLCBjbGVhciB1bnJlYWRcbiAgICAgIGlmIChpZCA9PT0gYWN0aXZlU2Vzc2lvbklkICYmIG5ld1VucmVhZC5oYXMoaWQpKSB7XG4gICAgICAgIG5ld1VucmVhZC5kZWxldGUoaWQpXG4gICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIHByZXZSdW5uaW5nTWFwLmN1cnJlbnQuc2V0KGlkLCBpc05vd1J1bm5pbmcpXG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5ld1VucmVhZClcbiAgICB9XG4gIH0sIFtzZXNzaW9uc1N0YXRlLmJ5SWQsIGFjdGl2ZVNlc3Npb25JZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIC8vIENsZWFyIHVucmVhZCBvbiBzZXNzaW9uIG9wZW5cbiAgY29uc3QgaGFuZGxlT3BlblNlc3Npb24gPSAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobG9jYWxVbnJlYWRTZXQuaGFzKHNlc3Npb25JZCkpIHtcbiAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgICAgbmV4dC5kZWxldGUoc2Vzc2lvbklkKVxuICAgICAgc2V0TG9jYWxVbnJlYWRTZXQobmV4dClcbiAgICB9XG4gICAgcHJvcHMub3Blbj8uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgfVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDAgJiYgZXhwYW5kZWRXb3Jrc3BhY2VzLnNpemUgPT09IDApIHtcbiAgICAgIGNvbnN0IHRhcmdldElkID0gd29ya3NwYWNlc1N0YXRlLnJlY2VudFdvcmtzcGFjZUlkIHx8IGl0ZW1zWzBdPy53b3Jrc3BhY2VJZFxuICAgICAgaWYgKHRhcmdldElkKSB7XG4gICAgICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcyhuZXcgU2V0KFt0YXJnZXRJZF0pKVxuICAgICAgICBjb25zdCBmaXJzdCA9IGl0ZW1zLmZpbmQoKHcpID0+IHcud29ya3NwYWNlSWQgPT09IHRhcmdldElkKVxuICAgICAgICBpZiAoZmlyc3Q/LnBhdGgpIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKGZpcnN0LnBhdGgpXG4gICAgICB9XG4gICAgfVxuICB9LCBbaXRlbXMsIHdvcmtzcGFjZXNTdGF0ZS5yZWNlbnRXb3Jrc3BhY2VJZF0pXG5cbiAgY29uc3QgdG9nZ2xlV29ya3NwYWNlID0gKHdzSWQ6IHN0cmluZywgd3NQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IFNldChleHBhbmRlZFdvcmtzcGFjZXMpXG4gICAgaWYgKG5leHQuaGFzKHdzSWQpKSB7XG4gICAgICBuZXh0LmRlbGV0ZSh3c0lkKVxuICAgICAgc2V0U2hvd0FsbFNlc3Npb25zTWFwKChwcmV2KSA9PiAoeyAuLi5wcmV2LCBbd3NJZF06IGZhbHNlIH0pKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LmFkZCh3c0lkKVxuICAgICAgZ2xvYmFsVHJlZVN0b3JlLmxvYWRXb3Jrc3BhY2Uod3NQYXRoKVxuICAgIH1cbiAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMobmV4dClcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNyZWF0ZUZvbGRlciA9IGFzeW5jICh3c1BhdGg6IHN0cmluZykgPT4ge1xuICAgIGlmIChuZXdGb2xkZXJOYW1lLnRyaW0oKSkge1xuICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmNyZWF0ZUZvbGRlcih3c1BhdGgsIG5ld0ZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgc2V0TmV3Rm9sZGVyTmFtZSgnJylcbiAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKG51bGwpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgaGFuZGxlU2F2ZVJlbmFtZVdzID0gYXN5bmMgKHdzSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgaWYgKGVkaXRXc1RpdGxlLnRyaW0oKSAmJiBwcm9wcy5yZW5hbWVXb3Jrc3BhY2UpIHtcbiAgICAgIGF3YWl0IHByb3BzLnJlbmFtZVdvcmtzcGFjZSh3c0lkLCBlZGl0V3NUaXRsZS50cmltKCkpXG4gICAgfVxuICAgIHNldEVkaXRpbmdXc0lkKG51bGwpXG4gICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZVNhdmVSZW5hbWVTZXNzaW9uID0gYXN5bmMgKHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGVkaXRTZXNzaW9uVGl0bGUudHJpbSgpICYmIHByb3BzLnJlbmFtZVNlc3Npb24pIHtcbiAgICAgIGF3YWl0IHByb3BzLnJlbmFtZVNlc3Npb24oc2Vzc2lvbklkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkLCBlZGl0U2Vzc2lvblRpdGxlLnRyaW0oKSlcbiAgICB9XG4gICAgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICB9XG5cbiAgLy8gXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXHVGRjFBXHU0RUNFXHU2NzJDXHU1NzMwXHU2NTg3XHU0RUY2XHU1OTM5XHU2RTA1XHU5NjY0ICsgXHU0RUNFXHU2NzJBXHU4QkZCXHU2RTA1XHU5NjY0ICsgXHU4QzAzXHU3NTI4IERTSCBcdTY4MzhcdTVGQzNcdTVGNTJcdTY4NjNcdTUyMjBcdTk2NjRcbiAgY29uc3QgaGFuZGxlRGVsZXRlU2Vzc2lvbiA9IGFzeW5jICh3c1BhdGg6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKGxvY2FsVW5yZWFkU2V0LmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgICAgICBuZXh0LmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5leHQpXG4gICAgICB9XG4gICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucHVyZ2VTZXNzaW9uKHdzUGF0aCwgc2Vzc2lvbklkKVxuICAgICAgaWYgKHByb3BzLmFyY2hpdmVTZXNzaW9uKSB7XG4gICAgICAgIGF3YWl0IHByb3BzLmFyY2hpdmVTZXNzaW9uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIERlbGV0ZSBzZXNzaW9uIGZhaWxlZDonLCBlcnIpXG4gICAgfVxuICB9XG5cbiAgLy8gXHVEODNDXHVERjFGIFx1NTcyOFx1NjMwN1x1NUI5QVx1NjU4N1x1NEVGNlx1NTkzOVx1NTE4NVx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFx1RkYwOFx1NzZGNFx1OEZERSBjb25uZWN0V29ya3NwYWNlIFx1ODNCN1x1NTNENiBTZXNzaW9uSWQgXHU1RTc2XHU1RjUyXHU1MTY1XHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU5NkY2XHU2NUY2XHU1RThGXHU3QURFXHU2MDAxXHVGRjA5XG4gIGNvbnN0IGhhbmRsZUNyZWF0ZVNlc3Npb25JbkZvbGRlciA9IGFzeW5jICh3c0lkOiBXb3Jrc3BhY2VJZCwgd3NQYXRoOiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAocHJvcHMuc3RhcnRTZXNzaW9uSW5Gb2xkZXIpIHtcbiAgICAgIGF3YWl0IHByb3BzLnN0YXJ0U2Vzc2lvbkluRm9sZGVyKHdzSWQsIHdzUGF0aCwgZm9sZGVySWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzSWQpXG4gICAgfVxuICB9XG5cbiAgLy8gXHVEODNDXHVERjFGIFx1OTg3Nlx1OTBFOFx1NkQzQlx1NTJBOFx1NEUwRVx1NUY4NVx1OEJGQlx1NEVGQlx1NTJBMVx1OTYxRlx1NTIxN1x1RkYwOFx1OEZEQlx1ODg0Q1x1NEUyRCAvIFx1NUY4NVx1NEVBNFx1NEU5MiAvIFx1NURGMlx1NUI4Q1x1NjIxMFx1NUY4NVx1OEJGQlx1RkYwQ1x1NzBCOVx1NTFGQlx1OTYwNVx1OEJGQlx1NTQwRVx1ODFFQVx1NTJBOFx1NkQ4OFx1OTY2NFx1RkYwOVxuICBjb25zdCBiYW5uZXJUYXNrcyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGxpc3Q6IEJhbm5lclRhc2tbXSA9IFtdXG4gICAgY29uc3QgYnlJZCA9IHNlc3Npb25zU3RhdGUuYnlJZCB8fCB7fVxuXG4gICAgZm9yIChjb25zdCBbc0lkLCBzZXNzaW9uXSBvZiBPYmplY3QuZW50cmllcyhieUlkKSkge1xuICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhzSWQpKSBjb250aW51ZVxuICAgICAgY29uc3QgaXNSdW5uaW5nID0gQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKVxuICAgICAgY29uc3QgaXNQZW5kaW5nID0gQm9vbGVhbihzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24pXG4gICAgICBjb25zdCBpc1VucmVhZENvbXBsZXRlZCA9IChCb29sZWFuKHNlc3Npb24/LmNvbXBsZXRlZCkgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNJZCkpICYmIHNJZCAhPT0gYWN0aXZlU2Vzc2lvbklkXG5cbiAgICAgIGNvbnN0IG93bmVyV3MgPSBpdGVtcy5maW5kKCh3KSA9PiAody5zZXNzaW9uSWRzIHx8IFtdKS5pbmNsdWRlcyhzSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpKVxuICAgICAgY29uc3QgdGl0bGUgPSBzZXNzaW9uPy50aXRsZSB8fCBzSWQuc2xpY2UoMCwgMTYpXG5cbiAgICAgIGlmIChpc1J1bm5pbmcpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgc2Vzc2lvbklkOiBzSWQsIHRpdGxlLCBzdGF0dXM6ICdydW5uaW5nJywgd3M6IG93bmVyV3MgfSlcbiAgICAgIH0gZWxzZSBpZiAoaXNQZW5kaW5nKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAncGVuZGluZycsIHdzOiBvd25lcldzIH0pXG4gICAgICB9IGVsc2UgaWYgKGlzVW5yZWFkQ29tcGxldGVkKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAnY29tcGxldGVkJywgd3M6IG93bmVyV3MgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBvcmRlcjogUmVjb3JkPCdydW5uaW5nJyB8ICdwZW5kaW5nJyB8ICdjb21wbGV0ZWQnLCBudW1iZXI+ID0geyBydW5uaW5nOiAwLCBwZW5kaW5nOiAxLCBjb21wbGV0ZWQ6IDIgfVxuICAgIHJldHVybiBsaXN0LnNvcnQoKGEsIGIpID0+IChvcmRlclthLnN0YXR1c10gPz8gMCkgLSAob3JkZXJbYi5zdGF0dXNdID8/IDApKVxuICB9LCBbc2Vzc2lvbnNTdGF0ZS5ieUlkLCBpdGVtcywgbG9jYWxVbnJlYWRTZXQsIGFjdGl2ZVNlc3Npb25JZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIC8vIFx1NzBCOVx1NTFGQlx1NEVGQlx1NTJBMVx1RkYxQVx1NEUwMFx1OTUyRVx1NUM1NVx1NUYwMFx1NUJGOVx1NUU5NFx1NURFNVx1NEY1Q1x1NTMzQVx1MzAwMVx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTkzOVx1MzAwMVx1NjI1M1x1NUYwMFx1NUJGOVx1OEJERFx1NUU3Nlx1NkQ4OFx1OTY2NFx1NjcyQVx1OEJGQlxuICBjb25zdCBoYW5kbGVKdW1wVG9BY3RpdmVUYXNrID0gKHNlc3Npb25JZDogc3RyaW5nLCBvd25lcldzPzogV29ya3NwYWNlVmlldykgPT4ge1xuICAgIGlmIChvd25lcldzKSB7XG4gICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMoKHByZXYpID0+IG5ldyBTZXQoWy4uLnByZXYsIG93bmVyV3Mud29ya3NwYWNlSWRdKSlcbiAgICAgIGNvbnN0IG1ldGEgPSBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZShvd25lcldzLnBhdGgpXG4gICAgICBjb25zdCB0YXJnZXRGb2xkZXIgPSBtZXRhLmZvbGRlcnMuZmluZCgoZikgPT4gZi5zZXNzaW9uSWRzLmluY2x1ZGVzKHNlc3Npb25JZCkpXG4gICAgICBpZiAodGFyZ2V0Rm9sZGVyICYmIHRhcmdldEZvbGRlci5jb2xsYXBzZWQpIHtcbiAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLnRvZ2dsZUZvbGRlcihvd25lcldzLnBhdGgsIHRhcmdldEZvbGRlci5pZClcbiAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlT3BlblNlc3Npb24oc2Vzc2lvbklkKVxuICB9XG5cbiAgY29uc3QgZmlsdGVyZWRXb3Jrc3BhY2VzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFzZWFyY2hRdWVyeS50cmltKCkpIHJldHVybiBpdGVtc1xuICAgIGNvbnN0IHEgPSBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIGl0ZW1zLmZpbHRlcigod3MpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoVGl0bGUgPSAod3MudGl0bGUgfHwgJycpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSlcbiAgICAgIGNvbnN0IG1hdGNoU2Vzc2lvbnMgPSAod3Muc2Vzc2lvbklkcyB8fCBbXSkuc29tZSgoc0lkKSA9PiB7XG4gICAgICAgIGNvbnN0IHNpZFN0ciA9IHNJZCBhcyB1bmtub3duIGFzIHN0cmluZ1xuICAgICAgICBpZiAoYXJjaGl2ZWRTZXQuaGFzKHNpZFN0cikpIHJldHVybiBmYWxzZVxuICAgICAgICBjb25zdCB0aXRsZSA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NpZFN0cl0/LnRpdGxlIHx8ICcnXG4gICAgICAgIHJldHVybiB0aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIG1hdGNoVGl0bGUgfHwgbWF0Y2hTZXNzaW9uc1xuICAgIH0pXG4gIH0sIFtpdGVtcywgc2VhcmNoUXVlcnksIHNlc3Npb25zU3RhdGUuYnlJZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIGNvbnN0IGhhbmRsZU9wZW5BZGRXb3Jrc3BhY2UgPSAoKSA9PiB7XG4gICAgc2V0U2hvd1NlYXJjaChmYWxzZSlcbiAgICBzZXRJc0FkZE1vZGFsT3Blbih0cnVlKVxuICB9XG5cbiAgY29uc3QgaGFuZGxlQ29uZmlybUFkZFdvcmtzcGFjZSA9IGFzeW5jICh0YXJnZXRQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0cmltbWVkID0gdGFyZ2V0UGF0aC50cmltKClcbiAgICBpZiAoIXRyaW1tZWQpIHJldHVyblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBwcm9wcy5jcmVhdGVXb3Jrc3BhY2U/Lih7IHBhdGg6IHRyaW1tZWQgfSlcbiAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgY29uc3Qgd3NJZCA9IChyZXMgYXMgYW55KS53b3Jrc3BhY2VJZCB8fCAocmVzIGFzIGFueSkuaWRcbiAgICAgICAgaWYgKHdzSWQpIHtcbiAgICAgICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMoKHByZXYpID0+IG5ldyBTZXQoWy4uLnByZXYsIHdzSWRdKSlcbiAgICAgICAgICBwcm9wcy5zdGFydFNlc3Npb24/Lih3c0lkKVxuICAgICAgICB9XG4gICAgICAgIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKHRyaW1tZWQpXG4gICAgICAgIHNldElzQWRkTW9kYWxPcGVuKGZhbHNlKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBDcmVhdGUgd29ya3NwYWNlIGZhaWxlZDonLCBlcnIpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGhlaWdodDogJzEwMCUnLCBvdmVyZmxvd1k6ICdhdXRvJywgdXNlclNlbGVjdDogJ25vbmUnLCBmb250RmFtaWx5OiAnaW5oZXJpdCcgfX0+XG4gICAgICB7LyogMS4gSGVhZGVyIEJhcjogXHU1REU1XHU0RjVDXHU1MzNBICovfVxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLCBwYWRkaW5nOiAnMTJweCAxNHB4IDZweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJywgZm9udFNpemU6ICcxM3B4JywgZm9udFdlaWdodDogNjAwIH19PlxuICAgICAgICA8c3Bhbj5cdTVERTVcdTRGNUNcdTUzM0E8L3NwYW4+XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fT5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FkZE1vZGFsT3BlbiA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgY29sb3I6IGlzQWRkTW9kYWxPcGVuID8gJyM2MGE1ZmEnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHRpdGxlPVwiXHU2REZCXHU1MkEwL1x1NjVCMFx1NUVGQVx1NURFNVx1NEY1Q1x1NTMzQVwiXG4gICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVPcGVuQWRkV29ya3NwYWNlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxQbHVzSWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzaG93U2VhcmNoID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICBjb2xvcjogc2hvd1NlYXJjaCA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICB0aXRsZT1cIlx1NjQxQ1x1N0QyMlx1NURFNVx1NEY1Q1x1NTMzQVx1NjIxNlx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNob3dTZWFyY2goIXNob3dTZWFyY2gpXG4gICAgICAgICAgICAgIHNldElzQWRkTW9kYWxPcGVuKGZhbHNlKVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U2VhcmNoSWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFx1RDgzQ1x1REYxRiBcdTgxRUFcdTc4MTRcdTUzRUZcdTg5QzZcdTUzMTZcdTkwMDlcdTYyRTlcdTVERTVcdTRGNUNcdTUzM0FcdTc2RUVcdTVGNTVcdTVGMzlcdTdBOTcgKFx1NUI4Q1x1NTE2OFx1NTkwRFx1NTIzQiBEU0ggXHU1MzlGXHU3NTFGXHU0RjUzXHU5QThDXHVGRjBDXHU5NkY2IFNsb3QgXHU1MUIyXHU3QTgxKSAqL31cbiAgICAgIDxEaXJlY3RvcnlCcm93c2VyTW9kYWxcbiAgICAgICAgb3Blbj17aXNBZGRNb2RhbE9wZW59XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldElzQWRkTW9kYWxPcGVuKGZhbHNlKX1cbiAgICAgICAgb25Db25maXJtPXtoYW5kbGVDb25maXJtQWRkV29ya3NwYWNlfVxuICAgICAgLz5cblxuICAgICAgey8qIFx1N0QyN1x1NTFEMVx1NjQxQ1x1N0QyMlx1OEY5M1x1NTE2NVx1Njg0NiAqL31cbiAgICAgIHtzaG93U2VhcmNoICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnB4IDEwcHggNnB4JyB9fT5cbiAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1NjQxQ1x1N0QyMlx1NURFNVx1NEY1Q1x1NTMzQVx1NjIxNlx1NEYxQVx1OEJERC4uLlwiXG4gICAgICAgICAgICB2YWx1ZT17c2VhcmNoUXVlcnl9XG4gICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBcdTdEMjdcdTUxRDFcdTY0MUNcdTdEMjJcdThGOTNcdTUxNjVcdTY4NDYgKi99XG4gICAgICB7c2hvd1NlYXJjaCAmJiAoXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzJweCAxMHB4IDZweCcgfX0+XG4gICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAnMjhweCcsXG4gICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJcdTY0MUNcdTdEMjJcdTVERTVcdTRGNUNcdTUzM0FcdTYyMTZcdTRGMUFcdThCREQuLi5cIlxuICAgICAgICAgICAgdmFsdWU9e3NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTZWFyY2hRdWVyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogMi4gXHU5ODc2XHU5MEU4XHU2RDNCXHU1MkE4L1x1NUY4NVx1OEJGQlx1NEVGQlx1NTJBMSAoXHU1MzU1XHU4ODRDXHU2NzgxXHU3QjgwXHU3Q0JFXHU4MUY0XHU4MEY2XHU1NkNBIDI4cHggXHU5QUQ4XHU1RUE2XHVGRjBDXHU4RkRCXHU4ODRDXHU0RTJEL1x1NUY4NVx1Nzg2RVx1OEJBNC9cdTVGODVcdThCRkIpICovfVxuICAgICAge2Jhbm5lclRhc2tzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcycHggOHB4IDZweCcsIGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAge2Jhbm5lclRhc2tzLm1hcCgodGFzaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29uZiA9IFRBU0tfU1RZTEVfQ09ORklHW3Rhc2suc3RhdHVzXVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17dGFzay5zZXNzaW9uSWR9XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzI4cHgnLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBjb25mLmJnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7Y29uZi5ib3JkZXJ9YCxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2FsbCAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPXtgJHtjb25mLnRpdGxlUHJlZml4fSAoXHU3MEI5XHU1MUZCXHU3NkY0XHU4RkJFJHt0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgPyAnXHU1RTc2XHU2RDg4XHU5NjY0XHU1Rjg1XHU4QkZCJyA6ICcnfVx1RkYwQ1x1NEY0RFx1NEU4RTogJHt0YXNrLndzPy50aXRsZSB8fCAnXHU1RjUzXHU1MjREXHU1REU1XHU0RjVDXHU1MzNBJ30pYH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVKdW1wVG9BY3RpdmVUYXNrKHRhc2suc2Vzc2lvbklkLCB0YXNrLndzKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGNvbmYuaG92ZXJCZ1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gY29uZi5ob3ZlckJvcmRlclxuICAgICAgICAgICAgICAgICAgY29uc3QgY2hldnJvbiA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcudGFzay1jaGV2cm9uJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChjaGV2cm9uKSBjaGV2cm9uLnN0eWxlLmNvbG9yID0gJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZmZmKSdcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gY29uZi5iZ1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gY29uZi5ib3JkZXJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZXZyb24gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnRhc2stY2hldnJvbicpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICAgICAgICAgICAge3Rhc2suc3RhdHVzID09PSAncnVubmluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxSdW5uaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IHRhc2suc3RhdHVzID09PSAncGVuZGluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPENvbXBsZXRlZERvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEycHgnLCBmb250V2VpZ2h0OiA1MDAsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19PlxuICAgICAgICAgICAgICAgICAgICB7dGFzay50aXRsZX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHt0YXNrLndzPy50aXRsZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgb3BhY2l0eTogMC44IH19PlxuICAgICAgICAgICAgICAgICAgICAgIFx1MDBCNyB7dGFzay53cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JywgZmxleFNocmluazogMCB9fT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29uZi50YWdDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBjb25mLnRhZ0JnLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxcHggNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6ICcxM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA1MDAsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtjb25mLnRhZ1RleHR9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0YXNrLWNoZXZyb25cIiBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBwYWRkaW5nTGVmdDogJzJweCcsIHRyYW5zaXRpb246ICdjb2xvciAwLjE1cyBlYXNlJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb24gc2l6ZT17MTF9IC8+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiAzLiBXb3Jrc3BhY2VzIFRyZWUgTGlzdCAqL31cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMnB4JywgcGFkZGluZzogJzAgNnB4JyB9fT5cbiAgICAgICAge2ZpbHRlcmVkV29ya3NwYWNlcy5tYXAoKHdzKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuZGVkV29ya3NwYWNlcy5oYXMod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gXHVEODNDXHVERjFGIFx1OEJGQlx1NTNENlx1NkJDRlx1NEUyQVx1NURFNVx1NEY1Q1x1NTMzQVx1NzJFQ1x1N0FDQlx1NzY4NFx1NTE0M1x1NjU3MFx1NjM2RVx1RkYwOFx1NkMzOFx1NEU0NVx1N0EzM1x1NUI5QVx1NUUzOFx1OUE3Qlx1RkYwOVxuICAgICAgICAgIGNvbnN0IHdzTWV0YSA9IGdsb2JhbFRyZWVTdG9yZS5nZXRNZXRhRm9yV29ya3NwYWNlKHdzLnBhdGgpXG4gICAgICAgICAgY29uc3Qgd3NQaW5uZWRTZXQgPSBuZXcgU2V0KHdzTWV0YS5waW5uZWRTZXNzaW9uSWRzIHx8IFtdKVxuXG4gICAgICAgICAgY29uc3QgcmF3U2Vzc2lvbnMgPSAod3Muc2Vzc2lvbklkcyB8fCBbXSkubWFwKChzSWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpZFN0ciA9IHNJZCBhcyB1bmtub3duIGFzIHN0cmluZ1xuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NpZFN0cl1cbiAgICAgICAgICAgIGNvbnN0IGlzVW5yZWFkID0gQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNpZFN0cikpXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGlkOiBzaWRTdHIsXG4gICAgICAgICAgICAgIHRpdGxlOiBzZXNzaW9uPy50aXRsZSB8fCBzaWRTdHIuc2xpY2UoMCwgMTYpLFxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IHNlc3Npb24/LnVwZGF0ZWRBdCB8fCAwLFxuICAgICAgICAgICAgICBydW5uaW5nOiBCb29sZWFuKHNlc3Npb24/LnJ1bm5pbmcpLFxuICAgICAgICAgICAgICBwZW5kaW5nSW50ZXJhY3Rpb246IHNlc3Npb24/LnBlbmRpbmdJbnRlcmFjdGlvbixcbiAgICAgICAgICAgICAgY29tcGxldGVkOiBpc1VucmVhZCAmJiBzaWRTdHIgIT09IGFjdGl2ZVNlc3Npb25JZCxcbiAgICAgICAgICAgICAgYmxhbms6IEJvb2xlYW4oc2Vzc2lvbj8uYmxhbmspLFxuICAgICAgICAgICAgICBpc1Bpbm5lZDogd3NQaW5uZWRTZXQuaGFzKHNpZFN0ciksXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IHZhbGlkU2Vzc2lvbnMgPSByYXdTZXNzaW9uc1xuICAgICAgICAgICAgLmZpbHRlcigocykgPT4gIWFyY2hpdmVkU2V0LmhhcyhzLmlkKSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFpc0JsYW5rUGxhY2Vob2xkZXIocy5pZCwgcy50aXRsZSwgcy5ibGFuaywgYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkKSlcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhLnJ1bm5pbmcgIT09IGIucnVubmluZykgcmV0dXJuIGEucnVubmluZyA/IC0xIDogMVxuICAgICAgICAgICAgICBpZiAoYS5pc1Bpbm5lZCAhPT0gYi5pc1Bpbm5lZCkgcmV0dXJuIGEuaXNQaW5uZWQgPyAtMSA6IDFcbiAgICAgICAgICAgICAgcmV0dXJuIChiLnVwZGF0ZWRBdCB8fCAwKSAtIChhLnVwZGF0ZWRBdCB8fCAwKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGNhdGVnb3JpemVkU2Vzc2lvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICAgICAgZm9yIChjb25zdCBmIG9mIHdzTWV0YS5mb2xkZXJzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNJZCBvZiBmLnNlc3Npb25JZHMpIGNhdGVnb3JpemVkU2Vzc2lvbklkcy5hZGQoc0lkKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucyA9IHZhbGlkU2Vzc2lvbnMuZmlsdGVyKChzKSA9PiAhY2F0ZWdvcml6ZWRTZXNzaW9uSWRzLmhhcyhzLmlkKSlcbiAgICAgICAgICBjb25zdCBzaG93QWxsID0gc2hvd0FsbFNlc3Npb25zTWFwW3dzLndvcmtzcGFjZUlkXSB8fCBmYWxzZVxuICAgICAgICAgIGNvbnN0IHZpc2libGVVbmNhdGVnb3JpemVkID0gc2hvd0FsbCA/IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucyA6IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucy5zbGljZSgwLCBERUZBVUxUX1ZJU0lCTEVfTElNSVQpXG4gICAgICAgICAgY29uc3QgcmVtYWluaW5nQ291bnQgPSB1bmNhdGVnb3JpemVkU2Vzc2lvbnMubGVuZ3RoIC0gREVGQVVMVF9WSVNJQkxFX0xJTUlUXG5cbiAgICAgICAgICBjb25zdCByZW5kZXJNb3ZlRHJvcGRvd24gPSAoc0lkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCAhPT0gc0lkKSByZXR1cm4gbnVsbFxuICAgICAgICAgICAgY29uc3QgaXNDYXRlZ29yaXplZCA9IGNhdGVnb3JpemVkU2Vzc2lvbklkcy5oYXMoc0lkKVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1jb250YWluZXJcIlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICAgIHRvcDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgICB6SW5kZXg6IDk5OTksXG4gICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzE2MHB4JyxcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctYWxpYXMtYmctbGF5ZXItMiwgIzFlMjkzYiknLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSknLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJzAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjQ1KScsXG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgICAgICAgZ2FwOiAnMnB4JyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBwYWRkaW5nOiAnNHB4IDhweCcsIGZvbnRXZWlnaHQ6IDYwMCwgYm9yZGVyQm90dG9tOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknIH19PlxuICAgICAgICAgICAgICAgICAgXHU3OUZCXHU1MkE4XHU4MUYzXHU3NkVFXHU2ODA3XHU2NTg3XHU0RUY2XHU1OTM5OlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHt3c01ldGEuZm9sZGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICc2cHggOHB4JywgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgXHU2NjgyXHU2NUUwXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU4QkY3XHU1MTQ4XHU1MjFCXHU1RUZBXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgd3NNZXRhLmZvbGRlcnMubWFwKChmKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluVGhpc0ZvbGRlciA9IGYuc2Vzc2lvbklkcy5pbmNsdWRlcyhzSWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtmLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGluVGhpc0ZvbGRlciA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2UyZThmMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpblRoaXNGb2xkZXIgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGluVGhpc0ZvbGRlciA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xMiknIDogJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5tb3ZlU2Vzc2lvbih3cy5wYXRoLCBzSWQsIGYuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb2xkZXJJY29uIHNpemU9ezEzfSBjb2xvcj17Zi5jb2xvciB8fCAnIzYwYTVmYSd9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGZsZXg6IDEgfX0+e2YubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7aW5UaGlzRm9sZGVyICYmIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTBweCcsIGNvbG9yOiAnIzYwYTVmYScgfX0+XHUyNzEzPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgey8qIFx1NTk4Mlx1Njc5Q1x1NURGMlx1N0VDRlx1NTcyOFx1NjdEMFx1NEUyQVx1NjU4N1x1NEVGNlx1NTkzOVx1NTE4NVx1RkYwQ1x1NjYzRVx1NzkzQVx1NzlGQlx1NTFGQVx1OTAwOVx1OTg3OSAqL31cbiAgICAgICAgICAgICAgICB7aXNDYXRlZ29yaXplZCAmJiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjYmQ1ZTEnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclRvcDogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScpfVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5tb3ZlU2Vzc2lvbih3cy5wYXRoLCBzSWQsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPE1vdmVPdXRJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTc5RkJcdTUxRkFcdTgxRjNcdTY3MkFcdTUyMDZcdTdDN0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBrZXk9e3dzLndvcmtzcGFjZUlkfSBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nIH19PlxuICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIFJvdyBJdGVtICovfVxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzM0cHgnLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzRXhwYW5kZWQgPyAndmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDI1NSwyNTUsMjU1LDAuMDYpKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxM3B4JyxcbiAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDUwMCxcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdG9nZ2xlV29ya3NwYWNlKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy53cy1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSBhY3Rpb25zLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy53cy1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zICYmIGFjdGl2ZU1lbnVXc0lkICE9PSB3cy53b3Jrc3BhY2VJZCkgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0SWNvblxuICAgICAgICAgICAgICAgICAgICBzaXplPXsxMn1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogaXNFeHBhbmRlZCA/ICdyb3RhdGUoOTBkZWcpJyA6ICdyb3RhdGUoMGRlZyknLFxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxNX0gY29sb3I9XCIjNjBhNWZhXCIgc3R5bGU9e3sgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAge2VkaXRpbmdXc0lkID09PSB3cy53b3Jrc3BhY2VJZCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0V3NUaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRXc1RpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IGhhbmRsZVNhdmVSZW5hbWVXcyh3cy53b3Jrc3BhY2VJZCl9XG4gICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lV3Mod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcgfX0gdGl0bGU9e3dzLnBhdGh9PlxuICAgICAgICAgICAgICAgICAgICAgIHt3cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBXb3Jrc3BhY2UgQWN0aW9uIEJ1dHRvbnMgKi99XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwid3MtYWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgICBzdHlsZT17eyBkaXNwbGF5OiBhY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyAnaW5saW5lLWZsZXgnIDogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1NzI4XHU1RjUzXHU1MjREXHU1REU1XHU0RjVDXHU1MzNBXHU2NUIwXHU1RUZBXHU1MjA2XHU3QzdCXHU2NTg3XHU0RUY2XHU1OTM5XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNFeHBhbmRlZCkgdG9nZ2xlV29ya3NwYWNlKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8QWRkRm9sZGVySWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcHJvcHMuc3RhcnRTZXNzaW9uPy4od3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8UGx1c0ljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NjZGNFx1NTkxQVx1NjRDRFx1NEY1Q1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZU1lbnVXc0lkKGFjdGl2ZU1lbnVXc0lkID09PSB3cy53b3Jrc3BhY2VJZCA/IG51bGwgOiB3cy53b3Jrc3BhY2VJZCl9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxFbGxpcHNpc0ljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBcdTVGMzlcdTUxRkFcdTgzRENcdTUzNTUgKi99XG4gICAgICAgICAgICAgICAge2FjdGl2ZU1lbnVXc0lkID09PSB3cy53b3Jrc3BhY2VJZCAmJiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIHJlZj17bWVudVJlZn1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICByaWdodDogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgdG9wOiAnMzJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgekluZGV4OiAxMDAsXG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3ZhcigtLWRzdy1zdXJmYWNlLTAsICMxODE4MTgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tZHN3LWJvcmRlci1kZWZhdWx0LCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpKScsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDZweCAyMHB4IHJnYmEoMCwgMCwgMCwgMC40NSknLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAnMTIwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wRmlsdGVyOiAnYmx1cigxMnB4KScsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KSknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nV3NJZCh3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRXc1RpdGxlKHdzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPEVkaXRJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1OTFDRFx1NTQ3RFx1NTQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBnYXA6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCAxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNmODcxNzEnLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjQ4LCAxMTMsIDExMywgMC4xMiknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5kZWxldGVXb3Jrc3BhY2U/Lih3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTN9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHU1MjIwXHU5NjY0XHU1REU1XHU0RjVDXHU1MzNBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBXb3Jrc3BhY2UgQ29udGVudCAoRm9sZGVycyArIFNlc3Npb25zKSAqL31cbiAgICAgICAgICAgICAge2lzRXhwYW5kZWQgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMXB4JywgcGFkZGluZ0xlZnQ6ICcxNHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgIHsvKiBJbmxpbmUgTmV3IEZvbGRlciBJbnB1dCBGb3JtICovfVxuICAgICAgICAgICAgICAgICAge2lzQ3JlYXRpbmdGb2xkZXJXc0lkID09PSB3cy53b3Jrc3BhY2VJZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzRweCA2cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzI2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHU4RjkzXHU1MTY1XHU2NTg3XHU0RUY2XHU1OTM5XHU1NDBEXHU3OUYwIChcdTU2REVcdThGNjZcdTUyMUJcdTVFRkEsIEVTQ1x1NTNENlx1NkQ4OClcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld0ZvbGRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE5ld0ZvbGRlck5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIGhhbmRsZUNyZWF0ZUZvbGRlcih3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0ZvbGRlck5hbWUudHJpbSgpKSBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGhhbmRsZUNyZWF0ZUZvbGRlcih3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBBLiBWaXJ0dWFsIEZvbGRlcnMgKi99XG4gICAgICAgICAgICAgICAgICB7d3NNZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9sZGVyU2Vzc2lvbnMgPSBmb2xkZXIuc2Vzc2lvbklkc1xuICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHNJZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NJZCBhcyB1bmtub3duIGFzIHN0cmluZ11cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5yZWFkID0gQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNJZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogc0lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogc2Vzc2lvbj8udGl0bGUgfHwgc0lkLnNsaWNlKDAsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBzZXNzaW9uPy51cGRhdGVkQXQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZzogQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVuZGluZ0ludGVyYWN0aW9uOiBzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogaXNVbnJlYWQgJiYgc0lkICE9PSBhY3RpdmVTZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJsYW5rOiBCb29sZWFuKHNlc3Npb24/LmJsYW5rKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNQaW5uZWQ6IHdzUGlubmVkU2V0LmhhcyhzSWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigocykgPT4gIWFyY2hpdmVkU2V0LmhhcyhzLmlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEucnVubmluZyAhPT0gYi5ydW5uaW5nKSByZXR1cm4gYS5ydW5uaW5nID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc1Bpbm5lZCAhPT0gYi5pc1Bpbm5lZCkgcmV0dXJuIGEuaXNQaW5uZWQgPyAtMSA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoYi51cGRhdGVkQXQgfHwgMCkgLSAoYS51cGRhdGVkQXQgfHwgMClcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2ZvbGRlci5pZH0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBGb2xkZXIgSGVhZGVyIFJvdyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2UyZThmMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZvbGRlci1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuZm9sZGVyLWFjdGlvbnMnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSBhY3Rpb25zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0SWNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT17MTB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGZvbGRlci5jb2xsYXBzZWQgPyAncm90YXRlKDBkZWcpJyA6ICdyb3RhdGUoOTBkZWcpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ3RyYW5zZm9ybSAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxNH0gY29sb3I9e2ZvbGRlci5jb2xvciB8fCAnIzYwYTVmYSd9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ0ZvbGRlcklkID09PSBmb2xkZXIuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0Rm9sZGVyTmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0Rm9sZGVyTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0Rm9sZGVyTmFtZS50cmltKCkpIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5yZW5hbWVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkLCBlZGl0Rm9sZGVyTmFtZS50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0Rm9sZGVyTmFtZS50cmltKCkpIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5yZW5hbWVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkLCBlZGl0Rm9sZGVyTmFtZS50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nRm9sZGVySWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBmb250V2VpZ2h0OiA1MDAgfX0gb25Eb3VibGVDbGljaz17KCkgPT4geyBzZXRFZGl0aW5nRm9sZGVySWQoZm9sZGVyLmlkKTsgc2V0RWRpdEZvbGRlck5hbWUoZm9sZGVyLm5hbWUpIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Zm9sZGVyLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknIH19Pih7Zm9sZGVyU2Vzc2lvbnMubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBcdUQ4M0NcdURGMUYgXHU2NTg3XHU0RUY2XHU1OTM5XHU2NENEXHU0RjVDXHU2ODBGXHVGRjFBXHU1MzA1XHU1NDJCIFsrXSBcdTU3MjhcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMEJcdTc2RjRcdTYzQTVcdTY1QjBcdTVFRkFcdTRGMUFcdThCREQgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9sZGVyLWFjdGlvbnNcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19IG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTU3MjhcdTZCNjRcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMEJcdTY1QjBcdTVFRkFcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlQ3JlYXRlU2Vzc2lvbkluRm9sZGVyKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoLCBmb2xkZXIuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQbHVzSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTY1ODdcdTRFRjZcdTU5MzlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRFZGl0aW5nRm9sZGVySWQoZm9sZGVyLmlkKTsgc2V0RWRpdEZvbGRlck5hbWUoZm9sZGVyLm5hbWUpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXRJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTkzOSAoXHU1MTg1XHU5MEU4XHU0RjFBXHU4QkREXHU4RkQ0XHU1NkRFXHU2NzJBXHU1MjA2XHU3QzdCKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBnbG9iYWxUcmVlU3RvcmUuZGVsZXRlRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIEZvbGRlciBJbnRlcm5hbCBTZXNzaW9ucyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIHshZm9sZGVyLmNvbGxhcHNlZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYXA6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQ6ICcxNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZvbGRlclNlc3Npb25zLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmVTZXNzaW9uSWQgPT09IHMuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbFRpbWUgPSBmb3JtYXRSZWxhdGl2ZVRpbWUocy51cGRhdGVkQXQpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3MuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtYnVzaW5lc3MtcHJpbWFyeSwgIzkzYzVmZCknIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjY2JkNWUxKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaXNBY3RpdmUgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2JhY2tncm91bmQgMC4xMnMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVPcGVuU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRvdWJsZUNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtKSB0bS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3QgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtYWN0JykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRtID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLXRpbWUnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEsIHBvaW50ZXJFdmVudHM6IGVkaXRpbmdTZXNzaW9uSWQgPT09IHMuaWQgPyAnYXV0bycgOiAnbm9uZScgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLnBlbmRpbmdJbnRlcmFjdGlvbiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBlbmRpbmdEb3QgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmNvbXBsZXRlZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENvbXBsZXRlZERvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmlzUGlubmVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXt0cnVlfSBzdHlsZT17eyBjb2xvcjogJyNmYmJmMjQnLCBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hhdEljb24gc2l6ZT17MTN9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAsIG9wYWNpdHk6IDAuNiB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgPT09IHMuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdFNlc3Npb25UaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRTZXNzaW9uVGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4gaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtzLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1Nlc3Npb25JZCAhPT0gcy5pZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzZXNzLXRpbWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHMucnVubmluZyA/ICcjNjBhNWZhJyA6IHMuY29tcGxldGVkID8gJyM0YWRlODAnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IHMuY29tcGxldGVkID8gNTAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnJ1bm5pbmcgPyAnXHU3NTFGXHU2MjEwXHU0RTJEJyA6IHMuY29tcGxldGVkID8gJ1x1NURGMlx1NUI4Q1x1NjIxMCcgOiByZWxUaW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU0RjFBXHU4QkREXHU2MEFDXHU1MDVDXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXHU3RUM0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2Vzcy1hY3RcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6IHMuaXNQaW5uZWQgPyAnI2ZiYmYyNCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy5pc1Bpbm5lZCA/ICdcdTUzRDZcdTZEODhcdTdGNkVcdTk4NzYnIDogJ1x1N0Y2RVx1OTg3Nlx1NEYxQVx1OEJERCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVQaW5TZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3MuaXNQaW5uZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1OTFDRFx1NTQ3RFx1NTQwRFx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjA2XHU1M0M5XHU0RjFBXHU4QkREIChGb3JrKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmZvcmtTZXNzaW9uPy4ocy5pZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvcmtJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU3OUZCXHU1MkE4XHU4MUYzXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2MkM5XHU4M0RDXHU1MzU1XHU2MzA5XHU5NEFFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZGlzcGxheTogJ2lubGluZS1mbGV4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU3OUZCXHU1MkE4XHU0RjFBXHU4QkREXHU4MUYzXHU1MTc2XHU0RUQ2XHU2NTg3XHU0RUY2XHU1OTM5XHU2MjE2XHU2NzJBXHU1MjA2XHU3QzdCLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQoYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyBudWxsIDogcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPE1vdmVUb0ZvbGRlckljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVuZGVyTW92ZURyb3Bkb3duKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMjBcdTk2NjRcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVEZWxldGVTZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBCLiBVbmNhdGVnb3JpemVkIFNlc3Npb25zIChTb3J0ZWQgYnkgdGltZSArIFBpbm5lZCBGaXJzdCArIDEwIExpbWl0KSAqL31cbiAgICAgICAgICAgICAgICAgIHt2aXNpYmxlVW5jYXRlZ29yaXplZC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmVTZXNzaW9uSWQgPT09IHMuaWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsVGltZSA9IGZvcm1hdFJlbGF0aXZlVGltZShzLnVwZGF0ZWRBdClcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjOTNjNWZkKScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNjYmQ1ZTEpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaXNBY3RpdmUgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdiYWNrZ3JvdW5kIDAuMTJzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZU9wZW5TZXNzaW9uKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRTZXNzaW9uVGl0bGUocy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRtID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLXRpbWUnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0KSBhY3Quc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSdW5uaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBlbmRpbmdEb3QgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IHMuY29tcGxldGVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmlzUGlubmVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3RydWV9IHN0eWxlPXt7IGNvbG9yOiAnI2ZiYmYyNCcsIGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hhdEljb24gc2l6ZT17MTN9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAsIG9wYWNpdHk6IDAuNiB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRTZXNzaW9uVGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInNlc3MtdGltZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogcy5ydW5uaW5nID8gJyM2MGE1ZmEnIDogcy5jb21wbGV0ZWQgPyAnIzRhZGU4MCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnJ1bm5pbmcgPyAnXHU3NTFGXHU2MjEwXHU0RTJEJyA6IHMuY29tcGxldGVkID8gJ1x1NURGMlx1NUI4Q1x1NjIxMCcgOiByZWxUaW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU0RjFBXHU4QkREXHU2MEFDXHU1MDVDXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXHU3RUM0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZXNzLWFjdFwiIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6IHMuaXNQaW5uZWQgPyAnI2ZiYmYyNCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtzLmlzUGlubmVkID8gJ1x1NTNENlx1NkQ4OFx1N0Y2RVx1OTg3NicgOiAnXHU3RjZFXHU5ODc2XHU0RjFBXHU4QkREJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnRvZ2dsZVBpblNlc3Npb24od3MucGF0aCwgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17cy5pc1Bpbm5lZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMDZcdTUzQzlcdTRGMUFcdThCREQgKEZvcmspXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZm9ya1Nlc3Npb24/LihzLmlkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ya0ljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU3OUZCXHU1MkE4XHU4MUYzXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2MkM5XHU4M0RDXHU1MzU1XHU2MzA5XHU5NEFFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAncmVsYXRpdmUnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOS4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZW5kZXJNb3ZlRHJvcGRvd24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAnI2Y4NzE3MScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICAgICAgey8qIFx1NUM1NVx1NUYwMFx1NTE3Nlx1NEY1OSBOIFx1NEUyQVx1NEYxQVx1OEJERCAqL31cbiAgICAgICAgICAgICAgICAgIHshc2hvd0FsbCAmJiByZW1haW5pbmdDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmNvbG9yID0gJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QWxsU2Vzc2lvbnNNYXAoKHByZXYpID0+ICh7IC4uLnByZXYsIFt3cy53b3Jrc3BhY2VJZF06IHRydWUgfSkpfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgXHU1QzU1XHU1RjAwXHU1MTc2XHU0RjU5IHtyZW1haW5pbmdDb3VudH0gXHU0RTJBXHU0RjFBXHU4QkREXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIClcbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuIiwgIi8qKlxuICogQ2xpZW50IEFQSSBicmlkZ2UgZm9yIGRzaC13b3Jrc3BhY2UtdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN1YnByb2plY3RJbmZvLCBXb3Jrc3BhY2VUcmVlTWV0YSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcblxuZXhwb3J0IGNvbnN0IFJPVVRFX1BSRUZJWCA9ICcvYXBpL2RzaC13b3Jrc3BhY2UtdHJlZSdcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoVHJlZU1ldGEod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTxXb3Jrc3BhY2VUcmVlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L21ldGE/d29ya3NwYWNlUm9vdD0ke2VuY29kZVVSSUNvbXBvbmVudCh3b3Jrc3BhY2VSb290KX1gKVxuICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBtZXRhOiBXb3Jrc3BhY2VUcmVlTWV0YSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24ubWV0YSA6IG51bGxcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gZmV0Y2ggbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVRyZWVNZXRhKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEpOiBQcm9taXNlPFdvcmtzcGFjZVRyZWVNZXRhIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vbWV0YWAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHdvcmtzcGFjZVJvb3QsIG1ldGEgfSksXG4gICAgfSlcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEgfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLm1ldGEgOiBudWxsXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRmFpbGVkIHRvIHNhdmUgbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhblN1YnByb2plY3RzKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8U3VicHJvamVjdEluZm9bXT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vc2Nhbj93b3Jrc3BhY2VSb290PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdvcmtzcGFjZVJvb3QpfWApXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBbXVxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBzdWJwcm9qZWN0czogU3VicHJvamVjdEluZm9bXSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24uc3VicHJvamVjdHMgOiBbXVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIEZhaWxlZCB0byBzY2FuIHN1YnByb2plY3RzOicsIGVycilcbiAgICByZXR1cm4gW11cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdG9yeUxpc3RSZXN1bHQge1xuICBjdXJyZW50UGF0aDogc3RyaW5nXG4gIHBhcmVudFBhdGg6IHN0cmluZyB8IG51bGxcbiAgaG9tZVBhdGg6IHN0cmluZ1xuICBkaXJlY3RvcmllczogQXJyYXk8eyBuYW1lOiBzdHJpbmc7IHBhdGg6IHN0cmluZyB9PlxuICBlcnJvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hEaXJlY3RvcnlMaXN0KGRpclBhdGg/OiBzdHJpbmcsIHNob3dIaWRkZW4/OiBib29sZWFuKTogUHJvbWlzZTxEaXJlY3RvcnlMaXN0UmVzdWx0PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcygpXG4gICAgaWYgKGRpclBhdGgpIHBhcmFtcy5zZXQoJ3BhdGgnLCBkaXJQYXRoKVxuICAgIGlmIChzaG93SGlkZGVuKSBwYXJhbXMuc2V0KCdzaG93SGlkZGVuJywgJ3RydWUnKVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vZnMtbGlzdD8ke3BhcmFtcy50b1N0cmluZygpfWApXG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9YClcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbiB9ICYgRGlyZWN0b3J5TGlzdFJlc3VsdFxuICAgIHJldHVybiBqc29uXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gZmV0Y2ggZnMtbGlzdDonLCBlcnIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnRQYXRoOiBkaXJQYXRoIHx8ICcvJyxcbiAgICAgIHBhcmVudFBhdGg6IG51bGwsXG4gICAgICBob21lUGF0aDogJy8nLFxuICAgICAgZGlyZWN0b3JpZXM6IFtdLFxuICAgICAgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCAnXHU4QkZCXHU1M0Q2XHU3NkVFXHU1RjU1XHU1OTMxXHU4RDI1JyxcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUZzRGlyZWN0b3J5KHBhcmVudFBhdGg6IHN0cmluZywgbmFtZTogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IHBhdGg/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L2ZzLW1rZGlyYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGFyZW50UGF0aCwgbmFtZSB9KSxcbiAgICB9KVxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBwYXRoPzogc3RyaW5nOyBlcnJvcj86IHN0cmluZyB9XG4gICAgcmV0dXJuIGpzb25cbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCAnXHU1MjFCXHU1RUZBXHU2NTg3XHU0RUY2XHU1OTM5XHU1OTMxXHU4RDI1JyB9XG4gIH1cbn1cbiIsICIvKipcbiAqIE11bHRpLVdvcmtzcGFjZSBSZWFjdGl2ZSBUcmVlU3RvcmUgZm9yIG1hbmFnaW5nIHZpcnR1YWwgZm9sZGVycywgc3VicHJvamVjdHMsXG4gKiBhbmQgc2Vzc2lvbiBwbGFjZW1lbnRzIGFjcm9zcyBhbGwgd29ya3NwYWNlcyBjb25jdXJyZW50bHkuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBWaXJ0dWFsRm9sZGVyLCBXb3Jrc3BhY2VUcmVlTWV0YSwgU3VicHJvamVjdEluZm8gfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMudHMnXG5pbXBvcnQgeyBmZXRjaFRyZWVNZXRhLCBzYXZlVHJlZU1ldGEsIHNjYW5TdWJwcm9qZWN0cyB9IGZyb20gJy4vYXBpLnRzJ1xuXG5leHBvcnQgdHlwZSBMaXN0ZW5lciA9ICgpID0+IHZvaWRcblxuY29uc3QgREVGQVVMVF9NRVRBID0gKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFdvcmtzcGFjZVRyZWVNZXRhID0+ICh7XG4gIHZlcnNpb246IDEsXG4gIGluYm94U2Vzc2lvbklkczogW10sXG4gIHBpbm5lZFNlc3Npb25JZHM6IFtdLFxuICBmb2xkZXJzOiBbXSxcbiAgc3VicHJvamVjdHM6IFtdLFxuICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG59KVxuXG5leHBvcnQgY2xhc3MgVHJlZVN0b3JlIHtcbiAgcHJpdmF0ZSBjYWNoZTogTWFwPHN0cmluZywgV29ya3NwYWNlVHJlZU1ldGE+ID0gbmV3IE1hcCgpXG4gIHByaXZhdGUgbGlzdGVuZXJzOiBTZXQ8TGlzdGVuZXI+ID0gbmV3IFNldCgpXG4gIHByaXZhdGUgaXNTYXZpbmdNYXA6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0gbmV3IE1hcCgpXG4gIHByaXZhdGUgdmVyc2lvbiA9IDBcblxuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgZ2V0VmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnZlcnNpb25cbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcilcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG5vdGlmeSgpOiB2b2lkIHtcbiAgICB0aGlzLnZlcnNpb24rK1xuICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVyKClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1ldGFkYXRhIGZvciBhIHNwZWNpZmljIHdvcmtzcGFjZSBwYXRoLlxuICAgKi9cbiAgZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBXb3Jrc3BhY2VUcmVlTWV0YSB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290KSByZXR1cm4gREVGQVVMVF9NRVRBKCcnKVxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jYWNoZS5nZXQod29ya3NwYWNlUm9vdClcbiAgICBpZiAoZXhpc3RpbmcpIHJldHVybiBleGlzdGluZ1xuXG4gICAgY29uc3QgZnJlc2ggPSBERUZBVUxUX01FVEEod29ya3NwYWNlUm9vdClcbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCBmcmVzaClcbiAgICAvLyBBc3luYyBsb2FkIGluIGJhY2tncm91bmRcbiAgICB0aGlzLmxvYWRXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICByZXR1cm4gZnJlc2hcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIG1ldGFkYXRhIGZyb20gYmFja2VuZCBmb3IgYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBsb2FkV29ya3NwYWNlKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghd29ya3NwYWNlUm9vdCkgcmV0dXJuXG4gICAgY29uc3QgbG9hZGVkID0gYXdhaXQgZmV0Y2hUcmVlTWV0YSh3b3Jrc3BhY2VSb290KVxuICAgIGlmIChsb2FkZWQpIHtcbiAgICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHtcbiAgICAgICAgLi4ubG9hZGVkLFxuICAgICAgICBwaW5uZWRTZXNzaW9uSWRzOiBBcnJheS5pc0FycmF5KGxvYWRlZC5waW5uZWRTZXNzaW9uSWRzKSA/IGxvYWRlZC5waW5uZWRTZXNzaW9uSWRzIDogW10sXG4gICAgICB9KVxuICAgICAgdGhpcy5ub3RpZnkoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgZm9sZGVyIHVuZGVyIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbmFtZTogc3RyaW5nLCBjb2xvcjogc3RyaW5nID0gJyM2MGE1ZmEnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpIHx8ICdcdTY1QjBcdTVFRkFcdTY1ODdcdTRFRjZcdTU5MzknXG4gICAgY29uc3QgaWQgPSBgZi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YFxuICAgIGNvbnN0IG5ld0ZvbGRlcjogVmlydHVhbEZvbGRlciA9IHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogdHJpbW1lZCxcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICBjb2xvcixcbiAgICAgIHNlc3Npb25JZHM6IFtdLFxuICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IFsuLi5tZXRhLmZvbGRlcnMsIG5ld0ZvbGRlcl0sXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gICAgcmV0dXJuIGlkXG4gIH1cblxuICAvKipcbiAgICogUmVuYW1lIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgcmVuYW1lRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHRyaW1tZWQgPSBuYW1lLnRyaW0oKVxuICAgIGlmICghdHJpbW1lZCkgcmV0dXJuXG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIG5hbWU6IHRyaW1tZWQgfSA6IGYpKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBkZWxldGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5maWx0ZXIoKGYpID0+IGYuaWQgIT09IGZvbGRlcklkKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgY29sbGFwc2Ugc3RhdHVzIG9mIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgdG9nZ2xlRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIGNvbGxhcHNlZDogIWYuY29sbGFwc2VkIH0gOiBmKSksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbG9yIGZvciBhIGZvbGRlciBpbiBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIHNldEZvbGRlckNvbG9yKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgY29sb3I6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIGNvbG9yIH0gOiBmKSksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogTW92ZSBhIHNlc3Npb24gaW50byBhIHNwZWNpZmljIGZvbGRlciBvciB0byB1bmNhdGVnb3JpemVkICh0YXJnZXRGb2xkZXJJZCA9IG51bGwpLlxuICAgKi9cbiAgYXN5bmMgbW92ZVNlc3Npb24od29ya3NwYWNlUm9vdDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZywgdGFyZ2V0Rm9sZGVySWQ6IHN0cmluZyB8IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZEZvbGRlcnMgPSBtZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+IHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gZm9sZGVyLnNlc3Npb25JZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZClcbiAgICAgIGlmICh0YXJnZXRGb2xkZXJJZCAhPT0gbnVsbCAmJiBmb2xkZXIuaWQgPT09IHRhcmdldEZvbGRlcklkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZm9sZGVyLFxuICAgICAgICAgIGNvbGxhcHNlZDogZmFsc2UsIC8vIFx1RDgzQ1x1REYxRiBcdTc5RkJcdTUxNjVcdTYyMTZcdTY1QjBcdTVFRkFcdTY1RjZcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMENcdTRGMUFcdThCRERcdTdBQ0JcdTUzNzNcdTUzRUZcdTg5QzFcbiAgICAgICAgICBzZXNzaW9uSWRzOiBbc2Vzc2lvbklkLCAuLi5maWx0ZXJlZF0sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmZvbGRlcixcbiAgICAgICAgc2Vzc2lvbklkczogZmlsdGVyZWQsXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IHVwZGF0ZWRGb2xkZXJzLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ld2x5IGNyZWF0ZWQgc2Vzc2lvbiBkaXJlY3RseSBpbnRvIGEgZm9sZGVyLlxuICAgKi9cbiAgYXN5bmMgYWRkU2Vzc2lvblRvRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLm1vdmVTZXNzaW9uKHdvcmtzcGFjZVJvb3QsIHNlc3Npb25JZCwgZm9sZGVySWQpXG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHBpbm5lZCBzdGF0dXMgb2YgYSBzZXNzaW9uIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgdG9nZ2xlUGluU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IGN1cnJlbnRQaW5uZWQgPSBuZXcgU2V0KG1ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSlcbiAgICBpZiAoY3VycmVudFBpbm5lZC5oYXMoc2Vzc2lvbklkKSkge1xuICAgICAgY3VycmVudFBpbm5lZC5kZWxldGUoc2Vzc2lvbklkKVxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50UGlubmVkLmFkZChzZXNzaW9uSWQpXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgcGlubmVkU2Vzc2lvbklkczogQXJyYXkuZnJvbShjdXJyZW50UGlubmVkKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZWx5IHJlbW92ZSBhIGRlbGV0ZWQgc2Vzc2lvbiBmcm9tIGFsbCBmb2xkZXJzIGFuZCBwaW5uZWQgbGlzdCBpbiBhIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIHB1cmdlU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWRGb2xkZXJzID0gbWV0YS5mb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiAoe1xuICAgICAgLi4uZm9sZGVyLFxuICAgICAgc2Vzc2lvbklkczogZm9sZGVyLnNlc3Npb25JZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZCksXG4gICAgfSkpXG4gICAgY29uc3QgdXBkYXRlZFBpbm5lZCA9IChtZXRhLnBpbm5lZFNlc3Npb25JZHMgfHwgW10pLmZpbHRlcigoaWQpID0+IGlkICE9PSBzZXNzaW9uSWQpXG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiB1cGRhdGVkRm9sZGVycyxcbiAgICAgIHBpbm5lZFNlc3Npb25JZHM6IHVwZGF0ZWRQaW5uZWQsXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcnNpc3Qod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290IHx8IHRoaXMuaXNTYXZpbmdNYXAuZ2V0KHdvcmtzcGFjZVJvb3QpKSByZXR1cm5cbiAgICB0aGlzLmlzU2F2aW5nTWFwLnNldCh3b3Jrc3BhY2VSb290LCB0cnVlKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgICBhd2FpdCBzYXZlVHJlZU1ldGEod29ya3NwYWNlUm9vdCwgbWV0YSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5pc1NhdmluZ01hcC5zZXQod29ya3NwYWNlUm9vdCwgZmFsc2UpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBnbG9iYWxUcmVlU3RvcmUgPSBuZXcgVHJlZVN0b3JlKClcbiIsICIvKipcbiAqIEZvcm1hdCB0aW1lc3RhbXAgaW50byBjb25jaXNlIHJlbGF0aXZlIHRpbWUgbWF0Y2hpbmcgRFNIIHN0eWxlIChcIlx1NTIxQVx1NTIxQVwiLCBcIjVcdTUyMDZcdTk0OUZcIiwgXCIxNlx1NUMwRlx1NjVGNlwiLCBcIlx1NjYyOFx1NTkyOVwiLCBcIjNcdTU5MjlcdTUyNERcIikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSZWxhdGl2ZVRpbWUodGltZXN0YW1wPzogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKCF0aW1lc3RhbXAgfHwgdHlwZW9mIHRpbWVzdGFtcCAhPT0gJ251bWJlcicpIHJldHVybiAnJ1xuICBjb25zdCBkaWZmID0gRGF0ZS5ub3coKSAtIHRpbWVzdGFtcFxuICBpZiAoZGlmZiA8IDApIHJldHVybiAnXHU1MjFBXHU1MjFBJ1xuXG4gIGNvbnN0IHNlYyA9IE1hdGguZmxvb3IoZGlmZiAvIDEwMDApXG4gIGlmIChzZWMgPCA2MCkgcmV0dXJuICdcdTUyMUFcdTUyMUEnXG5cbiAgY29uc3QgbWluID0gTWF0aC5mbG9vcihzZWMgLyA2MClcbiAgaWYgKG1pbiA8IDYwKSByZXR1cm4gYCR7bWlufVx1NTIwNlx1OTQ5RmBcblxuICBjb25zdCBob3VycyA9IE1hdGguZmxvb3IobWluIC8gNjApXG4gIGlmIChob3VycyA8IDI0KSByZXR1cm4gYCR7aG91cnN9XHU1QzBGXHU2NUY2YFxuXG4gIGNvbnN0IGRheXMgPSBNYXRoLmZsb29yKGhvdXJzIC8gMjQpXG4gIGlmIChkYXlzID09PSAxKSByZXR1cm4gJ1x1NjYyOFx1NTkyOSdcbiAgaWYgKGRheXMgPCAzMCkgcmV0dXJuIGAke2RheXN9XHU1OTI5XHU1MjREYFxuXG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApXG4gIHJldHVybiBgJHtkLmdldE1vbnRoKCkgKyAxfS8ke2QuZ2V0RGF0ZSgpfWBcbn1cbiIsICJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBjb25zdCBDaGV2cm9uUmlnaHRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IGNsYXNzTmFtZT86IHN0cmluZzsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNNiAzLjVMMTAuNSA4TDYgMTIuNVwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRm9sZGVySWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBjb2xvcj86IHN0cmluZzsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE1LFxuICBjb2xvcixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXt7IGNvbG9yOiBjb2xvciB8fCAnY3VycmVudENvbG9yJywgLi4uc3R5bGUgfX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTIgNC4yNUMyIDMuNTU5NjQgMi41NTk2NCAzIDMuMjUgM0g2LjA4NTc5QzYuNDE3MzIgMyA2LjczNTI4IDMuMTMxNyA2Ljk2OTY3IDMuMzY2MTJMOC4xMzM4OCA0LjUzMDMzQzguMzY4MjcgNC43NjQ3NSA4LjY4NjIzIDQuODk2NDUgOS4wMTc3NyA0Ljg5NjQ1SDEyLjc1QzEzLjQ0MDQgNC44OTY0NSAxNCA1LjQ1NjA5IDE0IDYuMTQ2NDVWMTEuNzVDMTQgMTIuNDQwNCAxMy40NDA0IDEzIDEyLjc1IDEzSDMuMjVDMi41NTk2NCAxMyAyIDEyLjQ0MDQgMiAxMS43NVY0LjI1WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjI1XCJcbiAgICAgIGZpbGw9e2NvbG9yID8gYCR7Y29sb3J9MjJgIDogJ2N1cnJlbnRDb2xvcid9XG4gICAgICBmaWxsT3BhY2l0eT17Y29sb3IgPyAwLjIgOiAwLjF9XG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IENoYXRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTMgNEMzIDMuNDQ3NzIgMy40NDc3MiAzIDQgM0gxMkMxMi41NTIzIDMgMTMgMy40NDc3MiAxMyA0VjEwQzEzIDEwLjU1MjMgMTIuNTUyMyAxMSAxMiAxMUg1LjVMMyAxMy41VjRaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgUGx1c0ljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNOCAzLjVWMTIuNU0zLjUgOEgxMi41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCI3XCIgY3k9XCI3XCIgcj1cIjQuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4zXCIgLz5cbiAgICA8cGF0aCBkPVwiTTEwLjUgMTAuNUwxMy41IDEzLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuM1wiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRWxsaXBzaXNJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCIzLjVcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjhcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjEyLjVcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRWRpdEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMTEuNSAyLjVMMTMuNSA0LjVMNSAxM0gzVjExTDExLjUgMi41WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjNcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgVHJhc2hJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTMuNSA0LjVIMTIuNU02IDQuNVYzQzYgMi40NDc3MiA2LjQ0NzcyIDIgNyAySDlDOS41NTIyOCAyIDEwIDIuNDQ3NzIgMTAgM1Y0LjVNNC41IDQuNVYxM0M0LjUgMTMuNTUyMyA0Ljk0NzcyIDE0IDUuNSAxNEgxMC41QzExLjA1MjMgMTQgMTEuNSAxMy41NTIzIDExLjUgMTNWNC41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuM1wiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBGb3JrSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8Y2lyY2xlIGN4PVwiNC41XCIgY3k9XCIxMS41XCIgcj1cIjEuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiNC41XCIgY3k9XCI0LjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxjaXJjbGUgY3g9XCIxMS41XCIgY3k9XCI0LjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxwYXRoIGQ9XCJNNC41IDZWMTBNMTEuNSA2VjcuNUMxMS41IDguNiAxMC42IDkuNSA5LjUgOS41SDQuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4yXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBNb3ZlVG9Gb2xkZXJJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTIgNC4yNUMyIDMuNTU5NjQgMi41NTk2NCAzIDMuMjUgM0g2LjA4NTc5QzYuNDE3MzIgMyA2LjczNTI4IDMuMTMxNyA2Ljk2OTY3IDMuMzY2MTJMOC4xMzM4OCA0LjUzMDMzQzguMzY4MjcgNC43NjQ3NSA4LjY4NjIzIDQuODk2NDUgOS4wMTc3NyA0Ljg5NjQ1SDEyLjc1QzEzLjQ0MDQgNC44OTY0NSAxNCA1LjQ1NjA5IDE0IDYuMTQ2NDVWMTEuNzVDMTQgMTIuNDQwNCAxMy40NDA0IDEzIDEyLjc1IDEzSDMuMjVDMi41NTk2NCAxMyAyIDEyLjQ0MDQgMiAxMS43NVY0LjI1WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjJcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDguNUgxME04IDYuNUwxMCA4LjVMOCAxMC41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMlwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBNb3ZlT3V0SWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDMuNUgzLjVWMTIuNUgxMi41VjEwTTguNSAyLjVIMTMuNVY3LjVNNyA5TDEzIDNcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4zXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEFkZEZvbGRlckljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVY4LjVNMiA0LjI1VjExLjc1QzIgMTIuNDQwNCAyLjU1OTY0IDEzIDMuMjUgMTNIOE0xMS41IDEwLjVWMTQuNU05LjUgMTIuNUgxMy41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgUGluSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBwaW5uZWQ/OiBib29sZWFuOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTMsXG4gIHBpbm5lZCA9IGZhbHNlLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNOS41IDNMMTMgNi41TTYgNi41TDMuNSA5TDQgMTJMMiAxNEw0IDEyTDcgMTIuNUw5LjUgMTBNNiA2LjVMOS41IDNNNiA2LjVMOS41IDEwXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgZmlsbD17cGlubmVkID8gJ2N1cnJlbnRDb2xvcicgOiAnbm9uZSd9XG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBDbG9zZUljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNNCA0TDEyIDEyTTEyIDRMNCAxMlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgSG9tZUljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMi41IDYuNUw4IDJMMTMuNSA2LjVWMTMuNUMxMy41IDEzLjc3NjEgMTMuMjc2MSAxNCAxMyAxNEg5LjVWOS41SDYuNVYxNEgzQzIuNzIzODYgMTQgMi41IDEzLjc3NjEgMi41IDEzLjVWNi41WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjI1XCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEFycm93VXBJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTggMTIuNVYzLjVNNCA3LjVMOCAzLjVMMTIgNy41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuIiwgImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcblxuLyoqXG4gKiBBbmltYXRlZCBQdWxzZSBJbmRpY2F0b3IgZm9yIHJ1bm5pbmcvc3RyZWFtaW5nIHNlc3Npb25zIG1hdGNoaW5nIERTSCBkZXNpZ24uXG4gKi9cbmV4cG9ydCBjb25zdCBSdW5uaW5nRG90OiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7IHNpemUgPSAxNCwgc3R5bGUgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzcGFuXG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICB3aWR0aDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAuLi5zdHlsZSxcbiAgICAgIH19XG4gICAgICB0aXRsZT1cIlx1NkI2M1x1NTcyOFx1NUJGOVx1OEJERFx1NEUwRVx1NzUxRlx1NjIxMFx1NEUyRC4uLlwiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjQpJyxcbiAgICAgICAgICBhbmltYXRpb246ICdkc2gtcHVsc2UgMS41cyBjdWJpYy1iZXppZXIoMC4yNCwgMCwgMC4zOCwgMSkgaW5maW5pdGUnLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtYnVzaW5lc3MtcHJpbWFyeSwgIzYwYTVmYSknLFxuICAgICAgICAgIGJveFNoYWRvdzogJzAgMCA2cHggcmdiYSg5NiwgMTY1LCAyNTAsIDAuOCknLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzdHlsZT57YFxuICAgICAgICBAa2V5ZnJhbWVzIGRzaC1wdWxzZSB7XG4gICAgICAgICAgMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7IG9wYWNpdHk6IDAuODsgfVxuICAgICAgICAgIDUwJSB7IHRyYW5zZm9ybTogc2NhbGUoMS42KTsgb3BhY2l0eTogMDsgfVxuICAgICAgICAgIDEwMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgfVxuICAgICAgYH08L3N0eWxlPlxuICAgIDwvc3Bhbj5cbiAgKVxufVxuXG4vKipcbiAqIEFtYmVyIERvdCBmb3Igc2Vzc2lvbnMgd2FpdGluZyBvbiB1c2VyIGludGVyYWN0aW9uIChxdWVzdGlvbnMvYXBwcm92YWxzKS5cbiAqL1xuZXhwb3J0IGNvbnN0IFBlbmRpbmdEb3Q6IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHsgc2l6ZSA9IDE0LCBzdHlsZSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPHNwYW5cbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIHdpZHRoOiBgJHtzaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgIC4uLnN0eWxlLFxuICAgICAgfX1cbiAgICAgIHRpdGxlPVwiXHU3QjQ5XHU1Rjg1XHU0RUE0XHU0RTkyIChcdTVCQTFcdTYyNzkvXHU3ODZFXHU4QkE0KVwiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJyNmYmJmMjQnLFxuICAgICAgICAgIGJveFNoYWRvdzogJzAgMCA2cHggcmdiYSgyNTEsIDE5MSwgMzYsIDAuNiknLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICA8L3NwYW4+XG4gIClcbn1cblxuLyoqXG4gKiBHcmVlbiBEb3QgZm9yIGNvbXBsZXRlZC91bnJlYWQgc2Vzc2lvbnMgKGZpbmlzaGVkIGluIGJhY2tncm91bmQsIHdhaXRpbmcgdG8gYmUgcmVhZCkuXG4gKi9cbmV4cG9ydCBjb25zdCBDb21wbGV0ZWREb3Q6IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHsgc2l6ZSA9IDE0LCBzdHlsZSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPHNwYW5cbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIHdpZHRoOiBgJHtzaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgIC4uLnN0eWxlLFxuICAgICAgfX1cbiAgICAgIHRpdGxlPVwiXHU1REYyXHU2MjY3XHU4ODRDXHU1QjhDXHU2QkQ1IChcdTY3MkFcdThCRkIpXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMjUpJyxcbiAgICAgICAgICBhbmltYXRpb246ICdkc2gtY29tcGxldGVkLXB1bHNlIDIuMnMgY3ViaWMtYmV6aWVyKDAuMjQsIDAsIDAuMzgsIDEpIGluZmluaXRlJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC40OH1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC40OH1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzRhZGU4MCcsXG4gICAgICAgICAgYm94U2hhZG93OiAnMCAwIDZweCByZ2JhKDc0LCAyMjIsIDEyOCwgMC44KScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHN0eWxlPntgXG4gICAgICAgIEBrZXlmcmFtZXMgZHNoLWNvbXBsZXRlZC1wdWxzZSB7XG4gICAgICAgICAgMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7IG9wYWNpdHk6IDAuODsgfVxuICAgICAgICAgIDUwJSB7IHRyYW5zZm9ybTogc2NhbGUoMS41KTsgb3BhY2l0eTogMC4xNTsgfVxuICAgICAgICAgIDEwMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7IG9wYWNpdHk6IDAuODsgfVxuICAgICAgICB9XG4gICAgICBgfTwvc3R5bGU+XG4gICAgPC9zcGFuPlxuICApXG59XG4iLCAiaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIEFycm93VXBJY29uLFxuICBDbG9zZUljb24sXG4gIEVkaXRJY29uLFxuICBGb2xkZXJJY29uLFxuICBIb21lSWNvbixcbiAgUGx1c0ljb24sXG4gIENoZXZyb25SaWdodEljb24sXG59IGZyb20gJy4vSWNvbnMudHN4J1xuaW1wb3J0IHsgZmV0Y2hEaXJlY3RvcnlMaXN0LCBjcmVhdGVGc0RpcmVjdG9yeSwgdHlwZSBEaXJlY3RvcnlMaXN0UmVzdWx0IH0gZnJvbSAnLi4vYXBpLnRzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdG9yeUJyb3dzZXJNb2RhbFByb3BzIHtcbiAgaW5pdGlhbFBhdGg/OiBzdHJpbmdcbiAgb3BlbjogYm9vbGVhblxuICBvbkNsb3NlOiAoKSA9PiB2b2lkXG4gIG9uQ29uZmlybTogKHNlbGVjdGVkUGF0aDogc3RyaW5nKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBjb25zdCBEaXJlY3RvcnlCcm93c2VyTW9kYWw6IFJlYWN0LkZDPERpcmVjdG9yeUJyb3dzZXJNb2RhbFByb3BzPiA9ICh7XG4gIGluaXRpYWxQYXRoLFxuICBvcGVuLFxuICBvbkNsb3NlLFxuICBvbkNvbmZpcm0sXG59KSA9PiB7XG4gIGNvbnN0IFtjdXJyZW50UGF0aCwgc2V0Q3VycmVudFBhdGhdID0gdXNlU3RhdGU8c3RyaW5nPihpbml0aWFsUGF0aCB8fCAnJylcbiAgY29uc3QgW3BhcmVudFBhdGgsIHNldFBhcmVudFBhdGhdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2hvbWVQYXRoLCBzZXRIb21lUGF0aF0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKVxuICBjb25zdCBbZGlyZWN0b3JpZXMsIHNldERpcmVjdG9yaWVzXSA9IHVzZVN0YXRlPEFycmF5PHsgbmFtZTogc3RyaW5nOyBwYXRoOiBzdHJpbmcgfT4+KFtdKVxuICBjb25zdCBbc2VsZWN0ZWRGb2xkZXIsIHNldFNlbGVjdGVkRm9sZGVyXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtlcnJvck1zZywgc2V0RXJyb3JNc2ddID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3Nob3dIaWRkZW4sIHNldFNob3dIaWRkZW5dID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgLy8gRGlyZWN0IHRleHQgZWRpdCBtb2RlIGZvciBwYXRoXG4gIGNvbnN0IFtpc0VkaXRpbmdSYXdQYXRoLCBzZXRJc0VkaXRpbmdSYXdQYXRoXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbcmF3UGF0aERyYWZ0LCBzZXRSYXdQYXRoRHJhZnRdID0gdXNlU3RhdGUoJycpXG5cbiAgLy8gSW5saW5lIG5ldyBmb2xkZXIgY3JlYXRpb24gc3RhdGVcbiAgY29uc3QgW2lzQ3JlYXRpbmdGb2xkZXIsIHNldElzQ3JlYXRpbmdGb2xkZXJdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtuZXdGb2xkZXJOYW1lLCBzZXROZXdGb2xkZXJOYW1lXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbaXNDcmVhdGluZ1N1Ym1pdHRpbmcsIHNldElzQ3JlYXRpbmdTdWJtaXR0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKVxuXG4gIGNvbnN0IGxvYWRQYXRoID0gYXN5bmMgKHRhcmdldFBhdGg/OiBzdHJpbmcpID0+IHtcbiAgICBzZXRMb2FkaW5nKHRydWUpXG4gICAgc2V0RXJyb3JNc2cobnVsbClcbiAgICBzZXRTZWxlY3RlZEZvbGRlcihudWxsKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXM6IERpcmVjdG9yeUxpc3RSZXN1bHQgPSBhd2FpdCBmZXRjaERpcmVjdG9yeUxpc3QodGFyZ2V0UGF0aCwgc2hvd0hpZGRlbilcbiAgICAgIGlmIChyZXMuZXJyb3IgJiYgcmVzLmRpcmVjdG9yaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBzZXRFcnJvck1zZyhyZXMuZXJyb3IpXG4gICAgICB9XG4gICAgICBzZXRDdXJyZW50UGF0aChyZXMuY3VycmVudFBhdGgpXG4gICAgICBzZXRQYXJlbnRQYXRoKHJlcy5wYXJlbnRQYXRoKVxuICAgICAgc2V0SG9tZVBhdGgocmVzLmhvbWVQYXRoKVxuICAgICAgc2V0RGlyZWN0b3JpZXMocmVzLmRpcmVjdG9yaWVzIHx8IFtdKVxuICAgICAgc2V0UmF3UGF0aERyYWZ0KHJlcy5jdXJyZW50UGF0aClcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgc2V0RXJyb3JNc2coZXJyPy5tZXNzYWdlIHx8ICdcdThCRkJcdTUzRDZcdTc2RUVcdTVGNTVcdTU5MzFcdThEMjUnKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKVxuICAgIH1cbiAgfVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIGxvYWRQYXRoKGluaXRpYWxQYXRoIHx8IHVuZGVmaW5lZClcbiAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXIoZmFsc2UpXG4gICAgICBzZXRJc0VkaXRpbmdSYXdQYXRoKGZhbHNlKVxuICAgIH1cbiAgfSwgW29wZW4sIHNob3dIaWRkZW5dKVxuXG4gIGlmICghb3BlbikgcmV0dXJuIG51bGxcblxuICBjb25zdCBoYW5kbGVOYXZpZ2F0ZSA9IChwYXRoOiBzdHJpbmcpID0+IHtcbiAgICBzZXRJc0NyZWF0aW5nRm9sZGVyKGZhbHNlKVxuICAgIGxvYWRQYXRoKHBhdGgpXG4gIH1cblxuICBjb25zdCBoYW5kbGVDcmVhdGVGb2xkZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IG5ld0ZvbGRlck5hbWUudHJpbSgpXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyKGZhbHNlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHNldElzQ3JlYXRpbmdTdWJtaXR0aW5nKHRydWUpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNyZWF0ZUZzRGlyZWN0b3J5KGN1cnJlbnRQYXRoLCBuYW1lKVxuICAgICAgaWYgKHJlcy5zdWNjZXNzICYmIHJlcy5wYXRoKSB7XG4gICAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXIoZmFsc2UpXG4gICAgICAgIHNldE5ld0ZvbGRlck5hbWUoJycpXG4gICAgICAgIGF3YWl0IGxvYWRQYXRoKHJlcy5wYXRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0RXJyb3JNc2cocmVzLmVycm9yIHx8ICdcdTUyMUJcdTVFRkFcdTY1ODdcdTRFRjZcdTU5MzlcdTU5MzFcdThEMjUnKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBzZXRFcnJvck1zZyhlcnI/Lm1lc3NhZ2UgfHwgJ1x1NTIxQlx1NUVGQVx1NjU4N1x1NEVGNlx1NTkzOVx1NTkzMVx1OEQyNScpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzQ3JlYXRpbmdTdWJtaXR0aW5nKGZhbHNlKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNvbmZpcm1TZWxlY3QgPSAoKSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gKGlzRWRpdGluZ1Jhd1BhdGggJiYgcmF3UGF0aERyYWZ0LnRyaW0oKSkgPyByYXdQYXRoRHJhZnQudHJpbSgpIDogKHNlbGVjdGVkRm9sZGVyIHx8IGN1cnJlbnRQYXRoKVxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIG9uQ29uZmlybSh0YXJnZXQpXG4gICAgfVxuICB9XG5cbiAgLy8gRm9ybWF0IGJyZWFkY3J1bWJzOiByZXBsYWNlIGhvbWVQYXRoIHdpdGggflxuICBjb25zdCByZW5kZXJCcmVhZGNydW1icyA9ICgpID0+IHtcbiAgICBpZiAoaXNFZGl0aW5nUmF3UGF0aCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDk2LCAxNjUsIDI1MCwgMC40KScsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgY29sb3I6ICcjZjhmYWZjJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxuICAgICAgICAgIH19XG4gICAgICAgICAgdmFsdWU9e3Jhd1BhdGhEcmFmdH1cbiAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFJhd1BhdGhEcmFmdChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgb25CbHVyPXsoKSA9PiB7XG4gICAgICAgICAgICBzZXRJc0VkaXRpbmdSYXdQYXRoKGZhbHNlKVxuICAgICAgICAgICAgaWYgKHJhd1BhdGhEcmFmdC50cmltKCkgJiYgcmF3UGF0aERyYWZ0LnRyaW0oKSAhPT0gY3VycmVudFBhdGgpIHtcbiAgICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGUocmF3UGF0aERyYWZ0LnRyaW0oKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgICBzZXRJc0VkaXRpbmdSYXdQYXRoKGZhbHNlKVxuICAgICAgICAgICAgICBpZiAocmF3UGF0aERyYWZ0LnRyaW0oKSkgaGFuZGxlTmF2aWdhdGUocmF3UGF0aERyYWZ0LnRyaW0oKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldElzRWRpdGluZ1Jhd1BhdGgoZmFsc2UpXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICB9XG5cbiAgICBsZXQgZGlzcGxheVBhdGggPSBjdXJyZW50UGF0aFxuICAgIGNvbnN0IGlzSG9tZVJvb3RlZCA9IGhvbWVQYXRoICYmIGN1cnJlbnRQYXRoLnN0YXJ0c1dpdGgoaG9tZVBhdGgpXG4gICAgaWYgKGlzSG9tZVJvb3RlZCkge1xuICAgICAgZGlzcGxheVBhdGggPSAnficgKyBjdXJyZW50UGF0aC5zbGljZShob21lUGF0aC5sZW5ndGgpXG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudHMgPSBkaXNwbGF5UGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKVxuICAgIGxldCBjdW11bGF0aXZlUGF0aCA9IGlzSG9tZVJvb3RlZCA/IGhvbWVQYXRoIDogJydcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcsIGZsZXhXcmFwOiAnd3JhcCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgIGNvbG9yOiAnIzkzYzVmZCcsXG4gICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMnB4IDRweCcsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6ICczcHgnLFxuICAgICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgZ2FwOiAnM3B4JyxcbiAgICAgICAgICB9fVxuICAgICAgICAgIHRpdGxlPXtob21lUGF0aCB8fCAnXHU0RTNCXHU3NkVFXHU1RjU1J31cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVOYXZpZ2F0ZShob21lUGF0aCB8fCAnLycpfVxuICAgICAgICA+XG4gICAgICAgICAgPEhvbWVJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgIDxzcGFuPlx1NEUzQlx1NzZFRVx1NUY1NTwvc3Bhbj5cbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAge2lzSG9tZVJvb3RlZCAmJiBzZWdtZW50c1swXSA9PT0gJ34nICYmIHNlZ21lbnRzLnNsaWNlKDEpLm1hcCgoc2VnLCBpZHgpID0+IHtcbiAgICAgICAgICBjdW11bGF0aXZlUGF0aCA9IGAke2N1bXVsYXRpdmVQYXRofS8ke3NlZ31gXG4gICAgICAgICAgY29uc3Qgc2VnUGF0aCA9IGN1bXVsYXRpdmVQYXRoXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxSZWFjdC5GcmFnbWVudCBrZXk9e2lkeH0+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGNvbG9yOiAnIzY0NzQ4YicsIGZvbnRTaXplOiAnMTFweCcgfX0+Lzwvc3Bhbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBjb2xvcjogaWR4ID09PSBzZWdtZW50cy5sZW5ndGggLSAyID8gJyNmOGZhZmMnIDogJyNjYmQ1ZTEnLFxuICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaWR4ID09PSBzZWdtZW50cy5sZW5ndGggLSAyID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzJweCA0cHgnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiAnMTQwcHgnLFxuICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17c2VnUGF0aH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVOYXZpZ2F0ZShzZWdQYXRoKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtzZWd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9SZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuXG4gICAgICAgIHshaXNIb21lUm9vdGVkICYmIHNlZ21lbnRzLm1hcCgoc2VnLCBpZHgpID0+IHtcbiAgICAgICAgICBjdW11bGF0aXZlUGF0aCA9IGAke2N1bXVsYXRpdmVQYXRofS8ke3NlZ31gXG4gICAgICAgICAgY29uc3Qgc2VnUGF0aCA9IGN1bXVsYXRpdmVQYXRoXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxSZWFjdC5GcmFnbWVudCBrZXk9e2lkeH0+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGNvbG9yOiAnIzY0NzQ4YicsIGZvbnRTaXplOiAnMTFweCcgfX0+Lzwvc3Bhbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBjb2xvcjogaWR4ID09PSBzZWdtZW50cy5sZW5ndGggLSAxID8gJyNmOGZhZmMnIDogJyNjYmQ1ZTEnLFxuICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaWR4ID09PSBzZWdtZW50cy5sZW5ndGggLSAxID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzJweCA0cHgnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiAnMTQwcHgnLFxuICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17c2VnUGF0aH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVOYXZpZ2F0ZShzZWdQYXRoKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtzZWd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9SZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBzdHlsZT17e1xuICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgICAgaW5zZXQ6IDAsXG4gICAgICAgIHpJbmRleDogOTk5OTksXG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoMCwgMCwgMCwgMC43KScsXG4gICAgICAgIGJhY2tkcm9wRmlsdGVyOiAnYmx1cig4cHgpJyxcbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICBmb250RmFtaWx5OiAnaW5oZXJpdCcsXG4gICAgICB9fVxuICAgICAgb25DbGljaz17b25DbG9zZX1cbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgd2lkdGg6ICc1NDBweCcsXG4gICAgICAgICAgbWF4V2lkdGg6ICc5NHZ3JyxcbiAgICAgICAgICBoZWlnaHQ6ICc1MjBweCcsXG4gICAgICAgICAgbWF4SGVpZ2h0OiAnOTB2aCcsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTJweCcsXG4gICAgICAgICAgYmFja2dyb3VuZDogJyMxNTFiMjgnLFxuICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDI0cHggNTBweCByZ2JhKDAsIDAsIDAsIDAuODUpJyxcbiAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgICAgY29sb3I6ICcjZjhmYWZjJyxcbiAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgIH19XG4gICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgPlxuICAgICAgICB7LyogMS4gTW9kYWwgSGVhZGVyIEJhciAqL31cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMTRweCAxOHB4IDEwcHgnLFxuICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzhweCcgfX0+XG4gICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxOH0gY29sb3I9XCIjNjBhNWZhXCIgLz5cbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTVweCcsIGZvbnRXZWlnaHQ6IDYwMCB9fT5cdTkwMDlcdTYyRTlcdTVERTVcdTRGNUNcdTUzM0FcdTc2RUVcdTVGNTU8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgIGNvbG9yOiAnIzk0YTNiOCcsXG4gICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxDbG9zZUljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiAyLiBQYXRoICYgQnJlYWRjcnVtYiBCYXIgKi99XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuICAgICAgICAgICAgcGFkZGluZzogJzhweCAxNHB4JyxcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpJyxcbiAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDYpJyxcbiAgICAgICAgICAgIGdhcDogJzhweCcsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIHtwYXJlbnRQYXRoICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA2KScsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKScsXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjOTRhM2I4JyxcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4IDZweCcsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgIGdhcDogJzJweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMXB4JyxcbiAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICB0aXRsZT17YFx1OEZENFx1NTZERVx1NEUwQVx1NEUwMFx1N0VBNyAoJHtwYXJlbnRQYXRofSlgfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVOYXZpZ2F0ZShwYXJlbnRQYXRoKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPEFycm93VXBJY29uIHNpemU9ezExfSAvPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTRFMEFcdTdFQTc8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAge3JlbmRlckJyZWFkY3J1bWJzKCl9XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgY29sb3I6IGlzRWRpdGluZ1Jhd1BhdGggPyAnIzYwYTVmYScgOiAnIzY0NzQ4YicsXG4gICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICB0aXRsZT1cIlx1N0YxNlx1OEY5MVx1NUI4Q1x1NjU3NFx1OERFRlx1NUY4NFwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldElzRWRpdGluZ1Jhd1BhdGgoIWlzRWRpdGluZ1Jhd1BhdGgpXG4gICAgICAgICAgICAgIHNldFJhd1BhdGhEcmFmdChjdXJyZW50UGF0aClcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEVkaXRJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogMy4gRXJyb3IgQmFubmVyICovfVxuICAgICAgICB7ZXJyb3JNc2cgJiYgKFxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzZweCAxNnB4JywgYmFja2dyb3VuZDogJ3JnYmEoMjM5LCA2OCwgNjgsIDAuMTUpJywgY29sb3I6ICcjZjg3MTcxJywgZm9udFNpemU6ICcxMXB4JyB9fT5cbiAgICAgICAgICAgIHtlcnJvck1zZ31cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogNC4gRGlyZWN0b3J5IExpc3QgU2Nyb2xsYWJsZSBCb2R5ICovfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICBvdmVyZmxvd1k6ICdhdXRvJyxcbiAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgZ2FwOiAnMnB4JyxcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgey8qIElubGluZSBGb2xkZXIgQ3JlYXRpb24gUm93ICovfVxuICAgICAgICAgIHtpc0NyZWF0aW5nRm9sZGVyICYmIChcbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4IDEwcHgnLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xMiknLFxuICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBkYXNoZWQgIzYwYTVmYScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICBtYXJnaW46ICcycHggMCA0cHgnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxNX0gY29sb3I9XCIjNjBhNWZhXCIgLz5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNHB4JyxcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDAsIDAsIDAsIDAuMiknLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKScsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJcdThGOTNcdTUxNjVcdTY1QjBcdTY1ODdcdTRFRjZcdTU5MzlcdTU0MERcdTc5RjAuLi5cIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtuZXdGb2xkZXJOYW1lfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0TmV3Rm9sZGVyTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVDcmVhdGVGb2xkZXIoKVxuICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0SXNDcmVhdGluZ0ZvbGRlcihmYWxzZSlcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2lzQ3JlYXRpbmdTdWJtaXR0aW5nIHx8ICFuZXdGb2xkZXJOYW1lLnRyaW0oKX1cbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyMyNTYzZWInLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMXB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICczcHggOHB4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUNyZWF0ZUZvbGRlcn1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtpc0NyZWF0aW5nU3VibWl0dGluZyA/ICcuLi4nIDogJ1x1Nzg2RVx1NUI5QSd9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzk0YTNiOCcsXG4gICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCA2cHgnLFxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0NyZWF0aW5nRm9sZGVyKGZhbHNlKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIFx1NTNENlx1NkQ4OFxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7bG9hZGluZyA/IChcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLCBoZWlnaHQ6ICcxNDBweCcsIGNvbG9yOiAnIzk0YTNiOCcsIGZvbnRTaXplOiAnMTJweCcgfX0+XG4gICAgICAgICAgICAgIFx1NkI2M1x1NTcyOFx1NTJBMFx1OEY3RFx1NzZFRVx1NUY1NVx1NTIxN1x1ODg2OC4uLlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSA6IGRpcmVjdG9yaWVzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLCBoZWlnaHQ6ICcxNDBweCcsIGNvbG9yOiAnIzY0NzQ4YicsIGZvbnRTaXplOiAnMTJweCcgfX0+XG4gICAgICAgICAgICAgIFx1NkI2NFx1NzZFRVx1NUY1NVx1NEUwQlx1NjVFMFx1NUI1MFx1NjU4N1x1NEVGNlx1NTkzOVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIGRpcmVjdG9yaWVzLm1hcCgoZCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBpc1NlbGVjdGVkID0gc2VsZWN0ZWRGb2xkZXIgPT09IGQucGF0aFxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGtleT17ZC5wYXRofVxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzRweCcsXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDEwcHgnLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogaXNTZWxlY3RlZCA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xNiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzU2VsZWN0ZWQgPyAnIzkzYzVmZCcgOiAnI2UyZThmMCcsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IGlzU2VsZWN0ZWQgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xMnMgZWFzZScsXG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRGb2xkZXIoZC5wYXRoKX1cbiAgICAgICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s9eygpID0+IGhhbmRsZU5hdmlnYXRlKGQucGF0aCl9XG4gICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTZWxlY3RlZCkgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSdcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTZWxlY3RlZCkgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnXG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnOHB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxGb2xkZXJJY29uIHNpemU9ezE2fSBjb2xvcj17aXNTZWxlY3RlZCA/ICcjNjBhNWZhJyA6ICcjOTRhM2I4J30gLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19PlxuICAgICAgICAgICAgICAgICAgICAgIHtkLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM2NDc0OGInLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU4RkRCXHU1MTY1XHU4QkU1XHU3NkVFXHU1RjU1XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGUoZC5wYXRoKVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiA1LiBCb3R0b20gQWN0aW9uIEJhciAqL31cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMTJweCAxOHB4JyxcbiAgICAgICAgICAgIGJvcmRlclRvcDogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpJyxcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgey8qIExlZnQgVG9vbGJhciAqL31cbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzE0cHgnIH19PlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDYpJyxcbiAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEyKScsXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjY2JkNWUxJyxcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc1cHggMTBweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgIGdhcDogJzRweCcsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyKHRydWUpXG4gICAgICAgICAgICAgICAgc2V0TmV3Rm9sZGVyTmFtZSgnJylcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFBsdXNJY29uIHNpemU9ezExfSAvPlxuICAgICAgICAgICAgICA8c3Bhbj5cdTY1QjBcdTVFRkFcdTY1ODdcdTRFRjZcdTU5Mzk8L3NwYW4+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAnIzk0YTNiOCcsIGN1cnNvcjogJ3BvaW50ZXInIH19PlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3Nob3dIaWRkZW59XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTaG93SGlkZGVuKGUudGFyZ2V0LmNoZWNrZWQpfVxuICAgICAgICAgICAgICAgIHN0eWxlPXt7IGN1cnNvcjogJ3BvaW50ZXInLCBhY2NlbnRDb2xvcjogJyMzYjgyZjYnIH19XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuPlx1NjYzRVx1NzkzQVx1OTY5MFx1ODVDRlx1NjU4N1x1NEVGNjwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogUmlnaHQgQWN0aW9uIEJ1dHRvbnMgKi99XG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc4cHgnIH19PlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjOTRhM2I4JyxcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDE0cHgnLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2xvc2V9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIFx1NTNENlx1NkQ4OFxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzI1NjNlYicsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMThweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxM3B4JyxcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA2MDAsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgYm94U2hhZG93OiAnMCAycHggOHB4IHJnYmEoMzcsIDk5LCAyMzUsIDAuNCknLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVDb25maXJtU2VsZWN0fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBcdTYyNTNcdTVGMDBcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQUEsSUFBQUEsZ0JBQWtGOzs7QUNNM0UsSUFBTSxlQUFlO0FBRTVCLGVBQXNCLGNBQWMsZUFBMEQ7QUFDNUYsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxZQUFZLHVCQUF1QixtQkFBbUIsYUFBYSxDQUFDLEVBQUU7QUFDakcsUUFBSSxDQUFDLElBQUksR0FBSSxRQUFPO0FBQ3BCLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixXQUFPLEtBQUssVUFBVSxLQUFLLE9BQU87QUFBQSxFQUNwQyxTQUFTLEtBQUs7QUFDWixZQUFRLEtBQUssOENBQThDLEdBQUc7QUFDOUQsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLGVBQXNCLGFBQWEsZUFBdUIsTUFBNEQ7QUFDcEgsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxZQUFZLFNBQVM7QUFBQSxNQUM5QyxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLE1BQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFBQSxJQUM5QyxDQUFDO0FBQ0QsUUFBSSxDQUFDLElBQUksR0FBSSxRQUFPO0FBQ3BCLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixXQUFPLEtBQUssVUFBVSxLQUFLLE9BQU87QUFBQSxFQUNwQyxTQUFTLEtBQUs7QUFDWixZQUFRLEtB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UyxXQUFXO0FBQUEsWUFDNUM7QUFBQSxZQUNBLGlCQUFpQixDQUFDLFVBQTRCLElBQUksWUFBWSxTQUFTLEtBQUs7QUFBQSxZQUM1RSxlQUFlLE9BQU8sV0FBc0IsVUFBa0I7QUFDNUQsb0JBQU0sVUFBVSxJQUFJLFVBQVUsVUFBVSxTQUFTLEdBQUc7QUFDcEQsa0JBQUksU0FBUztBQUNYLHNCQUFNLFFBQVEsT0FBTyxLQUFLO0FBQUEsY0FDNUI7QUFBQSxZQUNGO0FBQUEsWUFDQSxnQkFBZ0IsT0FBTyxjQUF5QjtBQUM5QyxvQkFBTSxJQUFJLFlBQVksaUJBQWlCLFNBQVM7QUFBQSxZQUNsRDtBQUFBLFlBQ0EsYUFBYSxDQUFDLGNBQXlCO0FBQ3JDLGtCQUFJLFVBQVUsT0FBTyxFQUFFLFdBQVcsZUFBZSxLQUFLLENBQUMsRUFDcEQsS0FBSyxDQUFDLFlBQVk7QUFBRSxvQkFBSSxVQUFVLE9BQU8sT0FBTztBQUFBLGNBQUUsQ0FBQyxFQUNuRCxNQUFNLE1BQU07QUFBQSxjQUFDLENBQUM7QUFBQSxZQUNuQjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNILFNBQVMsS0FBSztBQUNaLFlBQVEsTUFBTSwrQ0FBK0MsR0FBRztBQUFBLEVBQ2xFO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9yZWFjdCIsICJuYW1lIiwgIm5hbWUiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgImltcG9ydF9qc3hfcnVudGltZSIsICJuYW1lIiwgIlJlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSJdCn0K

return module.exports;
} });
