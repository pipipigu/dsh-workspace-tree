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
  const [isAddingWorkspace, setIsAddingWorkspace] = (0, import_react.useState)(false);
  const [newWorkspacePath, setNewWorkspacePath] = (0, import_react.useState)("");
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
  const handleOpenAddWorkspace = async () => {
    try {
      if (props.pickDirectory) {
        const picked = await props.pickDirectory();
        if (picked) {
          const res = await props.createWorkspace?.({ path: picked });
          if (res) {
            const wsId = res.workspaceId || res.id;
            if (wsId) {
              setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, wsId]));
              props.startSession?.(wsId);
            }
            globalTreeStore.loadWorkspace(picked);
            return;
          }
        }
      }
    } catch {
    }
    setIsAddingWorkspace(true);
    setShowSearch(false);
  };
  const handleConfirmAddWorkspace = async () => {
    const p = newWorkspacePath.trim();
    if (!p) {
      setIsAddingWorkspace(false);
      return;
    }
    try {
      const res = await props.createWorkspace?.({ path: p });
      if (res) {
        const wsId = res.workspaceId || res.id;
        if (wsId) {
          setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, wsId]));
          props.startSession?.(wsId);
        }
        globalTreeStore.loadWorkspace(p);
      }
    } catch (err) {
      console.error("[dsh-workspace-tree] Create workspace failed:", err);
    } finally {
      setIsAddingWorkspace(false);
      setNewWorkspacePath("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", userSelect: "none", fontFamily: "inherit" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 6px", color: "var(--dsw-alias-label-primary, #f8fafc)", fontSize: "13px", fontWeight: 600 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5DE5\u4F5C\u533A" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            style: {
              background: isAddingWorkspace ? "rgba(96, 165, 250, 0.2)" : "transparent",
              border: "none",
              color: isAddingWorkspace ? "#60a5fa" : "var(--dsw-alias-label-tertiary, #94a3b8)",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center"
            },
            title: "\u6DFB\u52A0/\u65B0\u5EFA\u5DE5\u4F5C\u533A",
            onClick: handleOpenAddWorkspace,
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, { size: 14 })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
              setIsAddingWorkspace(false);
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SearchIcon, { size: 14 })
          }
        )
      ] })
    ] }),
    isAddingWorkspace && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: "2px 10px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        placeholder: "\u8F93\u5165\u9879\u76EE\u76EE\u5F55\u8DEF\u5F84 (\u5982 /home/user/project)...",
        value: newWorkspacePath,
        onChange: (e) => setNewWorkspacePath(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") handleConfirmAddWorkspace();
          if (e.key === "Escape") {
            setIsAddingWorkspace(false);
            setNewWorkspacePath("");
          }
        },
        onBlur: () => {
          if (!newWorkspacePath.trim()) setIsAddingWorkspace(false);
          else handleConfirmAddWorkspace();
        }
      }
    ) }),
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
            pickDirectory: () => ctx.workspaces?.pickDirectory?.(),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC9pbmRleC50c3giLCAic3JjL2NsaWVudC9FbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXIudHN4IiwgInNyYy9jbGllbnQvYXBpLnRzIiwgInNyYy9jbGllbnQvdHJlZS1zdG9yZS50cyIsICJzcmMvY2xpZW50L3RpbWUudHMiLCAic3JjL2NsaWVudC9jb21wb25lbnRzL0ljb25zLnRzeCIsICJzcmMvY2xpZW50L2NvbXBvbmVudHMvU3RhdGVJbmRpY2F0b3IudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIGRzaC13b3Jrc3BhY2UtdHJlZSBicm93c2VyIGNsaWVudCBlbnRyeS5cbiAqXG4gKiBEaXJlY3QgdGFrZW92ZXIgb2YgYHNpZGViYXIud29ya3NwYWNlc2Agd2l0aCBwcmlvcml0eTogLTEwLlxuICogSW5qZWN0cyB2aXJ0dWFsIGZvbGRlcnMsIGRyYWcgJiBkcm9wIGdyb3VwaW5nLCBhbmQgbmVzdGVkIHN1YnByb2plY3RzIGRpcmVjdGx5XG4gKiBpbnNpZGUgdGhlIG5hdGl2ZSB3b3Jrc3BhY2UgbGlzdCByb3dzLCB3aXRoIHplcm8gRE9NIHBvbGx1dGlvbi5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQsIFNlc3Npb25JZCwgV29ya3NwYWNlSWQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCdcbmltcG9ydCB7IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlciB9IGZyb20gJy4vRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLnRzeCdcbmltcG9ydCB7IGdsb2JhbFRyZWVTdG9yZSB9IGZyb20gJy4vdHJlZS1zdG9yZS50cydcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAnQGRzaC1leHRlcm5hbC9kc2gtd29ya3NwYWNlLXRyZWUvY2xpZW50J1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnd29ya3NwYWNlcyddXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICA7KGN0eC5zbG90cy5pbmplY3QgYXMgYW55KSgnc2lkZWJhci53b3Jrc3BhY2VzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIChjdHguc2xvdHMucmVnaXN0ZXIgYXMgYW55KShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzaWRlYmFyLndvcmtzcGFjZXMnLFxuICAgICAgICAgIHByaW9yaXR5OiAtMTAsIC8vIGludGVudGlvbmFsIHNoYWRvdyBvdmVyIHN0b2NrIHdvcmtzcGFjZSBicm93c2VyIChsb3dlc3QgcmVuZGVycylcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBzdGFydFNlc3Npb246ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiBjdHgud29ya3NwYWNlcz8uc3RhcnRTZXNzaW9uPy4od29ya3NwYWNlSWQpLFxuICAgICAgICAgICAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI6IGFzeW5jICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5jb25uZWN0V29ya3NwYWNlPy4od29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmFkZFNlc3Npb25Ub0ZvbGRlcih3c1BhdGgsIGZvbGRlcklkLCBzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBzdGFydFNlc3Npb25JbkZvbGRlciBmYWlsZWQ6JywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpLFxuICAgICAgICAgICAgcmVuYW1lV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5yZW5hbWU/Lih3b3Jrc3BhY2VJZCwgdGl0bGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5kZWxldGU/Lih3b3Jrc3BhY2VJZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVXb3Jrc3BhY2U6IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gY3R4LndvcmtzcGFjZXM/LmNyZWF0ZT8uKGlucHV0KSxcbiAgICAgICAgICAgIHBpY2tEaXJlY3Rvcnk6ICgpID0+IGN0eC53b3Jrc3BhY2VzPy5waWNrRGlyZWN0b3J5Py4oKSxcbiAgICAgICAgICAgIHJlbmFtZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gY3R4LnNlc3Npb25zPy5iaW5kaW5nPy4oc2Vzc2lvbklkKT8uc2Vzc2lvblxuICAgICAgICAgICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlc3Npb24ucmVuYW1lKHRpdGxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJjaGl2ZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCBjdHgud29ya3NwYWNlcz8uYXJjaGl2ZVNlc3Npb24/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ya1Nlc3Npb246IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/LmZvcms/Lih7IHNlc3Npb25JZCwgaW5jcmVhc2VUaXRsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChjaGlsZElkKSA9PiB7IGN0eC5zZXNzaW9ucz8ub3Blbj8uKGNoaWxkSWQpIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLFxuICAgICAgKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIFNsb3QgaW5qZWN0aW9uIGZhaWxlZDonLCBlcnIpXG4gIH1cbn1cbiIsICJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCB1c2VTeW5jRXh0ZXJuYWxTdG9yZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uSWQsIFdvcmtzcGFjZUlkLCBXb3Jrc3BhY2VWaWV3IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnXG5pbXBvcnQgeyBnbG9iYWxUcmVlU3RvcmUgfSBmcm9tICcuL3RyZWUtc3RvcmUudHMnXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFN1YnByb2plY3RJbmZvIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJ1xuaW1wb3J0IHsgZm9ybWF0UmVsYXRpdmVUaW1lIH0gZnJvbSAnLi90aW1lLnRzJ1xuaW1wb3J0IHtcbiAgQWRkRm9sZGVySWNvbixcbiAgQ2hhdEljb24sXG4gIENoZXZyb25SaWdodEljb24sXG4gIEVkaXRJY29uLFxuICBFbGxpcHNpc0ljb24sXG4gIEZvbGRlckljb24sXG4gIEZvcmtJY29uLFxuICBNb3ZlT3V0SWNvbixcbiAgTW92ZVRvRm9sZGVySWNvbixcbiAgUGluSWNvbixcbiAgUGx1c0ljb24sXG4gIFNlYXJjaEljb24sXG4gIFRyYXNoSWNvbixcbn0gZnJvbSAnLi9jb21wb25lbnRzL0ljb25zLnRzeCdcbmltcG9ydCB7IENvbXBsZXRlZERvdCwgUGVuZGluZ0RvdCwgUnVubmluZ0RvdCB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0ZUluZGljYXRvci50c3gnXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyUHJvcHMge1xuICB1c2VXb3Jrc3BhY2VzPzogKHNlbGVjdG9yOiAoczogYW55KSA9PiBhbnkpID0+IGFueVxuICB1c2VTZXNzaW9ucz86IChzZWxlY3RvcjogKHM6IGFueSkgPT4gYW55KSA9PiBhbnlcbiAgc3RhcnRTZXNzaW9uPzogKHdvcmtzcGFjZUlkPzogV29ya3NwYWNlSWQpID0+IHZvaWRcbiAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI/OiAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB3c1BhdGg6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxuICBvcGVuPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG4gIHJlbmFtZVdvcmtzcGFjZT86ICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHRpdGxlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD5cbiAgZGVsZXRlV29ya3NwYWNlPzogKHdvcmtzcGFjZUlkOiBXb3Jrc3BhY2VJZCkgPT4gUHJvbWlzZTx2b2lkPlxuICBjcmVhdGVXb3Jrc3BhY2U/OiAoaW5wdXQ6IHsgcGF0aDogc3RyaW5nIH0pID0+IFByb21pc2U8V29ya3NwYWNlVmlldz5cbiAgcGlja0RpcmVjdG9yeT86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD5cbiAgcmVuYW1lU2Vzc2lvbj86IChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxuICBhcmNoaXZlU2Vzc2lvbj86IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4gUHJvbWlzZTx2b2lkPlxuICBmb3JrU2Vzc2lvbj86IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4gdm9pZFxufVxuXG5jb25zdCBERUZBVUxUX1ZJU0lCTEVfTElNSVQgPSAxMFxuY29uc3QgUFJFU0VUX0NPTE9SUyA9IFsnIzYwYTVmYScsICcjNGFkZTgwJywgJyNmYmJmMjQnLCAnI2Y4NzE3MScsICcjYzA4NGZjJywgJyMzOGJkZjgnXVxuXG4vKiogQ2hlY2sgaWYgYSBzZXNzaW9uIGlzIGp1c3QgYW4gZW1wdHkgcGxhY2Vob2xkZXIgbGlrZSBcInNlc3Npb24tY2Y2ZmUxNjhcIiAqL1xuZnVuY3Rpb24gaXNCbGFua1BsYWNlaG9sZGVyKGlkOiBzdHJpbmcsIHRpdGxlPzogc3RyaW5nLCBpc0JsYW5rID0gZmFsc2UsIGlzQWN0aXZlID0gZmFsc2UpOiBib29sZWFuIHtcbiAgaWYgKGlzQWN0aXZlKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzQmxhbmspIHJldHVybiB0cnVlXG4gIGlmICghdGl0bGUpIHJldHVybiB0cnVlXG4gIGlmICh0aXRsZSA9PT0gaWQpIHJldHVybiB0cnVlXG4gIGlmICgvXnNlc3Npb24tW2EtejAtOS1dKyQvaS50ZXN0KHRpdGxlKSkgcmV0dXJuIHRydWVcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmNvbnN0IERTSF9JTlBVVF9TVFlMRTogUmVhY3QuQ1NTUHJvcGVydGllcyA9IHtcbiAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gIHBhZGRpbmc6ICcxcHggNnB4JyxcbiAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSknLFxuICBiYWNrZ3JvdW5kOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScsXG4gIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgZm9udFNpemU6ICcxM3B4JyxcbiAgbGluZUhlaWdodDogJzIwcHgnLFxuICBvdXRsaW5lOiAnbm9uZScsXG4gIGZvbnRGYW1pbHk6ICdpbmhlcml0Jyxcbn1cblxuaW50ZXJmYWNlIEJhbm5lclRhc2sge1xuICBzZXNzaW9uSWQ6IHN0cmluZ1xuICB0aXRsZTogc3RyaW5nXG4gIHN0YXR1czogJ3J1bm5pbmcnIHwgJ3BlbmRpbmcnIHwgJ2NvbXBsZXRlZCdcbiAgd3M/OiBXb3Jrc3BhY2VWaWV3XG59XG5cbmNvbnN0IFRBU0tfU1RZTEVfQ09ORklHID0ge1xuICBydW5uaW5nOiB7XG4gICAgYmc6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4wOCknLFxuICAgIGJvcmRlcjogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjIyKScsXG4gICAgaG92ZXJCZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE2KScsXG4gICAgaG92ZXJCb3JkZXI6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC40NSknLFxuICAgIHRhZ1RleHQ6ICdcdThGREJcdTg4NENcdTRFMkQnLFxuICAgIHRhZ0NvbG9yOiAnIzYwYTVmYScsXG4gICAgdGFnQmc6ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4xNCknLFxuICAgIHRpdGxlUHJlZml4OiAnXHU2QjYzXHU1NzI4XHU4RkRCXHU4ODRDJyxcbiAgfSxcbiAgcGVuZGluZzoge1xuICAgIGJnOiAncmdiYSgyNTEsIDE5MSwgMzYsIDAuMDgpJyxcbiAgICBib3JkZXI6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4yNSknLFxuICAgIGhvdmVyQmc6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4xNiknLFxuICAgIGhvdmVyQm9yZGVyOiAncmdiYSgyNTEsIDE5MSwgMzYsIDAuNSknLFxuICAgIHRhZ1RleHQ6ICdcdTVGODVcdTc4NkVcdThCQTQnLFxuICAgIHRhZ0NvbG9yOiAnI2ZiYmYyNCcsXG4gICAgdGFnQmc6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4xNCknLFxuICAgIHRpdGxlUHJlZml4OiAnXHU3QjQ5XHU1Rjg1XHU3ODZFXHU4QkE0JyxcbiAgfSxcbiAgY29tcGxldGVkOiB7XG4gICAgYmc6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4wOCknLFxuICAgIGJvcmRlcjogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjI1KScsXG4gICAgaG92ZXJCZzogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjE2KScsXG4gICAgaG92ZXJCb3JkZXI6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC41KScsXG4gICAgdGFnVGV4dDogJ1x1NUY4NVx1OEJGQicsXG4gICAgdGFnQ29sb3I6ICcjNGFkZTgwJyxcbiAgICB0YWdCZzogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTVERjJcdTYyNjdcdTg4NENcdTVCOENcdTZCRDVcdTVGODVcdTk2MDVcdThCRkInLFxuICB9LFxufVxuXG5leHBvcnQgY29uc3QgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyOiBSZWFjdC5GQzxFbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXJQcm9wcz4gPSAocHJvcHMpID0+IHtcbiAgLy8gU3Vic2NyaWJlIHRvIFRyZWVTdG9yZSBjaGFuZ2VzIHdpdGggcmVhY3RpdmUgdmVyc2lvbiBjb3VudGVyIChndWFyYW50ZWVzIGluc3RhbnQgMG1zIHJlLXJlbmRlcnMpXG4gIHVzZVN5bmNFeHRlcm5hbFN0b3JlKFxuICAgIChjYikgPT4gZ2xvYmFsVHJlZVN0b3JlLnN1YnNjcmliZShjYiksXG4gICAgKCkgPT4gZ2xvYmFsVHJlZVN0b3JlLmdldFZlcnNpb24oKSxcbiAgKVxuXG4gIGxldCB3b3Jrc3BhY2VzU3RhdGU6IHtcbiAgICBpdGVtcz86IHJlYWRvbmx5IFdvcmtzcGFjZVZpZXdbXVxuICAgIGFyY2hpdmVkU2Vzc2lvbklkcz86IHJlYWRvbmx5IFNlc3Npb25JZFtdXG4gICAgcmVjZW50V29ya3NwYWNlSWQ/OiBXb3Jrc3BhY2VJZFxuICB9ID0geyBpdGVtczogW10sIGFyY2hpdmVkU2Vzc2lvbklkczogW10gfVxuXG4gIHRyeSB7XG4gICAgaWYgKHByb3BzLnVzZVdvcmtzcGFjZXMpIHtcbiAgICAgIHdvcmtzcGFjZXNTdGF0ZSA9IHByb3BzLnVzZVdvcmtzcGFjZXMoKHM6IGFueSkgPT4gcykgfHwgeyBpdGVtczogW10sIGFyY2hpdmVkU2Vzc2lvbklkczogW10gfVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gaWdub3JlXG4gIH1cblxuICBjb25zdCBbZXhwYW5kZWRXb3Jrc3BhY2VzLCBzZXRFeHBhbmRlZFdvcmtzcGFjZXNdID0gdXNlU3RhdGU8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSlcbiAgY29uc3QgW3NlYXJjaFF1ZXJ5LCBzZXRTZWFyY2hRdWVyeV0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW3Nob3dTZWFyY2gsIHNldFNob3dTZWFyY2hdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtpc0FkZGluZ1dvcmtzcGFjZSwgc2V0SXNBZGRpbmdXb3Jrc3BhY2VdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtuZXdXb3Jrc3BhY2VQYXRoLCBzZXROZXdXb3Jrc3BhY2VQYXRoXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbYWN0aXZlTWVudVdzSWQsIHNldEFjdGl2ZU1lbnVXc0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0aW5nV3NJZCwgc2V0RWRpdGluZ1dzSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2VkaXRXc1RpdGxlLCBzZXRFZGl0V3NUaXRsZV0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2lzQ3JlYXRpbmdGb2xkZXJXc0lkLCBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbbmV3Rm9sZGVyTmFtZSwgc2V0TmV3Rm9sZGVyTmFtZV0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2VkaXRpbmdGb2xkZXJJZCwgc2V0RWRpdGluZ0ZvbGRlcklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0Rm9sZGVyTmFtZSwgc2V0RWRpdEZvbGRlck5hbWVdID0gdXNlU3RhdGUoJycpXG5cbiAgLy8gTG9jYWwgdW5yZWFkIGNvbXBsZXRpb24gdHJhY2tlciAocmVhY3RpdmUgdG8gcnVubmluZyB0cnVlLT5mYWxzZSBlZGdlIHdoZW4gbm90IGFjdGl2ZSlcbiAgY29uc3QgW2xvY2FsVW5yZWFkU2V0LCBzZXRMb2NhbFVucmVhZFNldF0gPSB1c2VTdGF0ZTxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKVxuICBjb25zdCBwcmV2UnVubmluZ01hcCA9IHVzZVJlZjxNYXA8c3RyaW5nLCBib29sZWFuPj4obmV3IE1hcCgpKVxuXG4gIC8vIFNlc3Npb24gcmVuYW1lIHN0YXRlXG4gIGNvbnN0IFtlZGl0aW5nU2Vzc2lvbklkLCBzZXRFZGl0aW5nU2Vzc2lvbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlZGl0U2Vzc2lvblRpdGxlLCBzZXRFZGl0U2Vzc2lvblRpdGxlXSA9IHVzZVN0YXRlKCcnKVxuICBcbiAgLy8gU2Vzc2lvbiBtb3ZlLXRvLWZvbGRlciBkcm9wZG93biBtZW51IHN0YXRlXG4gIGNvbnN0IFthY3RpdmVNb3ZlTWVudVNlc3Npb25JZCwgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgXG4gIGNvbnN0IFtzaG93QWxsU2Vzc2lvbnNNYXAsIHNldFNob3dBbGxTZXNzaW9uc01hcF0gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4oe30pXG5cbiAgY29uc3QgbWVudVJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGhhbmRsZUdsb2JhbENsaWNrID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmIChtZW51UmVmLmN1cnJlbnQgJiYgIW1lbnVSZWYuY3VycmVudC5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSkge1xuICAgICAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICAgICAgfVxuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnRcbiAgICAgIGlmICghdGFyZ2V0LmNsb3Nlc3QoJy5tb3ZlLW1lbnUtY29udGFpbmVyJykgJiYgIXRhcmdldC5jbG9zZXN0KCcubW92ZS1tZW51LWJ0bicpKSB7XG4gICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhbmRsZUtleURvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgICAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgICBzZXRFZGl0aW5nV3NJZChudWxsKVxuICAgICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgICAgICBzZXRFZGl0aW5nRm9sZGVySWQobnVsbClcbiAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICAgICAgfVxuICAgIH1cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVHbG9iYWxDbGljaylcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24pXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUdsb2JhbENsaWNrKVxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlEb3duKVxuICAgIH1cbiAgfSwgW10pXG5cbiAgbGV0IHNlc3Npb25zU3RhdGU6IHtcbiAgICBpZHM/OiBTZXNzaW9uSWRbXVxuICAgIGJ5SWQ/OiBSZWNvcmQ8c3RyaW5nLCB7IHNlc3Npb25JZDogU2Vzc2lvbklkOyB0aXRsZT86IHN0cmluZzsgdXBkYXRlZEF0PzogbnVtYmVyOyBydW5uaW5nPzogYm9vbGVhbjsgcGVuZGluZ0ludGVyYWN0aW9uPzogYW55OyBjb21wbGV0ZWQ/OiBib29sZWFuOyBibGFuaz86IGJvb2xlYW4gfT5cbiAgICBjdXJyZW50PzogU2Vzc2lvbklkXG4gIH0gPSB7IGlkczogW10sIGJ5SWQ6IHt9IH1cblxuICB0cnkge1xuICAgIGlmIChwcm9wcy51c2VTZXNzaW9ucykge1xuICAgICAgc2Vzc2lvbnNTdGF0ZSA9IHByb3BzLnVzZVNlc3Npb25zKChzOiBhbnkpID0+IHMpIHx8IHt9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmVcbiAgfVxuXG4gIGNvbnN0IGFjdGl2ZVNlc3Npb25JZCA9IHNlc3Npb25zU3RhdGUuY3VycmVudCBhcyB1bmtub3duIGFzIHN0cmluZyB8IHVuZGVmaW5lZFxuICBjb25zdCBpdGVtczogcmVhZG9ubHkgV29ya3NwYWNlVmlld1tdID0gd29ya3NwYWNlc1N0YXRlLml0ZW1zIHx8IFtdXG4gIGNvbnN0IGFyY2hpdmVkU2Vzc2lvbklkczogcmVhZG9ubHkgU2Vzc2lvbklkW10gPSB3b3Jrc3BhY2VzU3RhdGUuYXJjaGl2ZWRTZXNzaW9uSWRzIHx8IFtdXG4gIGNvbnN0IGFyY2hpdmVkU2V0ID0gdXNlTWVtbygoKSA9PiBuZXcgU2V0KGFyY2hpdmVkU2Vzc2lvbklkcy5tYXAoU3RyaW5nKSksIFthcmNoaXZlZFNlc3Npb25JZHNdKVxuXG4gIC8vIFByZWxvYWQgYWxsIHdvcmtzcGFjZSBtZXRhZGF0YSBvbmNlIGl0ZW1zIGFycml2ZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZvciAoY29uc3Qgd3Mgb2YgaXRlbXMpIHtcbiAgICAgIGlmICh3cy5wYXRoKSB7XG4gICAgICAgIGdsb2JhbFRyZWVTdG9yZS5nZXRNZXRhRm9yV29ya3NwYWNlKHdzLnBhdGgpXG4gICAgICB9XG4gICAgfVxuICB9LCBbaXRlbXNdKVxuXG4gIC8vIFdhdGNoIHJ1bm5pbmcgLT4gY29tcGxldGVkIHRyYW5zaXRpb25zIGZvciBiYWNrZ3JvdW5kIHVucmVhZCByZW1pbmRlcnNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBieUlkID0gc2Vzc2lvbnNTdGF0ZS5ieUlkIHx8IHt9XG4gICAgY29uc3QgbmV3VW5yZWFkID0gbmV3IFNldChsb2NhbFVucmVhZFNldClcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlXG5cbiAgICBmb3IgKGNvbnN0IFtpZCwgc2Vzc2lvbl0gb2YgT2JqZWN0LmVudHJpZXMoYnlJZCkpIHtcbiAgICAgIGlmIChhcmNoaXZlZFNldC5oYXMoaWQpKSB7XG4gICAgICAgIGlmIChuZXdVbnJlYWQuaGFzKGlkKSkge1xuICAgICAgICAgIG5ld1VucmVhZC5kZWxldGUoaWQpXG4gICAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgY29uc3Qgd2FzUnVubmluZyA9IHByZXZSdW5uaW5nTWFwLmN1cnJlbnQuZ2V0KGlkKSB8fCBmYWxzZVxuICAgICAgY29uc3QgaXNOb3dSdW5uaW5nID0gQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKVxuXG4gICAgICAvLyBUcmFuc2l0aW9uOiBydW5uaW5nIHRydWUgLT4gZmFsc2Ugd2hpbGUgTk9UIGFjdGl2ZSBzZXNzaW9uID0+IE1hcmsgYXMgVW5yZWFkXG4gICAgICBpZiAod2FzUnVubmluZyAmJiAhaXNOb3dSdW5uaW5nICYmIGlkICE9PSBhY3RpdmVTZXNzaW9uSWQpIHtcbiAgICAgICAgbmV3VW5yZWFkLmFkZChpZClcbiAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgIH1cblxuICAgICAgLy8gSWYgYWN0aXZlIHNlc3Npb24sIGNsZWFyIHVucmVhZFxuICAgICAgaWYgKGlkID09PSBhY3RpdmVTZXNzaW9uSWQgJiYgbmV3VW5yZWFkLmhhcyhpZCkpIHtcbiAgICAgICAgbmV3VW5yZWFkLmRlbGV0ZShpZClcbiAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgIH1cblxuICAgICAgcHJldlJ1bm5pbmdNYXAuY3VycmVudC5zZXQoaWQsIGlzTm93UnVubmluZylcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgc2V0TG9jYWxVbnJlYWRTZXQobmV3VW5yZWFkKVxuICAgIH1cbiAgfSwgW3Nlc3Npb25zU3RhdGUuYnlJZCwgYWN0aXZlU2Vzc2lvbklkLCBhcmNoaXZlZFNldF0pXG5cbiAgLy8gQ2xlYXIgdW5yZWFkIG9uIHNlc3Npb24gb3BlblxuICBjb25zdCBoYW5kbGVPcGVuU2Vzc2lvbiA9IChzZXNzaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChsb2NhbFVucmVhZFNldC5oYXMoc2Vzc2lvbklkKSkge1xuICAgICAgY29uc3QgbmV4dCA9IG5ldyBTZXQobG9jYWxVbnJlYWRTZXQpXG4gICAgICBuZXh0LmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgICBzZXRMb2NhbFVucmVhZFNldChuZXh0KVxuICAgIH1cbiAgICBwcm9wcy5vcGVuPy4oc2Vzc2lvbklkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKVxuICB9XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBleHBhbmRlZFdvcmtzcGFjZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgY29uc3QgdGFyZ2V0SWQgPSB3b3Jrc3BhY2VzU3RhdGUucmVjZW50V29ya3NwYWNlSWQgfHwgaXRlbXNbMF0/LndvcmtzcGFjZUlkXG4gICAgICBpZiAodGFyZ2V0SWQpIHtcbiAgICAgICAgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzKG5ldyBTZXQoW3RhcmdldElkXSkpXG4gICAgICAgIGNvbnN0IGZpcnN0ID0gaXRlbXMuZmluZCgodykgPT4gdy53b3Jrc3BhY2VJZCA9PT0gdGFyZ2V0SWQpXG4gICAgICAgIGlmIChmaXJzdD8ucGF0aCkgZ2xvYmFsVHJlZVN0b3JlLmxvYWRXb3Jrc3BhY2UoZmlyc3QucGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtpdGVtcywgd29ya3NwYWNlc1N0YXRlLnJlY2VudFdvcmtzcGFjZUlkXSlcblxuICBjb25zdCB0b2dnbGVXb3Jrc3BhY2UgPSAod3NJZDogc3RyaW5nLCB3c1BhdGg6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KGV4cGFuZGVkV29ya3NwYWNlcylcbiAgICBpZiAobmV4dC5oYXMod3NJZCkpIHtcbiAgICAgIG5leHQuZGVsZXRlKHdzSWQpXG4gICAgICBzZXRTaG93QWxsU2Vzc2lvbnNNYXAoKHByZXYpID0+ICh7IC4uLnByZXYsIFt3c0lkXTogZmFsc2UgfSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuYWRkKHdzSWQpXG4gICAgICBnbG9iYWxUcmVlU3RvcmUubG9hZFdvcmtzcGFjZSh3c1BhdGgpXG4gICAgfVxuICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcyhuZXh0KVxuICB9XG5cbiAgY29uc3QgaGFuZGxlQ3JlYXRlRm9sZGVyID0gYXN5bmMgKHdzUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKG5ld0ZvbGRlck5hbWUudHJpbSgpKSB7XG4gICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUuY3JlYXRlRm9sZGVyKHdzUGF0aCwgbmV3Rm9sZGVyTmFtZS50cmltKCkpXG4gICAgICBzZXROZXdGb2xkZXJOYW1lKCcnKVxuICAgICAgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICB9XG4gIH1cblxuICBjb25zdCBoYW5kbGVTYXZlUmVuYW1lV3MgPSBhc3luYyAod3NJZDogV29ya3NwYWNlSWQpID0+IHtcbiAgICBpZiAoZWRpdFdzVGl0bGUudHJpbSgpICYmIHByb3BzLnJlbmFtZVdvcmtzcGFjZSkge1xuICAgICAgYXdhaXQgcHJvcHMucmVuYW1lV29ya3NwYWNlKHdzSWQsIGVkaXRXc1RpdGxlLnRyaW0oKSlcbiAgICB9XG4gICAgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICB9XG5cbiAgY29uc3QgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24gPSBhc3luYyAoc2Vzc2lvbklkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoZWRpdFNlc3Npb25UaXRsZS50cmltKCkgJiYgcHJvcHMucmVuYW1lU2Vzc2lvbikge1xuICAgICAgYXdhaXQgcHJvcHMucmVuYW1lU2Vzc2lvbihzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQsIGVkaXRTZXNzaW9uVGl0bGUudHJpbSgpKVxuICAgIH1cbiAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gIH1cblxuICAvLyBcdTUyMjBcdTk2NjRcdTRGMUFcdThCRERcdUZGMUFcdTRFQ0VcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdTU5MzlcdTZFMDVcdTk2NjQgKyBcdTRFQ0VcdTY3MkFcdThCRkJcdTZFMDVcdTk2NjQgKyBcdThDMDNcdTc1MjggRFNIIFx1NjgzOFx1NUZDM1x1NUY1Mlx1Njg2M1x1NTIyMFx1OTY2NFxuICBjb25zdCBoYW5kbGVEZWxldGVTZXNzaW9uID0gYXN5bmMgKHdzUGF0aDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAobG9jYWxVbnJlYWRTZXQuaGFzKHNlc3Npb25JZCkpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBTZXQobG9jYWxVbnJlYWRTZXQpXG4gICAgICAgIG5leHQuZGVsZXRlKHNlc3Npb25JZClcbiAgICAgICAgc2V0TG9jYWxVbnJlYWRTZXQobmV4dClcbiAgICAgIH1cbiAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5wdXJnZVNlc3Npb24od3NQYXRoLCBzZXNzaW9uSWQpXG4gICAgICBpZiAocHJvcHMuYXJjaGl2ZVNlc3Npb24pIHtcbiAgICAgICAgYXdhaXQgcHJvcHMuYXJjaGl2ZVNlc3Npb24oc2Vzc2lvbklkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRGVsZXRlIHNlc3Npb24gZmFpbGVkOicsIGVycilcbiAgICB9XG4gIH1cblxuICAvLyBcdUQ4M0NcdURGMUYgXHU1NzI4XHU2MzA3XHU1QjlBXHU2NTg3XHU0RUY2XHU1OTM5XHU1MTg1XHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREXHVGRjA4XHU3NkY0XHU4RkRFIGNvbm5lY3RXb3Jrc3BhY2UgXHU4M0I3XHU1M0Q2IFNlc3Npb25JZCBcdTVFNzZcdTVGNTJcdTUxNjVcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMENcdTk2RjZcdTY1RjZcdTVFOEZcdTdBREVcdTYwMDFcdUZGMDlcbiAgY29uc3QgaGFuZGxlQ3JlYXRlU2Vzc2lvbkluRm9sZGVyID0gYXN5bmMgKHdzSWQ6IFdvcmtzcGFjZUlkLCB3c1BhdGg6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChwcm9wcy5zdGFydFNlc3Npb25JbkZvbGRlcikge1xuICAgICAgYXdhaXQgcHJvcHMuc3RhcnRTZXNzaW9uSW5Gb2xkZXIod3NJZCwgd3NQYXRoLCBmb2xkZXJJZClcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHMuc3RhcnRTZXNzaW9uPy4od3NJZClcbiAgICB9XG4gIH1cblxuICAvLyBcdUQ4M0NcdURGMUYgXHU5ODc2XHU5MEU4XHU2RDNCXHU1MkE4XHU0RTBFXHU1Rjg1XHU4QkZCXHU0RUZCXHU1MkExXHU5NjFGXHU1MjE3XHVGRjA4XHU4RkRCXHU4ODRDXHU0RTJEIC8gXHU1Rjg1XHU0RUE0XHU0RTkyIC8gXHU1REYyXHU1QjhDXHU2MjEwXHU1Rjg1XHU4QkZCXHVGRjBDXHU3MEI5XHU1MUZCXHU5NjA1XHU4QkZCXHU1NDBFXHU4MUVBXHU1MkE4XHU2RDg4XHU5NjY0XHVGRjA5XG4gIGNvbnN0IGJhbm5lclRhc2tzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbGlzdDogQmFubmVyVGFza1tdID0gW11cbiAgICBjb25zdCBieUlkID0gc2Vzc2lvbnNTdGF0ZS5ieUlkIHx8IHt9XG5cbiAgICBmb3IgKGNvbnN0IFtzSWQsIHNlc3Npb25dIG9mIE9iamVjdC5lbnRyaWVzKGJ5SWQpKSB7XG4gICAgICBpZiAoYXJjaGl2ZWRTZXQuaGFzKHNJZCkpIGNvbnRpbnVlXG4gICAgICBjb25zdCBpc1J1bm5pbmcgPSBCb29sZWFuKHNlc3Npb24/LnJ1bm5pbmcpXG4gICAgICBjb25zdCBpc1BlbmRpbmcgPSBCb29sZWFuKHNlc3Npb24/LnBlbmRpbmdJbnRlcmFjdGlvbilcbiAgICAgIGNvbnN0IGlzVW5yZWFkQ29tcGxldGVkID0gKEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkKSB8fCBsb2NhbFVucmVhZFNldC5oYXMoc0lkKSkgJiYgc0lkICE9PSBhY3RpdmVTZXNzaW9uSWRcblxuICAgICAgY29uc3Qgb3duZXJXcyA9IGl0ZW1zLmZpbmQoKHcpID0+ICh3LnNlc3Npb25JZHMgfHwgW10pLmluY2x1ZGVzKHNJZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZCkpXG4gICAgICBjb25zdCB0aXRsZSA9IHNlc3Npb24/LnRpdGxlIHx8IHNJZC5zbGljZSgwLCAxNilcblxuICAgICAgaWYgKGlzUnVubmluZykge1xuICAgICAgICBsaXN0LnB1c2goeyBzZXNzaW9uSWQ6IHNJZCwgdGl0bGUsIHN0YXR1czogJ3J1bm5pbmcnLCB3czogb3duZXJXcyB9KVxuICAgICAgfSBlbHNlIGlmIChpc1BlbmRpbmcpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgc2Vzc2lvbklkOiBzSWQsIHRpdGxlLCBzdGF0dXM6ICdwZW5kaW5nJywgd3M6IG93bmVyV3MgfSlcbiAgICAgIH0gZWxzZSBpZiAoaXNVbnJlYWRDb21wbGV0ZWQpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgc2Vzc2lvbklkOiBzSWQsIHRpdGxlLCBzdGF0dXM6ICdjb21wbGV0ZWQnLCB3czogb3duZXJXcyB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG9yZGVyOiBSZWNvcmQ8J3J1bm5pbmcnIHwgJ3BlbmRpbmcnIHwgJ2NvbXBsZXRlZCcsIG51bWJlcj4gPSB7IHJ1bm5pbmc6IDAsIHBlbmRpbmc6IDEsIGNvbXBsZXRlZDogMiB9XG4gICAgcmV0dXJuIGxpc3Quc29ydCgoYSwgYikgPT4gKG9yZGVyW2Euc3RhdHVzXSA/PyAwKSAtIChvcmRlcltiLnN0YXR1c10gPz8gMCkpXG4gIH0sIFtzZXNzaW9uc1N0YXRlLmJ5SWQsIGl0ZW1zLCBsb2NhbFVucmVhZFNldCwgYWN0aXZlU2Vzc2lvbklkLCBhcmNoaXZlZFNldF0pXG5cbiAgLy8gXHU3MEI5XHU1MUZCXHU0RUZCXHU1MkExXHVGRjFBXHU0RTAwXHU5NTJFXHU1QzU1XHU1RjAwXHU1QkY5XHU1RTk0XHU1REU1XHU0RjVDXHU1MzNBXHUzMDAxXHU1QzU1XHU1RjAwXHU2NTg3XHU0RUY2XHU1OTM5XHUzMDAxXHU2MjUzXHU1RjAwXHU1QkY5XHU4QkREXHU1RTc2XHU2RDg4XHU5NjY0XHU2NzJBXHU4QkZCXG4gIGNvbnN0IGhhbmRsZUp1bXBUb0FjdGl2ZVRhc2sgPSAoc2Vzc2lvbklkOiBzdHJpbmcsIG93bmVyV3M/OiBXb3Jrc3BhY2VWaWV3KSA9PiB7XG4gICAgaWYgKG93bmVyV3MpIHtcbiAgICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcygocHJldikgPT4gbmV3IFNldChbLi4ucHJldiwgb3duZXJXcy53b3Jrc3BhY2VJZF0pKVxuICAgICAgY29uc3QgbWV0YSA9IGdsb2JhbFRyZWVTdG9yZS5nZXRNZXRhRm9yV29ya3NwYWNlKG93bmVyV3MucGF0aClcbiAgICAgIGNvbnN0IHRhcmdldEZvbGRlciA9IG1ldGEuZm9sZGVycy5maW5kKChmKSA9PiBmLnNlc3Npb25JZHMuaW5jbHVkZXMoc2Vzc2lvbklkKSlcbiAgICAgIGlmICh0YXJnZXRGb2xkZXIgJiYgdGFyZ2V0Rm9sZGVyLmNvbGxhcHNlZCkge1xuICAgICAgICBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlRm9sZGVyKG93bmVyV3MucGF0aCwgdGFyZ2V0Rm9sZGVyLmlkKVxuICAgICAgfVxuICAgIH1cbiAgICBoYW5kbGVPcGVuU2Vzc2lvbihzZXNzaW9uSWQpXG4gIH1cblxuICBjb25zdCBmaWx0ZXJlZFdvcmtzcGFjZXMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIXNlYXJjaFF1ZXJ5LnRyaW0oKSkgcmV0dXJuIGl0ZW1zXG4gICAgY29uc3QgcSA9IHNlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKClcbiAgICByZXR1cm4gaXRlbXMuZmlsdGVyKCh3cykgPT4ge1xuICAgICAgY29uc3QgbWF0Y2hUaXRsZSA9ICh3cy50aXRsZSB8fCAnJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKVxuICAgICAgY29uc3QgbWF0Y2hTZXNzaW9ucyA9ICh3cy5zZXNzaW9uSWRzIHx8IFtdKS5zb21lKChzSWQpID0+IHtcbiAgICAgICAgY29uc3Qgc2lkU3RyID0gc0lkIGFzIHVua25vd24gYXMgc3RyaW5nXG4gICAgICAgIGlmIChhcmNoaXZlZFNldC5oYXMoc2lkU3RyKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGNvbnN0IHRpdGxlID0gc2Vzc2lvbnNTdGF0ZS5ieUlkPy5bc2lkU3RyXT8udGl0bGUgfHwgJydcbiAgICAgICAgcmV0dXJuIHRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSlcbiAgICAgIH0pXG4gICAgICByZXR1cm4gbWF0Y2hUaXRsZSB8fCBtYXRjaFNlc3Npb25zXG4gICAgfSlcbiAgfSwgW2l0ZW1zLCBzZWFyY2hRdWVyeSwgc2Vzc2lvbnNTdGF0ZS5ieUlkLCBhcmNoaXZlZFNldF0pXG5cbiAgY29uc3QgaGFuZGxlT3BlbkFkZFdvcmtzcGFjZSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHByb3BzLnBpY2tEaXJlY3RvcnkpIHtcbiAgICAgICAgY29uc3QgcGlja2VkID0gYXdhaXQgcHJvcHMucGlja0RpcmVjdG9yeSgpXG4gICAgICAgIGlmIChwaWNrZWQpIHtcbiAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBwcm9wcy5jcmVhdGVXb3Jrc3BhY2U/Lih7IHBhdGg6IHBpY2tlZCB9KVxuICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdzSWQgPSAocmVzIGFzIGFueSkud29ya3NwYWNlSWQgfHwgKHJlcyBhcyBhbnkpLmlkXG4gICAgICAgICAgICBpZiAod3NJZCkge1xuICAgICAgICAgICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMoKHByZXYpID0+IG5ldyBTZXQoWy4uLnByZXYsIHdzSWRdKSlcbiAgICAgICAgICAgICAgcHJvcHMuc3RhcnRTZXNzaW9uPy4od3NJZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKHBpY2tlZClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gaWdub3JlXG4gICAgfVxuICAgIC8vIEZhbGxiYWNrOiBzaG93IGlubGluZSBpbnB1dCBmb3IgbWFudWFsIGFic29sdXRlIHBhdGhcbiAgICBzZXRJc0FkZGluZ1dvcmtzcGFjZSh0cnVlKVxuICAgIHNldFNob3dTZWFyY2goZmFsc2UpXG4gIH1cblxuICBjb25zdCBoYW5kbGVDb25maXJtQWRkV29ya3NwYWNlID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHAgPSBuZXdXb3Jrc3BhY2VQYXRoLnRyaW0oKVxuICAgIGlmICghcCkge1xuICAgICAgc2V0SXNBZGRpbmdXb3Jrc3BhY2UoZmFsc2UpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHByb3BzLmNyZWF0ZVdvcmtzcGFjZT8uKHsgcGF0aDogcCB9KVxuICAgICAgaWYgKHJlcykge1xuICAgICAgICBjb25zdCB3c0lkID0gKHJlcyBhcyBhbnkpLndvcmtzcGFjZUlkIHx8IChyZXMgYXMgYW55KS5pZFxuICAgICAgICBpZiAod3NJZCkge1xuICAgICAgICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcygocHJldikgPT4gbmV3IFNldChbLi4ucHJldiwgd3NJZF0pKVxuICAgICAgICAgIHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzSWQpXG4gICAgICAgIH1cbiAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLmxvYWRXb3Jrc3BhY2UocClcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIENyZWF0ZSB3b3Jrc3BhY2UgZmFpbGVkOicsIGVycilcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNBZGRpbmdXb3Jrc3BhY2UoZmFsc2UpXG4gICAgICBzZXROZXdXb3Jrc3BhY2VQYXRoKCcnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBoZWlnaHQ6ICcxMDAlJywgb3ZlcmZsb3dZOiAnYXV0bycsIHVzZXJTZWxlY3Q6ICdub25lJywgZm9udEZhbWlseTogJ2luaGVyaXQnIH19PlxuICAgICAgey8qIDEuIEhlYWRlciBCYXI6IFx1NURFNVx1NEY1Q1x1NTMzQSAqL31cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJywgcGFkZGluZzogJzEycHggMTRweCA2cHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsIGZvbnRTaXplOiAnMTNweCcsIGZvbnRXZWlnaHQ6IDYwMCB9fT5cbiAgICAgICAgPHNwYW4+XHU1REU1XHU0RjVDXHU1MzNBPC9zcGFuPlxuICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogaXNBZGRpbmdXb3Jrc3BhY2UgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgIGNvbG9yOiBpc0FkZGluZ1dvcmtzcGFjZSA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICB0aXRsZT1cIlx1NkRGQlx1NTJBMC9cdTY1QjBcdTVFRkFcdTVERTVcdTRGNUNcdTUzM0FcIlxuICAgICAgICAgICAgb25DbGljaz17aGFuZGxlT3BlbkFkZFdvcmtzcGFjZX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8UGx1c0ljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogc2hvd1NlYXJjaCA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgY29sb3I6IHNob3dTZWFyY2ggPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnM3B4JyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgdGl0bGU9XCJcdTY0MUNcdTdEMjJcdTVERTVcdTRGNUNcdTUzM0FcdTYyMTZcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBzZXRTaG93U2VhcmNoKCFzaG93U2VhcmNoKVxuICAgICAgICAgICAgICBzZXRJc0FkZGluZ1dvcmtzcGFjZShmYWxzZSlcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFNlYXJjaEljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBcdTdEMjdcdTUxRDFcdTY1QjBcdTVFRkEvXHU2REZCXHU1MkEwXHU1REU1XHU0RjVDXHU1MzNBXHU4RjkzXHU1MTY1XHU2ODQ2ICovfVxuICAgICAge2lzQWRkaW5nV29ya3NwYWNlICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnB4IDEwcHggNnB4JyB9fT5cbiAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1OEY5M1x1NTE2NVx1OTg3OVx1NzZFRVx1NzZFRVx1NUY1NVx1OERFRlx1NUY4NCAoXHU1OTgyIC9ob21lL3VzZXIvcHJvamVjdCkuLi5cIlxuICAgICAgICAgICAgdmFsdWU9e25ld1dvcmtzcGFjZVBhdGh9XG4gICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE5ld1dvcmtzcGFjZVBhdGgoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIGhhbmRsZUNvbmZpcm1BZGRXb3Jrc3BhY2UoKVxuICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgICAgICAgICAgc2V0SXNBZGRpbmdXb3Jrc3BhY2UoZmFsc2UpXG4gICAgICAgICAgICAgICAgc2V0TmV3V29ya3NwYWNlUGF0aCgnJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uQmx1cj17KCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIW5ld1dvcmtzcGFjZVBhdGgudHJpbSgpKSBzZXRJc0FkZGluZ1dvcmtzcGFjZShmYWxzZSlcbiAgICAgICAgICAgICAgZWxzZSBoYW5kbGVDb25maXJtQWRkV29ya3NwYWNlKClcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHU3RDI3XHU1MUQxXHU2NDFDXHU3RDIyXHU4RjkzXHU1MTY1XHU2ODQ2ICovfVxuICAgICAge3Nob3dTZWFyY2ggJiYgKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcycHggMTBweCA2cHgnIH19PlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgIGhlaWdodDogJzI4cHgnLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHU2NDFDXHU3RDIyXHU1REU1XHU0RjVDXHU1MzNBXHU2MjE2XHU0RjFBXHU4QkRELi4uXCJcbiAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIDIuIFx1OTg3Nlx1OTBFOFx1NkQzQlx1NTJBOC9cdTVGODVcdThCRkJcdTRFRkJcdTUyQTEgKFx1NTM1NVx1ODg0Q1x1Njc4MVx1N0I4MFx1N0NCRVx1ODFGNFx1ODBGNlx1NTZDQSAyOHB4IFx1OUFEOFx1NUVBNlx1RkYwQ1x1OEZEQlx1ODg0Q1x1NEUyRC9cdTVGODVcdTc4NkVcdThCQTQvXHU1Rjg1XHU4QkZCKSAqL31cbiAgICAgIHtiYW5uZXJUYXNrcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnB4IDhweCA2cHgnLCBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgIHtiYW5uZXJUYXNrcy5tYXAoKHRhc2spID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmYgPSBUQVNLX1NUWUxFX0NPTkZJR1t0YXNrLnN0YXR1c11cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e3Rhc2suc2Vzc2lvbklkfVxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi5iZyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2NvbmYuYm9yZGVyfWAsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17YCR7Y29uZi50aXRsZVByZWZpeH0gKFx1NzBCOVx1NTFGQlx1NzZGNFx1OEZCRSR7dGFzay5zdGF0dXMgPT09ICdjb21wbGV0ZWQnID8gJ1x1NUU3Nlx1NkQ4OFx1OTY2NFx1NUY4NVx1OEJGQicgOiAnJ31cdUZGMENcdTRGNERcdTRFOEU6ICR7dGFzay53cz8udGl0bGUgfHwgJ1x1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQSd9KWB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlSnVtcFRvQWN0aXZlVGFzayh0YXNrLnNlc3Npb25JZCwgdGFzay53cyl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBjb25mLmhvdmVyQmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuaG92ZXJCb3JkZXJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZXZyb24gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnRhc2stY2hldnJvbicpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGNvbmYuYmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuYm9yZGVyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjaGV2cm9uID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy50YXNrLWNoZXZyb24nKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgaWYgKGNoZXZyb24pIGNoZXZyb24uc3R5bGUuY29sb3IgPSAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KSdcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSB9fT5cbiAgICAgICAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiB0YXNrLnN0YXR1cyA9PT0gJ3BlbmRpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UGVuZGluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxMnB4JywgZm9udFdlaWdodDogNTAwLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJyB9fT5cbiAgICAgICAgICAgICAgICAgICAge3Rhc2sudGl0bGV9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7dGFzay53cz8udGl0bGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIG9wYWNpdHk6IDAuOCB9fT5cbiAgICAgICAgICAgICAgICAgICAgICBcdTAwQjcge3Rhc2sud3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcsIGZsZXhTaHJpbms6IDAgfX0+XG4gICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbmYudGFnQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi50YWdCZyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMXB4IDVweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7Y29uZi50YWdUZXh0fVxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGFzay1jaGV2cm9uXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZ0xlZnQ6ICcycHgnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4xNXMgZWFzZScgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHRJY29uIHNpemU9ezExfSAvPlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogMy4gV29ya3NwYWNlcyBUcmVlIExpc3QgKi99XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzJweCcsIHBhZGRpbmc6ICcwIDZweCcgfX0+XG4gICAgICAgIHtmaWx0ZXJlZFdvcmtzcGFjZXMubWFwKCh3cykgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbmRlZFdvcmtzcGFjZXMuaGFzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1RDgzQ1x1REYxRiBcdThCRkJcdTUzRDZcdTZCQ0ZcdTRFMkFcdTVERTVcdTRGNUNcdTUzM0FcdTcyRUNcdTdBQ0JcdTc2ODRcdTUxNDNcdTY1NzBcdTYzNkVcdUZGMDhcdTZDMzhcdTRFNDVcdTdBMzNcdTVCOUFcdTVFMzhcdTlBN0JcdUZGMDlcbiAgICAgICAgICBjb25zdCB3c01ldGEgPSBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZSh3cy5wYXRoKVxuICAgICAgICAgIGNvbnN0IHdzUGlubmVkU2V0ID0gbmV3IFNldCh3c01ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSlcblxuICAgICAgICAgIGNvbnN0IHJhd1Nlc3Npb25zID0gKHdzLnNlc3Npb25JZHMgfHwgW10pLm1hcCgoc0lkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaWRTdHIgPSBzSWQgYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzaWRTdHJdXG4gICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzaWRTdHIpKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpZDogc2lkU3RyLFxuICAgICAgICAgICAgICB0aXRsZTogc2Vzc2lvbj8udGl0bGUgfHwgc2lkU3RyLnNsaWNlKDAsIDE2KSxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBzZXNzaW9uPy51cGRhdGVkQXQgfHwgMCxcbiAgICAgICAgICAgICAgcnVubmluZzogQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKSxcbiAgICAgICAgICAgICAgcGVuZGluZ0ludGVyYWN0aW9uOiBzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgIGNvbXBsZXRlZDogaXNVbnJlYWQgJiYgc2lkU3RyICE9PSBhY3RpdmVTZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGJsYW5rOiBCb29sZWFuKHNlc3Npb24/LmJsYW5rKSxcbiAgICAgICAgICAgICAgaXNQaW5uZWQ6IHdzUGlubmVkU2V0LmhhcyhzaWRTdHIpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCB2YWxpZFNlc3Npb25zID0gcmF3U2Vzc2lvbnNcbiAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAuZmlsdGVyKChzKSA9PiAhaXNCbGFua1BsYWNlaG9sZGVyKHMuaWQsIHMudGl0bGUsIHMuYmxhbmssIGFjdGl2ZVNlc3Npb25JZCA9PT0gcy5pZCkpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICBpZiAoYS5ydW5uaW5nICE9PSBiLnJ1bm5pbmcpIHJldHVybiBhLnJ1bm5pbmcgPyAtMSA6IDFcbiAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgIHJldHVybiAoYi51cGRhdGVkQXQgfHwgMCkgLSAoYS51cGRhdGVkQXQgfHwgMClcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCBjYXRlZ29yaXplZFNlc3Npb25JZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB3c01ldGEuZm9sZGVycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBzSWQgb2YgZi5zZXNzaW9uSWRzKSBjYXRlZ29yaXplZFNlc3Npb25JZHMuYWRkKHNJZClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgPSB2YWxpZFNlc3Npb25zLmZpbHRlcigocykgPT4gIWNhdGVnb3JpemVkU2Vzc2lvbklkcy5oYXMocy5pZCkpXG4gICAgICAgICAgY29uc3Qgc2hvd0FsbCA9IHNob3dBbGxTZXNzaW9uc01hcFt3cy53b3Jrc3BhY2VJZF0gfHwgZmFsc2VcbiAgICAgICAgICBjb25zdCB2aXNpYmxlVW5jYXRlZ29yaXplZCA9IHNob3dBbGwgPyB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgOiB1bmNhdGVnb3JpemVkU2Vzc2lvbnMuc2xpY2UoMCwgREVGQVVMVF9WSVNJQkxFX0xJTUlUKVxuICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0NvdW50ID0gdW5jYXRlZ29yaXplZFNlc3Npb25zLmxlbmd0aCAtIERFRkFVTFRfVklTSUJMRV9MSU1JVFxuXG4gICAgICAgICAgY29uc3QgcmVuZGVyTW92ZURyb3Bkb3duID0gKHNJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgIT09IHNJZCkgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIGNvbnN0IGlzQ2F0ZWdvcml6ZWQgPSBjYXRlZ29yaXplZFNlc3Npb25JZHMuaGFzKHNJZClcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICB0b3A6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgekluZGV4OiA5OTk5LFxuICAgICAgICAgICAgICAgICAgbWluV2lkdGg6ICcxNjBweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIsICMxZTI5M2IpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC40NSknLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICAgICAgICAgICAgICAgIGdhcDogJzJweCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZzogJzRweCA4cHgnLCBmb250V2VpZ2h0OiA2MDAsIGJvcmRlckJvdHRvbTogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyB9fT5cbiAgICAgICAgICAgICAgICAgIFx1NzlGQlx1NTJBOFx1ODFGM1x1NzZFRVx1NjgwN1x1NjU4N1x1NEVGNlx1NTkzOTpcbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7d3NNZXRhLmZvbGRlcnMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnNnB4IDhweCcsIGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScgfX0+XG4gICAgICAgICAgICAgICAgICAgIFx1NjY4Mlx1NjVFMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1OEJGN1x1NTE0OFx1NTIxQlx1NUVGQVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIHdzTWV0YS5mb2xkZXJzLm1hcCgoZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpblRoaXNGb2xkZXIgPSBmLnNlc3Npb25JZHMuaW5jbHVkZXMoc0lkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Zi5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpblRoaXNGb2xkZXIgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogaW5UaGlzRm9sZGVyID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjEyKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBpblRoaXNGb2xkZXIgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTIpJyA6ICd0cmFuc3BhcmVudCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBmLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxM30gY29sb3I9e2YuY29sb3IgfHwgJyM2MGE1ZmEnfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBmbGV4OiAxIH19PntmLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2luVGhpc0ZvbGRlciAmJiA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEwcHgnLCBjb2xvcjogJyM2MGE1ZmEnIH19Plx1MjcxMzwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgIHsvKiBcdTU5ODJcdTY3OUNcdTVERjJcdTdFQ0ZcdTU3MjhcdTY3RDBcdTRFMkFcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdUZGMENcdTY2M0VcdTc5M0FcdTc5RkJcdTUxRkFcdTkwMDlcdTk4NzkgKi99XG4gICAgICAgICAgICAgICAge2lzQ2F0ZWdvcml6ZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBnYXA6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjY2JkNWUxJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScsXG4gICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknKX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxNb3ZlT3V0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHU3OUZCXHU1MUZBXHU4MUYzXHU2NzJBXHU1MjA2XHU3QzdCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYga2V5PXt3cy53b3Jrc3BhY2VJZH0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgICAgICAgICAgey8qIFdvcmtzcGFjZSBSb3cgSXRlbSAqL31cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczNHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0V4cGFuZGVkID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA1MDAsXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aCl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucyAmJiBhY3RpdmVNZW51V3NJZCAhPT0gd3Mud29ya3NwYWNlSWQpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgc2l6ZT17MTJ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGlzRXhwYW5kZWQgPyAncm90YXRlKDkwZGVnKScgOiAncm90YXRlKDBkZWcpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEZvbGRlckljb24gc2l6ZT17MTV9IGNvbG9yPVwiIzYwYTVmYVwiIHN0eWxlPXt7IGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgIHtlZGl0aW5nV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdFdzVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0V3NUaXRsZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lV3Mod3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVdzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19IHRpdGxlPXt3cy5wYXRofT5cbiAgICAgICAgICAgICAgICAgICAgICB7d3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIEFjdGlvbiBCdXR0b25zICovfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIndzLWFjdGlvbnNcIlxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgZGlzcGxheTogYWN0aXZlTWVudVdzSWQgPT09IHdzLndvcmtzcGFjZUlkID8gJ2lubGluZS1mbGV4JyA6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTcyOFx1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQVx1NjVCMFx1NUVGQVx1NTIwNlx1N0M3Qlx1NjU4N1x1NEVGNlx1NTkzOVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRXhwYW5kZWQpIHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZCh3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPEFkZEZvbGRlckljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzLndvcmtzcGFjZUlkKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFBsdXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTY2RjRcdTU5MUFcdTY0Q0RcdTRGNUNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVNZW51V3NJZChhY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyBudWxsIDogd3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8RWxsaXBzaXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogXHU1RjM5XHU1MUZBXHU4M0RDXHU1MzU1ICovfVxuICAgICAgICAgICAgICAgIHthY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICByZWY9e21lbnVSZWZ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHRvcDogJzMycHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHpJbmRleDogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctc3VyZmFjZS0wLCAjMTgxODE4KScsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHZhcigtLWRzdy1ib3JkZXItZGVmYXVsdCwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KSknLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnMCA2cHggMjBweCByZ2JhKDAsIDAsIDAsIDAuNDUpJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzEyMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcEZpbHRlcjogJ2JsdXIoMTJweCknLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDEwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCkpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1dzSWQod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0V3NUaXRsZSh3cy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxM30gLz5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTkxQ0RcdTU0N0RcdTU0MEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZjg3MTcxJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI0OCwgMTEzLCAxMTMsIDAuMTIpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZGVsZXRlV29ya3NwYWNlPy4od3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1NTIyMFx1OTY2NFx1NURFNVx1NEY1Q1x1NTMzQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIENvbnRlbnQgKEZvbGRlcnMgKyBTZXNzaW9ucykgKi99XG4gICAgICAgICAgICAgIHtpc0V4cGFuZGVkICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzFweCcsIHBhZGRpbmdMZWZ0OiAnMTRweCcgfX0+XG4gICAgICAgICAgICAgICAgICB7LyogSW5saW5lIE5ldyBGb2xkZXIgSW5wdXQgRm9ybSAqL31cbiAgICAgICAgICAgICAgICAgIHtpc0NyZWF0aW5nRm9sZGVyV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICc0cHggNnB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1OEY5M1x1NTE2NVx1NjU4N1x1NEVGNlx1NTkzOVx1NTQwRFx1NzlGMCAoXHU1NkRFXHU4RjY2XHU1MjFCXHU1RUZBLCBFU0NcdTUzRDZcdTZEODgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtuZXdGb2xkZXJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdGb2xkZXJOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdGb2xkZXJOYW1lLnRyaW0oKSkgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQS4gVmlydHVhbCBGb2xkZXJzICovfVxuICAgICAgICAgICAgICAgICAge3dzTWV0YS5mb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvbGRlclNlc3Npb25zID0gZm9sZGVyLnNlc3Npb25JZHNcbiAgICAgICAgICAgICAgICAgICAgICAubWFwKChzSWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzSWQgYXMgdW5rbm93biBhcyBzdHJpbmddXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzSWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHNJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHNlc3Npb24/LnRpdGxlIHx8IHNJZC5zbGljZSgwLCAxNiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogc2Vzc2lvbj8udXBkYXRlZEF0IHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmc6IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdJbnRlcmFjdGlvbjogc2Vzc2lvbj8ucGVuZGluZ0ludGVyYWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IGlzVW5yZWFkICYmIHNJZCAhPT0gYWN0aXZlU2Vzc2lvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBibGFuazogQm9vbGVhbihzZXNzaW9uPy5ibGFuayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlzUGlubmVkOiB3c1Bpbm5lZFNldC5oYXMoc0lkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnJ1bm5pbmcgIT09IGIucnVubmluZykgcmV0dXJuIGEucnVubmluZyA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGIudXBkYXRlZEF0IHx8IDApIC0gKGEudXBkYXRlZEF0IHx8IDApXG4gICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtmb2xkZXIuaWR9IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogRm9sZGVyIEhlYWRlciBSb3cgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5mb2xkZXItYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbnMpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZvbGRlci1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9ezEwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBmb2xkZXIuY29sbGFwc2VkID8gJ3JvdGF0ZSgwZGVnKScgOiAncm90YXRlKDkwZGVnKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvbGRlckljb24gc2l6ZT17MTR9IGNvbG9yPXtmb2xkZXIuY29sb3IgfHwgJyM2MGE1ZmEnfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdGb2xkZXJJZCA9PT0gZm9sZGVyLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzIycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEZvbGRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdEZvbGRlck5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdEZvbGRlck5hbWUudHJpbSgpKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucmVuYW1lRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCwgZWRpdEZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdEZvbGRlck5hbWUudHJpbSgpKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucmVuYW1lRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCwgZWRpdEZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgZm9udFdlaWdodDogNTAwIH19IG9uRG91YmxlQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0ZvbGRlcklkKGZvbGRlci5pZCk7IHNldEVkaXRGb2xkZXJOYW1lKGZvbGRlci5uYW1lKSB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZvbGRlci5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyB9fT4oe2ZvbGRlclNlc3Npb25zLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHVEODNDXHVERjFGIFx1NjU4N1x1NEVGNlx1NTkzOVx1NjRDRFx1NEY1Q1x1NjgwRlx1RkYxQVx1NTMwNVx1NTQyQiBbK10gXHU1NzI4XHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU3NkY0XHU2M0E1XHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbGRlci1hY3Rpb25zXCIgc3R5bGU9e3sgZGlzcGxheTogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fSBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JywgZGlzcGxheTogJ2lubGluZS1mbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1NzI4XHU2QjY0XHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUNyZWF0ZVNlc3Npb25JbkZvbGRlcih3cy53b3Jrc3BhY2VJZCwgd3MucGF0aCwgZm9sZGVyLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGx1c0ljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JywgZGlzcGxheTogJ2lubGluZS1mbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU5MUNEXHU1NDdEXHU1NDBEXHU2NTg3XHU0RUY2XHU1OTM5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0ZvbGRlcklkKGZvbGRlci5pZCk7IHNldEVkaXRGb2xkZXJOYW1lKGZvbGRlci5uYW1lKSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICcjZjg3MTcxJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzkgKFx1NTE4NVx1OTBFOFx1NEYxQVx1OEJERFx1OEZENFx1NTZERVx1NjcyQVx1NTIwNlx1N0M3QilcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ2xvYmFsVHJlZVN0b3JlLmRlbGV0ZUZvbGRlcih3cy5wYXRoLCBmb2xkZXIuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBGb2xkZXIgSW50ZXJuYWwgU2Vzc2lvbnMgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICB7IWZvbGRlci5jb2xsYXBzZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnMXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiAnMTZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmb2xkZXJTZXNzaW9ucy5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWxUaW1lID0gZm9ybWF0UmVsYXRpdmVUaW1lKHMudXBkYXRlZEF0KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LDI1NSwyNTUsMC4wNikpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogaXNBY3RpdmUgPyAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWJ1c2luZXNzLXByaW1hcnksICM5M2M1ZmQpJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2NiZDVlMSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IGlzQWN0aXZlID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdiYWNrZ3JvdW5kIDAuMTJzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlT3BlblNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRTZXNzaW9uVGl0bGUocy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0KSBhY3Quc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MucnVubmluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJ1bm5pbmdEb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5jb21wbGV0ZWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5pc1Bpbm5lZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17dHJ1ZX0gc3R5bGU9e3sgY29sb3I6ICcjZmJiZjI0JywgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoYXRJY29uIHNpemU9ezEzfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCBvcGFjaXR5OiAwLjYgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0U2Vzc2lvblRpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IGhhbmRsZVNhdmVSZW5hbWVTZXNzaW9uKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwic2Vzcy10aW1lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBzLnJ1bm5pbmcgPyAnIzYwYTVmYScgOiBzLmNvbXBsZXRlZCA/ICcjNGFkZTgwJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gJ1x1NzUxRlx1NjIxMFx1NEUyRCcgOiBzLmNvbXBsZXRlZCA/ICdcdTVERjJcdTVCOENcdTYyMTAnIDogcmVsVGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NEYxQVx1OEJERFx1NjBBQ1x1NTA1Q1x1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVx1N0VDNCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlc3MtYWN0XCIgc3R5bGU9e3sgZGlzcGxheTogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiBzLmlzUGlubmVkID8gJyNmYmJmMjQnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3MuaXNQaW5uZWQgPyAnXHU1M0Q2XHU2RDg4XHU3RjZFXHU5ODc2JyA6ICdcdTdGNkVcdTk4NzZcdTRGMUFcdThCREQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlUGluU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXtzLmlzUGlubmVkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIwNlx1NTNDOVx1NEYxQVx1OEJERCAoRm9yaylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JrU2Vzc2lvbj8uKHMuaWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JrSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NzlGQlx1NTJBOFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjJDOVx1ODNEQ1x1NTM1NVx1NjMwOVx1OTRBRSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gJyM2MGE1ZmEnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NTE3Nlx1NEVENlx1NjU4N1x1NEVGNlx1NTkzOVx1NjIxNlx1NjcyQVx1NTIwNlx1N0M3Qi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlbmRlck1vdmVEcm9wZG93bihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICcjZjg3MTcxJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQi4gVW5jYXRlZ29yaXplZCBTZXNzaW9ucyAoU29ydGVkIGJ5IHRpbWUgKyBQaW5uZWQgRmlyc3QgKyAxMCBMaW1pdCkgKi99XG4gICAgICAgICAgICAgICAgICB7dmlzaWJsZVVuY2F0ZWdvcml6ZWQubWFwKChzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbFRpbWUgPSBmb3JtYXRSZWxhdGl2ZVRpbWUocy51cGRhdGVkQXQpXG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3MuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LDI1NSwyNTUsMC4wNikpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtYnVzaW5lc3MtcHJpbWFyeSwgIzkzYzVmZCknIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjY2JkNWUxKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IGlzQWN0aXZlID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYmFja2dyb3VuZCAwLjEycyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVPcGVuU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3QgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtYWN0JykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtKSB0bS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSwgcG9pbnRlckV2ZW50czogZWRpdGluZ1Nlc3Npb25JZCA9PT0gcy5pZCA/ICdhdXRvJyA6ICdub25lJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3MucnVubmluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IHMucGVuZGluZ0ludGVyYWN0aW9uID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmNvbXBsZXRlZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q29tcGxldGVkRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5pc1Bpbm5lZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXt0cnVlfSBzdHlsZT17eyBjb2xvcjogJyNmYmJmMjQnLCBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoYXRJY29uIHNpemU9ezEzfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCBvcGFjaXR5OiAwLjYgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1Nlc3Npb25JZCA9PT0gcy5pZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0U2Vzc2lvblRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0U2Vzc2lvblRpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4gaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkICE9PSBzLmlkICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzZXNzLXRpbWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHMucnVubmluZyA/ICcjNjBhNWZhJyA6IHMuY29tcGxldGVkID8gJyM0YWRlODAnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogcy5jb21wbGV0ZWQgPyA1MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gJ1x1NzUxRlx1NjIxMFx1NEUyRCcgOiBzLmNvbXBsZXRlZCA/ICdcdTVERjJcdTVCOENcdTYyMTAnIDogcmVsVGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NEYxQVx1OEJERFx1NjBBQ1x1NTA1Q1x1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVx1N0VDNCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2Vzcy1hY3RcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiBzLmlzUGlubmVkID8gJyNmYmJmMjQnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy5pc1Bpbm5lZCA/ICdcdTUzRDZcdTZEODhcdTdGNkVcdTk4NzYnIDogJ1x1N0Y2RVx1OTg3Nlx1NEYxQVx1OEJERCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVQaW5TZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3MuaXNQaW5uZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU5MUNEXHU1NDdEXHU1NDBEXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjA2XHU1M0M5XHU0RjFBXHU4QkREIChGb3JrKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmZvcmtTZXNzaW9uPy4ocy5pZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvcmtJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NzlGQlx1NTJBOFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjJDOVx1ODNEQ1x1NTM1NVx1NjMwOVx1OTRBRSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZGlzcGxheTogJ2lubGluZS1mbGV4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTc5RkJcdTUyQThcdTRGMUFcdThCRERcdTgxRjNcdTY1ODdcdTRFRjZcdTU5MzkuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/IG51bGwgOiBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TW92ZVRvRm9sZGVySWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVuZGVyTW92ZURyb3Bkb3duKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIyMFx1OTY2NFx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZURlbGV0ZVNlc3Npb24od3MucGF0aCwgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBcdTVDNTVcdTVGMDBcdTUxNzZcdTRGNTkgTiBcdTRFMkFcdTRGMUFcdThCREQgKi99XG4gICAgICAgICAgICAgICAgICB7IXNob3dBbGwgJiYgcmVtYWluaW5nQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuY29sb3IgPSAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmZmYpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0FsbFNlc3Npb25zTWFwKChwcmV2KSA9PiAoeyAuLi5wcmV2LCBbd3Mud29ya3NwYWNlSWRdOiB0cnVlIH0pKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIFx1NUM1NVx1NUYwMFx1NTE3Nlx1NEY1OSB7cmVtYWluaW5nQ291bnR9IFx1NEUyQVx1NEYxQVx1OEJERFxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cbiIsICIvKipcbiAqIENsaWVudCBBUEkgYnJpZGdlIGZvciBkc2gtd29ya3NwYWNlLXRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBTdWJwcm9qZWN0SW5mbywgV29ya3NwYWNlVHJlZU1ldGEgfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMudHMnXG5cbmV4cG9ydCBjb25zdCBST1VURV9QUkVGSVggPSAnL2FwaS9kc2gtd29ya3NwYWNlLXRyZWUnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFRyZWVNZXRhKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8V29ya3NwYWNlVHJlZU1ldGEgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7Uk9VVEVfUFJFRklYfS9tZXRhP3dvcmtzcGFjZVJvb3Q9JHtlbmNvZGVVUklDb21wb25lbnQod29ya3NwYWNlUm9vdCl9YClcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEgfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLm1ldGEgOiBudWxsXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRmFpbGVkIHRvIGZldGNoIG1ldGE6JywgZXJyKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVUcmVlTWV0YSh3b3Jrc3BhY2VSb290OiBzdHJpbmcsIG1ldGE6IFdvcmtzcGFjZVRyZWVNZXRhKTogUHJvbWlzZTxXb3Jrc3BhY2VUcmVlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L21ldGFgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyB3b3Jrc3BhY2VSb290LCBtZXRhIH0pLFxuICAgIH0pXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBudWxsXG4gICAgY29uc3QganNvbiA9IChhd2FpdCByZXMuanNvbigpKSBhcyB7IHN1Y2Nlc3M6IGJvb2xlYW47IG1ldGE6IFdvcmtzcGFjZVRyZWVNZXRhIH1cbiAgICByZXR1cm4ganNvbi5zdWNjZXNzID8ganNvbi5tZXRhIDogbnVsbFxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIEZhaWxlZCB0byBzYXZlIG1ldGE6JywgZXJyKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5TdWJwcm9qZWN0cyh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBQcm9taXNlPFN1YnByb2plY3RJbmZvW10+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L3NjYW4/d29ya3NwYWNlUm9vdD0ke2VuY29kZVVSSUNvbXBvbmVudCh3b3Jrc3BhY2VSb290KX1gKVxuICAgIGlmICghcmVzLm9rKSByZXR1cm4gW11cbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgc3VicHJvamVjdHM6IFN1YnByb2plY3RJbmZvW10gfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLnN1YnByb2plY3RzIDogW11cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gc2NhbiBzdWJwcm9qZWN0czonLCBlcnIpXG4gICAgcmV0dXJuIFtdXG4gIH1cbn1cbiIsICIvKipcbiAqIE11bHRpLVdvcmtzcGFjZSBSZWFjdGl2ZSBUcmVlU3RvcmUgZm9yIG1hbmFnaW5nIHZpcnR1YWwgZm9sZGVycywgc3VicHJvamVjdHMsXG4gKiBhbmQgc2Vzc2lvbiBwbGFjZW1lbnRzIGFjcm9zcyBhbGwgd29ya3NwYWNlcyBjb25jdXJyZW50bHkuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBWaXJ0dWFsRm9sZGVyLCBXb3Jrc3BhY2VUcmVlTWV0YSwgU3VicHJvamVjdEluZm8gfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMudHMnXG5pbXBvcnQgeyBmZXRjaFRyZWVNZXRhLCBzYXZlVHJlZU1ldGEsIHNjYW5TdWJwcm9qZWN0cyB9IGZyb20gJy4vYXBpLnRzJ1xuXG5leHBvcnQgdHlwZSBMaXN0ZW5lciA9ICgpID0+IHZvaWRcblxuY29uc3QgREVGQVVMVF9NRVRBID0gKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFdvcmtzcGFjZVRyZWVNZXRhID0+ICh7XG4gIHZlcnNpb246IDEsXG4gIGluYm94U2Vzc2lvbklkczogW10sXG4gIHBpbm5lZFNlc3Npb25JZHM6IFtdLFxuICBmb2xkZXJzOiBbXSxcbiAgc3VicHJvamVjdHM6IFtdLFxuICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG59KVxuXG5leHBvcnQgY2xhc3MgVHJlZVN0b3JlIHtcbiAgcHJpdmF0ZSBjYWNoZTogTWFwPHN0cmluZywgV29ya3NwYWNlVHJlZU1ldGE+ID0gbmV3IE1hcCgpXG4gIHByaXZhdGUgbGlzdGVuZXJzOiBTZXQ8TGlzdGVuZXI+ID0gbmV3IFNldCgpXG4gIHByaXZhdGUgaXNTYXZpbmdNYXA6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0gbmV3IE1hcCgpXG4gIHByaXZhdGUgdmVyc2lvbiA9IDBcblxuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgZ2V0VmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnZlcnNpb25cbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcilcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG5vdGlmeSgpOiB2b2lkIHtcbiAgICB0aGlzLnZlcnNpb24rK1xuICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVyKClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1ldGFkYXRhIGZvciBhIHNwZWNpZmljIHdvcmtzcGFjZSBwYXRoLlxuICAgKi9cbiAgZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBXb3Jrc3BhY2VUcmVlTWV0YSB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290KSByZXR1cm4gREVGQVVMVF9NRVRBKCcnKVxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jYWNoZS5nZXQod29ya3NwYWNlUm9vdClcbiAgICBpZiAoZXhpc3RpbmcpIHJldHVybiBleGlzdGluZ1xuXG4gICAgY29uc3QgZnJlc2ggPSBERUZBVUxUX01FVEEod29ya3NwYWNlUm9vdClcbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCBmcmVzaClcbiAgICAvLyBBc3luYyBsb2FkIGluIGJhY2tncm91bmRcbiAgICB0aGlzLmxvYWRXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICByZXR1cm4gZnJlc2hcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIG1ldGFkYXRhIGZyb20gYmFja2VuZCBmb3IgYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBsb2FkV29ya3NwYWNlKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghd29ya3NwYWNlUm9vdCkgcmV0dXJuXG4gICAgY29uc3QgbG9hZGVkID0gYXdhaXQgZmV0Y2hUcmVlTWV0YSh3b3Jrc3BhY2VSb290KVxuICAgIGlmIChsb2FkZWQpIHtcbiAgICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHtcbiAgICAgICAgLi4ubG9hZGVkLFxuICAgICAgICBwaW5uZWRTZXNzaW9uSWRzOiBBcnJheS5pc0FycmF5KGxvYWRlZC5waW5uZWRTZXNzaW9uSWRzKSA/IGxvYWRlZC5waW5uZWRTZXNzaW9uSWRzIDogW10sXG4gICAgICB9KVxuICAgICAgdGhpcy5ub3RpZnkoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgZm9sZGVyIHVuZGVyIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbmFtZTogc3RyaW5nLCBjb2xvcjogc3RyaW5nID0gJyM2MGE1ZmEnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpIHx8ICdcdTY1QjBcdTVFRkFcdTY1ODdcdTRFRjZcdTU5MzknXG4gICAgY29uc3QgaWQgPSBgZi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YFxuICAgIGNvbnN0IG5ld0ZvbGRlcjogVmlydHVhbEZvbGRlciA9IHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogdHJpbW1lZCxcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICBjb2xvcixcbiAgICAgIHNlc3Npb25JZHM6IFtdLFxuICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IFsuLi5tZXRhLmZvbGRlcnMsIG5ld0ZvbGRlcl0sXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gICAgcmV0dXJuIGlkXG4gIH1cblxuICAvKipcbiAgICogUmVuYW1lIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgcmVuYW1lRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHRyaW1tZWQgPSBuYW1lLnRyaW0oKVxuICAgIGlmICghdHJpbW1lZCkgcmV0dXJuXG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIG5hbWU6IHRyaW1tZWQgfSA6IGYpKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBkZWxldGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5maWx0ZXIoKGYpID0+IGYuaWQgIT09IGZvbGRlcklkKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgY29sbGFwc2Ugc3RhdHVzIG9mIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgdG9nZ2xlRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIGNvbGxhcHNlZDogIWYuY29sbGFwc2VkIH0gOiBmKSksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbG9yIGZvciBhIGZvbGRlciBpbiBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIHNldEZvbGRlckNvbG9yKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgY29sb3I6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiBtZXRhLmZvbGRlcnMubWFwKChmKSA9PiAoZi5pZCA9PT0gZm9sZGVySWQgPyB7IC4uLmYsIGNvbG9yIH0gOiBmKSksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogTW92ZSBhIHNlc3Npb24gaW50byBhIHNwZWNpZmljIGZvbGRlciBvciB0byB1bmNhdGVnb3JpemVkICh0YXJnZXRGb2xkZXJJZCA9IG51bGwpLlxuICAgKi9cbiAgYXN5bmMgbW92ZVNlc3Npb24od29ya3NwYWNlUm9vdDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZywgdGFyZ2V0Rm9sZGVySWQ6IHN0cmluZyB8IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZEZvbGRlcnMgPSBtZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+IHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gZm9sZGVyLnNlc3Npb25JZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZClcbiAgICAgIGlmICh0YXJnZXRGb2xkZXJJZCAhPT0gbnVsbCAmJiBmb2xkZXIuaWQgPT09IHRhcmdldEZvbGRlcklkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZm9sZGVyLFxuICAgICAgICAgIGNvbGxhcHNlZDogZmFsc2UsIC8vIFx1RDgzQ1x1REYxRiBcdTc5RkJcdTUxNjVcdTYyMTZcdTY1QjBcdTVFRkFcdTY1RjZcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMENcdTRGMUFcdThCRERcdTdBQ0JcdTUzNzNcdTUzRUZcdTg5QzFcbiAgICAgICAgICBzZXNzaW9uSWRzOiBbc2Vzc2lvbklkLCAuLi5maWx0ZXJlZF0sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmZvbGRlcixcbiAgICAgICAgc2Vzc2lvbklkczogZmlsdGVyZWQsXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IHVwZGF0ZWRGb2xkZXJzLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ld2x5IGNyZWF0ZWQgc2Vzc2lvbiBkaXJlY3RseSBpbnRvIGEgZm9sZGVyLlxuICAgKi9cbiAgYXN5bmMgYWRkU2Vzc2lvblRvRm9sZGVyKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgZm9sZGVySWQ6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLm1vdmVTZXNzaW9uKHdvcmtzcGFjZVJvb3QsIHNlc3Npb25JZCwgZm9sZGVySWQpXG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHBpbm5lZCBzdGF0dXMgb2YgYSBzZXNzaW9uIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgdG9nZ2xlUGluU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IGN1cnJlbnRQaW5uZWQgPSBuZXcgU2V0KG1ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSlcbiAgICBpZiAoY3VycmVudFBpbm5lZC5oYXMoc2Vzc2lvbklkKSkge1xuICAgICAgY3VycmVudFBpbm5lZC5kZWxldGUoc2Vzc2lvbklkKVxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50UGlubmVkLmFkZChzZXNzaW9uSWQpXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgcGlubmVkU2Vzc2lvbklkczogQXJyYXkuZnJvbShjdXJyZW50UGlubmVkKSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZWx5IHJlbW92ZSBhIGRlbGV0ZWQgc2Vzc2lvbiBmcm9tIGFsbCBmb2xkZXJzIGFuZCBwaW5uZWQgbGlzdCBpbiBhIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIHB1cmdlU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWRGb2xkZXJzID0gbWV0YS5mb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiAoe1xuICAgICAgLi4uZm9sZGVyLFxuICAgICAgc2Vzc2lvbklkczogZm9sZGVyLnNlc3Npb25JZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZCksXG4gICAgfSkpXG4gICAgY29uc3QgdXBkYXRlZFBpbm5lZCA9IChtZXRhLnBpbm5lZFNlc3Npb25JZHMgfHwgW10pLmZpbHRlcigoaWQpID0+IGlkICE9PSBzZXNzaW9uSWQpXG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBmb2xkZXJzOiB1cGRhdGVkRm9sZGVycyxcbiAgICAgIHBpbm5lZFNlc3Npb25JZHM6IHVwZGF0ZWRQaW5uZWQsXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcnNpc3Qod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290IHx8IHRoaXMuaXNTYXZpbmdNYXAuZ2V0KHdvcmtzcGFjZVJvb3QpKSByZXR1cm5cbiAgICB0aGlzLmlzU2F2aW5nTWFwLnNldCh3b3Jrc3BhY2VSb290LCB0cnVlKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgICBhd2FpdCBzYXZlVHJlZU1ldGEod29ya3NwYWNlUm9vdCwgbWV0YSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5pc1NhdmluZ01hcC5zZXQod29ya3NwYWNlUm9vdCwgZmFsc2UpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBnbG9iYWxUcmVlU3RvcmUgPSBuZXcgVHJlZVN0b3JlKClcbiIsICIvKipcbiAqIEZvcm1hdCB0aW1lc3RhbXAgaW50byBjb25jaXNlIHJlbGF0aXZlIHRpbWUgbWF0Y2hpbmcgRFNIIHN0eWxlIChcIlx1NTIxQVx1NTIxQVwiLCBcIjVcdTUyMDZcdTk0OUZcIiwgXCIxNlx1NUMwRlx1NjVGNlwiLCBcIlx1NjYyOFx1NTkyOVwiLCBcIjNcdTU5MjlcdTUyNERcIikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSZWxhdGl2ZVRpbWUodGltZXN0YW1wPzogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKCF0aW1lc3RhbXAgfHwgdHlwZW9mIHRpbWVzdGFtcCAhPT0gJ251bWJlcicpIHJldHVybiAnJ1xuICBjb25zdCBkaWZmID0gRGF0ZS5ub3coKSAtIHRpbWVzdGFtcFxuICBpZiAoZGlmZiA8IDApIHJldHVybiAnXHU1MjFBXHU1MjFBJ1xuXG4gIGNvbnN0IHNlYyA9IE1hdGguZmxvb3IoZGlmZiAvIDEwMDApXG4gIGlmIChzZWMgPCA2MCkgcmV0dXJuICdcdTUyMUFcdTUyMUEnXG5cbiAgY29uc3QgbWluID0gTWF0aC5mbG9vcihzZWMgLyA2MClcbiAgaWYgKG1pbiA8IDYwKSByZXR1cm4gYCR7bWlufVx1NTIwNlx1OTQ5RmBcblxuICBjb25zdCBob3VycyA9IE1hdGguZmxvb3IobWluIC8gNjApXG4gIGlmIChob3VycyA8IDI0KSByZXR1cm4gYCR7aG91cnN9XHU1QzBGXHU2NUY2YFxuXG4gIGNvbnN0IGRheXMgPSBNYXRoLmZsb29yKGhvdXJzIC8gMjQpXG4gIGlmIChkYXlzID09PSAxKSByZXR1cm4gJ1x1NjYyOFx1NTkyOSdcbiAgaWYgKGRheXMgPCAzMCkgcmV0dXJuIGAke2RheXN9XHU1OTI5XHU1MjREYFxuXG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApXG4gIHJldHVybiBgJHtkLmdldE1vbnRoKCkgKyAxfS8ke2QuZ2V0RGF0ZSgpfWBcbn1cbiIsICJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBjb25zdCBDaGV2cm9uUmlnaHRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IGNsYXNzTmFtZT86IHN0cmluZzsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNNiAzLjVMMTAuNSA4TDYgMTIuNVwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRm9sZGVySWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBjb2xvcj86IHN0cmluZzsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE1LFxuICBjb2xvcixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXt7IGNvbG9yOiBjb2xvciB8fCAnY3VycmVudENvbG9yJywgLi4uc3R5bGUgfX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTIgNC4yNUMyIDMuNTU5NjQgMi41NTk2NCAzIDMuMjUgM0g2LjA4NTc5QzYuNDE3MzIgMyA2LjczNTI4IDMuMTMxNyA2Ljk2OTY3IDMuMzY2MTJMOC4xMzM4OCA0LjUzMDMzQzguMzY4MjcgNC43NjQ3NSA4LjY4NjIzIDQuODk2NDUgOS4wMTc3NyA0Ljg5NjQ1SDEyLjc1QzEzLjQ0MDQgNC44OTY0NSAxNCA1LjQ1NjA5IDE0IDYuMTQ2NDVWMTEuNzVDMTQgMTIuNDQwNCAxMy40NDA0IDEzIDEyLjc1IDEzSDMuMjVDMi41NTk2NCAxMyAyIDEyLjQ0MDQgMiAxMS43NVY0LjI1WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjI1XCJcbiAgICAgIGZpbGw9e2NvbG9yID8gYCR7Y29sb3J9MjJgIDogJ2N1cnJlbnRDb2xvcid9XG4gICAgICBmaWxsT3BhY2l0eT17Y29sb3IgPyAwLjIgOiAwLjF9XG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IENoYXRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTMgNEMzIDMuNDQ3NzIgMy40NDc3MiAzIDQgM0gxMkMxMi41NTIzIDMgMTMgMy40NDc3MiAxMyA0VjEwQzEzIDEwLjU1MjMgMTIuNTUyMyAxMSAxMiAxMUg1LjVMMyAxMy41VjRaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgUGx1c0ljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNOCAzLjVWMTIuNU0zLjUgOEgxMi41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCI3XCIgY3k9XCI3XCIgcj1cIjQuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4zXCIgLz5cbiAgICA8cGF0aCBkPVwiTTEwLjUgMTAuNUwxMy41IDEzLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuM1wiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRWxsaXBzaXNJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxNCxcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCIzLjVcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjhcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjEyLjVcIiBjeT1cIjhcIiByPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgRWRpdEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMTEuNSAyLjVMMTMuNSA0LjVMNSAxM0gzVjExTDExLjUgMi41WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjNcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgVHJhc2hJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTMuNSA0LjVIMTIuNU02IDQuNVYzQzYgMi40NDc3MiA2LjQ0NzcyIDIgNyAySDlDOS41NTIyOCAyIDEwIDIuNDQ3NzIgMTAgM1Y0LjVNNC41IDQuNVYxM0M0LjUgMTMuNTUyMyA0Ljk0NzcyIDE0IDUuNSAxNEgxMC41QzExLjA1MjMgMTQgMTEuNSAxMy41NTIzIDExLjUgMTNWNC41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuM1wiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBGb3JrSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8Y2lyY2xlIGN4PVwiNC41XCIgY3k9XCIxMS41XCIgcj1cIjEuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiNC41XCIgY3k9XCI0LjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxjaXJjbGUgY3g9XCIxMS41XCIgY3k9XCI0LjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxwYXRoIGQ9XCJNNC41IDZWMTBNMTEuNSA2VjcuNUMxMS41IDguNiAxMC42IDkuNSA5LjUgOS41SDQuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4yXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBNb3ZlVG9Gb2xkZXJJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTIgNC4yNUMyIDMuNTU5NjQgMi41NTk2NCAzIDMuMjUgM0g2LjA4NTc5QzYuNDE3MzIgMyA2LjczNTI4IDMuMTMxNyA2Ljk2OTY3IDMuMzY2MTJMOC4xMzM4OCA0LjUzMDMzQzguMzY4MjcgNC43NjQ3NSA4LjY4NjIzIDQuODk2NDUgOS4wMTc3NyA0Ljg5NjQ1SDEyLjc1QzEzLjQ0MDQgNC44OTY0NSAxNCA1LjQ1NjA5IDE0IDYuMTQ2NDVWMTEuNzVDMTQgMTIuNDQwNCAxMy40NDA0IDEzIDEyLjc1IDEzSDMuMjVDMi41NTk2NCAxMyAyIDEyLjQ0MDQgMiAxMS43NVY0LjI1WlwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjJcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDguNUgxME04IDYuNUwxMCA4LjVMOCAxMC41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMlwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBNb3ZlT3V0SWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDMuNUgzLjVWMTIuNUgxMi41VjEwTTguNSAyLjVIMTMuNVY3LjVNNyA5TDEzIDNcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4zXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEFkZEZvbGRlckljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVY4LjVNMiA0LjI1VjExLjc1QzIgMTIuNDQwNCAyLjU1OTY0IDEzIDMuMjUgMTNIOE0xMS41IDEwLjVWMTQuNU05LjUgMTIuNUgxMy41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgUGluSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBwaW5uZWQ/OiBib29sZWFuOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTMsXG4gIHBpbm5lZCA9IGZhbHNlLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNOS41IDNMMTMgNi41TTYgNi41TDMuNSA5TDQgMTJMMiAxNEw0IDEyTDcgMTIuNUw5LjUgMTBNNiA2LjVMOS41IDNNNiA2LjVMOS41IDEwXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgZmlsbD17cGlubmVkID8gJ2N1cnJlbnRDb2xvcicgOiAnbm9uZSd9XG4gICAgLz5cbiAgPC9zdmc+XG4pXG4iLCAiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG4vKipcbiAqIEFuaW1hdGVkIFB1bHNlIEluZGljYXRvciBmb3IgcnVubmluZy9zdHJlYW1pbmcgc2Vzc2lvbnMgbWF0Y2hpbmcgRFNIIGRlc2lnbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFJ1bm5pbmdEb3Q6IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHsgc2l6ZSA9IDE0LCBzdHlsZSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPHNwYW5cbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIHdpZHRoOiBgJHtzaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgIC4uLnN0eWxlLFxuICAgICAgfX1cbiAgICAgIHRpdGxlPVwiXHU2QjYzXHU1NzI4XHU1QkY5XHU4QkREXHU0RTBFXHU3NTFGXHU2MjEwXHU0RTJELi4uXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuNCknLFxuICAgICAgICAgIGFuaW1hdGlvbjogJ2RzaC1wdWxzZSAxLjVzIGN1YmljLWJlemllcigwLjI0LCAwLCAwLjM4LCAxKSBpbmZpbml0ZScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjNjBhNWZhKScsXG4gICAgICAgICAgYm94U2hhZG93OiAnMCAwIDZweCByZ2JhKDk2LCAxNjUsIDI1MCwgMC44KScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHN0eWxlPntgXG4gICAgICAgIEBrZXlmcmFtZXMgZHNoLXB1bHNlIHtcbiAgICAgICAgICAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgICAgNTAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjYpOyBvcGFjaXR5OiAwOyB9XG4gICAgICAgICAgMTAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMDsgfVxuICAgICAgICB9XG4gICAgICBgfTwvc3R5bGU+XG4gICAgPC9zcGFuPlxuICApXG59XG5cbi8qKlxuICogQW1iZXIgRG90IGZvciBzZXNzaW9ucyB3YWl0aW5nIG9uIHVzZXIgaW50ZXJhY3Rpb24gKHF1ZXN0aW9ucy9hcHByb3ZhbHMpLlxuICovXG5leHBvcnQgY29uc3QgUGVuZGluZ0RvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTdCNDlcdTVGODVcdTRFQTRcdTRFOTIgKFx1NUJBMVx1NjI3OS9cdTc4NkVcdThCQTQpXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAnI2ZiYmYyNCcsXG4gICAgICAgICAgYm94U2hhZG93OiAnMCAwIDZweCByZ2JhKDI1MSwgMTkxLCAzNiwgMC42KScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgIDwvc3Bhbj5cbiAgKVxufVxuXG4vKipcbiAqIEdyZWVuIERvdCBmb3IgY29tcGxldGVkL3VucmVhZCBzZXNzaW9ucyAoZmluaXNoZWQgaW4gYmFja2dyb3VuZCwgd2FpdGluZyB0byBiZSByZWFkKS5cbiAqL1xuZXhwb3J0IGNvbnN0IENvbXBsZXRlZERvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTVERjJcdTYyNjdcdTg4NENcdTVCOENcdTZCRDUgKFx1NjcyQVx1OEJGQilcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4yNSknLFxuICAgICAgICAgIGFuaW1hdGlvbjogJ2RzaC1jb21wbGV0ZWQtcHVsc2UgMi4ycyBjdWJpYy1iZXppZXIoMC4yNCwgMCwgMC4zOCwgMSkgaW5maW5pdGUnLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjQ4fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjQ4fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICcjNGFkZTgwJyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoNzQsIDIyMiwgMTI4LCAwLjgpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3R5bGU+e2BcbiAgICAgICAgQGtleWZyYW1lcyBkc2gtY29tcGxldGVkLXB1bHNlIHtcbiAgICAgICAgICAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgICAgNTAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjUpOyBvcGFjaXR5OiAwLjE1OyB9XG4gICAgICAgICAgMTAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgIH1cbiAgICAgIGB9PC9zdHlsZT5cbiAgICA8L3NwYW4+XG4gIClcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0FBLG1CQUFrRjs7O0FDTTNFLElBQU0sZUFBZTtBQUU1QixlQUFzQixjQUFjLGVBQTBEO0FBQzVGLE1BQUk7QUFDRixVQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsWUFB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WUFBWSxNQUFNLElBQUksWUFBWSxtQkFBbUIsV0FBVztBQUN0RSxvQkFBSSxXQUFXO0FBQ2Isd0JBQU0sZ0JBQWdCLG1CQUFtQixRQUFRLFVBQVUsU0FBOEI7QUFDekYsc0JBQUksVUFBVSxPQUFPLFNBQVM7QUFBQSxnQkFDaEM7QUFBQSxjQUNGLFNBQVMsS0FBSztBQUNaLHdCQUFRLE1BQU0scURBQXFELEdBQUc7QUFBQSxjQUN4RTtBQUFBLFlBQ0Y7QUFBQSxZQUNBLE1BQU0sQ0FBQyxjQUF5QixJQUFJLFVBQVUsT0FBTyxTQUFTO0FBQUEsWUFDOUQsaUJBQWlCLE9BQU8sYUFBMEIsVUFBa0I7QUFDbEUsb0JBQU0sSUFBSSxZQUFZLFNBQVMsYUFBYSxLQUFLO0FBQUEsWUFDbkQ7QUFBQSxZQUNBLGlCQUFpQixPQUFPLGdCQUE2QjtBQUNuRCxvQkFBTSxJQUFJLFlBQVksU0FBUyxXQUFXO0FBQUEsWUFDNUM7QUFBQSxZQUNBLGlCQUFpQixDQUFDLFVBQTRCLElBQUksWUFBWSxTQUFTLEtBQUs7QUFBQSxZQUM1RSxlQUFlLE1BQU0sSUFBSSxZQUFZLGdCQUFnQjtBQUFBLFlBQ3JELGVBQWUsT0FBTyxXQUFzQixVQUFrQjtBQUM1RCxvQkFBTSxVQUFVLElBQUksVUFBVSxVQUFVLFNBQVMsR0FBRztBQUNwRCxrQkFBSSxTQUFTO0FBQ1gsc0JBQU0sUUFBUSxPQUFPLEtBQUs7QUFBQSxjQUM1QjtBQUFBLFlBQ0Y7QUFBQSxZQUNBLGdCQUFnQixPQUFPLGNBQXlCO0FBQzlDLG9CQUFNLElBQUksWUFBWSxpQkFBaUIsU0FBUztBQUFBLFlBQ2xEO0FBQUEsWUFDQSxhQUFhLENBQUMsY0FBeUI7QUFDckMsa0JBQUksVUFBVSxPQUFPLEVBQUUsV0FBVyxlQUFlLEtBQUssQ0FBQyxFQUNwRCxLQUFLLENBQUMsWUFBWTtBQUFFLG9CQUFJLFVBQVUsT0FBTyxPQUFPO0FBQUEsY0FBRSxDQUFDLEVBQ25ELE1BQU0sTUFBTTtBQUFBLGNBQUMsQ0FBQztBQUFBLFlBQ25CO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsU0FBUyxLQUFLO0FBQ1osWUFBUSxNQUFNLCtDQUErQyxHQUFHO0FBQUEsRUFDbEU7QUFDRjsiLAogICJuYW1lcyI6IFsibmFtZSIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiaW1wb3J0X2pzeF9ydW50aW1lIl0KfQo=

return module.exports;
} });
