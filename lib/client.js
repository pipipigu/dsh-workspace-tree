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
  const [draggingSessionId, setDraggingSessionId] = (0, import_react.useState)(null);
  const [dragOverTarget, setDragOverTarget] = (0, import_react.useState)(null);
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
                    color: dragOverTarget === folder.id ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-primary, #e2e8f0)",
                    background: dragOverTarget === folder.id ? "rgba(96, 165, 250, 0.18)" : "transparent",
                    border: dragOverTarget === folder.id ? "1px dashed #60a5fa" : "1px solid transparent",
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
                  onDragOver: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTarget !== folder.id) setDragOverTarget(folder.id);
                  },
                  onDragLeave: (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverTarget === folder.id) setDragOverTarget(null);
                    }
                  },
                  onDrop: async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTarget(null);
                    const sId = e.dataTransfer.getData("text/plain") || draggingSessionId;
                    setDraggingSessionId(null);
                    if (sId) await globalTreeStore.moveSession(ws.path, sId, folder.id);
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        ChevronRightIcon,
                        {
                          size: 10,
                          style: {
                            color: dragOverTarget === folder.id ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #94a3b8)",
                            transform: folder.collapsed ? "rotate(0deg)" : "rotate(90deg)",
                            transition: "transform 0.15s ease",
                            flexShrink: 0
                          }
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 14, color: dragOverTarget === folder.id ? "#60a5fa" : folder.color || "#60a5fa", style: { flexShrink: 0 } }),
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
                      ] }),
                      dragOverTarget === folder.id && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "10px", color: "#60a5fa", fontWeight: 600, paddingLeft: "4px" }, children: "\u677E\u5F00\u79FB\u5165\u6B64\u5904" })
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
                    paddingLeft: "16px",
                    minHeight: folderSessions.length === 0 ? "24px" : "auto"
                  },
                  onDragOver: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTarget !== folder.id) setDragOverTarget(folder.id);
                  },
                  onDragLeave: (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverTarget === folder.id) setDragOverTarget(null);
                    }
                  },
                  onDrop: async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTarget(null);
                    const sId = e.dataTransfer.getData("text/plain") || draggingSessionId;
                    setDraggingSessionId(null);
                    if (sId) await globalTreeStore.moveSession(ws.path, sId, folder.id);
                  },
                  children: folderSessions.map((s) => {
                    const isActive = activeSessionId === s.id;
                    const relTime = formatRelativeTime(s.updatedAt);
                    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                      "div",
                      {
                        draggable: editingSessionId !== s.id,
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: "30px",
                          padding: "0 6px",
                          borderRadius: "6px",
                          cursor: "grab",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          background: isActive ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))" : "transparent",
                          color: isActive ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-primary, #cbd5e1)",
                          fontSize: "12px",
                          fontWeight: isActive ? 600 : 400,
                          opacity: draggingSessionId === s.id ? 0.35 : 1,
                          border: draggingSessionId === s.id ? "1px dashed #60a5fa" : "1px solid transparent",
                          transition: "opacity 0.15s ease"
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
                        onDragStart: (e) => {
                          e.stopPropagation();
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", s.id);
                          setDraggingSessionId(s.id);
                        },
                        onDragEnd: () => {
                          setDraggingSessionId(null);
                          setDragOverTarget(null);
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
          draggingSessionId && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "div",
            {
              style: {
                margin: "4px 0 6px",
                padding: "6px 8px",
                borderRadius: "6px",
                border: dragOverTarget === `root:${ws.workspaceId}` ? "1px dashed #60a5fa" : "1px dashed rgba(255, 255, 255, 0.25)",
                background: dragOverTarget === `root:${ws.workspaceId}` ? "rgba(96, 165, 250, 0.16)" : "rgba(255, 255, 255, 0.03)",
                color: dragOverTarget === `root:${ws.workspaceId}` ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-tertiary, #94a3b8)",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              },
              onDragOver: (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragOverTarget !== `root:${ws.workspaceId}`) setDragOverTarget(`root:${ws.workspaceId}`);
              },
              onDragLeave: () => {
                if (dragOverTarget === `root:${ws.workspaceId}`) setDragOverTarget(null);
              },
              onDrop: async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverTarget(null);
                const sId = e.dataTransfer.getData("text/plain") || draggingSessionId;
                setDraggingSessionId(null);
                if (sId) await globalTreeStore.moveSession(ws.path, sId, null);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MoveOutIcon, { size: 12 }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: dragOverTarget === `root:${ws.workspaceId}` ? "\u677E\u5F00\u79FB\u51FA\u81F3\u672A\u5206\u7C7B" : "\u62D6\u653E\u5230\u6B64\u5904 \u79FB\u51FA\u4F1A\u8BDD\u81F3\u672A\u5206\u7C7B" })
              ]
            }
          ),
          visibleUncategorized.map((s) => {
            const isActive = activeSessionId === s.id;
            const relTime = formatRelativeTime(s.updatedAt);
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "div",
              {
                draggable: editingSessionId !== s.id,
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "30px",
                  padding: "0 6px",
                  borderRadius: "6px",
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  background: isActive ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))" : "transparent",
                  color: isActive ? "var(--dsw-alias-state-business-primary, #93c5fd)" : "var(--dsw-alias-label-primary, #cbd5e1)",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  opacity: draggingSessionId === s.id ? 0.35 : 1,
                  border: draggingSessionId === s.id ? "1px dashed #60a5fa" : "1px solid transparent",
                  transition: "opacity 0.15s ease"
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
                onDragStart: (e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", s.id);
                  setDraggingSessionId(s.id);
                },
                onDragEnd: () => {
                  setDraggingSessionId(null);
                  setDragOverTarget(null);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC9pbmRleC50c3giLCAic3JjL2NsaWVudC9FbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXIudHN4IiwgInNyYy9jbGllbnQvYXBpLnRzIiwgInNyYy9jbGllbnQvdHJlZS1zdG9yZS50cyIsICJzcmMvY2xpZW50L3RpbWUudHMiLCAic3JjL2NsaWVudC9jb21wb25lbnRzL0ljb25zLnRzeCIsICJzcmMvY2xpZW50L2NvbXBvbmVudHMvU3RhdGVJbmRpY2F0b3IudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIGRzaC13b3Jrc3BhY2UtdHJlZSBicm93c2VyIGNsaWVudCBlbnRyeS5cbiAqXG4gKiBEaXJlY3QgdGFrZW92ZXIgb2YgYHNpZGViYXIud29ya3NwYWNlc2Agd2l0aCBwcmlvcml0eTogLTEwLlxuICogSW5qZWN0cyB2aXJ0dWFsIGZvbGRlcnMsIGRyYWcgJiBkcm9wIGdyb3VwaW5nLCBhbmQgbmVzdGVkIHN1YnByb2plY3RzIGRpcmVjdGx5XG4gKiBpbnNpZGUgdGhlIG5hdGl2ZSB3b3Jrc3BhY2UgbGlzdCByb3dzLCB3aXRoIHplcm8gRE9NIHBvbGx1dGlvbi5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQsIFNlc3Npb25JZCwgV29ya3NwYWNlSWQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCdcbmltcG9ydCB7IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlciB9IGZyb20gJy4vRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLnRzeCdcbmltcG9ydCB7IGdsb2JhbFRyZWVTdG9yZSB9IGZyb20gJy4vdHJlZS1zdG9yZS50cydcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAnQGRzaC1leHRlcm5hbC9kc2gtd29ya3NwYWNlLXRyZWUvY2xpZW50J1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnd29ya3NwYWNlcyddXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICA7KGN0eC5zbG90cy5pbmplY3QgYXMgYW55KSgnc2lkZWJhci53b3Jrc3BhY2VzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIChjdHguc2xvdHMucmVnaXN0ZXIgYXMgYW55KShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzaWRlYmFyLndvcmtzcGFjZXMnLFxuICAgICAgICAgIHByaW9yaXR5OiAtMTAsIC8vIGludGVudGlvbmFsIHNoYWRvdyBvdmVyIHN0b2NrIHdvcmtzcGFjZSBicm93c2VyIChsb3dlc3QgcmVuZGVycylcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBzdGFydFNlc3Npb246ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiBjdHgud29ya3NwYWNlcz8uc3RhcnRTZXNzaW9uPy4od29ya3NwYWNlSWQpLFxuICAgICAgICAgICAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI6IGFzeW5jICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5jb25uZWN0V29ya3NwYWNlPy4od29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmFkZFNlc3Npb25Ub0ZvbGRlcih3c1BhdGgsIGZvbGRlcklkLCBzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBzdGFydFNlc3Npb25JbkZvbGRlciBmYWlsZWQ6JywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpLFxuICAgICAgICAgICAgcmVuYW1lV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5yZW5hbWU/Lih3b3Jrc3BhY2VJZCwgdGl0bGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5kZWxldGU/Lih3b3Jrc3BhY2VJZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVXb3Jrc3BhY2U6IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gY3R4LndvcmtzcGFjZXM/LmNyZWF0ZT8uKGlucHV0KSxcbiAgICAgICAgICAgIHJlbmFtZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gY3R4LnNlc3Npb25zPy5iaW5kaW5nPy4oc2Vzc2lvbklkKT8uc2Vzc2lvblxuICAgICAgICAgICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlc3Npb24ucmVuYW1lKHRpdGxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJjaGl2ZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCBjdHgud29ya3NwYWNlcz8uYXJjaGl2ZVNlc3Npb24/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ya1Nlc3Npb246IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/LmZvcms/Lih7IHNlc3Npb25JZCwgaW5jcmVhc2VUaXRsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChjaGlsZElkKSA9PiB7IGN0eC5zZXNzaW9ucz8ub3Blbj8uKGNoaWxkSWQpIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLFxuICAgICAgKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIFNsb3QgaW5qZWN0aW9uIGZhaWxlZDonLCBlcnIpXG4gIH1cbn1cbiIsICJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCB1c2VTeW5jRXh0ZXJuYWxTdG9yZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uSWQsIFdvcmtzcGFjZUlkLCBXb3Jrc3BhY2VWaWV3IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnXG5pbXBvcnQgeyBnbG9iYWxUcmVlU3RvcmUgfSBmcm9tICcuL3RyZWUtc3RvcmUudHMnXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFN1YnByb2plY3RJbmZvIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJ1xuaW1wb3J0IHsgZm9ybWF0UmVsYXRpdmVUaW1lIH0gZnJvbSAnLi90aW1lLnRzJ1xuaW1wb3J0IHtcbiAgQWRkRm9sZGVySWNvbixcbiAgQ2hhdEljb24sXG4gIENoZXZyb25SaWdodEljb24sXG4gIEVkaXRJY29uLFxuICBFbGxpcHNpc0ljb24sXG4gIEZvbGRlckljb24sXG4gIEZvcmtJY29uLFxuICBNb3ZlT3V0SWNvbixcbiAgTW92ZVRvRm9sZGVySWNvbixcbiAgUGluSWNvbixcbiAgUGx1c0ljb24sXG4gIFNlYXJjaEljb24sXG4gIFRyYXNoSWNvbixcbn0gZnJvbSAnLi9jb21wb25lbnRzL0ljb25zLnRzeCdcbmltcG9ydCB7IENvbXBsZXRlZERvdCwgUGVuZGluZ0RvdCwgUnVubmluZ0RvdCB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0ZUluZGljYXRvci50c3gnXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyUHJvcHMge1xuICB1c2VXb3Jrc3BhY2VzPzogKHNlbGVjdG9yOiAoczogYW55KSA9PiBhbnkpID0+IGFueVxuICB1c2VTZXNzaW9ucz86IChzZWxlY3RvcjogKHM6IGFueSkgPT4gYW55KSA9PiBhbnlcbiAgc3RhcnRTZXNzaW9uPzogKHdvcmtzcGFjZUlkPzogV29ya3NwYWNlSWQpID0+IHZvaWRcbiAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI/OiAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB3c1BhdGg6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxuICBvcGVuPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG4gIHJlbmFtZVdvcmtzcGFjZT86ICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHRpdGxlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD5cbiAgZGVsZXRlV29ya3NwYWNlPzogKHdvcmtzcGFjZUlkOiBXb3Jrc3BhY2VJZCkgPT4gUHJvbWlzZTx2b2lkPlxuICByZW5hbWVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkLCB0aXRsZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGFyY2hpdmVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGZvcmtTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG59XG5cbmNvbnN0IERFRkFVTFRfVklTSUJMRV9MSU1JVCA9IDEwXG5jb25zdCBQUkVTRVRfQ09MT1JTID0gWycjNjBhNWZhJywgJyM0YWRlODAnLCAnI2ZiYmYyNCcsICcjZjg3MTcxJywgJyNjMDg0ZmMnLCAnIzM4YmRmOCddXG5cbi8qKiBDaGVjayBpZiBhIHNlc3Npb24gaXMganVzdCBhbiBlbXB0eSBwbGFjZWhvbGRlciBsaWtlIFwic2Vzc2lvbi1jZjZmZTE2OFwiICovXG5mdW5jdGlvbiBpc0JsYW5rUGxhY2Vob2xkZXIoaWQ6IHN0cmluZywgdGl0bGU/OiBzdHJpbmcsIGlzQmxhbmsgPSBmYWxzZSwgaXNBY3RpdmUgPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBpZiAoaXNBY3RpdmUpIHJldHVybiBmYWxzZVxuICBpZiAoaXNCbGFuaykgcmV0dXJuIHRydWVcbiAgaWYgKCF0aXRsZSkgcmV0dXJuIHRydWVcbiAgaWYgKHRpdGxlID09PSBpZCkgcmV0dXJuIHRydWVcbiAgaWYgKC9ec2Vzc2lvbi1bYS16MC05LV0rJC9pLnRlc3QodGl0bGUpKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgRFNIX0lOUFVUX1NUWUxFOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0ge1xuICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgcGFkZGluZzogJzFweCA2cHgnLFxuICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICBib3JkZXI6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KScsXG4gIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICBmb250U2l6ZTogJzEzcHgnLFxuICBsaW5lSGVpZ2h0OiAnMjBweCcsXG4gIG91dGxpbmU6ICdub25lJyxcbiAgZm9udEZhbWlseTogJ2luaGVyaXQnLFxufVxuXG5pbnRlcmZhY2UgQmFubmVyVGFzayB7XG4gIHNlc3Npb25JZDogc3RyaW5nXG4gIHRpdGxlOiBzdHJpbmdcbiAgc3RhdHVzOiAncnVubmluZycgfCAncGVuZGluZycgfCAnY29tcGxldGVkJ1xuICB3cz86IFdvcmtzcGFjZVZpZXdcbn1cblxuY29uc3QgVEFTS19TVFlMRV9DT05GSUcgPSB7XG4gIHJ1bm5pbmc6IHtcbiAgICBiZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMjIpJyxcbiAgICBob3ZlckJnOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjQ1KScsXG4gICAgdGFnVGV4dDogJ1x1OEZEQlx1ODg0Q1x1NEUyRCcsXG4gICAgdGFnQ29sb3I6ICcjNjBhNWZhJyxcbiAgICB0YWdCZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTZCNjNcdTU3MjhcdThGREJcdTg4NEMnLFxuICB9LFxuICBwZW5kaW5nOiB7XG4gICAgYmc6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4wOCknLFxuICAgIGJvcmRlcjogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjI1KScsXG4gICAgaG92ZXJCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE2KScsXG4gICAgaG92ZXJCb3JkZXI6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC41KScsXG4gICAgdGFnVGV4dDogJ1x1NUY4NVx1Nzg2RVx1OEJBNCcsXG4gICAgdGFnQ29sb3I6ICcjZmJiZjI0JyxcbiAgICB0YWdCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTdCNDlcdTVGODVcdTc4NkVcdThCQTQnLFxuICB9LFxuICBjb21wbGV0ZWQ6IHtcbiAgICBiZzogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMjUpJyxcbiAgICBob3ZlckJnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjUpJyxcbiAgICB0YWdUZXh0OiAnXHU1Rjg1XHU4QkZCJyxcbiAgICB0YWdDb2xvcjogJyM0YWRlODAnLFxuICAgIHRhZ0JnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTQpJyxcbiAgICB0aXRsZVByZWZpeDogJ1x1NURGMlx1NjI2N1x1ODg0Q1x1NUI4Q1x1NkJENVx1NUY4NVx1OTYwNVx1OEJGQicsXG4gIH0sXG59XG5cbmV4cG9ydCBjb25zdCBFbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXI6IFJlYWN0LkZDPEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlclByb3BzPiA9IChwcm9wcykgPT4ge1xuICAvLyBTdWJzY3JpYmUgdG8gVHJlZVN0b3JlIGNoYW5nZXMgd2l0aCByZWFjdGl2ZSB2ZXJzaW9uIGNvdW50ZXIgKGd1YXJhbnRlZXMgaW5zdGFudCAwbXMgcmUtcmVuZGVycylcbiAgdXNlU3luY0V4dGVybmFsU3RvcmUoXG4gICAgKGNiKSA9PiBnbG9iYWxUcmVlU3RvcmUuc3Vic2NyaWJlKGNiKSxcbiAgICAoKSA9PiBnbG9iYWxUcmVlU3RvcmUuZ2V0VmVyc2lvbigpLFxuICApXG5cbiAgbGV0IHdvcmtzcGFjZXNTdGF0ZToge1xuICAgIGl0ZW1zPzogcmVhZG9ubHkgV29ya3NwYWNlVmlld1tdXG4gICAgYXJjaGl2ZWRTZXNzaW9uSWRzPzogcmVhZG9ubHkgU2Vzc2lvbklkW11cbiAgICByZWNlbnRXb3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkXG4gIH0gPSB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvcHMudXNlV29ya3NwYWNlcykge1xuICAgICAgd29ya3NwYWNlc1N0YXRlID0gcHJvcHMudXNlV29ya3NwYWNlcygoczogYW55KSA9PiBzKSB8fCB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmVcbiAgfVxuXG4gIGNvbnN0IFtleHBhbmRlZFdvcmtzcGFjZXMsIHNldEV4cGFuZGVkV29ya3NwYWNlc10gPSB1c2VTdGF0ZTxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKVxuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbc2hvd1NlYXJjaCwgc2V0U2hvd1NlYXJjaF0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2FjdGl2ZU1lbnVXc0lkLCBzZXRBY3RpdmVNZW51V3NJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdGluZ1dzSWQsIHNldEVkaXRpbmdXc0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0V3NUaXRsZSwgc2V0RWRpdFdzVGl0bGVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtpc0NyZWF0aW5nRm9sZGVyV3NJZCwgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW25ld0ZvbGRlck5hbWUsIHNldE5ld0ZvbGRlck5hbWVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtlZGl0aW5nRm9sZGVySWQsIHNldEVkaXRpbmdGb2xkZXJJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdEZvbGRlck5hbWUsIHNldEVkaXRGb2xkZXJOYW1lXSA9IHVzZVN0YXRlKCcnKVxuXG4gIC8vIERyYWcgYW5kIGRyb3AgaW50ZXJhY3RpdmUgdmlzdWFsIHN0YXRlc1xuICBjb25zdCBbZHJhZ2dpbmdTZXNzaW9uSWQsIHNldERyYWdnaW5nU2Vzc2lvbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtkcmFnT3ZlclRhcmdldCwgc2V0RHJhZ092ZXJUYXJnZXRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcblxuICAvLyBMb2NhbCB1bnJlYWQgY29tcGxldGlvbiB0cmFja2VyIChyZWFjdGl2ZSB0byBydW5uaW5nIHRydWUtPmZhbHNlIGVkZ2Ugd2hlbiBub3QgYWN0aXZlKVxuICBjb25zdCBbbG9jYWxVbnJlYWRTZXQsIHNldExvY2FsVW5yZWFkU2V0XSA9IHVzZVN0YXRlPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpXG4gIGNvbnN0IHByZXZSdW5uaW5nTWFwID0gdXNlUmVmPE1hcDxzdHJpbmcsIGJvb2xlYW4+PihuZXcgTWFwKCkpXG5cbiAgLy8gU2Vzc2lvbiByZW5hbWUgc3RhdGVcbiAgY29uc3QgW2VkaXRpbmdTZXNzaW9uSWQsIHNldEVkaXRpbmdTZXNzaW9uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2VkaXRTZXNzaW9uVGl0bGUsIHNldEVkaXRTZXNzaW9uVGl0bGVdID0gdXNlU3RhdGUoJycpXG4gIFxuICAvLyBTZXNzaW9uIG1vdmUtdG8tZm9sZGVyIGRyb3Bkb3duIG1lbnUgc3RhdGVcbiAgY29uc3QgW2FjdGl2ZU1vdmVNZW51U2Vzc2lvbklkLCBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBcbiAgY29uc3QgW3Nob3dBbGxTZXNzaW9uc01hcCwgc2V0U2hvd0FsbFNlc3Npb25zTWFwXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+Pih7fSlcblxuICBjb25zdCBtZW51UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlR2xvYmFsQ2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgaWYgKG1lbnVSZWYuY3VycmVudCAmJiAhbWVudVJlZi5jdXJyZW50LmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICB9XG4gICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudFxuICAgICAgaWYgKCF0YXJnZXQuY2xvc2VzdCgnLm1vdmUtbWVudS1jb250YWluZXInKSAmJiAhdGFyZ2V0LmNsb3Nlc3QoJy5tb3ZlLW1lbnUtYnRuJykpIHtcbiAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdXc0lkKG51bGwpXG4gICAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICB9XG4gICAgfVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUdsb2JhbENsaWNrKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlR2xvYmFsQ2xpY2spXG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24pXG4gICAgfVxuICB9LCBbXSlcblxuICBsZXQgc2Vzc2lvbnNTdGF0ZToge1xuICAgIGlkcz86IFNlc3Npb25JZFtdXG4gICAgYnlJZD86IFJlY29yZDxzdHJpbmcsIHsgc2Vzc2lvbklkOiBTZXNzaW9uSWQ7IHRpdGxlPzogc3RyaW5nOyB1cGRhdGVkQXQ/OiBudW1iZXI7IHJ1bm5pbmc/OiBib29sZWFuOyBwZW5kaW5nSW50ZXJhY3Rpb24/OiBhbnk7IGNvbXBsZXRlZD86IGJvb2xlYW47IGJsYW5rPzogYm9vbGVhbiB9PlxuICAgIGN1cnJlbnQ/OiBTZXNzaW9uSWRcbiAgfSA9IHsgaWRzOiBbXSwgYnlJZDoge30gfVxuXG4gIHRyeSB7XG4gICAgaWYgKHByb3BzLnVzZVNlc3Npb25zKSB7XG4gICAgICBzZXNzaW9uc1N0YXRlID0gcHJvcHMudXNlU2Vzc2lvbnMoKHM6IGFueSkgPT4gcykgfHwge31cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIGlnbm9yZVxuICB9XG5cbiAgY29uc3QgYWN0aXZlU2Vzc2lvbklkID0gc2Vzc2lvbnNTdGF0ZS5jdXJyZW50IGFzIHVua25vd24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gIGNvbnN0IGl0ZW1zOiByZWFkb25seSBXb3Jrc3BhY2VWaWV3W10gPSB3b3Jrc3BhY2VzU3RhdGUuaXRlbXMgfHwgW11cbiAgY29uc3QgYXJjaGl2ZWRTZXNzaW9uSWRzOiByZWFkb25seSBTZXNzaW9uSWRbXSA9IHdvcmtzcGFjZXNTdGF0ZS5hcmNoaXZlZFNlc3Npb25JZHMgfHwgW11cbiAgY29uc3QgYXJjaGl2ZWRTZXQgPSB1c2VNZW1vKCgpID0+IG5ldyBTZXQoYXJjaGl2ZWRTZXNzaW9uSWRzLm1hcChTdHJpbmcpKSwgW2FyY2hpdmVkU2Vzc2lvbklkc10pXG5cbiAgLy8gUHJlbG9hZCBhbGwgd29ya3NwYWNlIG1ldGFkYXRhIG9uY2UgaXRlbXMgYXJyaXZlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZm9yIChjb25zdCB3cyBvZiBpdGVtcykge1xuICAgICAgaWYgKHdzLnBhdGgpIHtcbiAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLmdldE1ldGFGb3JXb3Jrc3BhY2Uod3MucGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtpdGVtc10pXG5cbiAgLy8gV2F0Y2ggcnVubmluZyAtPiBjb21wbGV0ZWQgdHJhbnNpdGlvbnMgZm9yIGJhY2tncm91bmQgdW5yZWFkIHJlbWluZGVyc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGJ5SWQgPSBzZXNzaW9uc1N0YXRlLmJ5SWQgfHwge31cbiAgICBjb25zdCBuZXdVbnJlYWQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgIGxldCBjaGFuZ2VkID0gZmFsc2VcblxuICAgIGZvciAoY29uc3QgW2lkLCBzZXNzaW9uXSBvZiBPYmplY3QuZW50cmllcyhieUlkKSkge1xuICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhpZCkpIHtcbiAgICAgICAgaWYgKG5ld1VucmVhZC5oYXMoaWQpKSB7XG4gICAgICAgICAgbmV3VW5yZWFkLmRlbGV0ZShpZClcbiAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBjb25zdCB3YXNSdW5uaW5nID0gcHJldlJ1bm5pbmdNYXAuY3VycmVudC5nZXQoaWQpIHx8IGZhbHNlXG4gICAgICBjb25zdCBpc05vd1J1bm5pbmcgPSBCb29sZWFuKHNlc3Npb24/LnJ1bm5pbmcpXG5cbiAgICAgIC8vIFRyYW5zaXRpb246IHJ1bm5pbmcgdHJ1ZSAtPiBmYWxzZSB3aGlsZSBOT1QgYWN0aXZlIHNlc3Npb24gPT4gTWFyayBhcyBVbnJlYWRcbiAgICAgIGlmICh3YXNSdW5uaW5nICYmICFpc05vd1J1bm5pbmcgJiYgaWQgIT09IGFjdGl2ZVNlc3Npb25JZCkge1xuICAgICAgICBuZXdVbnJlYWQuYWRkKGlkKVxuICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBhY3RpdmUgc2Vzc2lvbiwgY2xlYXIgdW5yZWFkXG4gICAgICBpZiAoaWQgPT09IGFjdGl2ZVNlc3Npb25JZCAmJiBuZXdVbnJlYWQuaGFzKGlkKSkge1xuICAgICAgICBuZXdVbnJlYWQuZGVsZXRlKGlkKVxuICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBwcmV2UnVubmluZ01hcC5jdXJyZW50LnNldChpZCwgaXNOb3dSdW5uaW5nKVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBzZXRMb2NhbFVucmVhZFNldChuZXdVbnJlYWQpXG4gICAgfVxuICB9LCBbc2Vzc2lvbnNTdGF0ZS5ieUlkLCBhY3RpdmVTZXNzaW9uSWQsIGFyY2hpdmVkU2V0XSlcblxuICAvLyBDbGVhciB1bnJlYWQgb24gc2Vzc2lvbiBvcGVuXG4gIGNvbnN0IGhhbmRsZU9wZW5TZXNzaW9uID0gKHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGxvY2FsVW5yZWFkU2V0LmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChsb2NhbFVucmVhZFNldClcbiAgICAgIG5leHQuZGVsZXRlKHNlc3Npb25JZClcbiAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5leHQpXG4gICAgfVxuICAgIHByb3BzLm9wZW4/LihzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpdGVtcy5sZW5ndGggPiAwICYmIGV4cGFuZGVkV29ya3NwYWNlcy5zaXplID09PSAwKSB7XG4gICAgICBjb25zdCB0YXJnZXRJZCA9IHdvcmtzcGFjZXNTdGF0ZS5yZWNlbnRXb3Jrc3BhY2VJZCB8fCBpdGVtc1swXT8ud29ya3NwYWNlSWRcbiAgICAgIGlmICh0YXJnZXRJZCkge1xuICAgICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMobmV3IFNldChbdGFyZ2V0SWRdKSlcbiAgICAgICAgY29uc3QgZmlyc3QgPSBpdGVtcy5maW5kKCh3KSA9PiB3LndvcmtzcGFjZUlkID09PSB0YXJnZXRJZClcbiAgICAgICAgaWYgKGZpcnN0Py5wYXRoKSBnbG9iYWxUcmVlU3RvcmUubG9hZFdvcmtzcGFjZShmaXJzdC5wYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW2l0ZW1zLCB3b3Jrc3BhY2VzU3RhdGUucmVjZW50V29ya3NwYWNlSWRdKVxuXG4gIGNvbnN0IHRvZ2dsZVdvcmtzcGFjZSA9ICh3c0lkOiBzdHJpbmcsIHdzUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IG5ldyBTZXQoZXhwYW5kZWRXb3Jrc3BhY2VzKVxuICAgIGlmIChuZXh0Lmhhcyh3c0lkKSkge1xuICAgICAgbmV4dC5kZWxldGUod3NJZClcbiAgICAgIHNldFNob3dBbGxTZXNzaW9uc01hcCgocHJldikgPT4gKHsgLi4ucHJldiwgW3dzSWRdOiBmYWxzZSB9KSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC5hZGQod3NJZClcbiAgICAgIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKHdzUGF0aClcbiAgICB9XG4gICAgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzKG5leHQpXG4gIH1cblxuICBjb25zdCBoYW5kbGVDcmVhdGVGb2xkZXIgPSBhc3luYyAod3NQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobmV3Rm9sZGVyTmFtZS50cmltKCkpIHtcbiAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5jcmVhdGVGb2xkZXIod3NQYXRoLCBuZXdGb2xkZXJOYW1lLnRyaW0oKSlcbiAgICAgIHNldE5ld0ZvbGRlck5hbWUoJycpXG4gICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZVNhdmVSZW5hbWVXcyA9IGFzeW5jICh3c0lkOiBXb3Jrc3BhY2VJZCkgPT4ge1xuICAgIGlmIChlZGl0V3NUaXRsZS50cmltKCkgJiYgcHJvcHMucmVuYW1lV29ya3NwYWNlKSB7XG4gICAgICBhd2FpdCBwcm9wcy5yZW5hbWVXb3Jrc3BhY2Uod3NJZCwgZWRpdFdzVGl0bGUudHJpbSgpKVxuICAgIH1cbiAgICBzZXRFZGl0aW5nV3NJZChudWxsKVxuICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gIH1cblxuICBjb25zdCBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbiA9IGFzeW5jIChzZXNzaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChlZGl0U2Vzc2lvblRpdGxlLnRyaW0oKSAmJiBwcm9wcy5yZW5hbWVTZXNzaW9uKSB7XG4gICAgICBhd2FpdCBwcm9wcy5yZW5hbWVTZXNzaW9uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZCwgZWRpdFNlc3Npb25UaXRsZS50cmltKCkpXG4gICAgfVxuICAgIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgfVxuXG4gIC8vIFx1NTIyMFx1OTY2NFx1NEYxQVx1OEJERFx1RkYxQVx1NEVDRVx1NjcyQ1x1NTczMFx1NjU4N1x1NEVGNlx1NTkzOVx1NkUwNVx1OTY2NCArIFx1NEVDRVx1NjcyQVx1OEJGQlx1NkUwNVx1OTY2NCArIFx1OEMwM1x1NzUyOCBEU0ggXHU2ODM4XHU1RkMzXHU1RjUyXHU2ODYzXHU1MjIwXHU5NjY0XG4gIGNvbnN0IGhhbmRsZURlbGV0ZVNlc3Npb24gPSBhc3luYyAod3NQYXRoOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChsb2NhbFVucmVhZFNldC5oYXMoc2Vzc2lvbklkKSkge1xuICAgICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChsb2NhbFVucmVhZFNldClcbiAgICAgICAgbmV4dC5kZWxldGUoc2Vzc2lvbklkKVxuICAgICAgICBzZXRMb2NhbFVucmVhZFNldChuZXh0KVxuICAgICAgfVxuICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnB1cmdlU2Vzc2lvbih3c1BhdGgsIHNlc3Npb25JZClcbiAgICAgIGlmIChwcm9wcy5hcmNoaXZlU2Vzc2lvbikge1xuICAgICAgICBhd2FpdCBwcm9wcy5hcmNoaXZlU2Vzc2lvbihzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBEZWxldGUgc2Vzc2lvbiBmYWlsZWQ6JywgZXJyKVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1RDgzQ1x1REYxRiBcdTU3MjhcdTYzMDdcdTVCOUFcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdTY1QjBcdTVFRkFcdTRGMUFcdThCRERcdUZGMDhcdTc2RjRcdThGREUgY29ubmVjdFdvcmtzcGFjZSBcdTgzQjdcdTUzRDYgU2Vzc2lvbklkIFx1NUU3Nlx1NUY1Mlx1NTE2NVx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1OTZGNlx1NjVGNlx1NUU4Rlx1N0FERVx1NjAwMVx1RkYwOVxuICBjb25zdCBoYW5kbGVDcmVhdGVTZXNzaW9uSW5Gb2xkZXIgPSBhc3luYyAod3NJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKHByb3BzLnN0YXJ0U2Vzc2lvbkluRm9sZGVyKSB7XG4gICAgICBhd2FpdCBwcm9wcy5zdGFydFNlc3Npb25JbkZvbGRlcih3c0lkLCB3c1BhdGgsIGZvbGRlcklkKVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9wcy5zdGFydFNlc3Npb24/Lih3c0lkKVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1RDgzQ1x1REYxRiBcdTk4NzZcdTkwRThcdTZEM0JcdTUyQThcdTRFMEVcdTVGODVcdThCRkJcdTRFRkJcdTUyQTFcdTk2MUZcdTUyMTdcdUZGMDhcdThGREJcdTg4NENcdTRFMkQgLyBcdTVGODVcdTRFQTRcdTRFOTIgLyBcdTVERjJcdTVCOENcdTYyMTBcdTVGODVcdThCRkJcdUZGMENcdTcwQjlcdTUxRkJcdTk2MDVcdThCRkJcdTU0MEVcdTgxRUFcdTUyQThcdTZEODhcdTk2NjRcdUZGMDlcbiAgY29uc3QgYmFubmVyVGFza3MgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBsaXN0OiBCYW5uZXJUYXNrW10gPSBbXVxuICAgIGNvbnN0IGJ5SWQgPSBzZXNzaW9uc1N0YXRlLmJ5SWQgfHwge31cblxuICAgIGZvciAoY29uc3QgW3NJZCwgc2Vzc2lvbl0gb2YgT2JqZWN0LmVudHJpZXMoYnlJZCkpIHtcbiAgICAgIGlmIChhcmNoaXZlZFNldC5oYXMoc0lkKSkgY29udGludWVcbiAgICAgIGNvbnN0IGlzUnVubmluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZylcbiAgICAgIGNvbnN0IGlzUGVuZGluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucGVuZGluZ0ludGVyYWN0aW9uKVxuICAgICAgY29uc3QgaXNVbnJlYWRDb21wbGV0ZWQgPSAoQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQpIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzSWQpKSAmJiBzSWQgIT09IGFjdGl2ZVNlc3Npb25JZFxuXG4gICAgICBjb25zdCBvd25lcldzID0gaXRlbXMuZmluZCgodykgPT4gKHcuc2Vzc2lvbklkcyB8fCBbXSkuaW5jbHVkZXMoc0lkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKSlcbiAgICAgIGNvbnN0IHRpdGxlID0gc2Vzc2lvbj8udGl0bGUgfHwgc0lkLnNsaWNlKDAsIDE2KVxuXG4gICAgICBpZiAoaXNSdW5uaW5nKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAncnVubmluZycsIHdzOiBvd25lcldzIH0pXG4gICAgICB9IGVsc2UgaWYgKGlzUGVuZGluZykge1xuICAgICAgICBsaXN0LnB1c2goeyBzZXNzaW9uSWQ6IHNJZCwgdGl0bGUsIHN0YXR1czogJ3BlbmRpbmcnLCB3czogb3duZXJXcyB9KVxuICAgICAgfSBlbHNlIGlmIChpc1VucmVhZENvbXBsZXRlZCkge1xuICAgICAgICBsaXN0LnB1c2goeyBzZXNzaW9uSWQ6IHNJZCwgdGl0bGUsIHN0YXR1czogJ2NvbXBsZXRlZCcsIHdzOiBvd25lcldzIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXI6IFJlY29yZDwncnVubmluZycgfCAncGVuZGluZycgfCAnY29tcGxldGVkJywgbnVtYmVyPiA9IHsgcnVubmluZzogMCwgcGVuZGluZzogMSwgY29tcGxldGVkOiAyIH1cbiAgICByZXR1cm4gbGlzdC5zb3J0KChhLCBiKSA9PiAob3JkZXJbYS5zdGF0dXNdID8/IDApIC0gKG9yZGVyW2Iuc3RhdHVzXSA/PyAwKSlcbiAgfSwgW3Nlc3Npb25zU3RhdGUuYnlJZCwgaXRlbXMsIGxvY2FsVW5yZWFkU2V0LCBhY3RpdmVTZXNzaW9uSWQsIGFyY2hpdmVkU2V0XSlcblxuICAvLyBcdTcwQjlcdTUxRkJcdTRFRkJcdTUyQTFcdUZGMUFcdTRFMDBcdTk1MkVcdTVDNTVcdTVGMDBcdTVCRjlcdTVFOTRcdTVERTVcdTRGNUNcdTUzM0FcdTMwMDFcdTVDNTVcdTVGMDBcdTY1ODdcdTRFRjZcdTU5MzlcdTMwMDFcdTYyNTNcdTVGMDBcdTVCRjlcdThCRERcdTVFNzZcdTZEODhcdTk2NjRcdTY3MkFcdThCRkJcbiAgY29uc3QgaGFuZGxlSnVtcFRvQWN0aXZlVGFzayA9IChzZXNzaW9uSWQ6IHN0cmluZywgb3duZXJXcz86IFdvcmtzcGFjZVZpZXcpID0+IHtcbiAgICBpZiAob3duZXJXcykge1xuICAgICAgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzKChwcmV2KSA9PiBuZXcgU2V0KFsuLi5wcmV2LCBvd25lcldzLndvcmtzcGFjZUlkXSkpXG4gICAgICBjb25zdCBtZXRhID0gZ2xvYmFsVHJlZVN0b3JlLmdldE1ldGFGb3JXb3Jrc3BhY2Uob3duZXJXcy5wYXRoKVxuICAgICAgY29uc3QgdGFyZ2V0Rm9sZGVyID0gbWV0YS5mb2xkZXJzLmZpbmQoKGYpID0+IGYuc2Vzc2lvbklkcy5pbmNsdWRlcyhzZXNzaW9uSWQpKVxuICAgICAgaWYgKHRhcmdldEZvbGRlciAmJiB0YXJnZXRGb2xkZXIuY29sbGFwc2VkKSB7XG4gICAgICAgIGdsb2JhbFRyZWVTdG9yZS50b2dnbGVGb2xkZXIob3duZXJXcy5wYXRoLCB0YXJnZXRGb2xkZXIuaWQpXG4gICAgICB9XG4gICAgfVxuICAgIGhhbmRsZU9wZW5TZXNzaW9uKHNlc3Npb25JZClcbiAgfVxuXG4gIGNvbnN0IGZpbHRlcmVkV29ya3NwYWNlcyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghc2VhcmNoUXVlcnkudHJpbSgpKSByZXR1cm4gaXRlbXNcbiAgICBjb25zdCBxID0gc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKVxuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoKHdzKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaFRpdGxlID0gKHdzLnRpdGxlIHx8ICcnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICBjb25zdCBtYXRjaFNlc3Npb25zID0gKHdzLnNlc3Npb25JZHMgfHwgW10pLnNvbWUoKHNJZCkgPT4ge1xuICAgICAgICBjb25zdCBzaWRTdHIgPSBzSWQgYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhzaWRTdHIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgY29uc3QgdGl0bGUgPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzaWRTdHJdPy50aXRsZSB8fCAnJ1xuICAgICAgICByZXR1cm4gdGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBtYXRjaFRpdGxlIHx8IG1hdGNoU2Vzc2lvbnNcbiAgICB9KVxuICB9LCBbaXRlbXMsIHNlYXJjaFF1ZXJ5LCBzZXNzaW9uc1N0YXRlLmJ5SWQsIGFyY2hpdmVkU2V0XSlcblxuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgaGVpZ2h0OiAnMTAwJScsIG92ZXJmbG93WTogJ2F1dG8nLCB1c2VyU2VsZWN0OiAnbm9uZScsIGZvbnRGYW1pbHk6ICdpbmhlcml0JyB9fT5cbiAgICAgIHsvKiAxLiBIZWFkZXIgQmFyOiBcdTVERTVcdTRGNUNcdTUzM0EgKi99XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsIHBhZGRpbmc6ICcxMnB4IDE0cHggNnB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLCBmb250U2l6ZTogJzEzcHgnLCBmb250V2VpZ2h0OiA2MDAgfX0+XG4gICAgICAgIDxzcGFuPlx1NURFNVx1NEY1Q1x1NTMzQTwvc3Bhbj5cbiAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnIH19PlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHRpdGxlPVwiXHU2NDFDXHU3RDIyXHU1REU1XHU0RjVDXHU1MzNBXHU2MjE2XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dTZWFyY2goIXNob3dTZWFyY2gpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxTZWFyY2hJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogXHU3RDI3XHU1MUQxXHU2NDFDXHU3RDIyXHU4RjkzXHU1MTY1XHU2ODQ2ICovfVxuICAgICAge3Nob3dTZWFyY2ggJiYgKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcycHggMTBweCA2cHgnIH19PlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgIGhlaWdodDogJzI4cHgnLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHU2NDFDXHU3RDIyXHU1REU1XHU0RjVDXHU1MzNBXHU2MjE2XHU0RjFBXHU4QkRELi4uXCJcbiAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIDIuIFx1OTg3Nlx1OTBFOFx1NkQzQlx1NTJBOC9cdTVGODVcdThCRkJcdTRFRkJcdTUyQTEgKFx1NTM1NVx1ODg0Q1x1Njc4MVx1N0I4MFx1N0NCRVx1ODFGNFx1ODBGNlx1NTZDQSAyOHB4IFx1OUFEOFx1NUVBNlx1RkYwQ1x1OEZEQlx1ODg0Q1x1NEUyRC9cdTVGODVcdTc4NkVcdThCQTQvXHU1Rjg1XHU4QkZCKSAqL31cbiAgICAgIHtiYW5uZXJUYXNrcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnB4IDhweCA2cHgnLCBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgIHtiYW5uZXJUYXNrcy5tYXAoKHRhc2spID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmYgPSBUQVNLX1NUWUxFX0NPTkZJR1t0YXNrLnN0YXR1c11cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e3Rhc2suc2Vzc2lvbklkfVxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi5iZyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2NvbmYuYm9yZGVyfWAsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17YCR7Y29uZi50aXRsZVByZWZpeH0gKFx1NzBCOVx1NTFGQlx1NzZGNFx1OEZCRSR7dGFzay5zdGF0dXMgPT09ICdjb21wbGV0ZWQnID8gJ1x1NUU3Nlx1NkQ4OFx1OTY2NFx1NUY4NVx1OEJGQicgOiAnJ31cdUZGMENcdTRGNERcdTRFOEU6ICR7dGFzay53cz8udGl0bGUgfHwgJ1x1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQSd9KWB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlSnVtcFRvQWN0aXZlVGFzayh0YXNrLnNlc3Npb25JZCwgdGFzay53cyl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBjb25mLmhvdmVyQmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuaG92ZXJCb3JkZXJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZXZyb24gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnRhc2stY2hldnJvbicpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGNvbmYuYmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuYm9yZGVyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjaGV2cm9uID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy50YXNrLWNoZXZyb24nKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgaWYgKGNoZXZyb24pIGNoZXZyb24uc3R5bGUuY29sb3IgPSAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KSdcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSB9fT5cbiAgICAgICAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiB0YXNrLnN0YXR1cyA9PT0gJ3BlbmRpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UGVuZGluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxMnB4JywgZm9udFdlaWdodDogNTAwLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJyB9fT5cbiAgICAgICAgICAgICAgICAgICAge3Rhc2sudGl0bGV9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7dGFzay53cz8udGl0bGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIG9wYWNpdHk6IDAuOCB9fT5cbiAgICAgICAgICAgICAgICAgICAgICBcdTAwQjcge3Rhc2sud3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcsIGZsZXhTaHJpbms6IDAgfX0+XG4gICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbmYudGFnQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi50YWdCZyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMXB4IDVweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7Y29uZi50YWdUZXh0fVxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGFzay1jaGV2cm9uXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZ0xlZnQ6ICcycHgnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4xNXMgZWFzZScgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHRJY29uIHNpemU9ezExfSAvPlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogMy4gV29ya3NwYWNlcyBUcmVlIExpc3QgKi99XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzJweCcsIHBhZGRpbmc6ICcwIDZweCcgfX0+XG4gICAgICAgIHtmaWx0ZXJlZFdvcmtzcGFjZXMubWFwKCh3cykgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbmRlZFdvcmtzcGFjZXMuaGFzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1RDgzQ1x1REYxRiBcdThCRkJcdTUzRDZcdTZCQ0ZcdTRFMkFcdTVERTVcdTRGNUNcdTUzM0FcdTcyRUNcdTdBQ0JcdTc2ODRcdTUxNDNcdTY1NzBcdTYzNkVcdUZGMDhcdTZDMzhcdTRFNDVcdTdBMzNcdTVCOUFcdTVFMzhcdTlBN0JcdUZGMDlcbiAgICAgICAgICBjb25zdCB3c01ldGEgPSBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZSh3cy5wYXRoKVxuICAgICAgICAgIGNvbnN0IHdzUGlubmVkU2V0ID0gbmV3IFNldCh3c01ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSlcblxuICAgICAgICAgIGNvbnN0IHJhd1Nlc3Npb25zID0gKHdzLnNlc3Npb25JZHMgfHwgW10pLm1hcCgoc0lkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaWRTdHIgPSBzSWQgYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzaWRTdHJdXG4gICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzaWRTdHIpKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpZDogc2lkU3RyLFxuICAgICAgICAgICAgICB0aXRsZTogc2Vzc2lvbj8udGl0bGUgfHwgc2lkU3RyLnNsaWNlKDAsIDE2KSxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBzZXNzaW9uPy51cGRhdGVkQXQgfHwgMCxcbiAgICAgICAgICAgICAgcnVubmluZzogQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKSxcbiAgICAgICAgICAgICAgcGVuZGluZ0ludGVyYWN0aW9uOiBzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgIGNvbXBsZXRlZDogaXNVbnJlYWQgJiYgc2lkU3RyICE9PSBhY3RpdmVTZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGJsYW5rOiBCb29sZWFuKHNlc3Npb24/LmJsYW5rKSxcbiAgICAgICAgICAgICAgaXNQaW5uZWQ6IHdzUGlubmVkU2V0LmhhcyhzaWRTdHIpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCB2YWxpZFNlc3Npb25zID0gcmF3U2Vzc2lvbnNcbiAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAuZmlsdGVyKChzKSA9PiAhaXNCbGFua1BsYWNlaG9sZGVyKHMuaWQsIHMudGl0bGUsIHMuYmxhbmssIGFjdGl2ZVNlc3Npb25JZCA9PT0gcy5pZCkpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICBpZiAoYS5ydW5uaW5nICE9PSBiLnJ1bm5pbmcpIHJldHVybiBhLnJ1bm5pbmcgPyAtMSA6IDFcbiAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgIHJldHVybiAoYi51cGRhdGVkQXQgfHwgMCkgLSAoYS51cGRhdGVkQXQgfHwgMClcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCBjYXRlZ29yaXplZFNlc3Npb25JZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB3c01ldGEuZm9sZGVycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBzSWQgb2YgZi5zZXNzaW9uSWRzKSBjYXRlZ29yaXplZFNlc3Npb25JZHMuYWRkKHNJZClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgPSB2YWxpZFNlc3Npb25zLmZpbHRlcigocykgPT4gIWNhdGVnb3JpemVkU2Vzc2lvbklkcy5oYXMocy5pZCkpXG4gICAgICAgICAgY29uc3Qgc2hvd0FsbCA9IHNob3dBbGxTZXNzaW9uc01hcFt3cy53b3Jrc3BhY2VJZF0gfHwgZmFsc2VcbiAgICAgICAgICBjb25zdCB2aXNpYmxlVW5jYXRlZ29yaXplZCA9IHNob3dBbGwgPyB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgOiB1bmNhdGVnb3JpemVkU2Vzc2lvbnMuc2xpY2UoMCwgREVGQVVMVF9WSVNJQkxFX0xJTUlUKVxuICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0NvdW50ID0gdW5jYXRlZ29yaXplZFNlc3Npb25zLmxlbmd0aCAtIERFRkFVTFRfVklTSUJMRV9MSU1JVFxuXG4gICAgICAgICAgY29uc3QgcmVuZGVyTW92ZURyb3Bkb3duID0gKHNJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgIT09IHNJZCkgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIGNvbnN0IGlzQ2F0ZWdvcml6ZWQgPSBjYXRlZ29yaXplZFNlc3Npb25JZHMuaGFzKHNJZClcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICB0b3A6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgekluZGV4OiA5OTk5LFxuICAgICAgICAgICAgICAgICAgbWluV2lkdGg6ICcxNjBweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIsICMxZTI5M2IpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC40NSknLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICAgICAgICAgICAgICAgIGdhcDogJzJweCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZzogJzRweCA4cHgnLCBmb250V2VpZ2h0OiA2MDAsIGJvcmRlckJvdHRvbTogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyB9fT5cbiAgICAgICAgICAgICAgICAgIFx1NzlGQlx1NTJBOFx1ODFGM1x1NzZFRVx1NjgwN1x1NjU4N1x1NEVGNlx1NTkzOTpcbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7d3NNZXRhLmZvbGRlcnMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnNnB4IDhweCcsIGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScgfX0+XG4gICAgICAgICAgICAgICAgICAgIFx1NjY4Mlx1NjVFMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1OEJGN1x1NTE0OFx1NTIxQlx1NUVGQVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIHdzTWV0YS5mb2xkZXJzLm1hcCgoZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpblRoaXNGb2xkZXIgPSBmLnNlc3Npb25JZHMuaW5jbHVkZXMoc0lkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Zi5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpblRoaXNGb2xkZXIgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogaW5UaGlzRm9sZGVyID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjEyKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBpblRoaXNGb2xkZXIgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTIpJyA6ICd0cmFuc3BhcmVudCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBmLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxM30gY29sb3I9e2YuY29sb3IgfHwgJyM2MGE1ZmEnfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBmbGV4OiAxIH19PntmLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2luVGhpc0ZvbGRlciAmJiA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEwcHgnLCBjb2xvcjogJyM2MGE1ZmEnIH19Plx1MjcxMzwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgIHsvKiBcdTU5ODJcdTY3OUNcdTVERjJcdTdFQ0ZcdTU3MjhcdTY3RDBcdTRFMkFcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdUZGMENcdTY2M0VcdTc5M0FcdTc5RkJcdTUxRkFcdTkwMDlcdTk4NzkgKi99XG4gICAgICAgICAgICAgICAge2lzQ2F0ZWdvcml6ZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBnYXA6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjY2JkNWUxJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScsXG4gICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknKX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxNb3ZlT3V0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHU3OUZCXHU1MUZBXHU4MUYzXHU2NzJBXHU1MjA2XHU3QzdCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYga2V5PXt3cy53b3Jrc3BhY2VJZH0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgICAgICAgICAgey8qIFdvcmtzcGFjZSBSb3cgSXRlbSAqL31cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczNHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0V4cGFuZGVkID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA1MDAsXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aCl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucyAmJiBhY3RpdmVNZW51V3NJZCAhPT0gd3Mud29ya3NwYWNlSWQpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgc2l6ZT17MTJ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGlzRXhwYW5kZWQgPyAncm90YXRlKDkwZGVnKScgOiAncm90YXRlKDBkZWcpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEZvbGRlckljb24gc2l6ZT17MTV9IGNvbG9yPVwiIzYwYTVmYVwiIHN0eWxlPXt7IGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgIHtlZGl0aW5nV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdFdzVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0V3NUaXRsZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lV3Mod3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVdzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19IHRpdGxlPXt3cy5wYXRofT5cbiAgICAgICAgICAgICAgICAgICAgICB7d3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIEFjdGlvbiBCdXR0b25zICovfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIndzLWFjdGlvbnNcIlxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgZGlzcGxheTogYWN0aXZlTWVudVdzSWQgPT09IHdzLndvcmtzcGFjZUlkID8gJ2lubGluZS1mbGV4JyA6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTcyOFx1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQVx1NjVCMFx1NUVGQVx1NTIwNlx1N0M3Qlx1NjU4N1x1NEVGNlx1NTkzOVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRXhwYW5kZWQpIHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZCh3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPEFkZEZvbGRlckljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzLndvcmtzcGFjZUlkKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFBsdXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTY2RjRcdTU5MUFcdTY0Q0RcdTRGNUNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVNZW51V3NJZChhY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyBudWxsIDogd3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8RWxsaXBzaXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogXHU1RjM5XHU1MUZBXHU4M0RDXHU1MzU1ICovfVxuICAgICAgICAgICAgICAgIHthY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICByZWY9e21lbnVSZWZ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHRvcDogJzMycHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHpJbmRleDogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctc3VyZmFjZS0wLCAjMTgxODE4KScsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHZhcigtLWRzdy1ib3JkZXItZGVmYXVsdCwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KSknLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnMCA2cHggMjBweCByZ2JhKDAsIDAsIDAsIDAuNDUpJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzEyMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcEZpbHRlcjogJ2JsdXIoMTJweCknLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDEwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCkpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1dzSWQod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0V3NUaXRsZSh3cy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxM30gLz5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTkxQ0RcdTU0N0RcdTU0MEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZjg3MTcxJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI0OCwgMTEzLCAxMTMsIDAuMTIpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZGVsZXRlV29ya3NwYWNlPy4od3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1NTIyMFx1OTY2NFx1NURFNVx1NEY1Q1x1NTMzQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIENvbnRlbnQgKEZvbGRlcnMgKyBTZXNzaW9ucykgKi99XG4gICAgICAgICAgICAgIHtpc0V4cGFuZGVkICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzFweCcsIHBhZGRpbmdMZWZ0OiAnMTRweCcgfX0+XG4gICAgICAgICAgICAgICAgICB7LyogSW5saW5lIE5ldyBGb2xkZXIgSW5wdXQgRm9ybSAqL31cbiAgICAgICAgICAgICAgICAgIHtpc0NyZWF0aW5nRm9sZGVyV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICc0cHggNnB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1OEY5M1x1NTE2NVx1NjU4N1x1NEVGNlx1NTkzOVx1NTQwRFx1NzlGMCAoXHU1NkRFXHU4RjY2XHU1MjFCXHU1RUZBLCBFU0NcdTUzRDZcdTZEODgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtuZXdGb2xkZXJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdGb2xkZXJOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdGb2xkZXJOYW1lLnRyaW0oKSkgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQS4gVmlydHVhbCBGb2xkZXJzICovfVxuICAgICAgICAgICAgICAgICAge3dzTWV0YS5mb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvbGRlclNlc3Npb25zID0gZm9sZGVyLnNlc3Npb25JZHNcbiAgICAgICAgICAgICAgICAgICAgICAubWFwKChzSWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzSWQgYXMgdW5rbm93biBhcyBzdHJpbmddXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzSWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHNJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHNlc3Npb24/LnRpdGxlIHx8IHNJZC5zbGljZSgwLCAxNiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogc2Vzc2lvbj8udXBkYXRlZEF0IHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmc6IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdJbnRlcmFjdGlvbjogc2Vzc2lvbj8ucGVuZGluZ0ludGVyYWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IGlzVW5yZWFkICYmIHNJZCAhPT0gYWN0aXZlU2Vzc2lvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBibGFuazogQm9vbGVhbihzZXNzaW9uPy5ibGFuayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlzUGlubmVkOiB3c1Bpbm5lZFNldC5oYXMoc0lkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnJ1bm5pbmcgIT09IGIucnVubmluZykgcmV0dXJuIGEucnVubmluZyA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGIudXBkYXRlZEF0IHx8IDApIC0gKGEudXBkYXRlZEF0IHx8IDApXG4gICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtmb2xkZXIuaWR9IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogRm9sZGVyIEhlYWRlciBSb3cgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBkcmFnT3ZlclRhcmdldCA9PT0gZm9sZGVyLmlkID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjOTNjNWZkKScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBkcmFnT3ZlclRhcmdldCA9PT0gZm9sZGVyLmlkID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE4KScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZHJhZ092ZXJUYXJnZXQgPT09IGZvbGRlci5pZCA/ICcxcHggZGFzaGVkICM2MGE1ZmEnIDogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5mb2xkZXItYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbnMpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZvbGRlci1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ092ZXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFnT3ZlclRhcmdldCAhPT0gZm9sZGVyLmlkKSBzZXREcmFnT3ZlclRhcmdldChmb2xkZXIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ0xlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZS5jdXJyZW50VGFyZ2V0LmNvbnRhaW5zKGUucmVsYXRlZFRhcmdldCBhcyBOb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdPdmVyVGFyZ2V0ID09PSBmb2xkZXIuaWQpIHNldERyYWdPdmVyVGFyZ2V0KG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyb3A9e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyYWdPdmVyVGFyZ2V0KG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc0lkID0gZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpIHx8IGRyYWdnaW5nU2Vzc2lvbklkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RHJhZ2dpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc0lkKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBmb2xkZXIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9ezEwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGRyYWdPdmVyVGFyZ2V0ID09PSBmb2xkZXIuaWQgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogZm9sZGVyLmNvbGxhcHNlZCA/ICdyb3RhdGUoMGRlZyknIDogJ3JvdGF0ZSg5MGRlZyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb2xkZXJJY29uIHNpemU9ezE0fSBjb2xvcj17ZHJhZ092ZXJUYXJnZXQgPT09IGZvbGRlci5pZCA/ICcjNjBhNWZhJyA6IChmb2xkZXIuY29sb3IgfHwgJyM2MGE1ZmEnKX0gc3R5bGU9e3sgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nRm9sZGVySWQgPT09IGZvbGRlci5pZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRGb2xkZXJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRGb2xkZXJOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRGb2xkZXJOYW1lLnRyaW0oKSkgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnJlbmFtZUZvbGRlcih3cy5wYXRoLCBmb2xkZXIuaWQsIGVkaXRGb2xkZXJOYW1lLnRyaW0oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nRm9sZGVySWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRGb2xkZXJOYW1lLnRyaW0oKSkgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnJlbmFtZUZvbGRlcih3cy5wYXRoLCBmb2xkZXIuaWQsIGVkaXRGb2xkZXJOYW1lLnRyaW0oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nRm9sZGVySWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGZvbnRXZWlnaHQ6IDUwMCB9fSBvbkRvdWJsZUNsaWNrPXsoKSA9PiB7IHNldEVkaXRpbmdGb2xkZXJJZChmb2xkZXIuaWQpOyBzZXRFZGl0Rm9sZGVyTmFtZShmb2xkZXIubmFtZSkgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmb2xkZXIubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScgfX0+KHtmb2xkZXJTZXNzaW9ucy5sZW5ndGh9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZHJhZ092ZXJUYXJnZXQgPT09IGZvbGRlci5pZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEwcHgnLCBjb2xvcjogJyM2MGE1ZmEnLCBmb250V2VpZ2h0OiA2MDAsIHBhZGRpbmdMZWZ0OiAnNHB4JyB9fT5cdTY3N0VcdTVGMDBcdTc5RkJcdTUxNjVcdTZCNjRcdTU5MDQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1RDgzQ1x1REYxRiBcdTY1ODdcdTRFRjZcdTU5MzlcdTY0Q0RcdTRGNUNcdTY4MEZcdUZGMUFcdTUzMDVcdTU0MkIgWytdIFx1NTcyOFx1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NzZGNFx1NjNBNVx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb2xkZXItYWN0aW9uc1wiIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX0gb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTcyOFx1NkI2NFx1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVDcmVhdGVTZXNzaW9uSW5Gb2xkZXIod3Mud29ya3NwYWNlSWQsIHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBsdXNJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1OTFDRFx1NTQ3RFx1NTQwRFx1NjU4N1x1NEVGNlx1NTkzOVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldEVkaXRpbmdGb2xkZXJJZChmb2xkZXIuaWQpOyBzZXRFZGl0Rm9sZGVyTmFtZShmb2xkZXIubmFtZSkgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAnI2Y4NzE3MScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JywgZGlzcGxheTogJ2lubGluZS1mbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU1OTM5IChcdTUxODVcdTkwRThcdTRGMUFcdThCRERcdThGRDRcdTU2REVcdTY3MkFcdTUyMDZcdTdDN0IpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdsb2JhbFRyZWVTdG9yZS5kZWxldGVGb2xkZXIod3MucGF0aCwgZm9sZGVyLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogRm9sZGVyIEludGVybmFsIFNlc3Npb25zICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyFmb2xkZXIuY29sbGFwc2VkICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogJzE2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0OiBmb2xkZXJTZXNzaW9ucy5sZW5ndGggPT09IDAgPyAnMjRweCcgOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdPdmVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJhZ092ZXJUYXJnZXQgIT09IGZvbGRlci5pZCkgc2V0RHJhZ092ZXJUYXJnZXQoZm9sZGVyLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWUuY3VycmVudFRhcmdldC5jb250YWlucyhlLnJlbGF0ZWRUYXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdPdmVyVGFyZ2V0ID09PSBmb2xkZXIuaWQpIHNldERyYWdPdmVyVGFyZ2V0KG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyb3A9e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyYWdPdmVyVGFyZ2V0KG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzSWQgPSBlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJykgfHwgZHJhZ2dpbmdTZXNzaW9uSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyYWdnaW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc0lkKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBmb2xkZXIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmb2xkZXJTZXNzaW9ucy5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWxUaW1lID0gZm9ybWF0UmVsYXRpdmVUaW1lKHMudXBkYXRlZEF0KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZT17ZWRpdGluZ1Nlc3Npb25JZCAhPT0gcy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ2dyYWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogaXNBY3RpdmUgPyAndmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDI1NSwyNTUsMjU1LDAuMDYpKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjOTNjNWZkKScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNjYmQ1ZTEpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBpc0FjdGl2ZSA/IDYwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IGRyYWdnaW5nU2Vzc2lvbklkID09PSBzLmlkID8gMC4zNSA6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGRyYWdnaW5nU2Vzc2lvbklkID09PSBzLmlkID8gJzFweCBkYXNoZWQgIzYwYTVmYScgOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlT3BlblNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRTZXNzaW9uVGl0bGUocy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0KSBhY3Quc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnU3RhcnQ9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyYWdnaW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdFbmQ9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERyYWdnaW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnT3ZlclRhcmdldChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MucnVubmluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJ1bm5pbmdEb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5jb21wbGV0ZWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5pc1Bpbm5lZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17dHJ1ZX0gc3R5bGU9e3sgY29sb3I6ICcjZmJiZjI0JywgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoYXRJY29uIHNpemU9ezEzfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCBvcGFjaXR5OiAwLjYgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0U2Vzc2lvblRpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IGhhbmRsZVNhdmVSZW5hbWVTZXNzaW9uKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwic2Vzcy10aW1lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBzLnJ1bm5pbmcgPyAnIzYwYTVmYScgOiBzLmNvbXBsZXRlZCA/ICcjNGFkZTgwJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gJ1x1NzUxRlx1NjIxMFx1NEUyRCcgOiBzLmNvbXBsZXRlZCA/ICdcdTVERjJcdTVCOENcdTYyMTAnIDogcmVsVGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NEYxQVx1OEJERFx1NjBBQ1x1NTA1Q1x1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVx1N0VDNCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlc3MtYWN0XCIgc3R5bGU9e3sgZGlzcGxheTogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiBzLmlzUGlubmVkID8gJyNmYmJmMjQnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3MuaXNQaW5uZWQgPyAnXHU1M0Q2XHU2RDg4XHU3RjZFXHU5ODc2JyA6ICdcdTdGNkVcdTk4NzZcdTRGMUFcdThCREQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlUGluU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXtzLmlzUGlubmVkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIwNlx1NTNDOVx1NEYxQVx1OEJERCAoRm9yaylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JrU2Vzc2lvbj8uKHMuaWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JrSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NzlGQlx1NTJBOFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjJDOVx1ODNEQ1x1NTM1NVx1NjMwOVx1OTRBRSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gJyM2MGE1ZmEnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NTE3Nlx1NEVENlx1NjU4N1x1NEVGNlx1NTkzOVx1NjIxNlx1NjcyQVx1NTIwNlx1N0M3Qi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlbmRlck1vdmVEcm9wZG93bihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICcjZjg3MTcxJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQi4gVW5jYXRlZ29yaXplZCBTZXNzaW9ucyAoU29ydGVkIGJ5IHRpbWUgKyBQaW5uZWQgRmlyc3QgKyAxMCBMaW1pdCkgKi99XG4gICAgICAgICAgICAgICAgICB7LyogXHVEODNDXHVERjFGIFx1NjJENlx1NjJGRFx1OTFDQVx1NjUzRVx1ODFGM1x1NjcyQVx1NTIwNlx1N0M3Qlx1NEUxM1x1NUM1RVx1NjNEMFx1NzkzQVx1NTMzQVx1NTdERiAqL31cbiAgICAgICAgICAgICAgICAgIHtkcmFnZ2luZ1Nlc3Npb25JZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAnNHB4IDAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGRyYWdPdmVyVGFyZ2V0ID09PSBgcm9vdDoke3dzLndvcmtzcGFjZUlkfWAgPyAnMXB4IGRhc2hlZCAjNjBhNWZhJyA6ICcxcHggZGFzaGVkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogZHJhZ092ZXJUYXJnZXQgPT09IGByb290OiR7d3Mud29ya3NwYWNlSWR9YCA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xNiknIDogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGRyYWdPdmVyVGFyZ2V0ID09PSBgcm9vdDoke3dzLndvcmtzcGFjZUlkfWAgPyAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWJ1c2luZXNzLXByaW1hcnksICM5M2M1ZmQpJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdPdmVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJhZ092ZXJUYXJnZXQgIT09IGByb290OiR7d3Mud29ya3NwYWNlSWR9YCkgc2V0RHJhZ092ZXJUYXJnZXQoYHJvb3Q6JHt3cy53b3Jrc3BhY2VJZH1gKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25EcmFnTGVhdmU9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFnT3ZlclRhcmdldCA9PT0gYHJvb3Q6JHt3cy53b3Jrc3BhY2VJZH1gKSBzZXREcmFnT3ZlclRhcmdldChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Ecm9wPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnT3ZlclRhcmdldChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc0lkID0gZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpIHx8IGRyYWdnaW5nU2Vzc2lvbklkXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnZ2luZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNJZCkgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLm1vdmVTZXNzaW9uKHdzLnBhdGgsIHNJZCwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPE1vdmVPdXRJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntkcmFnT3ZlclRhcmdldCA9PT0gYHJvb3Q6JHt3cy53b3Jrc3BhY2VJZH1gID8gJ1x1Njc3RVx1NUYwMFx1NzlGQlx1NTFGQVx1ODFGM1x1NjcyQVx1NTIwNlx1N0M3QicgOiAnXHU2MkQ2XHU2NTNFXHU1MjMwXHU2QjY0XHU1OTA0IFx1NzlGQlx1NTFGQVx1NEYxQVx1OEJERFx1ODFGM1x1NjcyQVx1NTIwNlx1N0M3Qid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHt2aXNpYmxlVW5jYXRlZ29yaXplZC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmVTZXNzaW9uSWQgPT09IHMuaWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsVGltZSA9IGZvcm1hdFJlbGF0aXZlVGltZShzLnVwZGF0ZWRBdClcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZT17ZWRpdGluZ1Nlc3Npb25JZCAhPT0gcy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdncmFiJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzQWN0aXZlID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjOTNjNWZkKScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNjYmQ1ZTEpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogaXNBY3RpdmUgPyA2MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IGRyYWdnaW5nU2Vzc2lvbklkID09PSBzLmlkID8gMC4zNSA6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZHJhZ2dpbmdTZXNzaW9uSWQgPT09IHMuaWQgPyAnMXB4IGRhc2hlZCAjNjBhNWZhJyA6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVPcGVuU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3QgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtYWN0JykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtKSB0bS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdTdGFydD17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnZ2luZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ0VuZD17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnZ2luZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREcmFnT3ZlclRhcmdldChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSdW5uaW5nRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBlbmRpbmdEb3QgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IHMuY29tcGxldGVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmlzUGlubmVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3RydWV9IHN0eWxlPXt7IGNvbG9yOiAnI2ZiYmYyNCcsIGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hhdEljb24gc2l6ZT17MTN9IHN0eWxlPXt7IGZsZXhTaHJpbms6IDAsIG9wYWNpdHk6IDAuNiB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRTZXNzaW9uVGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbihzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInNlc3MtdGltZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogcy5ydW5uaW5nID8gJyM2MGE1ZmEnIDogcy5jb21wbGV0ZWQgPyAnIzRhZGU4MCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnJ1bm5pbmcgPyAnXHU3NTFGXHU2MjEwXHU0RTJEJyA6IHMuY29tcGxldGVkID8gJ1x1NURGMlx1NUI4Q1x1NjIxMCcgOiByZWxUaW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU0RjFBXHU4QkREXHU2MEFDXHU1MDVDXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXHU3RUM0ICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzZXNzLWFjdFwiIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6IHMuaXNQaW5uZWQgPyAnI2ZiYmYyNCcgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtzLmlzUGlubmVkID8gJ1x1NTNENlx1NkQ4OFx1N0Y2RVx1OTg3NicgOiAnXHU3RjZFXHU5ODc2XHU0RjFBXHU4QkREJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnRvZ2dsZVBpblNlc3Npb24od3MucGF0aCwgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17cy5pc1Bpbm5lZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMDZcdTUzQzlcdTRGMUFcdThCREQgKEZvcmspXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZm9ya1Nlc3Npb24/LihzLmlkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ya0ljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHU3OUZCXHU1MkE4XHU4MUYzXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2MkM5XHU4M0RDXHU1MzU1XHU2MzA5XHU5NEFFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAncmVsYXRpdmUnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1vdmUtbWVudS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOS4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZW5kZXJNb3ZlRHJvcGRvd24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAnI2Y4NzE3MScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICB9KX1cblxuICAgICAgICAgICAgICAgICAgey8qIFx1NUM1NVx1NUYwMFx1NTE3Nlx1NEY1OSBOIFx1NEUyQVx1NEYxQVx1OEJERCAqL31cbiAgICAgICAgICAgICAgICAgIHshc2hvd0FsbCAmJiByZW1haW5pbmdDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmNvbG9yID0gJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QWxsU2Vzc2lvbnNNYXAoKHByZXYpID0+ICh7IC4uLnByZXYsIFt3cy53b3Jrc3BhY2VJZF06IHRydWUgfSkpfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgXHU1QzU1XHU1RjAwXHU1MTc2XHU0RjU5IHtyZW1haW5pbmdDb3VudH0gXHU0RTJBXHU0RjFBXHU4QkREXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIClcbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuIiwgIi8qKlxuICogQ2xpZW50IEFQSSBicmlkZ2UgZm9yIGRzaC13b3Jrc3BhY2UtdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN1YnByb2plY3RJbmZvLCBXb3Jrc3BhY2VUcmVlTWV0YSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcblxuZXhwb3J0IGNvbnN0IFJPVVRFX1BSRUZJWCA9ICcvYXBpL2RzaC13b3Jrc3BhY2UtdHJlZSdcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoVHJlZU1ldGEod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTxXb3Jrc3BhY2VUcmVlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L21ldGE/d29ya3NwYWNlUm9vdD0ke2VuY29kZVVSSUNvbXBvbmVudCh3b3Jrc3BhY2VSb290KX1gKVxuICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBtZXRhOiBXb3Jrc3BhY2VUcmVlTWV0YSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24ubWV0YSA6IG51bGxcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gZmV0Y2ggbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVRyZWVNZXRhKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEpOiBQcm9taXNlPFdvcmtzcGFjZVRyZWVNZXRhIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vbWV0YWAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHdvcmtzcGFjZVJvb3QsIG1ldGEgfSksXG4gICAgfSlcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEgfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLm1ldGEgOiBudWxsXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRmFpbGVkIHRvIHNhdmUgbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhblN1YnByb2plY3RzKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8U3VicHJvamVjdEluZm9bXT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vc2Nhbj93b3Jrc3BhY2VSb290PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdvcmtzcGFjZVJvb3QpfWApXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBbXVxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBzdWJwcm9qZWN0czogU3VicHJvamVjdEluZm9bXSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24uc3VicHJvamVjdHMgOiBbXVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIEZhaWxlZCB0byBzY2FuIHN1YnByb2plY3RzOicsIGVycilcbiAgICByZXR1cm4gW11cbiAgfVxufVxuIiwgIi8qKlxuICogTXVsdGktV29ya3NwYWNlIFJlYWN0aXZlIFRyZWVTdG9yZSBmb3IgbWFuYWdpbmcgdmlydHVhbCBmb2xkZXJzLCBzdWJwcm9qZWN0cyxcbiAqIGFuZCBzZXNzaW9uIHBsYWNlbWVudHMgYWNyb3NzIGFsbCB3b3Jrc3BhY2VzIGNvbmN1cnJlbnRseS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFdvcmtzcGFjZVRyZWVNZXRhLCBTdWJwcm9qZWN0SW5mbyB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcbmltcG9ydCB7IGZldGNoVHJlZU1ldGEsIHNhdmVUcmVlTWV0YSwgc2NhblN1YnByb2plY3RzIH0gZnJvbSAnLi9hcGkudHMnXG5cbmV4cG9ydCB0eXBlIExpc3RlbmVyID0gKCkgPT4gdm9pZFxuXG5jb25zdCBERUZBVUxUX01FVEEgPSAod29ya3NwYWNlUm9vdDogc3RyaW5nKTogV29ya3NwYWNlVHJlZU1ldGEgPT4gKHtcbiAgdmVyc2lvbjogMSxcbiAgaW5ib3hTZXNzaW9uSWRzOiBbXSxcbiAgcGlubmVkU2Vzc2lvbklkczogW10sXG4gIGZvbGRlcnM6IFtdLFxuICBzdWJwcm9qZWN0czogW10sXG4gIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbn0pXG5cbmV4cG9ydCBjbGFzcyBUcmVlU3RvcmUge1xuICBwcml2YXRlIGNhY2hlOiBNYXA8c3RyaW5nLCBXb3Jrc3BhY2VUcmVlTWV0YT4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSBsaXN0ZW5lcnM6IFNldDxMaXN0ZW5lcj4gPSBuZXcgU2V0KClcbiAgcHJpdmF0ZSBpc1NhdmluZ01hcDogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSB2ZXJzaW9uID0gMFxuXG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBnZXRWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvblxuICB9XG5cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHRoaXMudmVyc2lvbisrXG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgbGlzdGVuZXIoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbWV0YWRhdGEgZm9yIGEgc3BlY2lmaWMgd29ya3NwYWNlIHBhdGguXG4gICAqL1xuICBnZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFdvcmtzcGFjZVRyZWVNZXRhIHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QpIHJldHVybiBERUZBVUxUX01FVEEoJycpXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNhY2hlLmdldCh3b3Jrc3BhY2VSb290KVxuICAgIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nXG5cbiAgICBjb25zdCBmcmVzaCA9IERFRkFVTFRfTUVUQSh3b3Jrc3BhY2VSb290KVxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIGZyZXNoKVxuICAgIC8vIEFzeW5jIGxvYWQgaW4gYmFja2dyb3VuZFxuICAgIHRoaXMubG9hZFdvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIHJldHVybiBmcmVzaFxuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgbWV0YWRhdGEgZnJvbSBiYWNrZW5kIGZvciBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGxvYWRXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290KSByZXR1cm5cbiAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBmZXRjaFRyZWVNZXRhKHdvcmtzcGFjZVJvb3QpXG4gICAgaWYgKGxvYWRlZCkge1xuICAgICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwge1xuICAgICAgICAuLi5sb2FkZWQsXG4gICAgICAgIHBpbm5lZFNlc3Npb25JZHM6IEFycmF5LmlzQXJyYXkobG9hZGVkLnBpbm5lZFNlc3Npb25JZHMpID8gbG9hZGVkLnBpbm5lZFNlc3Npb25JZHMgOiBbXSxcbiAgICAgIH0pXG4gICAgICB0aGlzLm5vdGlmeSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBmb2xkZXIgdW5kZXIgYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGNvbG9yOiBzdHJpbmcgPSAnIzYwYTVmYScpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB0cmltbWVkID0gbmFtZS50cmltKCkgfHwgJ1x1NjVCMFx1NUVGQVx1NjU4N1x1NEVGNlx1NTkzOSdcbiAgICBjb25zdCBpZCA9IGBmLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gXG4gICAgY29uc3QgbmV3Rm9sZGVyOiBWaXJ0dWFsRm9sZGVyID0ge1xuICAgICAgaWQsXG4gICAgICBuYW1lOiB0cmltbWVkLFxuICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgIGNvbG9yLFxuICAgICAgc2Vzc2lvbklkczogW10sXG4gICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogWy4uLm1ldGEuZm9sZGVycywgbmV3Rm9sZGVyXSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyByZW5hbWVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpXG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm5cblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgbmFtZTogdHJpbW1lZCB9IDogZikpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIGZvbGRlciBpbiBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUZvbGRlcih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogbWV0YS5mb2xkZXJzLmZpbHRlcigoZikgPT4gZi5pZCAhPT0gZm9sZGVySWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBjb2xsYXBzZSBzdGF0dXMgb2YgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sbGFwc2VkOiAhZi5jb2xsYXBzZWQgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29sb3IgZm9yIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgc2V0Rm9sZGVyQ29sb3Iod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBjb2xvcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sb3IgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlIGEgc2Vzc2lvbiBpbnRvIGEgc3BlY2lmaWMgZm9sZGVyIG9yIHRvIHVuY2F0ZWdvcml6ZWQgKHRhcmdldEZvbGRlcklkID0gbnVsbCkuXG4gICAqL1xuICBhc3luYyBtb3ZlU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nLCB0YXJnZXRGb2xkZXJJZDogc3RyaW5nIHwgbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkRm9sZGVycyA9IG1ldGEuZm9sZGVycy5tYXAoKGZvbGRlcikgPT4ge1xuICAgICAgY29uc3QgZmlsdGVyZWQgPSBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKVxuICAgICAgaWYgKHRhcmdldEZvbGRlcklkICE9PSBudWxsICYmIGZvbGRlci5pZCA9PT0gdGFyZ2V0Rm9sZGVySWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5mb2xkZXIsXG4gICAgICAgICAgY29sbGFwc2VkOiBmYWxzZSwgLy8gXHVEODNDXHVERjFGIFx1NzlGQlx1NTE2NVx1NjIxNlx1NjVCMFx1NUVGQVx1NjVGNlx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1NEYxQVx1OEJERFx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgICAgICAgIHNlc3Npb25JZHM6IFtzZXNzaW9uSWQsIC4uLmZpbHRlcmVkXSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uZm9sZGVyLFxuICAgICAgICBzZXNzaW9uSWRzOiBmaWx0ZXJlZCxcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogdXBkYXRlZEZvbGRlcnMsXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3bHkgY3JlYXRlZCBzZXNzaW9uIGRpcmVjdGx5IGludG8gYSBmb2xkZXIuXG4gICAqL1xuICBhc3luYyBhZGRTZXNzaW9uVG9Gb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubW92ZVNlc3Npb24od29ya3NwYWNlUm9vdCwgc2Vzc2lvbklkLCBmb2xkZXJJZClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgcGlubmVkIHN0YXR1cyBvZiBhIHNlc3Npb24gaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVQaW5TZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgY3VycmVudFBpbm5lZCA9IG5ldyBTZXQobWV0YS5waW5uZWRTZXNzaW9uSWRzIHx8IFtdKVxuICAgIGlmIChjdXJyZW50UGlubmVkLmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICBjdXJyZW50UGlubmVkLmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRQaW5uZWQuYWRkKHNlc3Npb25JZClcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBwaW5uZWRTZXNzaW9uSWRzOiBBcnJheS5mcm9tKGN1cnJlbnRQaW5uZWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlbHkgcmVtb3ZlIGEgZGVsZXRlZCBzZXNzaW9uIGZyb20gYWxsIGZvbGRlcnMgYW5kIHBpbm5lZCBsaXN0IGluIGEgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgcHVyZ2VTZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZEZvbGRlcnMgPSBtZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+ICh7XG4gICAgICAuLi5mb2xkZXIsXG4gICAgICBzZXNzaW9uSWRzOiBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKSxcbiAgICB9KSlcbiAgICBjb25zdCB1cGRhdGVkUGlubmVkID0gKG1ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSkuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZClcblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IHVwZGF0ZWRGb2xkZXJzLFxuICAgICAgcGlubmVkU2Vzc2lvbklkczogdXBkYXRlZFBpbm5lZCxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QgfHwgdGhpcy5pc1NhdmluZ01hcC5nZXQod29ya3NwYWNlUm9vdCkpIHJldHVyblxuICAgIHRoaXMuaXNTYXZpbmdNYXAuc2V0KHdvcmtzcGFjZVJvb3QsIHRydWUpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICAgIGF3YWl0IHNhdmVUcmVlTWV0YSh3b3Jrc3BhY2VSb290LCBtZXRhKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlzU2F2aW5nTWFwLnNldCh3b3Jrc3BhY2VSb290LCBmYWxzZSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdsb2JhbFRyZWVTdG9yZSA9IG5ldyBUcmVlU3RvcmUoKVxuIiwgIi8qKlxuICogRm9ybWF0IHRpbWVzdGFtcCBpbnRvIGNvbmNpc2UgcmVsYXRpdmUgdGltZSBtYXRjaGluZyBEU0ggc3R5bGUgKFwiXHU1MjFBXHU1MjFBXCIsIFwiNVx1NTIwNlx1OTQ5RlwiLCBcIjE2XHU1QzBGXHU2NUY2XCIsIFwiXHU2NjI4XHU1OTI5XCIsIFwiM1x1NTkyOVx1NTI0RFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFJlbGF0aXZlVGltZSh0aW1lc3RhbXA/OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoIXRpbWVzdGFtcCB8fCB0eXBlb2YgdGltZXN0YW1wICE9PSAnbnVtYmVyJykgcmV0dXJuICcnXG4gIGNvbnN0IGRpZmYgPSBEYXRlLm5vdygpIC0gdGltZXN0YW1wXG4gIGlmIChkaWZmIDwgMCkgcmV0dXJuICdcdTUyMUFcdTUyMUEnXG5cbiAgY29uc3Qgc2VjID0gTWF0aC5mbG9vcihkaWZmIC8gMTAwMClcbiAgaWYgKHNlYyA8IDYwKSByZXR1cm4gJ1x1NTIxQVx1NTIxQSdcblxuICBjb25zdCBtaW4gPSBNYXRoLmZsb29yKHNlYyAvIDYwKVxuICBpZiAobWluIDwgNjApIHJldHVybiBgJHttaW59XHU1MjA2XHU5NDlGYFxuXG4gIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW4gLyA2MClcbiAgaWYgKGhvdXJzIDwgMjQpIHJldHVybiBgJHtob3Vyc31cdTVDMEZcdTY1RjZgXG5cbiAgY29uc3QgZGF5cyA9IE1hdGguZmxvb3IoaG91cnMgLyAyNClcbiAgaWYgKGRheXMgPT09IDEpIHJldHVybiAnXHU2NjI4XHU1OTI5J1xuICBpZiAoZGF5cyA8IDMwKSByZXR1cm4gYCR7ZGF5c31cdTU5MjlcdTUyNERgXG5cbiAgY29uc3QgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgcmV0dXJuIGAke2QuZ2V0TW9udGgoKSArIDF9LyR7ZC5nZXREYXRlKCl9YFxufVxuIiwgImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcblxuZXhwb3J0IGNvbnN0IENoZXZyb25SaWdodEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgY2xhc3NOYW1lPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDMuNUwxMC41IDhMNiAxMi41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBGb2xkZXJJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IGNvbG9yPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTUsXG4gIGNvbG9yLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3sgY29sb3I6IGNvbG9yIHx8ICdjdXJyZW50Q29sb3InLCAuLi5zdHlsZSB9fVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgZmlsbD17Y29sb3IgPyBgJHtjb2xvcn0yMmAgOiAnY3VycmVudENvbG9yJ31cbiAgICAgIGZpbGxPcGFjaXR5PXtjb2xvciA/IDAuMiA6IDAuMX1cbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQ2hhdEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMyA0QzMgMy40NDc3MiAzLjQ0NzcyIDMgNCAzSDEyQzEyLjU1MjMgMyAxMyAzLjQ0NzcyIDEzIDRWMTBDMTMgMTAuNTUyMyAxMi41NTIzIDExIDEyIDExSDUuNUwzIDEzLjVWNFpcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQbHVzSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk04IDMuNVYxMi41TTMuNSA4SDEyLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS41XCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IFNlYXJjaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjdcIiBjeT1cIjdcIiByPVwiNC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjNcIiAvPlxuICAgIDxwYXRoIGQ9XCJNMTAuNSAxMC41TDEzLjUgMTMuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4zXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFbGxpcHNpc0ljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjMuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiOFwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiMTIuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFZGl0SWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0xMS41IDIuNUwxMy41IDQuNUw1IDEzSDNWMTFMMTEuNSAyLjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuM1wiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBUcmFzaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMy41IDQuNUgxMi41TTYgNC41VjNDNiAyLjQ0NzcyIDYuNDQ3NzIgMiA3IDJIOUM5LjU1MjI4IDIgMTAgMi40NDc3MiAxMCAzVjQuNU00LjUgNC41VjEzQzQuNSAxMy41NTIzIDQuOTQ3NzIgMTQgNS41IDE0SDEwLjVDMTEuMDUyMyAxNCAxMS41IDEzLjU1MjMgMTEuNSAxM1Y0LjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4zXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEZvcmtJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjExLjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjExLjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPHBhdGggZD1cIk00LjUgNlYxME0xMS41IDZWNy41QzExLjUgOC42IDEwLjYgOS41IDkuNSA5LjVINC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVUb0ZvbGRlckljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMlwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgOC41SDEwTTggNi41TDEwIDguNUw4IDEwLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVPdXRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgMy41SDMuNVYxMi41SDEyLjVWMTBNOC41IDIuNUgxMy41VjcuNU03IDlMMTMgM1wiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjNcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQWRkRm9sZGVySWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0yIDQuMjVDMiAzLjU1OTY0IDIuNTU5NjQgMyAzLjI1IDNINi4wODU3OUM2LjQxNzMyIDMgNi43MzUyOCAzLjEzMTcgNi45Njk2NyAzLjM2NjEyTDguMTMzODggNC41MzAzM0M4LjM2ODI3IDQuNzY0NzUgOC42ODYyMyA0Ljg5NjQ1IDkuMDE3NzcgNC44OTY0NUgxMi43NUMxMy40NDA0IDQuODk2NDUgMTQgNS40NTYwOSAxNCA2LjE0NjQ1VjguNU0yIDQuMjVWMTEuNzVDMiAxMi40NDA0IDIuNTU5NjQgMTMgMy4yNSAxM0g4TTExLjUgMTAuNVYxNC41TTkuNSAxMi41SDEzLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQaW5JY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHBpbm5lZD86IGJvb2xlYW47IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMyxcbiAgcGlubmVkID0gZmFsc2UsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk05LjUgM0wxMyA2LjVNNiA2LjVMMy41IDlMNCAxMkwyIDE0TDQgMTJMNyAxMi41TDkuNSAxME02IDYuNUw5LjUgM002IDYuNUw5LjUgMTBcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICBmaWxsPXtwaW5uZWQgPyAnY3VycmVudENvbG9yJyA6ICdub25lJ31cbiAgICAvPlxuICA8L3N2Zz5cbilcbiIsICJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbi8qKlxuICogQW5pbWF0ZWQgUHVsc2UgSW5kaWNhdG9yIGZvciBydW5uaW5nL3N0cmVhbWluZyBzZXNzaW9ucyBtYXRjaGluZyBEU0ggZGVzaWduLlxuICovXG5leHBvcnQgY29uc3QgUnVubmluZ0RvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTZCNjNcdTU3MjhcdTVCRjlcdThCRERcdTRFMEVcdTc1MUZcdTYyMTBcdTRFMkQuLi5cIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC40KScsXG4gICAgICAgICAgYW5pbWF0aW9uOiAnZHNoLXB1bHNlIDEuNXMgY3ViaWMtYmV6aWVyKDAuMjQsIDAsIDAuMzgsIDEpIGluZmluaXRlJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWJ1c2luZXNzLXByaW1hcnksICM2MGE1ZmEpJyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoOTYsIDE2NSwgMjUwLCAwLjgpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3R5bGU+e2BcbiAgICAgICAgQGtleWZyYW1lcyBkc2gtcHVsc2Uge1xuICAgICAgICAgIDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgICA1MCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEuNik7IG9wYWNpdHk6IDA7IH1cbiAgICAgICAgICAxMDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwOyB9XG4gICAgICAgIH1cbiAgICAgIGB9PC9zdHlsZT5cbiAgICA8L3NwYW4+XG4gIClcbn1cblxuLyoqXG4gKiBBbWJlciBEb3QgZm9yIHNlc3Npb25zIHdhaXRpbmcgb24gdXNlciBpbnRlcmFjdGlvbiAocXVlc3Rpb25zL2FwcHJvdmFscykuXG4gKi9cbmV4cG9ydCBjb25zdCBQZW5kaW5nRG90OiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7IHNpemUgPSAxNCwgc3R5bGUgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzcGFuXG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICB3aWR0aDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAuLi5zdHlsZSxcbiAgICAgIH19XG4gICAgICB0aXRsZT1cIlx1N0I0OVx1NUY4NVx1NEVBNFx1NEU5MiAoXHU1QkExXHU2Mjc5L1x1Nzg2RVx1OEJBNClcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjQ1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICcjZmJiZjI0JyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoMjUxLCAxOTEsIDM2LCAwLjYpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgPC9zcGFuPlxuICApXG59XG5cbi8qKlxuICogR3JlZW4gRG90IGZvciBjb21wbGV0ZWQvdW5yZWFkIHNlc3Npb25zIChmaW5pc2hlZCBpbiBiYWNrZ3JvdW5kLCB3YWl0aW5nIHRvIGJlIHJlYWQpLlxuICovXG5leHBvcnQgY29uc3QgQ29tcGxldGVkRG90OiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7IHNpemUgPSAxNCwgc3R5bGUgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzcGFuXG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICB3aWR0aDogYCR7c2l6ZX1weGAsXG4gICAgICAgIGhlaWdodDogYCR7c2l6ZX1weGAsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAuLi5zdHlsZSxcbiAgICAgIH19XG4gICAgICB0aXRsZT1cIlx1NURGMlx1NjI2N1x1ODg0Q1x1NUI4Q1x1NkJENSAoXHU2NzJBXHU4QkZCKVwiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNzV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjI1KScsXG4gICAgICAgICAgYW5pbWF0aW9uOiAnZHNoLWNvbXBsZXRlZC1wdWxzZSAyLjJzIGN1YmljLWJlemllcigwLjI0LCAwLCAwLjM4LCAxKSBpbmZpbml0ZScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNDh9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNDh9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJyM0YWRlODAnLFxuICAgICAgICAgIGJveFNoYWRvdzogJzAgMCA2cHggcmdiYSg3NCwgMjIyLCAxMjgsIDAuOCknLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzdHlsZT57YFxuICAgICAgICBAa2V5ZnJhbWVzIGRzaC1jb21wbGV0ZWQtcHVsc2Uge1xuICAgICAgICAgIDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgICA1MCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEuNSk7IG9wYWNpdHk6IDAuMTU7IH1cbiAgICAgICAgICAxMDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwLjgpOyBvcGFjaXR5OiAwLjg7IH1cbiAgICAgICAgfVxuICAgICAgYH08L3N0eWxlPlxuICAgIDwvc3Bhbj5cbiAgKVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQUEsbUJBQWtGOzs7QUNNM0UsSUFBTSxlQUFlO0FBRTVCLGVBQXNCLGNBQWMsZUFBMEQ7QUFDNUYsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxZQUFZLHVCQUF1QixtQkFBbUIsYUFBYSxDQUFDLEVBQUU7QUFDakcsUUFBSSxDQUFDLElBQUksR0FBSSxRQUFPO0FBQ3BCLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixXQUFPLEtBQUssVUFBVSxLQUFLLE9BQU87QUFBQSxFQUNwQyxTQUFTLEtBQUs7QUFDWixZQUFRLEtBQUssOENBQThDLEdBQUc7QUFDOUQsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLGVBQXNCLGFBQWEsZUFBdUIsTUFBNEQ7QUFDcEgsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxZQUFZLFNBQVM7QUFBQSxNQUM5QyxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLE1BQzlDLE1BQU0sS0FBSyxVQUFVLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFBQSxJQUM5QyxDQUFDO0FBQ0QsUUFBSSxDQUFDLElBQUksR0FBSSxRQUFPO0FBQ3BCLFVBQU0sT0FBUSxNQUFNLElBQUksS0FBSztBQUM3QixXQUFPLEtBQUssVUFBVSxLQUFLLE9BQU87QUFBQSxFQUNwQyxTQUFTLEtBQUs7QUFDWixZQUFRLEtBQUssNkNBQTZDLEdBQUc7QUFDN0QsV0FBTztBQUFBLEVBQ1Q7QUFDRjs7O0FDeEJBLElBQU0sZUFBZSxDQUFDLG1CQUE4QztBQUFBLEVBQ2xFLFNBQVM7QUFBQSxFQUNULGlCQUFpQixDQUFDO0FBQUEsRUFDbEIsa0JBQWtCLENBQUM7QUFBQSxFQUNuQixTQUFTLENBQUM7QUFBQSxFQUNWLGFBQWEsQ0FBQztBQUFBLEVBQ2QsV0FBVyxLQUFLLElBQUk7QUFDdEI7QUFFTyxJQUFNLFlBQU4sTUFBZ0I7QUFBQSxFQUNiLFFBQXdDLG9CQUFJLElBQUk7QUFBQSxFQUNoRCxZQUEyQixvQkFBSSxJQUFJO0FBQUEsRUFDbkMsY0FBb0Msb0JBQUksSUFBSTtBQUFBLEVBQzVDLFVBQVU7QUFBQSxFQUVsQixjQUFjO0FBQUEsRUFBQztBQUFBLEVBRWYsYUFBcUI7QUFDbkIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsVUFBVSxVQUFnQztBQUN4QyxTQUFLLFVBQVUsSUFBSSxRQUFRO0FBQzNCLFdBQU8sTUFBTTtBQUNYLFdBQUssVUFBVSxPQUFPLFFBQVE7QUFBQSxJQUNoQztBQUFBLEVBQ0Y7QUFBQSxFQUVRLFNBQWU7QUFDckIsU0FBSztBQUNMLGVBQVcsWUFBWSxLQUFLLFdBQVc7QUFDckMsZUFBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxvQkFBb0IsZUFBMEM7QUFDNUQsUUFBSSxDQUFDLGNBQWUsUUFBTyxhQUFhLEVBQUU7QUFDMUMsVUFBTSxXQUFXLEtBQUssTUFBTSxJQUFJLGFBQWE7QUFDN0MsUUFBSSxTQUFVLFFBQU87QUFFckIsVUFBTSxRQUFRLGFBQWEsYUFBYTtBQUN4QyxTQUFLLE1BQU0sSUFBSSxlQUFlLEtBQUs7QUFFbkMsU0FBSyxjQUFjLGFBQWE7QUFDaEMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sY0FBYyxlQUFzQztBQUN4RCxRQUFJLENBQUMsY0FBZTtBQUNwQixVQUFNLFNBQVMsTUFBTSxjQUFjLGFBQWE7QUFDaEQsUUFBSSxRQUFRO0FBQ1YsV0FBSyxNQUFNLElBQUksZUFBZTtBQUFBLFFBQzVCLEdBQUc7QUFBQSxRQUNILGtCQUFrQixNQUFNLFFBQVEsT0FBTyxnQkFBZ0IsSUFBSSxPQUFPLG1CQUFtQixDQUFDO0FBQUEsTUFDeEYsQ0FBQztBQUNELFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGFBQWEsZUFBdUJBLE9BQWMsUUFBZ0IsV0FBNEI7QUFDbEcsVUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsVUFBTSxVQUFVQSxNQUFLLEtBQUssS0FBSztBQUMvQixVQUFNLEtBQUssS0FBSyxLQUFLLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDcEUsVUFBTSxZQUEyQjtBQUFBLE1BQy9CO0FBQUEsTUFDQSxNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWDtBQUFBLE1BQ0EsWUFBWSxDQUFDO0FBQUEsTUFDYixXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILFNBQVMsQ0FBQyxHQUFHLEtBQUssU0FBUyxTQUFTO0FBQUEsTUFDcEMsV0FBVyxLQUFLLElBQUk7QUFBQSxJQUN0QjtBQUVBLFNBQUssTUFBTSxJQUFJLGVBQWUsT0FBTztBQUNyQyxTQUFLLE9BQU87QUFDWixVQUFNLEtBQUssUUFBUSxhQUFhO0FBQ2hDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGFBQWEsZUFBdUIsVUFBa0JBLE9BQTZCO0FBQ3ZGLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sVUFBVUEsTUFBSyxLQUFLO0FBQzFCLFFBQUksQ0FBQyxRQUFTO0FBRWQsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQyxNQUFPLEVBQUUsT0FBTyxXQUFXLEVBQUUsR0FBRyxHQUFHLE1BQU0sUUFBUSxJQUFJLENBQUU7QUFBQSxNQUNsRixXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFhLGVBQXVCLFVBQWlDO0FBQ3pFLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTLEtBQUssUUFBUSxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sUUFBUTtBQUFBLE1BQ3JELFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDdEI7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGFBQWEsZUFBdUIsVUFBaUM7QUFDekUsVUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQyxNQUFPLEVBQUUsT0FBTyxXQUFXLEVBQUUsR0FBRyxHQUFHLFdBQVcsQ0FBQyxFQUFFLFVBQVUsSUFBSSxDQUFFO0FBQUEsSUFDOUY7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGVBQWUsZUFBdUIsVUFBa0IsT0FBOEI7QUFDMUYsVUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQyxNQUFPLEVBQUUsT0FBTyxXQUFXLEVBQUUsR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFFO0FBQUEsSUFDNUU7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFlBQVksZUFBdUIsV0FBbUIsZ0JBQThDO0FBQ3hHLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0saUJBQWlCLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVztBQUNsRCxZQUFNLFdBQVcsT0FBTyxXQUFXLE9BQU8sQ0FBQyxPQUFPLE9BQU8sU0FBUztBQUNsRSxVQUFJLG1CQUFtQixRQUFRLE9BQU8sT0FBTyxnQkFBZ0I7QUFDM0QsZUFBTztBQUFBLFVBQ0wsR0FBRztBQUFBLFVBQ0gsV0FBVztBQUFBO0FBQUEsVUFDWCxZQUFZLENBQUMsV0FBVyxHQUFHLFFBQVE7QUFBQSxRQUNyQztBQUFBLE1BQ0Y7QUFDQSxhQUFPO0FBQUEsUUFDTCxHQUFHO0FBQUEsUUFDSCxZQUFZO0FBQUEsTUFDZDtBQUFBLElBQ0YsQ0FBQztBQUVELFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxtQkFBbUIsZUFBdUIsVUFBa0IsV0FBa0M7QUFDbEcsVUFBTSxLQUFLLFlBQVksZUFBZSxXQUFXLFFBQVE7QUFBQSxFQUMzRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxpQkFBaUIsZUFBdUIsV0FBa0M7QUFDOUUsVUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsVUFBTSxnQkFBZ0IsSUFBSSxJQUFJLEtBQUssb0JBQW9CLENBQUMsQ0FBQztBQUN6RCxRQUFJLGNBQWMsSUFBSSxTQUFTLEdBQUc7QUFDaEMsb0JBQWMsT0FBTyxTQUFTO0FBQUEsSUFDaEMsT0FBTztBQUNMLG9CQUFjLElBQUksU0FBUztBQUFBLElBQzdCO0FBRUEsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILGtCQUFrQixNQUFNLEtBQUssYUFBYTtBQUFBLE1BQzFDLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDdEI7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGFBQWEsZUFBdUIsV0FBa0M7QUFDMUUsVUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsVUFBTSxpQkFBaUIsS0FBSyxRQUFRLElBQUksQ0FBQyxZQUFZO0FBQUEsTUFDbkQsR0FBRztBQUFBLE1BQ0gsWUFBWSxPQUFPLFdBQVcsT0FBTyxDQUFDLE9BQU8sT0FBTyxTQUFTO0FBQUEsSUFDL0QsRUFBRTtBQUNGLFVBQU0saUJBQWlCLEtBQUssb0JBQW9CLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxPQUFPLFNBQVM7QUFFbkYsVUFBTSxVQUE2QjtBQUFBLE1BQ2pDLEdBQUc7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULGtCQUFrQjtBQUFBLE1BQ2xCLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDdEI7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUFBLEVBQ2xDO0FBQUEsRUFFQSxNQUFjLFFBQVEsZUFBc0M7QUFDMUQsUUFBSSxDQUFDLGlCQUFpQixLQUFLLFlBQVksSUFBSSxhQUFhLEVBQUc7QUFDM0QsU0FBSyxZQUFZLElBQUksZUFBZSxJQUFJO0FBQ3hDLFFBQUk7QUFDRixZQUFNLE9BQU8sS0FBSyxvQkFBb0IsYUFBYTtBQUNuRCxZQUFNLGFBQWEsZUFBZSxJQUFJO0FBQUEsSUFDeEMsVUFBRTtBQUNBLFdBQUssWUFBWSxJQUFJLGVBQWUsS0FBSztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUNGO0FBRU8sSUFBTSxrQkFBa0IsSUFBSSxVQUFVOzs7QUNyUXRDLFNBQVMsbUJBQW1CLFdBQTRCO0FBQzdELE1BQUksQ0FBQyxhQUFhLE9BQU8sY0FBYyxTQUFVLFFBQU87QUFDeEQsUUFBTSxPQUFPLEtBQUssSUFBSSxJQUFJO0FBQzFCLE1BQUksT0FBTyxFQUFHLFFBQU87QUFFckIsUUFBTSxNQUFNLEtBQUssTUFBTSxPQUFPLEdBQUk7QUFDbEMsTUFBSSxNQUFNLEdBQUksUUFBTztBQUVyQixRQUFNLE1BQU0sS0FBSyxNQUFNLE1BQU0sRUFBRTtBQUMvQixNQUFJLE1BQU0sR0FBSSxRQUFPLEdBQUcsR0FBRztBQUUzQixRQUFNLFFBQVEsS0FBSyxNQUFNLE1BQU0sRUFBRTtBQUNqQyxNQUFJLFFBQVEsR0FBSSxRQUFPLEdBQUcsS0FBSztBQUUvQixRQUFNLE9BQU8sS0FBSyxNQUFNLFFBQVEsRUFBRTtBQUNsQyxNQUFJLFNBQVMsRUFBRyxRQUFPO0FBQ3ZCLE1BQUksT0FBTyxHQUFJLFFBQU8sR0FBRyxJQUFJO0FBRTdCLFFBQU0sSUFBSSxJQUFJLEtBQUssU0FBUztBQUM1QixTQUFPLEdBQUcsRUFBRSxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO0FBQzNDOzs7QUNUSTtBQVpHLElBQU0sbUJBQWlHLENBQUM7QUFBQSxFQUM3RyxPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQTtBQUFBLElBQ2pCO0FBQUE7QUFDRjtBQUdLLElBQU0sYUFBdUYsQ0FBQztBQUFBLEVBQ25HLE9BQU87QUFBQSxFQUNQO0FBQUEsRUFDQTtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOLE9BQU8sRUFBRSxPQUFPLFNBQVMsZ0JBQWdCLEdBQUcsTUFBTTtBQUFBLElBRWxEO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxHQUFFO0FBQUEsUUFDRixRQUFPO0FBQUEsUUFDUCxhQUFZO0FBQUEsUUFDWixNQUFNLFFBQVEsR0FBRyxLQUFLLE9BQU87QUFBQSxRQUM3QixhQUFhLFFBQVEsTUFBTTtBQUFBLFFBQzNCLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLFdBQXFFLENBQUM7QUFBQSxFQUNqRixPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQTtBQUFBLElBQ2pCO0FBQUE7QUFDRjtBQUdLLElBQU0sV0FBcUUsQ0FBQztBQUFBLEVBQ2pGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxHQUFFO0FBQUEsUUFDRixRQUFPO0FBQUEsUUFDUCxhQUFZO0FBQUEsUUFDWixlQUFjO0FBQUEsUUFDZCxnQkFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQTtBQUNGO0FBR0ssSUFBTSxhQUF1RSxDQUFDO0FBQUEsRUFDbkYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxrREFBQyxZQUFPLElBQUcsS0FBSSxJQUFHLEtBQUksR0FBRSxPQUFNLFFBQU8sZ0JBQWUsYUFBWSxPQUFNO0FBQUEsTUFDdEUsNENBQUMsVUFBSyxHQUFFLHdCQUF1QixRQUFPLGdCQUFlLGFBQVksT0FBTSxlQUFjLFNBQVE7QUFBQTtBQUFBO0FBQy9GO0FBR0ssSUFBTSxlQUF5RSxDQUFDO0FBQUEsRUFDckYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxrREFBQyxZQUFPLElBQUcsT0FBTSxJQUFHLEtBQUksR0FBRSxPQUFNLE1BQUssZ0JBQWU7QUFBQSxNQUNwRCw0Q0FBQyxZQUFPLElBQUcsS0FBSSxJQUFHLEtBQUksR0FBRSxPQUFNLE1BQUssZ0JBQWU7QUFBQSxNQUNsRCw0Q0FBQyxZQUFPLElBQUcsUUFBTyxJQUFHLEtBQUksR0FBRSxPQUFNLE1BQUssZ0JBQWU7QUFBQTtBQUFBO0FBQ3ZEO0FBR0ssSUFBTSxXQUFxRSxDQUFDO0FBQUEsRUFDakYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLFlBQXNFLENBQUM7QUFBQSxFQUNsRixPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQTtBQUFBLElBQ2pCO0FBQUE7QUFDRjtBQUdLLElBQU0sV0FBcUUsQ0FBQztBQUFBLEVBQ2pGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsa0RBQUMsWUFBTyxJQUFHLE9BQU0sSUFBRyxRQUFPLEdBQUUsT0FBTSxRQUFPLGdCQUFlLGFBQVksT0FBTTtBQUFBLE1BQzNFLDRDQUFDLFlBQU8sSUFBRyxPQUFNLElBQUcsT0FBTSxHQUFFLE9BQU0sUUFBTyxnQkFBZSxhQUFZLE9BQU07QUFBQSxNQUMxRSw0Q0FBQyxZQUFPLElBQUcsUUFBTyxJQUFHLE9BQU0sR0FBRSxPQUFNLFFBQU8sZ0JBQWUsYUFBWSxPQUFNO0FBQUEsTUFDM0UsNENBQUMsVUFBSyxHQUFFLHNEQUFxRCxRQUFPLGdCQUFlLGFBQVksT0FBTTtBQUFBO0FBQUE7QUFDdkc7QUFHSyxJQUFNLG1CQUE2RSxDQUFDO0FBQUEsRUFDekYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQTtBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0MsR0FBRTtBQUFBLFVBQ0YsUUFBTztBQUFBLFVBQ1AsYUFBWTtBQUFBLFVBQ1osZ0JBQWU7QUFBQTtBQUFBLE1BQ2pCO0FBQUEsTUFDQTtBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0MsR0FBRTtBQUFBLFVBQ0YsUUFBTztBQUFBLFVBQ1AsYUFBWTtBQUFBLFVBQ1osZUFBYztBQUFBLFVBQ2QsZ0JBQWU7QUFBQTtBQUFBLE1BQ2pCO0FBQUE7QUFBQTtBQUNGO0FBR0ssSUFBTSxjQUF3RSxDQUFDO0FBQUEsRUFDcEYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLGdCQUEwRSxDQUFDO0FBQUEsRUFDdEYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLFVBQXNGLENBQUM7QUFBQSxFQUNsRyxPQUFPO0FBQUEsRUFDUCxTQUFTO0FBQUEsRUFDVDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQSxRQUNmLE1BQU0sU0FBUyxpQkFBaUI7QUFBQTtBQUFBLElBQ2xDO0FBQUE7QUFDRjs7O0FDcFJFLElBQUFDLHNCQUFBO0FBRkcsSUFBTSxhQUF1RSxDQUFDLEVBQUUsT0FBTyxJQUFJLE1BQU0sTUFBTTtBQUM1RyxTQUNFO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxPQUFPO0FBQUEsUUFDTCxTQUFTO0FBQUEsUUFDVCxZQUFZO0FBQUEsUUFDWixnQkFBZ0I7QUFBQSxRQUNoQixPQUFPLEdBQUcsSUFBSTtBQUFBLFFBQ2QsUUFBUSxHQUFHLElBQUk7QUFBQSxRQUNmLFVBQVU7QUFBQSxRQUNWLFlBQVk7QUFBQSxRQUNaLEdBQUc7QUFBQSxNQUNMO0FBQUEsTUFDQSxPQUFNO0FBQUEsTUFFTjtBQUFBO0FBQUEsVUFBQztBQUFBO0FBQUEsWUFDQyxPQUFPO0FBQUEsY0FDTCxVQUFVO0FBQUEsY0FDVixPQUFPLEdBQUcsT0FBTyxJQUFJO0FBQUEsY0FDckIsUUFBUSxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3RCLGNBQWM7QUFBQSxjQUNkLFlBQVk7QUFBQSxjQUNaLFdBQVc7QUFBQSxZQUNiO0FBQUE7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsT0FBTyxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3JCLFFBQVEsR0FBRyxPQUFPLElBQUk7QUFBQSxjQUN0QixjQUFjO0FBQUEsY0FDZCxZQUFZO0FBQUEsY0FDWixXQUFXO0FBQUEsWUFDYjtBQUFBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsNkNBQUMsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQU1OO0FBQUE7QUFBQTtBQUFBLEVBQ0o7QUFFSjtBQUtPLElBQU0sYUFBdUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxNQUFNLE1BQU07QUFDNUcsU0FDRTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsWUFBWTtBQUFBLFFBQ1osZ0JBQWdCO0FBQUEsUUFDaEIsT0FBTyxHQUFHLElBQUk7QUFBQSxRQUNkLFFBQVEsR0FBRyxJQUFJO0FBQUEsUUFDZixVQUFVO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixHQUFHO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTTtBQUFBLE1BRU47QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLE9BQU87QUFBQSxZQUNMLE9BQU8sR0FBRyxPQUFPLElBQUk7QUFBQSxZQUNyQixRQUFRLEdBQUcsT0FBTyxJQUFJO0FBQUEsWUFDdEIsY0FBYztBQUFBLFlBQ2QsWUFBWTtBQUFBLFlBQ1osV0FBVztBQUFBLFVBQ2I7QUFBQTtBQUFBLE1BQ0Y7QUFBQTtBQUFBLEVBQ0Y7QUFFSjtBQUtPLElBQU0sZUFBeUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxNQUFNLE1BQU07QUFDOUcsU0FDRTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsWUFBWTtBQUFBLFFBQ1osZ0JBQWdCO0FBQUEsUUFDaEIsT0FBTyxHQUFHLElBQUk7QUFBQSxRQUNkLFFBQVEsR0FBRyxJQUFJO0FBQUEsUUFDZixVQUFVO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixHQUFHO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTTtBQUFBLE1BRU47QUFBQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsT0FBTyxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3JCLFFBQVEsR0FBRyxPQUFPLElBQUk7QUFBQSxjQUN0QixjQUFjO0FBQUEsY0FDZCxZQUFZO0FBQUEsY0FDWixXQUFXO0FBQUEsWUFDYjtBQUFBO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE9BQU87QUFBQSxjQUNMLFVBQVU7QUFBQSxjQUNWLE9BQU8sR0FBRyxPQUFPLElBQUk7QUFBQSxjQUNyQixRQUFRLEdBQUcsT0FBTyxJQUFJO0FBQUEsY0FDdEIsY0FBYztBQUFBLGNBQ2QsWUFBWTtBQUFBLGNBQ1osV0FBVztBQUFBLFlBQ2I7QUFBQTtBQUFBLFFBQ0Y7QUFBQSxRQUNBLDZDQUFDLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FNTjtBQUFBO0FBQUE7QUFBQSxFQUNKO0FBRUo7OztBTGdRTSxJQUFBQyxzQkFBQTtBQTlWTixJQUFNLHdCQUF3QjtBQUk5QixTQUFTLG1CQUFtQixJQUFZLE9BQWdCLFVBQVUsT0FBTyxXQUFXLE9BQWdCO0FBQ2xHLE1BQUksU0FBVSxRQUFPO0FBQ3JCLE1BQUksUUFBUyxRQUFPO0FBQ3BCLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsTUFBSSxVQUFVLEdBQUksUUFBTztBQUN6QixNQUFJLHdCQUF3QixLQUFLLEtBQUssRUFBRyxRQUFPO0FBQ2hELFNBQU87QUFDVDtBQUVBLElBQU0sa0JBQXVDO0FBQUEsRUFDM0MsV0FBVztBQUFBLEVBQ1gsU0FBUztBQUFBLEVBQ1QsY0FBYztBQUFBLEVBQ2QsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsWUFBWTtBQUFBLEVBQ1osU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUNkO0FBU0EsSUFBTSxvQkFBb0I7QUFBQSxFQUN4QixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixRQUFRO0FBQUEsSUFDUixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsSUFDVixPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsT0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFdBQVc7QUFBQSxJQUNULElBQUk7QUFBQSxJQUNKLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLE9BQU87QUFBQSxJQUNQLGFBQWE7QUFBQSxFQUNmO0FBQ0Y7QUFFTyxJQUFNLDJCQUFvRSxDQUFDLFVBQVU7QUFFMUY7QUFBQSxJQUNFLENBQUMsT0FBTyxnQkFBZ0IsVUFBVSxFQUFFO0FBQUEsSUFDcEMsTUFBTSxnQkFBZ0IsV0FBVztBQUFBLEVBQ25DO0FBRUEsTUFBSSxrQkFJQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLG9CQUFvQixDQUFDLEVBQUU7QUFFeEMsTUFBSTtBQUNGLFFBQUksTUFBTSxlQUFlO0FBQ3ZCLHdCQUFrQixNQUFNLGNBQWMsQ0FBQyxNQUFXLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLG9CQUFvQixDQUFDLEVBQUU7QUFBQSxJQUM5RjtBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBRVI7QUFFQSxRQUFNLENBQUMsb0JBQW9CLHFCQUFxQixRQUFJLHVCQUFzQixvQkFBSSxJQUFJLENBQUM7QUFDbkYsUUFBTSxDQUFDLGFBQWEsY0FBYyxRQUFJLHVCQUFTLEVBQUU7QUFDakQsUUFBTSxDQUFDLFlBQVksYUFBYSxRQUFJLHVCQUFTLEtBQUs7QUFDbEQsUUFBTSxDQUFDLGdCQUFnQixpQkFBaUIsUUFBSSx1QkFBd0IsSUFBSTtBQUN4RSxRQUFNLENBQUMsYUFBYSxjQUFjLFFBQUksdUJBQXdCLElBQUk7QUFDbEUsUUFBTSxDQUFDLGFBQWEsY0FBYyxRQUFJLHVCQUFTLEVBQUU7QUFDakQsUUFBTSxDQUFDLHNCQUFzQix1QkFBdUIsUUFBSSx1QkFBd0IsSUFBSTtBQUNwRixRQUFNLENBQUMsZUFBZSxnQkFBZ0IsUUFBSSx1QkFBUyxFQUFFO0FBQ3JELFFBQU0sQ0FBQyxpQkFBaUIsa0JBQWtCLFFBQUksdUJBQXdCLElBQUk7QUFDMUUsUUFBTSxDQUFDLGdCQUFnQixpQkFBaUIsUUFBSSx1QkFBUyxFQUFFO0FBR3ZELFFBQU0sQ0FBQyxtQkFBbUIsb0JBQW9CLFFBQUksdUJBQXdCLElBQUk7QUFDOUUsUUFBTSxDQUFDLGdCQUFnQixpQkFBaUIsUUFBSSx1QkFBd0IsSUFBSTtBQUd4RSxRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixRQUFJLHVCQUFzQixvQkFBSSxJQUFJLENBQUM7QUFDM0UsUUFBTSxxQkFBaUIscUJBQTZCLG9CQUFJLElBQUksQ0FBQztBQUc3RCxRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixRQUFJLHVCQUF3QixJQUFJO0FBQzVFLFFBQU0sQ0FBQyxrQkFBa0IsbUJBQW1CLFFBQUksdUJBQVMsRUFBRTtBQUczRCxRQUFNLENBQUMseUJBQXlCLDBCQUEwQixRQUFJLHVCQUF3QixJQUFJO0FBRTFGLFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLFFBQUksdUJBQWtDLENBQUMsQ0FBQztBQUV4RixRQUFNLGNBQVUscUJBQXVCLElBQUk7QUFFM0MsOEJBQVUsTUFBTTtBQUNkLFVBQU0sb0JBQW9CLENBQUMsTUFBa0I7QUFDM0MsVUFBSSxRQUFRLFdBQVcsQ0FBQyxRQUFRLFFBQVEsU0FBUyxFQUFFLE1BQWMsR0FBRztBQUNsRSwwQkFBa0IsSUFBSTtBQUFBLE1BQ3hCO0FBQ0EsWUFBTSxTQUFTLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sUUFBUSxzQkFBc0IsS0FBSyxDQUFDLE9BQU8sUUFBUSxnQkFBZ0IsR0FBRztBQUNoRixtQ0FBMkIsSUFBSTtBQUFBLE1BQ2pDO0FBQUEsSUFDRjtBQUNBLFVBQU0sZ0JBQWdCLENBQUMsTUFBcUI7QUFDMUMsVUFBSSxFQUFFLFFBQVEsVUFBVTtBQUN0QiwwQkFBa0IsSUFBSTtBQUN0QixtQ0FBMkIsSUFBSTtBQUMvQix1QkFBZSxJQUFJO0FBQ25CLGdDQUF3QixJQUFJO0FBQzVCLDJCQUFtQixJQUFJO0FBQ3ZCLDRCQUFvQixJQUFJO0FBQUEsTUFDMUI7QUFBQSxJQUNGO0FBQ0EsV0FBTyxpQkFBaUIsU0FBUyxpQkFBaUI7QUFDbEQsV0FBTyxpQkFBaUIsV0FBVyxhQUFhO0FBQ2hELFdBQU8sTUFBTTtBQUNYLGFBQU8sb0JBQW9CLFNBQVMsaUJBQWlCO0FBQ3JELGFBQU8sb0JBQW9CLFdBQVcsYUFBYTtBQUFBLElBQ3JEO0FBQUEsRUFDRixHQUFHLENBQUMsQ0FBQztBQUVMLE1BQUksZ0JBSUEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRTtBQUV4QixNQUFJO0FBQ0YsUUFBSSxNQUFNLGFBQWE7QUFDckIsc0JBQWdCLE1BQU0sWUFBWSxDQUFDLE1BQVcsQ0FBQyxLQUFLLENBQUM7QUFBQSxJQUN2RDtBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBRVI7QUFFQSxRQUFNLGtCQUFrQixjQUFjO0FBQ3RDLFFBQU0sUUFBa0MsZ0JBQWdCLFNBQVMsQ0FBQztBQUNsRSxRQUFNLHFCQUEyQyxnQkFBZ0Isc0JBQXNCLENBQUM7QUFDeEYsUUFBTSxrQkFBYyxzQkFBUSxNQUFNLElBQUksSUFBSSxtQkFBbUIsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0FBRy9GLDhCQUFVLE1BQU07QUFDZCxlQUFXLE1BQU0sT0FBTztBQUN0QixVQUFJLEdBQUcsTUFBTTtBQUNYLHdCQUFnQixvQkFBb0IsR0FBRyxJQUFJO0FBQUEsTUFDN0M7QUFBQSxJQUNGO0FBQUEsRUFDRixHQUFHLENBQUMsS0FBSyxDQUFDO0FBR1YsOEJBQVUsTUFBTTtBQUNkLFVBQU0sT0FBTyxjQUFjLFFBQVEsQ0FBQztBQUNwQyxVQUFNLFlBQVksSUFBSSxJQUFJLGNBQWM7QUFDeEMsUUFBSSxVQUFVO0FBRWQsZUFBVyxDQUFDLElBQUksT0FBTyxLQUFLLE9BQU8sUUFBUSxJQUFJLEdBQUc7QUFDaEQsVUFBSSxZQUFZLElBQUksRUFBRSxHQUFHO0FBQ3ZCLFlBQUksVUFBVSxJQUFJLEVBQUUsR0FBRztBQUNyQixvQkFBVSxPQUFPLEVBQUU7QUFDbkIsb0JBQVU7QUFBQSxRQUNaO0FBQ0E7QUFBQSxNQUNGO0FBQ0EsWUFBTSxhQUFhLGVBQWUsUUFBUSxJQUFJLEVBQUUsS0FBSztBQUNyRCxZQUFNLGVBQWUsUUFBUSxTQUFTLE9BQU87QUFHN0MsVUFBSSxjQUFjLENBQUMsZ0JBQWdCLE9BQU8saUJBQWlCO0FBQ3pELGtCQUFVLElBQUksRUFBRTtBQUNoQixrQkFBVTtBQUFBLE1BQ1o7QUFHQSxVQUFJLE9BQU8sbUJBQW1CLFVBQVUsSUFBSSxFQUFFLEdBQUc7QUFDL0Msa0JBQVUsT0FBTyxFQUFFO0FBQ25CLGtCQUFVO0FBQUEsTUFDWjtBQUVBLHFCQUFlLFFBQVEsSUFBSSxJQUFJLFlBQVk7QUFBQSxJQUM3QztBQUVBLFFBQUksU0FBUztBQUNYLHdCQUFrQixTQUFTO0FBQUEsSUFDN0I7QUFBQSxFQUNGLEdBQUcsQ0FBQyxjQUFjLE1BQU0saUJBQWlCLFdBQVcsQ0FBQztBQUdyRCxRQUFNLG9CQUFvQixDQUFDLGNBQXNCO0FBQy9DLFFBQUksZUFBZSxJQUFJLFNBQVMsR0FBRztBQUNqQyxZQUFNLE9BQU8sSUFBSSxJQUFJLGNBQWM7QUFDbkMsV0FBSyxPQUFPLFNBQVM7QUFDckIsd0JBQWtCLElBQUk7QUFBQSxJQUN4QjtBQUNBLFVBQU0sT0FBTyxTQUFpQztBQUFBLEVBQ2hEO0FBRUEsOEJBQVUsTUFBTTtBQUNkLFFBQUksTUFBTSxTQUFTLEtBQUssbUJBQW1CLFNBQVMsR0FBRztBQUNyRCxZQUFNLFdBQVcsZ0JBQWdCLHFCQUFxQixNQUFNLENBQUMsR0FBRztBQUNoRSxVQUFJLFVBQVU7QUFDWiw4QkFBc0Isb0JBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLGNBQU0sUUFBUSxNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLFFBQVE7QUFDMUQsWUFBSSxPQUFPLEtBQU0saUJBQWdCLGNBQWMsTUFBTSxJQUFJO0FBQUEsTUFDM0Q7QUFBQSxJQUNGO0FBQUEsRUFDRixHQUFHLENBQUMsT0FBTyxnQkFBZ0IsaUJBQWlCLENBQUM7QUFFN0MsUUFBTSxrQkFBa0IsQ0FBQyxNQUFjLFdBQW1CO0FBQ3hELFVBQU0sT0FBTyxJQUFJLElBQUksa0JBQWtCO0FBQ3ZDLFFBQUksS0FBSyxJQUFJLElBQUksR0FBRztBQUNsQixXQUFLLE9BQU8sSUFBSTtBQUNoQiw0QkFBc0IsQ0FBQyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRTtBQUFBLElBQzlELE9BQU87QUFDTCxXQUFLLElBQUksSUFBSTtBQUNiLHNCQUFnQixjQUFjLE1BQU07QUFBQSxJQUN0QztBQUNBLDBCQUFzQixJQUFJO0FBQUEsRUFDNUI7QUFFQSxRQUFNLHFCQUFxQixPQUFPLFdBQW1CO0FBQ25ELFFBQUksY0FBYyxLQUFLLEdBQUc7QUFDeEIsWUFBTSxnQkFBZ0IsYUFBYSxRQUFRLGNBQWMsS0FBSyxDQUFDO0FBQy9ELHVCQUFpQixFQUFFO0FBQ25CLDhCQUF3QixJQUFJO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBRUEsUUFBTSxxQkFBcUIsT0FBTyxTQUFzQjtBQUN0RCxRQUFJLFlBQVksS0FBSyxLQUFLLE1BQU0saUJBQWlCO0FBQy9DLFlBQU0sTUFBTSxnQkFBZ0IsTUFBTSxZQUFZLEtBQUssQ0FBQztBQUFBLElBQ3REO0FBQ0EsbUJBQWUsSUFBSTtBQUNuQixzQkFBa0IsSUFBSTtBQUFBLEVBQ3hCO0FBRUEsUUFBTSwwQkFBMEIsT0FBTyxjQUFzQjtBQUMzRCxRQUFJLGlCQUFpQixLQUFLLEtBQUssTUFBTSxlQUFlO0FBQ2xELFlBQU0sTUFBTSxjQUFjLFdBQW1DLGlCQUFpQixLQUFLLENBQUM7QUFBQSxJQUN0RjtBQUNBLHdCQUFvQixJQUFJO0FBQUEsRUFDMUI7QUFHQSxRQUFNLHNCQUFzQixPQUFPLFFBQWdCLGNBQXNCO0FBQ3ZFLFFBQUk7QUFDRixVQUFJLGVBQWUsSUFBSSxTQUFTLEdBQUc7QUFDakMsY0FBTSxPQUFPLElBQUksSUFBSSxjQUFjO0FBQ25DLGFBQUssT0FBTyxTQUFTO0FBQ3JCLDBCQUFrQixJQUFJO0FBQUEsTUFDeEI7QUFDQSxZQUFNLGdCQUFnQixhQUFhLFFBQVEsU0FBUztBQUNwRCxVQUFJLE1BQU0sZ0JBQWdCO0FBQ3hCLGNBQU0sTUFBTSxlQUFlLFNBQWlDO0FBQUEsTUFDOUQ7QUFBQSxJQUNGLFNBQVMsS0FBSztBQUNaLGNBQVEsTUFBTSwrQ0FBK0MsR0FBRztBQUFBLElBQ2xFO0FBQUEsRUFDRjtBQUdBLFFBQU0sOEJBQThCLE9BQU8sTUFBbUIsUUFBZ0IsYUFBcUI7QUFDakcsUUFBSSxNQUFNLHNCQUFzQjtBQUM5QixZQUFNLE1BQU0scUJBQXFCLE1BQU0sUUFBUSxRQUFRO0FBQUEsSUFDekQsT0FBTztBQUNMLFlBQU0sZUFBZSxJQUFJO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBR0EsUUFBTSxrQkFBYyxzQkFBUSxNQUFNO0FBQ2hDLFVBQU0sT0FBcUIsQ0FBQztBQUM1QixVQUFNLE9BQU8sY0FBYyxRQUFRLENBQUM7QUFFcEMsZUFBVyxDQUFDLEtBQUssT0FBTyxLQUFLLE9BQU8sUUFBUSxJQUFJLEdBQUc7QUFDakQsVUFBSSxZQUFZLElBQUksR0FBRyxFQUFHO0FBQzFCLFlBQU0sWUFBWSxRQUFRLFNBQVMsT0FBTztBQUMxQyxZQUFNLFlBQVksUUFBUSxTQUFTLGtCQUFrQjtBQUNyRCxZQUFNLHFCQUFxQixRQUFRLFNBQVMsU0FBUyxLQUFLLGVBQWUsSUFBSSxHQUFHLE1BQU0sUUFBUTtBQUU5RixZQUFNLFVBQVUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxHQUFHLFNBQVMsR0FBMkIsQ0FBQztBQUM1RixZQUFNLFFBQVEsU0FBUyxTQUFTLElBQUksTUFBTSxHQUFHLEVBQUU7QUFFL0MsVUFBSSxXQUFXO0FBQ2IsYUFBSyxLQUFLLEVBQUUsV0FBVyxLQUFLLE9BQU8sUUFBUSxXQUFXLElBQUksUUFBUSxDQUFDO0FBQUEsTUFDckUsV0FBVyxXQUFXO0FBQ3BCLGFBQUssS0FBSyxFQUFFLFdBQVcsS0FBSyxPQUFPLFFBQVEsV0FBVyxJQUFJLFFBQVEsQ0FBQztBQUFBLE1BQ3JFLFdBQVcsbUJBQW1CO0FBQzVCLGFBQUssS0FBSyxFQUFFLFdBQVcsS0FBSyxPQUFPLFFBQVEsYUFBYSxJQUFJLFFBQVEsQ0FBQztBQUFBLE1BQ3ZFO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBNkQsRUFBRSxTQUFTLEdBQUcsU0FBUyxHQUFHLFdBQVcsRUFBRTtBQUMxRyxXQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsT0FBTyxNQUFNLEVBQUUsTUFBTSxLQUFLLE1BQU0sTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFO0FBQUEsRUFDNUUsR0FBRyxDQUFDLGNBQWMsTUFBTSxPQUFPLGdCQUFnQixpQkFBaUIsV0FBVyxDQUFDO0FBRzVFLFFBQU0seUJBQXlCLENBQUMsV0FBbUIsWUFBNEI7QUFDN0UsUUFBSSxTQUFTO0FBQ1gsNEJBQXNCLENBQUMsU0FBUyxvQkFBSSxJQUFJLENBQUMsR0FBRyxNQUFNLFFBQVEsV0FBVyxDQUFDLENBQUM7QUFDdkUsWUFBTSxPQUFPLGdCQUFnQixvQkFBb0IsUUFBUSxJQUFJO0FBQzdELFlBQU0sZUFBZSxLQUFLLFFBQVEsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXLFNBQVMsU0FBUyxDQUFDO0FBQzlFLFVBQUksZ0JBQWdCLGFBQWEsV0FBVztBQUMxQyx3QkFBZ0IsYUFBYSxRQUFRLE1BQU0sYUFBYSxFQUFFO0FBQUEsTUFDNUQ7QUFBQSxJQUNGO0FBQ0Esc0JBQWtCLFNBQVM7QUFBQSxFQUM3QjtBQUVBLFFBQU0seUJBQXFCLHNCQUFRLE1BQU07QUFDdkMsUUFBSSxDQUFDLFlBQVksS0FBSyxFQUFHLFFBQU87QUFDaEMsVUFBTSxJQUFJLFlBQVksWUFBWTtBQUNsQyxXQUFPLE1BQU0sT0FBTyxDQUFDLE9BQU87QUFDMUIsWUFBTSxjQUFjLEdBQUcsU0FBUyxJQUFJLFlBQVksRUFBRSxTQUFTLENBQUM7QUFDNUQsWUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUTtBQUN4RCxjQUFNLFNBQVM7QUFDZixZQUFJLFlBQVksSUFBSSxNQUFNLEVBQUcsUUFBTztBQUNwQyxjQUFNLFFBQVEsY0FBYyxPQUFPLE1BQU0sR0FBRyxTQUFTO0FBQ3JELGVBQU8sTUFBTSxZQUFZLEVBQUUsU0FBUyxDQUFDO0FBQUEsTUFDdkMsQ0FBQztBQUNELGFBQU8sY0FBYztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNILEdBQUcsQ0FBQyxPQUFPLGFBQWEsY0FBYyxNQUFNLFdBQVcsQ0FBQztBQUV4RCxTQUNFLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFVBQVUsUUFBUSxRQUFRLFdBQVcsUUFBUSxZQUFZLFFBQVEsWUFBWSxVQUFVLEdBRW5JO0FBQUEsa0RBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxRQUFRLFlBQVksVUFBVSxnQkFBZ0IsaUJBQWlCLFNBQVMsaUJBQWlCLE9BQU8sMkNBQTJDLFVBQVUsUUFBUSxZQUFZLElBQUksR0FDbE07QUFBQSxtREFBQyxVQUFLLGdDQUFHO0FBQUEsTUFDVCw2Q0FBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTSxHQUM5RDtBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0MsT0FBTztBQUFBLFlBQ0wsWUFBWTtBQUFBLFlBQ1osUUFBUTtBQUFBLFlBQ1IsT0FBTztBQUFBLFlBQ1AsUUFBUTtBQUFBLFlBQ1IsU0FBUztBQUFBLFlBQ1QsY0FBYztBQUFBLFlBQ2QsU0FBUztBQUFBLFlBQ1QsWUFBWTtBQUFBLFVBQ2Q7QUFBQSxVQUNBLE9BQU07QUFBQSxVQUNOLFNBQVMsTUFBTSxjQUFjLENBQUMsVUFBVTtBQUFBLFVBRXhDLHVEQUFDLGNBQVcsTUFBTSxJQUFJO0FBQUE7QUFBQSxNQUN4QixHQUNGO0FBQUEsT0FDRjtBQUFBLElBR0MsY0FDQyw2Q0FBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLGVBQWUsR0FDcEM7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLFdBQVM7QUFBQSxRQUNULE9BQU87QUFBQSxVQUNMLEdBQUc7QUFBQSxVQUNILE9BQU87QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxVQUNULGNBQWM7QUFBQSxRQUNoQjtBQUFBLFFBQ0EsYUFBWTtBQUFBLFFBQ1osT0FBTztBQUFBLFFBQ1AsVUFBVSxDQUFDLE1BQU0sZUFBZSxFQUFFLE9BQU8sS0FBSztBQUFBO0FBQUEsSUFDaEQsR0FDRjtBQUFBLElBSUQsWUFBWSxTQUFTLEtBQ3BCLDZDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsZUFBZSxTQUFTLFFBQVEsZUFBZSxVQUFVLEtBQUssTUFBTSxHQUN4RixzQkFBWSxJQUFJLENBQUMsU0FBUztBQUN6QixZQUFNLE9BQU8sa0JBQWtCLEtBQUssTUFBTTtBQUMxQyxhQUNFO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFFQyxPQUFPO0FBQUEsWUFDTCxTQUFTO0FBQUEsWUFDVCxZQUFZO0FBQUEsWUFDWixnQkFBZ0I7QUFBQSxZQUNoQixRQUFRO0FBQUEsWUFDUixTQUFTO0FBQUEsWUFDVCxjQUFjO0FBQUEsWUFDZCxZQUFZLEtBQUs7QUFBQSxZQUNqQixRQUFRLGFBQWEsS0FBSyxNQUFNO0FBQUEsWUFDaEMsUUFBUTtBQUFBLFlBQ1IsWUFBWTtBQUFBLFVBQ2Q7QUFBQSxVQUNBLE9BQU8sR0FBRyxLQUFLLFdBQVcsNkJBQVMsS0FBSyxXQUFXLGNBQWMsbUNBQVUsRUFBRSx1QkFBUSxLQUFLLElBQUksU0FBUyxnQ0FBTztBQUFBLFVBQzlHLFNBQVMsTUFBTSx1QkFBdUIsS0FBSyxXQUFXLEtBQUssRUFBRTtBQUFBLFVBQzdELGNBQWMsQ0FBQyxNQUFNO0FBQ25CLGNBQUUsY0FBYyxNQUFNLGFBQWEsS0FBSztBQUN4QyxjQUFFLGNBQWMsTUFBTSxjQUFjLEtBQUs7QUFDekMsa0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxlQUFlO0FBQzdELGdCQUFJLFFBQVMsU0FBUSxNQUFNLFFBQVE7QUFBQSxVQUNyQztBQUFBLFVBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsY0FBRSxjQUFjLE1BQU0sYUFBYSxLQUFLO0FBQ3hDLGNBQUUsY0FBYyxNQUFNLGNBQWMsS0FBSztBQUN6QyxrQkFBTSxVQUFVLEVBQUUsY0FBYyxjQUFjLGVBQWU7QUFDN0QsZ0JBQUksUUFBUyxTQUFRLE1BQU0sUUFBUTtBQUFBLFVBQ3JDO0FBQUEsVUFFQTtBQUFBLDBEQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsR0FDbkY7QUFBQSxtQkFBSyxXQUFXLFlBQ2YsNkNBQUMsY0FBVyxNQUFNLElBQUksSUFDcEIsS0FBSyxXQUFXLFlBQ2xCLDZDQUFDLGNBQVcsTUFBTSxJQUFJLElBRXRCLDZDQUFDLGdCQUFhLE1BQU0sSUFBSTtBQUFBLGNBRTFCLDZDQUFDLFVBQUssT0FBTyxFQUFFLFVBQVUsUUFBUSxZQUFZLEtBQUssT0FBTywyQ0FBMkMsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFNBQVMsR0FDcEssZUFBSyxPQUNSO0FBQUEsY0FDQyxLQUFLLElBQUksU0FDUiw4Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyw0Q0FBNEMsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFVBQVUsU0FBUyxJQUFJLEdBQUc7QUFBQTtBQUFBLGdCQUNuSyxLQUFLLEdBQUc7QUFBQSxpQkFDYjtBQUFBLGVBRUo7QUFBQSxZQUVBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFlBQVksRUFBRSxHQUM3RTtBQUFBO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU87QUFBQSxvQkFDTCxVQUFVO0FBQUEsb0JBQ1YsT0FBTyxLQUFLO0FBQUEsb0JBQ1osWUFBWSxLQUFLO0FBQUEsb0JBQ2pCLFNBQVM7QUFBQSxvQkFDVCxjQUFjO0FBQUEsb0JBQ2QsWUFBWTtBQUFBLG9CQUNaLFlBQVk7QUFBQSxrQkFDZDtBQUFBLGtCQUVDLGVBQUs7QUFBQTtBQUFBLGNBQ1I7QUFBQSxjQUNBLDZDQUFDLFVBQUssV0FBVSxnQkFBZSxPQUFPLEVBQUUsT0FBTyw0Q0FBNEMsYUFBYSxPQUFPLFlBQVksbUJBQW1CLEdBQzVJLHVEQUFDLG9CQUFpQixNQUFNLElBQUksR0FDOUI7QUFBQSxlQUNGO0FBQUE7QUFBQTtBQUFBLFFBL0RLLEtBQUs7QUFBQSxNQWdFWjtBQUFBLElBRUosQ0FBQyxHQUNIO0FBQUEsSUFJRiw2Q0FBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsZUFBZSxVQUFVLEtBQUssT0FBTyxTQUFTLFFBQVEsR0FDbEYsNkJBQW1CLElBQUksQ0FBQyxPQUFPO0FBQzlCLFlBQU0sYUFBYSxtQkFBbUIsSUFBSSxHQUFHLFdBQVc7QUFHeEQsWUFBTSxTQUFTLGdCQUFnQixvQkFBb0IsR0FBRyxJQUFJO0FBQzFELFlBQU0sY0FBYyxJQUFJLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxDQUFDO0FBRXpELFlBQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRO0FBQ3JELGNBQU0sU0FBUztBQUNmLGNBQU0sVUFBVSxjQUFjLE9BQU8sTUFBTTtBQUMzQyxjQUFNLFdBQVcsUUFBUSxTQUFTLGFBQWEsZUFBZSxJQUFJLE1BQU0sQ0FBQztBQUV6RSxlQUFPO0FBQUEsVUFDTCxJQUFJO0FBQUEsVUFDSixPQUFPLFNBQVMsU0FBUyxPQUFPLE1BQU0sR0FBRyxFQUFFO0FBQUEsVUFDM0MsV0FBVyxTQUFTLGFBQWE7QUFBQSxVQUNqQyxTQUFTLFFBQVEsU0FBUyxPQUFPO0FBQUEsVUFDakMsb0JBQW9CLFNBQVM7QUFBQSxVQUM3QixXQUFXLFlBQVksV0FBVztBQUFBLFVBQ2xDLE9BQU8sUUFBUSxTQUFTLEtBQUs7QUFBQSxVQUM3QixVQUFVLFlBQVksSUFBSSxNQUFNO0FBQUEsUUFDbEM7QUFBQSxNQUNGLENBQUM7QUFFRCxZQUFNLGdCQUFnQixZQUNuQixPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNwQyxPQUFPLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFDbkYsS0FBSyxDQUFDLEdBQUcsTUFBTTtBQUNkLFlBQUksRUFBRSxZQUFZLEVBQUUsUUFBUyxRQUFPLEVBQUUsVUFBVSxLQUFLO0FBQ3JELFlBQUksRUFBRSxhQUFhLEVBQUUsU0FBVSxRQUFPLEVBQUUsV0FBVyxLQUFLO0FBQ3hELGdCQUFRLEVBQUUsYUFBYSxNQUFNLEVBQUUsYUFBYTtBQUFBLE1BQzlDLENBQUM7QUFFSCxZQUFNLHdCQUF3QixvQkFBSSxJQUFZO0FBQzlDLGlCQUFXLEtBQUssT0FBTyxTQUFTO0FBQzlCLG1CQUFXLE9BQU8sRUFBRSxXQUFZLHVCQUFzQixJQUFJLEdBQUc7QUFBQSxNQUMvRDtBQUVBLFlBQU0sd0JBQXdCLGNBQWMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsSUFBSSxFQUFFLEVBQUUsQ0FBQztBQUMxRixZQUFNLFVBQVUsbUJBQW1CLEdBQUcsV0FBVyxLQUFLO0FBQ3RELFlBQU0sdUJBQXVCLFVBQVUsd0JBQXdCLHNCQUFzQixNQUFNLEdBQUcscUJBQXFCO0FBQ25ILFlBQU0saUJBQWlCLHNCQUFzQixTQUFTO0FBRXRELFlBQU0scUJBQXFCLENBQUMsUUFBZ0I7QUFDMUMsWUFBSSw0QkFBNEIsSUFBSyxRQUFPO0FBQzVDLGNBQU0sZ0JBQWdCLHNCQUFzQixJQUFJLEdBQUc7QUFDbkQsZUFDRTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsV0FBVTtBQUFBLFlBQ1YsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsUUFBUTtBQUFBLGNBQ1IsVUFBVTtBQUFBLGNBQ1YsWUFBWTtBQUFBLGNBQ1osUUFBUTtBQUFBLGNBQ1IsY0FBYztBQUFBLGNBQ2QsV0FBVztBQUFBLGNBQ1gsU0FBUztBQUFBLGNBQ1QsU0FBUztBQUFBLGNBQ1QsZUFBZTtBQUFBLGNBQ2YsS0FBSztBQUFBLFlBQ1A7QUFBQSxZQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsWUFFbEM7QUFBQSwyREFBQyxTQUFJLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyw0Q0FBNEMsU0FBUyxXQUFXLFlBQVksS0FBSyxjQUFjLHNDQUFzQyxHQUFHLCtEQUUvSztBQUFBLGNBQ0MsT0FBTyxRQUFRLFdBQVcsSUFDekIsNkNBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxXQUFXLFVBQVUsUUFBUSxPQUFPLDJDQUEyQyxHQUFHLDBFQUV6RyxJQUVBLE9BQU8sUUFBUSxJQUFJLENBQUMsTUFBTTtBQUN4QixzQkFBTSxlQUFlLEVBQUUsV0FBVyxTQUFTLEdBQUc7QUFDOUMsdUJBQ0U7QUFBQSxrQkFBQztBQUFBO0FBQUEsb0JBRUMsT0FBTztBQUFBLHNCQUNMLFNBQVM7QUFBQSxzQkFDVCxZQUFZO0FBQUEsc0JBQ1osS0FBSztBQUFBLHNCQUNMLFNBQVM7QUFBQSxzQkFDVCxjQUFjO0FBQUEsc0JBQ2QsUUFBUTtBQUFBLHNCQUNSLFVBQVU7QUFBQSxzQkFDVixPQUFPLGVBQWUsWUFBWTtBQUFBLHNCQUNsQyxZQUFZLGVBQWUsNkJBQTZCO0FBQUEsb0JBQzFEO0FBQUEsb0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLG9CQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhLGVBQWUsNkJBQTZCO0FBQUEsb0JBQ3JHLFNBQVMsWUFBWTtBQUNuQiw0QkFBTSxnQkFBZ0IsWUFBWSxHQUFHLE1BQU0sS0FBSyxFQUFFLEVBQUU7QUFDcEQsaURBQTJCLElBQUk7QUFBQSxvQkFDakM7QUFBQSxvQkFFQTtBQUFBLG1FQUFDLGNBQVcsTUFBTSxJQUFJLE9BQU8sRUFBRSxTQUFTLFdBQVc7QUFBQSxzQkFDbkQsNkNBQUMsVUFBSyxPQUFPLEVBQUUsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFVBQVUsTUFBTSxFQUFFLEdBQUksWUFBRSxNQUFLO0FBQUEsc0JBQ3JHLGdCQUFnQiw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyxVQUFVLEdBQUcsb0JBQUM7QUFBQTtBQUFBO0FBQUEsa0JBckJsRSxFQUFFO0FBQUEsZ0JBc0JUO0FBQUEsY0FFSixDQUFDO0FBQUEsY0FJRixpQkFDQztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULFlBQVk7QUFBQSxvQkFDWixLQUFLO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULGNBQWM7QUFBQSxvQkFDZCxRQUFRO0FBQUEsb0JBQ1IsVUFBVTtBQUFBLG9CQUNWLE9BQU87QUFBQSxvQkFDUCxXQUFXO0FBQUEsb0JBQ1gsV0FBVztBQUFBLGtCQUNiO0FBQUEsa0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLGtCQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsa0JBQ3pELFNBQVMsWUFBWTtBQUNuQiwwQkFBTSxnQkFBZ0IsWUFBWSxHQUFHLE1BQU0sS0FBSyxJQUFJO0FBQ3BELCtDQUEyQixJQUFJO0FBQUEsa0JBQ2pDO0FBQUEsa0JBRUE7QUFBQSxpRUFBQyxlQUFZLE1BQU0sSUFBSTtBQUFBLG9CQUN2Qiw2Q0FBQyxVQUFLLGtEQUFNO0FBQUE7QUFBQTtBQUFBLGNBQ2Q7QUFBQTtBQUFBO0FBQUEsUUFFSjtBQUFBLE1BRUo7QUFFQSxhQUNFLDhDQUFDLFNBQXlCLE9BQU8sRUFBRSxTQUFTLFFBQVEsZUFBZSxTQUFTLEdBRTFFO0FBQUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE9BQU87QUFBQSxjQUNMLFNBQVM7QUFBQSxjQUNULFlBQVk7QUFBQSxjQUNaLGdCQUFnQjtBQUFBLGNBQ2hCLFFBQVE7QUFBQSxjQUNSLFNBQVM7QUFBQSxjQUNULGNBQWM7QUFBQSxjQUNkLFFBQVE7QUFBQSxjQUNSLFlBQVksYUFBYSxrRUFBa0U7QUFBQSxjQUMzRixPQUFPO0FBQUEsY0FDUCxVQUFVO0FBQUEsY0FDVixZQUFZO0FBQUEsY0FDWixVQUFVO0FBQUEsWUFDWjtBQUFBLFlBQ0EsU0FBUyxNQUFNLGdCQUFnQixHQUFHLGFBQWEsR0FBRyxJQUFJO0FBQUEsWUFDdEQsY0FBYyxDQUFDLE1BQU07QUFDbkIsb0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxhQUFhO0FBQzNELGtCQUFJLFFBQVMsU0FBUSxNQUFNLFVBQVU7QUFBQSxZQUN2QztBQUFBLFlBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsb0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxhQUFhO0FBQzNELGtCQUFJLFdBQVcsbUJBQW1CLEdBQUcsWUFBYSxTQUFRLE1BQU0sVUFBVTtBQUFBLFlBQzVFO0FBQUEsWUFFQTtBQUFBLDREQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsR0FDcEY7QUFBQTtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxNQUFNO0FBQUEsb0JBQ04sT0FBTztBQUFBLHNCQUNMLE9BQU87QUFBQSxzQkFDUCxXQUFXLGFBQWEsa0JBQWtCO0FBQUEsc0JBQzFDLFlBQVk7QUFBQSxzQkFDWixZQUFZO0FBQUEsb0JBQ2Q7QUFBQTtBQUFBLGdCQUNGO0FBQUEsZ0JBQ0EsNkNBQUMsY0FBVyxNQUFNLElBQUksT0FBTSxXQUFVLE9BQU8sRUFBRSxZQUFZLEVBQUUsR0FBRztBQUFBLGdCQUMvRCxnQkFBZ0IsR0FBRyxjQUNsQjtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxXQUFTO0FBQUEsb0JBQ1QsT0FBTztBQUFBLHNCQUNMLEdBQUc7QUFBQSxzQkFDSCxVQUFVO0FBQUEsc0JBQ1YsTUFBTTtBQUFBLHNCQUNOLGFBQWE7QUFBQSxvQkFDZjtBQUFBLG9CQUNBLE9BQU87QUFBQSxvQkFDUCxVQUFVLENBQUMsTUFBTSxlQUFlLEVBQUUsT0FBTyxLQUFLO0FBQUEsb0JBQzlDLFFBQVEsTUFBTSxtQkFBbUIsR0FBRyxXQUFXO0FBQUEsb0JBQy9DLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLDBCQUFJLEVBQUUsUUFBUSxRQUFTLG9CQUFtQixHQUFHLFdBQVc7QUFDeEQsMEJBQUksRUFBRSxRQUFRLFNBQVUsZ0JBQWUsSUFBSTtBQUFBLG9CQUM3QztBQUFBLG9CQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUE7QUFBQSxnQkFDcEMsSUFFQSw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFVBQVUsY0FBYyxZQUFZLFlBQVksU0FBUyxHQUFHLE9BQU8sR0FBRyxNQUM1RixhQUFHLE9BQ047QUFBQSxpQkFFSjtBQUFBLGNBR0E7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsV0FBVTtBQUFBLGtCQUNWLE9BQU8sRUFBRSxTQUFTLG1CQUFtQixHQUFHLGNBQWMsZ0JBQWdCLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTTtBQUFBLGtCQUMvRyxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQjtBQUFBLGtCQUVsQztBQUFBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU87QUFBQSwwQkFDTCxZQUFZO0FBQUEsMEJBQ1osUUFBUTtBQUFBLDBCQUNSLE9BQU87QUFBQSwwQkFDUCxRQUFRO0FBQUEsMEJBQ1IsU0FBUztBQUFBLDBCQUNULGNBQWM7QUFBQSwwQkFDZCxTQUFTO0FBQUEsMEJBQ1QsWUFBWTtBQUFBLHdCQUNkO0FBQUEsd0JBQ0EsT0FBTTtBQUFBLHdCQUNOLFNBQVMsTUFBTTtBQUNiLDhCQUFJLENBQUMsV0FBWSxpQkFBZ0IsR0FBRyxhQUFhLEdBQUcsSUFBSTtBQUN4RCxrREFBd0IsR0FBRyxXQUFXO0FBQUEsd0JBQ3hDO0FBQUEsd0JBRUEsdURBQUMsaUJBQWMsTUFBTSxJQUFJO0FBQUE7QUFBQSxvQkFDM0I7QUFBQSxvQkFDQTtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxPQUFPO0FBQUEsMEJBQ0wsWUFBWTtBQUFBLDBCQUNaLFFBQVE7QUFBQSwwQkFDUixPQUFPO0FBQUEsMEJBQ1AsUUFBUTtBQUFBLDBCQUNSLFNBQVM7QUFBQSwwQkFDVCxjQUFjO0FBQUEsMEJBQ2QsU0FBUztBQUFBLDBCQUNULFlBQVk7QUFBQSx3QkFDZDtBQUFBLHdCQUNBLE9BQU07QUFBQSx3QkFDTixTQUFTLE1BQU0sTUFBTSxlQUFlLEdBQUcsV0FBVztBQUFBLHdCQUVsRCx1REFBQyxZQUFTLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQ3RCO0FBQUEsb0JBQ0E7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTztBQUFBLDBCQUNMLFlBQVk7QUFBQSwwQkFDWixRQUFRO0FBQUEsMEJBQ1IsT0FBTztBQUFBLDBCQUNQLFFBQVE7QUFBQSwwQkFDUixTQUFTO0FBQUEsMEJBQ1QsY0FBYztBQUFBLDBCQUNkLFNBQVM7QUFBQSwwQkFDVCxZQUFZO0FBQUEsd0JBQ2Q7QUFBQSx3QkFDQSxPQUFNO0FBQUEsd0JBQ04sU0FBUyxNQUFNLGtCQUFrQixtQkFBbUIsR0FBRyxjQUFjLE9BQU8sR0FBRyxXQUFXO0FBQUEsd0JBRTFGLHVEQUFDLGdCQUFhLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQzFCO0FBQUE7QUFBQTtBQUFBLGNBQ0Y7QUFBQSxjQUdDLG1CQUFtQixHQUFHLGVBQ3JCO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLEtBQUs7QUFBQSxrQkFDTCxPQUFPO0FBQUEsb0JBQ0wsVUFBVTtBQUFBLG9CQUNWLE9BQU87QUFBQSxvQkFDUCxLQUFLO0FBQUEsb0JBQ0wsUUFBUTtBQUFBLG9CQUNSLFlBQVk7QUFBQSxvQkFDWixRQUFRO0FBQUEsb0JBQ1IsY0FBYztBQUFBLG9CQUNkLFdBQVc7QUFBQSxvQkFDWCxTQUFTO0FBQUEsb0JBQ1QsVUFBVTtBQUFBLG9CQUNWLGdCQUFnQjtBQUFBLGtCQUNsQjtBQUFBLGtCQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsa0JBRWxDO0FBQUE7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTztBQUFBLDBCQUNMLFNBQVM7QUFBQSwwQkFDVCxZQUFZO0FBQUEsMEJBQ1osS0FBSztBQUFBLDBCQUNMLFNBQVM7QUFBQSwwQkFDVCxjQUFjO0FBQUEsMEJBQ2QsUUFBUTtBQUFBLDBCQUNSLFVBQVU7QUFBQSwwQkFDVixPQUFPO0FBQUEsd0JBQ1Q7QUFBQSx3QkFDQSxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsd0JBQ3pELGNBQWMsQ0FBQyxNQUFPLEVBQUUsY0FBYyxNQUFNLGFBQWE7QUFBQSx3QkFDekQsU0FBUyxNQUFNO0FBQ2IseUNBQWUsR0FBRyxXQUFXO0FBQzdCLHlDQUFlLEdBQUcsS0FBSztBQUN2Qiw0Q0FBa0IsSUFBSTtBQUFBLHdCQUN4QjtBQUFBLHdCQUVBO0FBQUEsdUVBQUMsWUFBUyxNQUFNLElBQUk7QUFBQSwwQkFDcEIsNkNBQUMsVUFBSyxnQ0FBRztBQUFBO0FBQUE7QUFBQSxvQkFDWDtBQUFBLG9CQUNBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU87QUFBQSwwQkFDTCxTQUFTO0FBQUEsMEJBQ1QsWUFBWTtBQUFBLDBCQUNaLEtBQUs7QUFBQSwwQkFDTCxTQUFTO0FBQUEsMEJBQ1QsY0FBYztBQUFBLDBCQUNkLFFBQVE7QUFBQSwwQkFDUixVQUFVO0FBQUEsMEJBQ1YsT0FBTztBQUFBLHdCQUNUO0FBQUEsd0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLHdCQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsd0JBQ3pELFNBQVMsTUFBTTtBQUNiLGdDQUFNLGtCQUFrQixHQUFHLFdBQVc7QUFDdEMsNENBQWtCLElBQUk7QUFBQSx3QkFDeEI7QUFBQSx3QkFFQTtBQUFBLHVFQUFDLGFBQVUsTUFBTSxJQUFJO0FBQUEsMEJBQ3JCLDZDQUFDLFVBQUssNENBQUs7QUFBQTtBQUFBO0FBQUEsb0JBQ2I7QUFBQTtBQUFBO0FBQUEsY0FDRjtBQUFBO0FBQUE7QUFBQSxRQUVKO0FBQUEsUUFHQyxjQUNDLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFVBQVUsS0FBSyxPQUFPLGFBQWEsT0FBTyxHQUVyRjtBQUFBLG1DQUF5QixHQUFHLGVBQzNCLDZDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsVUFBVSxHQUMvQjtBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsV0FBUztBQUFBLGNBQ1QsT0FBTztBQUFBLGdCQUNMLEdBQUc7QUFBQSxnQkFDSCxPQUFPO0FBQUEsZ0JBQ1AsUUFBUTtBQUFBLGdCQUNSLFNBQVM7QUFBQSxjQUNYO0FBQUEsY0FDQSxhQUFZO0FBQUEsY0FDWixPQUFPO0FBQUEsY0FDUCxVQUFVLENBQUMsTUFBTSxpQkFBaUIsRUFBRSxPQUFPLEtBQUs7QUFBQSxjQUNoRCxXQUFXLENBQUMsTUFBTTtBQUNoQixvQkFBSSxFQUFFLFFBQVEsUUFBUyxvQkFBbUIsR0FBRyxJQUFJO0FBQ2pELG9CQUFJLEVBQUUsUUFBUSxTQUFVLHlCQUF3QixJQUFJO0FBQUEsY0FDdEQ7QUFBQSxjQUNBLFFBQVEsTUFBTTtBQUNaLG9CQUFJLENBQUMsY0FBYyxLQUFLLEVBQUcseUJBQXdCLElBQUk7QUFBQSxvQkFDbEQsb0JBQW1CLEdBQUcsSUFBSTtBQUFBLGNBQ2pDO0FBQUE7QUFBQSxVQUNGLEdBQ0Y7QUFBQSxVQUlELE9BQU8sUUFBUSxJQUFJLENBQUMsV0FBVztBQUM5QixrQkFBTSxpQkFBaUIsT0FBTyxXQUMzQixJQUFJLENBQUMsUUFBUTtBQUNaLG9CQUFNLFVBQVUsY0FBYyxPQUFPLEdBQXdCO0FBQzdELG9CQUFNLFdBQVcsUUFBUSxTQUFTLGFBQWEsZUFBZSxJQUFJLEdBQUcsQ0FBQztBQUN0RSxxQkFBTztBQUFBLGdCQUNMLElBQUk7QUFBQSxnQkFDSixPQUFPLFNBQVMsU0FBUyxJQUFJLE1BQU0sR0FBRyxFQUFFO0FBQUEsZ0JBQ3hDLFdBQVcsU0FBUyxhQUFhO0FBQUEsZ0JBQ2pDLFNBQVMsUUFBUSxTQUFTLE9BQU87QUFBQSxnQkFDakMsb0JBQW9CLFNBQVM7QUFBQSxnQkFDN0IsV0FBVyxZQUFZLFFBQVE7QUFBQSxnQkFDL0IsT0FBTyxRQUFRLFNBQVMsS0FBSztBQUFBLGdCQUM3QixVQUFVLFlBQVksSUFBSSxHQUFHO0FBQUEsY0FDL0I7QUFBQSxZQUNGLENBQUMsRUFDQSxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNwQyxLQUFLLENBQUMsR0FBRyxNQUFNO0FBQ2Qsa0JBQUksRUFBRSxZQUFZLEVBQUUsUUFBUyxRQUFPLEVBQUUsVUFBVSxLQUFLO0FBQ3JELGtCQUFJLEVBQUUsYUFBYSxFQUFFLFNBQVUsUUFBTyxFQUFFLFdBQVcsS0FBSztBQUN4RCxzQkFBUSxFQUFFLGFBQWEsTUFBTSxFQUFFLGFBQWE7QUFBQSxZQUM5QyxDQUFDO0FBRUgsbUJBQ0UsOENBQUMsU0FBb0IsT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFNBQVMsR0FFckU7QUFBQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULFlBQVk7QUFBQSxvQkFDWixnQkFBZ0I7QUFBQSxvQkFDaEIsUUFBUTtBQUFBLG9CQUNSLFNBQVM7QUFBQSxvQkFDVCxjQUFjO0FBQUEsb0JBQ2QsUUFBUTtBQUFBLG9CQUNSLE9BQU8sbUJBQW1CLE9BQU8sS0FBSyxxREFBcUQ7QUFBQSxvQkFDM0YsWUFBWSxtQkFBbUIsT0FBTyxLQUFLLDZCQUE2QjtBQUFBLG9CQUN4RSxRQUFRLG1CQUFtQixPQUFPLEtBQUssdUJBQXVCO0FBQUEsb0JBQzlELFVBQVU7QUFBQSxvQkFDVixZQUFZO0FBQUEsa0JBQ2Q7QUFBQSxrQkFDQSxTQUFTLE1BQU0sZ0JBQWdCLGFBQWEsR0FBRyxNQUFNLE9BQU8sRUFBRTtBQUFBLGtCQUM5RCxjQUFjLENBQUMsTUFBTTtBQUNuQiwwQkFBTSxVQUFVLEVBQUUsY0FBYyxjQUFjLGlCQUFpQjtBQUMvRCx3QkFBSSxRQUFTLFNBQVEsTUFBTSxVQUFVO0FBQUEsa0JBQ3ZDO0FBQUEsa0JBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsMEJBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxpQkFBaUI7QUFDL0Qsd0JBQUksUUFBUyxTQUFRLE1BQU0sVUFBVTtBQUFBLGtCQUN2QztBQUFBLGtCQUNBLFlBQVksQ0FBQyxNQUFNO0FBQ2pCLHNCQUFFLGVBQWU7QUFDakIsc0JBQUUsZ0JBQWdCO0FBQ2xCLHdCQUFJLG1CQUFtQixPQUFPLEdBQUksbUJBQWtCLE9BQU8sRUFBRTtBQUFBLGtCQUMvRDtBQUFBLGtCQUNBLGFBQWEsQ0FBQyxNQUFNO0FBQ2xCLHdCQUFJLENBQUMsRUFBRSxjQUFjLFNBQVMsRUFBRSxhQUFxQixHQUFHO0FBQ3RELDBCQUFJLG1CQUFtQixPQUFPLEdBQUksbUJBQWtCLElBQUk7QUFBQSxvQkFDMUQ7QUFBQSxrQkFDRjtBQUFBLGtCQUNBLFFBQVEsT0FBTyxNQUFNO0FBQ25CLHNCQUFFLGVBQWU7QUFDakIsc0JBQUUsZ0JBQWdCO0FBQ2xCLHNDQUFrQixJQUFJO0FBQ3RCLDBCQUFNLE1BQU0sRUFBRSxhQUFhLFFBQVEsWUFBWSxLQUFLO0FBQ3BELHlDQUFxQixJQUFJO0FBQ3pCLHdCQUFJLElBQUssT0FBTSxnQkFBZ0IsWUFBWSxHQUFHLE1BQU0sS0FBSyxPQUFPLEVBQUU7QUFBQSxrQkFDcEU7QUFBQSxrQkFFQTtBQUFBLGtFQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsR0FDcEY7QUFBQTtBQUFBLHdCQUFDO0FBQUE7QUFBQSwwQkFDQyxNQUFNO0FBQUEsMEJBQ04sT0FBTztBQUFBLDRCQUNMLE9BQU8sbUJBQW1CLE9BQU8sS0FBSyxZQUFZO0FBQUEsNEJBQ2xELFdBQVcsT0FBTyxZQUFZLGlCQUFpQjtBQUFBLDRCQUMvQyxZQUFZO0FBQUEsNEJBQ1osWUFBWTtBQUFBLDBCQUNkO0FBQUE7QUFBQSxzQkFDRjtBQUFBLHNCQUNBLDZDQUFDLGNBQVcsTUFBTSxJQUFJLE9BQU8sbUJBQW1CLE9BQU8sS0FBSyxZQUFhLE9BQU8sU0FBUyxXQUFZLE9BQU8sRUFBRSxZQUFZLEVBQUUsR0FBRztBQUFBLHNCQUM5SCxvQkFBb0IsT0FBTyxLQUMxQjtBQUFBLHdCQUFDO0FBQUE7QUFBQSwwQkFDQyxXQUFTO0FBQUEsMEJBQ1QsT0FBTztBQUFBLDRCQUNMLEdBQUc7QUFBQSw0QkFDSCxVQUFVO0FBQUEsNEJBQ1YsTUFBTTtBQUFBLDRCQUNOLFFBQVE7QUFBQSw0QkFDUixVQUFVO0FBQUEsNEJBQ1YsYUFBYTtBQUFBLDBCQUNmO0FBQUEsMEJBQ0EsT0FBTztBQUFBLDBCQUNQLFVBQVUsQ0FBQyxNQUFNLGtCQUFrQixFQUFFLE9BQU8sS0FBSztBQUFBLDBCQUNqRCxRQUFRLFlBQVk7QUFDbEIsZ0NBQUksZUFBZSxLQUFLLEVBQUcsT0FBTSxnQkFBZ0IsYUFBYSxHQUFHLE1BQU0sT0FBTyxJQUFJLGVBQWUsS0FBSyxDQUFDO0FBQ3ZHLCtDQUFtQixJQUFJO0FBQUEsMEJBQ3pCO0FBQUEsMEJBQ0EsV0FBVyxPQUFPLE1BQU07QUFDdEIsZ0NBQUksRUFBRSxRQUFRLFNBQVM7QUFDckIsa0NBQUksZUFBZSxLQUFLLEVBQUcsT0FBTSxnQkFBZ0IsYUFBYSxHQUFHLE1BQU0sT0FBTyxJQUFJLGVBQWUsS0FBSyxDQUFDO0FBQ3ZHLGlEQUFtQixJQUFJO0FBQUEsNEJBQ3pCO0FBQ0EsZ0NBQUksRUFBRSxRQUFRLFNBQVUsb0JBQW1CLElBQUk7QUFBQSwwQkFDakQ7QUFBQSwwQkFDQSxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQjtBQUFBO0FBQUEsc0JBQ3BDLElBRUEsNkNBQUMsVUFBSyxPQUFPLEVBQUUsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFVBQVUsWUFBWSxJQUFJLEdBQUcsZUFBZSxNQUFNO0FBQUUsMkNBQW1CLE9BQU8sRUFBRTtBQUFHLDBDQUFrQixPQUFPLElBQUk7QUFBQSxzQkFBRSxHQUN4TCxpQkFBTyxNQUNWO0FBQUEsc0JBRUYsOENBQUMsVUFBSyxPQUFPLEVBQUUsVUFBVSxRQUFRLE9BQU8sMkNBQTJDLEdBQUc7QUFBQTtBQUFBLHdCQUFFLGVBQWU7QUFBQSx3QkFBTztBQUFBLHlCQUFDO0FBQUEsc0JBQzlHLG1CQUFtQixPQUFPLE1BQ3pCLDZDQUFDLFVBQUssT0FBTyxFQUFFLFVBQVUsUUFBUSxPQUFPLFdBQVcsWUFBWSxLQUFLLGFBQWEsTUFBTSxHQUFHLGtEQUFNO0FBQUEsdUJBRXBHO0FBQUEsb0JBR0EsOENBQUMsU0FBSSxXQUFVLGtCQUFpQixPQUFPLEVBQUUsU0FBUyxRQUFRLFlBQVksVUFBVSxLQUFLLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQixHQUM5SDtBQUFBO0FBQUEsd0JBQUM7QUFBQTtBQUFBLDBCQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sNENBQTRDLFFBQVEsV0FBVyxTQUFTLE9BQU8sU0FBUyxlQUFlLFlBQVksU0FBUztBQUFBLDBCQUN2TCxPQUFNO0FBQUEsMEJBQ04sU0FBUyxNQUFNLDRCQUE0QixHQUFHLGFBQWEsR0FBRyxNQUFNLE9BQU8sRUFBRTtBQUFBLDBCQUU3RSx1REFBQyxZQUFTLE1BQU0sSUFBSTtBQUFBO0FBQUEsc0JBQ3RCO0FBQUEsc0JBQ0E7QUFBQSx3QkFBQztBQUFBO0FBQUEsMEJBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsT0FBTyxTQUFTLGVBQWUsWUFBWSxTQUFTO0FBQUEsMEJBQ3ZMLE9BQU07QUFBQSwwQkFDTixTQUFTLE1BQU07QUFBRSwrQ0FBbUIsT0FBTyxFQUFFO0FBQUcsOENBQWtCLE9BQU8sSUFBSTtBQUFBLDBCQUFFO0FBQUEsMEJBRS9FLHVEQUFDLFlBQVMsTUFBTSxJQUFJO0FBQUE7QUFBQSxzQkFDdEI7QUFBQSxzQkFDQTtBQUFBLHdCQUFDO0FBQUE7QUFBQSwwQkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLFdBQVcsUUFBUSxXQUFXLFNBQVMsT0FBTyxTQUFTLGVBQWUsWUFBWSxTQUFTO0FBQUEsMEJBQ3RKLE9BQU07QUFBQSwwQkFDTixTQUFTLE1BQU0sZ0JBQWdCLGFBQWEsR0FBRyxNQUFNLE9BQU8sRUFBRTtBQUFBLDBCQUU5RCx1REFBQyxhQUFVLE1BQU0sSUFBSTtBQUFBO0FBQUEsc0JBQ3ZCO0FBQUEsdUJBQ0Y7QUFBQTtBQUFBO0FBQUEsY0FDRjtBQUFBLGNBR0MsQ0FBQyxPQUFPLGFBQ1A7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsT0FBTztBQUFBLG9CQUNMLFNBQVM7QUFBQSxvQkFDVCxlQUFlO0FBQUEsb0JBQ2YsS0FBSztBQUFBLG9CQUNMLGFBQWE7QUFBQSxvQkFDYixXQUFXLGVBQWUsV0FBVyxJQUFJLFNBQVM7QUFBQSxrQkFDcEQ7QUFBQSxrQkFDQSxZQUFZLENBQUMsTUFBTTtBQUNqQixzQkFBRSxlQUFlO0FBQ2pCLHNCQUFFLGdCQUFnQjtBQUNsQix3QkFBSSxtQkFBbUIsT0FBTyxHQUFJLG1CQUFrQixPQUFPLEVBQUU7QUFBQSxrQkFDL0Q7QUFBQSxrQkFDQSxhQUFhLENBQUMsTUFBTTtBQUNsQix3QkFBSSxDQUFDLEVBQUUsY0FBYyxTQUFTLEVBQUUsYUFBcUIsR0FBRztBQUN0RCwwQkFBSSxtQkFBbUIsT0FBTyxHQUFJLG1CQUFrQixJQUFJO0FBQUEsb0JBQzFEO0FBQUEsa0JBQ0Y7QUFBQSxrQkFDQSxRQUFRLE9BQU8sTUFBTTtBQUNuQixzQkFBRSxlQUFlO0FBQ2pCLHNCQUFFLGdCQUFnQjtBQUNsQixzQ0FBa0IsSUFBSTtBQUN0QiwwQkFBTSxNQUFNLEVBQUUsYUFBYSxRQUFRLFlBQVksS0FBSztBQUNwRCx5Q0FBcUIsSUFBSTtBQUN6Qix3QkFBSSxJQUFLLE9BQU0sZ0JBQWdCLFlBQVksR0FBRyxNQUFNLEtBQUssT0FBTyxFQUFFO0FBQUEsa0JBQ3BFO0FBQUEsa0JBRUMseUJBQWUsSUFBSSxDQUFDLE1BQU07QUFDekIsMEJBQU0sV0FBVyxvQkFBb0IsRUFBRTtBQUN2QywwQkFBTSxVQUFVLG1CQUFtQixFQUFFLFNBQVM7QUFFOUMsMkJBQ0U7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBRUMsV0FBVyxxQkFBcUIsRUFBRTtBQUFBLHdCQUNsQyxPQUFPO0FBQUEsMEJBQ0wsU0FBUztBQUFBLDBCQUNULFlBQVk7QUFBQSwwQkFDWixnQkFBZ0I7QUFBQSwwQkFDaEIsUUFBUTtBQUFBLDBCQUNSLFNBQVM7QUFBQSwwQkFDVCxjQUFjO0FBQUEsMEJBQ2QsUUFBUTtBQUFBLDBCQUNSLFlBQVk7QUFBQSwwQkFDWixrQkFBa0I7QUFBQSwwQkFDbEIsWUFBWSxXQUFXLGtFQUFrRTtBQUFBLDBCQUN6RixPQUFPLFdBQVcscURBQXFEO0FBQUEsMEJBQ3ZFLFVBQVU7QUFBQSwwQkFDVixZQUFZLFdBQVcsTUFBTTtBQUFBLDBCQUM3QixTQUFTLHNCQUFzQixFQUFFLEtBQUssT0FBTztBQUFBLDBCQUM3QyxRQUFRLHNCQUFzQixFQUFFLEtBQUssdUJBQXVCO0FBQUEsMEJBQzVELFlBQVk7QUFBQSx3QkFDZDtBQUFBLHdCQUNBLFNBQVMsTUFBTSxrQkFBa0IsRUFBRSxFQUFFO0FBQUEsd0JBQ3JDLGVBQWUsQ0FBQyxNQUFNO0FBQ3BCLDRCQUFFLGdCQUFnQjtBQUNsQiw4Q0FBb0IsRUFBRSxFQUFFO0FBQ3hCLDhDQUFvQixFQUFFLEtBQUs7QUFBQSx3QkFDN0I7QUFBQSx3QkFDQSxjQUFjLENBQUMsTUFBTTtBQUNuQixnQ0FBTSxNQUFNLEVBQUUsY0FBYyxjQUFjLFdBQVc7QUFDckQsZ0NBQU0sS0FBSyxFQUFFLGNBQWMsY0FBYyxZQUFZO0FBQ3JELDhCQUFJLElBQUssS0FBSSxNQUFNLFVBQVU7QUFDN0IsOEJBQUksR0FBSSxJQUFHLE1BQU0sVUFBVTtBQUFBLHdCQUM3QjtBQUFBLHdCQUNBLGNBQWMsQ0FBQyxNQUFNO0FBQ25CLGdDQUFNLE1BQU0sRUFBRSxjQUFjLGNBQWMsV0FBVztBQUNyRCxnQ0FBTSxLQUFLLEVBQUUsY0FBYyxjQUFjLFlBQVk7QUFDckQsOEJBQUksSUFBSyxLQUFJLE1BQU0sVUFBVTtBQUM3Qiw4QkFBSSxHQUFJLElBQUcsTUFBTSxVQUFVO0FBQUEsd0JBQzdCO0FBQUEsd0JBQ0EsYUFBYSxDQUFDLE1BQU07QUFDbEIsNEJBQUUsZ0JBQWdCO0FBQ2xCLDRCQUFFLGFBQWEsZ0JBQWdCO0FBQy9CLDRCQUFFLGFBQWEsUUFBUSxjQUFjLEVBQUUsRUFBRTtBQUN6QywrQ0FBcUIsRUFBRSxFQUFFO0FBQUEsd0JBQzNCO0FBQUEsd0JBQ0EsV0FBVyxNQUFNO0FBQ2YsK0NBQXFCLElBQUk7QUFDekIsNENBQWtCLElBQUk7QUFBQSx3QkFDeEI7QUFBQSx3QkFFQTtBQUFBLHdFQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEdBQUcsZUFBZSxxQkFBcUIsRUFBRSxLQUFLLFNBQVMsT0FBTyxHQUMvSTtBQUFBLDhCQUFFLFVBQ0QsNkNBQUMsY0FBVyxNQUFNLElBQUksSUFDcEIsRUFBRSxxQkFDSiw2Q0FBQyxjQUFXLElBQ1YsRUFBRSxZQUNKLDZDQUFDLGdCQUFhLE1BQU0sSUFBSSxJQUN0QixFQUFFLFdBQ0osNkNBQUMsV0FBUSxNQUFNLElBQUksUUFBUSxNQUFNLE9BQU8sRUFBRSxPQUFPLFdBQVcsWUFBWSxFQUFFLEdBQUcsSUFFN0UsNkNBQUMsWUFBUyxNQUFNLElBQUksT0FBTyxFQUFFLFlBQVksR0FBRyxTQUFTLElBQUksR0FBRztBQUFBLDRCQUc3RCxxQkFBcUIsRUFBRSxLQUN0QjtBQUFBLDhCQUFDO0FBQUE7QUFBQSxnQ0FDQyxXQUFTO0FBQUEsZ0NBQ1QsT0FBTztBQUFBLGtDQUNMLEdBQUc7QUFBQSxrQ0FDSCxVQUFVO0FBQUEsa0NBQ1YsTUFBTTtBQUFBLGtDQUNOLFFBQVE7QUFBQSxrQ0FDUixVQUFVO0FBQUEsa0NBQ1YsYUFBYTtBQUFBLGtDQUNiLGVBQWU7QUFBQSxnQ0FDakI7QUFBQSxnQ0FDQSxPQUFPO0FBQUEsZ0NBQ1AsVUFBVSxDQUFDLE1BQU0sb0JBQW9CLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0NBQ25ELFFBQVEsTUFBTSx3QkFBd0IsRUFBRSxFQUFFO0FBQUEsZ0NBQzFDLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLHNDQUFJLEVBQUUsUUFBUSxRQUFTLHlCQUF3QixFQUFFLEVBQUU7QUFDbkQsc0NBQUksRUFBRSxRQUFRLFNBQVUscUJBQW9CLElBQUk7QUFBQSxnQ0FDbEQ7QUFBQSxnQ0FDQSxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQjtBQUFBO0FBQUEsNEJBQ3BDLElBRUE7QUFBQSw4QkFBQztBQUFBO0FBQUEsZ0NBQ0MsT0FBTztBQUFBLGtDQUNMLFVBQVU7QUFBQSxrQ0FDVixjQUFjO0FBQUEsa0NBQ2QsWUFBWTtBQUFBLGtDQUNaLFlBQVk7QUFBQSxrQ0FDWixrQkFBa0I7QUFBQSxnQ0FDcEI7QUFBQSxnQ0FDQSxPQUFPLEVBQUU7QUFBQSxnQ0FFUixZQUFFO0FBQUE7QUFBQSw0QkFDTDtBQUFBLDZCQUVKO0FBQUEsMEJBRUMscUJBQXFCLEVBQUUsTUFDdEI7QUFBQSw0QkFBQztBQUFBO0FBQUEsOEJBQ0MsV0FBVTtBQUFBLDhCQUNWLE9BQU87QUFBQSxnQ0FDTCxVQUFVO0FBQUEsZ0NBQ1YsT0FBTyxFQUFFLFVBQVUsWUFBWSxFQUFFLFlBQVksWUFBWTtBQUFBLGdDQUN6RCxZQUFZLEVBQUUsWUFBWSxNQUFNO0FBQUEsZ0NBQ2hDLFlBQVk7QUFBQSw4QkFDZDtBQUFBLDhCQUVDLFlBQUUsVUFBVSx1QkFBUSxFQUFFLFlBQVksdUJBQVE7QUFBQTtBQUFBLDBCQUM3QztBQUFBLDBCQUlGLDhDQUFDLFNBQUksV0FBVSxZQUFXLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTSxHQUNuRjtBQUFBO0FBQUEsOEJBQUM7QUFBQTtBQUFBLGdDQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sRUFBRSxXQUFXLFlBQVksNENBQTRDLFFBQVEsV0FBVyxTQUFTLE1BQU07QUFBQSxnQ0FDbEssT0FBTyxFQUFFLFdBQVcsNkJBQVM7QUFBQSxnQ0FDN0IsU0FBUyxPQUFPLE1BQU07QUFDcEIsb0NBQUUsZ0JBQWdCO0FBQ2xCLHdDQUFNLGdCQUFnQixpQkFBaUIsR0FBRyxNQUFNLEVBQUUsRUFBRTtBQUFBLGdDQUN0RDtBQUFBLGdDQUVBLHVEQUFDLFdBQVEsTUFBTSxJQUFJLFFBQVEsRUFBRSxVQUFVO0FBQUE7QUFBQSw0QkFDekM7QUFBQSw0QkFDQTtBQUFBLDhCQUFDO0FBQUE7QUFBQSxnQ0FDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLDRDQUE0QyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsZ0NBQ3pJLE9BQU07QUFBQSxnQ0FDTixTQUFTLENBQUMsTUFBTTtBQUNkLG9DQUFFLGdCQUFnQjtBQUNsQixzREFBb0IsRUFBRSxFQUFFO0FBQ3hCLHNEQUFvQixFQUFFLEtBQUs7QUFBQSxnQ0FDN0I7QUFBQSxnQ0FFQSx1REFBQyxZQUFTLE1BQU0sSUFBSTtBQUFBO0FBQUEsNEJBQ3RCO0FBQUEsNEJBQ0E7QUFBQSw4QkFBQztBQUFBO0FBQUEsZ0NBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLGdDQUN6SSxPQUFNO0FBQUEsZ0NBQ04sU0FBUyxDQUFDLE1BQU07QUFDZCxvQ0FBRSxnQkFBZ0I7QUFDbEIsd0NBQU0sY0FBYyxFQUFFLEVBQTBCO0FBQUEsZ0NBQ2xEO0FBQUEsZ0NBRUEsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLDRCQUN0QjtBQUFBLDRCQUVBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFVBQVUsWUFBWSxTQUFTLGNBQWMsR0FDekQ7QUFBQTtBQUFBLGdDQUFDO0FBQUE7QUFBQSxrQ0FDQyxXQUFVO0FBQUEsa0NBQ1YsT0FBTztBQUFBLG9DQUNMLFlBQVksNEJBQTRCLEVBQUUsS0FBSyw0QkFBNEI7QUFBQSxvQ0FDM0UsUUFBUTtBQUFBLG9DQUNSLE9BQU8sNEJBQTRCLEVBQUUsS0FBSyxZQUFZO0FBQUEsb0NBQ3RELFFBQVE7QUFBQSxvQ0FDUixTQUFTO0FBQUEsb0NBQ1QsU0FBUztBQUFBLG9DQUNULFlBQVk7QUFBQSxvQ0FDWixjQUFjO0FBQUEsa0NBQ2hCO0FBQUEsa0NBQ0EsT0FBTTtBQUFBLGtDQUNOLFNBQVMsQ0FBQyxNQUFNO0FBQ2Qsc0NBQUUsZ0JBQWdCO0FBQ2xCLCtEQUEyQiw0QkFBNEIsRUFBRSxLQUFLLE9BQU8sRUFBRSxFQUFFO0FBQUEsa0NBQzNFO0FBQUEsa0NBRUEsdURBQUMsb0JBQWlCLE1BQU0sSUFBSTtBQUFBO0FBQUEsOEJBQzlCO0FBQUEsOEJBQ0MsbUJBQW1CLEVBQUUsRUFBRTtBQUFBLCtCQUMxQjtBQUFBLDRCQUNBO0FBQUEsOEJBQUM7QUFBQTtBQUFBLGdDQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sV0FBVyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsZ0NBQ3hHLE9BQU07QUFBQSxnQ0FDTixTQUFTLE9BQU8sTUFBTTtBQUNwQixvQ0FBRSxnQkFBZ0I7QUFDbEIsd0NBQU0sb0JBQW9CLEdBQUcsTUFBTSxFQUFFLEVBQUU7QUFBQSxnQ0FDekM7QUFBQSxnQ0FFQSx1REFBQyxhQUFVLE1BQU0sSUFBSTtBQUFBO0FBQUEsNEJBQ3ZCO0FBQUEsNkJBQ0Y7QUFBQTtBQUFBO0FBQUEsc0JBcExLLEVBQUU7QUFBQSxvQkFxTFQ7QUFBQSxrQkFFSixDQUFDO0FBQUE7QUFBQSxjQUNIO0FBQUEsaUJBbFZNLE9BQU8sRUFvVmpCO0FBQUEsVUFFSixDQUFDO0FBQUEsVUFJQSxxQkFDQztBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsT0FBTztBQUFBLGdCQUNMLFFBQVE7QUFBQSxnQkFDUixTQUFTO0FBQUEsZ0JBQ1QsY0FBYztBQUFBLGdCQUNkLFFBQVEsbUJBQW1CLFFBQVEsR0FBRyxXQUFXLEtBQUssdUJBQXVCO0FBQUEsZ0JBQzdFLFlBQVksbUJBQW1CLFFBQVEsR0FBRyxXQUFXLEtBQUssNkJBQTZCO0FBQUEsZ0JBQ3ZGLE9BQU8sbUJBQW1CLFFBQVEsR0FBRyxXQUFXLEtBQUsscURBQXFEO0FBQUEsZ0JBQzFHLFVBQVU7QUFBQSxnQkFDVixRQUFRO0FBQUEsZ0JBQ1IsWUFBWTtBQUFBLGdCQUNaLFNBQVM7QUFBQSxnQkFDVCxZQUFZO0FBQUEsZ0JBQ1osZ0JBQWdCO0FBQUEsZ0JBQ2hCLEtBQUs7QUFBQSxjQUNQO0FBQUEsY0FDQSxZQUFZLENBQUMsTUFBTTtBQUNqQixrQkFBRSxlQUFlO0FBQ2pCLGtCQUFFLGdCQUFnQjtBQUNsQixvQkFBSSxtQkFBbUIsUUFBUSxHQUFHLFdBQVcsR0FBSSxtQkFBa0IsUUFBUSxHQUFHLFdBQVcsRUFBRTtBQUFBLGNBQzdGO0FBQUEsY0FDQSxhQUFhLE1BQU07QUFDakIsb0JBQUksbUJBQW1CLFFBQVEsR0FBRyxXQUFXLEdBQUksbUJBQWtCLElBQUk7QUFBQSxjQUN6RTtBQUFBLGNBQ0EsUUFBUSxPQUFPLE1BQU07QUFDbkIsa0JBQUUsZUFBZTtBQUNqQixrQkFBRSxnQkFBZ0I7QUFDbEIsa0NBQWtCLElBQUk7QUFDdEIsc0JBQU0sTUFBTSxFQUFFLGFBQWEsUUFBUSxZQUFZLEtBQUs7QUFDcEQscUNBQXFCLElBQUk7QUFDekIsb0JBQUksSUFBSyxPQUFNLGdCQUFnQixZQUFZLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxjQUMvRDtBQUFBLGNBRUE7QUFBQSw2REFBQyxlQUFZLE1BQU0sSUFBSTtBQUFBLGdCQUN2Qiw2Q0FBQyxVQUFNLDZCQUFtQixRQUFRLEdBQUcsV0FBVyxLQUFLLHFEQUFhLG1GQUFpQjtBQUFBO0FBQUE7QUFBQSxVQUNyRjtBQUFBLFVBR0QscUJBQXFCLElBQUksQ0FBQyxNQUFNO0FBQy9CLGtCQUFNLFdBQVcsb0JBQW9CLEVBQUU7QUFDdkMsa0JBQU0sVUFBVSxtQkFBbUIsRUFBRSxTQUFTO0FBRTlDLG1CQUNFO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBRUMsV0FBVyxxQkFBcUIsRUFBRTtBQUFBLGdCQUNsQyxPQUFPO0FBQUEsa0JBQ0wsU0FBUztBQUFBLGtCQUNULFlBQVk7QUFBQSxrQkFDWixnQkFBZ0I7QUFBQSxrQkFDaEIsUUFBUTtBQUFBLGtCQUNSLFNBQVM7QUFBQSxrQkFDVCxjQUFjO0FBQUEsa0JBQ2QsUUFBUTtBQUFBLGtCQUNSLFlBQVk7QUFBQSxrQkFDWixrQkFBa0I7QUFBQSxrQkFDbEIsWUFBWSxXQUFXLGtFQUFrRTtBQUFBLGtCQUN6RixPQUFPLFdBQVcscURBQXFEO0FBQUEsa0JBQ3ZFLFVBQVU7QUFBQSxrQkFDVixZQUFZLFdBQVcsTUFBTTtBQUFBLGtCQUM3QixTQUFTLHNCQUFzQixFQUFFLEtBQUssT0FBTztBQUFBLGtCQUM3QyxRQUFRLHNCQUFzQixFQUFFLEtBQUssdUJBQXVCO0FBQUEsa0JBQzVELFlBQVk7QUFBQSxnQkFDZDtBQUFBLGdCQUNBLFNBQVMsTUFBTSxrQkFBa0IsRUFBRSxFQUFFO0FBQUEsZ0JBQ3JDLGVBQWUsQ0FBQyxNQUFNO0FBQ3BCLG9CQUFFLGdCQUFnQjtBQUNsQixzQ0FBb0IsRUFBRSxFQUFFO0FBQ3hCLHNDQUFvQixFQUFFLEtBQUs7QUFBQSxnQkFDN0I7QUFBQSxnQkFDQSxjQUFjLENBQUMsTUFBTTtBQUNuQix3QkFBTSxNQUFNLEVBQUUsY0FBYyxjQUFjLFdBQVc7QUFDckQsd0JBQU0sS0FBSyxFQUFFLGNBQWMsY0FBYyxZQUFZO0FBQ3JELHNCQUFJLElBQUssS0FBSSxNQUFNLFVBQVU7QUFDN0Isc0JBQUksR0FBSSxJQUFHLE1BQU0sVUFBVTtBQUFBLGdCQUM3QjtBQUFBLGdCQUNBLGNBQWMsQ0FBQyxNQUFNO0FBQ25CLHdCQUFNLE1BQU0sRUFBRSxjQUFjLGNBQWMsV0FBVztBQUNyRCx3QkFBTSxLQUFLLEVBQUUsY0FBYyxjQUFjLFlBQVk7QUFDckQsc0JBQUksSUFBSyxLQUFJLE1BQU0sVUFBVTtBQUM3QixzQkFBSSxHQUFJLElBQUcsTUFBTSxVQUFVO0FBQUEsZ0JBQzdCO0FBQUEsZ0JBQ0EsYUFBYSxDQUFDLE1BQU07QUFDbEIsb0JBQUUsZ0JBQWdCO0FBQ2xCLG9CQUFFLGFBQWEsZ0JBQWdCO0FBQy9CLG9CQUFFLGFBQWEsUUFBUSxjQUFjLEVBQUUsRUFBRTtBQUN6Qyx1Q0FBcUIsRUFBRSxFQUFFO0FBQUEsZ0JBQzNCO0FBQUEsZ0JBQ0EsV0FBVyxNQUFNO0FBQ2YsdUNBQXFCLElBQUk7QUFDekIsb0NBQWtCLElBQUk7QUFBQSxnQkFDeEI7QUFBQSxnQkFFQTtBQUFBLGdFQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEdBQUcsZUFBZSxxQkFBcUIsRUFBRSxLQUFLLFNBQVMsT0FBTyxHQUMvSTtBQUFBLHNCQUFFLFVBQ0QsNkNBQUMsY0FBVyxNQUFNLElBQUksSUFDcEIsRUFBRSxxQkFDSiw2Q0FBQyxjQUFXLElBQ1YsRUFBRSxZQUNKLDZDQUFDLGdCQUFhLE1BQU0sSUFBSSxJQUN0QixFQUFFLFdBQ0osNkNBQUMsV0FBUSxNQUFNLElBQUksUUFBUSxNQUFNLE9BQU8sRUFBRSxPQUFPLFdBQVcsWUFBWSxFQUFFLEdBQUcsSUFFN0UsNkNBQUMsWUFBUyxNQUFNLElBQUksT0FBTyxFQUFFLFlBQVksR0FBRyxTQUFTLElBQUksR0FBRztBQUFBLG9CQUc3RCxxQkFBcUIsRUFBRSxLQUN0QjtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxXQUFTO0FBQUEsd0JBQ1QsT0FBTztBQUFBLDBCQUNMLEdBQUc7QUFBQSwwQkFDSCxVQUFVO0FBQUEsMEJBQ1YsTUFBTTtBQUFBLDBCQUNOLFFBQVE7QUFBQSwwQkFDUixVQUFVO0FBQUEsMEJBQ1YsYUFBYTtBQUFBLDBCQUNiLGVBQWU7QUFBQSx3QkFDakI7QUFBQSx3QkFDQSxPQUFPO0FBQUEsd0JBQ1AsVUFBVSxDQUFDLE1BQU0sb0JBQW9CLEVBQUUsT0FBTyxLQUFLO0FBQUEsd0JBQ25ELFFBQVEsTUFBTSx3QkFBd0IsRUFBRSxFQUFFO0FBQUEsd0JBQzFDLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLDhCQUFJLEVBQUUsUUFBUSxRQUFTLHlCQUF3QixFQUFFLEVBQUU7QUFDbkQsOEJBQUksRUFBRSxRQUFRLFNBQVUscUJBQW9CLElBQUk7QUFBQSx3QkFDbEQ7QUFBQSx3QkFDQSxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQjtBQUFBO0FBQUEsb0JBQ3BDLElBRUE7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTztBQUFBLDBCQUNMLFVBQVU7QUFBQSwwQkFDVixjQUFjO0FBQUEsMEJBQ2QsWUFBWTtBQUFBLDBCQUNaLFlBQVk7QUFBQSwwQkFDWixrQkFBa0I7QUFBQSx3QkFDcEI7QUFBQSx3QkFDQSxPQUFPLEVBQUU7QUFBQSx3QkFFUixZQUFFO0FBQUE7QUFBQSxvQkFDTDtBQUFBLHFCQUVKO0FBQUEsa0JBRUMscUJBQXFCLEVBQUUsTUFDdEI7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsV0FBVTtBQUFBLHNCQUNWLE9BQU87QUFBQSx3QkFDTCxVQUFVO0FBQUEsd0JBQ1YsT0FBTyxFQUFFLFVBQVUsWUFBWSxFQUFFLFlBQVksWUFBWTtBQUFBLHdCQUN6RCxZQUFZLEVBQUUsWUFBWSxNQUFNO0FBQUEsd0JBQ2hDLFlBQVk7QUFBQSxzQkFDZDtBQUFBLHNCQUVDLFlBQUUsVUFBVSx1QkFBUSxFQUFFLFlBQVksdUJBQVE7QUFBQTtBQUFBLGtCQUM3QztBQUFBLGtCQUlGLDhDQUFDLFNBQUksV0FBVSxZQUFXLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTSxHQUNuRjtBQUFBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sRUFBRSxXQUFXLFlBQVksNENBQTRDLFFBQVEsV0FBVyxTQUFTLE1BQU07QUFBQSx3QkFDbEssT0FBTyxFQUFFLFdBQVcsNkJBQVM7QUFBQSx3QkFDN0IsU0FBUyxPQUFPLE1BQU07QUFDcEIsNEJBQUUsZ0JBQWdCO0FBQ2xCLGdDQUFNLGdCQUFnQixpQkFBaUIsR0FBRyxNQUFNLEVBQUUsRUFBRTtBQUFBLHdCQUN0RDtBQUFBLHdCQUVBLHVEQUFDLFdBQVEsTUFBTSxJQUFJLFFBQVEsRUFBRSxVQUFVO0FBQUE7QUFBQSxvQkFDekM7QUFBQSxvQkFDQTtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLDRDQUE0QyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsd0JBQ3pJLE9BQU07QUFBQSx3QkFDTixTQUFTLENBQUMsTUFBTTtBQUNkLDRCQUFFLGdCQUFnQjtBQUNsQiw4Q0FBb0IsRUFBRSxFQUFFO0FBQ3hCLDhDQUFvQixFQUFFLEtBQUs7QUFBQSx3QkFDN0I7QUFBQSx3QkFFQSx1REFBQyxZQUFTLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQ3RCO0FBQUEsb0JBQ0E7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLHdCQUN6SSxPQUFNO0FBQUEsd0JBQ04sU0FBUyxDQUFDLE1BQU07QUFDZCw0QkFBRSxnQkFBZ0I7QUFDbEIsZ0NBQU0sY0FBYyxFQUFFLEVBQTBCO0FBQUEsd0JBQ2xEO0FBQUEsd0JBRUEsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLG9CQUN0QjtBQUFBLG9CQUVBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFVBQVUsWUFBWSxTQUFTLGNBQWMsR0FDekQ7QUFBQTtBQUFBLHdCQUFDO0FBQUE7QUFBQSwwQkFDQyxXQUFVO0FBQUEsMEJBQ1YsT0FBTztBQUFBLDRCQUNMLFlBQVksNEJBQTRCLEVBQUUsS0FBSyw0QkFBNEI7QUFBQSw0QkFDM0UsUUFBUTtBQUFBLDRCQUNSLE9BQU8sNEJBQTRCLEVBQUUsS0FBSyxZQUFZO0FBQUEsNEJBQ3RELFFBQVE7QUFBQSw0QkFDUixTQUFTO0FBQUEsNEJBQ1QsU0FBUztBQUFBLDRCQUNULFlBQVk7QUFBQSw0QkFDWixjQUFjO0FBQUEsMEJBQ2hCO0FBQUEsMEJBQ0EsT0FBTTtBQUFBLDBCQUNOLFNBQVMsQ0FBQyxNQUFNO0FBQ2QsOEJBQUUsZ0JBQWdCO0FBQ2xCLHVEQUEyQiw0QkFBNEIsRUFBRSxLQUFLLE9BQU8sRUFBRSxFQUFFO0FBQUEsMEJBQzNFO0FBQUEsMEJBRUEsdURBQUMsb0JBQWlCLE1BQU0sSUFBSTtBQUFBO0FBQUEsc0JBQzlCO0FBQUEsc0JBQ0MsbUJBQW1CLEVBQUUsRUFBRTtBQUFBLHVCQUMxQjtBQUFBLG9CQUNBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sV0FBVyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsd0JBQ3hHLE9BQU07QUFBQSx3QkFDTixTQUFTLE9BQU8sTUFBTTtBQUNwQiw0QkFBRSxnQkFBZ0I7QUFDbEIsZ0NBQU0sb0JBQW9CLEdBQUcsTUFBTSxFQUFFLEVBQUU7QUFBQSx3QkFDekM7QUFBQSx3QkFFQSx1REFBQyxhQUFVLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQ3ZCO0FBQUEscUJBQ0Y7QUFBQTtBQUFBO0FBQUEsY0FwTEssRUFBRTtBQUFBLFlBcUxUO0FBQUEsVUFFSixDQUFDO0FBQUEsVUFHQSxDQUFDLFdBQVcsaUJBQWlCLEtBQzVCO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxPQUFPO0FBQUEsZ0JBQ0wsU0FBUztBQUFBLGdCQUNULFVBQVU7QUFBQSxnQkFDVixPQUFPO0FBQUEsZ0JBQ1AsUUFBUTtBQUFBLGdCQUNSLGNBQWM7QUFBQSxjQUNoQjtBQUFBLGNBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sUUFBUTtBQUFBLGNBQ3BELGNBQWMsQ0FBQyxNQUFPLEVBQUUsY0FBYyxNQUFNLFFBQVE7QUFBQSxjQUNwRCxTQUFTLE1BQU0sc0JBQXNCLENBQUMsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsV0FBVyxHQUFHLEtBQUssRUFBRTtBQUFBLGNBQ3JGO0FBQUE7QUFBQSxnQkFDTztBQUFBLGdCQUFlO0FBQUE7QUFBQTtBQUFBLFVBQ3ZCO0FBQUEsV0FFSjtBQUFBLFdBbjBCTSxHQUFHLFdBcTBCYjtBQUFBLElBRUosQ0FBQyxHQUNIO0FBQUEsS0FDRjtBQUVKOzs7QURoOENPLElBQU0sT0FBTztBQUNiLElBQU0sU0FBUyxDQUFDLFNBQVMsWUFBWSxZQUFZO0FBRWpELFNBQVMsTUFBTSxLQUEwQjtBQUM5QyxNQUFJO0FBQ0Y7QUFBQyxJQUFDLElBQUksTUFBTSxPQUFlLHNCQUFzQixNQUFNO0FBQ3JELGFBQVEsSUFBSSxNQUFNO0FBQUEsUUFDaEI7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFVBQVU7QUFBQTtBQUFBLFVBQ1YsUUFBUSxPQUFPO0FBQUEsWUFDYixjQUFjLENBQUMsZ0JBQThCLElBQUksWUFBWSxlQUFlLFdBQVc7QUFBQSxZQUN2RixzQkFBc0IsT0FBTyxhQUEwQixRQUFnQixhQUFxQjtBQUMxRixrQkFBSTtBQUVGLHNCQUFNLFlBQVksTUFBTSxJQUFJLFlBQVksbUJBQW1CLFdBQVc7QUFDdEUsb0JBQUksV0FBVztBQUNiLHdCQUFNLGdCQUFnQixtQkFBbUIsUUFBUSxVQUFVLFNBQThCO0FBQ3pGLHNCQUFJLFVBQVUsT0FBTyxTQUFTO0FBQUEsZ0JBQ2hDO0FBQUEsY0FDRixTQUFTLEtBQUs7QUFDWix3QkFBUSxNQUFNLHFEQUFxRCxHQUFHO0FBQUEsY0FDeEU7QUFBQSxZQUNGO0FBQUEsWUFDQSxNQUFNLENBQUMsY0FBeUIsSUFBSSxVQUFVLE9BQU8sU0FBUztBQUFBLFlBQzlELGlCQUFpQixPQUFPLGFBQTBCLFVBQWtCO0FBQ2xFLG9CQUFNLElBQUksWUFBWSxTQUFTLGFBQWEsS0FBSztBQUFBLFlBQ25EO0FBQUEsWUFDQSxpQkFBaUIsT0FBTyxnQkFBNkI7QUFDbkQsb0JBQU0sSUFBSSxZQUFZLFNBQVMsV0FBVztBQUFBLFlBQzVDO0FBQUEsWUFDQSxpQkFBaUIsQ0FBQyxVQUE0QixJQUFJLFlBQVksU0FBUyxLQUFLO0FBQUEsWUFDNUUsZUFBZSxPQUFPLFdBQXNCLFVBQWtCO0FBQzVELG9CQUFNLFVBQVUsSUFBSSxVQUFVLFVBQVUsU0FBUyxHQUFHO0FBQ3BELGtCQUFJLFNBQVM7QUFDWCxzQkFBTSxRQUFRLE9BQU8sS0FBSztBQUFBLGNBQzVCO0FBQUEsWUFDRjtBQUFBLFlBQ0EsZ0JBQWdCLE9BQU8sY0FBeUI7QUFDOUMsb0JBQU0sSUFBSSxZQUFZLGlCQUFpQixTQUFTO0FBQUEsWUFDbEQ7QUFBQSxZQUNBLGFBQWEsQ0FBQyxjQUF5QjtBQUNyQyxrQkFBSSxVQUFVLE9BQU8sRUFBRSxXQUFXLGVBQWUsS0FBSyxDQUFDLEVBQ3BELEtBQUssQ0FBQyxZQUFZO0FBQUUsb0JBQUksVUFBVSxPQUFPLE9BQU87QUFBQSxjQUFFLENBQUMsRUFDbkQsTUFBTSxNQUFNO0FBQUEsY0FBQyxDQUFDO0FBQUEsWUFDbkI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxTQUFTLEtBQUs7QUFDWixZQUFRLE1BQU0sK0NBQStDLEdBQUc7QUFBQSxFQUNsRTtBQUNGOyIsCiAgIm5hbWVzIjogWyJuYW1lIiwgImltcG9ydF9qc3hfcnVudGltZSIsICJpbXBvcnRfanN4X3J1bnRpbWUiXQp9Cg==

return module.exports;
} });
