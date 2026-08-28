window.__ModuleLoader__.load({ id: "@dsh-external/dsh-workspace-tree", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var import_react = require("react");

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

// src/client/EnhancedWorkspaceBrowser.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
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
  (0, import_react.useSyncExternalStore)(
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
  const [expandedWorkspaces, setExpandedWorkspaces] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
  const [showSearch, setShowSearch] = (0, import_react.useState)(false);
  const [activeMenuWsId, setActiveMenuWsId] = (0, import_react.useState)(null);
  const [editingWsId, setEditingWsId] = (0, import_react.useState)(null);
  const [editWsTitle, setEditWsTitle] = (0, import_react.useState)("");
  const [isCreatingFolderWsId, setIsCreatingFolderWsId] = (0, import_react.useState)(null);
  const [newFolderName, setNewFolderName] = (0, import_react.useState)("");
  const [editingFolderId, setEditingFolderId] = (0, import_react.useState)(null);
  const [editFolderName, setEditFolderName] = (0, import_react.useState)("");
  const [localUnreadSet, setLocalUnreadSet] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const prevRunningMap = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const [editingSessionId, setEditingSessionId] = (0, import_react.useState)(null);
  const [editSessionTitle, setEditSessionTitle] = (0, import_react.useState)("");
  const [activeMoveMenuSessionId, setActiveMoveMenuSessionId] = (0, import_react.useState)(null);
  const [showAllSessionsMap, setShowAllSessionsMap] = (0, import_react.useState)({});
  const menuRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
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
  const archivedSet = (0, import_react.useMemo)(() => new Set(archivedSessionIds.map(String)), [archivedSessionIds]);
  (0, import_react.useEffect)(() => {
    for (const ws of items) {
      if (ws.path) {
        globalTreeStore.getMetaForWorkspace(ws.path);
      }
    }
  }, [items]);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
  const bannerTasks = (0, import_react.useMemo)(() => {
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
  const filteredWorkspaces = (0, import_react.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", userSelect: "none", fontFamily: "inherit" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 6px", color: "var(--dsw-alias-label-primary, #f8fafc)", fontSize: "13px", fontWeight: 600 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5DE5\u4F5C\u533A" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
          title: "\u641C\u7D22\u5DE5\u4F5C\u533A\u6216\u4F1A\u8BDD",
          onClick: () => setShowSearch(!showSearch),
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SearchIcon, { size: 14 })
        }
      ) })
    ] }),
    showSearch && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "2px 10px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
    bannerTasks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "2px 8px 6px", display: "flex", flexDirection: "column", gap: "4px" }, children: bannerTasks.map((task) => {
      const conf = TASK_STYLE_CONFIG[task.status];
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
              task.status === "running" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RunningDot, { size: 12 }) : task.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PendingDot, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CompletedDot, { size: 12 }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "12px", fontWeight: 500, color: "var(--dsw-alias-label-primary, #f8fafc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: task.title }),
              task.ws?.title && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #94a3b8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }, children: [
                "\xB7 ",
                task.ws.title
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "task-chevron", style: { color: "var(--dsw-alias-label-tertiary, #94a3b8)", paddingLeft: "2px", transition: "color 0.15s ease" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronRightIcon, { size: 11 }) })
            ] })
          ]
        },
        task.sessionId
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "2px", padding: "0 6px" }, children: filteredWorkspaces.map((ws) => {
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
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #94a3b8)", padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }, children: "\u79FB\u52A8\u81F3\u76EE\u6807\u6587\u4EF6\u5939:" }),
              wsMeta.folders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "6px 8px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #64748b)" }, children: "\u6682\u65E0\u6587\u4EF6\u5939\uFF0C\u8BF7\u5148\u521B\u5EFA" }) : wsMeta.folders.map((f) => {
                const inThisFolder = f.sessionIds.includes(sId);
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 13, color: f.color || "#60a5fa" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }, children: f.name }),
                      inThisFolder && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "10px", color: "#60a5fa" }, children: "\u2713" })
                    ]
                  },
                  f.id
                );
              }),
              isCategorized && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MoveOutIcon, { size: 12 }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u79FB\u51FA\u81F3\u672A\u5206\u7C7B" })
                  ]
                }
              )
            ]
          }
        );
      };
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 15, color: "#60a5fa", style: { flexShrink: 0 } }),
                editingWsId === ws.workspaceId ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: ws.path, children: ws.title })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                "div",
                {
                  className: "ws-actions",
                  style: { display: activeMenuWsId === ws.workspaceId ? "inline-flex" : "none", alignItems: "center", gap: "4px" },
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AddFolderIcon, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EllipsisIcon, { size: 14 })
                      }
                    )
                  ]
                }
              ),
              activeMenuWsId === ws.workspaceId && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditIcon, { size: 13 }),
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u91CD\u547D\u540D" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TrashIcon, { size: 13 }),
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5220\u9664\u5DE5\u4F5C\u533A" })
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "1px", paddingLeft: "14px" }, children: [
          isCreatingFolderWsId === ws.workspaceId && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "4px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 14, color: folder.color || "#60a5fa", style: { flexShrink: 0 } }),
                      editingFolderId === folder.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                      ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }, onDoubleClick: () => {
                        setEditingFolderId(folder.id);
                        setEditFolderName(folder.name);
                      }, children: folder.name }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #64748b)" }, children: [
                        "(",
                        folderSessions.length,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "folder-actions", style: { display: "none", alignItems: "center", gap: "4px" }, onClick: (e) => e.stopPropagation(), children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u5728\u6B64\u6587\u4EF6\u5939\u4E0B\u65B0\u5EFA\u4F1A\u8BDD",
                          onClick: () => handleCreateSessionInFolder(ws.workspaceId, ws.path, folder.id),
                          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, { size: 12 })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u91CD\u547D\u540D\u6587\u4EF6\u5939",
                          onClick: () => {
                            setEditingFolderId(folder.id);
                            setEditFolderName(folder.name);
                          },
                          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditIcon, { size: 12 })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        "button",
                        {
                          style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" },
                          title: "\u5220\u9664\u6587\u4EF6\u5939 (\u5185\u90E8\u4F1A\u8BDD\u8FD4\u56DE\u672A\u5206\u7C7B)",
                          onClick: () => globalTreeStore.deleteFolder(ws.path, folder.id),
                          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TrashIcon, { size: 12 })
                        }
                      )
                    ] })
                  ]
                }
              ),
              !folder.collapsed && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? "auto" : "none" }, children: [
                            s.running ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RunningDot, { size: 12 }) : s.pendingInteraction ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PendingDot, {}) : s.completed ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CompletedDot, { size: 12 }) : s.isPinned ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PinIcon, { size: 12, pinned: true, style: { color: "#fbbf24", flexShrink: 0 } }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChatIcon, { size: 13, style: { flexShrink: 0, opacity: 0.6 } }),
                            editingSessionId === s.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                            ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                          editingSessionId !== s.id && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sess-act", style: { display: "none", alignItems: "center", gap: "4px" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: s.isPinned ? "#fbbf24" : "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: s.isPinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u4F1A\u8BDD",
                                onClick: async (e) => {
                                  e.stopPropagation();
                                  await globalTreeStore.togglePinSession(ws.path, s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PinIcon, { size: 12, pinned: s.isPinned })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: "\u91CD\u547D\u540D\u4F1A\u8BDD",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(s.id);
                                  setEditSessionTitle(s.title);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditIcon, { size: 12 })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                                title: "\u5206\u53C9\u4F1A\u8BDD (Fork)",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  props.forkSession?.(s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ForkIcon, { size: 12 })
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { position: "relative", display: "inline-flex" }, children: [
                              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                                  children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MoveToFolderIcon, { size: 12 })
                                }
                              ),
                              renderMoveDropdown(s.id)
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                              "button",
                              {
                                style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px" },
                                title: "\u5220\u9664\u4F1A\u8BDD",
                                onClick: async (e) => {
                                  e.stopPropagation();
                                  await handleDeleteSession(ws.path, s.id);
                                },
                                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TrashIcon, { size: 12 })
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
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? "auto" : "none" }, children: [
                    s.running ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RunningDot, { size: 12 }) : s.pendingInteraction ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PendingDot, {}) : s.completed ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CompletedDot, { size: 12 }) : s.isPinned ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PinIcon, { size: 12, pinned: true, style: { color: "#fbbf24", flexShrink: 0 } }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChatIcon, { size: 13, style: { flexShrink: 0, opacity: 0.6 } }),
                    editingSessionId === s.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                    ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                  editingSessionId !== s.id && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sess-act", style: { display: "none", alignItems: "center", gap: "4px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: s.isPinned ? "#fbbf24" : "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: s.isPinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u4F1A\u8BDD",
                        onClick: async (e) => {
                          e.stopPropagation();
                          await globalTreeStore.togglePinSession(ws.path, s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PinIcon, { size: 12, pinned: s.isPinned })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: "\u91CD\u547D\u540D\u4F1A\u8BDD",
                        onClick: (e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditSessionTitle(s.title);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditIcon, { size: 12 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary, #64748b)", cursor: "pointer", padding: "2px" },
                        title: "\u5206\u53C9\u4F1A\u8BDD (Fork)",
                        onClick: (e) => {
                          e.stopPropagation();
                          props.forkSession?.(s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ForkIcon, { size: 12 })
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { position: "relative", display: "inline-flex" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MoveToFolderIcon, { size: 12 })
                        }
                      ),
                      renderMoveDropdown(s.id)
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "button",
                      {
                        style: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "2px" },
                        title: "\u5220\u9664\u4F1A\u8BDD",
                        onClick: async (e) => {
                          e.stopPropagation();
                          await handleDeleteSession(ws.path, s.id);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TrashIcon, { size: 12 })
                      }
                    )
                  ] })
                ]
              },
              s.id
            );
          }),
          !showAll && remainingCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC9pbmRleC50c3giLCAic3JjL2NsaWVudC9FbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXIudHN4IiwgInNyYy9jbGllbnQvYXBpLnRzIiwgInNyYy9jbGllbnQvdHJlZS1zdG9yZS50cyIsICJzcmMvY2xpZW50L3RpbWUudHMiLCAic3JjL2NsaWVudC9jb21wb25lbnRzL0ljb25zLnRzeCIsICJzcmMvY2xpZW50L2NvbXBvbmVudHMvU3RhdGVJbmRpY2F0b3IudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIGRzaC13b3Jrc3BhY2UtdHJlZSBicm93c2VyIGNsaWVudCBlbnRyeS5cbiAqXG4gKiBEaXJlY3QgdGFrZW92ZXIgb2YgYHNpZGViYXIud29ya3NwYWNlc2Agd2l0aCBwcmlvcml0eTogLTEwLlxuICogSW5qZWN0cyB2aXJ0dWFsIGZvbGRlcnMsIGRyYWcgJiBkcm9wIGdyb3VwaW5nLCBhbmQgbmVzdGVkIHN1YnByb2plY3RzIGRpcmVjdGx5XG4gKiBpbnNpZGUgdGhlIG5hdGl2ZSB3b3Jrc3BhY2UgbGlzdCByb3dzLCB3aXRoIHplcm8gRE9NIHBvbGx1dGlvbi5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQsIFNlc3Npb25JZCwgV29ya3NwYWNlSWQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCdcbmltcG9ydCB7IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlciB9IGZyb20gJy4vRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLnRzeCdcbmltcG9ydCB7IGdsb2JhbFRyZWVTdG9yZSB9IGZyb20gJy4vdHJlZS1zdG9yZS50cydcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAnQGRzaC1leHRlcm5hbC9kc2gtd29ya3NwYWNlLXRyZWUvY2xpZW50J1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnd29ya3NwYWNlcyddXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICA7KGN0eC5zbG90cy5pbmplY3QgYXMgYW55KSgnc2lkZWJhci53b3Jrc3BhY2VzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIChjdHguc2xvdHMucmVnaXN0ZXIgYXMgYW55KShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzaWRlYmFyLndvcmtzcGFjZXMnLFxuICAgICAgICAgIHByaW9yaXR5OiAtMTAsIC8vIGludGVudGlvbmFsIHNoYWRvdyBvdmVyIHN0b2NrIHdvcmtzcGFjZSBicm93c2VyIChsb3dlc3QgcmVuZGVycylcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBzdGFydFNlc3Npb246ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiBjdHgud29ya3NwYWNlcz8uc3RhcnRTZXNzaW9uPy4od29ya3NwYWNlSWQpLFxuICAgICAgICAgICAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI6IGFzeW5jICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5jb25uZWN0V29ya3NwYWNlPy4od29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmFkZFNlc3Npb25Ub0ZvbGRlcih3c1BhdGgsIGZvbGRlcklkLCBzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBzdGFydFNlc3Npb25JbkZvbGRlciBmYWlsZWQ6JywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpLFxuICAgICAgICAgICAgcmVuYW1lV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5yZW5hbWU/Lih3b3Jrc3BhY2VJZCwgdGl0bGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5kZWxldGU/Lih3b3Jrc3BhY2VJZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVXb3Jrc3BhY2U6IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gY3R4LndvcmtzcGFjZXM/LmNyZWF0ZT8uKGlucHV0KSxcbiAgICAgICAgICAgIHJlbmFtZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gY3R4LnNlc3Npb25zPy5iaW5kaW5nPy4oc2Vzc2lvbklkKT8uc2Vzc2lvblxuICAgICAgICAgICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlc3Npb24ucmVuYW1lKHRpdGxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJjaGl2ZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCBjdHgud29ya3NwYWNlcz8uYXJjaGl2ZVNlc3Npb24/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ya1Nlc3Npb246IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/LmZvcms/Lih7IHNlc3Npb25JZCwgaW5jcmVhc2VUaXRsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChjaGlsZElkKSA9PiB7IGN0eC5zZXNzaW9ucz8ub3Blbj8uKGNoaWxkSWQpIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLFxuICAgICAgKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIFNsb3QgaW5qZWN0aW9uIGZhaWxlZDonLCBlcnIpXG4gIH1cbn1cbiIsICJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCB1c2VTeW5jRXh0ZXJuYWxTdG9yZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uSWQsIFdvcmtzcGFjZUlkLCBXb3Jrc3BhY2VWaWV3IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnXG5pbXBvcnQgeyBnbG9iYWxUcmVlU3RvcmUgfSBmcm9tICcuL3RyZWUtc3RvcmUudHMnXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFN1YnByb2plY3RJbmZvIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJ1xuaW1wb3J0IHsgZm9ybWF0UmVsYXRpdmVUaW1lIH0gZnJvbSAnLi90aW1lLnRzJ1xuaW1wb3J0IHtcbiAgQWRkRm9sZGVySWNvbixcbiAgQ2hhdEljb24sXG4gIENoZXZyb25SaWdodEljb24sXG4gIEVkaXRJY29uLFxuICBFbGxpcHNpc0ljb24sXG4gIEZvbGRlckljb24sXG4gIEZvcmtJY29uLFxuICBNb3ZlT3V0SWNvbixcbiAgTW92ZVRvRm9sZGVySWNvbixcbiAgUGluSWNvbixcbiAgUGx1c0ljb24sXG4gIFNlYXJjaEljb24sXG4gIFRyYXNoSWNvbixcbn0gZnJvbSAnLi9jb21wb25lbnRzL0ljb25zLnRzeCdcbmltcG9ydCB7IENvbXBsZXRlZERvdCwgUGVuZGluZ0RvdCwgUnVubmluZ0RvdCB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0ZUluZGljYXRvci50c3gnXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyUHJvcHMge1xuICB1c2VXb3Jrc3BhY2VzPzogKHNlbGVjdG9yOiAoczogYW55KSA9PiBhbnkpID0+IGFueVxuICB1c2VTZXNzaW9ucz86IChzZWxlY3RvcjogKHM6IGFueSkgPT4gYW55KSA9PiBhbnlcbiAgc3RhcnRTZXNzaW9uPzogKHdvcmtzcGFjZUlkPzogV29ya3NwYWNlSWQpID0+IHZvaWRcbiAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI/OiAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB3c1BhdGg6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxuICBvcGVuPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG4gIHJlbmFtZVdvcmtzcGFjZT86ICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHRpdGxlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD5cbiAgZGVsZXRlV29ya3NwYWNlPzogKHdvcmtzcGFjZUlkOiBXb3Jrc3BhY2VJZCkgPT4gUHJvbWlzZTx2b2lkPlxuICByZW5hbWVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkLCB0aXRsZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGFyY2hpdmVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGZvcmtTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG59XG5cbmNvbnN0IERFRkFVTFRfVklTSUJMRV9MSU1JVCA9IDEwXG5jb25zdCBQUkVTRVRfQ09MT1JTID0gWycjNjBhNWZhJywgJyM0YWRlODAnLCAnI2ZiYmYyNCcsICcjZjg3MTcxJywgJyNjMDg0ZmMnLCAnIzM4YmRmOCddXG5cbi8qKiBDaGVjayBpZiBhIHNlc3Npb24gaXMganVzdCBhbiBlbXB0eSBwbGFjZWhvbGRlciBsaWtlIFwic2Vzc2lvbi1jZjZmZTE2OFwiICovXG5mdW5jdGlvbiBpc0JsYW5rUGxhY2Vob2xkZXIoaWQ6IHN0cmluZywgdGl0bGU/OiBzdHJpbmcsIGlzQmxhbmsgPSBmYWxzZSwgaXNBY3RpdmUgPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBpZiAoaXNBY3RpdmUpIHJldHVybiBmYWxzZVxuICBpZiAoaXNCbGFuaykgcmV0dXJuIHRydWVcbiAgaWYgKCF0aXRsZSkgcmV0dXJuIHRydWVcbiAgaWYgKHRpdGxlID09PSBpZCkgcmV0dXJuIHRydWVcbiAgaWYgKC9ec2Vzc2lvbi1bYS16MC05LV0rJC9pLnRlc3QodGl0bGUpKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgRFNIX0lOUFVUX1NUWUxFOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0ge1xuICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgcGFkZGluZzogJzFweCA2cHgnLFxuICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICBib3JkZXI6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KScsXG4gIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICBmb250U2l6ZTogJzEzcHgnLFxuICBsaW5lSGVpZ2h0OiAnMjBweCcsXG4gIG91dGxpbmU6ICdub25lJyxcbiAgZm9udEZhbWlseTogJ2luaGVyaXQnLFxufVxuXG5pbnRlcmZhY2UgQmFubmVyVGFzayB7XG4gIHNlc3Npb25JZDogc3RyaW5nXG4gIHRpdGxlOiBzdHJpbmdcbiAgc3RhdHVzOiAncnVubmluZycgfCAncGVuZGluZycgfCAnY29tcGxldGVkJ1xuICB3cz86IFdvcmtzcGFjZVZpZXdcbn1cblxuY29uc3QgVEFTS19TVFlMRV9DT05GSUcgPSB7XG4gIHJ1bm5pbmc6IHtcbiAgICBiZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMjIpJyxcbiAgICBob3ZlckJnOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjQ1KScsXG4gICAgdGFnVGV4dDogJ1x1OEZEQlx1ODg0Q1x1NEUyRCcsXG4gICAgdGFnQ29sb3I6ICcjNjBhNWZhJyxcbiAgICB0YWdCZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTZCNjNcdTU3MjhcdThGREJcdTg4NEMnLFxuICB9LFxuICBwZW5kaW5nOiB7XG4gICAgYmc6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4wOCknLFxuICAgIGJvcmRlcjogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjI1KScsXG4gICAgaG92ZXJCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE2KScsXG4gICAgaG92ZXJCb3JkZXI6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC41KScsXG4gICAgdGFnVGV4dDogJ1x1NUY4NVx1Nzg2RVx1OEJBNCcsXG4gICAgdGFnQ29sb3I6ICcjZmJiZjI0JyxcbiAgICB0YWdCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTdCNDlcdTVGODVcdTc4NkVcdThCQTQnLFxuICB9LFxuICBjb21wbGV0ZWQ6IHtcbiAgICBiZzogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMjUpJyxcbiAgICBob3ZlckJnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjUpJyxcbiAgICB0YWdUZXh0OiAnXHU1Rjg1XHU4QkZCJyxcbiAgICB0YWdDb2xvcjogJyM0YWRlODAnLFxuICAgIHRhZ0JnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTQpJyxcbiAgICB0aXRsZVByZWZpeDogJ1x1NURGMlx1NjI2N1x1ODg0Q1x1NUI4Q1x1NkJENVx1NUY4NVx1OTYwNVx1OEJGQicsXG4gIH0sXG59XG5cbmV4cG9ydCBjb25zdCBFbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXI6IFJlYWN0LkZDPEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlclByb3BzPiA9IChwcm9wcykgPT4ge1xuICAvLyBTdWJzY3JpYmUgdG8gVHJlZVN0b3JlIGNoYW5nZXMgd2l0aCByZWFjdGl2ZSB2ZXJzaW9uIGNvdW50ZXIgKGd1YXJhbnRlZXMgaW5zdGFudCAwbXMgcmUtcmVuZGVycylcbiAgdXNlU3luY0V4dGVybmFsU3RvcmUoXG4gICAgKGNiKSA9PiBnbG9iYWxUcmVlU3RvcmUuc3Vic2NyaWJlKGNiKSxcbiAgICAoKSA9PiBnbG9iYWxUcmVlU3RvcmUuZ2V0VmVyc2lvbigpLFxuICApXG5cbiAgbGV0IHdvcmtzcGFjZXNTdGF0ZToge1xuICAgIGl0ZW1zPzogcmVhZG9ubHkgV29ya3NwYWNlVmlld1tdXG4gICAgYXJjaGl2ZWRTZXNzaW9uSWRzPzogcmVhZG9ubHkgU2Vzc2lvbklkW11cbiAgICByZWNlbnRXb3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkXG4gIH0gPSB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvcHMudXNlV29ya3NwYWNlcykge1xuICAgICAgd29ya3NwYWNlc1N0YXRlID0gcHJvcHMudXNlV29ya3NwYWNlcygoczogYW55KSA9PiBzKSB8fCB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmVcbiAgfVxuXG4gIGNvbnN0IFtleHBhbmRlZFdvcmtzcGFjZXMsIHNldEV4cGFuZGVkV29ya3NwYWNlc10gPSB1c2VTdGF0ZTxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKVxuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbc2hvd1NlYXJjaCwgc2V0U2hvd1NlYXJjaF0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2FjdGl2ZU1lbnVXc0lkLCBzZXRBY3RpdmVNZW51V3NJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdGluZ1dzSWQsIHNldEVkaXRpbmdXc0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0V3NUaXRsZSwgc2V0RWRpdFdzVGl0bGVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtpc0NyZWF0aW5nRm9sZGVyV3NJZCwgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW25ld0ZvbGRlck5hbWUsIHNldE5ld0ZvbGRlck5hbWVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtlZGl0aW5nRm9sZGVySWQsIHNldEVkaXRpbmdGb2xkZXJJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdEZvbGRlck5hbWUsIHNldEVkaXRGb2xkZXJOYW1lXSA9IHVzZVN0YXRlKCcnKVxuXG4gIC8vIExvY2FsIHVucmVhZCBjb21wbGV0aW9uIHRyYWNrZXIgKHJlYWN0aXZlIHRvIHJ1bm5pbmcgdHJ1ZS0+ZmFsc2UgZWRnZSB3aGVuIG5vdCBhY3RpdmUpXG4gIGNvbnN0IFtsb2NhbFVucmVhZFNldCwgc2V0TG9jYWxVbnJlYWRTZXRdID0gdXNlU3RhdGU8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSlcbiAgY29uc3QgcHJldlJ1bm5pbmdNYXAgPSB1c2VSZWY8TWFwPHN0cmluZywgYm9vbGVhbj4+KG5ldyBNYXAoKSlcblxuICAvLyBTZXNzaW9uIHJlbmFtZSBzdGF0ZVxuICBjb25zdCBbZWRpdGluZ1Nlc3Npb25JZCwgc2V0RWRpdGluZ1Nlc3Npb25JZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdFNlc3Npb25UaXRsZSwgc2V0RWRpdFNlc3Npb25UaXRsZV0gPSB1c2VTdGF0ZSgnJylcbiAgXG4gIC8vIFNlc3Npb24gbW92ZS10by1mb2xkZXIgZHJvcGRvd24gbWVudSBzdGF0ZVxuICBjb25zdCBbYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQsIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIFxuICBjb25zdCBbc2hvd0FsbFNlc3Npb25zTWFwLCBzZXRTaG93QWxsU2Vzc2lvbnNNYXBdID0gdXNlU3RhdGU8UmVjb3JkPHN0cmluZywgYm9vbGVhbj4+KHt9KVxuXG4gIGNvbnN0IG1lbnVSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVHbG9iYWxDbGljayA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBpZiAobWVudVJlZi5jdXJyZW50ICYmICFtZW51UmVmLmN1cnJlbnQuY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50XG4gICAgICBpZiAoIXRhcmdldC5jbG9zZXN0KCcubW92ZS1tZW51LWNvbnRhaW5lcicpICYmICF0YXJnZXQuY2xvc2VzdCgnLm1vdmUtbWVudS1idG4nKSkge1xuICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgICAgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICAgICAgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgIH1cbiAgICB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlR2xvYmFsQ2xpY2spXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlEb3duKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVHbG9iYWxDbGljaylcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bilcbiAgICB9XG4gIH0sIFtdKVxuXG4gIGxldCBzZXNzaW9uc1N0YXRlOiB7XG4gICAgaWRzPzogU2Vzc2lvbklkW11cbiAgICBieUlkPzogUmVjb3JkPHN0cmluZywgeyBzZXNzaW9uSWQ6IFNlc3Npb25JZDsgdGl0bGU/OiBzdHJpbmc7IHVwZGF0ZWRBdD86IG51bWJlcjsgcnVubmluZz86IGJvb2xlYW47IHBlbmRpbmdJbnRlcmFjdGlvbj86IGFueTsgY29tcGxldGVkPzogYm9vbGVhbjsgYmxhbms/OiBib29sZWFuIH0+XG4gICAgY3VycmVudD86IFNlc3Npb25JZFxuICB9ID0geyBpZHM6IFtdLCBieUlkOiB7fSB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvcHMudXNlU2Vzc2lvbnMpIHtcbiAgICAgIHNlc3Npb25zU3RhdGUgPSBwcm9wcy51c2VTZXNzaW9ucygoczogYW55KSA9PiBzKSB8fCB7fVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gaWdub3JlXG4gIH1cblxuICBjb25zdCBhY3RpdmVTZXNzaW9uSWQgPSBzZXNzaW9uc1N0YXRlLmN1cnJlbnQgYXMgdW5rbm93biBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgY29uc3QgaXRlbXM6IHJlYWRvbmx5IFdvcmtzcGFjZVZpZXdbXSA9IHdvcmtzcGFjZXNTdGF0ZS5pdGVtcyB8fCBbXVxuICBjb25zdCBhcmNoaXZlZFNlc3Npb25JZHM6IHJlYWRvbmx5IFNlc3Npb25JZFtdID0gd29ya3NwYWNlc1N0YXRlLmFyY2hpdmVkU2Vzc2lvbklkcyB8fCBbXVxuICBjb25zdCBhcmNoaXZlZFNldCA9IHVzZU1lbW8oKCkgPT4gbmV3IFNldChhcmNoaXZlZFNlc3Npb25JZHMubWFwKFN0cmluZykpLCBbYXJjaGl2ZWRTZXNzaW9uSWRzXSlcblxuICAvLyBQcmVsb2FkIGFsbCB3b3Jrc3BhY2UgbWV0YWRhdGEgb25jZSBpdGVtcyBhcnJpdmVcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBmb3IgKGNvbnN0IHdzIG9mIGl0ZW1zKSB7XG4gICAgICBpZiAod3MucGF0aCkge1xuICAgICAgICBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZSh3cy5wYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW2l0ZW1zXSlcblxuICAvLyBXYXRjaCBydW5uaW5nIC0+IGNvbXBsZXRlZCB0cmFuc2l0aW9ucyBmb3IgYmFja2dyb3VuZCB1bnJlYWQgcmVtaW5kZXJzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYnlJZCA9IHNlc3Npb25zU3RhdGUuYnlJZCB8fCB7fVxuICAgIGNvbnN0IG5ld1VucmVhZCA9IG5ldyBTZXQobG9jYWxVbnJlYWRTZXQpXG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZVxuXG4gICAgZm9yIChjb25zdCBbaWQsIHNlc3Npb25dIG9mIE9iamVjdC5lbnRyaWVzKGJ5SWQpKSB7XG4gICAgICBpZiAoYXJjaGl2ZWRTZXQuaGFzKGlkKSkge1xuICAgICAgICBpZiAobmV3VW5yZWFkLmhhcyhpZCkpIHtcbiAgICAgICAgICBuZXdVbnJlYWQuZGVsZXRlKGlkKVxuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGNvbnN0IHdhc1J1bm5pbmcgPSBwcmV2UnVubmluZ01hcC5jdXJyZW50LmdldChpZCkgfHwgZmFsc2VcbiAgICAgIGNvbnN0IGlzTm93UnVubmluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZylcblxuICAgICAgLy8gVHJhbnNpdGlvbjogcnVubmluZyB0cnVlIC0+IGZhbHNlIHdoaWxlIE5PVCBhY3RpdmUgc2Vzc2lvbiA9PiBNYXJrIGFzIFVucmVhZFxuICAgICAgaWYgKHdhc1J1bm5pbmcgJiYgIWlzTm93UnVubmluZyAmJiBpZCAhPT0gYWN0aXZlU2Vzc2lvbklkKSB7XG4gICAgICAgIG5ld1VucmVhZC5hZGQoaWQpXG4gICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIC8vIElmIGFjdGl2ZSBzZXNzaW9uLCBjbGVhciB1bnJlYWRcbiAgICAgIGlmIChpZCA9PT0gYWN0aXZlU2Vzc2lvbklkICYmIG5ld1VucmVhZC5oYXMoaWQpKSB7XG4gICAgICAgIG5ld1VucmVhZC5kZWxldGUoaWQpXG4gICAgICAgIGNoYW5nZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIHByZXZSdW5uaW5nTWFwLmN1cnJlbnQuc2V0KGlkLCBpc05vd1J1bm5pbmcpXG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5ld1VucmVhZClcbiAgICB9XG4gIH0sIFtzZXNzaW9uc1N0YXRlLmJ5SWQsIGFjdGl2ZVNlc3Npb25JZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIC8vIENsZWFyIHVucmVhZCBvbiBzZXNzaW9uIG9wZW5cbiAgY29uc3QgaGFuZGxlT3BlblNlc3Npb24gPSAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobG9jYWxVbnJlYWRTZXQuaGFzKHNlc3Npb25JZCkpIHtcbiAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgICAgbmV4dC5kZWxldGUoc2Vzc2lvbklkKVxuICAgICAgc2V0TG9jYWxVbnJlYWRTZXQobmV4dClcbiAgICB9XG4gICAgcHJvcHMub3Blbj8uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgfVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDAgJiYgZXhwYW5kZWRXb3Jrc3BhY2VzLnNpemUgPT09IDApIHtcbiAgICAgIGNvbnN0IHRhcmdldElkID0gd29ya3NwYWNlc1N0YXRlLnJlY2VudFdvcmtzcGFjZUlkIHx8IGl0ZW1zWzBdPy53b3Jrc3BhY2VJZFxuICAgICAgaWYgKHRhcmdldElkKSB7XG4gICAgICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcyhuZXcgU2V0KFt0YXJnZXRJZF0pKVxuICAgICAgICBjb25zdCBmaXJzdCA9IGl0ZW1zLmZpbmQoKHcpID0+IHcud29ya3NwYWNlSWQgPT09IHRhcmdldElkKVxuICAgICAgICBpZiAoZmlyc3Q/LnBhdGgpIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKGZpcnN0LnBhdGgpXG4gICAgICB9XG4gICAgfVxuICB9LCBbaXRlbXMsIHdvcmtzcGFjZXNTdGF0ZS5yZWNlbnRXb3Jrc3BhY2VJZF0pXG5cbiAgY29uc3QgdG9nZ2xlV29ya3NwYWNlID0gKHdzSWQ6IHN0cmluZywgd3NQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IFNldChleHBhbmRlZFdvcmtzcGFjZXMpXG4gICAgaWYgKG5leHQuaGFzKHdzSWQpKSB7XG4gICAgICBuZXh0LmRlbGV0ZSh3c0lkKVxuICAgICAgc2V0U2hvd0FsbFNlc3Npb25zTWFwKChwcmV2KSA9PiAoeyAuLi5wcmV2LCBbd3NJZF06IGZhbHNlIH0pKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LmFkZCh3c0lkKVxuICAgICAgZ2xvYmFsVHJlZVN0b3JlLmxvYWRXb3Jrc3BhY2Uod3NQYXRoKVxuICAgIH1cbiAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMobmV4dClcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNyZWF0ZUZvbGRlciA9IGFzeW5jICh3c1BhdGg6IHN0cmluZykgPT4ge1xuICAgIGlmIChuZXdGb2xkZXJOYW1lLnRyaW0oKSkge1xuICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmNyZWF0ZUZvbGRlcih3c1BhdGgsIG5ld0ZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgc2V0TmV3Rm9sZGVyTmFtZSgnJylcbiAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKG51bGwpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgaGFuZGxlU2F2ZVJlbmFtZVdzID0gYXN5bmMgKHdzSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgaWYgKGVkaXRXc1RpdGxlLnRyaW0oKSAmJiBwcm9wcy5yZW5hbWVXb3Jrc3BhY2UpIHtcbiAgICAgIGF3YWl0IHByb3BzLnJlbmFtZVdvcmtzcGFjZSh3c0lkLCBlZGl0V3NUaXRsZS50cmltKCkpXG4gICAgfVxuICAgIHNldEVkaXRpbmdXc0lkKG51bGwpXG4gICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZVNhdmVSZW5hbWVTZXNzaW9uID0gYXN5bmMgKHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGVkaXRTZXNzaW9uVGl0bGUudHJpbSgpICYmIHByb3BzLnJlbmFtZVNlc3Npb24pIHtcbiAgICAgIGF3YWl0IHByb3BzLnJlbmFtZVNlc3Npb24oc2Vzc2lvbklkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkLCBlZGl0U2Vzc2lvblRpdGxlLnRyaW0oKSlcbiAgICB9XG4gICAgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICB9XG5cbiAgLy8gXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXHVGRjFBXHU0RUNFXHU2NzJDXHU1NzMwXHU2NTg3XHU0RUY2XHU1OTM5XHU2RTA1XHU5NjY0ICsgXHU0RUNFXHU2NzJBXHU4QkZCXHU2RTA1XHU5NjY0ICsgXHU4QzAzXHU3NTI4IERTSCBcdTY4MzhcdTVGQzNcdTVGNTJcdTY4NjNcdTUyMjBcdTk2NjRcbiAgY29uc3QgaGFuZGxlRGVsZXRlU2Vzc2lvbiA9IGFzeW5jICh3c1BhdGg6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKGxvY2FsVW5yZWFkU2V0LmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgICAgICBuZXh0LmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5leHQpXG4gICAgICB9XG4gICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucHVyZ2VTZXNzaW9uKHdzUGF0aCwgc2Vzc2lvbklkKVxuICAgICAgaWYgKHByb3BzLmFyY2hpdmVTZXNzaW9uKSB7XG4gICAgICAgIGF3YWl0IHByb3BzLmFyY2hpdmVTZXNzaW9uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIERlbGV0ZSBzZXNzaW9uIGZhaWxlZDonLCBlcnIpXG4gICAgfVxuICB9XG5cbiAgLy8gXHVEODNDXHVERjFGIFx1NTcyOFx1NjMwN1x1NUI5QVx1NjU4N1x1NEVGNlx1NTkzOVx1NTE4NVx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFx1RkYwOFx1NzZGNFx1OEZERSBjb25uZWN0V29ya3NwYWNlIFx1ODNCN1x1NTNENiBTZXNzaW9uSWQgXHU1RTc2XHU1RjUyXHU1MTY1XHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU5NkY2XHU2NUY2XHU1RThGXHU3QURFXHU2MDAxXHVGRjA5XG4gIGNvbnN0IGhhbmRsZUNyZWF0ZVNlc3Npb25JbkZvbGRlciA9IGFzeW5jICh3c0lkOiBXb3Jrc3BhY2VJZCwgd3NQYXRoOiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAocHJvcHMuc3RhcnRTZXNzaW9uSW5Gb2xkZXIpIHtcbiAgICAgIGF3YWl0IHByb3BzLnN0YXJ0U2Vzc2lvbkluRm9sZGVyKHdzSWQsIHdzUGF0aCwgZm9sZGVySWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzSWQpXG4gICAgfVxuICB9XG5cbiAgLy8gXHVEODNDXHVERjFGIFx1OTg3Nlx1OTBFOFx1NkQzQlx1NTJBOFx1NEUwRVx1NUY4NVx1OEJGQlx1NEVGQlx1NTJBMVx1OTYxRlx1NTIxN1x1RkYwOFx1OEZEQlx1ODg0Q1x1NEUyRCAvIFx1NUY4NVx1NEVBNFx1NEU5MiAvIFx1NURGMlx1NUI4Q1x1NjIxMFx1NUY4NVx1OEJGQlx1RkYwQ1x1NzBCOVx1NTFGQlx1OTYwNVx1OEJGQlx1NTQwRVx1ODFFQVx1NTJBOFx1NkQ4OFx1OTY2NFx1RkYwOVxuICBjb25zdCBiYW5uZXJUYXNrcyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGxpc3Q6IEJhbm5lclRhc2tbXSA9IFtdXG4gICAgY29uc3QgYnlJZCA9IHNlc3Npb25zU3RhdGUuYnlJZCB8fCB7fVxuXG4gICAgZm9yIChjb25zdCBbc0lkLCBzZXNzaW9uXSBvZiBPYmplY3QuZW50cmllcyhieUlkKSkge1xuICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhzSWQpKSBjb250aW51ZVxuICAgICAgY29uc3QgaXNSdW5uaW5nID0gQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKVxuICAgICAgY29uc3QgaXNQZW5kaW5nID0gQm9vbGVhbihzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24pXG4gICAgICBjb25zdCBpc1VucmVhZENvbXBsZXRlZCA9IChCb29sZWFuKHNlc3Npb24/LmNvbXBsZXRlZCkgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNJZCkpICYmIHNJZCAhPT0gYWN0aXZlU2Vzc2lvbklkXG5cbiAgICAgIGNvbnN0IG93bmVyV3MgPSBpdGVtcy5maW5kKCh3KSA9PiAody5zZXNzaW9uSWRzIHx8IFtdKS5pbmNsdWRlcyhzSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpKVxuICAgICAgY29uc3QgdGl0bGUgPSBzZXNzaW9uPy50aXRsZSB8fCBzSWQuc2xpY2UoMCwgMTYpXG5cbiAgICAgIGlmIChpc1J1bm5pbmcpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgc2Vzc2lvbklkOiBzSWQsIHRpdGxlLCBzdGF0dXM6ICdydW5uaW5nJywgd3M6IG93bmVyV3MgfSlcbiAgICAgIH0gZWxzZSBpZiAoaXNQZW5kaW5nKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAncGVuZGluZycsIHdzOiBvd25lcldzIH0pXG4gICAgICB9IGVsc2UgaWYgKGlzVW5yZWFkQ29tcGxldGVkKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAnY29tcGxldGVkJywgd3M6IG93bmVyV3MgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBvcmRlcjogUmVjb3JkPCdydW5uaW5nJyB8ICdwZW5kaW5nJyB8ICdjb21wbGV0ZWQnLCBudW1iZXI+ID0geyBydW5uaW5nOiAwLCBwZW5kaW5nOiAxLCBjb21wbGV0ZWQ6IDIgfVxuICAgIHJldHVybiBsaXN0LnNvcnQoKGEsIGIpID0+IChvcmRlclthLnN0YXR1c10gPz8gMCkgLSAob3JkZXJbYi5zdGF0dXNdID8/IDApKVxuICB9LCBbc2Vzc2lvbnNTdGF0ZS5ieUlkLCBpdGVtcywgbG9jYWxVbnJlYWRTZXQsIGFjdGl2ZVNlc3Npb25JZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIC8vIFx1NzBCOVx1NTFGQlx1NEVGQlx1NTJBMVx1RkYxQVx1NEUwMFx1OTUyRVx1NUM1NVx1NUYwMFx1NUJGOVx1NUU5NFx1NURFNVx1NEY1Q1x1NTMzQVx1MzAwMVx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTkzOVx1MzAwMVx1NjI1M1x1NUYwMFx1NUJGOVx1OEJERFx1NUU3Nlx1NkQ4OFx1OTY2NFx1NjcyQVx1OEJGQlxuICBjb25zdCBoYW5kbGVKdW1wVG9BY3RpdmVUYXNrID0gKHNlc3Npb25JZDogc3RyaW5nLCBvd25lcldzPzogV29ya3NwYWNlVmlldykgPT4ge1xuICAgIGlmIChvd25lcldzKSB7XG4gICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMoKHByZXYpID0+IG5ldyBTZXQoWy4uLnByZXYsIG93bmVyV3Mud29ya3NwYWNlSWRdKSlcbiAgICAgIGNvbnN0IG1ldGEgPSBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZShvd25lcldzLnBhdGgpXG4gICAgICBjb25zdCB0YXJnZXRGb2xkZXIgPSBtZXRhLmZvbGRlcnMuZmluZCgoZikgPT4gZi5zZXNzaW9uSWRzLmluY2x1ZGVzKHNlc3Npb25JZCkpXG4gICAgICBpZiAodGFyZ2V0Rm9sZGVyICYmIHRhcmdldEZvbGRlci5jb2xsYXBzZWQpIHtcbiAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLnRvZ2dsZUZvbGRlcihvd25lcldzLnBhdGgsIHRhcmdldEZvbGRlci5pZClcbiAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlT3BlblNlc3Npb24oc2Vzc2lvbklkKVxuICB9XG5cbiAgY29uc3QgZmlsdGVyZWRXb3Jrc3BhY2VzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFzZWFyY2hRdWVyeS50cmltKCkpIHJldHVybiBpdGVtc1xuICAgIGNvbnN0IHEgPSBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIGl0ZW1zLmZpbHRlcigod3MpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoVGl0bGUgPSAod3MudGl0bGUgfHwgJycpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSlcbiAgICAgIGNvbnN0IG1hdGNoU2Vzc2lvbnMgPSAod3Muc2Vzc2lvbklkcyB8fCBbXSkuc29tZSgoc0lkKSA9PiB7XG4gICAgICAgIGNvbnN0IHNpZFN0ciA9IHNJZCBhcyB1bmtub3duIGFzIHN0cmluZ1xuICAgICAgICBpZiAoYXJjaGl2ZWRTZXQuaGFzKHNpZFN0cikpIHJldHVybiBmYWxzZVxuICAgICAgICBjb25zdCB0aXRsZSA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NpZFN0cl0/LnRpdGxlIHx8ICcnXG4gICAgICAgIHJldHVybiB0aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIG1hdGNoVGl0bGUgfHwgbWF0Y2hTZXNzaW9uc1xuICAgIH0pXG4gIH0sIFtpdGVtcywgc2VhcmNoUXVlcnksIHNlc3Npb25zU3RhdGUuYnlJZCwgYXJjaGl2ZWRTZXRdKVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBoZWlnaHQ6ICcxMDAlJywgb3ZlcmZsb3dZOiAnYXV0bycsIHVzZXJTZWxlY3Q6ICdub25lJywgZm9udEZhbWlseTogJ2luaGVyaXQnIH19PlxuICAgICAgey8qIDEuIEhlYWRlciBCYXI6IFx1NURFNVx1NEY1Q1x1NTMzQSAqL31cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJywgcGFkZGluZzogJzEycHggMTRweCA2cHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsIGZvbnRTaXplOiAnMTNweCcsIGZvbnRXZWlnaHQ6IDYwMCB9fT5cbiAgICAgICAgPHNwYW4+XHU1REU1XHU0RjVDXHU1MzNBPC9zcGFuPlxuICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcgfX0+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgdGl0bGU9XCJcdTY0MUNcdTdEMjJcdTVERTVcdTRGNUNcdTUzM0FcdTYyMTZcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd1NlYXJjaCghc2hvd1NlYXJjaCl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFNlYXJjaEljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBcdTdEMjdcdTUxRDFcdTY0MUNcdTdEMjJcdThGOTNcdTUxNjVcdTY4NDYgKi99XG4gICAgICB7c2hvd1NlYXJjaCAmJiAoXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzJweCAxMHB4IDZweCcgfX0+XG4gICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAnMjhweCcsXG4gICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJcdTY0MUNcdTdEMjJcdTVERTVcdTRGNUNcdTUzM0FcdTYyMTZcdTRGMUFcdThCREQuLi5cIlxuICAgICAgICAgICAgdmFsdWU9e3NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTZWFyY2hRdWVyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogMi4gXHU5ODc2XHU5MEU4XHU2RDNCXHU1MkE4L1x1NUY4NVx1OEJGQlx1NEVGQlx1NTJBMSAoXHU1MzU1XHU4ODRDXHU2NzgxXHU3QjgwXHU3Q0JFXHU4MUY0XHU4MEY2XHU1NkNBIDI4cHggXHU5QUQ4XHU1RUE2XHVGRjBDXHU4RkRCXHU4ODRDXHU0RTJEL1x1NUY4NVx1Nzg2RVx1OEJBNC9cdTVGODVcdThCRkIpICovfVxuICAgICAge2Jhbm5lclRhc2tzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcycHggOHB4IDZweCcsIGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAge2Jhbm5lclRhc2tzLm1hcCgodGFzaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29uZiA9IFRBU0tfU1RZTEVfQ09ORklHW3Rhc2suc3RhdHVzXVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17dGFzay5zZXNzaW9uSWR9XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzI4cHgnLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBjb25mLmJnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7Y29uZi5ib3JkZXJ9YCxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2FsbCAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPXtgJHtjb25mLnRpdGxlUHJlZml4fSAoXHU3MEI5XHU1MUZCXHU3NkY0XHU4RkJFJHt0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgPyAnXHU1RTc2XHU2RDg4XHU5NjY0XHU1Rjg1XHU4QkZCJyA6ICcnfVx1RkYwQ1x1NEY0RFx1NEU4RTogJHt0YXNrLndzPy50aXRsZSB8fCAnXHU1RjUzXHU1MjREXHU1REU1XHU0RjVDXHU1MzNBJ30pYH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVKdW1wVG9BY3RpdmVUYXNrKHRhc2suc2Vzc2lvbklkLCB0YXNrLndzKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGNvbmYuaG92ZXJCZ1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gY29uZi5ob3ZlckJvcmRlclxuICAgICAgICAgICAgICAgICAgY29uc3QgY2hldnJvbiA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcudGFzay1jaGV2cm9uJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChjaGV2cm9uKSBjaGV2cm9uLnN0eWxlLmNvbG9yID0gJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZmZmKSdcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gY29uZi5iZ1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gY29uZi5ib3JkZXJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZXZyb24gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnRhc2stY2hldnJvbicpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICAgICAgICAgICAge3Rhc2suc3RhdHVzID09PSAncnVubmluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxSdW5uaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IHRhc2suc3RhdHVzID09PSAncGVuZGluZycgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPENvbXBsZXRlZERvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEycHgnLCBmb250V2VpZ2h0OiA1MDAsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19PlxuICAgICAgICAgICAgICAgICAgICB7dGFzay50aXRsZX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHt0YXNrLndzPy50aXRsZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgb3BhY2l0eTogMC44IH19PlxuICAgICAgICAgICAgICAgICAgICAgIFx1MDBCNyB7dGFzay53cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JywgZmxleFNocmluazogMCB9fT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29uZi50YWdDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBjb25mLnRhZ0JnLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxcHggNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6ICcxM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA1MDAsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtjb25mLnRhZ1RleHR9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0YXNrLWNoZXZyb25cIiBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBwYWRkaW5nTGVmdDogJzJweCcsIHRyYW5zaXRpb246ICdjb2xvciAwLjE1cyBlYXNlJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb24gc2l6ZT17MTF9IC8+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiAzLiBXb3Jrc3BhY2VzIFRyZWUgTGlzdCAqL31cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMnB4JywgcGFkZGluZzogJzAgNnB4JyB9fT5cbiAgICAgICAge2ZpbHRlcmVkV29ya3NwYWNlcy5tYXAoKHdzKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuZGVkV29ya3NwYWNlcy5oYXMod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gXHVEODNDXHVERjFGIFx1OEJGQlx1NTNENlx1NkJDRlx1NEUyQVx1NURFNVx1NEY1Q1x1NTMzQVx1NzJFQ1x1N0FDQlx1NzY4NFx1NTE0M1x1NjU3MFx1NjM2RVx1RkYwOFx1NkMzOFx1NEU0NVx1N0EzM1x1NUI5QVx1NUUzOFx1OUE3Qlx1RkYwOVxuICAgICAgICAgIGNvbnN0IHdzTWV0YSA9IGdsb2JhbFRyZWVTdG9yZS5nZXRNZXRhRm9yV29ya3NwYWNlKHdzLnBhdGgpXG4gICAgICAgICAgY29uc3Qgd3NQaW5uZWRTZXQgPSBuZXcgU2V0KHdzTWV0YS5waW5uZWRTZXNzaW9uSWRzIHx8IFtdKVxuXG4gICAgICAgICAgY29uc3QgcmF3U2Vzc2lvbnMgPSAod3Muc2Vzc2lvbklkcyB8fCBbXSkubWFwKChzSWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpZFN0ciA9IHNJZCBhcyB1bmtub3duIGFzIHN0cmluZ1xuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NpZFN0cl1cbiAgICAgICAgICAgIGNvbnN0IGlzVW5yZWFkID0gQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNpZFN0cikpXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGlkOiBzaWRTdHIsXG4gICAgICAgICAgICAgIHRpdGxlOiBzZXNzaW9uPy50aXRsZSB8fCBzaWRTdHIuc2xpY2UoMCwgMTYpLFxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IHNlc3Npb24/LnVwZGF0ZWRBdCB8fCAwLFxuICAgICAgICAgICAgICBydW5uaW5nOiBCb29sZWFuKHNlc3Npb24/LnJ1bm5pbmcpLFxuICAgICAgICAgICAgICBwZW5kaW5nSW50ZXJhY3Rpb246IHNlc3Npb24/LnBlbmRpbmdJbnRlcmFjdGlvbixcbiAgICAgICAgICAgICAgY29tcGxldGVkOiBpc1VucmVhZCAmJiBzaWRTdHIgIT09IGFjdGl2ZVNlc3Npb25JZCxcbiAgICAgICAgICAgICAgYmxhbms6IEJvb2xlYW4oc2Vzc2lvbj8uYmxhbmspLFxuICAgICAgICAgICAgICBpc1Bpbm5lZDogd3NQaW5uZWRTZXQuaGFzKHNpZFN0ciksXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IHZhbGlkU2Vzc2lvbnMgPSByYXdTZXNzaW9uc1xuICAgICAgICAgICAgLmZpbHRlcigocykgPT4gIWFyY2hpdmVkU2V0LmhhcyhzLmlkKSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFpc0JsYW5rUGxhY2Vob2xkZXIocy5pZCwgcy50aXRsZSwgcy5ibGFuaywgYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkKSlcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhLnJ1bm5pbmcgIT09IGIucnVubmluZykgcmV0dXJuIGEucnVubmluZyA/IC0xIDogMVxuICAgICAgICAgICAgICBpZiAoYS5pc1Bpbm5lZCAhPT0gYi5pc1Bpbm5lZCkgcmV0dXJuIGEuaXNQaW5uZWQgPyAtMSA6IDFcbiAgICAgICAgICAgICAgcmV0dXJuIChiLnVwZGF0ZWRBdCB8fCAwKSAtIChhLnVwZGF0ZWRBdCB8fCAwKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGNhdGVnb3JpemVkU2Vzc2lvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICAgICAgZm9yIChjb25zdCBmIG9mIHdzTWV0YS5mb2xkZXJzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNJZCBvZiBmLnNlc3Npb25JZHMpIGNhdGVnb3JpemVkU2Vzc2lvbklkcy5hZGQoc0lkKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucyA9IHZhbGlkU2Vzc2lvbnMuZmlsdGVyKChzKSA9PiAhY2F0ZWdvcml6ZWRTZXNzaW9uSWRzLmhhcyhzLmlkKSlcbiAgICAgICAgICBjb25zdCBzaG93QWxsID0gc2hvd0FsbFNlc3Npb25zTWFwW3dzLndvcmtzcGFjZUlkXSB8fCBmYWxzZVxuICAgICAgICAgIGNvbnN0IHZpc2libGVVbmNhdGVnb3JpemVkID0gc2hvd0FsbCA/IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucyA6IHVuY2F0ZWdvcml6ZWRTZXNzaW9ucy5zbGljZSgwLCBERUZBVUxUX1ZJU0lCTEVfTElNSVQpXG4gICAgICAgICAgY29uc3QgcmVtYWluaW5nQ291bnQgPSB1bmNhdGVnb3JpemVkU2Vzc2lvbnMubGVuZ3RoIC0gREVGQVVMVF9WSVNJQkxFX0xJTUlUXG5cbiAgICAgICAgICBjb25zdCByZW5kZXJNb3ZlRHJvcGRvd24gPSAoc0lkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCAhPT0gc0lkKSByZXR1cm4gbnVsbFxuICAgICAgICAgICAgY29uc3QgaXNDYXRlZ29yaXplZCA9IGNhdGVnb3JpemVkU2Vzc2lvbklkcy5oYXMoc0lkKVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1jb250YWluZXJcIlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICAgIHRvcDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgICB6SW5kZXg6IDk5OTksXG4gICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzE2MHB4JyxcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctYWxpYXMtYmctbGF5ZXItMiwgIzFlMjkzYiknLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSknLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJzAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjQ1KScsXG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgICAgICAgZ2FwOiAnMnB4JyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBwYWRkaW5nOiAnNHB4IDhweCcsIGZvbnRXZWlnaHQ6IDYwMCwgYm9yZGVyQm90dG9tOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknIH19PlxuICAgICAgICAgICAgICAgICAgXHU3OUZCXHU1MkE4XHU4MUYzXHU3NkVFXHU2ODA3XHU2NTg3XHU0RUY2XHU1OTM5OlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHt3c01ldGEuZm9sZGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICc2cHggOHB4JywgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgXHU2NjgyXHU2NUUwXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU4QkY3XHU1MTQ4XHU1MjFCXHU1RUZBXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgd3NNZXRhLmZvbGRlcnMubWFwKChmKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluVGhpc0ZvbGRlciA9IGYuc2Vzc2lvbklkcy5pbmNsdWRlcyhzSWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtmLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGluVGhpc0ZvbGRlciA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2UyZThmMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpblRoaXNGb2xkZXIgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGluVGhpc0ZvbGRlciA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xMiknIDogJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5tb3ZlU2Vzc2lvbih3cy5wYXRoLCBzSWQsIGYuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb2xkZXJJY29uIHNpemU9ezEzfSBjb2xvcj17Zi5jb2xvciB8fCAnIzYwYTVmYSd9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGZsZXg6IDEgfX0+e2YubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7aW5UaGlzRm9sZGVyICYmIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTBweCcsIGNvbG9yOiAnIzYwYTVmYScgfX0+XHUyNzEzPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgey8qIFx1NTk4Mlx1Njc5Q1x1NURGMlx1N0VDRlx1NTcyOFx1NjdEMFx1NEUyQVx1NjU4N1x1NEVGNlx1NTkzOVx1NTE4NVx1RkYwQ1x1NjYzRVx1NzkzQVx1NzlGQlx1NTFGQVx1OTAwOVx1OTg3OSAqL31cbiAgICAgICAgICAgICAgICB7aXNDYXRlZ29yaXplZCAmJiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjYmQ1ZTEnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclRvcDogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScpfVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5tb3ZlU2Vzc2lvbih3cy5wYXRoLCBzSWQsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPE1vdmVPdXRJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTc5RkJcdTUxRkFcdTgxRjNcdTY3MkFcdTUyMDZcdTdDN0I8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBrZXk9e3dzLndvcmtzcGFjZUlkfSBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nIH19PlxuICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIFJvdyBJdGVtICovfVxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzM0cHgnLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzRXhwYW5kZWQgPyAndmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDI1NSwyNTUsMjU1LDAuMDYpKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxM3B4JyxcbiAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDUwMCxcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdG9nZ2xlV29ya3NwYWNlKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy53cy1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSBhY3Rpb25zLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy53cy1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zICYmIGFjdGl2ZU1lbnVXc0lkICE9PSB3cy53b3Jrc3BhY2VJZCkgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0SWNvblxuICAgICAgICAgICAgICAgICAgICBzaXplPXsxMn1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogaXNFeHBhbmRlZCA/ICdyb3RhdGUoOTBkZWcpJyA6ICdyb3RhdGUoMGRlZyknLFxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxNX0gY29sb3I9XCIjNjBhNWZhXCIgc3R5bGU9e3sgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAge2VkaXRpbmdXc0lkID09PSB3cy53b3Jrc3BhY2VJZCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0V3NUaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRXc1RpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IGhhbmRsZVNhdmVSZW5hbWVXcyh3cy53b3Jrc3BhY2VJZCl9XG4gICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lV3Mod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcgfX0gdGl0bGU9e3dzLnBhdGh9PlxuICAgICAgICAgICAgICAgICAgICAgIHt3cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBXb3Jrc3BhY2UgQWN0aW9uIEJ1dHRvbnMgKi99XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwid3MtYWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgICBzdHlsZT17eyBkaXNwbGF5OiBhY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyAnaW5saW5lLWZsZXgnIDogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1NzI4XHU1RjUzXHU1MjREXHU1REU1XHU0RjVDXHU1MzNBXHU2NUIwXHU1RUZBXHU1MjA2XHU3QzdCXHU2NTg3XHU0RUY2XHU1OTM5XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNFeHBhbmRlZCkgdG9nZ2xlV29ya3NwYWNlKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8QWRkRm9sZGVySWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcHJvcHMuc3RhcnRTZXNzaW9uPy4od3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8UGx1c0ljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NjZGNFx1NTkxQVx1NjRDRFx1NEY1Q1wiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZU1lbnVXc0lkKGFjdGl2ZU1lbnVXc0lkID09PSB3cy53b3Jrc3BhY2VJZCA/IG51bGwgOiB3cy53b3Jrc3BhY2VJZCl9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxFbGxpcHNpc0ljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBcdTVGMzlcdTUxRkFcdTgzRENcdTUzNTUgKi99XG4gICAgICAgICAgICAgICAge2FjdGl2ZU1lbnVXc0lkID09PSB3cy53b3Jrc3BhY2VJZCAmJiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIHJlZj17bWVudVJlZn1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICByaWdodDogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgdG9wOiAnMzJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgekluZGV4OiAxMDAsXG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3ZhcigtLWRzdy1zdXJmYWNlLTAsICMxODE4MTgpJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tZHN3LWJvcmRlci1kZWZhdWx0LCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpKScsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDZweCAyMHB4IHJnYmEoMCwgMCwgMCwgMC40NSknLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAnMTIwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wRmlsdGVyOiAnYmx1cigxMnB4KScsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KSknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nV3NJZCh3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRXc1RpdGxlKHdzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTWVudVdzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPEVkaXRJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1OTFDRFx1NTQ3RFx1NTQwRDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBnYXA6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCAxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNmODcxNzEnLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjQ4LCAxMTMsIDExMywgMC4xMiknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5kZWxldGVXb3Jrc3BhY2U/Lih3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTN9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHU1MjIwXHU5NjY0XHU1REU1XHU0RjVDXHU1MzNBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBXb3Jrc3BhY2UgQ29udGVudCAoRm9sZGVycyArIFNlc3Npb25zKSAqL31cbiAgICAgICAgICAgICAge2lzRXhwYW5kZWQgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMXB4JywgcGFkZGluZ0xlZnQ6ICcxNHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgIHsvKiBJbmxpbmUgTmV3IEZvbGRlciBJbnB1dCBGb3JtICovfVxuICAgICAgICAgICAgICAgICAge2lzQ3JlYXRpbmdGb2xkZXJXc0lkID09PSB3cy53b3Jrc3BhY2VJZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzRweCA2cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzI2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHU4RjkzXHU1MTY1XHU2NTg3XHU0RUY2XHU1OTM5XHU1NDBEXHU3OUYwIChcdTU2REVcdThGNjZcdTUyMUJcdTVFRkEsIEVTQ1x1NTNENlx1NkQ4OClcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld0ZvbGRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE5ld0ZvbGRlck5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIGhhbmRsZUNyZWF0ZUZvbGRlcih3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0ZvbGRlck5hbWUudHJpbSgpKSBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGhhbmRsZUNyZWF0ZUZvbGRlcih3cy5wYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBBLiBWaXJ0dWFsIEZvbGRlcnMgKi99XG4gICAgICAgICAgICAgICAgICB7d3NNZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9sZGVyU2Vzc2lvbnMgPSBmb2xkZXIuc2Vzc2lvbklkc1xuICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHNJZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25zU3RhdGUuYnlJZD8uW3NJZCBhcyB1bmtub3duIGFzIHN0cmluZ11cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5yZWFkID0gQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQgfHwgbG9jYWxVbnJlYWRTZXQuaGFzKHNJZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogc0lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogc2Vzc2lvbj8udGl0bGUgfHwgc0lkLnNsaWNlKDAsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBzZXNzaW9uPy51cGRhdGVkQXQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZzogQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVuZGluZ0ludGVyYWN0aW9uOiBzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogaXNVbnJlYWQgJiYgc0lkICE9PSBhY3RpdmVTZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJsYW5rOiBCb29sZWFuKHNlc3Npb24/LmJsYW5rKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNQaW5uZWQ6IHdzUGlubmVkU2V0LmhhcyhzSWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigocykgPT4gIWFyY2hpdmVkU2V0LmhhcyhzLmlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEucnVubmluZyAhPT0gYi5ydW5uaW5nKSByZXR1cm4gYS5ydW5uaW5nID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc1Bpbm5lZCAhPT0gYi5pc1Bpbm5lZCkgcmV0dXJuIGEuaXNQaW5uZWQgPyAtMSA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoYi51cGRhdGVkQXQgfHwgMCkgLSAoYS51cGRhdGVkQXQgfHwgMClcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2ZvbGRlci5pZH0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBGb2xkZXIgSGVhZGVyIFJvdyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2UyZThmMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZvbGRlci1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuZm9sZGVyLWFjdGlvbnMnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSBhY3Rpb25zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0SWNvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT17MTB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGZvbGRlci5jb2xsYXBzZWQgPyAncm90YXRlKDBkZWcpJyA6ICdyb3RhdGUoOTBkZWcpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ3RyYW5zZm9ybSAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxNH0gY29sb3I9e2ZvbGRlci5jb2xvciB8fCAnIzYwYTVmYSd9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ0ZvbGRlcklkID09PSBmb2xkZXIuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0Rm9sZGVyTmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0Rm9sZGVyTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0Rm9sZGVyTmFtZS50cmltKCkpIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5yZW5hbWVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkLCBlZGl0Rm9sZGVyTmFtZS50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0Rm9sZGVyTmFtZS50cmltKCkpIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5yZW5hbWVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkLCBlZGl0Rm9sZGVyTmFtZS50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nRm9sZGVySWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBmb250V2VpZ2h0OiA1MDAgfX0gb25Eb3VibGVDbGljaz17KCkgPT4geyBzZXRFZGl0aW5nRm9sZGVySWQoZm9sZGVyLmlkKTsgc2V0RWRpdEZvbGRlck5hbWUoZm9sZGVyLm5hbWUpIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Zm9sZGVyLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknIH19Pih7Zm9sZGVyU2Vzc2lvbnMubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBcdUQ4M0NcdURGMUYgXHU2NTg3XHU0RUY2XHU1OTM5XHU2NENEXHU0RjVDXHU2ODBGXHVGRjFBXHU1MzA1XHU1NDJCIFsrXSBcdTU3MjhcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMEJcdTc2RjRcdTYzQTVcdTY1QjBcdTVFRkFcdTRGMUFcdThCREQgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9sZGVyLWFjdGlvbnNcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19IG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTU3MjhcdTZCNjRcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMEJcdTY1QjBcdTVFRkFcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlQ3JlYXRlU2Vzc2lvbkluRm9sZGVyKHdzLndvcmtzcGFjZUlkLCB3cy5wYXRoLCBmb2xkZXIuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQbHVzSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTY1ODdcdTRFRjZcdTU5MzlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRFZGl0aW5nRm9sZGVySWQoZm9sZGVyLmlkKTsgc2V0RWRpdEZvbGRlck5hbWUoZm9sZGVyLm5hbWUpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXRJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTkzOSAoXHU1MTg1XHU5MEU4XHU0RjFBXHU4QkREXHU4RkQ0XHU1NkRFXHU2NzJBXHU1MjA2XHU3QzdCKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBnbG9iYWxUcmVlU3RvcmUuZGVsZXRlRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIEZvbGRlciBJbnRlcm5hbCBTZXNzaW9ucyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIHshZm9sZGVyLmNvbGxhcHNlZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYXA6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQ6ICcxNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZvbGRlclNlc3Npb25zLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmVTZXNzaW9uSWQgPT09IHMuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbFRpbWUgPSBmb3JtYXRSZWxhdGl2ZVRpbWUocy51cGRhdGVkQXQpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3MuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtYnVzaW5lc3MtcHJpbWFyeSwgIzkzYzVmZCknIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjY2JkNWUxKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaXNBY3RpdmUgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2JhY2tncm91bmQgMC4xMnMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVPcGVuU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRvdWJsZUNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtKSB0bS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3QgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtYWN0JykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRtID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLXRpbWUnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEsIHBvaW50ZXJFdmVudHM6IGVkaXRpbmdTZXNzaW9uSWQgPT09IHMuaWQgPyAnYXV0bycgOiAnbm9uZScgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLnBlbmRpbmdJbnRlcmFjdGlvbiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBlbmRpbmdEb3QgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmNvbXBsZXRlZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENvbXBsZXRlZERvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmlzUGlubmVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXt0cnVlfSBzdHlsZT17eyBjb2xvcjogJyNmYmJmMjQnLCBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hhdEljb24gc2l6ZT17MTN9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAsIG9wYWNpdHk6IDAuNiB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgPT09IHMuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdFNlc3Npb25UaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRTZXNzaW9uVGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4gaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtzLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1Nlc3Npb25JZCAhPT0gcy5pZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzZXNzLXRpbWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHMucnVubmluZyA/ICcjNjBhNWZhJyA6IHMuY29tcGxldGVkID8gJyM0YWRlODAnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IHMuY29tcGxldGVkID8gNTAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnJ1bm5pbmcgPyAnXHU3NTFGXHU2MjEwXHU0RTJEJyA6IHMuY29tcGxldGVkID8gJ1x1NURGMlx1NUI4Q1x1NjIxMCcgOiByZWxUaW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU0RjFBXHU4QkREXHU2MEFDXHU1MDVDXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXHU3RUM0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2Vzcy1hY3RcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6IHMuaXNQaW5uZWQgPyAnI2ZiYmYyNCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy5pc1Bpbm5lZCA/ICdcdTUzRDZcdTZEODhcdTdGNkVcdTk4NzYnIDogJ1x1N0Y2RVx1OTg3Nlx1NEYxQVx1OEJERCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVQaW5TZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3MuaXNQaW5uZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1OTFDRFx1NTQ3RFx1NTQwRFx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjA2XHU1M0M5XHU0RjFBXHU4QkREIChGb3JrKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmZvcmtTZXNzaW9uPy4ocy5pZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvcmtJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU3OUZCXHU1MkE4XHU4MUYzXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2MkM5XHU4M0RDXHU1MzU1XHU2MzA5XHU5NEFFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZGlzcGxheTogJ2lubGluZS1mbGV4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU3OUZCXHU1MkE4XHU0RjFBXHU4QkREXHU4MUYzXHU1MTc2XHU0RUQ2XHU2NTg3XHU0RUY2XHU1OTM5XHU2MjE2XHU2NzJBXHU1MjA2XHU3QzdCLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQoYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyBudWxsIDogcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPE1vdmVUb0ZvbGRlckljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVuZGVyTW92ZURyb3Bkb3duKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMjBcdTk2NjRcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVEZWxldGVTZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBCLiBVbmNhdGVnb3JpemVkIFNlc3Npb25zIChTb3J0ZWQgYnkgdGltZSArIFBpbm5lZCBGaXJzdCArIDEwIExpbWl0KSAqL31cbiAgICAgICAgICAgICAgICAgIHt2aXNpYmxlVW5jYXRlZ29yaXplZC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmVTZXNzaW9uSWQgPT09IHMuaWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsVGltZSA9IGZvcm1hdFJlbGF0aXZlVGltZShzLnVwZGF0ZWRBdClcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjOTNjNWZkKScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNjYmQ1ZTEpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaXNBY3RpdmUgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdiYWNrZ3JvdW5kIDAuMTJzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZU9wZW5TZXNzaW9uKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRTZXNzaW9uVGl0bGUocy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRtID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLXRpbWUnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0KSBhY3Quc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSdW5uaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBlbmRpbmdEb3QgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IHMuY29tcGxldGVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmlzUGlubmVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3RydWV9IHN0eWxlPXt7IGNvbG9yOiAnI2ZiYmYyNCcsIGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hhdEljb24gc2l6ZT17MTN9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAsIG9wYWNpdHk6IDAuNiB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRTZXNzaW9uVGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInNlc3MtdGltZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogcy5ydW5uaW5nID8gJyM2MGE1ZmEnIDogcy5jb21wbGV0ZWQgPyAnIzRhZGU4MCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnJ1bm5pbmcgPyAnXHU3NTFGXHU2MjEwXHU0RTJEJyA6IHMuY29tcGxldGVkID8gJ1x1NURGMlx1NUI4Q1x1NjIxMCcgOiByZWxUaW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU0RjFBXHU4QkREXHU2MEFDXHU1MDVDXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXHU3RUM0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZXNzLWFjdFwiIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6IHMuaXNQaW5uZWQgPyAnI2ZiYmYyNCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtzLmlzUGlubmVkID8gJ1x1NTNENlx1NkQ4OFx1N0Y2RVx1OTg3NicgOiAnXHU3RjZFXHU5ODc2XHU0RjFBXHU4QkREJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnRvZ2dsZVBpblNlc3Npb24od3MucGF0aCwgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17cy5pc1Bpbm5lZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMDZcdTUzQzlcdTRGMUFcdThCREQgKEZvcmspXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZm9ya1Nlc3Npb24/LihzLmlkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ya0ljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU3OUZCXHU1MkE4XHU4MUYzXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2MkM5XHU4M0RDXHU1MzU1XHU2MzA5XHU5NEFFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAncmVsYXRpdmUnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOS4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZW5kZXJNb3ZlRHJvcGRvd24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAnI2Y4NzE3MScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICAgICAgey8qIFx1NUM1NVx1NUYwMFx1NTE3Nlx1NEY1OSBOIFx1NEUyQVx1NEYxQVx1OEJERCAqL31cbiAgICAgICAgICAgICAgICAgIHshc2hvd0FsbCAmJiByZW1haW5pbmdDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmNvbG9yID0gJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QWxsU2Vzc2lvbnNNYXAoKHByZXYpID0+ICh7IC4uLnByZXYsIFt3cy53b3Jrc3BhY2VJZF06IHRydWUgfSkpfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgXHU1QzU1XHU1RjAwXHU1MTc2XHU0RjU5IHtyZW1haW5pbmdDb3VudH0gXHU0RTJBXHU0RjFBXHU4QkREXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIClcbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuIiwgIi8qKlxuICogQ2xpZW50IEFQSSBicmlkZ2UgZm9yIGRzaC13b3Jrc3BhY2UtdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN1YnByb2plY3RJbmZvLCBXb3Jrc3BhY2VUcmVlTWV0YSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcblxuZXhwb3J0IGNvbnN0IFJPVVRFX1BSRUZJWCA9ICcvYXBpL2RzaC13b3Jrc3BhY2UtdHJlZSdcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoVHJlZU1ldGEod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTxXb3Jrc3BhY2VUcmVlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L21ldGE/d29ya3NwYWNlUm9vdD0ke2VuY29kZVVSSUNvbXBvbmVudCh3b3Jrc3BhY2VSb290KX1gKVxuICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBtZXRhOiBXb3Jrc3BhY2VUcmVlTWV0YSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24ubWV0YSA6IG51bGxcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gZmV0Y2ggbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVRyZWVNZXRhKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEpOiBQcm9taXNlPFdvcmtzcGFjZVRyZWVNZXRhIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vbWV0YWAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHdvcmtzcGFjZVJvb3QsIG1ldGEgfSksXG4gICAgfSlcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEgfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLm1ldGEgOiBudWxsXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRmFpbGVkIHRvIHNhdmUgbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhblN1YnByb2plY3RzKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8U3VicHJvamVjdEluZm9bXT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vc2Nhbj93b3Jrc3BhY2VSb290PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdvcmtzcGFjZVJvb3QpfWApXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBbXVxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBzdWJwcm9qZWN0czogU3VicHJvamVjdEluZm9bXSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24uc3VicHJvamVjdHMgOiBbXVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIEZhaWxlZCB0byBzY2FuIHN1YnByb2plY3RzOicsIGVycilcbiAgICByZXR1cm4gW11cbiAgfVxufVxuIiwgIi8qKlxuICogTXVsdGktV29ya3NwYWNlIFJlYWN0aXZlIFRyZWVTdG9yZSBmb3IgbWFuYWdpbmcgdmlydHVhbCBmb2xkZXJzLCBzdWJwcm9qZWN0cyxcbiAqIGFuZCBzZXNzaW9uIHBsYWNlbWVudHMgYWNyb3NzIGFsbCB3b3Jrc3BhY2VzIGNvbmN1cnJlbnRseS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFdvcmtzcGFjZVRyZWVNZXRhLCBTdWJwcm9qZWN0SW5mbyB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcbmltcG9ydCB7IGZldGNoVHJlZU1ldGEsIHNhdmVUcmVlTWV0YSwgc2NhblN1YnByb2plY3RzIH0gZnJvbSAnLi9hcGkudHMnXG5cbmV4cG9ydCB0eXBlIExpc3RlbmVyID0gKCkgPT4gdm9pZFxuXG5jb25zdCBERUZBVUxUX01FVEEgPSAod29ya3NwYWNlUm9vdDogc3RyaW5nKTogV29ya3NwYWNlVHJlZU1ldGEgPT4gKHtcbiAgdmVyc2lvbjogMSxcbiAgaW5ib3hTZXNzaW9uSWRzOiBbXSxcbiAgcGlubmVkU2Vzc2lvbklkczogW10sXG4gIGZvbGRlcnM6IFtdLFxuICBzdWJwcm9qZWN0czogW10sXG4gIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbn0pXG5cbmV4cG9ydCBjbGFzcyBUcmVlU3RvcmUge1xuICBwcml2YXRlIGNhY2hlOiBNYXA8c3RyaW5nLCBXb3Jrc3BhY2VUcmVlTWV0YT4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSBsaXN0ZW5lcnM6IFNldDxMaXN0ZW5lcj4gPSBuZXcgU2V0KClcbiAgcHJpdmF0ZSBpc1NhdmluZ01hcDogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSB2ZXJzaW9uID0gMFxuXG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBnZXRWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvblxuICB9XG5cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHRoaXMudmVyc2lvbisrXG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgbGlzdGVuZXIoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbWV0YWRhdGEgZm9yIGEgc3BlY2lmaWMgd29ya3NwYWNlIHBhdGguXG4gICAqL1xuICBnZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFdvcmtzcGFjZVRyZWVNZXRhIHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QpIHJldHVybiBERUZBVUxUX01FVEEoJycpXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNhY2hlLmdldCh3b3Jrc3BhY2VSb290KVxuICAgIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nXG5cbiAgICBjb25zdCBmcmVzaCA9IERFRkFVTFRfTUVUQSh3b3Jrc3BhY2VSb290KVxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIGZyZXNoKVxuICAgIC8vIEFzeW5jIGxvYWQgaW4gYmFja2dyb3VuZFxuICAgIHRoaXMubG9hZFdvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIHJldHVybiBmcmVzaFxuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgbWV0YWRhdGEgZnJvbSBiYWNrZW5kIGZvciBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGxvYWRXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290KSByZXR1cm5cbiAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBmZXRjaFRyZWVNZXRhKHdvcmtzcGFjZVJvb3QpXG4gICAgaWYgKGxvYWRlZCkge1xuICAgICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwge1xuICAgICAgICAuLi5sb2FkZWQsXG4gICAgICAgIHBpbm5lZFNlc3Npb25JZHM6IEFycmF5LmlzQXJyYXkobG9hZGVkLnBpbm5lZFNlc3Npb25JZHMpID8gbG9hZGVkLnBpbm5lZFNlc3Npb25JZHMgOiBbXSxcbiAgICAgIH0pXG4gICAgICB0aGlzLm5vdGlmeSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBmb2xkZXIgdW5kZXIgYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGNvbG9yOiBzdHJpbmcgPSAnIzYwYTVmYScpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB0cmltbWVkID0gbmFtZS50cmltKCkgfHwgJ1x1NjVCMFx1NUVGQVx1NjU4N1x1NEVGNlx1NTkzOSdcbiAgICBjb25zdCBpZCA9IGBmLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gXG4gICAgY29uc3QgbmV3Rm9sZGVyOiBWaXJ0dWFsRm9sZGVyID0ge1xuICAgICAgaWQsXG4gICAgICBuYW1lOiB0cmltbWVkLFxuICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgIGNvbG9yLFxuICAgICAgc2Vzc2lvbklkczogW10sXG4gICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogWy4uLm1ldGEuZm9sZGVycywgbmV3Rm9sZGVyXSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyByZW5hbWVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpXG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm5cblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgbmFtZTogdHJpbW1lZCB9IDogZikpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIGZvbGRlciBpbiBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUZvbGRlcih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogbWV0YS5mb2xkZXJzLmZpbHRlcigoZikgPT4gZi5pZCAhPT0gZm9sZGVySWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBjb2xsYXBzZSBzdGF0dXMgb2YgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sbGFwc2VkOiAhZi5jb2xsYXBzZWQgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29sb3IgZm9yIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgc2V0Rm9sZGVyQ29sb3Iod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBjb2xvcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sb3IgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlIGEgc2Vzc2lvbiBpbnRvIGEgc3BlY2lmaWMgZm9sZGVyIG9yIHRvIHVuY2F0ZWdvcml6ZWQgKHRhcmdldEZvbGRlcklkID0gbnVsbCkuXG4gICAqL1xuICBhc3luYyBtb3ZlU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nLCB0YXJnZXRGb2xkZXJJZDogc3RyaW5nIHwgbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkRm9sZGVycyA9IG1ldGEuZm9sZGVycy5tYXAoKGZvbGRlcikgPT4ge1xuICAgICAgY29uc3QgZmlsdGVyZWQgPSBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKVxuICAgICAgaWYgKHRhcmdldEZvbGRlcklkICE9PSBudWxsICYmIGZvbGRlci5pZCA9PT0gdGFyZ2V0Rm9sZGVySWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5mb2xkZXIsXG4gICAgICAgICAgY29sbGFwc2VkOiBmYWxzZSwgLy8gXHVEODNDXHVERjFGIFx1NzlGQlx1NTE2NVx1NjIxNlx1NjVCMFx1NUVGQVx1NjVGNlx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1NEYxQVx1OEJERFx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgICAgICAgIHNlc3Npb25JZHM6IFtzZXNzaW9uSWQsIC4uLmZpbHRlcmVkXSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uZm9sZGVyLFxuICAgICAgICBzZXNzaW9uSWRzOiBmaWx0ZXJlZCxcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogdXBkYXRlZEZvbGRlcnMsXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3bHkgY3JlYXRlZCBzZXNzaW9uIGRpcmVjdGx5IGludG8gYSBmb2xkZXIuXG4gICAqL1xuICBhc3luYyBhZGRTZXNzaW9uVG9Gb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubW92ZVNlc3Npb24od29ya3NwYWNlUm9vdCwgc2Vzc2lvbklkLCBmb2xkZXJJZClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgcGlubmVkIHN0YXR1cyBvZiBhIHNlc3Npb24gaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVQaW5TZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgY3VycmVudFBpbm5lZCA9IG5ldyBTZXQobWV0YS5waW5uZWRTZXNzaW9uSWRzIHx8IFtdKVxuICAgIGlmIChjdXJyZW50UGlubmVkLmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICBjdXJyZW50UGlubmVkLmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRQaW5uZWQuYWRkKHNlc3Npb25JZClcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBwaW5uZWRTZXNzaW9uSWRzOiBBcnJheS5mcm9tKGN1cnJlbnRQaW5uZWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlbHkgcmVtb3ZlIGEgZGVsZXRlZCBzZXNzaW9uIGZyb20gYWxsIGZvbGRlcnMgYW5kIHBpbm5lZCBsaXN0IGluIGEgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgcHVyZ2VTZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZEZvbGRlcnMgPSBtZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+ICh7XG4gICAgICAuLi5mb2xkZXIsXG4gICAgICBzZXNzaW9uSWRzOiBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKSxcbiAgICB9KSlcbiAgICBjb25zdCB1cGRhdGVkUGlubmVkID0gKG1ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSkuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZClcblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IHVwZGF0ZWRGb2xkZXJzLFxuICAgICAgcGlubmVkU2Vzc2lvbklkczogdXBkYXRlZFBpbm5lZCxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QgfHwgdGhpcy5pc1NhdmluZ01hcC5nZXQod29ya3NwYWNlUm9vdCkpIHJldHVyblxuICAgIHRoaXMuaXNTYXZpbmdNYXAuc2V0KHdvcmtzcGFjZVJvb3QsIHRydWUpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICAgIGF3YWl0IHNhdmVUcmVlTWV0YSh3b3Jrc3BhY2VSb290LCBtZXRhKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlzU2F2aW5nTWFwLnNldCh3b3Jrc3BhY2VSb290LCBmYWxzZSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdsb2JhbFRyZWVTdG9yZSA9IG5ldyBUcmVlU3RvcmUoKVxuIiwgIi8qKlxuICogRm9ybWF0IHRpbWVzdGFtcCBpbnRvIGNvbmNpc2UgcmVsYXRpdmUgdGltZSBtYXRjaGluZyBEU0ggc3R5bGUgKFwiXHU1MjFBXHU1MjFBXCIsIFwiNVx1NTIwNlx1OTQ5RlwiLCBcIjE2XHU1QzBGXHU2NUY2XCIsIFwiXHU2NjI4XHU1OTI5XCIsIFwiM1x1NTkyOVx1NTI0RFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFJlbGF0aXZlVGltZSh0aW1lc3RhbXA/OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoIXRpbWVzdGFtcCB8fCB0eXBlb2YgdGltZXN0YW1wICE9PSAnbnVtYmVyJykgcmV0dXJuICcnXG4gIGNvbnN0IGRpZmYgPSBEYXRlLm5vdygpIC0gdGltZXN0YW1wXG4gIGlmIChkaWZmIDwgMCkgcmV0dXJuICdcdTUyMUFcdTUyMUEnXG5cbiAgY29uc3Qgc2VjID0gTWF0aC5mbG9vcihkaWZmIC8gMTAwMClcbiAgaWYgKHNlYyA8IDYwKSByZXR1cm4gJ1x1NTIxQVx1NTIxQSdcblxuICBjb25zdCBtaW4gPSBNYXRoLmZsb29yKHNlYyAvIDYwKVxuICBpZiAobWluIDwgNjApIHJldHVybiBgJHttaW59XHU1MjA2XHU5NDlGYFxuXG4gIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW4gLyA2MClcbiAgaWYgKGhvdXJzIDwgMjQpIHJldHVybiBgJHtob3Vyc31cdTVDMEZcdTY1RjZgXG5cbiAgY29uc3QgZGF5cyA9IE1hdGguZmxvb3IoaG91cnMgLyAyNClcbiAgaWYgKGRheXMgPT09IDEpIHJldHVybiAnXHU2NjI4XHU1OTI5J1xuICBpZiAoZGF5cyA8IDMwKSByZXR1cm4gYCR7ZGF5c31cdTU5MjlcdTUyNERgXG5cbiAgY29uc3QgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgcmV0dXJuIGAke2QuZ2V0TW9udGgoKSArIDF9LyR7ZC5nZXREYXRlKCl9YFxufVxuIiwgImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcblxuZXhwb3J0IGNvbnN0IENoZXZyb25SaWdodEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgY2xhc3NOYW1lPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDMuNUwxMC41IDhMNiAxMi41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBGb2xkZXJJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IGNvbG9yPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTUsXG4gIGNvbG9yLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3sgY29sb3I6IGNvbG9yIHx8ICdjdXJyZW50Q29sb3InLCAuLi5zdHlsZSB9fVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgZmlsbD17Y29sb3IgPyBgJHtjb2xvcn0yMmAgOiAnY3VycmVudENvbG9yJ31cbiAgICAgIGZpbGxPcGFjaXR5PXtjb2xvciA/IDAuMiA6IDAuMX1cbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQ2hhdEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMyA0QzMgMy40NDc3MiAzLjQ0NzcyIDMgNCAzSDEyQzEyLjU1MjMgMyAxMyAzLjQ0NzcyIDEzIDRWMTBDMTMgMTAuNTUyMyAxMi41NTIzIDExIDEyIDExSDUuNUwzIDEzLjVWNFpcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQbHVzSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk04IDMuNVYxMi41TTMuNSA4SDEyLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS41XCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IFNlYXJjaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjdcIiBjeT1cIjdcIiByPVwiNC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjNcIiAvPlxuICAgIDxwYXRoIGQ9XCJNMTAuNSAxMC41TDEzLjUgMTMuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4zXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFbGxpcHNpc0ljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjMuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiOFwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiMTIuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFZGl0SWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0xMS41IDIuNUwxMy41IDQuNUw1IDEzSDNWMTFMMTEuNSAyLjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuM1wiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBUcmFzaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMy41IDQuNUgxMi41TTYgNC41VjNDNiAyLjQ0NzcyIDYuNDQ3NzIgMiA3IDJIOUM5LjU1MjI4IDIgMTAgMi40NDc3MiAxMCAzVjQuNU00LjUgNC41VjEzQzQuNSAxMy41NTIzIDQuOTQ3NzIgMTQgNS41IDE0SDEwLjVDMTEuMDUyMyAxNCAxMS41IDEzLjU1MjMgMTEuNSAxM1Y0LjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4zXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEZvcmtJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjExLjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjExLjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPHBhdGggZD1cIk00LjUgNlYxME0xMS41IDZWNy41QzExLjUgOC42IDEwLjYgOS41IDkuNSA5LjVINC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVUb0ZvbGRlckljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMlwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgOC41SDEwTTggNi41TDEwIDguNUw4IDEwLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVPdXRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgMy41SDMuNVYxMi41SDEyLjVWMTBNOC41IDIuNUgxMy41VjcuNU03IDlMMTMgM1wiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjNcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQWRkRm9sZGVySWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0yIDQuMjVDMiAzLjU1OTY0IDIuNTU5NjQgMyAzLjI1IDNINi4wODU3OUM2LjQxNzMyIDMgNi43MzUyOCAzLjEzMTcgNi45Njk2NyAzLjM2NjEyTDguMTMzODggNC41MzAzM0M4LjM2ODI3IDQuNzY0NzUgOC42ODYyMyA0Ljg5NjQ1IDkuMDE3NzcgNC44OTY0NUgxMi43NUMxMy40NDA0IDQuODk2NDUgMTQgNS40NTYwOSAxNCA2LjE0NjQ1VjguNU0yIDQuMjVWMTEuNzVDMiAxMi40NDA0IDIuNTU5NjQgMTMgMy4yNSAxM0g4TTExLjUgMTAuNVYxNC41TTkuNSAxMi41SDEzLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQaW5JY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHBpbm5lZD86IGJvb2xlYW47IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMyxcbiAgcGlubmVkID0gZmFsc2UsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk05LjUgM0wxMyA2LjVNNiA2LjVMMy41IDlMNCAxMkwyIDE0TDQgMTJMNyAxMi41TDkuNSAxME02IDYuNUw5LjUgM002IDYuNUw5LjUgMTBcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICBmaWxsPXtwaW5uZWQgPyAnY3VycmVudENvbG9yJyA6ICdub25lJ31cbiAgICAvPlxuICA8L3N2Zz5cbilcbiIsICJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbi8qKlxuICogQW5pbWF0ZWQgUHVsc2UgSW5kaWNhdG9yIGZvciBydW5uaW5nL3N0cmVhbWluZyBzZXNzaW9ucyBtYXRjaGluZyBEU0ggZGVzaWduLlxuICovXG5leHBvcnQgY29uc3QgUnVubmluZ0RvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTZCNjNcdTU3MjhcdTVCRjlcdThCRERcdTRFMEVcdTc1MUZcdTYyMTBcdTRFMkQuLi5cIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC40KScsXG4gICAgICAgICAgYW5pbWF0aW9uOiAnZHNoLXB1bHNlIDEuNXMgY3ViaWMtYmV6aWVyKDAuMjQsIDAsIDAuMzgsIDEpIGluZmluaXRlJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWJ1c2luZXNzLXByaW1hcnksICM2MGE1ZmEpJyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoOTYsIDE2NSwgMjUwLCAwLjgpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3R5bGU+e2BcbiAgICAgICAgQGtleWZyYW1lcyBkc2gtcHVsc2Uge1xuICAgICAgICAgIDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgICA1MCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEuNik7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgICAxMDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwOyB9XG4gICAgICAgIH1cbiAgICAgIGB9PC9zdHlsZT5cbiAgICA8L3NwYW4+XG4gIClcbn1cblxuLyoqXG4gKiBBbWJlciBEb3QgZm9yIHNlc3Npb25zIHdhaXRpbmcgb24gdXNlciBpbnRlcmFjdGlvbiAocXVlc3Rpb25zL2FwcHJvdmFscykuXG4gKi9cbmV4cG9ydCBjb25zdCBQZW5kaW5nRG90OiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7IHNpemUgPSAxNCwgc3R5bGUgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzcGFuXG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICB3aWR0aDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAuLi5zdHlsZSxcbiAgICAgIH19XG4gICAgICB0aXRsZT1cIlx1N0I0OVx1NUY4NVx1NEVBNFx1NEU5MiAoXHU1QkExXHU2Mjc5L1x1Nzg2RVx1OEJBNClcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICcjZmJiZjI0JyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoMjUxLCAxOTEsIDM2LCAwLjYpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgPC9zcGFuPlxuICApXG59XG5cbi8qKlxuICogR3JlZW4gRG90IGZvciBjb21wbGV0ZWQvdW5yZWFkIHNlc3Npb25zIChmaW5pc2hlZCBpbiBiYWNrZ3JvdW5kLCB3YWl0aW5nIHRvIGJlIHJlYWQpLlxuICovXG5leHBvcnQgY29uc3QgQ29tcGxldGVkRG90OiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7IHNpemUgPSAxNCwgc3R5bGUgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzcGFuXG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICB3aWR0aDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAuLi5zdHlsZSxcbiAgICAgIH19XG4gICAgICB0aXRsZT1cIlx1NURGMlx1NjI2N1x1ODg0Q1x1NUI4Q1x1NkJENSAoXHU2NzJBXHU4QkZCKVwiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjI1KScsXG4gICAgICAgICAgYW5pbWF0aW9uOiAnZHNoLWNvbXBsZXRlZC1wdWxzZSAyLjJzIGN1YmljLWJlemllcigwLjI0LCAwLCAwLjM4LCAxKSBpbmZpbml0ZScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNDh9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNDh9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJyM0YWRlODAnLFxuICAgICAgICAgIGJveFNoYWRvdzogJzAgMCA2cHggcmdiYSg3NCwgMjIyLCAxMjgsIDAuOCknLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzdHlsZT57YFxuICAgICAgICBAa2V5ZnJhbWVzIGRzaC1jb21wbGV0ZWQtcHVsc2Uge1xuICAgICAgICAgIDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgICA1MCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEuNSk7IG9wYWNpdHk6IDAuMTU7IH1cbiAgICAgICAgICAxMDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgfVxuICAgICAgYH08L3N0eWxlPlxuICAgIDwvc3Bhbj5cbiAgKVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQUEsbUJBQWtGOzs7QUNNM0UsSUFBTSxlQUFlO0FBRTVCLGVBQXNCLGNBQWMsZUFBMEQ7QUFDNUYsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxZQUFZLHVCQUF1QixtQkFBbUIsYUFBYSxDQUFDLEVBQUU7QUFDakcsUUFBSSxDQUFDLElBQUks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

return module.exports;
} });
