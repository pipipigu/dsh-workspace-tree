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
  const [isAddModalOpen, setIsAddModalOpen] = (0, import_react.useState)(false);
  const [newWorkspacePath, setNewWorkspacePath] = (0, import_react.useState)("");
  const [isSubmittingWs, setIsSubmittingWs] = (0, import_react.useState)(false);
  const [addWsError, setAddWsError] = (0, import_react.useState)(null);
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
  const [flowOpen, setFlowOpen] = (0, import_react.useState)(false);
  const [pickingFolder, setPickingFolder] = (0, import_react.useState)(false);
  const flowOwner = {
    open: flowOpen,
    busy: pickingFolder,
    onPicked: async (path) => {
      setPickingFolder(true);
      try {
        const res = await props.createWorkspace?.({ path });
        if (res) {
          const wsId = res.workspaceId || res.id;
          if (wsId) {
            setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, wsId]));
            props.startSession?.(wsId);
          }
          globalTreeStore.loadWorkspace(path);
        }
      } catch (err) {
        console.error("[dsh-workspace-tree] Create workspace from flow failed:", err);
      } finally {
        setPickingFolder(false);
        setFlowOpen(false);
        setIsAddModalOpen(false);
      }
    },
    onCancel: () => {
      setFlowOpen(false);
    },
    onError: (msg) => {
      console.warn("[dsh-workspace-tree] Directory flow error:", msg);
      setFlowOpen(false);
    }
  };
  const handleOpenAddWorkspace = () => {
    setAddWsError(null);
    setNewWorkspacePath("");
    setIsAddModalOpen(true);
    setShowSearch(false);
  };
  const handlePickFromOS = async () => {
    setFlowOpen(true);
    if (props.pickDirectory) {
      try {
        const picked = await props.pickDirectory();
        if (picked) {
          await flowOwner.onPicked(picked);
        }
      } catch (err) {
        console.warn("[dsh-workspace-tree] pickDirectory failed:", err);
      }
    }
  };
  const handleConfirmAddWorkspace = async (customPath) => {
    const targetPath = (customPath || newWorkspacePath).trim();
    if (!targetPath) {
      setAddWsError("\u8BF7\u8F93\u5165\u5DE5\u4F5C\u533A\u76EE\u5F55\u7684\u7EDD\u5BF9\u8DEF\u5F84");
      return;
    }
    setIsSubmittingWs(true);
    setAddWsError(null);
    try {
      const res = await props.createWorkspace?.({ path: targetPath });
      if (res) {
        const wsId = res.workspaceId || res.id;
        if (wsId) {
          setExpandedWorkspaces((prev) => /* @__PURE__ */ new Set([...prev, wsId]));
          props.startSession?.(wsId);
        }
        globalTreeStore.loadWorkspace(targetPath);
        setIsAddModalOpen(false);
        setNewWorkspacePath("");
      }
    } catch (err) {
      console.error("[dsh-workspace-tree] Create workspace failed:", err);
      setAddWsError(err?.message || "\u521B\u5EFA\u5DE5\u4F5C\u533A\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u76EE\u5F55\u8DEF\u5F84\u662F\u5426\u5B58\u5728\u4E14\u6709\u6548");
    } finally {
      setIsSubmittingWs(false);
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
              setIsAddModalOpen(false);
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SearchIcon, { size: 14 })
          }
        )
      ] })
    ] }),
    isAddModalOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)"
        },
        onClick: () => setIsAddModalOpen(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            style: {
              width: "420px",
              maxWidth: "92vw",
              borderRadius: "10px",
              background: "#151b28",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.8)",
              padding: "18px 20px",
              color: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { size: 18, color: "#60a5fa" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "14px", fontWeight: 600 }, children: "\u6DFB\u52A0 / \u65B0\u5EFA\u5DE5\u4F5C\u533A" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    style: { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px", display: "inline-flex" },
                    onClick: () => setIsAddModalOpen(false),
                    children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CloseIcon, { size: 14 })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { style: { fontSize: "12px", color: "#94a3b8" }, children: "\u76EE\u5F55\u7EDD\u5BF9\u8DEF\u5F84 (Directory Path):" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    autoFocus: true,
                    style: {
                      ...DSH_INPUT_STYLE,
                      width: "100%",
                      height: "34px",
                      padding: "0 10px",
                      borderRadius: "6px",
                      fontSize: "13px"
                    },
                    placeholder: "/home/ppz/project/my-workspace",
                    value: newWorkspacePath,
                    onChange: (e) => setNewWorkspacePath(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") handleConfirmAddWorkspace();
                      if (e.key === "Escape") setIsAddModalOpen(false);
                    }
                  }
                ),
                addWsError && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "11px", color: "#f87171" }, children: addWsError })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "11px", color: "#64748b" }, children: "\u5FEB\u901F\u586B\u5165\u53C2\u8003\u76EE\u5F55:" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" }, children: ["/home/ppz/project", "/home/ppz/project/dsh", "/home/ppz"].map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    style: {
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#cbd5e1",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    },
                    onMouseEnter: (e) => e.currentTarget.style.background = "rgba(96, 165, 250, 0.15)",
                    onMouseLeave: (e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)",
                    onClick: () => setNewWorkspacePath(p),
                    children: p
                  },
                  p
                )) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    style: {
                      background: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#94a3b8",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer"
                    },
                    onClick: handlePickFromOS,
                    children: "\u{1F4C2} \u6D4F\u89C8\u7CFB\u7EDF\u76EE\u5F55..."
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "button",
                    {
                      style: {
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer"
                      },
                      onClick: () => setIsAddModalOpen(false),
                      children: "\u53D6\u6D88"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "button",
                    {
                      disabled: isSubmittingWs,
                      style: {
                        background: "#2563eb",
                        border: "none",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isSubmittingWs ? "not-allowed" : "pointer",
                        opacity: isSubmittingWs ? 0.6 : 1
                      },
                      onClick: () => handleConfirmAddWorkspace(),
                      children: isSubmittingWs ? "\u6B63\u5728\u521B\u5EFA..." : "\u521B\u5EFA\u5E76\u8FDB\u5165"
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      }
    ),
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
    }) }),
    props.renderSlot?.("sidebar.workspaces.directoryFlow", flowOwner)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC9pbmRleC50c3giLCAic3JjL2NsaWVudC9FbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXIudHN4IiwgInNyYy9jbGllbnQvYXBpLnRzIiwgInNyYy9jbGllbnQvdHJlZS1zdG9yZS50cyIsICJzcmMvY2xpZW50L3RpbWUudHMiLCAic3JjL2NsaWVudC9jb21wb25lbnRzL0ljb25zLnRzeCIsICJzcmMvY2xpZW50L2NvbXBvbmVudHMvU3RhdGVJbmRpY2F0b3IudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIGRzaC13b3Jrc3BhY2UtdHJlZSBicm93c2VyIGNsaWVudCBlbnRyeS5cbiAqXG4gKiBEaXJlY3QgdGFrZW92ZXIgb2YgYHNpZGViYXIud29ya3NwYWNlc2Agd2l0aCBwcmlvcml0eTogLTEwLlxuICogSW5qZWN0cyB2aXJ0dWFsIGZvbGRlcnMsIGRyYWcgJiBkcm9wIGdyb3VwaW5nLCBhbmQgbmVzdGVkIHN1YnByb2plY3RzIGRpcmVjdGx5XG4gKiBpbnNpZGUgdGhlIG5hdGl2ZSB3b3Jrc3BhY2UgbGlzdCByb3dzLCB3aXRoIHplcm8gRE9NIHBvbGx1dGlvbi5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQsIFNlc3Npb25JZCwgV29ya3NwYWNlSWQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCdcbmltcG9ydCB7IEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlciB9IGZyb20gJy4vRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLnRzeCdcbmltcG9ydCB7IGdsb2JhbFRyZWVTdG9yZSB9IGZyb20gJy4vdHJlZS1zdG9yZS50cydcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAnQGRzaC1leHRlcm5hbC9kc2gtd29ya3NwYWNlLXRyZWUvY2xpZW50J1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnd29ya3NwYWNlcyddXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICA7KGN0eC5zbG90cy5pbmplY3QgYXMgYW55KSgnc2lkZWJhci53b3Jrc3BhY2VzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIChjdHguc2xvdHMucmVnaXN0ZXIgYXMgYW55KShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzaWRlYmFyLndvcmtzcGFjZXMnLFxuICAgICAgICAgIHByaW9yaXR5OiAtMTAsIC8vIGludGVudGlvbmFsIHNoYWRvdyBvdmVyIHN0b2NrIHdvcmtzcGFjZSBicm93c2VyIChsb3dlc3QgcmVuZGVycylcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBzdGFydFNlc3Npb246ICh3b3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkKSA9PiBjdHgud29ya3NwYWNlcz8uc3RhcnRTZXNzaW9uPy4od29ya3NwYWNlSWQpLFxuICAgICAgICAgICAgc3RhcnRTZXNzaW9uSW5Gb2xkZXI6IGFzeW5jICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5jb25uZWN0V29ya3NwYWNlPy4od29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLmFkZFNlc3Npb25Ub0ZvbGRlcih3c1BhdGgsIGZvbGRlcklkLCBzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBzdGFydFNlc3Npb25JbkZvbGRlciBmYWlsZWQ6JywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBjdHguc2Vzc2lvbnM/Lm9wZW4/LihzZXNzaW9uSWQpLFxuICAgICAgICAgICAgcmVuYW1lV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5yZW5hbWU/Lih3b3Jrc3BhY2VJZCwgdGl0bGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlV29ya3NwYWNlOiBhc3luYyAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IGN0eC53b3Jrc3BhY2VzPy5kZWxldGU/Lih3b3Jrc3BhY2VJZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVXb3Jrc3BhY2U6IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gY3R4LndvcmtzcGFjZXM/LmNyZWF0ZT8uKGlucHV0KSxcbiAgICAgICAgICAgIHBpY2tEaXJlY3Rvcnk6ICgpID0+IGN0eC53b3Jrc3BhY2VzPy5waWNrRGlyZWN0b3J5Py4oKSxcbiAgICAgICAgICAgIHJlbmFtZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCwgdGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gY3R4LnNlc3Npb25zPy5iaW5kaW5nPy4oc2Vzc2lvbklkKT8uc2Vzc2lvblxuICAgICAgICAgICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlc3Npb24ucmVuYW1lKHRpdGxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXJjaGl2ZVNlc3Npb246IGFzeW5jIChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCBjdHgud29ya3NwYWNlcz8uYXJjaGl2ZVNlc3Npb24/LihzZXNzaW9uSWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ya1Nlc3Npb246IChzZXNzaW9uSWQ6IFNlc3Npb25JZCkgPT4ge1xuICAgICAgICAgICAgICBjdHguc2Vzc2lvbnM/LmZvcms/Lih7IHNlc3Npb25JZCwgaW5jcmVhc2VUaXRsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChjaGlsZElkKSA9PiB7IGN0eC5zZXNzaW9ucz8ub3Blbj8uKGNoaWxkSWQpIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgRW5oYW5jZWRXb3Jrc3BhY2VCcm93c2VyLFxuICAgICAgKVxuICAgIH0pXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIFNsb3QgaW5qZWN0aW9uIGZhaWxlZDonLCBlcnIpXG4gIH1cbn1cbiIsICJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCB1c2VTeW5jRXh0ZXJuYWxTdG9yZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uSWQsIFdvcmtzcGFjZUlkLCBXb3Jrc3BhY2VWaWV3IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnXG5pbXBvcnQgeyBnbG9iYWxUcmVlU3RvcmUgfSBmcm9tICcuL3RyZWUtc3RvcmUudHMnXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFN1YnByb2plY3RJbmZvIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJ1xuaW1wb3J0IHsgZm9ybWF0UmVsYXRpdmVUaW1lIH0gZnJvbSAnLi90aW1lLnRzJ1xuaW1wb3J0IHtcbiAgQWRkRm9sZGVySWNvbixcbiAgQ2hhdEljb24sXG4gIENoZXZyb25SaWdodEljb24sXG4gIENsb3NlSWNvbixcbiAgRWRpdEljb24sXG4gIEVsbGlwc2lzSWNvbixcbiAgRm9sZGVySWNvbixcbiAgRm9ya0ljb24sXG4gIE1vdmVPdXRJY29uLFxuICBNb3ZlVG9Gb2xkZXJJY29uLFxuICBQaW5JY29uLFxuICBQbHVzSWNvbixcbiAgU2VhcmNoSWNvbixcbiAgVHJhc2hJY29uLFxufSBmcm9tICcuL2NvbXBvbmVudHMvSWNvbnMudHN4J1xuaW1wb3J0IHsgQ29tcGxldGVkRG90LCBQZW5kaW5nRG90LCBSdW5uaW5nRG90IH0gZnJvbSAnLi9jb21wb25lbnRzL1N0YXRlSW5kaWNhdG9yLnRzeCdcblxuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXJQcm9wcyB7XG4gIHVzZVdvcmtzcGFjZXM/OiAoc2VsZWN0b3I6IChzOiBhbnkpID0+IGFueSkgPT4gYW55XG4gIHVzZVNlc3Npb25zPzogKHNlbGVjdG9yOiAoczogYW55KSA9PiBhbnkpID0+IGFueVxuICByZW5kZXJTbG90PzogKHNsb3ROYW1lOiBzdHJpbmcsIG93bmVyPzogYW55KSA9PiBSZWFjdC5SZWFjdE5vZGVcbiAgdXNlRGlyZWN0b3J5Rmxvdz86IChzZWxlY3RvcjogKG9jY3VwaWVkOiBib29sZWFuKSA9PiBhbnkpID0+IGFueVxuICBzdGFydFNlc3Npb24/OiAod29ya3NwYWNlSWQ/OiBXb3Jrc3BhY2VJZCkgPT4gdm9pZFxuICBzdGFydFNlc3Npb25JbkZvbGRlcj86ICh3b3Jrc3BhY2VJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIG9wZW4/OiAoc2Vzc2lvbklkOiBTZXNzaW9uSWQpID0+IHZvaWRcbiAgcmVuYW1lV29ya3NwYWNlPzogKHdvcmtzcGFjZUlkOiBXb3Jrc3BhY2VJZCwgdGl0bGU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxuICBkZWxldGVXb3Jrc3BhY2U/OiAod29ya3NwYWNlSWQ6IFdvcmtzcGFjZUlkKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGNyZWF0ZVdvcmtzcGFjZT86IChpbnB1dDogeyBwYXRoOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTxXb3Jrc3BhY2VWaWV3PlxuICBwaWNrRGlyZWN0b3J5PzogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPlxuICByZW5hbWVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkLCB0aXRsZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGFyY2hpdmVTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiBQcm9taXNlPHZvaWQ+XG4gIGZvcmtTZXNzaW9uPzogKHNlc3Npb25JZDogU2Vzc2lvbklkKSA9PiB2b2lkXG59XG5cbmNvbnN0IERFRkFVTFRfVklTSUJMRV9MSU1JVCA9IDEwXG5jb25zdCBQUkVTRVRfQ09MT1JTID0gWycjNjBhNWZhJywgJyM0YWRlODAnLCAnI2ZiYmYyNCcsICcjZjg3MTcxJywgJyNjMDg0ZmMnLCAnIzM4YmRmOCddXG5cbi8qKiBDaGVjayBpZiBhIHNlc3Npb24gaXMganVzdCBhbiBlbXB0eSBwbGFjZWhvbGRlciBsaWtlIFwic2Vzc2lvbi1jZjZmZTE2OFwiICovXG5mdW5jdGlvbiBpc0JsYW5rUGxhY2Vob2xkZXIoaWQ6IHN0cmluZywgdGl0bGU/OiBzdHJpbmcsIGlzQmxhbmsgPSBmYWxzZSwgaXNBY3RpdmUgPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBpZiAoaXNBY3RpdmUpIHJldHVybiBmYWxzZVxuICBpZiAoaXNCbGFuaykgcmV0dXJuIHRydWVcbiAgaWYgKCF0aXRsZSkgcmV0dXJuIHRydWVcbiAgaWYgKHRpdGxlID09PSBpZCkgcmV0dXJuIHRydWVcbiAgaWYgKC9ec2Vzc2lvbi1bYS16MC05LV0rJC9pLnRlc3QodGl0bGUpKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgRFNIX0lOUFVUX1NUWUxFOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0ge1xuICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgcGFkZGluZzogJzFweCA2cHgnLFxuICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICBib3JkZXI6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KScsXG4gIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyxcbiAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2Y4ZmFmYyknLFxuICBmb250U2l6ZTogJzEzcHgnLFxuICBsaW5lSGVpZ2h0OiAnMjBweCcsXG4gIG91dGxpbmU6ICdub25lJyxcbiAgZm9udEZhbWlseTogJ2luaGVyaXQnLFxufVxuXG5pbnRlcmZhY2UgQmFubmVyVGFzayB7XG4gIHNlc3Npb25JZDogc3RyaW5nXG4gIHRpdGxlOiBzdHJpbmdcbiAgc3RhdHVzOiAncnVubmluZycgfCAncGVuZGluZycgfCAnY29tcGxldGVkJ1xuICB3cz86IFdvcmtzcGFjZVZpZXdcbn1cblxuY29uc3QgVEFTS19TVFlMRV9DT05GSUcgPSB7XG4gIHJ1bm5pbmc6IHtcbiAgICBiZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMjIpJyxcbiAgICBob3ZlckJnOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjQ1KScsXG4gICAgdGFnVGV4dDogJ1x1OEZEQlx1ODg0Q1x1NEUyRCcsXG4gICAgdGFnQ29sb3I6ICcjNjBhNWZhJyxcbiAgICB0YWdCZzogJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTZCNjNcdTU3MjhcdThGREJcdTg4NEMnLFxuICB9LFxuICBwZW5kaW5nOiB7XG4gICAgYmc6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC4wOCknLFxuICAgIGJvcmRlcjogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjI1KScsXG4gICAgaG92ZXJCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE2KScsXG4gICAgaG92ZXJCb3JkZXI6ICdyZ2JhKDI1MSwgMTkxLCAzNiwgMC41KScsXG4gICAgdGFnVGV4dDogJ1x1NUY4NVx1Nzg2RVx1OEJBNCcsXG4gICAgdGFnQ29sb3I6ICcjZmJiZjI0JyxcbiAgICB0YWdCZzogJ3JnYmEoMjUxLCAxOTEsIDM2LCAwLjE0KScsXG4gICAgdGl0bGVQcmVmaXg6ICdcdTdCNDlcdTVGODVcdTc4NkVcdThCQTQnLFxuICB9LFxuICBjb21wbGV0ZWQ6IHtcbiAgICBiZzogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjA4KScsXG4gICAgYm9yZGVyOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMjUpJyxcbiAgICBob3ZlckJnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTYpJyxcbiAgICBob3ZlckJvcmRlcjogJ3JnYmEoNzQsIDIyMiwgMTI4LCAwLjUpJyxcbiAgICB0YWdUZXh0OiAnXHU1Rjg1XHU4QkZCJyxcbiAgICB0YWdDb2xvcjogJyM0YWRlODAnLFxuICAgIHRhZ0JnOiAncmdiYSg3NCwgMjIyLCAxMjgsIDAuMTQpJyxcbiAgICB0aXRsZVByZWZpeDogJ1x1NURGMlx1NjI2N1x1ODg0Q1x1NUI4Q1x1NkJENVx1NUY4NVx1OTYwNVx1OEJGQicsXG4gIH0sXG59XG5cbmV4cG9ydCBjb25zdCBFbmhhbmNlZFdvcmtzcGFjZUJyb3dzZXI6IFJlYWN0LkZDPEVuaGFuY2VkV29ya3NwYWNlQnJvd3NlclByb3BzPiA9IChwcm9wcykgPT4ge1xuICAvLyBTdWJzY3JpYmUgdG8gVHJlZVN0b3JlIGNoYW5nZXMgd2l0aCByZWFjdGl2ZSB2ZXJzaW9uIGNvdW50ZXIgKGd1YXJhbnRlZXMgaW5zdGFudCAwbXMgcmUtcmVuZGVycylcbiAgdXNlU3luY0V4dGVybmFsU3RvcmUoXG4gICAgKGNiKSA9PiBnbG9iYWxUcmVlU3RvcmUuc3Vic2NyaWJlKGNiKSxcbiAgICAoKSA9PiBnbG9iYWxUcmVlU3RvcmUuZ2V0VmVyc2lvbigpLFxuICApXG5cbiAgbGV0IHdvcmtzcGFjZXNTdGF0ZToge1xuICAgIGl0ZW1zPzogcmVhZG9ubHkgV29ya3NwYWNlVmlld1tdXG4gICAgYXJjaGl2ZWRTZXNzaW9uSWRzPzogcmVhZG9ubHkgU2Vzc2lvbklkW11cbiAgICByZWNlbnRXb3Jrc3BhY2VJZD86IFdvcmtzcGFjZUlkXG4gIH0gPSB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvcHMudXNlV29ya3NwYWNlcykge1xuICAgICAgd29ya3NwYWNlc1N0YXRlID0gcHJvcHMudXNlV29ya3NwYWNlcygoczogYW55KSA9PiBzKSB8fCB7IGl0ZW1zOiBbXSwgYXJjaGl2ZWRTZXNzaW9uSWRzOiBbXSB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmVcbiAgfVxuXG4gIGNvbnN0IFtleHBhbmRlZFdvcmtzcGFjZXMsIHNldEV4cGFuZGVkV29ya3NwYWNlc10gPSB1c2VTdGF0ZTxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKVxuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbc2hvd1NlYXJjaCwgc2V0U2hvd1NlYXJjaF0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2lzQWRkTW9kYWxPcGVuLCBzZXRJc0FkZE1vZGFsT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW25ld1dvcmtzcGFjZVBhdGgsIHNldE5ld1dvcmtzcGFjZVBhdGhdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtpc1N1Ym1pdHRpbmdXcywgc2V0SXNTdWJtaXR0aW5nV3NdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFthZGRXc0Vycm9yLCBzZXRBZGRXc0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFthY3RpdmVNZW51V3NJZCwgc2V0QWN0aXZlTWVudVdzSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2VkaXRpbmdXc0lkLCBzZXRFZGl0aW5nV3NJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZWRpdFdzVGl0bGUsIHNldEVkaXRXc1RpdGxlXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbaXNDcmVhdGluZ0ZvbGRlcldzSWQsIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtuZXdGb2xkZXJOYW1lLCBzZXROZXdGb2xkZXJOYW1lXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbZWRpdGluZ0ZvbGRlcklkLCBzZXRFZGl0aW5nRm9sZGVySWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2VkaXRGb2xkZXJOYW1lLCBzZXRFZGl0Rm9sZGVyTmFtZV0gPSB1c2VTdGF0ZSgnJylcblxuICAvLyBMb2NhbCB1bnJlYWQgY29tcGxldGlvbiB0cmFja2VyIChyZWFjdGl2ZSB0byBydW5uaW5nIHRydWUtPmZhbHNlIGVkZ2Ugd2hlbiBub3QgYWN0aXZlKVxuICBjb25zdCBbbG9jYWxVbnJlYWRTZXQsIHNldExvY2FsVW5yZWFkU2V0XSA9IHVzZVN0YXRlPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpXG4gIGNvbnN0IHByZXZSdW5uaW5nTWFwID0gdXNlUmVmPE1hcDxzdHJpbmcsIGJvb2xlYW4+PihuZXcgTWFwKCkpXG5cbiAgLy8gU2Vzc2lvbiByZW5hbWUgc3RhdGVcbiAgY29uc3QgW2VkaXRpbmdTZXNzaW9uSWQsIHNldEVkaXRpbmdTZXNzaW9uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2VkaXRTZXNzaW9uVGl0bGUsIHNldEVkaXRTZXNzaW9uVGl0bGVdID0gdXNlU3RhdGUoJycpXG4gIFxuICAvLyBTZXNzaW9uIG1vdmUtdG8tZm9sZGVyIGRyb3Bkb3duIG1lbnUgc3RhdGVcbiAgY29uc3QgW2FjdGl2ZU1vdmVNZW51U2Vzc2lvbklkLCBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBcbiAgY29uc3QgW3Nob3dBbGxTZXNzaW9uc01hcCwgc2V0U2hvd0FsbFNlc3Npb25zTWFwXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+Pih7fSlcblxuICBjb25zdCBtZW51UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlR2xvYmFsQ2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgaWYgKG1lbnVSZWYuY3VycmVudCAmJiAhbWVudVJlZi5jdXJyZW50LmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICB9XG4gICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudFxuICAgICAgaWYgKCF0YXJnZXQuY2xvc2VzdCgnLm1vdmUtbWVudS1jb250YWluZXInKSAmJiAhdGFyZ2V0LmNsb3Nlc3QoJy5tb3ZlLW1lbnUtYnRuJykpIHtcbiAgICAgICAgc2V0QWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQobnVsbClcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdXc0lkKG51bGwpXG4gICAgICAgIHNldElzQ3JlYXRpbmdGb2xkZXJXc0lkKG51bGwpXG4gICAgICAgIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKG51bGwpXG4gICAgICB9XG4gICAgfVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUdsb2JhbENsaWNrKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlR2xvYmFsQ2xpY2spXG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24pXG4gICAgfVxuICB9LCBbXSlcblxuICBsZXQgc2Vzc2lvbnNTdGF0ZToge1xuICAgIGlkcz86IFNlc3Npb25JZFtdXG4gICAgYnlJZD86IFJlY29yZDxzdHJpbmcsIHsgc2Vzc2lvbklkOiBTZXNzaW9uSWQ7IHRpdGxlPzogc3RyaW5nOyB1cGRhdGVkQXQ/OiBudW1iZXI7IHJ1bm5pbmc/OiBib29sZWFuOyBwZW5kaW5nSW50ZXJhY3Rpb24/OiBhbnk7IGNvbXBsZXRlZD86IGJvb2xlYW47IGJsYW5rPzogYm9vbGVhbiB9PlxuICAgIGN1cnJlbnQ/OiBTZXNzaW9uSWRcbiAgfSA9IHsgaWRzOiBbXSwgYnlJZDoge30gfVxuXG4gIHRyeSB7XG4gICAgaWYgKHByb3BzLnVzZVNlc3Npb25zKSB7XG4gICAgICBzZXNzaW9uc1N0YXRlID0gcHJvcHMudXNlU2Vzc2lvbnMoKHM6IGFueSkgPT4gcykgfHwge31cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIGlnbm9yZVxuICB9XG5cbiAgY29uc3QgYWN0aXZlU2Vzc2lvbklkID0gc2Vzc2lvbnNTdGF0ZS5jdXJyZW50IGFzIHVua25vd24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gIGNvbnN0IGl0ZW1zOiByZWFkb25seSBXb3Jrc3BhY2VWaWV3W10gPSB3b3Jrc3BhY2VzU3RhdGUuaXRlbXMgfHwgW11cbiAgY29uc3QgYXJjaGl2ZWRTZXNzaW9uSWRzOiByZWFkb25seSBTZXNzaW9uSWRbXSA9IHdvcmtzcGFjZXNTdGF0ZS5hcmNoaXZlZFNlc3Npb25JZHMgfHwgW11cbiAgY29uc3QgYXJjaGl2ZWRTZXQgPSB1c2VNZW1vKCgpID0+IG5ldyBTZXQoYXJjaGl2ZWRTZXNzaW9uSWRzLm1hcChTdHJpbmcpKSwgW2FyY2hpdmVkU2Vzc2lvbklkc10pXG5cbiAgLy8gUHJlbG9hZCBhbGwgd29ya3NwYWNlIG1ldGFkYXRhIG9uY2UgaXRlbXMgYXJyaXZlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZm9yIChjb25zdCB3cyBvZiBpdGVtcykge1xuICAgICAgaWYgKHdzLnBhdGgpIHtcbiAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLmdldE1ldGFGb3JXb3Jrc3BhY2Uod3MucGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtpdGVtc10pXG5cbiAgLy8gV2F0Y2ggcnVubmluZyAtPiBjb21wbGV0ZWQgdHJhbnNpdGlvbnMgZm9yIGJhY2tncm91bmQgdW5yZWFkIHJlbWluZGVyc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGJ5SWQgPSBzZXNzaW9uc1N0YXRlLmJ5SWQgfHwge31cbiAgICBjb25zdCBuZXdVbnJlYWQgPSBuZXcgU2V0KGxvY2FsVW5yZWFkU2V0KVxuICAgIGxldCBjaGFuZ2VkID0gZmFsc2VcblxuICAgIGZvciAoY29uc3QgW2lkLCBzZXNzaW9uXSBvZiBPYmplY3QuZW50cmllcyhieUlkKSkge1xuICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhpZCkpIHtcbiAgICAgICAgaWYgKG5ld1VucmVhZC5oYXMoaWQpKSB7XG4gICAgICAgICAgbmV3VW5yZWFkLmRlbGV0ZShpZClcbiAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBjb25zdCB3YXNSdW5uaW5nID0gcHJldlJ1bm5pbmdNYXAuY3VycmVudC5nZXQoaWQpIHx8IGZhbHNlXG4gICAgICBjb25zdCBpc05vd1J1bm5pbmcgPSBCb29sZWFuKHNlc3Npb24/LnJ1bm5pbmcpXG5cbiAgICAgIC8vIFRyYW5zaXRpb246IHJ1bm5pbmcgdHJ1ZSAtPiBmYWxzZSB3aGlsZSBOT1QgYWN0aXZlIHNlc3Npb24gPT4gTWFyayBhcyBVbnJlYWRcbiAgICAgIGlmICh3YXNSdW5uaW5nICYmICFpc05vd1J1bm5pbmcgJiYgaWQgIT09IGFjdGl2ZVNlc3Npb25JZCkge1xuICAgICAgICBuZXdVbnJlYWQuYWRkKGlkKVxuICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBhY3RpdmUgc2Vzc2lvbiwgY2xlYXIgdW5yZWFkXG4gICAgICBpZiAoaWQgPT09IGFjdGl2ZVNlc3Npb25JZCAmJiBuZXdVbnJlYWQuaGFzKGlkKSkge1xuICAgICAgICBuZXdVbnJlYWQuZGVsZXRlKGlkKVxuICAgICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBwcmV2UnVubmluZ01hcC5jdXJyZW50LnNldChpZCwgaXNOb3dSdW5uaW5nKVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBzZXRMb2NhbFVucmVhZFNldChuZXdVbnJlYWQpXG4gICAgfVxuICB9LCBbc2Vzc2lvbnNTdGF0ZS5ieUlkLCBhY3RpdmVTZXNzaW9uSWQsIGFyY2hpdmVkU2V0XSlcblxuICAvLyBDbGVhciB1bnJlYWQgb24gc2Vzc2lvbiBvcGVuXG4gIGNvbnN0IGhhbmRsZU9wZW5TZXNzaW9uID0gKHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGxvY2FsVW5yZWFkU2V0LmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChsb2NhbFVucmVhZFNldClcbiAgICAgIG5leHQuZGVsZXRlKHNlc3Npb25JZClcbiAgICAgIHNldExvY2FsVW5yZWFkU2V0KG5leHQpXG4gICAgfVxuICAgIHByb3BzLm9wZW4/LihzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpdGVtcy5sZW5ndGggPiAwICYmIGV4cGFuZGVkV29ya3NwYWNlcy5zaXplID09PSAwKSB7XG4gICAgICBjb25zdCB0YXJnZXRJZCA9IHdvcmtzcGFjZXNTdGF0ZS5yZWNlbnRXb3Jrc3BhY2VJZCB8fCBpdGVtc1swXT8ud29ya3NwYWNlSWRcbiAgICAgIGlmICh0YXJnZXRJZCkge1xuICAgICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMobmV3IFNldChbdGFyZ2V0SWRdKSlcbiAgICAgICAgY29uc3QgZmlyc3QgPSBpdGVtcy5maW5kKCh3KSA9PiB3LndvcmtzcGFjZUlkID09PSB0YXJnZXRJZClcbiAgICAgICAgaWYgKGZpcnN0Py5wYXRoKSBnbG9iYWxUcmVlU3RvcmUubG9hZFdvcmtzcGFjZShmaXJzdC5wYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW2l0ZW1zLCB3b3Jrc3BhY2VzU3RhdGUucmVjZW50V29ya3NwYWNlSWRdKVxuXG4gIGNvbnN0IHRvZ2dsZVdvcmtzcGFjZSA9ICh3c0lkOiBzdHJpbmcsIHdzUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IG5ldyBTZXQoZXhwYW5kZWRXb3Jrc3BhY2VzKVxuICAgIGlmIChuZXh0Lmhhcyh3c0lkKSkge1xuICAgICAgbmV4dC5kZWxldGUod3NJZClcbiAgICAgIHNldFNob3dBbGxTZXNzaW9uc01hcCgocHJldikgPT4gKHsgLi4ucHJldiwgW3dzSWRdOiBmYWxzZSB9KSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC5hZGQod3NJZClcbiAgICAgIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKHdzUGF0aClcbiAgICB9XG4gICAgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzKG5leHQpXG4gIH1cblxuICBjb25zdCBoYW5kbGVDcmVhdGVGb2xkZXIgPSBhc3luYyAod3NQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobmV3Rm9sZGVyTmFtZS50cmltKCkpIHtcbiAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS5jcmVhdGVGb2xkZXIod3NQYXRoLCBuZXdGb2xkZXJOYW1lLnRyaW0oKSlcbiAgICAgIHNldE5ld0ZvbGRlck5hbWUoJycpXG4gICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZChudWxsKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZVNhdmVSZW5hbWVXcyA9IGFzeW5jICh3c0lkOiBXb3Jrc3BhY2VJZCkgPT4ge1xuICAgIGlmIChlZGl0V3NUaXRsZS50cmltKCkgJiYgcHJvcHMucmVuYW1lV29ya3NwYWNlKSB7XG4gICAgICBhd2FpdCBwcm9wcy5yZW5hbWVXb3Jrc3BhY2Uod3NJZCwgZWRpdFdzVGl0bGUudHJpbSgpKVxuICAgIH1cbiAgICBzZXRFZGl0aW5nV3NJZChudWxsKVxuICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gIH1cblxuICBjb25zdCBoYW5kbGVTYXZlUmVuYW1lU2Vzc2lvbiA9IGFzeW5jIChzZXNzaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChlZGl0U2Vzc2lvblRpdGxlLnRyaW0oKSAmJiBwcm9wcy5yZW5hbWVTZXNzaW9uKSB7XG4gICAgICBhd2FpdCBwcm9wcy5yZW5hbWVTZXNzaW9uKHNlc3Npb25JZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZCwgZWRpdFNlc3Npb25UaXRsZS50cmltKCkpXG4gICAgfVxuICAgIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgfVxuXG4gIC8vIFx1NTIyMFx1OTY2NFx1NEYxQVx1OEJERFx1RkYxQVx1NEVDRVx1NjcyQ1x1NTczMFx1NjU4N1x1NEVGNlx1NTkzOVx1NkUwNVx1OTY2NCArIFx1NEVDRVx1NjcyQVx1OEJGQlx1NkUwNVx1OTY2NCArIFx1OEMwM1x1NzUyOCBEU0ggXHU2ODM4XHU1RkMzXHU1RjUyXHU2ODYzXHU1MjIwXHU5NjY0XG4gIGNvbnN0IGhhbmRsZURlbGV0ZVNlc3Npb24gPSBhc3luYyAod3NQYXRoOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChsb2NhbFVucmVhZFNldC5oYXMoc2Vzc2lvbklkKSkge1xuICAgICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChsb2NhbFVucmVhZFNldClcbiAgICAgICAgbmV4dC5kZWxldGUoc2Vzc2lvbklkKVxuICAgICAgICBzZXRMb2NhbFVucmVhZFNldChuZXh0KVxuICAgICAgfVxuICAgICAgYXdhaXQgZ2xvYmFsVHJlZVN0b3JlLnB1cmdlU2Vzc2lvbih3c1BhdGgsIHNlc3Npb25JZClcbiAgICAgIGlmIChwcm9wcy5hcmNoaXZlU2Vzc2lvbikge1xuICAgICAgICBhd2FpdCBwcm9wcy5hcmNoaXZlU2Vzc2lvbihzZXNzaW9uSWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBEZWxldGUgc2Vzc2lvbiBmYWlsZWQ6JywgZXJyKVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1RDgzQ1x1REYxRiBcdTU3MjhcdTYzMDdcdTVCOUFcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdTY1QjBcdTVFRkFcdTRGMUFcdThCRERcdUZGMDhcdTc2RjRcdThGREUgY29ubmVjdFdvcmtzcGFjZSBcdTgzQjdcdTUzRDYgU2Vzc2lvbklkIFx1NUU3Nlx1NUY1Mlx1NTE2NVx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1OTZGNlx1NjVGNlx1NUU4Rlx1N0FERVx1NjAwMVx1RkYwOVxuICBjb25zdCBoYW5kbGVDcmVhdGVTZXNzaW9uSW5Gb2xkZXIgPSBhc3luYyAod3NJZDogV29ya3NwYWNlSWQsIHdzUGF0aDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKHByb3BzLnN0YXJ0U2Vzc2lvbkluRm9sZGVyKSB7XG4gICAgICBhd2FpdCBwcm9wcy5zdGFydFNlc3Npb25JbkZvbGRlcih3c0lkLCB3c1BhdGgsIGZvbGRlcklkKVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9wcy5zdGFydFNlc3Npb24/Lih3c0lkKVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1RDgzQ1x1REYxRiBcdTk4NzZcdTkwRThcdTZEM0JcdTUyQThcdTRFMEVcdTVGODVcdThCRkJcdTRFRkJcdTUyQTFcdTk2MUZcdTUyMTdcdUZGMDhcdThGREJcdTg4NENcdTRFMkQgLyBcdTVGODVcdTRFQTRcdTRFOTIgLyBcdTVERjJcdTVCOENcdTYyMTBcdTVGODVcdThCRkJcdUZGMENcdTcwQjlcdTUxRkJcdTk2MDVcdThCRkJcdTU0MEVcdTgxRUFcdTUyQThcdTZEODhcdTk2NjRcdUZGMDlcbiAgY29uc3QgYmFubmVyVGFza3MgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBsaXN0OiBCYW5uZXJUYXNrW10gPSBbXVxuICAgIGNvbnN0IGJ5SWQgPSBzZXNzaW9uc1N0YXRlLmJ5SWQgfHwge31cblxuICAgIGZvciAoY29uc3QgW3NJZCwgc2Vzc2lvbl0gb2YgT2JqZWN0LmVudHJpZXMoYnlJZCkpIHtcbiAgICAgIGlmIChhcmNoaXZlZFNldC5oYXMoc0lkKSkgY29udGludWVcbiAgICAgIGNvbnN0IGlzUnVubmluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZylcbiAgICAgIGNvbnN0IGlzUGVuZGluZyA9IEJvb2xlYW4oc2Vzc2lvbj8ucGVuZGluZ0ludGVyYWN0aW9uKVxuICAgICAgY29uc3QgaXNVbnJlYWRDb21wbGV0ZWQgPSAoQm9vbGVhbihzZXNzaW9uPy5jb21wbGV0ZWQpIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzSWQpKSAmJiBzSWQgIT09IGFjdGl2ZVNlc3Npb25JZFxuXG4gICAgICBjb25zdCBvd25lcldzID0gaXRlbXMuZmluZCgodykgPT4gKHcuc2Vzc2lvbklkcyB8fCBbXSkuaW5jbHVkZXMoc0lkIGFzIHVua25vd24gYXMgU2Vzc2lvbklkKSlcbiAgICAgIGNvbnN0IHRpdGxlID0gc2Vzc2lvbj8udGl0bGUgfHwgc0lkLnNsaWNlKDAsIDE2KVxuXG4gICAgICBpZiAoaXNSdW5uaW5nKSB7XG4gICAgICAgIGxpc3QucHVzaCh7IHNlc3Npb25JZDogc0lkLCB0aXRsZSwgc3RhdHVzOiAncnVubmluZycsIHdzOiBvd25lcldzIH0pXG4gICAgICB9IGVsc2UgaWYgKGlzUGVuZGluZykge1xuICAgICAgICBsaXN0LnB1c2goeyBzZXNzaW9uSWQ6IHNJZCwgdGl0bGUsIHN0YXR1czogJ3BlbmRpbmcnLCB3czogb3duZXJXcyB9KVxuICAgICAgfSBlbHNlIGlmIChpc1VucmVhZENvbXBsZXRlZCkge1xuICAgICAgICBsaXN0LnB1c2goeyBzZXNzaW9uSWQ6IHNJZCwgdGl0bGUsIHN0YXR1czogJ2NvbXBsZXRlZCcsIHdzOiBvd25lcldzIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXI6IFJlY29yZDwncnVubmluZycgfCAncGVuZGluZycgfCAnY29tcGxldGVkJywgbnVtYmVyPiA9IHsgcnVubmluZzogMCwgcGVuZGluZzogMSwgY29tcGxldGVkOiAyIH1cbiAgICByZXR1cm4gbGlzdC5zb3J0KChhLCBiKSA9PiAob3JkZXJbYS5zdGF0dXNdID8/IDApIC0gKG9yZGVyW2Iuc3RhdHVzXSA/PyAwKSlcbiAgfSwgW3Nlc3Npb25zU3RhdGUuYnlJZCwgaXRlbXMsIGxvY2FsVW5yZWFkU2V0LCBhY3RpdmVTZXNzaW9uSWQsIGFyY2hpdmVkU2V0XSlcblxuICAvLyBcdTcwQjlcdTUxRkJcdTRFRkJcdTUyQTFcdUZGMUFcdTRFMDBcdTk1MkVcdTVDNTVcdTVGMDBcdTVCRjlcdTVFOTRcdTVERTVcdTRGNUNcdTUzM0FcdTMwMDFcdTVDNTVcdTVGMDBcdTY1ODdcdTRFRjZcdTU5MzlcdTMwMDFcdTYyNTNcdTVGMDBcdTVCRjlcdThCRERcdTVFNzZcdTZEODhcdTk2NjRcdTY3MkFcdThCRkJcbiAgY29uc3QgaGFuZGxlSnVtcFRvQWN0aXZlVGFzayA9IChzZXNzaW9uSWQ6IHN0cmluZywgb3duZXJXcz86IFdvcmtzcGFjZVZpZXcpID0+IHtcbiAgICBpZiAob3duZXJXcykge1xuICAgICAgc2V0RXhwYW5kZWRXb3Jrc3BhY2VzKChwcmV2KSA9PiBuZXcgU2V0KFsuLi5wcmV2LCBvd25lcldzLndvcmtzcGFjZUlkXSkpXG4gICAgICBjb25zdCBtZXRhID0gZ2xvYmFsVHJlZVN0b3JlLmdldE1ldGFGb3JXb3Jrc3BhY2Uob3duZXJXcy5wYXRoKVxuICAgICAgY29uc3QgdGFyZ2V0Rm9sZGVyID0gbWV0YS5mb2xkZXJzLmZpbmQoKGYpID0+IGYuc2Vzc2lvbklkcy5pbmNsdWRlcyhzZXNzaW9uSWQpKVxuICAgICAgaWYgKHRhcmdldEZvbGRlciAmJiB0YXJnZXRGb2xkZXIuY29sbGFwc2VkKSB7XG4gICAgICAgIGdsb2JhbFRyZWVTdG9yZS50b2dnbGVGb2xkZXIob3duZXJXcy5wYXRoLCB0YXJnZXRGb2xkZXIuaWQpXG4gICAgICB9XG4gICAgfVxuICAgIGhhbmRsZU9wZW5TZXNzaW9uKHNlc3Npb25JZClcbiAgfVxuXG4gIGNvbnN0IGZpbHRlcmVkV29ya3NwYWNlcyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghc2VhcmNoUXVlcnkudHJpbSgpKSByZXR1cm4gaXRlbXNcbiAgICBjb25zdCBxID0gc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKVxuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoKHdzKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaFRpdGxlID0gKHdzLnRpdGxlIHx8ICcnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICBjb25zdCBtYXRjaFNlc3Npb25zID0gKHdzLnNlc3Npb25JZHMgfHwgW10pLnNvbWUoKHNJZCkgPT4ge1xuICAgICAgICBjb25zdCBzaWRTdHIgPSBzSWQgYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgaWYgKGFyY2hpdmVkU2V0LmhhcyhzaWRTdHIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgY29uc3QgdGl0bGUgPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzaWRTdHJdPy50aXRsZSB8fCAnJ1xuICAgICAgICByZXR1cm4gdGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBtYXRjaFRpdGxlIHx8IG1hdGNoU2Vzc2lvbnNcbiAgICB9KVxuICB9LCBbaXRlbXMsIHNlYXJjaFF1ZXJ5LCBzZXNzaW9uc1N0YXRlLmJ5SWQsIGFyY2hpdmVkU2V0XSlcblxuICAvLyBEU0ggXHU1MzlGXHU3NTFGIERpcmVjdG9yeUZsb3cgXHU0RUE0XHU0RTkyXHU3MkI2XHU2MDAxXG4gIGNvbnN0IFtmbG93T3Blbiwgc2V0Rmxvd09wZW5dID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtwaWNraW5nRm9sZGVyLCBzZXRQaWNraW5nRm9sZGVyXSA9IHVzZVN0YXRlKGZhbHNlKVxuXG4gIGNvbnN0IGZsb3dPd25lciA9IHtcbiAgICBvcGVuOiBmbG93T3BlbixcbiAgICBidXN5OiBwaWNraW5nRm9sZGVyLFxuICAgIG9uUGlja2VkOiBhc3luYyAocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBzZXRQaWNraW5nRm9sZGVyKHRydWUpXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBwcm9wcy5jcmVhdGVXb3Jrc3BhY2U/Lih7IHBhdGggfSlcbiAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgIGNvbnN0IHdzSWQgPSAocmVzIGFzIGFueSkud29ya3NwYWNlSWQgfHwgKHJlcyBhcyBhbnkpLmlkXG4gICAgICAgICAgaWYgKHdzSWQpIHtcbiAgICAgICAgICAgIHNldEV4cGFuZGVkV29ya3NwYWNlcygocHJldikgPT4gbmV3IFNldChbLi4ucHJldiwgd3NJZF0pKVxuICAgICAgICAgICAgcHJvcHMuc3RhcnRTZXNzaW9uPy4od3NJZClcbiAgICAgICAgICB9XG4gICAgICAgICAgZ2xvYmFsVHJlZVN0b3JlLmxvYWRXb3Jrc3BhY2UocGF0aClcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tkc2gtd29ya3NwYWNlLXRyZWVdIENyZWF0ZSB3b3Jrc3BhY2UgZnJvbSBmbG93IGZhaWxlZDonLCBlcnIpXG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRQaWNraW5nRm9sZGVyKGZhbHNlKVxuICAgICAgICBzZXRGbG93T3BlbihmYWxzZSlcbiAgICAgICAgc2V0SXNBZGRNb2RhbE9wZW4oZmFsc2UpXG4gICAgICB9XG4gICAgfSxcbiAgICBvbkNhbmNlbDogKCkgPT4ge1xuICAgICAgc2V0Rmxvd09wZW4oZmFsc2UpXG4gICAgfSxcbiAgICBvbkVycm9yOiAobXNnOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRGlyZWN0b3J5IGZsb3cgZXJyb3I6JywgbXNnKVxuICAgICAgc2V0Rmxvd09wZW4oZmFsc2UpXG4gICAgfSxcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZU9wZW5BZGRXb3Jrc3BhY2UgPSAoKSA9PiB7XG4gICAgc2V0QWRkV3NFcnJvcihudWxsKVxuICAgIHNldE5ld1dvcmtzcGFjZVBhdGgoJycpXG4gICAgc2V0SXNBZGRNb2RhbE9wZW4odHJ1ZSlcbiAgICBzZXRTaG93U2VhcmNoKGZhbHNlKVxuICB9XG5cbiAgY29uc3QgaGFuZGxlUGlja0Zyb21PUyA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRGbG93T3Blbih0cnVlKVxuICAgIGlmIChwcm9wcy5waWNrRGlyZWN0b3J5KSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwaWNrZWQgPSBhd2FpdCBwcm9wcy5waWNrRGlyZWN0b3J5KClcbiAgICAgICAgaWYgKHBpY2tlZCkge1xuICAgICAgICAgIGF3YWl0IGZsb3dPd25lci5vblBpY2tlZChwaWNrZWQpXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIHBpY2tEaXJlY3RvcnkgZmFpbGVkOicsIGVycilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBoYW5kbGVDb25maXJtQWRkV29ya3NwYWNlID0gYXN5bmMgKGN1c3RvbVBhdGg/OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0YXJnZXRQYXRoID0gKGN1c3RvbVBhdGggfHwgbmV3V29ya3NwYWNlUGF0aCkudHJpbSgpXG4gICAgaWYgKCF0YXJnZXRQYXRoKSB7XG4gICAgICBzZXRBZGRXc0Vycm9yKCdcdThCRjdcdThGOTNcdTUxNjVcdTVERTVcdTRGNUNcdTUzM0FcdTc2RUVcdTVGNTVcdTc2ODRcdTdFRERcdTVCRjlcdThERUZcdTVGODQnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHNldElzU3VibWl0dGluZ1dzKHRydWUpXG4gICAgc2V0QWRkV3NFcnJvcihudWxsKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBwcm9wcy5jcmVhdGVXb3Jrc3BhY2U/Lih7IHBhdGg6IHRhcmdldFBhdGggfSlcbiAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgY29uc3Qgd3NJZCA9IChyZXMgYXMgYW55KS53b3Jrc3BhY2VJZCB8fCAocmVzIGFzIGFueSkuaWRcbiAgICAgICAgaWYgKHdzSWQpIHtcbiAgICAgICAgICBzZXRFeHBhbmRlZFdvcmtzcGFjZXMoKHByZXYpID0+IG5ldyBTZXQoWy4uLnByZXYsIHdzSWRdKSlcbiAgICAgICAgICBwcm9wcy5zdGFydFNlc3Npb24/Lih3c0lkKVxuICAgICAgICB9XG4gICAgICAgIGdsb2JhbFRyZWVTdG9yZS5sb2FkV29ya3NwYWNlKHRhcmdldFBhdGgpXG4gICAgICAgIHNldElzQWRkTW9kYWxPcGVuKGZhbHNlKVxuICAgICAgICBzZXROZXdXb3Jrc3BhY2VQYXRoKCcnKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBDcmVhdGUgd29ya3NwYWNlIGZhaWxlZDonLCBlcnIpXG4gICAgICBzZXRBZGRXc0Vycm9yKGVycj8ubWVzc2FnZSB8fCAnXHU1MjFCXHU1RUZBXHU1REU1XHU0RjVDXHU1MzNBXHU1OTMxXHU4RDI1XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3NkVFXHU1RjU1XHU4REVGXHU1Rjg0XHU2NjJGXHU1NDI2XHU1QjU4XHU1NzI4XHU0RTE0XHU2NzA5XHU2NTQ4JylcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNTdWJtaXR0aW5nV3MoZmFsc2UpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGhlaWdodDogJzEwMCUnLCBvdmVyZmxvd1k6ICdhdXRvJywgdXNlclNlbGVjdDogJ25vbmUnLCBmb250RmFtaWx5OiAnaW5oZXJpdCcgfX0+XG4gICAgICB7LyogMS4gSGVhZGVyIEJhcjogXHU1REU1XHU0RjVDXHU1MzNBICovfVxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLCBwYWRkaW5nOiAnMTJweCAxNHB4IDZweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJywgZm9udFNpemU6ICcxM3B4JywgZm9udFdlaWdodDogNjAwIH19PlxuICAgICAgICA8c3Bhbj5cdTVERTVcdTRGNUNcdTUzM0E8L3NwYW4+XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fT5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FkZE1vZGFsT3BlbiA/ICdyZ2JhKDk2LCAxNjUsIDI1MCwgMC4yKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgY29sb3I6IGlzQWRkTW9kYWxPcGVuID8gJyM2MGE1ZmEnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHRpdGxlPVwiXHU2REZCXHU1MkEwL1x1NjVCMFx1NUVGQVx1NURFNVx1NEY1Q1x1NTMzQVwiXG4gICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVPcGVuQWRkV29ya3NwYWNlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxQbHVzSWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzaG93U2VhcmNoID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICBjb2xvcjogc2hvd1NlYXJjaCA/ICcjNjBhNWZhJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICB0aXRsZT1cIlx1NjQxQ1x1N0QyMlx1NURFNVx1NEY1Q1x1NTMzQVx1NjIxNlx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNob3dTZWFyY2goIXNob3dTZWFyY2gpXG4gICAgICAgICAgICAgIHNldElzQWRkTW9kYWxPcGVuKGZhbHNlKVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U2VhcmNoSWNvbiBzaXplPXsxNH0gLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFx1RDgzQ1x1REYxRiBcdTZERkJcdTUyQTAvXHU2NUIwXHU1RUZBXHU1REU1XHU0RjVDXHU1MzNBXHU1QzQ1XHU0RTJEXHU1QkY5XHU4QkREXHU2ODQ2IChNb2RhbCBPdmVybGF5ICYgQ2FyZCkgKi99XG4gICAgICB7aXNBZGRNb2RhbE9wZW4gJiYgKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgICAgICAgaW5zZXQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDk5OTksXG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDAsIDAsIDAsIDAuNyknLFxuICAgICAgICAgICAgYmFja2Ryb3BGaWx0ZXI6ICdibHVyKDZweCknLFxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNBZGRNb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgd2lkdGg6ICc0MjBweCcsXG4gICAgICAgICAgICAgIG1heFdpZHRoOiAnOTJ2dycsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzEwcHgnLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzE1MWIyOCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgICAgICAgICAgICAgYm94U2hhZG93OiAnMCAyMHB4IDQ1cHggcmdiYSgwLCAwLCAwLCAwLjgpJyxcbiAgICAgICAgICAgICAgcGFkZGluZzogJzE4cHggMjBweCcsXG4gICAgICAgICAgICAgIGNvbG9yOiAnI2Y4ZmFmYycsXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXG4gICAgICAgICAgICAgIGdhcDogJzE0cHgnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsvKiBNb2RhbCBIZWFkZXIgKi99XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicgfX0+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnOHB4JyB9fT5cbiAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxOH0gY29sb3I9XCIjNjBhNWZhXCIgLz5cbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzE0cHgnLCBmb250V2VpZ2h0OiA2MDAgfX0+XHU2REZCXHU1MkEwIC8gXHU2NUIwXHU1RUZBXHU1REU1XHU0RjVDXHU1MzNBPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyM5NGEzYjgnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcgfX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0FkZE1vZGFsT3BlbihmYWxzZSl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Q2xvc2VJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogUGF0aCBJbnB1dCAqL31cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnNnB4JyB9fT5cbiAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXt7IGZvbnRTaXplOiAnMTJweCcsIGNvbG9yOiAnIzk0YTNiOCcgfX0+XHU3NkVFXHU1RjU1XHU3RUREXHU1QkY5XHU4REVGXHU1Rjg0IChEaXJlY3RvcnkgUGF0aCk6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczNHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDEwcHgnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIi9ob21lL3Bwei9wcm9qZWN0L215LXdvcmtzcGFjZVwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e25ld1dvcmtzcGFjZVBhdGh9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdXb3Jrc3BhY2VQYXRoKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIGhhbmRsZUNvbmZpcm1BZGRXb3Jrc3BhY2UoKVxuICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0SXNBZGRNb2RhbE9wZW4oZmFsc2UpXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAge2FkZFdzRXJyb3IgJiYgKFxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAnI2Y4NzE3MScgfX0+e2FkZFdzRXJyb3J9PC9zcGFuPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBRdWljayBQcmVzZXRzICovfVxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc2cHgnIH19PlxuICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJyM2NDc0OGInIH19Plx1NUZFQlx1OTAxRlx1NTg2Qlx1NTE2NVx1NTNDMlx1ODAwM1x1NzZFRVx1NUY1NTo8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4V3JhcDogJ3dyYXAnLCBnYXA6ICc2cHgnIH19PlxuICAgICAgICAgICAgICAgIHtbJy9ob21lL3Bwei9wcm9qZWN0JywgJy9ob21lL3Bwei9wcm9qZWN0L2RzaCcsICcvaG9tZS9wcHonXS5tYXAoKHApID0+IChcbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAga2V5PXtwfVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpJyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjYmQ1ZTEnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzJweCA4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTFweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2FsbCAwLjE1cyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjE1KScpfVxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KScpfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXROZXdXb3Jrc3BhY2VQYXRoKHApfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7cH1cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogTW9kYWwgQWN0aW9ucyAqL31cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJywgcGFkZGluZ1RvcDogJzZweCcsIGJvcmRlclRvcDogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyB9fT5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSknLFxuICAgICAgICAgICAgICAgICAgY29sb3I6ICcjOTRhM2I4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDEycHgnLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlUGlja0Zyb21PU31cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIFx1RDgzRFx1RENDMiBcdTZENEZcdTg5QzhcdTdDRkJcdTdFREZcdTc2RUVcdTVGNTUuLi5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnOHB4JyB9fT5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjOTRhM2I4JyxcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzZweCAxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNBZGRNb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIFx1NTNENlx1NkQ4OFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtpc1N1Ym1pdHRpbmdXc31cbiAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjMjU2M2ViJyxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTRweCcsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDYwMCxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBpc1N1Ym1pdHRpbmdXcyA/ICdub3QtYWxsb3dlZCcgOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IGlzU3VibWl0dGluZ1dzID8gMC42IDogMSxcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVDb25maXJtQWRkV29ya3NwYWNlKCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzU3VibWl0dGluZ1dzID8gJ1x1NkI2M1x1NTcyOFx1NTIxQlx1NUVGQS4uLicgOiAnXHU1MjFCXHU1RUZBXHU1RTc2XHU4RkRCXHU1MTY1J31cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogXHU3RDI3XHU1MUQxXHU2NDFDXHU3RDIyXHU4RjkzXHU1MTY1XHU2ODQ2ICovfVxuICAgICAge3Nob3dTZWFyY2ggJiYgKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcycHggMTBweCA2cHgnIH19PlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgIGhlaWdodDogJzI4cHgnLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnMCA4cHgnLFxuICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiXHU2NDFDXHU3RDIyXHU1REU1XHU0RjVDXHU1MzNBXHU2MjE2XHU0RjFBXHU4QkRELi4uXCJcbiAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIDIuIFx1OTg3Nlx1OTBFOFx1NkQzQlx1NTJBOC9cdTVGODVcdThCRkJcdTRFRkJcdTUyQTEgKFx1NTM1NVx1ODg0Q1x1Njc4MVx1N0I4MFx1N0NCRVx1ODFGNFx1ODBGNlx1NTZDQSAyOHB4IFx1OUFEOFx1NUVBNlx1RkYwQ1x1OEZEQlx1ODg0Q1x1NEUyRC9cdTVGODVcdTc4NkVcdThCQTQvXHU1Rjg1XHU4QkZCKSAqL31cbiAgICAgIHtiYW5uZXJUYXNrcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnB4IDhweCA2cHgnLCBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgIHtiYW5uZXJUYXNrcy5tYXAoKHRhc2spID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmYgPSBUQVNLX1NUWUxFX0NPTkZJR1t0YXNrLnN0YXR1c11cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e3Rhc2suc2Vzc2lvbklkfVxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyOHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi5iZyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2NvbmYuYm9yZGVyfWAsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT17YCR7Y29uZi50aXRsZVByZWZpeH0gKFx1NzBCOVx1NTFGQlx1NzZGNFx1OEZCRSR7dGFzay5zdGF0dXMgPT09ICdjb21wbGV0ZWQnID8gJ1x1NUU3Nlx1NkQ4OFx1OTY2NFx1NUY4NVx1OEJGQicgOiAnJ31cdUZGMENcdTRGNERcdTRFOEU6ICR7dGFzay53cz8udGl0bGUgfHwgJ1x1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQSd9KWB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlSnVtcFRvQWN0aXZlVGFzayh0YXNrLnNlc3Npb25JZCwgdGFzay53cyl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBjb25mLmhvdmVyQmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuaG92ZXJCb3JkZXJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZXZyb24gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnRhc2stY2hldnJvbicpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2ZmZiknXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9IGNvbmYuYmdcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbmYuYm9yZGVyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjaGV2cm9uID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy50YXNrLWNoZXZyb24nKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgaWYgKGNoZXZyb24pIGNoZXZyb24uc3R5bGUuY29sb3IgPSAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KSdcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSB9fT5cbiAgICAgICAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiB0YXNrLnN0YXR1cyA9PT0gJ3BlbmRpbmcnID8gKFxuICAgICAgICAgICAgICAgICAgICA8UGVuZGluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxMnB4JywgZm9udFdlaWdodDogNTAwLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjZjhmYWZjKScsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJyB9fT5cbiAgICAgICAgICAgICAgICAgICAge3Rhc2sudGl0bGV9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7dGFzay53cz8udGl0bGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzExcHgnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLCBvdmVyZmxvdzogJ2hpZGRlbicsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIG9wYWNpdHk6IDAuOCB9fT5cbiAgICAgICAgICAgICAgICAgICAgICBcdTAwQjcge3Rhc2sud3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcsIGZsZXhTaHJpbms6IDAgfX0+XG4gICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbmYudGFnQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZi50YWdCZyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMXB4IDVweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7Y29uZi50YWdUZXh0fVxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGFzay1jaGV2cm9uXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZ0xlZnQ6ICcycHgnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4xNXMgZWFzZScgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHRJY29uIHNpemU9ezExfSAvPlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogMy4gV29ya3NwYWNlcyBUcmVlIExpc3QgKi99XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzJweCcsIHBhZGRpbmc6ICcwIDZweCcgfX0+XG4gICAgICAgIHtmaWx0ZXJlZFdvcmtzcGFjZXMubWFwKCh3cykgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbmRlZFdvcmtzcGFjZXMuaGFzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1RDgzQ1x1REYxRiBcdThCRkJcdTUzRDZcdTZCQ0ZcdTRFMkFcdTVERTVcdTRGNUNcdTUzM0FcdTcyRUNcdTdBQ0JcdTc2ODRcdTUxNDNcdTY1NzBcdTYzNkVcdUZGMDhcdTZDMzhcdTRFNDVcdTdBMzNcdTVCOUFcdTVFMzhcdTlBN0JcdUZGMDlcbiAgICAgICAgICBjb25zdCB3c01ldGEgPSBnbG9iYWxUcmVlU3RvcmUuZ2V0TWV0YUZvcldvcmtzcGFjZSh3cy5wYXRoKVxuICAgICAgICAgIGNvbnN0IHdzUGlubmVkU2V0ID0gbmV3IFNldCh3c01ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSlcblxuICAgICAgICAgIGNvbnN0IHJhd1Nlc3Npb25zID0gKHdzLnNlc3Npb25JZHMgfHwgW10pLm1hcCgoc0lkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaWRTdHIgPSBzSWQgYXMgdW5rbm93biBhcyBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzaWRTdHJdXG4gICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzaWRTdHIpKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpZDogc2lkU3RyLFxuICAgICAgICAgICAgICB0aXRsZTogc2Vzc2lvbj8udGl0bGUgfHwgc2lkU3RyLnNsaWNlKDAsIDE2KSxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBzZXNzaW9uPy51cGRhdGVkQXQgfHwgMCxcbiAgICAgICAgICAgICAgcnVubmluZzogQm9vbGVhbihzZXNzaW9uPy5ydW5uaW5nKSxcbiAgICAgICAgICAgICAgcGVuZGluZ0ludGVyYWN0aW9uOiBzZXNzaW9uPy5wZW5kaW5nSW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgIGNvbXBsZXRlZDogaXNVbnJlYWQgJiYgc2lkU3RyICE9PSBhY3RpdmVTZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGJsYW5rOiBCb29sZWFuKHNlc3Npb24/LmJsYW5rKSxcbiAgICAgICAgICAgICAgaXNQaW5uZWQ6IHdzUGlubmVkU2V0LmhhcyhzaWRTdHIpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCB2YWxpZFNlc3Npb25zID0gcmF3U2Vzc2lvbnNcbiAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAuZmlsdGVyKChzKSA9PiAhaXNCbGFua1BsYWNlaG9sZGVyKHMuaWQsIHMudGl0bGUsIHMuYmxhbmssIGFjdGl2ZVNlc3Npb25JZCA9PT0gcy5pZCkpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICBpZiAoYS5ydW5uaW5nICE9PSBiLnJ1bm5pbmcpIHJldHVybiBhLnJ1bm5pbmcgPyAtMSA6IDFcbiAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgIHJldHVybiAoYi51cGRhdGVkQXQgfHwgMCkgLSAoYS51cGRhdGVkQXQgfHwgMClcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCBjYXRlZ29yaXplZFNlc3Npb25JZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB3c01ldGEuZm9sZGVycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBzSWQgb2YgZi5zZXNzaW9uSWRzKSBjYXRlZ29yaXplZFNlc3Npb25JZHMuYWRkKHNJZClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgPSB2YWxpZFNlc3Npb25zLmZpbHRlcigocykgPT4gIWNhdGVnb3JpemVkU2Vzc2lvbklkcy5oYXMocy5pZCkpXG4gICAgICAgICAgY29uc3Qgc2hvd0FsbCA9IHNob3dBbGxTZXNzaW9uc01hcFt3cy53b3Jrc3BhY2VJZF0gfHwgZmFsc2VcbiAgICAgICAgICBjb25zdCB2aXNpYmxlVW5jYXRlZ29yaXplZCA9IHNob3dBbGwgPyB1bmNhdGVnb3JpemVkU2Vzc2lvbnMgOiB1bmNhdGVnb3JpemVkU2Vzc2lvbnMuc2xpY2UoMCwgREVGQVVMVF9WSVNJQkxFX0xJTUlUKVxuICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0NvdW50ID0gdW5jYXRlZ29yaXplZFNlc3Npb25zLmxlbmd0aCAtIERFRkFVTFRfVklTSUJMRV9MSU1JVFxuXG4gICAgICAgICAgY29uc3QgcmVuZGVyTW92ZURyb3Bkb3duID0gKHNJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgIT09IHNJZCkgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIGNvbnN0IGlzQ2F0ZWdvcml6ZWQgPSBjYXRlZ29yaXplZFNlc3Npb25JZHMuaGFzKHNJZClcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICB0b3A6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgekluZGV4OiA5OTk5LFxuICAgICAgICAgICAgICAgICAgbWluV2lkdGg6ICcxNjBweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIsICMxZTI5M2IpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC40NSknLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICAgICAgICAgICAgICAgIGdhcDogJzJweCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJywgcGFkZGluZzogJzRweCA4cHgnLCBmb250V2VpZ2h0OiA2MDAsIGJvcmRlckJvdHRvbTogJzFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyB9fT5cbiAgICAgICAgICAgICAgICAgIFx1NzlGQlx1NTJBOFx1ODFGM1x1NzZFRVx1NjgwN1x1NjU4N1x1NEVGNlx1NTkzOTpcbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7d3NNZXRhLmZvbGRlcnMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnNnB4IDhweCcsIGZvbnRTaXplOiAnMTFweCcsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScgfX0+XG4gICAgICAgICAgICAgICAgICAgIFx1NjY4Mlx1NjVFMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1OEJGN1x1NTE0OFx1NTIxQlx1NUVGQVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIHdzTWV0YS5mb2xkZXJzLm1hcCgoZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpblRoaXNGb2xkZXIgPSBmLnNlc3Npb25JZHMuaW5jbHVkZXMoc0lkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Zi5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpblRoaXNGb2xkZXIgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogaW5UaGlzRm9sZGVyID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjEyKScgOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDgpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiAoZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmQgPSBpblRoaXNGb2xkZXIgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMTIpJyA6ICd0cmFuc3BhcmVudCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBmLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9sZGVySWNvbiBzaXplPXsxM30gY29sb3I9e2YuY29sb3IgfHwgJyM2MGE1ZmEnfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBmbGV4OiAxIH19PntmLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2luVGhpc0ZvbGRlciAmJiA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzEwcHgnLCBjb2xvcjogJyM2MGE1ZmEnIH19Plx1MjcxMzwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgIHsvKiBcdTU5ODJcdTY3OUNcdTVERjJcdTdFQ0ZcdTU3MjhcdTY3RDBcdTRFMkFcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdUZGMENcdTY2M0VcdTc5M0FcdTc5RkJcdTUxRkFcdTkwMDlcdTk4NzkgKi99XG4gICAgICAgICAgICAgICAge2lzQ2F0ZWdvcml6ZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICBnYXA6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjY2JkNWUxJyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6ICcxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KScsXG4gICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknKX1cbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUubW92ZVNlc3Npb24od3MucGF0aCwgc0lkLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxNb3ZlT3V0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XHU3OUZCXHU1MUZBXHU4MUYzXHU2NzJBXHU1MjA2XHU3QzdCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYga2V5PXt3cy53b3Jrc3BhY2VJZH0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgICAgICAgICAgey8qIFdvcmtzcGFjZSBSb3cgSXRlbSAqL31cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczNHB4JyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDhweCcsXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0V4cGFuZGVkID8gJ3ZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KSknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTNweCcsXG4gICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA1MDAsXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aCl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcud3MtYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucyAmJiBhY3RpdmVNZW51V3NJZCAhPT0gd3Mud29ya3NwYWNlSWQpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxIH19PlxuICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgc2l6ZT17MTJ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGlzRXhwYW5kZWQgPyAncm90YXRlKDkwZGVnKScgOiAncm90YXRlKDBkZWcpJyxcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEZvbGRlckljb24gc2l6ZT17MTV9IGNvbG9yPVwiIzYwYTVmYVwiIHN0eWxlPXt7IGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgICAgICAgIHtlZGl0aW5nV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5EU0hfSU5QVVRfU1RZTEUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdFdzVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0V3NUaXRsZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiBoYW5kbGVTYXZlUmVuYW1lV3Mod3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVdzKHdzLndvcmtzcGFjZUlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1dzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgb3ZlcmZsb3c6ICdoaWRkZW4nLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcycsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19IHRpdGxlPXt3cy5wYXRofT5cbiAgICAgICAgICAgICAgICAgICAgICB7d3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIEFjdGlvbiBCdXR0b25zICovfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIndzLWFjdGlvbnNcIlxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgZGlzcGxheTogYWN0aXZlTWVudVdzSWQgPT09IHdzLndvcmtzcGFjZUlkID8gJ2lubGluZS1mbGV4JyA6ICdub25lJywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcgfX1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTcyOFx1NUY1M1x1NTI0RFx1NURFNVx1NEY1Q1x1NTMzQVx1NjVCMFx1NUVGQVx1NTIwNlx1N0M3Qlx1NjU4N1x1NEVGNlx1NTkzOVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRXhwYW5kZWQpIHRvZ2dsZVdvcmtzcGFjZSh3cy53b3Jrc3BhY2VJZCwgd3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICBzZXRJc0NyZWF0aW5nRm9sZGVyV3NJZCh3cy53b3Jrc3BhY2VJZClcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPEFkZEZvbGRlckljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOTRhM2I4KScsXG4gICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NjVCMFx1NUVGQVx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHByb3BzLnN0YXJ0U2Vzc2lvbj8uKHdzLndvcmtzcGFjZUlkKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFBsdXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzk0YTNiOCknLFxuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTY2RjRcdTU5MUFcdTY0Q0RcdTRGNUNcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVNZW51V3NJZChhY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgPyBudWxsIDogd3Mud29ya3NwYWNlSWQpfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8RWxsaXBzaXNJY29uIHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogXHU1RjM5XHU1MUZBXHU4M0RDXHU1MzU1ICovfVxuICAgICAgICAgICAgICAgIHthY3RpdmVNZW51V3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICByZWY9e21lbnVSZWZ9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHRvcDogJzMycHgnLFxuICAgICAgICAgICAgICAgICAgICAgIHpJbmRleDogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICd2YXIoLS1kc3ctc3VyZmFjZS0wLCAjMTgxODE4KScsXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHZhcigtLWRzdy1ib3JkZXItZGVmYXVsdCwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KSknLFxuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnMCA2cHggMjBweCByZ2JhKDAsIDAsIDAsIDAuNDUpJyxcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzEyMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcEZpbHRlcjogJ2JsdXIoMTJweCknLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhcDogJzhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDEwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmOGZhZmMpJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCkpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1dzSWQod3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0V3NUaXRsZSh3cy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1lbnVXc0lkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxM30gLz5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cdTkxQ0RcdTU0N0RcdTU0MEQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc2cHggMTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZjg3MTcxJyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDI0OCwgMTEzLCAxMTMsIDAuMTIpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3RyYW5zcGFyZW50Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuZGVsZXRlV29ya3NwYWNlPy4od3Mud29ya3NwYWNlSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNZW51V3NJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlx1NTIyMFx1OTY2NFx1NURFNVx1NEY1Q1x1NTMzQTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogV29ya3NwYWNlIENvbnRlbnQgKEZvbGRlcnMgKyBTZXNzaW9ucykgKi99XG4gICAgICAgICAgICAgIHtpc0V4cGFuZGVkICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzFweCcsIHBhZGRpbmdMZWZ0OiAnMTRweCcgfX0+XG4gICAgICAgICAgICAgICAgICB7LyogSW5saW5lIE5ldyBGb2xkZXIgSW5wdXQgRm9ybSAqL31cbiAgICAgICAgICAgICAgICAgIHtpc0NyZWF0aW5nRm9sZGVyV3NJZCA9PT0gd3Mud29ya3NwYWNlSWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICc0cHggNnB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlx1OEY5M1x1NTE2NVx1NjU4N1x1NEVGNlx1NTkzOVx1NTQwRFx1NzlGMCAoXHU1NkRFXHU4RjY2XHU1MjFCXHU1RUZBLCBFU0NcdTUzRDZcdTZEODgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtuZXdGb2xkZXJOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdGb2xkZXJOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdGb2xkZXJOYW1lLnRyaW0oKSkgc2V0SXNDcmVhdGluZ0ZvbGRlcldzSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBoYW5kbGVDcmVhdGVGb2xkZXIod3MucGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQS4gVmlydHVhbCBGb2xkZXJzICovfVxuICAgICAgICAgICAgICAgICAge3dzTWV0YS5mb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvbGRlclNlc3Npb25zID0gZm9sZGVyLnNlc3Npb25JZHNcbiAgICAgICAgICAgICAgICAgICAgICAubWFwKChzSWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBzZXNzaW9uc1N0YXRlLmJ5SWQ/LltzSWQgYXMgdW5rbm93biBhcyBzdHJpbmddXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VucmVhZCA9IEJvb2xlYW4oc2Vzc2lvbj8uY29tcGxldGVkIHx8IGxvY2FsVW5yZWFkU2V0LmhhcyhzSWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHNJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHNlc3Npb24/LnRpdGxlIHx8IHNJZC5zbGljZSgwLCAxNiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogc2Vzc2lvbj8udXBkYXRlZEF0IHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmc6IEJvb2xlYW4oc2Vzc2lvbj8ucnVubmluZyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdJbnRlcmFjdGlvbjogc2Vzc2lvbj8ucGVuZGluZ0ludGVyYWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IGlzVW5yZWFkICYmIHNJZCAhPT0gYWN0aXZlU2Vzc2lvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBibGFuazogQm9vbGVhbihzZXNzaW9uPy5ibGFuayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlzUGlubmVkOiB3c1Bpbm5lZFNldC5oYXMoc0lkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHMpID0+ICFhcmNoaXZlZFNldC5oYXMocy5pZCkpXG4gICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnJ1bm5pbmcgIT09IGIucnVubmluZykgcmV0dXJuIGEucnVubmluZyA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuaXNQaW5uZWQgIT09IGIuaXNQaW5uZWQpIHJldHVybiBhLmlzUGlubmVkID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGIudXBkYXRlZEF0IHx8IDApIC0gKGEudXBkYXRlZEF0IHx8IDApXG4gICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtmb2xkZXIuaWR9IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7LyogRm9sZGVyIEhlYWRlciBSb3cgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNlMmU4ZjApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDAuMTVzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5mb2xkZXItYWN0aW9ucycpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbnMpIGFjdGlvbnMuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZvbGRlci1hY3Rpb25zJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykgYWN0aW9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JywgbWluV2lkdGg6IDAsIGZsZXg6IDEgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoZXZyb25SaWdodEljb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9ezEwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBmb2xkZXIuY29sbGFwc2VkID8gJ3JvdGF0ZSgwZGVnKScgOiAncm90YXRlKDkwZGVnKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4xNXMgZWFzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvbGRlckljb24gc2l6ZT17MTR9IGNvbG9yPXtmb2xkZXIuY29sb3IgfHwgJyM2MGE1ZmEnfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdGb2xkZXJJZCA9PT0gZm9sZGVyLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLkRTSF9JTlBVVF9TVFlMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzIycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEZvbGRlck5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdEZvbGRlck5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdEZvbGRlck5hbWUudHJpbSgpKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucmVuYW1lRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCwgZWRpdEZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2FzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdEZvbGRlck5hbWUudHJpbSgpKSBhd2FpdCBnbG9iYWxUcmVlU3RvcmUucmVuYW1lRm9sZGVyKHdzLnBhdGgsIGZvbGRlci5pZCwgZWRpdEZvbGRlck5hbWUudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0ZvbGRlcklkKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEVkaXRpbmdGb2xkZXJJZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgZm9udFdlaWdodDogNTAwIH19IG9uRG91YmxlQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0ZvbGRlcklkKGZvbGRlci5pZCk7IHNldEVkaXRGb2xkZXJOYW1lKGZvbGRlci5uYW1lKSB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZvbGRlci5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxMXB4JywgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyB9fT4oe2ZvbGRlclNlc3Npb25zLmxlbmd0aH0pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogXHVEODNDXHVERjFGIFx1NjU4N1x1NEVGNlx1NTkzOVx1NjRDRFx1NEY1Q1x1NjgwRlx1RkYxQVx1NTMwNVx1NTQyQiBbK10gXHU1NzI4XHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU3NkY0XHU2M0E1XHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbGRlci1hY3Rpb25zXCIgc3R5bGU9e3sgZGlzcGxheTogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fSBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JywgZGlzcGxheTogJ2lubGluZS1mbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1NzI4XHU2QjY0XHU2NTg3XHU0RUY2XHU1OTM5XHU0RTBCXHU2NUIwXHU1RUZBXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUNyZWF0ZVNlc3Npb25JbkZvbGRlcih3cy53b3Jrc3BhY2VJZCwgd3MucGF0aCwgZm9sZGVyLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGx1c0ljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JywgZGlzcGxheTogJ2lubGluZS1mbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU5MUNEXHU1NDdEXHU1NDBEXHU2NTg3XHU0RUY2XHU1OTM5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0RWRpdGluZ0ZvbGRlcklkKGZvbGRlci5pZCk7IHNldEVkaXRGb2xkZXJOYW1lKGZvbGRlci5uYW1lKSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0SWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICcjZjg3MTcxJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzkgKFx1NTE4NVx1OTBFOFx1NEYxQVx1OEJERFx1OEZENFx1NTZERVx1NjcyQVx1NTIwNlx1N0M3QilcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gZ2xvYmFsVHJlZVN0b3JlLmRlbGV0ZUZvbGRlcih3cy5wYXRoLCBmb2xkZXIuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBGb2xkZXIgSW50ZXJuYWwgU2Vzc2lvbnMgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICB7IWZvbGRlci5jb2xsYXBzZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FwOiAnMXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiAnMTZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmb2xkZXJTZXNzaW9ucy5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWxUaW1lID0gZm9ybWF0UmVsYXRpdmVUaW1lKHMudXBkYXRlZEF0KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwIDZweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LDI1NSwyNTUsMC4wNikpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogaXNBY3RpdmUgPyAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWJ1c2luZXNzLXByaW1hcnksICM5M2M1ZmQpJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgI2NiZDVlMSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IGlzQWN0aXZlID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdiYWNrZ3JvdW5kIDAuMTJzIGVhc2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlT3BlblNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdTZXNzaW9uSWQocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRTZXNzaW9uVGl0bGUocy50aXRsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0KSBhY3Quc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bSkgdG0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0ID0gZS5jdXJyZW50VGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5zZXNzLWFjdCcpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzZweCcsIG1pbldpZHRoOiAwLCBmbGV4OiAxLCBwb2ludGVyRXZlbnRzOiBlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gJ2F1dG8nIDogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MucnVubmluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJ1bm5pbmdEb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5wZW5kaW5nSW50ZXJhY3Rpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5jb21wbGV0ZWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDb21wbGV0ZWREb3Qgc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5pc1Bpbm5lZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFBpbkljb24gc2l6ZT17MTJ9IHBpbm5lZD17dHJ1ZX0gc3R5bGU9e3sgY29sb3I6ICcjZmJiZjI0JywgZmxleFNocmluazogMCB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoYXRJY29uIHNpemU9ezEzfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCBvcGFjaXR5OiAwLjYgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkID09PSBzLmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICc2cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRTZXNzaW9uVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0U2Vzc2lvblRpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IGhhbmRsZVNhdmVSZW5hbWVTZXNzaW9uKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEVkaXRpbmdTZXNzaW9uSWQobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdTZXNzaW9uSWQgIT09IHMuaWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwic2Vzcy10aW1lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBzLnJ1bm5pbmcgPyAnIzYwYTVmYScgOiBzLmNvbXBsZXRlZCA/ICcjNGFkZTgwJyA6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2NDc0OGIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiBzLmNvbXBsZXRlZCA/IDUwMCA6IDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gJ1x1NzUxRlx1NjIxMFx1NEUyRCcgOiBzLmNvbXBsZXRlZCA/ICdcdTVERjJcdTVCOENcdTYyMTAnIDogcmVsVGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NEYxQVx1OEJERFx1NjBBQ1x1NTA1Q1x1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVx1N0VDNCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlc3MtYWN0XCIgc3R5bGU9e3sgZGlzcGxheTogJ25vbmUnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiBzLmlzUGlubmVkID8gJyNmYmJmMjQnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3MuaXNQaW5uZWQgPyAnXHU1M0Q2XHU2RDg4XHU3RjZFXHU5ODc2JyA6ICdcdTdGNkVcdTk4NzZcdTRGMUFcdThCREQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBnbG9iYWxUcmVlU3RvcmUudG9nZ2xlUGluU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXtzLmlzUGlubmVkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTkxQ0RcdTU0N0RcdTU0MERcdTRGMUFcdThCRERcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0aW5nU2Vzc2lvbklkKHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIwNlx1NTNDOVx1NEYxQVx1OEJERCAoRm9yaylcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JrU2Vzc2lvbj8uKHMuaWQgYXMgdW5rbm93biBhcyBTZXNzaW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JrSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NzlGQlx1NTJBOFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjJDOVx1ODNEQ1x1NTM1NVx1NjMwOVx1OTRBRSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAncmdiYSg5NiwgMTY1LCAyNTAsIDAuMiknIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gJyM2MGE1ZmEnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NzlGQlx1NTJBOFx1NEYxQVx1OEJERFx1ODFGM1x1NTE3Nlx1NEVENlx1NjU4N1x1NEVGNlx1NTkzOVx1NjIxNlx1NjcyQVx1NTIwNlx1N0M3Qi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkKGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gbnVsbCA6IHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3ZlVG9Gb2xkZXJJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlbmRlck1vdmVEcm9wZG93bihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBiYWNrZ3JvdW5kOiAndHJhbnNwYXJlbnQnLCBib3JkZXI6ICdub25lJywgY29sb3I6ICcjZjg3MTcxJywgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcycHgnIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjIwXHU5NjY0XHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlRGVsZXRlU2Vzc2lvbih3cy5wYXRoLCBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2hJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH0pfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQi4gVW5jYXRlZ29yaXplZCBTZXNzaW9ucyAoU29ydGVkIGJ5IHRpbWUgKyBQaW5uZWQgRmlyc3QgKyAxMCBMaW1pdCkgKi99XG4gICAgICAgICAgICAgICAgICB7dmlzaWJsZVVuY2F0ZWdvcml6ZWQubWFwKChzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlU2Vzc2lvbklkID09PSBzLmlkXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbFRpbWUgPSBmb3JtYXRSZWxhdGl2ZVRpbWUocy51cGRhdGVkQXQpXG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3MuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAgNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMjU1LDI1NSwyNTUsMC4wNikpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBpc0FjdGl2ZSA/ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtYnVzaW5lc3MtcHJpbWFyeSwgIzkzYzVmZCknIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjY2JkNWUxKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IGlzQWN0aXZlID8gNjAwIDogNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYmFja2dyb3VuZCAwLjEycyBlYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVPcGVuU2Vzc2lvbihzLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0U2Vzc2lvblRpdGxlKHMudGl0bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3QgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtYWN0JykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG0gPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLnNlc3MtdGltZScpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3QpIGFjdC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG0pIHRtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdCA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy1hY3QnKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bSA9IGUuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCcuc2Vzcy10aW1lJykgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdCkgYWN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtKSB0bS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc2cHgnLCBtaW5XaWR0aDogMCwgZmxleDogMSwgcG9pbnRlckV2ZW50czogZWRpdGluZ1Nlc3Npb25JZCA9PT0gcy5pZCA/ICdhdXRvJyA6ICdub25lJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3MucnVubmluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UnVubmluZ0RvdCBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IHMucGVuZGluZ0ludGVyYWN0aW9uID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQZW5kaW5nRG90IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiBzLmNvbXBsZXRlZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q29tcGxldGVkRG90IHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcy5pc1Bpbm5lZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGluSWNvbiBzaXplPXsxMn0gcGlubmVkPXt0cnVlfSBzdHlsZT17eyBjb2xvcjogJyNmYmJmMjQnLCBmbGV4U2hyaW5rOiAwIH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENoYXRJY29uIHNpemU9ezEzfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCBvcGFjaXR5OiAwLjYgfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1Nlc3Npb25JZCA9PT0gcy5pZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uRFNIX0lOUFVUX1NUWUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0U2Vzc2lvblRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0U2Vzc2lvblRpdGxlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4gaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgaGFuZGxlU2F2ZVJlbmFtZVNlc3Npb24ocy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0RWRpdGluZ1Nlc3Npb25JZChudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3MudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtlZGl0aW5nU2Vzc2lvbklkICE9PSBzLmlkICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzZXNzLXRpbWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHMucnVubmluZyA/ICcjNjBhNWZhJyA6IHMuY29tcGxldGVkID8gJyM0YWRlODAnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogcy5jb21wbGV0ZWQgPyA1MDAgOiA0MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4U2hyaW5rOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cy5ydW5uaW5nID8gJ1x1NzUxRlx1NjIxMFx1NEUyRCcgOiBzLmNvbXBsZXRlZCA/ICdcdTVERjJcdTVCOENcdTYyMTAnIDogcmVsVGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NEYxQVx1OEJERFx1NjBBQ1x1NTA1Q1x1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVx1N0VDNCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2Vzcy1hY3RcIiBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiBzLmlzUGlubmVkID8gJyNmYmJmMjQnIDogJ3ZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzY0NzQ4YiknLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17cy5pc1Bpbm5lZCA/ICdcdTUzRDZcdTZEODhcdTdGNkVcdTk4NzYnIDogJ1x1N0Y2RVx1OTg3Nlx1NEYxQVx1OEJERCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsb2JhbFRyZWVTdG9yZS50b2dnbGVQaW5TZXNzaW9uKHdzLnBhdGgsIHMuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQaW5JY29uIHNpemU9ezEyfSBwaW5uZWQ9e3MuaXNQaW5uZWR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU5MUNEXHU1NDdEXHU1NDBEXHU0RjFBXHU4QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ1Nlc3Npb25JZChzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFNlc3Npb25UaXRsZShzLnRpdGxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEljb24gc2l6ZT17MTJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50JywgYm9yZGVyOiAnbm9uZScsIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiXHU1MjA2XHU1M0M5XHU0RjFBXHU4QkREIChGb3JrKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLmZvcmtTZXNzaW9uPy4ocy5pZCBhcyB1bmtub3duIGFzIFNlc3Npb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEZvcmtJY29uIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFx1NzlGQlx1NTJBOFx1ODFGM1x1NjU4N1x1NEVGNlx1NTkzOVx1NEUwQlx1NjJDOVx1ODNEQ1x1NTM1NVx1NjMwOVx1OTRBRSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZGlzcGxheTogJ2lubGluZS1mbGV4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtb3ZlLW1lbnUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGFjdGl2ZU1vdmVNZW51U2Vzc2lvbklkID09PSBzLmlkID8gJ3JnYmEoOTYsIDE2NSwgMjUwLCAwLjIpJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYWN0aXZlTW92ZU1lbnVTZXNzaW9uSWQgPT09IHMuaWQgPyAnIzYwYTVmYScgOiAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNjQ3NDhiKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJcdTc5RkJcdTUyQThcdTRGMUFcdThCRERcdTgxRjNcdTY1ODdcdTRFRjZcdTU5MzkuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVNb3ZlTWVudVNlc3Npb25JZChhY3RpdmVNb3ZlTWVudVNlc3Npb25JZCA9PT0gcy5pZCA/IG51bGwgOiBzLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TW92ZVRvRm9sZGVySWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVuZGVyTW92ZURyb3Bkb3duKHMuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJyNmODcxNzEnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlx1NTIyMFx1OTY2NFx1NEYxQVx1OEJERFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZURlbGV0ZVNlc3Npb24od3MucGF0aCwgcy5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoSWNvbiBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfSl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBcdTVDNTVcdTVGMDBcdTUxNzZcdTRGNTkgTiBcdTRFMkFcdTRGMUFcdThCREQgKi99XG4gICAgICAgICAgICAgICAgICB7IXNob3dBbGwgJiYgcmVtYWluaW5nQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDhweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzExcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IChlLmN1cnJlbnRUYXJnZXQuc3R5bGUuY29sb3IgPSAndmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICNmZmYpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4gKGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICd2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5NGEzYjgpJyl9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0FsbFNlc3Npb25zTWFwKChwcmV2KSA9PiAoeyAuLi5wcmV2LCBbd3Mud29ya3NwYWNlSWRdOiB0cnVlIH0pKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIFx1NUM1NVx1NUYwMFx1NTE3Nlx1NEY1OSB7cmVtYWluaW5nQ291bnR9IFx1NEUyQVx1NEYxQVx1OEJERFxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBcdUQ4M0NcdURGMUYgXHU2RTMyXHU2N0QzIERTSCBcdTUzOUZcdTc1MUYgZGlyZWN0b3J5RmxvdyBcdTVCNTBcdTY5RkRcdTRGNEQgKFx1NjJDOVx1OEQ3NyBEU0ggXHU4MUVBXHU4RUFCXHU4MUVBXHU1RTI2XHU3Njg0XHU3NkVFXHU1RjU1XHU5MDA5XHU2MkU5XHU1RjM5XHU3QTk3XHU2MjE2XHU3Q0ZCXHU3RURGXHU5MDA5XHU2MkU5XHU1NjY4KSAqL31cbiAgICAgIHtwcm9wcy5yZW5kZXJTbG90Py4oJ3NpZGViYXIud29ya3NwYWNlcy5kaXJlY3RvcnlGbG93JywgZmxvd093bmVyKX1cbiAgICA8L2Rpdj5cbiAgKVxufVxuIiwgIi8qKlxuICogQ2xpZW50IEFQSSBicmlkZ2UgZm9yIGRzaC13b3Jrc3BhY2UtdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN1YnByb2plY3RJbmZvLCBXb3Jrc3BhY2VUcmVlTWV0YSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcblxuZXhwb3J0IGNvbnN0IFJPVVRFX1BSRUZJWCA9ICcvYXBpL2RzaC13b3Jrc3BhY2UtdHJlZSdcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoVHJlZU1ldGEod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTxXb3Jrc3BhY2VUcmVlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtST1VURV9QUkVGSVh9L21ldGE/d29ya3NwYWNlUm9vdD0ke2VuY29kZVVSSUNvbXBvbmVudCh3b3Jrc3BhY2VSb290KX1gKVxuICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBtZXRhOiBXb3Jrc3BhY2VUcmVlTWV0YSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24ubWV0YSA6IG51bGxcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdbZHNoLXdvcmtzcGFjZS10cmVlXSBGYWlsZWQgdG8gZmV0Y2ggbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVRyZWVNZXRhKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEpOiBQcm9taXNlPFdvcmtzcGFjZVRyZWVNZXRhIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vbWV0YWAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHdvcmtzcGFjZVJvb3QsIG1ldGEgfSksXG4gICAgfSlcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBqc29uID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIHsgc3VjY2VzczogYm9vbGVhbjsgbWV0YTogV29ya3NwYWNlVHJlZU1ldGEgfVxuICAgIHJldHVybiBqc29uLnN1Y2Nlc3MgPyBqc29uLm1ldGEgOiBudWxsXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignW2RzaC13b3Jrc3BhY2UtdHJlZV0gRmFpbGVkIHRvIHNhdmUgbWV0YTonLCBlcnIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhblN1YnByb2plY3RzKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFByb21pc2U8U3VicHJvamVjdEluZm9bXT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1JPVVRFX1BSRUZJWH0vc2Nhbj93b3Jrc3BhY2VSb290PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdvcmtzcGFjZVJvb3QpfWApXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBbXVxuICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzLmpzb24oKSkgYXMgeyBzdWNjZXNzOiBib29sZWFuOyBzdWJwcm9qZWN0czogU3VicHJvamVjdEluZm9bXSB9XG4gICAgcmV0dXJuIGpzb24uc3VjY2VzcyA/IGpzb24uc3VicHJvamVjdHMgOiBbXVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tkc2gtd29ya3NwYWNlLXRyZWVdIEZhaWxlZCB0byBzY2FuIHN1YnByb2plY3RzOicsIGVycilcbiAgICByZXR1cm4gW11cbiAgfVxufVxuIiwgIi8qKlxuICogTXVsdGktV29ya3NwYWNlIFJlYWN0aXZlIFRyZWVTdG9yZSBmb3IgbWFuYWdpbmcgdmlydHVhbCBmb2xkZXJzLCBzdWJwcm9qZWN0cyxcbiAqIGFuZCBzZXNzaW9uIHBsYWNlbWVudHMgYWNyb3NzIGFsbCB3b3Jrc3BhY2VzIGNvbmN1cnJlbnRseS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFZpcnR1YWxGb2xkZXIsIFdvcmtzcGFjZVRyZWVNZXRhLCBTdWJwcm9qZWN0SW5mbyB9IGZyb20gJy4uL3NoYXJlZC90eXBlcy50cydcbmltcG9ydCB7IGZldGNoVHJlZU1ldGEsIHNhdmVUcmVlTWV0YSwgc2NhblN1YnByb2plY3RzIH0gZnJvbSAnLi9hcGkudHMnXG5cbmV4cG9ydCB0eXBlIExpc3RlbmVyID0gKCkgPT4gdm9pZFxuXG5jb25zdCBERUZBVUxUX01FVEEgPSAod29ya3NwYWNlUm9vdDogc3RyaW5nKTogV29ya3NwYWNlVHJlZU1ldGEgPT4gKHtcbiAgdmVyc2lvbjogMSxcbiAgaW5ib3hTZXNzaW9uSWRzOiBbXSxcbiAgcGlubmVkU2Vzc2lvbklkczogW10sXG4gIGZvbGRlcnM6IFtdLFxuICBzdWJwcm9qZWN0czogW10sXG4gIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbn0pXG5cbmV4cG9ydCBjbGFzcyBUcmVlU3RvcmUge1xuICBwcml2YXRlIGNhY2hlOiBNYXA8c3RyaW5nLCBXb3Jrc3BhY2VUcmVlTWV0YT4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSBsaXN0ZW5lcnM6IFNldDxMaXN0ZW5lcj4gPSBuZXcgU2V0KClcbiAgcHJpdmF0ZSBpc1NhdmluZ01hcDogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwKClcbiAgcHJpdmF0ZSB2ZXJzaW9uID0gMFxuXG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBnZXRWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvblxuICB9XG5cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHRoaXMudmVyc2lvbisrXG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgbGlzdGVuZXIoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbWV0YWRhdGEgZm9yIGEgc3BlY2lmaWMgd29ya3NwYWNlIHBhdGguXG4gICAqL1xuICBnZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3Q6IHN0cmluZyk6IFdvcmtzcGFjZVRyZWVNZXRhIHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QpIHJldHVybiBERUZBVUxUX01FVEEoJycpXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNhY2hlLmdldCh3b3Jrc3BhY2VSb290KVxuICAgIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nXG5cbiAgICBjb25zdCBmcmVzaCA9IERFRkFVTFRfTUVUQSh3b3Jrc3BhY2VSb290KVxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIGZyZXNoKVxuICAgIC8vIEFzeW5jIGxvYWQgaW4gYmFja2dyb3VuZFxuICAgIHRoaXMubG9hZFdvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIHJldHVybiBmcmVzaFxuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgbWV0YWRhdGEgZnJvbSBiYWNrZW5kIGZvciBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGxvYWRXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF3b3Jrc3BhY2VSb290KSByZXR1cm5cbiAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBmZXRjaFRyZWVNZXRhKHdvcmtzcGFjZVJvb3QpXG4gICAgaWYgKGxvYWRlZCkge1xuICAgICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwge1xuICAgICAgICAuLi5sb2FkZWQsXG4gICAgICAgIHBpbm5lZFNlc3Npb25JZHM6IEFycmF5LmlzQXJyYXkobG9hZGVkLnBpbm5lZFNlc3Npb25JZHMpID8gbG9hZGVkLnBpbm5lZFNlc3Npb25JZHMgOiBbXSxcbiAgICAgIH0pXG4gICAgICB0aGlzLm5vdGlmeSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBmb2xkZXIgdW5kZXIgYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGNvbG9yOiBzdHJpbmcgPSAnIzYwYTVmYScpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB0cmltbWVkID0gbmFtZS50cmltKCkgfHwgJ1x1NjVCMFx1NUVGQVx1NjU4N1x1NEVGNlx1NTkzOSdcbiAgICBjb25zdCBpZCA9IGBmLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gXG4gICAgY29uc3QgbmV3Rm9sZGVyOiBWaXJ0dWFsRm9sZGVyID0ge1xuICAgICAgaWQsXG4gICAgICBuYW1lOiB0cmltbWVkLFxuICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgIGNvbG9yLFxuICAgICAgc2Vzc2lvbklkczogW10sXG4gICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogWy4uLm1ldGEuZm9sZGVycywgbmV3Rm9sZGVyXSxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyByZW5hbWVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpXG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm5cblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgbmFtZTogdHJpbW1lZCB9IDogZikpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIGZvbGRlciBpbiBhIHNwZWNpZmljIHdvcmtzcGFjZS5cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUZvbGRlcih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIGZvbGRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogbWV0YS5mb2xkZXJzLmZpbHRlcigoZikgPT4gZi5pZCAhPT0gZm9sZGVySWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBjb2xsYXBzZSBzdGF0dXMgb2YgYSBmb2xkZXIgaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVGb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sbGFwc2VkOiAhZi5jb2xsYXBzZWQgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29sb3IgZm9yIGEgZm9sZGVyIGluIGEgc3BlY2lmaWMgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgc2V0Rm9sZGVyQ29sb3Iod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBjb2xvcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YUZvcldvcmtzcGFjZSh3b3Jrc3BhY2VSb290KVxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IG1ldGEuZm9sZGVycy5tYXAoKGYpID0+IChmLmlkID09PSBmb2xkZXJJZCA/IHsgLi4uZiwgY29sb3IgfSA6IGYpKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlIGEgc2Vzc2lvbiBpbnRvIGEgc3BlY2lmaWMgZm9sZGVyIG9yIHRvIHVuY2F0ZWdvcml6ZWQgKHRhcmdldEZvbGRlcklkID0gbnVsbCkuXG4gICAqL1xuICBhc3luYyBtb3ZlU2Vzc2lvbih3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nLCB0YXJnZXRGb2xkZXJJZDogc3RyaW5nIHwgbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICBjb25zdCB1cGRhdGVkRm9sZGVycyA9IG1ldGEuZm9sZGVycy5tYXAoKGZvbGRlcikgPT4ge1xuICAgICAgY29uc3QgZmlsdGVyZWQgPSBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKVxuICAgICAgaWYgKHRhcmdldEZvbGRlcklkICE9PSBudWxsICYmIGZvbGRlci5pZCA9PT0gdGFyZ2V0Rm9sZGVySWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5mb2xkZXIsXG4gICAgICAgICAgY29sbGFwc2VkOiBmYWxzZSwgLy8gXHVEODNDXHVERjFGIFx1NzlGQlx1NTE2NVx1NjIxNlx1NjVCMFx1NUVGQVx1NjVGNlx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1NEYxQVx1OEJERFx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgICAgICAgIHNlc3Npb25JZHM6IFtzZXNzaW9uSWQsIC4uLmZpbHRlcmVkXSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uZm9sZGVyLFxuICAgICAgICBzZXNzaW9uSWRzOiBmaWx0ZXJlZCxcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgdXBkYXRlZDogV29ya3NwYWNlVHJlZU1ldGEgPSB7XG4gICAgICAuLi5tZXRhLFxuICAgICAgZm9sZGVyczogdXBkYXRlZEZvbGRlcnMsXG4gICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZS5zZXQod29ya3NwYWNlUm9vdCwgdXBkYXRlZClcbiAgICB0aGlzLm5vdGlmeSgpXG4gICAgYXdhaXQgdGhpcy5wZXJzaXN0KHdvcmtzcGFjZVJvb3QpXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3bHkgY3JlYXRlZCBzZXNzaW9uIGRpcmVjdGx5IGludG8gYSBmb2xkZXIuXG4gICAqL1xuICBhc3luYyBhZGRTZXNzaW9uVG9Gb2xkZXIod29ya3NwYWNlUm9vdDogc3RyaW5nLCBmb2xkZXJJZDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubW92ZVNlc3Npb24od29ya3NwYWNlUm9vdCwgc2Vzc2lvbklkLCBmb2xkZXJJZClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgcGlubmVkIHN0YXR1cyBvZiBhIHNlc3Npb24gaW4gYSBzcGVjaWZpYyB3b3Jrc3BhY2UuXG4gICAqL1xuICBhc3luYyB0b2dnbGVQaW5TZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgY3VycmVudFBpbm5lZCA9IG5ldyBTZXQobWV0YS5waW5uZWRTZXNzaW9uSWRzIHx8IFtdKVxuICAgIGlmIChjdXJyZW50UGlubmVkLmhhcyhzZXNzaW9uSWQpKSB7XG4gICAgICBjdXJyZW50UGlubmVkLmRlbGV0ZShzZXNzaW9uSWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRQaW5uZWQuYWRkKHNlc3Npb25JZClcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkOiBXb3Jrc3BhY2VUcmVlTWV0YSA9IHtcbiAgICAgIC4uLm1ldGEsXG4gICAgICBwaW5uZWRTZXNzaW9uSWRzOiBBcnJheS5mcm9tKGN1cnJlbnRQaW5uZWQpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuY2FjaGUuc2V0KHdvcmtzcGFjZVJvb3QsIHVwZGF0ZWQpXG4gICAgdGhpcy5ub3RpZnkoKVxuICAgIGF3YWl0IHRoaXMucGVyc2lzdCh3b3Jrc3BhY2VSb290KVxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlbHkgcmVtb3ZlIGEgZGVsZXRlZCBzZXNzaW9uIGZyb20gYWxsIGZvbGRlcnMgYW5kIHBpbm5lZCBsaXN0IGluIGEgd29ya3NwYWNlLlxuICAgKi9cbiAgYXN5bmMgcHVyZ2VTZXNzaW9uKHdvcmtzcGFjZVJvb3Q6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhRm9yV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QpXG4gICAgY29uc3QgdXBkYXRlZEZvbGRlcnMgPSBtZXRhLmZvbGRlcnMubWFwKChmb2xkZXIpID0+ICh7XG4gICAgICAuLi5mb2xkZXIsXG4gICAgICBzZXNzaW9uSWRzOiBmb2xkZXIuc2Vzc2lvbklkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gc2Vzc2lvbklkKSxcbiAgICB9KSlcbiAgICBjb25zdCB1cGRhdGVkUGlubmVkID0gKG1ldGEucGlubmVkU2Vzc2lvbklkcyB8fCBbXSkuZmlsdGVyKChpZCkgPT4gaWQgIT09IHNlc3Npb25JZClcblxuICAgIGNvbnN0IHVwZGF0ZWQ6IFdvcmtzcGFjZVRyZWVNZXRhID0ge1xuICAgICAgLi4ubWV0YSxcbiAgICAgIGZvbGRlcnM6IHVwZGF0ZWRGb2xkZXJzLFxuICAgICAgcGlubmVkU2Vzc2lvbklkczogdXBkYXRlZFBpbm5lZCxcbiAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlLnNldCh3b3Jrc3BhY2VSb290LCB1cGRhdGVkKVxuICAgIHRoaXMubm90aWZ5KClcbiAgICBhd2FpdCB0aGlzLnBlcnNpc3Qod29ya3NwYWNlUm9vdClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCh3b3Jrc3BhY2VSb290OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXdvcmtzcGFjZVJvb3QgfHwgdGhpcy5pc1NhdmluZ01hcC5nZXQod29ya3NwYWNlUm9vdCkpIHJldHVyblxuICAgIHRoaXMuaXNTYXZpbmdNYXAuc2V0KHdvcmtzcGFjZVJvb3QsIHRydWUpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGFGb3JXb3Jrc3BhY2Uod29ya3NwYWNlUm9vdClcbiAgICAgIGF3YWl0IHNhdmVUcmVlTWV0YSh3b3Jrc3BhY2VSb290LCBtZXRhKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlzU2F2aW5nTWFwLnNldCh3b3Jrc3BhY2VSb290LCBmYWxzZSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdsb2JhbFRyZWVTdG9yZSA9IG5ldyBUcmVlU3RvcmUoKVxuIiwgIi8qKlxuICogRm9ybWF0IHRpbWVzdGFtcCBpbnRvIGNvbmNpc2UgcmVsYXRpdmUgdGltZSBtYXRjaGluZyBEU0ggc3R5bGUgKFwiXHU1MjFBXHU1MjFBXCIsIFwiNVx1NTIwNlx1OTQ5RlwiLCBcIjE2XHU1QzBGXHU2NUY2XCIsIFwiXHU2NjI4XHU1OTI5XCIsIFwiM1x1NTkyOVx1NTI0RFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFJlbGF0aXZlVGltZSh0aW1lc3RhbXA/OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoIXRpbWVzdGFtcCB8fCB0eXBlb2YgdGltZXN0YW1wICE9PSAnbnVtYmVyJykgcmV0dXJuICcnXG4gIGNvbnN0IGRpZmYgPSBEYXRlLm5vdygpIC0gdGltZXN0YW1wXG4gIGlmIChkaWZmIDwgMCkgcmV0dXJuICdcdTUyMUFcdTUyMUEnXG5cbiAgY29uc3Qgc2VjID0gTWF0aC5mbG9vcihkaWZmIC8gMTAwMClcbiAgaWYgKHNlYyA8IDYwKSByZXR1cm4gJ1x1NTIxQVx1NTIxQSdcblxuICBjb25zdCBtaW4gPSBNYXRoLmZsb29yKHNlYyAvIDYwKVxuICBpZiAobWluIDwgNjApIHJldHVybiBgJHttaW59XHU1MjA2XHU5NDlGYFxuXG4gIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW4gLyA2MClcbiAgaWYgKGhvdXJzIDwgMjQpIHJldHVybiBgJHtob3Vyc31cdTVDMEZcdTY1RjZgXG5cbiAgY29uc3QgZGF5cyA9IE1hdGguZmxvb3IoaG91cnMgLyAyNClcbiAgaWYgKGRheXMgPT09IDEpIHJldHVybiAnXHU2NjI4XHU1OTI5J1xuICBpZiAoZGF5cyA8IDMwKSByZXR1cm4gYCR7ZGF5c31cdTU5MjlcdTUyNERgXG5cbiAgY29uc3QgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgcmV0dXJuIGAke2QuZ2V0TW9udGgoKSArIDF9LyR7ZC5nZXREYXRlKCl9YFxufVxuIiwgImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcblxuZXhwb3J0IGNvbnN0IENoZXZyb25SaWdodEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgY2xhc3NOYW1lPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk02IDMuNUwxMC41IDhMNiAxMi41XCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBGb2xkZXJJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IGNvbG9yPzogc3RyaW5nOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTUsXG4gIGNvbG9yLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3sgY29sb3I6IGNvbG9yIHx8ICdjdXJyZW50Q29sb3InLCAuLi5zdHlsZSB9fVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMjVcIlxuICAgICAgZmlsbD17Y29sb3IgPyBgJHtjb2xvcn0yMmAgOiAnY3VycmVudENvbG9yJ31cbiAgICAgIGZpbGxPcGFjaXR5PXtjb2xvciA/IDAuMiA6IDAuMX1cbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQ2hhdEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMyA0QzMgMy40NDc3MiAzLjQ0NzcyIDMgNCAzSDEyQzEyLjU1MjMgMyAxMyAzLjQ0NzcyIDEzIDRWMTBDMTMgMTAuNTUyMyAxMi41NTIzIDExIDEyIDExSDUuNUwzIDEzLjVWNFpcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQbHVzSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk04IDMuNVYxMi41TTMuNSA4SDEyLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS41XCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IFNlYXJjaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjdcIiBjeT1cIjdcIiByPVwiNC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjNcIiAvPlxuICAgIDxwYXRoIGQ9XCJNMTAuNSAxMC41TDEzLjUgMTMuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS4zXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFbGxpcHNpc0ljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDE0LFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPGNpcmNsZSBjeD1cIjMuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiOFwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgICA8Y2lyY2xlIGN4PVwiMTIuNVwiIGN5PVwiOFwiIHI9XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBFZGl0SWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTIsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0xMS41IDIuNUwxMy41IDQuNUw1IDEzSDNWMTFMMTEuNSAyLjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuM1wiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBUcmFzaEljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMy41IDQuNUgxMi41TTYgNC41VjNDNiAyLjQ0NzcyIDYuNDQ3NzIgMiA3IDJIOUM5LjU1MjI4IDIgMTAgMi40NDc3MiAxMCAzVjQuNU00LjUgNC41VjEzQzQuNSAxMy41NTIzIDQuOTQ3NzIgMTQgNS41IDE0SDEwLjVDMTEuMDUyMyAxNCAxMS41IDEzLjU1MjMgMTEuNSAxM1Y0LjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4zXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IEZvcmtJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjExLjVcIiByPVwiMS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICAgIDxjaXJjbGUgY3g9XCI0LjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPGNpcmNsZSBjeD1cIjExLjVcIiBjeT1cIjQuNVwiIHI9XCIxLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuMlwiIC8+XG4gICAgPHBhdGggZD1cIk00LjUgNlYxME0xMS41IDZWNy41QzExLjUgOC42IDEwLjYgOS41IDkuNSA5LjVINC41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjJcIiAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVUb0ZvbGRlckljb246IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHtcbiAgc2l6ZSA9IDEyLFxuICBzdHlsZSxcbn0pID0+IChcbiAgPHN2Z1xuICAgIHdpZHRoPXtzaXplfVxuICAgIGhlaWdodD17c2l6ZX1cbiAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICBmaWxsPVwibm9uZVwiXG4gICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgc3R5bGU9e3N0eWxlfVxuICA+XG4gICAgPHBhdGhcbiAgICAgIGQ9XCJNMiA0LjI1QzIgMy41NTk2NCAyLjU1OTY0IDMgMy4yNSAzSDYuMDg1NzlDNi40MTczMiAzIDYuNzM1MjggMy4xMzE3IDYuOTY5NjcgMy4zNjYxMkw4LjEzMzg4IDQuNTMwMzNDOC4zNjgyNyA0Ljc2NDc1IDguNjg2MjMgNC44OTY0NSA5LjAxNzc3IDQuODk2NDVIMTIuNzVDMTMuNDQwNCA0Ljg5NjQ1IDE0IDUuNDU2MDkgMTQgNi4xNDY0NVYxMS43NUMxNCAxMi40NDA0IDEzLjQ0MDQgMTMgMTIuNzUgMTNIMy4yNUMyLjU1OTY0IDEzIDIgMTIuNDQwNCAyIDExLjc1VjQuMjVaXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuMlwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgOC41SDEwTTggNi41TDEwIDguNUw4IDEwLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yXCJcbiAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IE1vdmVPdXRJY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMixcbiAgc3R5bGUsXG59KSA9PiAoXG4gIDxzdmdcbiAgICB3aWR0aD17c2l6ZX1cbiAgICBoZWlnaHQ9e3NpemV9XG4gICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgZmlsbD1cIm5vbmVcIlxuICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgIHN0eWxlPXtzdHlsZX1cbiAgPlxuICAgIDxwYXRoXG4gICAgICBkPVwiTTYgMy41SDMuNVYxMi41SDEyLjVWMTBNOC41IDIuNUgxMy41VjcuNU03IDlMMTMgM1wiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlV2lkdGg9XCIxLjNcIlxuICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgIC8+XG4gIDwvc3ZnPlxuKVxuXG5leHBvcnQgY29uc3QgQWRkRm9sZGVySWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk0yIDQuMjVDMiAzLjU1OTY0IDIuNTU5NjQgMyAzLjI1IDNINi4wODU3OUM2LjQxNzMyIDMgNi43MzUyOCAzLjEzMTcgNi45Njk2NyAzLjM2NjEyTDguMTMzODggNC41MzAzM0M4LjM2ODI3IDQuNzY0NzUgOC42ODYyMyA0Ljg5NjQ1IDkuMDE3NzcgNC44OTY0NUgxMi43NUMxMy40NDA0IDQuODk2NDUgMTQgNS40NTYwOSAxNCA2LjE0NjQ1VjguNU0yIDQuMjVWMTEuNzVDMiAxMi40NDA0IDIuNTU5NjQgMTMgMy4yNSAxM0g4TTExLjUgMTAuNVYxNC41TTkuNSAxMi41SDEzLjVcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG5cbmV4cG9ydCBjb25zdCBQaW5JY29uOiBSZWFjdC5GQzx7IHNpemU/OiBudW1iZXI7IHBpbm5lZD86IGJvb2xlYW47IHN0eWxlPzogUmVhY3QuQ1NTUHJvcGVydGllcyB9PiA9ICh7XG4gIHNpemUgPSAxMyxcbiAgcGlubmVkID0gZmFsc2UsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk05LjUgM0wxMyA2LjVNNiA2LjVMMy41IDlMNCAxMkwyIDE0TDQgMTJMNyAxMi41TDkuNSAxME02IDYuNUw5LjUgM002IDYuNUw5LjUgMTBcIlxuICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgIHN0cm9rZVdpZHRoPVwiMS4yNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICBmaWxsPXtwaW5uZWQgPyAnY3VycmVudENvbG9yJyA6ICdub25lJ31cbiAgICAvPlxuICA8L3N2Zz5cbilcblxuZXhwb3J0IGNvbnN0IENsb3NlSWNvbjogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoe1xuICBzaXplID0gMTQsXG4gIHN0eWxlLFxufSkgPT4gKFxuICA8c3ZnXG4gICAgd2lkdGg9e3NpemV9XG4gICAgaGVpZ2h0PXtzaXplfVxuICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgIGZpbGw9XCJub25lXCJcbiAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICBzdHlsZT17c3R5bGV9XG4gID5cbiAgICA8cGF0aFxuICAgICAgZD1cIk00IDRMMTIgMTJNMTIgNEw0IDEyXCJcbiAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICBzdHJva2VXaWR0aD1cIjEuNVwiXG4gICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgLz5cbiAgPC9zdmc+XG4pXG4iLCAiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG4vKipcbiAqIEFuaW1hdGVkIFB1bHNlIEluZGljYXRvciBmb3IgcnVubmluZy9zdHJlYW1pbmcgc2Vzc2lvbnMgbWF0Y2hpbmcgRFNIIGRlc2lnbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFJ1bm5pbmdEb3Q6IFJlYWN0LkZDPHsgc2l6ZT86IG51bWJlcjsgc3R5bGU/OiBSZWFjdC5DU1NQcm9wZXJ0aWVzIH0+ID0gKHsgc2l6ZSA9IDE0LCBzdHlsZSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPHNwYW5cbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtZmxleCcsXG4gICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXG4gICAgICAgIHdpZHRoOiBgJHtzaXplfXB4YCxcbiAgICAgICAgaGVpZ2h0OiBgJHtzaXplfXB4YCxcbiAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgIGZsZXhTaHJpbms6IDAsXG4gICAgICAgIC4uLnN0eWxlLFxuICAgICAgfX1cbiAgICAgIHRpdGxlPVwiXHU2QjYzXHU1NzI4XHU1QkY5XHU4QkREXHU0RTBFXHU3NTFGXHU2MjEwXHU0RTJELi4uXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC43NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAncmdiYSg5NiwgMTY1LCAyNTAsIDAuNCknLFxuICAgICAgICAgIGFuaW1hdGlvbjogJ2RzaC1wdWxzZSAxLjVzIGN1YmljLWJlemllcigwLjI0LCAwLCAwLjM4LCAxKSBpbmZpbml0ZScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICB3aWR0aDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2l6ZSAqIDAuNDV9cHhgLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgYmFja2dyb3VuZDogJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1idXNpbmVzcy1wcmltYXJ5LCAjNjBhNWZhKScsXG4gICAgICAgICAgYm94U2hhZG93OiAnMCAwIDZweCByZ2JhKDk2LCAxNjUsIDI1MCwgMC44KScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHN0eWxlPntgXG4gICAgICAgIEBrZXlmcmFtZXMgZHNoLXB1bHNlIHtcbiAgICAgICAgICAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgICAgNTAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjYpOyBvcGFjaXR5OiAwOyB9XG4gICAgICAgICAgMTAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMDsgfVxuICAgICAgICB9XG4gICAgICBgfTwvc3R5bGU+XG4gICAgPC9zcGFuPlxuICApXG59XG5cbi8qKlxuICogQW1iZXIgRG90IGZvciBzZXNzaW9ucyB3YWl0aW5nIG9uIHVzZXIgaW50ZXJhY3Rpb24gKHF1ZXN0aW9ucy9hcHByb3ZhbHMpLlxuICovXG5leHBvcnQgY29uc3QgUGVuZGluZ0RvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTdCNDlcdTVGODVcdTRFQTRcdTRFOTIgKFx1NUJBMVx1NjI3OS9cdTc4NkVcdThCQTQpXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHdpZHRoOiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgaGVpZ2h0OiBgJHtzaXplICogMC40NX1weGAsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAnI2ZiYmYyNCcsXG4gICAgICAgICAgYm94U2hhZG93OiAnMCAwIDZweCByZ2JhKDI1MSwgMTkxLCAzNiwgMC42KScsXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgIDwvc3Bhbj5cbiAgKVxufVxuXG4vKipcbiAqIEdyZWVuIERvdCBmb3IgY29tcGxldGVkL3VucmVhZCBzZXNzaW9ucyAoZmluaXNoZWQgaW4gYmFja2dyb3VuZCwgd2FpdGluZyB0byBiZSByZWFkKS5cbiAqL1xuZXhwb3J0IGNvbnN0IENvbXBsZXRlZERvdDogUmVhY3QuRkM8eyBzaXplPzogbnVtYmVyOyBzdHlsZT86IFJlYWN0LkNTU1Byb3BlcnRpZXMgfT4gPSAoeyBzaXplID0gMTQsIHN0eWxlIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1mbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcbiAgICAgICAgd2lkdGg6IGAke3NpemV9cHhgLFxuICAgICAgICBoZWlnaHQ6IGAke3NpemV9cHhgLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgZmxleFNocmluazogMCxcbiAgICAgICAgLi4uc3R5bGUsXG4gICAgICB9fVxuICAgICAgdGl0bGU9XCJcdTVERjJcdTYyNjdcdTg4NENcdTVCOENcdTZCRDUgKFx1NjcyQVx1OEJGQilcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjc1fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDc0LCAyMjIsIDEyOCwgMC4yNSknLFxuICAgICAgICAgIGFuaW1hdGlvbjogJ2RzaC1jb21wbGV0ZWQtcHVsc2UgMi4ycyBjdWJpYy1iZXppZXIoMC4yNCwgMCwgMC4zOCwgMSkgaW5maW5pdGUnLFxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgd2lkdGg6IGAke3NpemUgKiAwLjQ4fXB4YCxcbiAgICAgICAgICBoZWlnaHQ6IGAke3NpemUgKiAwLjQ4fXB4YCxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICcjNGFkZTgwJyxcbiAgICAgICAgICBib3hTaGFkb3c6ICcwIDAgNnB4IHJnYmEoNzQsIDIyMiwgMTI4LCAwLjgpJyxcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgICA8c3R5bGU+e2BcbiAgICAgICAgQGtleWZyYW1lcyBkc2gtY29tcGxldGVkLXB1bHNlIHtcbiAgICAgICAgICAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgICAgNTAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjUpOyBvcGFjaXR5OiAwLjE1OyB9XG4gICAgICAgICAgMTAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMC44KTsgb3BhY2l0eTogMC44OyB9XG4gICAgICAgIH1cbiAgICAgIGB9PC9zdHlsZT5cbiAgICA8L3NwYW4+XG4gIClcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0FBLG1CQUFrRjs7O0FDTTNFLElBQU0sZUFBZTtBQUU1QixlQUFzQixjQUFjLGVBQTBEO0FBQzVGLE1BQUk7QUFDRixVQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsWUFBWSx1QkFBdUIsbUJBQW1CLGFBQWEsQ0FBQyxFQUFFO0FBQ2pHLFFBQUksQ0FBQyxJQUFJLEdBQUksUUFBTztBQUNwQixVQUFNLE9BQVEsTUFBTSxJQUFJLEtBQUs7QUFDN0IsV0FBTyxLQUFLLFVBQVUsS0FBSyxPQUFPO0FBQUEsRUFDcEMsU0FBUyxLQUFLO0FBQ1osWUFBUSxLQUFLLDhDQUE4QyxHQUFHO0FBQzlELFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSxlQUFzQixhQUFhLGVBQXVCLE1BQTREO0FBQ3BILE1BQUk7QUFDRixVQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsWUFBWSxTQUFTO0FBQUEsTUFDOUMsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxNQUM5QyxNQUFNLEtBQUssVUFBVSxFQUFFLGVBQWUsS0FBSyxDQUFDO0FBQUEsSUFDOUMsQ0FBQztBQUNELFFBQUksQ0FBQyxJQUFJLEdBQUksUUFBTztBQUNwQixVQUFNLE9BQVEsTUFBTSxJQUFJLEtBQUs7QUFDN0IsV0FBTyxLQUFLLFVBQVUsS0FBSyxPQUFPO0FBQUEsRUFDcEMsU0FBUyxLQUFLO0FBQ1osWUFBUSxLQUFLLDZDQUE2QyxHQUFHO0FBQzdELFdBQU87QUFBQSxFQUNUO0FBQ0Y7OztBQ3hCQSxJQUFNLGVBQWUsQ0FBQyxtQkFBOEM7QUFBQSxFQUNsRSxTQUFTO0FBQUEsRUFDVCxpQkFBaUIsQ0FBQztBQUFBLEVBQ2xCLGtCQUFrQixDQUFDO0FBQUEsRUFDbkIsU0FBUyxDQUFDO0FBQUEsRUFDVixhQUFhLENBQUM7QUFBQSxFQUNkLFdBQVcsS0FBSyxJQUFJO0FBQ3RCO0FBRU8sSUFBTSxZQUFOLE1BQWdCO0FBQUEsRUFDYixRQUF3QyxvQkFBSSxJQUFJO0FBQUEsRUFDaEQsWUFBMkIsb0JBQUksSUFBSTtBQUFBLEVBQ25DLGNBQW9DLG9CQUFJLElBQUk7QUFBQSxFQUM1QyxVQUFVO0FBQUEsRUFFbEIsY0FBYztBQUFBLEVBQUM7QUFBQSxFQUVmLGFBQXFCO0FBQ25CLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVBLFVBQVUsVUFBZ0M7QUFDeEMsU0FBSyxVQUFVLElBQUksUUFBUTtBQUMzQixXQUFPLE1BQU07QUFDWCxXQUFLLFVBQVUsT0FBTyxRQUFRO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBQUEsRUFFUSxTQUFlO0FBQ3JCLFNBQUs7QUFDTCxlQUFXLFlBQVksS0FBSyxXQUFXO0FBQ3JDLGVBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0Esb0JBQW9CLGVBQTBDO0FBQzVELFFBQUksQ0FBQyxjQUFlLFFBQU8sYUFBYSxFQUFFO0FBQzFDLFVBQU0sV0FBVyxLQUFLLE1BQU0sSUFBSSxhQUFhO0FBQzdDLFFBQUksU0FBVSxRQUFPO0FBRXJCLFVBQU0sUUFBUSxhQUFhLGFBQWE7QUFDeEMsU0FBSyxNQUFNLElBQUksZUFBZSxLQUFLO0FBRW5DLFNBQUssY0FBYyxhQUFhO0FBQ2hDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGNBQWMsZUFBc0M7QUFDeEQsUUFBSSxDQUFDLGNBQWU7QUFDcEIsVUFBTSxTQUFTLE1BQU0sY0FBYyxhQUFhO0FBQ2hELFFBQUksUUFBUTtBQUNWLFdBQUssTUFBTSxJQUFJLGVBQWU7QUFBQSxRQUM1QixHQUFHO0FBQUEsUUFDSCxrQkFBa0IsTUFBTSxRQUFRLE9BQU8sZ0JBQWdCLElBQUksT0FBTyxtQkFBbUIsQ0FBQztBQUFBLE1BQ3hGLENBQUM7QUFDRCxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFhLGVBQXVCQSxPQUFjLFFBQWdCLFdBQTRCO0FBQ2xHLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sVUFBVUEsTUFBSyxLQUFLLEtBQUs7QUFDL0IsVUFBTSxLQUFLLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3BFLFVBQU0sWUFBMkI7QUFBQSxNQUMvQjtBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBLFlBQVksQ0FBQztBQUFBLE1BQ2IsV0FBVyxLQUFLLElBQUk7QUFBQSxJQUN0QjtBQUVBLFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTLENBQUMsR0FBRyxLQUFLLFNBQVMsU0FBUztBQUFBLE1BQ3BDLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDdEI7QUFFQSxTQUFLLE1BQU0sSUFBSSxlQUFlLE9BQU87QUFDckMsU0FBSyxPQUFPO0FBQ1osVUFBTSxLQUFLLFFBQVEsYUFBYTtBQUNoQyxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFhLGVBQXVCLFVBQWtCQSxPQUE2QjtBQUN2RixVQUFNLE9BQU8sS0FBSyxvQkFBb0IsYUFBYTtBQUNuRCxVQUFNLFVBQVVBLE1BQUssS0FBSztBQUMxQixRQUFJLENBQUMsUUFBUztBQUVkLFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTLEtBQUssUUFBUSxJQUFJLENBQUMsTUFBTyxFQUFFLE9BQU8sV0FBVyxFQUFFLEdBQUcsR0FBRyxNQUFNLFFBQVEsSUFBSSxDQUFFO0FBQUEsTUFDbEYsV0FBVyxLQUFLLElBQUk7QUFBQSxJQUN0QjtBQUVBLFNBQUssTUFBTSxJQUFJLGVBQWUsT0FBTztBQUNyQyxTQUFLLE9BQU87QUFDWixVQUFNLEtBQUssUUFBUSxhQUFhO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sYUFBYSxlQUF1QixVQUFpQztBQUN6RSxVQUFNLE9BQU8sS0FBSyxvQkFBb0IsYUFBYTtBQUNuRCxVQUFNLFVBQTZCO0FBQUEsTUFDakMsR0FBRztBQUFBLE1BQ0gsU0FBUyxLQUFLLFFBQVEsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLFFBQVE7QUFBQSxNQUNyRCxXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFhLGVBQXVCLFVBQWlDO0FBQ3pFLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTLEtBQUssUUFBUSxJQUFJLENBQUMsTUFBTyxFQUFFLE9BQU8sV0FBVyxFQUFFLEdBQUcsR0FBRyxXQUFXLENBQUMsRUFBRSxVQUFVLElBQUksQ0FBRTtBQUFBLElBQzlGO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxlQUFlLGVBQXVCLFVBQWtCLE9BQThCO0FBQzFGLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTLEtBQUssUUFBUSxJQUFJLENBQUMsTUFBTyxFQUFFLE9BQU8sV0FBVyxFQUFFLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBRTtBQUFBLElBQzVFO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxZQUFZLGVBQXVCLFdBQW1CLGdCQUE4QztBQUN4RyxVQUFNLE9BQU8sS0FBSyxvQkFBb0IsYUFBYTtBQUNuRCxVQUFNLGlCQUFpQixLQUFLLFFBQVEsSUFBSSxDQUFDLFdBQVc7QUFDbEQsWUFBTSxXQUFXLE9BQU8sV0FBVyxPQUFPLENBQUMsT0FBTyxPQUFPLFNBQVM7QUFDbEUsVUFBSSxtQkFBbUIsUUFBUSxPQUFPLE9BQU8sZ0JBQWdCO0FBQzNELGVBQU87QUFBQSxVQUNMLEdBQUc7QUFBQSxVQUNILFdBQVc7QUFBQTtBQUFBLFVBQ1gsWUFBWSxDQUFDLFdBQVcsR0FBRyxRQUFRO0FBQUEsUUFDckM7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLFFBQ0wsR0FBRztBQUFBLFFBQ0gsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLENBQUM7QUFFRCxVQUFNLFVBQTZCO0FBQUEsTUFDakMsR0FBRztBQUFBLE1BQ0gsU0FBUztBQUFBLE1BQ1QsV0FBVyxLQUFLLElBQUk7QUFBQSxJQUN0QjtBQUVBLFNBQUssTUFBTSxJQUFJLGVBQWUsT0FBTztBQUNyQyxTQUFLLE9BQU87QUFDWixVQUFNLEtBQUssUUFBUSxhQUFhO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sbUJBQW1CLGVBQXVCLFVBQWtCLFdBQWtDO0FBQ2xHLFVBQU0sS0FBSyxZQUFZLGVBQWUsV0FBVyxRQUFRO0FBQUEsRUFDM0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0saUJBQWlCLGVBQXVCLFdBQWtDO0FBQzlFLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0sZ0JBQWdCLElBQUksSUFBSSxLQUFLLG9CQUFvQixDQUFDLENBQUM7QUFDekQsUUFBSSxjQUFjLElBQUksU0FBUyxHQUFHO0FBQ2hDLG9CQUFjLE9BQU8sU0FBUztBQUFBLElBQ2hDLE9BQU87QUFDTCxvQkFBYyxJQUFJLFNBQVM7QUFBQSxJQUM3QjtBQUVBLFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxrQkFBa0IsTUFBTSxLQUFLLGFBQWE7QUFBQSxNQUMxQyxXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFhLGVBQXVCLFdBQWtDO0FBQzFFLFVBQU0sT0FBTyxLQUFLLG9CQUFvQixhQUFhO0FBQ25ELFVBQU0saUJBQWlCLEtBQUssUUFBUSxJQUFJLENBQUMsWUFBWTtBQUFBLE1BQ25ELEdBQUc7QUFBQSxNQUNILFlBQVksT0FBTyxXQUFXLE9BQU8sQ0FBQyxPQUFPLE9BQU8sU0FBUztBQUFBLElBQy9ELEVBQUU7QUFDRixVQUFNLGlCQUFpQixLQUFLLG9CQUFvQixDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sT0FBTyxTQUFTO0FBRW5GLFVBQU0sVUFBNkI7QUFBQSxNQUNqQyxHQUFHO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxrQkFBa0I7QUFBQSxNQUNsQixXQUFXLEtBQUssSUFBSTtBQUFBLElBQ3RCO0FBRUEsU0FBSyxNQUFNLElBQUksZUFBZSxPQUFPO0FBQ3JDLFNBQUssT0FBTztBQUNaLFVBQU0sS0FBSyxRQUFRLGFBQWE7QUFBQSxFQUNsQztBQUFBLEVBRUEsTUFBYyxRQUFRLGVBQXNDO0FBQzFELFFBQUksQ0FBQyxpQkFBaUIsS0FBSyxZQUFZLElBQUksYUFBYSxFQUFHO0FBQzNELFNBQUssWUFBWSxJQUFJLGVBQWUsSUFBSTtBQUN4QyxRQUFJO0FBQ0YsWUFBTSxPQUFPLEtBQUssb0JBQW9CLGFBQWE7QUFDbkQsWUFBTSxhQUFhLGVBQWUsSUFBSTtBQUFBLElBQ3hDLFVBQUU7QUFDQSxXQUFLLFlBQVksSUFBSSxlQUFlLEtBQUs7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFDRjtBQUVPLElBQU0sa0JBQWtCLElBQUksVUFBVTs7O0FDclF0QyxTQUFTLG1CQUFtQixXQUE0QjtBQUM3RCxNQUFJLENBQUMsYUFBYSxPQUFPLGNBQWMsU0FBVSxRQUFPO0FBQ3hELFFBQU0sT0FBTyxLQUFLLElBQUksSUFBSTtBQUMxQixNQUFJLE9BQU8sRUFBRyxRQUFPO0FBRXJCLFFBQU0sTUFBTSxLQUFLLE1BQU0sT0FBTyxHQUFJO0FBQ2xDLE1BQUksTUFBTSxHQUFJLFFBQU87QUFFckIsUUFBTSxNQUFNLEtBQUssTUFBTSxNQUFNLEVBQUU7QUFDL0IsTUFBSSxNQUFNLEdBQUksUUFBTyxHQUFHLEdBQUc7QUFFM0IsUUFBTSxRQUFRLEtBQUssTUFBTSxNQUFNLEVBQUU7QUFDakMsTUFBSSxRQUFRLEdBQUksUUFBTyxHQUFHLEtBQUs7QUFFL0IsUUFBTSxPQUFPLEtBQUssTUFBTSxRQUFRLEVBQUU7QUFDbEMsTUFBSSxTQUFTLEVBQUcsUUFBTztBQUN2QixNQUFJLE9BQU8sR0FBSSxRQUFPLEdBQUcsSUFBSTtBQUU3QixRQUFNLElBQUksSUFBSSxLQUFLLFNBQVM7QUFDNUIsU0FBTyxHQUFHLEVBQUUsU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztBQUMzQzs7O0FDVEk7QUFaRyxJQUFNLG1CQUFpRyxDQUFDO0FBQUEsRUFDN0csT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLGFBQXVGLENBQUM7QUFBQSxFQUNuRyxPQUFPO0FBQUEsRUFDUDtBQUFBLEVBQ0E7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTixPQUFPLEVBQUUsT0FBTyxTQUFTLGdCQUFnQixHQUFHLE1BQU07QUFBQSxJQUVsRDtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osTUFBTSxRQUFRLEdBQUcsS0FBSyxPQUFPO0FBQUEsUUFDN0IsYUFBYSxRQUFRLE1BQU07QUFBQSxRQUMzQixnQkFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQTtBQUNGO0FBR0ssSUFBTSxXQUFxRSxDQUFDO0FBQUEsRUFDakYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLFdBQXFFLENBQUM7QUFBQSxFQUNqRixPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQTtBQUFBLElBQ2pCO0FBQUE7QUFDRjtBQUdLLElBQU0sYUFBdUUsQ0FBQztBQUFBLEVBQ25GLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsa0RBQUMsWUFBTyxJQUFHLEtBQUksSUFBRyxLQUFJLEdBQUUsT0FBTSxRQUFPLGdCQUFlLGFBQVksT0FBTTtBQUFBLE1BQ3RFLDRDQUFDLFVBQUssR0FBRSx3QkFBdUIsUUFBTyxnQkFBZSxhQUFZLE9BQU0sZUFBYyxTQUFRO0FBQUE7QUFBQTtBQUMvRjtBQUdLLElBQU0sZUFBeUUsQ0FBQztBQUFBLEVBQ3JGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsa0RBQUMsWUFBTyxJQUFHLE9BQU0sSUFBRyxLQUFJLEdBQUUsT0FBTSxNQUFLLGdCQUFlO0FBQUEsTUFDcEQsNENBQUMsWUFBTyxJQUFHLEtBQUksSUFBRyxLQUFJLEdBQUUsT0FBTSxNQUFLLGdCQUFlO0FBQUEsTUFDbEQsNENBQUMsWUFBTyxJQUFHLFFBQU8sSUFBRyxLQUFJLEdBQUUsT0FBTSxNQUFLLGdCQUFlO0FBQUE7QUFBQTtBQUN2RDtBQUdLLElBQU0sV0FBcUUsQ0FBQztBQUFBLEVBQ2pGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxHQUFFO0FBQUEsUUFDRixRQUFPO0FBQUEsUUFDUCxhQUFZO0FBQUEsUUFDWixlQUFjO0FBQUEsUUFDZCxnQkFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQTtBQUNGO0FBR0ssSUFBTSxZQUFzRSxDQUFDO0FBQUEsRUFDbEYsT0FBTztBQUFBLEVBQ1A7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUE7QUFBQSxJQUNqQjtBQUFBO0FBQ0Y7QUFHSyxJQUFNLFdBQXFFLENBQUM7QUFBQSxFQUNqRixPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLGtEQUFDLFlBQU8sSUFBRyxPQUFNLElBQUcsUUFBTyxHQUFFLE9BQU0sUUFBTyxnQkFBZSxhQUFZLE9BQU07QUFBQSxNQUMzRSw0Q0FBQyxZQUFPLElBQUcsT0FBTSxJQUFHLE9BQU0sR0FBRSxPQUFNLFFBQU8sZ0JBQWUsYUFBWSxPQUFNO0FBQUEsTUFDMUUsNENBQUMsWUFBTyxJQUFHLFFBQU8sSUFBRyxPQUFNLEdBQUUsT0FBTSxRQUFPLGdCQUFlLGFBQVksT0FBTTtBQUFBLE1BQzNFLDRDQUFDLFVBQUssR0FBRSxzREFBcUQsUUFBTyxnQkFBZSxhQUFZLE9BQU07QUFBQTtBQUFBO0FBQ3ZHO0FBR0ssSUFBTSxtQkFBNkUsQ0FBQztBQUFBLEVBQ3pGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUE7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLEdBQUU7QUFBQSxVQUNGLFFBQU87QUFBQSxVQUNQLGFBQVk7QUFBQSxVQUNaLGdCQUFlO0FBQUE7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLEdBQUU7QUFBQSxVQUNGLFFBQU87QUFBQSxVQUNQLGFBQVk7QUFBQSxVQUNaLGVBQWM7QUFBQSxVQUNkLGdCQUFlO0FBQUE7QUFBQSxNQUNqQjtBQUFBO0FBQUE7QUFDRjtBQUdLLElBQU0sY0FBd0UsQ0FBQztBQUFBLEVBQ3BGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxHQUFFO0FBQUEsUUFDRixRQUFPO0FBQUEsUUFDUCxhQUFZO0FBQUEsUUFDWixlQUFjO0FBQUEsUUFDZCxnQkFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQTtBQUNGO0FBR0ssSUFBTSxnQkFBMEUsQ0FBQztBQUFBLEVBQ3RGLE9BQU87QUFBQSxFQUNQO0FBQ0YsTUFDRTtBQUFBLEVBQUM7QUFBQTtBQUFBLElBQ0MsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsU0FBUTtBQUFBLElBQ1IsTUFBSztBQUFBLElBQ0wsT0FBTTtBQUFBLElBQ047QUFBQSxJQUVBO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxHQUFFO0FBQUEsUUFDRixRQUFPO0FBQUEsUUFDUCxhQUFZO0FBQUEsUUFDWixlQUFjO0FBQUEsUUFDZCxnQkFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQTtBQUNGO0FBR0ssSUFBTSxVQUFzRixDQUFDO0FBQUEsRUFDbEcsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1Q7QUFDRixNQUNFO0FBQUEsRUFBQztBQUFBO0FBQUEsSUFDQyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixTQUFRO0FBQUEsSUFDUixNQUFLO0FBQUEsSUFDTCxPQUFNO0FBQUEsSUFDTjtBQUFBLElBRUE7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLEdBQUU7QUFBQSxRQUNGLFFBQU87QUFBQSxRQUNQLGFBQVk7QUFBQSxRQUNaLGVBQWM7QUFBQSxRQUNkLGdCQUFlO0FBQUEsUUFDZixNQUFNLFNBQVMsaUJBQWlCO0FBQUE7QUFBQSxJQUNsQztBQUFBO0FBQ0Y7QUFHSyxJQUFNLFlBQXNFLENBQUM7QUFBQSxFQUNsRixPQUFPO0FBQUEsRUFDUDtBQUNGLE1BQ0U7QUFBQSxFQUFDO0FBQUE7QUFBQSxJQUNDLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVE7QUFBQSxJQUNSLE1BQUs7QUFBQSxJQUNMLE9BQU07QUFBQSxJQUNOO0FBQUEsSUFFQTtBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsR0FBRTtBQUFBLFFBQ0YsUUFBTztBQUFBLFFBQ1AsYUFBWTtBQUFBLFFBQ1osZUFBYztBQUFBLFFBQ2QsZ0JBQWU7QUFBQTtBQUFBLElBQ2pCO0FBQUE7QUFDRjs7O0FDMVNFLElBQUFDLHNCQUFBO0FBRkcsSUFBTSxhQUF1RSxDQUFDLEVBQUUsT0FBTyxJQUFJLE1BQU0sTUFBTTtBQUM1RyxTQUNFO0FBQUEsSUFBQztBQUFBO0FBQUEsTUFDQyxPQUFPO0FBQUEsUUFDTCxTQUFTO0FBQUEsUUFDVCxZQUFZO0FBQUEsUUFDWixnQkFBZ0I7QUFBQSxRQUNoQixPQUFPLEdBQUcsSUFBSTtBQUFBLFFBQ2QsUUFBUSxHQUFHLElBQUk7QUFBQSxRQUNmLFVBQVU7QUFBQSxRQUNWLFlBQVk7QUFBQSxRQUNaLEdBQUc7QUFBQSxNQUNMO0FBQUEsTUFDQSxPQUFNO0FBQUEsTUFFTjtBQUFBO0FBQUEsVUFBQztBQUFBO0FBQUEsWUFDQyxPQUFPO0FBQUEsY0FDTCxVQUFVO0FBQUEsY0FDVixPQUFPLEdBQUcsT0FBTyxJQUFJO0FBQUEsY0FDckIsUUFBUSxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3RCLGNBQWM7QUFBQSxjQUNkLFlBQVk7QUFBQSxjQUNaLFdBQVc7QUFBQSxZQUNiO0FBQUE7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsT0FBTyxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3JCLFFBQVEsR0FBRyxPQUFPLElBQUk7QUFBQSxjQUN0QixjQUFjO0FBQUEsY0FDZCxZQUFZO0FBQUEsY0FDWixXQUFXO0FBQUEsWUFDYjtBQUFBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsNkNBQUMsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQU1OO0FBQUE7QUFBQTtBQUFBLEVBQ0o7QUFFSjtBQUtPLElBQU0sYUFBdUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxNQUFNLE1BQU07QUFDNUcsU0FDRTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsWUFBWTtBQUFBLFFBQ1osZ0JBQWdCO0FBQUEsUUFDaEIsT0FBTyxHQUFHLElBQUk7QUFBQSxRQUNkLFFBQVEsR0FBRyxJQUFJO0FBQUEsUUFDZixVQUFVO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixHQUFHO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTTtBQUFBLE1BRU47QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLE9BQU87QUFBQSxZQUNMLE9BQU8sR0FBRyxPQUFPLElBQUk7QUFBQSxZQUNyQixRQUFRLEdBQUcsT0FBTyxJQUFJO0FBQUEsWUFDdEIsY0FBYztBQUFBLFlBQ2QsWUFBWTtBQUFBLFlBQ1osV0FBVztBQUFBLFVBQ2I7QUFBQTtBQUFBLE1BQ0Y7QUFBQTtBQUFBLEVBQ0Y7QUFFSjtBQUtPLElBQU0sZUFBeUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxNQUFNLE1BQU07QUFDOUcsU0FDRTtBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0MsT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsWUFBWTtBQUFBLFFBQ1osZ0JBQWdCO0FBQUEsUUFDaEIsT0FBTyxHQUFHLElBQUk7QUFBQSxRQUNkLFFBQVEsR0FBRyxJQUFJO0FBQUEsUUFDZixVQUFVO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixHQUFHO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTTtBQUFBLE1BRU47QUFBQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsT0FBTyxHQUFHLE9BQU8sSUFBSTtBQUFBLGNBQ3JCLFFBQVEsR0FBRyxPQUFPLElBQUk7QUFBQSxjQUN0QixjQUFjO0FBQUEsY0FDZCxZQUFZO0FBQUEsY0FDWixXQUFXO0FBQUEsWUFDYjtBQUFBO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE9BQU87QUFBQSxjQUNMLFVBQVU7QUFBQSxjQUNWLE9BQU8sR0FBRyxPQUFPLElBQUk7QUFBQSxjQUNyQixRQUFRLEdBQUcsT0FBTyxJQUFJO0FBQUEsY0FDdEIsY0FBYztBQUFBLGNBQ2QsWUFBWTtBQUFBLGNBQ1osV0FBVztBQUFBLFlBQ2I7QUFBQTtBQUFBLFFBQ0Y7QUFBQSxRQUNBLDZDQUFDLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FNTjtBQUFBO0FBQUE7QUFBQSxFQUNKO0FBRUo7OztBTDJWUSxJQUFBQyxzQkFBQTtBQXBiUixJQUFNLHdCQUF3QjtBQUk5QixTQUFTLG1CQUFtQixJQUFZLE9BQWdCLFVBQVUsT0FBTyxXQUFXLE9BQWdCO0FBQ2xHLE1BQUksU0FBVSxRQUFPO0FBQ3JCLE1BQUksUUFBUyxRQUFPO0FBQ3BCLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsTUFBSSxVQUFVLEdBQUksUUFBTztBQUN6QixNQUFJLHdCQUF3QixLQUFLLEtBQUssRUFBRyxRQUFPO0FBQ2hELFNBQU87QUFDVDtBQUVBLElBQU0sa0JBQXVDO0FBQUEsRUFDM0MsV0FBVztBQUFBLEVBQ1gsU0FBUztBQUFBLEVBQ1QsY0FBYztBQUFBLEVBQ2QsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsWUFBWTtBQUFBLEVBQ1osU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUNkO0FBU0EsSUFBTSxvQkFBb0I7QUFBQSxFQUN4QixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixRQUFRO0FBQUEsSUFDUixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsSUFDVixPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsT0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFdBQVc7QUFBQSxJQUNULElBQUk7QUFBQSxJQUNKLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLE9BQU87QUFBQSxJQUNQLGFBQWE7QUFBQSxFQUNmO0FBQ0Y7QUFFTyxJQUFNLDJCQUFvRSxDQUFDLFVBQVU7QUFFMUY7QUFBQSxJQUNFLENBQUMsT0FBTyxnQkFBZ0IsVUFBVSxFQUFFO0FBQUEsSUFDcEMsTUFBTSxnQkFBZ0IsV0FBVztBQUFBLEVBQ25DO0FBRUEsTUFBSSxrQkFJQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLG9CQUFvQixDQUFDLEVBQUU7QUFFeEMsTUFBSTtBQUNGLFFBQUksTUFBTSxlQUFlO0FBQ3ZCLHdCQUFrQixNQUFNLGNBQWMsQ0FBQyxNQUFXLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLG9CQUFvQixDQUFDLEVBQUU7QUFBQSxJQUM5RjtBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBRVI7QUFFQSxRQUFNLENBQUMsb0JBQW9CLHFCQUFxQixRQUFJLHVCQUFzQixvQkFBSSxJQUFJLENBQUM7QUFDbkYsUUFBTSxDQUFDLGFBQWEsY0FBYyxRQUFJLHVCQUFTLEVBQUU7QUFDakQsUUFBTSxDQUFDLFlBQVksYUFBYSxRQUFJLHVCQUFTLEtBQUs7QUFDbEQsUUFBTSxDQUFDLGdCQUFnQixpQkFBaUIsUUFBSSx1QkFBUyxLQUFLO0FBQzFELFFBQU0sQ0FBQyxrQkFBa0IsbUJBQW1CLFFBQUksdUJBQVMsRUFBRTtBQUMzRCxRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixRQUFJLHVCQUFTLEtBQUs7QUFDMUQsUUFBTSxDQUFDLFlBQVksYUFBYSxRQUFJLHVCQUF3QixJQUFJO0FBQ2hFLFFBQU0sQ0FBQyxnQkFBZ0IsaUJBQWlCLFFBQUksdUJBQXdCLElBQUk7QUFDeEUsUUFBTSxDQUFDLGFBQWEsY0FBYyxRQUFJLHVCQUF3QixJQUFJO0FBQ2xFLFFBQU0sQ0FBQyxhQUFhLGNBQWMsUUFBSSx1QkFBUyxFQUFFO0FBQ2pELFFBQU0sQ0FBQyxzQkFBc0IsdUJBQXVCLFFBQUksdUJBQXdCLElBQUk7QUFDcEYsUUFBTSxDQUFDLGVBQWUsZ0JBQWdCLFFBQUksdUJBQVMsRUFBRTtBQUNyRCxRQUFNLENBQUMsaUJBQWlCLGtCQUFrQixRQUFJLHVCQUF3QixJQUFJO0FBQzFFLFFBQU0sQ0FBQyxnQkFBZ0IsaUJBQWlCLFFBQUksdUJBQVMsRUFBRTtBQUd2RCxRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixRQUFJLHVCQUFzQixvQkFBSSxJQUFJLENBQUM7QUFDM0UsUUFBTSxxQkFBaUIscUJBQTZCLG9CQUFJLElBQUksQ0FBQztBQUc3RCxRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixRQUFJLHVCQUF3QixJQUFJO0FBQzVFLFFBQU0sQ0FBQyxrQkFBa0IsbUJBQW1CLFFBQUksdUJBQVMsRUFBRTtBQUczRCxRQUFNLENBQUMseUJBQXlCLDBCQUEwQixRQUFJLHVCQUF3QixJQUFJO0FBRTFGLFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLFFBQUksdUJBQWtDLENBQUMsQ0FBQztBQUV4RixRQUFNLGNBQVUscUJBQXVCLElBQUk7QUFFM0MsOEJBQVUsTUFBTTtBQUNkLFVBQU0sb0JBQW9CLENBQUMsTUFBa0I7QUFDM0MsVUFBSSxRQUFRLFdBQVcsQ0FBQyxRQUFRLFFBQVEsU0FBUyxFQUFFLE1BQWMsR0FBRztBQUNsRSwwQkFBa0IsSUFBSTtBQUFBLE1BQ3hCO0FBQ0EsWUFBTSxTQUFTLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sUUFBUSxzQkFBc0IsS0FBSyxDQUFDLE9BQU8sUUFBUSxnQkFBZ0IsR0FBRztBQUNoRixtQ0FBMkIsSUFBSTtBQUFBLE1BQ2pDO0FBQUEsSUFDRjtBQUNBLFVBQU0sZ0JBQWdCLENBQUMsTUFBcUI7QUFDMUMsVUFBSSxFQUFFLFFBQVEsVUFBVTtBQUN0QiwwQkFBa0IsSUFBSTtBQUN0QixtQ0FBMkIsSUFBSTtBQUMvQix1QkFBZSxJQUFJO0FBQ25CLGdDQUF3QixJQUFJO0FBQzVCLDJCQUFtQixJQUFJO0FBQ3ZCLDRCQUFvQixJQUFJO0FBQUEsTUFDMUI7QUFBQSxJQUNGO0FBQ0EsV0FBTyxpQkFBaUIsU0FBUyxpQkFBaUI7QUFDbEQsV0FBTyxpQkFBaUIsV0FBVyxhQUFhO0FBQ2hELFdBQU8sTUFBTTtBQUNYLGFBQU8sb0JBQW9CLFNBQVMsaUJBQWlCO0FBQ3JELGFBQU8sb0JBQW9CLFdBQVcsYUFBYTtBQUFBLElBQ3JEO0FBQUEsRUFDRixHQUFHLENBQUMsQ0FBQztBQUVMLE1BQUksZ0JBSUEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRTtBQUV4QixNQUFJO0FBQ0YsUUFBSSxNQUFNLGFBQWE7QUFDckIsc0JBQWdCLE1BQU0sWUFBWSxDQUFDLE1BQVcsQ0FBQyxLQUFLLENBQUM7QUFBQSxJQUN2RDtBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBRVI7QUFFQSxRQUFNLGtCQUFrQixjQUFjO0FBQ3RDLFFBQU0sUUFBa0MsZ0JBQWdCLFNBQVMsQ0FBQztBQUNsRSxRQUFNLHFCQUEyQyxnQkFBZ0Isc0JBQXNCLENBQUM7QUFDeEYsUUFBTSxrQkFBYyxzQkFBUSxNQUFNLElBQUksSUFBSSxtQkFBbUIsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0FBRy9GLDhCQUFVLE1BQU07QUFDZCxlQUFXLE1BQU0sT0FBTztBQUN0QixVQUFJLEdBQUcsTUFBTTtBQUNYLHdCQUFnQixvQkFBb0IsR0FBRyxJQUFJO0FBQUEsTUFDN0M7QUFBQSxJQUNGO0FBQUEsRUFDRixHQUFHLENBQUMsS0FBSyxDQUFDO0FBR1YsOEJBQVUsTUFBTTtBQUNkLFVBQU0sT0FBTyxjQUFjLFFBQVEsQ0FBQztBQUNwQyxVQUFNLFlBQVksSUFBSSxJQUFJLGNBQWM7QUFDeEMsUUFBSSxVQUFVO0FBRWQsZUFBVyxDQUFDLElBQUksT0FBTyxLQUFLLE9BQU8sUUFBUSxJQUFJLEdBQUc7QUFDaEQsVUFBSSxZQUFZLElBQUksRUFBRSxHQUFHO0FBQ3ZCLFlBQUksVUFBVSxJQUFJLEVBQUUsR0FBRztBQUNyQixvQkFBVSxPQUFPLEVBQUU7QUFDbkIsb0JBQVU7QUFBQSxRQUNaO0FBQ0E7QUFBQSxNQUNGO0FBQ0EsWUFBTSxhQUFhLGVBQWUsUUFBUSxJQUFJLEVBQUUsS0FBSztBQUNyRCxZQUFNLGVBQWUsUUFBUSxTQUFTLE9BQU87QUFHN0MsVUFBSSxjQUFjLENBQUMsZ0JBQWdCLE9BQU8saUJBQWlCO0FBQ3pELGtCQUFVLElBQUksRUFBRTtBQUNoQixrQkFBVTtBQUFBLE1BQ1o7QUFHQSxVQUFJLE9BQU8sbUJBQW1CLFVBQVUsSUFBSSxFQUFFLEdBQUc7QUFDL0Msa0JBQVUsT0FBTyxFQUFFO0FBQ25CLGtCQUFVO0FBQUEsTUFDWjtBQUVBLHFCQUFlLFFBQVEsSUFBSSxJQUFJLFlBQVk7QUFBQSxJQUM3QztBQUVBLFFBQUksU0FBUztBQUNYLHdCQUFrQixTQUFTO0FBQUEsSUFDN0I7QUFBQSxFQUNGLEdBQUcsQ0FBQyxjQUFjLE1BQU0saUJBQWlCLFdBQVcsQ0FBQztBQUdyRCxRQUFNLG9CQUFvQixDQUFDLGNBQXNCO0FBQy9DLFFBQUksZUFBZSxJQUFJLFNBQVMsR0FBRztBQUNqQyxZQUFNLE9BQU8sSUFBSSxJQUFJLGNBQWM7QUFDbkMsV0FBSyxPQUFPLFNBQVM7QUFDckIsd0JBQWtCLElBQUk7QUFBQSxJQUN4QjtBQUNBLFVBQU0sT0FBTyxTQUFpQztBQUFBLEVBQ2hEO0FBRUEsOEJBQVUsTUFBTTtBQUNkLFFBQUksTUFBTSxTQUFTLEtBQUssbUJBQW1CLFNBQVMsR0FBRztBQUNyRCxZQUFNLFdBQVcsZ0JBQWdCLHFCQUFxQixNQUFNLENBQUMsR0FBRztBQUNoRSxVQUFJLFVBQVU7QUFDWiw4QkFBc0Isb0JBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLGNBQU0sUUFBUSxNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLFFBQVE7QUFDMUQsWUFBSSxPQUFPLEtBQU0saUJBQWdCLGNBQWMsTUFBTSxJQUFJO0FBQUEsTUFDM0Q7QUFBQSxJQUNGO0FBQUEsRUFDRixHQUFHLENBQUMsT0FBTyxnQkFBZ0IsaUJBQWlCLENBQUM7QUFFN0MsUUFBTSxrQkFBa0IsQ0FBQyxNQUFjLFdBQW1CO0FBQ3hELFVBQU0sT0FBTyxJQUFJLElBQUksa0JBQWtCO0FBQ3ZDLFFBQUksS0FBSyxJQUFJLElBQUksR0FBRztBQUNsQixXQUFLLE9BQU8sSUFBSTtBQUNoQiw0QkFBc0IsQ0FBQyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRTtBQUFBLElBQzlELE9BQU87QUFDTCxXQUFLLElBQUksSUFBSTtBQUNiLHNCQUFnQixjQUFjLE1BQU07QUFBQSxJQUN0QztBQUNBLDBCQUFzQixJQUFJO0FBQUEsRUFDNUI7QUFFQSxRQUFNLHFCQUFxQixPQUFPLFdBQW1CO0FBQ25ELFFBQUksY0FBYyxLQUFLLEdBQUc7QUFDeEIsWUFBTSxnQkFBZ0IsYUFBYSxRQUFRLGNBQWMsS0FBSyxDQUFDO0FBQy9ELHVCQUFpQixFQUFFO0FBQ25CLDhCQUF3QixJQUFJO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBRUEsUUFBTSxxQkFBcUIsT0FBTyxTQUFzQjtBQUN0RCxRQUFJLFlBQVksS0FBSyxLQUFLLE1BQU0saUJBQWlCO0FBQy9DLFlBQU0sTUFBTSxnQkFBZ0IsTUFBTSxZQUFZLEtBQUssQ0FBQztBQUFBLElBQ3REO0FBQ0EsbUJBQWUsSUFBSTtBQUNuQixzQkFBa0IsSUFBSTtBQUFBLEVBQ3hCO0FBRUEsUUFBTSwwQkFBMEIsT0FBTyxjQUFzQjtBQUMzRCxRQUFJLGlCQUFpQixLQUFLLEtBQUssTUFBTSxlQUFlO0FBQ2xELFlBQU0sTUFBTSxjQUFjLFdBQW1DLGlCQUFpQixLQUFLLENBQUM7QUFBQSxJQUN0RjtBQUNBLHdCQUFvQixJQUFJO0FBQUEsRUFDMUI7QUFHQSxRQUFNLHNCQUFzQixPQUFPLFFBQWdCLGNBQXNCO0FBQ3ZFLFFBQUk7QUFDRixVQUFJLGVBQWUsSUFBSSxTQUFTLEdBQUc7QUFDakMsY0FBTSxPQUFPLElBQUksSUFBSSxjQUFjO0FBQ25DLGFBQUssT0FBTyxTQUFTO0FBQ3JCLDBCQUFrQixJQUFJO0FBQUEsTUFDeEI7QUFDQSxZQUFNLGdCQUFnQixhQUFhLFFBQVEsU0FBUztBQUNwRCxVQUFJLE1BQU0sZ0JBQWdCO0FBQ3hCLGNBQU0sTUFBTSxlQUFlLFNBQWlDO0FBQUEsTUFDOUQ7QUFBQSxJQUNGLFNBQVMsS0FBSztBQUNaLGNBQVEsTUFBTSwrQ0FBK0MsR0FBRztBQUFBLElBQ2xFO0FBQUEsRUFDRjtBQUdBLFFBQU0sOEJBQThCLE9BQU8sTUFBbUIsUUFBZ0IsYUFBcUI7QUFDakcsUUFBSSxNQUFNLHNCQUFzQjtBQUM5QixZQUFNLE1BQU0scUJBQXFCLE1BQU0sUUFBUSxRQUFRO0FBQUEsSUFDekQsT0FBTztBQUNMLFlBQU0sZUFBZSxJQUFJO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBR0EsUUFBTSxrQkFBYyxzQkFBUSxNQUFNO0FBQ2hDLFVBQU0sT0FBcUIsQ0FBQztBQUM1QixVQUFNLE9BQU8sY0FBYyxRQUFRLENBQUM7QUFFcEMsZUFBVyxDQUFDLEtBQUssT0FBTyxLQUFLLE9BQU8sUUFBUSxJQUFJLEdBQUc7QUFDakQsVUFBSSxZQUFZLElBQUksR0FBRyxFQUFHO0FBQzFCLFlBQU0sWUFBWSxRQUFRLFNBQVMsT0FBTztBQUMxQyxZQUFNLFlBQVksUUFBUSxTQUFTLGtCQUFrQjtBQUNyRCxZQUFNLHFCQUFxQixRQUFRLFNBQVMsU0FBUyxLQUFLLGVBQWUsSUFBSSxHQUFHLE1BQU0sUUFBUTtBQUU5RixZQUFNLFVBQVUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxHQUFHLFNBQVMsR0FBMkIsQ0FBQztBQUM1RixZQUFNLFFBQVEsU0FBUyxTQUFTLElBQUksTUFBTSxHQUFHLEVBQUU7QUFFL0MsVUFBSSxXQUFXO0FBQ2IsYUFBSyxLQUFLLEVBQUUsV0FBVyxLQUFLLE9BQU8sUUFBUSxXQUFXLElBQUksUUFBUSxDQUFDO0FBQUEsTUFDckUsV0FBVyxXQUFXO0FBQ3BCLGFBQUssS0FBSyxFQUFFLFdBQVcsS0FBSyxPQUFPLFFBQVEsV0FBVyxJQUFJLFFBQVEsQ0FBQztBQUFBLE1BQ3JFLFdBQVcsbUJBQW1CO0FBQzVCLGFBQUssS0FBSyxFQUFFLFdBQVcsS0FBSyxPQUFPLFFBQVEsYUFBYSxJQUFJLFFBQVEsQ0FBQztBQUFBLE1BQ3ZFO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBNkQsRUFBRSxTQUFTLEdBQUcsU0FBUyxHQUFHLFdBQVcsRUFBRTtBQUMxRyxXQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsT0FBTyxNQUFNLEVBQUUsTUFBTSxLQUFLLE1BQU0sTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFO0FBQUEsRUFDNUUsR0FBRyxDQUFDLGNBQWMsTUFBTSxPQUFPLGdCQUFnQixpQkFBaUIsV0FBVyxDQUFDO0FBRzVFLFFBQU0seUJBQXlCLENBQUMsV0FBbUIsWUFBNEI7QUFDN0UsUUFBSSxTQUFTO0FBQ1gsNEJBQXNCLENBQUMsU0FBUyxvQkFBSSxJQUFJLENBQUMsR0FBRyxNQUFNLFFBQVEsV0FBVyxDQUFDLENBQUM7QUFDdkUsWUFBTSxPQUFPLGdCQUFnQixvQkFBb0IsUUFBUSxJQUFJO0FBQzdELFlBQU0sZUFBZSxLQUFLLFFBQVEsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXLFNBQVMsU0FBUyxDQUFDO0FBQzlFLFVBQUksZ0JBQWdCLGFBQWEsV0FBVztBQUMxQyx3QkFBZ0IsYUFBYSxRQUFRLE1BQU0sYUFBYSxFQUFFO0FBQUEsTUFDNUQ7QUFBQSxJQUNGO0FBQ0Esc0JBQWtCLFNBQVM7QUFBQSxFQUM3QjtBQUVBLFFBQU0seUJBQXFCLHNCQUFRLE1BQU07QUFDdkMsUUFBSSxDQUFDLFlBQVksS0FBSyxFQUFHLFFBQU87QUFDaEMsVUFBTSxJQUFJLFlBQVksWUFBWTtBQUNsQyxXQUFPLE1BQU0sT0FBTyxDQUFDLE9BQU87QUFDMUIsWUFBTSxjQUFjLEdBQUcsU0FBUyxJQUFJLFlBQVksRUFBRSxTQUFTLENBQUM7QUFDNUQsWUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUTtBQUN4RCxjQUFNLFNBQVM7QUFDZixZQUFJLFlBQVksSUFBSSxNQUFNLEVBQUcsUUFBTztBQUNwQyxjQUFNLFFBQVEsY0FBYyxPQUFPLE1BQU0sR0FBRyxTQUFTO0FBQ3JELGVBQU8sTUFBTSxZQUFZLEVBQUUsU0FBUyxDQUFDO0FBQUEsTUFDdkMsQ0FBQztBQUNELGFBQU8sY0FBYztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNILEdBQUcsQ0FBQyxPQUFPLGFBQWEsY0FBYyxNQUFNLFdBQVcsQ0FBQztBQUd4RCxRQUFNLENBQUMsVUFBVSxXQUFXLFFBQUksdUJBQVMsS0FBSztBQUM5QyxRQUFNLENBQUMsZUFBZSxnQkFBZ0IsUUFBSSx1QkFBUyxLQUFLO0FBRXhELFFBQU0sWUFBWTtBQUFBLElBQ2hCLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFVBQVUsT0FBTyxTQUFpQjtBQUNoQyx1QkFBaUIsSUFBSTtBQUNyQixVQUFJO0FBQ0YsY0FBTSxNQUFNLE1BQU0sTUFBTSxrQkFBa0IsRUFBRSxLQUFLLENBQUM7QUFDbEQsWUFBSSxLQUFLO0FBQ1AsZ0JBQU0sT0FBUSxJQUFZLGVBQWdCLElBQVk7QUFDdEQsY0FBSSxNQUFNO0FBQ1Isa0NBQXNCLENBQUMsU0FBUyxvQkFBSSxJQUFJLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3hELGtCQUFNLGVBQWUsSUFBSTtBQUFBLFVBQzNCO0FBQ0EsMEJBQWdCLGNBQWMsSUFBSTtBQUFBLFFBQ3BDO0FBQUEsTUFDRixTQUFTLEtBQUs7QUFDWixnQkFBUSxNQUFNLDJEQUEyRCxHQUFHO0FBQUEsTUFDOUUsVUFBRTtBQUNBLHlCQUFpQixLQUFLO0FBQ3RCLG9CQUFZLEtBQUs7QUFDakIsMEJBQWtCLEtBQUs7QUFBQSxNQUN6QjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVUsTUFBTTtBQUNkLGtCQUFZLEtBQUs7QUFBQSxJQUNuQjtBQUFBLElBQ0EsU0FBUyxDQUFDLFFBQWdCO0FBQ3hCLGNBQVEsS0FBSyw4Q0FBOEMsR0FBRztBQUM5RCxrQkFBWSxLQUFLO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBRUEsUUFBTSx5QkFBeUIsTUFBTTtBQUNuQyxrQkFBYyxJQUFJO0FBQ2xCLHdCQUFvQixFQUFFO0FBQ3RCLHNCQUFrQixJQUFJO0FBQ3RCLGtCQUFjLEtBQUs7QUFBQSxFQUNyQjtBQUVBLFFBQU0sbUJBQW1CLFlBQVk7QUFDbkMsZ0JBQVksSUFBSTtBQUNoQixRQUFJLE1BQU0sZUFBZTtBQUN2QixVQUFJO0FBQ0YsY0FBTSxTQUFTLE1BQU0sTUFBTSxjQUFjO0FBQ3pDLFlBQUksUUFBUTtBQUNWLGdCQUFNLFVBQVUsU0FBUyxNQUFNO0FBQUEsUUFDakM7QUFBQSxNQUNGLFNBQVMsS0FBSztBQUNaLGdCQUFRLEtBQUssOENBQThDLEdBQUc7QUFBQSxNQUNoRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsUUFBTSw0QkFBNEIsT0FBTyxlQUF3QjtBQUMvRCxVQUFNLGNBQWMsY0FBYyxrQkFBa0IsS0FBSztBQUN6RCxRQUFJLENBQUMsWUFBWTtBQUNmLG9CQUFjLGdGQUFlO0FBQzdCO0FBQUEsSUFDRjtBQUNBLHNCQUFrQixJQUFJO0FBQ3RCLGtCQUFjLElBQUk7QUFDbEIsUUFBSTtBQUNGLFlBQU0sTUFBTSxNQUFNLE1BQU0sa0JBQWtCLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDOUQsVUFBSSxLQUFLO0FBQ1AsY0FBTSxPQUFRLElBQVksZUFBZ0IsSUFBWTtBQUN0RCxZQUFJLE1BQU07QUFDUixnQ0FBc0IsQ0FBQyxTQUFTLG9CQUFJLElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDeEQsZ0JBQU0sZUFBZSxJQUFJO0FBQUEsUUFDM0I7QUFDQSx3QkFBZ0IsY0FBYyxVQUFVO0FBQ3hDLDBCQUFrQixLQUFLO0FBQ3ZCLDRCQUFvQixFQUFFO0FBQUEsTUFDeEI7QUFBQSxJQUNGLFNBQVMsS0FBVTtBQUNqQixjQUFRLE1BQU0saURBQWlELEdBQUc7QUFDbEUsb0JBQWMsS0FBSyxXQUFXLHNJQUF3QjtBQUFBLElBQ3hELFVBQUU7QUFDQSx3QkFBa0IsS0FBSztBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUVBLFNBQ0UsOENBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxRQUFRLGVBQWUsVUFBVSxRQUFRLFFBQVEsV0FBVyxRQUFRLFlBQVksUUFBUSxZQUFZLFVBQVUsR0FFbkk7QUFBQSxrREFBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLGdCQUFnQixpQkFBaUIsU0FBUyxpQkFBaUIsT0FBTywyQ0FBMkMsVUFBVSxRQUFRLFlBQVksSUFBSSxHQUNsTTtBQUFBLG1EQUFDLFVBQUssZ0NBQUc7QUFBQSxNQUNULDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxNQUFNLEdBQzlEO0FBQUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE9BQU87QUFBQSxjQUNMLFlBQVksaUJBQWlCLDRCQUE0QjtBQUFBLGNBQ3pELFFBQVE7QUFBQSxjQUNSLE9BQU8saUJBQWlCLFlBQVk7QUFBQSxjQUNwQyxRQUFRO0FBQUEsY0FDUixTQUFTO0FBQUEsY0FDVCxjQUFjO0FBQUEsY0FDZCxTQUFTO0FBQUEsY0FDVCxZQUFZO0FBQUEsWUFDZDtBQUFBLFlBQ0EsT0FBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFlBRVQsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLFFBQ3RCO0FBQUEsUUFDQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsWUFBWSxhQUFhLDRCQUE0QjtBQUFBLGNBQ3JELFFBQVE7QUFBQSxjQUNSLE9BQU8sYUFBYSxZQUFZO0FBQUEsY0FDaEMsUUFBUTtBQUFBLGNBQ1IsU0FBUztBQUFBLGNBQ1QsY0FBYztBQUFBLGNBQ2QsU0FBUztBQUFBLGNBQ1QsWUFBWTtBQUFBLFlBQ2Q7QUFBQSxZQUNBLE9BQU07QUFBQSxZQUNOLFNBQVMsTUFBTTtBQUNiLDRCQUFjLENBQUMsVUFBVTtBQUN6QixnQ0FBa0IsS0FBSztBQUFBLFlBQ3pCO0FBQUEsWUFFQSx1REFBQyxjQUFXLE1BQU0sSUFBSTtBQUFBO0FBQUEsUUFDeEI7QUFBQSxTQUNGO0FBQUEsT0FDRjtBQUFBLElBR0Msa0JBQ0M7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLE9BQU87QUFBQSxVQUNMLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxVQUNULFlBQVk7QUFBQSxVQUNaLGdCQUFnQjtBQUFBLFVBQ2hCLFlBQVk7QUFBQSxVQUNaLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsUUFDQSxTQUFTLE1BQU0sa0JBQWtCLEtBQUs7QUFBQSxRQUV0QztBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsT0FBTztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsVUFBVTtBQUFBLGNBQ1YsY0FBYztBQUFBLGNBQ2QsWUFBWTtBQUFBLGNBQ1osUUFBUTtBQUFBLGNBQ1IsV0FBVztBQUFBLGNBQ1gsU0FBUztBQUFBLGNBQ1QsT0FBTztBQUFBLGNBQ1AsU0FBUztBQUFBLGNBQ1QsZUFBZTtBQUFBLGNBQ2YsS0FBSztBQUFBLFlBQ1A7QUFBQSxZQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsWUFHbEM7QUFBQSw0REFBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLGdCQUFnQixnQkFBZ0IsR0FDbkY7QUFBQSw4REFBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTSxHQUM5RDtBQUFBLCtEQUFDLGNBQVcsTUFBTSxJQUFJLE9BQU0sV0FBVTtBQUFBLGtCQUN0Qyw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsWUFBWSxJQUFJLEdBQUcsMkRBQVU7QUFBQSxtQkFDaEU7QUFBQSxnQkFDQTtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLFdBQVcsUUFBUSxXQUFXLFNBQVMsT0FBTyxTQUFTLGNBQWM7QUFBQSxvQkFDaEksU0FBUyxNQUFNLGtCQUFrQixLQUFLO0FBQUEsb0JBRXRDLHVEQUFDLGFBQVUsTUFBTSxJQUFJO0FBQUE7QUFBQSxnQkFDdkI7QUFBQSxpQkFDRjtBQUFBLGNBR0EsOENBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxRQUFRLGVBQWUsVUFBVSxLQUFLLE1BQU0sR0FDakU7QUFBQSw2REFBQyxXQUFNLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyxVQUFVLEdBQUcsb0VBQXdCO0FBQUEsZ0JBQzlFO0FBQUEsa0JBQUM7QUFBQTtBQUFBLG9CQUNDLFdBQVM7QUFBQSxvQkFDVCxPQUFPO0FBQUEsc0JBQ0wsR0FBRztBQUFBLHNCQUNILE9BQU87QUFBQSxzQkFDUCxRQUFRO0FBQUEsc0JBQ1IsU0FBUztBQUFBLHNCQUNULGNBQWM7QUFBQSxzQkFDZCxVQUFVO0FBQUEsb0JBQ1o7QUFBQSxvQkFDQSxhQUFZO0FBQUEsb0JBQ1osT0FBTztBQUFBLG9CQUNQLFVBQVUsQ0FBQyxNQUFNLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLG9CQUNuRCxXQUFXLENBQUMsTUFBTTtBQUNoQiwwQkFBSSxFQUFFLFFBQVEsUUFBUywyQkFBMEI7QUFDakQsMEJBQUksRUFBRSxRQUFRLFNBQVUsbUJBQWtCLEtBQUs7QUFBQSxvQkFDakQ7QUFBQTtBQUFBLGdCQUNGO0FBQUEsZ0JBQ0MsY0FDQyw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyxVQUFVLEdBQUksc0JBQVc7QUFBQSxpQkFFckU7QUFBQSxjQUdBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFVBQVUsS0FBSyxNQUFNLEdBQ2pFO0FBQUEsNkRBQUMsVUFBSyxPQUFPLEVBQUUsVUFBVSxRQUFRLE9BQU8sVUFBVSxHQUFHLCtEQUFTO0FBQUEsZ0JBQzlELDZDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxVQUFVLFFBQVEsS0FBSyxNQUFNLEdBQ3pELFdBQUMscUJBQXFCLHlCQUF5QixXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQ2hFO0FBQUEsa0JBQUM7QUFBQTtBQUFBLG9CQUVDLE9BQU87QUFBQSxzQkFDTCxZQUFZO0FBQUEsc0JBQ1osUUFBUTtBQUFBLHNCQUNSLE9BQU87QUFBQSxzQkFDUCxjQUFjO0FBQUEsc0JBQ2QsU0FBUztBQUFBLHNCQUNULFVBQVU7QUFBQSxzQkFDVixRQUFRO0FBQUEsc0JBQ1IsWUFBWTtBQUFBLG9CQUNkO0FBQUEsb0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLG9CQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsb0JBQ3pELFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUFBLG9CQUVuQztBQUFBO0FBQUEsa0JBZkk7QUFBQSxnQkFnQlAsQ0FDRCxHQUNIO0FBQUEsaUJBQ0Y7QUFBQSxjQUdBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsZ0JBQWdCLGlCQUFpQixZQUFZLE9BQU8sV0FBVyxzQ0FBc0MsR0FDeEo7QUFBQTtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxPQUFPO0FBQUEsc0JBQ0wsWUFBWTtBQUFBLHNCQUNaLFFBQVE7QUFBQSxzQkFDUixPQUFPO0FBQUEsc0JBQ1AsY0FBYztBQUFBLHNCQUNkLFNBQVM7QUFBQSxzQkFDVCxVQUFVO0FBQUEsc0JBQ1YsUUFBUTtBQUFBLG9CQUNWO0FBQUEsb0JBQ0EsU0FBUztBQUFBLG9CQUNWO0FBQUE7QUFBQSxnQkFFRDtBQUFBLGdCQUNBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxNQUFNLEdBQzlEO0FBQUE7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsT0FBTztBQUFBLHdCQUNMLFlBQVk7QUFBQSx3QkFDWixRQUFRO0FBQUEsd0JBQ1IsT0FBTztBQUFBLHdCQUNQLFNBQVM7QUFBQSx3QkFDVCxVQUFVO0FBQUEsd0JBQ1YsUUFBUTtBQUFBLHNCQUNWO0FBQUEsc0JBQ0EsU0FBUyxNQUFNLGtCQUFrQixLQUFLO0FBQUEsc0JBQ3ZDO0FBQUE7QUFBQSxrQkFFRDtBQUFBLGtCQUNBO0FBQUEsb0JBQUM7QUFBQTtBQUFBLHNCQUNDLFVBQVU7QUFBQSxzQkFDVixPQUFPO0FBQUEsd0JBQ0wsWUFBWTtBQUFBLHdCQUNaLFFBQVE7QUFBQSx3QkFDUixPQUFPO0FBQUEsd0JBQ1AsY0FBYztBQUFBLHdCQUNkLFNBQVM7QUFBQSx3QkFDVCxVQUFVO0FBQUEsd0JBQ1YsWUFBWTtBQUFBLHdCQUNaLFFBQVEsaUJBQWlCLGdCQUFnQjtBQUFBLHdCQUN6QyxTQUFTLGlCQUFpQixNQUFNO0FBQUEsc0JBQ2xDO0FBQUEsc0JBQ0EsU0FBUyxNQUFNLDBCQUEwQjtBQUFBLHNCQUV4QywyQkFBaUIsZ0NBQVk7QUFBQTtBQUFBLGtCQUNoQztBQUFBLG1CQUNGO0FBQUEsaUJBQ0Y7QUFBQTtBQUFBO0FBQUEsUUFDRjtBQUFBO0FBQUEsSUFDRjtBQUFBLElBSUQsY0FDQyw2Q0FBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLGVBQWUsR0FDcEM7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLFdBQVM7QUFBQSxRQUNULE9BQU87QUFBQSxVQUNMLEdBQUc7QUFBQSxVQUNILE9BQU87QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxVQUNULGNBQWM7QUFBQSxRQUNoQjtBQUFBLFFBQ0EsYUFBWTtBQUFBLFFBQ1osT0FBTztBQUFBLFFBQ1AsVUFBVSxDQUFDLE1BQU0sZUFBZSxFQUFFLE9BQU8sS0FBSztBQUFBO0FBQUEsSUFDaEQsR0FDRjtBQUFBLElBSUQsWUFBWSxTQUFTLEtBQ3BCLDZDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsZUFBZSxTQUFTLFFBQVEsZUFBZSxVQUFVLEtBQUssTUFBTSxHQUN4RixzQkFBWSxJQUFJLENBQUMsU0FBUztBQUN6QixZQUFNLE9BQU8sa0JBQWtCLEtBQUssTUFBTTtBQUMxQyxhQUNFO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFFQyxPQUFPO0FBQUEsWUFDTCxTQUFTO0FBQUEsWUFDVCxZQUFZO0FBQUEsWUFDWixnQkFBZ0I7QUFBQSxZQUNoQixRQUFRO0FBQUEsWUFDUixTQUFTO0FBQUEsWUFDVCxjQUFjO0FBQUEsWUFDZCxZQUFZLEtBQUs7QUFBQSxZQUNqQixRQUFRLGFBQWEsS0FBSyxNQUFNO0FBQUEsWUFDaEMsUUFBUTtBQUFBLFlBQ1IsWUFBWTtBQUFBLFVBQ2Q7QUFBQSxVQUNBLE9BQU8sR0FBRyxLQUFLLFdBQVcsNkJBQVMsS0FBSyxXQUFXLGNBQWMsbUNBQVUsRUFBRSx1QkFBUSxLQUFLLElBQUksU0FBUyxnQ0FBTztBQUFBLFVBQzlHLFNBQVMsTUFBTSx1QkFBdUIsS0FBSyxXQUFXLEtBQUssRUFBRTtBQUFBLFVBQzdELGNBQWMsQ0FBQyxNQUFNO0FBQ25CLGNBQUUsY0FBYyxNQUFNLGFBQWEsS0FBSztBQUN4QyxjQUFFLGNBQWMsTUFBTSxjQUFjLEtBQUs7QUFDekMsa0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxlQUFlO0FBQzdELGdCQUFJLFFBQVMsU0FBUSxNQUFNLFFBQVE7QUFBQSxVQUNyQztBQUFBLFVBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsY0FBRSxjQUFjLE1BQU0sYUFBYSxLQUFLO0FBQ3hDLGNBQUUsY0FBYyxNQUFNLGNBQWMsS0FBSztBQUN6QyxrQkFBTSxVQUFVLEVBQUUsY0FBYyxjQUFjLGVBQWU7QUFDN0QsZ0JBQUksUUFBUyxTQUFRLE1BQU0sUUFBUTtBQUFBLFVBQ3JDO0FBQUEsVUFFQTtBQUFBLDBEQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsR0FDbkY7QUFBQSxtQkFBSyxXQUFXLFlBQ2YsNkNBQUMsY0FBVyxNQUFNLElBQUksSUFDcEIsS0FBSyxXQUFXLFlBQ2xCLDZDQUFDLGNBQVcsTUFBTSxJQUFJLElBRXRCLDZDQUFDLGdCQUFhLE1BQU0sSUFBSTtBQUFBLGNBRTFCLDZDQUFDLFVBQUssT0FBTyxFQUFFLFVBQVUsUUFBUSxZQUFZLEtBQUssT0FBTywyQ0FBMkMsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFNBQVMsR0FDcEssZUFBSyxPQUNSO0FBQUEsY0FDQyxLQUFLLElBQUksU0FDUiw4Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyw0Q0FBNEMsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFVBQVUsU0FBUyxJQUFJLEdBQUc7QUFBQTtBQUFBLGdCQUNuSyxLQUFLLEdBQUc7QUFBQSxpQkFDYjtBQUFBLGVBRUo7QUFBQSxZQUVBLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFlBQVksRUFBRSxHQUM3RTtBQUFBO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU87QUFBQSxvQkFDTCxVQUFVO0FBQUEsb0JBQ1YsT0FBTyxLQUFLO0FBQUEsb0JBQ1osWUFBWSxLQUFLO0FBQUEsb0JBQ2pCLFNBQVM7QUFBQSxvQkFDVCxjQUFjO0FBQUEsb0JBQ2QsWUFBWTtBQUFBLG9CQUNaLFlBQVk7QUFBQSxrQkFDZDtBQUFBLGtCQUVDLGVBQUs7QUFBQTtBQUFBLGNBQ1I7QUFBQSxjQUNBLDZDQUFDLFVBQUssV0FBVSxnQkFBZSxPQUFPLEVBQUUsT0FBTyw0Q0FBNEMsYUFBYSxPQUFPLFlBQVksbUJBQW1CLEdBQzVJLHVEQUFDLG9CQUFpQixNQUFNLElBQUksR0FDOUI7QUFBQSxlQUNGO0FBQUE7QUFBQTtBQUFBLFFBL0RLLEtBQUs7QUFBQSxNQWdFWjtBQUFBLElBRUosQ0FBQyxHQUNIO0FBQUEsSUFJRiw2Q0FBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsZUFBZSxVQUFVLEtBQUssT0FBTyxTQUFTLFFBQVEsR0FDbEYsNkJBQW1CLElBQUksQ0FBQyxPQUFPO0FBQzlCLFlBQU0sYUFBYSxtQkFBbUIsSUFBSSxHQUFHLFdBQVc7QUFHeEQsWUFBTSxTQUFTLGdCQUFnQixvQkFBb0IsR0FBRyxJQUFJO0FBQzFELFlBQU0sY0FBYyxJQUFJLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxDQUFDO0FBRXpELFlBQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRO0FBQ3JELGNBQU0sU0FBUztBQUNmLGNBQU0sVUFBVSxjQUFjLE9BQU8sTUFBTTtBQUMzQyxjQUFNLFdBQVcsUUFBUSxTQUFTLGFBQWEsZUFBZSxJQUFJLE1BQU0sQ0FBQztBQUV6RSxlQUFPO0FBQUEsVUFDTCxJQUFJO0FBQUEsVUFDSixPQUFPLFNBQVMsU0FBUyxPQUFPLE1BQU0sR0FBRyxFQUFFO0FBQUEsVUFDM0MsV0FBVyxTQUFTLGFBQWE7QUFBQSxVQUNqQyxTQUFTLFFBQVEsU0FBUyxPQUFPO0FBQUEsVUFDakMsb0JBQW9CLFNBQVM7QUFBQSxVQUM3QixXQUFXLFlBQVksV0FBVztBQUFBLFVBQ2xDLE9BQU8sUUFBUSxTQUFTLEtBQUs7QUFBQSxVQUM3QixVQUFVLFlBQVksSUFBSSxNQUFNO0FBQUEsUUFDbEM7QUFBQSxNQUNGLENBQUM7QUFFRCxZQUFNLGdCQUFnQixZQUNuQixPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNwQyxPQUFPLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFDbkYsS0FBSyxDQUFDLEdBQUcsTUFBTTtBQUNkLFlBQUksRUFBRSxZQUFZLEVBQUUsUUFBUyxRQUFPLEVBQUUsVUFBVSxLQUFLO0FBQ3JELFlBQUksRUFBRSxhQUFhLEVBQUUsU0FBVSxRQUFPLEVBQUUsV0FBVyxLQUFLO0FBQ3hELGdCQUFRLEVBQUUsYUFBYSxNQUFNLEVBQUUsYUFBYTtBQUFBLE1BQzlDLENBQUM7QUFFSCxZQUFNLHdCQUF3QixvQkFBSSxJQUFZO0FBQzlDLGlCQUFXLEtBQUssT0FBTyxTQUFTO0FBQzlCLG1CQUFXLE9BQU8sRUFBRSxXQUFZLHVCQUFzQixJQUFJLEdBQUc7QUFBQSxNQUMvRDtBQUVBLFlBQU0sd0JBQXdCLGNBQWMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsSUFBSSxFQUFFLEVBQUUsQ0FBQztBQUMxRixZQUFNLFVBQVUsbUJBQW1CLEdBQUcsV0FBVyxLQUFLO0FBQ3RELFlBQU0sdUJBQXVCLFVBQVUsd0JBQXdCLHNCQUFzQixNQUFNLEdBQUcscUJBQXFCO0FBQ25ILFlBQU0saUJBQWlCLHNCQUFzQixTQUFTO0FBRXRELFlBQU0scUJBQXFCLENBQUMsUUFBZ0I7QUFDMUMsWUFBSSw0QkFBNEIsSUFBSyxRQUFPO0FBQzVDLGNBQU0sZ0JBQWdCLHNCQUFzQixJQUFJLEdBQUc7QUFDbkQsZUFDRTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsV0FBVTtBQUFBLFlBQ1YsT0FBTztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsUUFBUTtBQUFBLGNBQ1IsVUFBVTtBQUFBLGNBQ1YsWUFBWTtBQUFBLGNBQ1osUUFBUTtBQUFBLGNBQ1IsY0FBYztBQUFBLGNBQ2QsV0FBVztBQUFBLGNBQ1gsU0FBUztBQUFBLGNBQ1QsU0FBUztBQUFBLGNBQ1QsZUFBZTtBQUFBLGNBQ2YsS0FBSztBQUFBLFlBQ1A7QUFBQSxZQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsWUFFbEM7QUFBQSwyREFBQyxTQUFJLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyw0Q0FBNEMsU0FBUyxXQUFXLFlBQVksS0FBSyxjQUFjLHNDQUFzQyxHQUFHLCtEQUUvSztBQUFBLGNBQ0MsT0FBTyxRQUFRLFdBQVcsSUFDekIsNkNBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxXQUFXLFVBQVUsUUFBUSxPQUFPLDJDQUEyQyxHQUFHLDBFQUV6RyxJQUVBLE9BQU8sUUFBUSxJQUFJLENBQUMsTUFBTTtBQUN4QixzQkFBTSxlQUFlLEVBQUUsV0FBVyxTQUFTLEdBQUc7QUFDOUMsdUJBQ0U7QUFBQSxrQkFBQztBQUFBO0FBQUEsb0JBRUMsT0FBTztBQUFBLHNCQUNMLFNBQVM7QUFBQSxzQkFDVCxZQUFZO0FBQUEsc0JBQ1osS0FBSztBQUFBLHNCQUNMLFNBQVM7QUFBQSxzQkFDVCxjQUFjO0FBQUEsc0JBQ2QsUUFBUTtBQUFBLHNCQUNSLFVBQVU7QUFBQSxzQkFDVixPQUFPLGVBQWUsWUFBWTtBQUFBLHNCQUNsQyxZQUFZLGVBQWUsNkJBQTZCO0FBQUEsb0JBQzFEO0FBQUEsb0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLG9CQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhLGVBQWUsNkJBQTZCO0FBQUEsb0JBQ3JHLFNBQVMsWUFBWTtBQUNuQiw0QkFBTSxnQkFBZ0IsWUFBWSxHQUFHLE1BQU0sS0FBSyxFQUFFLEVBQUU7QUFDcEQsaURBQTJCLElBQUk7QUFBQSxvQkFDakM7QUFBQSxvQkFFQTtBQUFBLG1FQUFDLGNBQVcsTUFBTSxJQUFJLE9BQU8sRUFBRSxTQUFTLFdBQVc7QUFBQSxzQkFDbkQsNkNBQUMsVUFBSyxPQUFPLEVBQUUsVUFBVSxVQUFVLGNBQWMsWUFBWSxZQUFZLFVBQVUsTUFBTSxFQUFFLEdBQUksWUFBRSxNQUFLO0FBQUEsc0JBQ3JHLGdCQUFnQiw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTyxVQUFVLEdBQUcsb0JBQUM7QUFBQTtBQUFBO0FBQUEsa0JBckJsRSxFQUFFO0FBQUEsZ0JBc0JUO0FBQUEsY0FFSixDQUFDO0FBQUEsY0FJRixpQkFDQztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULFlBQVk7QUFBQSxvQkFDWixLQUFLO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULGNBQWM7QUFBQSxvQkFDZCxRQUFRO0FBQUEsb0JBQ1IsVUFBVTtBQUFBLG9CQUNWLE9BQU87QUFBQSxvQkFDUCxXQUFXO0FBQUEsb0JBQ1gsV0FBVztBQUFBLGtCQUNiO0FBQUEsa0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLGtCQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsa0JBQ3pELFNBQVMsWUFBWTtBQUNuQiwwQkFBTSxnQkFBZ0IsWUFBWSxHQUFHLE1BQU0sS0FBSyxJQUFJO0FBQ3BELCtDQUEyQixJQUFJO0FBQUEsa0JBQ2pDO0FBQUEsa0JBRUE7QUFBQSxpRUFBQyxlQUFZLE1BQU0sSUFBSTtBQUFBLG9CQUN2Qiw2Q0FBQyxVQUFLLGtEQUFNO0FBQUE7QUFBQTtBQUFBLGNBQ2Q7QUFBQTtBQUFBO0FBQUEsUUFFSjtBQUFBLE1BRUo7QUFFQSxhQUNFLDhDQUFDLFNBQXlCLE9BQU8sRUFBRSxTQUFTLFFBQVEsZUFBZSxTQUFTLEdBRTFFO0FBQUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE9BQU87QUFBQSxjQUNMLFNBQVM7QUFBQSxjQUNULFlBQVk7QUFBQSxjQUNaLGdCQUFnQjtBQUFBLGNBQ2hCLFFBQVE7QUFBQSxjQUNSLFNBQVM7QUFBQSxjQUNULGNBQWM7QUFBQSxjQUNkLFFBQVE7QUFBQSxjQUNSLFlBQVksYUFBYSxrRUFBa0U7QUFBQSxjQUMzRixPQUFPO0FBQUEsY0FDUCxVQUFVO0FBQUEsY0FDVixZQUFZO0FBQUEsY0FDWixVQUFVO0FBQUEsWUFDWjtBQUFBLFlBQ0EsU0FBUyxNQUFNLGdCQUFnQixHQUFHLGFBQWEsR0FBRyxJQUFJO0FBQUEsWUFDdEQsY0FBYyxDQUFDLE1BQU07QUFDbkIsb0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxhQUFhO0FBQzNELGtCQUFJLFFBQVMsU0FBUSxNQUFNLFVBQVU7QUFBQSxZQUN2QztBQUFBLFlBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsb0JBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxhQUFhO0FBQzNELGtCQUFJLFdBQVcsbUJBQW1CLEdBQUcsWUFBYSxTQUFRLE1BQU0sVUFBVTtBQUFBLFlBQzVFO0FBQUEsWUFFQTtBQUFBLDREQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxZQUFZLFVBQVUsS0FBSyxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsR0FDcEY7QUFBQTtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxNQUFNO0FBQUEsb0JBQ04sT0FBTztBQUFBLHNCQUNMLE9BQU87QUFBQSxzQkFDUCxXQUFXLGFBQWEsa0JBQWtCO0FBQUEsc0JBQzFDLFlBQVk7QUFBQSxzQkFDWixZQUFZO0FBQUEsb0JBQ2Q7QUFBQTtBQUFBLGdCQUNGO0FBQUEsZ0JBQ0EsNkNBQUMsY0FBVyxNQUFNLElBQUksT0FBTSxXQUFVLE9BQU8sRUFBRSxZQUFZLEVBQUUsR0FBRztBQUFBLGdCQUMvRCxnQkFBZ0IsR0FBRyxjQUNsQjtBQUFBLGtCQUFDO0FBQUE7QUFBQSxvQkFDQyxXQUFTO0FBQUEsb0JBQ1QsT0FBTztBQUFBLHNCQUNMLEdBQUc7QUFBQSxzQkFDSCxVQUFVO0FBQUEsc0JBQ1YsTUFBTTtBQUFBLHNCQUNOLGFBQWE7QUFBQSxvQkFDZjtBQUFBLG9CQUNBLE9BQU87QUFBQSxvQkFDUCxVQUFVLENBQUMsTUFBTSxlQUFlLEVBQUUsT0FBTyxLQUFLO0FBQUEsb0JBQzlDLFFBQVEsTUFBTSxtQkFBbUIsR0FBRyxXQUFXO0FBQUEsb0JBQy9DLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLDBCQUFJLEVBQUUsUUFBUSxRQUFTLG9CQUFtQixHQUFHLFdBQVc7QUFDeEQsMEJBQUksRUFBRSxRQUFRLFNBQVUsZ0JBQWUsSUFBSTtBQUFBLG9CQUM3QztBQUFBLG9CQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUE7QUFBQSxnQkFDcEMsSUFFQSw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFVBQVUsY0FBYyxZQUFZLFlBQVksU0FBUyxHQUFHLE9BQU8sR0FBRyxNQUM1RixhQUFHLE9BQ047QUFBQSxpQkFFSjtBQUFBLGNBR0E7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsV0FBVTtBQUFBLGtCQUNWLE9BQU8sRUFBRSxTQUFTLG1CQUFtQixHQUFHLGNBQWMsZ0JBQWdCLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTTtBQUFBLGtCQUMvRyxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQjtBQUFBLGtCQUVsQztBQUFBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU87QUFBQSwwQkFDTCxZQUFZO0FBQUEsMEJBQ1osUUFBUTtBQUFBLDBCQUNSLE9BQU87QUFBQSwwQkFDUCxRQUFRO0FBQUEsMEJBQ1IsU0FBUztBQUFBLDBCQUNULGNBQWM7QUFBQSwwQkFDZCxTQUFTO0FBQUEsMEJBQ1QsWUFBWTtBQUFBLHdCQUNkO0FBQUEsd0JBQ0EsT0FBTTtBQUFBLHdCQUNOLFNBQVMsTUFBTTtBQUNiLDhCQUFJLENBQUMsV0FBWSxpQkFBZ0IsR0FBRyxhQUFhLEdBQUcsSUFBSTtBQUN4RCxrREFBd0IsR0FBRyxXQUFXO0FBQUEsd0JBQ3hDO0FBQUEsd0JBRUEsdURBQUMsaUJBQWMsTUFBTSxJQUFJO0FBQUE7QUFBQSxvQkFDM0I7QUFBQSxvQkFDQTtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxPQUFPO0FBQUEsMEJBQ0wsWUFBWTtBQUFBLDBCQUNaLFFBQVE7QUFBQSwwQkFDUixPQUFPO0FBQUEsMEJBQ1AsUUFBUTtBQUFBLDBCQUNSLFNBQVM7QUFBQSwwQkFDVCxjQUFjO0FBQUEsMEJBQ2QsU0FBUztBQUFBLDBCQUNULFlBQVk7QUFBQSx3QkFDZDtBQUFBLHdCQUNBLE9BQU07QUFBQSx3QkFDTixTQUFTLE1BQU0sTUFBTSxlQUFlLEdBQUcsV0FBVztBQUFBLHdCQUVsRCx1REFBQyxZQUFTLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQ3RCO0FBQUEsb0JBQ0E7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTztBQUFBLDBCQUNMLFlBQVk7QUFBQSwwQkFDWixRQUFRO0FBQUEsMEJBQ1IsT0FBTztBQUFBLDBCQUNQLFFBQVE7QUFBQSwwQkFDUixTQUFTO0FBQUEsMEJBQ1QsY0FBYztBQUFBLDBCQUNkLFNBQVM7QUFBQSwwQkFDVCxZQUFZO0FBQUEsd0JBQ2Q7QUFBQSx3QkFDQSxPQUFNO0FBQUEsd0JBQ04sU0FBUyxNQUFNLGtCQUFrQixtQkFBbUIsR0FBRyxjQUFjLE9BQU8sR0FBRyxXQUFXO0FBQUEsd0JBRTFGLHVEQUFDLGdCQUFhLE1BQU0sSUFBSTtBQUFBO0FBQUEsb0JBQzFCO0FBQUE7QUFBQTtBQUFBLGNBQ0Y7QUFBQSxjQUdDLG1CQUFtQixHQUFHLGVBQ3JCO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLEtBQUs7QUFBQSxrQkFDTCxPQUFPO0FBQUEsb0JBQ0wsVUFBVTtBQUFBLG9CQUNWLE9BQU87QUFBQSxvQkFDUCxLQUFLO0FBQUEsb0JBQ0wsUUFBUTtBQUFBLG9CQUNSLFlBQVk7QUFBQSxvQkFDWixRQUFRO0FBQUEsb0JBQ1IsY0FBYztBQUFBLG9CQUNkLFdBQVc7QUFBQSxvQkFDWCxTQUFTO0FBQUEsb0JBQ1QsVUFBVTtBQUFBLG9CQUNWLGdCQUFnQjtBQUFBLGtCQUNsQjtBQUFBLGtCQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsa0JBRWxDO0FBQUE7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTztBQUFBLDBCQUNMLFNBQVM7QUFBQSwwQkFDVCxZQUFZO0FBQUEsMEJBQ1osS0FBSztBQUFBLDBCQUNMLFNBQVM7QUFBQSwwQkFDVCxjQUFjO0FBQUEsMEJBQ2QsUUFBUTtBQUFBLDBCQUNSLFVBQVU7QUFBQSwwQkFDVixPQUFPO0FBQUEsd0JBQ1Q7QUFBQSx3QkFDQSxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsd0JBQ3pELGNBQWMsQ0FBQyxNQUFPLEVBQUUsY0FBYyxNQUFNLGFBQWE7QUFBQSx3QkFDekQsU0FBUyxNQUFNO0FBQ2IseUNBQWUsR0FBRyxXQUFXO0FBQzdCLHlDQUFlLEdBQUcsS0FBSztBQUN2Qiw0Q0FBa0IsSUFBSTtBQUFBLHdCQUN4QjtBQUFBLHdCQUVBO0FBQUEsdUVBQUMsWUFBUyxNQUFNLElBQUk7QUFBQSwwQkFDcEIsNkNBQUMsVUFBSyxnQ0FBRztBQUFBO0FBQUE7QUFBQSxvQkFDWDtBQUFBLG9CQUNBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU87QUFBQSwwQkFDTCxTQUFTO0FBQUEsMEJBQ1QsWUFBWTtBQUFBLDBCQUNaLEtBQUs7QUFBQSwwQkFDTCxTQUFTO0FBQUEsMEJBQ1QsY0FBYztBQUFBLDBCQUNkLFFBQVE7QUFBQSwwQkFDUixVQUFVO0FBQUEsMEJBQ1YsT0FBTztBQUFBLHdCQUNUO0FBQUEsd0JBQ0EsY0FBYyxDQUFDLE1BQU8sRUFBRSxjQUFjLE1BQU0sYUFBYTtBQUFBLHdCQUN6RCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxhQUFhO0FBQUEsd0JBQ3pELFNBQVMsTUFBTTtBQUNiLGdDQUFNLGtCQUFrQixHQUFHLFdBQVc7QUFDdEMsNENBQWtCLElBQUk7QUFBQSx3QkFDeEI7QUFBQSx3QkFFQTtBQUFBLHVFQUFDLGFBQVUsTUFBTSxJQUFJO0FBQUEsMEJBQ3JCLDZDQUFDLFVBQUssNENBQUs7QUFBQTtBQUFBO0FBQUEsb0JBQ2I7QUFBQTtBQUFBO0FBQUEsY0FDRjtBQUFBO0FBQUE7QUFBQSxRQUVKO0FBQUEsUUFHQyxjQUNDLDhDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFVBQVUsS0FBSyxPQUFPLGFBQWEsT0FBTyxHQUVyRjtBQUFBLG1DQUF5QixHQUFHLGVBQzNCLDZDQUFDLFNBQUksT0FBTyxFQUFFLFNBQVMsVUFBVSxHQUMvQjtBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsV0FBUztBQUFBLGNBQ1QsT0FBTztBQUFBLGdCQUNMLEdBQUc7QUFBQSxnQkFDSCxPQUFPO0FBQUEsZ0JBQ1AsUUFBUTtBQUFBLGdCQUNSLFNBQVM7QUFBQSxjQUNYO0FBQUEsY0FDQSxhQUFZO0FBQUEsY0FDWixPQUFPO0FBQUEsY0FDUCxVQUFVLENBQUMsTUFBTSxpQkFBaUIsRUFBRSxPQUFPLEtBQUs7QUFBQSxjQUNoRCxXQUFXLENBQUMsTUFBTTtBQUNoQixvQkFBSSxFQUFFLFFBQVEsUUFBUyxvQkFBbUIsR0FBRyxJQUFJO0FBQ2pELG9CQUFJLEVBQUUsUUFBUSxTQUFVLHlCQUF3QixJQUFJO0FBQUEsY0FDdEQ7QUFBQSxjQUNBLFFBQVEsTUFBTTtBQUNaLG9CQUFJLENBQUMsY0FBYyxLQUFLLEVBQUcseUJBQXdCLElBQUk7QUFBQSxvQkFDbEQsb0JBQW1CLEdBQUcsSUFBSTtBQUFBLGNBQ2pDO0FBQUE7QUFBQSxVQUNGLEdBQ0Y7QUFBQSxVQUlELE9BQU8sUUFBUSxJQUFJLENBQUMsV0FBVztBQUM5QixrQkFBTSxpQkFBaUIsT0FBTyxXQUMzQixJQUFJLENBQUMsUUFBUTtBQUNaLG9CQUFNLFVBQVUsY0FBYyxPQUFPLEdBQXdCO0FBQzdELG9CQUFNLFdBQVcsUUFBUSxTQUFTLGFBQWEsZUFBZSxJQUFJLEdBQUcsQ0FBQztBQUN0RSxxQkFBTztBQUFBLGdCQUNMLElBQUk7QUFBQSxnQkFDSixPQUFPLFNBQVMsU0FBUyxJQUFJLE1BQU0sR0FBRyxFQUFFO0FBQUEsZ0JBQ3hDLFdBQVcsU0FBUyxhQUFhO0FBQUEsZ0JBQ2pDLFNBQVMsUUFBUSxTQUFTLE9BQU87QUFBQSxnQkFDakMsb0JBQW9CLFNBQVM7QUFBQSxnQkFDN0IsV0FBVyxZQUFZLFFBQVE7QUFBQSxnQkFDL0IsT0FBTyxRQUFRLFNBQVMsS0FBSztBQUFBLGdCQUM3QixVQUFVLFlBQVksSUFBSSxHQUFHO0FBQUEsY0FDL0I7QUFBQSxZQUNGLENBQUMsRUFDQSxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNwQyxLQUFLLENBQUMsR0FBRyxNQUFNO0FBQ2Qsa0JBQUksRUFBRSxZQUFZLEVBQUUsUUFBUyxRQUFPLEVBQUUsVUFBVSxLQUFLO0FBQ3JELGtCQUFJLEVBQUUsYUFBYSxFQUFFLFNBQVUsUUFBTyxFQUFFLFdBQVcsS0FBSztBQUN4RCxzQkFBUSxFQUFFLGFBQWEsTUFBTSxFQUFFLGFBQWE7QUFBQSxZQUM5QyxDQUFDO0FBRUgsbUJBQ0UsOENBQUMsU0FBb0IsT0FBTyxFQUFFLFNBQVMsUUFBUSxlQUFlLFNBQVMsR0FFckU7QUFBQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULFlBQVk7QUFBQSxvQkFDWixnQkFBZ0I7QUFBQSxvQkFDaEIsUUFBUTtBQUFBLG9CQUNSLFNBQVM7QUFBQSxvQkFDVCxjQUFjO0FBQUEsb0JBQ2QsUUFBUTtBQUFBLG9CQUNSLE9BQU87QUFBQSxvQkFDUCxZQUFZO0FBQUEsb0JBQ1osUUFBUTtBQUFBLG9CQUNSLFVBQVU7QUFBQSxvQkFDVixZQUFZO0FBQUEsa0JBQ2Q7QUFBQSxrQkFDQSxTQUFTLE1BQU0sZ0JBQWdCLGFBQWEsR0FBRyxNQUFNLE9BQU8sRUFBRTtBQUFBLGtCQUM5RCxjQUFjLENBQUMsTUFBTTtBQUNuQiwwQkFBTSxVQUFVLEVBQUUsY0FBYyxjQUFjLGlCQUFpQjtBQUMvRCx3QkFBSSxRQUFTLFNBQVEsTUFBTSxVQUFVO0FBQUEsa0JBQ3ZDO0FBQUEsa0JBQ0EsY0FBYyxDQUFDLE1BQU07QUFDbkIsMEJBQU0sVUFBVSxFQUFFLGNBQWMsY0FBYyxpQkFBaUI7QUFDL0Qsd0JBQUksUUFBUyxTQUFRLE1BQU0sVUFBVTtBQUFBLGtCQUN2QztBQUFBLGtCQUVBO0FBQUEsa0VBQUMsU0FBSSxPQUFPLEVBQUUsU0FBUyxRQUFRLFlBQVksVUFBVSxLQUFLLE9BQU8sVUFBVSxHQUFHLE1BQU0sRUFBRSxHQUNwRjtBQUFBO0FBQUEsd0JBQUM7QUFBQTtBQUFBLDBCQUNDLE1BQU07QUFBQSwwQkFDTixPQUFPO0FBQUEsNEJBQ0wsT0FBTztBQUFBLDRCQUNQLFdBQVcsT0FBTyxZQUFZLGlCQUFpQjtBQUFBLDRCQUMvQyxZQUFZO0FBQUEsNEJBQ1osWUFBWTtBQUFBLDBCQUNkO0FBQUE7QUFBQSxzQkFDRjtBQUFBLHNCQUNBLDZDQUFDLGNBQVcsTUFBTSxJQUFJLE9BQU8sT0FBTyxTQUFTLFdBQVcsT0FBTyxFQUFFLFlBQVksRUFBRSxHQUFHO0FBQUEsc0JBQ2pGLG9CQUFvQixPQUFPLEtBQzFCO0FBQUEsd0JBQUM7QUFBQTtBQUFBLDBCQUNDLFdBQVM7QUFBQSwwQkFDVCxPQUFPO0FBQUEsNEJBQ0wsR0FBRztBQUFBLDRCQUNILFVBQVU7QUFBQSw0QkFDVixNQUFNO0FBQUEsNEJBQ04sUUFBUTtBQUFBLDRCQUNSLFVBQVU7QUFBQSw0QkFDVixhQUFhO0FBQUEsMEJBQ2Y7QUFBQSwwQkFDQSxPQUFPO0FBQUEsMEJBQ1AsVUFBVSxDQUFDLE1BQU0sa0JBQWtCLEVBQUUsT0FBTyxLQUFLO0FBQUEsMEJBQ2pELFFBQVEsWUFBWTtBQUNsQixnQ0FBSSxlQUFlLEtBQUssRUFBRyxPQUFNLGdCQUFnQixhQUFhLEdBQUcsTUFBTSxPQUFPLElBQUksZUFBZSxLQUFLLENBQUM7QUFDdkcsK0NBQW1CLElBQUk7QUFBQSwwQkFDekI7QUFBQSwwQkFDQSxXQUFXLE9BQU8sTUFBTTtBQUN0QixnQ0FBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixrQ0FBSSxlQUFlLEtBQUssRUFBRyxPQUFNLGdCQUFnQixhQUFhLEdBQUcsTUFBTSxPQUFPLElBQUksZUFBZSxLQUFLLENBQUM7QUFDdkcsaURBQW1CLElBQUk7QUFBQSw0QkFDekI7QUFDQSxnQ0FBSSxFQUFFLFFBQVEsU0FBVSxvQkFBbUIsSUFBSTtBQUFBLDBCQUNqRDtBQUFBLDBCQUNBLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUE7QUFBQSxzQkFDcEMsSUFFQSw2Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFVBQVUsY0FBYyxZQUFZLFlBQVksVUFBVSxZQUFZLElBQUksR0FBRyxlQUFlLE1BQU07QUFBRSwyQ0FBbUIsT0FBTyxFQUFFO0FBQUcsMENBQWtCLE9BQU8sSUFBSTtBQUFBLHNCQUFFLEdBQ3hMLGlCQUFPLE1BQ1Y7QUFBQSxzQkFFRiw4Q0FBQyxVQUFLLE9BQU8sRUFBRSxVQUFVLFFBQVEsT0FBTywyQ0FBMkMsR0FBRztBQUFBO0FBQUEsd0JBQUUsZUFBZTtBQUFBLHdCQUFPO0FBQUEseUJBQUM7QUFBQSx1QkFDakg7QUFBQSxvQkFHQSw4Q0FBQyxTQUFJLFdBQVUsa0JBQWlCLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEdBQzlIO0FBQUE7QUFBQSx3QkFBQztBQUFBO0FBQUEsMEJBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsT0FBTyxTQUFTLGVBQWUsWUFBWSxTQUFTO0FBQUEsMEJBQ3ZMLE9BQU07QUFBQSwwQkFDTixTQUFTLE1BQU0sNEJBQTRCLEdBQUcsYUFBYSxHQUFHLE1BQU0sT0FBTyxFQUFFO0FBQUEsMEJBRTdFLHVEQUFDLFlBQVMsTUFBTSxJQUFJO0FBQUE7QUFBQSxzQkFDdEI7QUFBQSxzQkFDQTtBQUFBLHdCQUFDO0FBQUE7QUFBQSwwQkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLDRDQUE0QyxRQUFRLFdBQVcsU0FBUyxPQUFPLFNBQVMsZUFBZSxZQUFZLFNBQVM7QUFBQSwwQkFDdkwsT0FBTTtBQUFBLDBCQUNOLFNBQVMsTUFBTTtBQUFFLCtDQUFtQixPQUFPLEVBQUU7QUFBRyw4Q0FBa0IsT0FBTyxJQUFJO0FBQUEsMEJBQUU7QUFBQSwwQkFFL0UsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLHNCQUN0QjtBQUFBLHNCQUNBO0FBQUEsd0JBQUM7QUFBQTtBQUFBLDBCQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sV0FBVyxRQUFRLFdBQVcsU0FBUyxPQUFPLFNBQVMsZUFBZSxZQUFZLFNBQVM7QUFBQSwwQkFDdEosT0FBTTtBQUFBLDBCQUNOLFNBQVMsTUFBTSxnQkFBZ0IsYUFBYSxHQUFHLE1BQU0sT0FBTyxFQUFFO0FBQUEsMEJBRTlELHVEQUFDLGFBQVUsTUFBTSxJQUFJO0FBQUE7QUFBQSxzQkFDdkI7QUFBQSx1QkFDRjtBQUFBO0FBQUE7QUFBQSxjQUNGO0FBQUEsY0FHQyxDQUFDLE9BQU8sYUFDUDtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsb0JBQ0wsU0FBUztBQUFBLG9CQUNULGVBQWU7QUFBQSxvQkFDZixLQUFLO0FBQUEsb0JBQ0wsYUFBYTtBQUFBLGtCQUNmO0FBQUEsa0JBRUMseUJBQWUsSUFBSSxDQUFDLE1BQU07QUFDekIsMEJBQU0sV0FBVyxvQkFBb0IsRUFBRTtBQUN2QywwQkFBTSxVQUFVLG1CQUFtQixFQUFFLFNBQVM7QUFFOUMsMkJBQ0U7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBRUMsT0FBTztBQUFBLDBCQUNMLFNBQVM7QUFBQSwwQkFDVCxZQUFZO0FBQUEsMEJBQ1osZ0JBQWdCO0FBQUEsMEJBQ2hCLFFBQVE7QUFBQSwwQkFDUixTQUFTO0FBQUEsMEJBQ1QsY0FBYztBQUFBLDBCQUNkLFFBQVE7QUFBQSwwQkFDUixZQUFZO0FBQUEsMEJBQ1osa0JBQWtCO0FBQUEsMEJBQ2xCLFlBQVksV0FBVyxrRUFBa0U7QUFBQSwwQkFDekYsT0FBTyxXQUFXLHFEQUFxRDtBQUFBLDBCQUN2RSxVQUFVO0FBQUEsMEJBQ1YsWUFBWSxXQUFXLE1BQU07QUFBQSwwQkFDN0IsUUFBUTtBQUFBLDBCQUNSLFlBQVk7QUFBQSx3QkFDZDtBQUFBLHdCQUNBLFNBQVMsTUFBTSxrQkFBa0IsRUFBRSxFQUFFO0FBQUEsd0JBQ3JDLGVBQWUsQ0FBQyxNQUFNO0FBQ3BCLDRCQUFFLGdCQUFnQjtBQUNsQiw4Q0FBb0IsRUFBRSxFQUFFO0FBQ3hCLDhDQUFvQixFQUFFLEtBQUs7QUFBQSx3QkFDN0I7QUFBQSx3QkFDQSxjQUFjLENBQUMsTUFBTTtBQUNuQixnQ0FBTSxNQUFNLEVBQUUsY0FBYyxjQUFjLFdBQVc7QUFDckQsZ0NBQU0sS0FBSyxFQUFFLGNBQWMsY0FBYyxZQUFZO0FBQ3JELDhCQUFJLElBQUssS0FBSSxNQUFNLFVBQVU7QUFDN0IsOEJBQUksR0FBSSxJQUFHLE1BQU0sVUFBVTtBQUFBLHdCQUM3QjtBQUFBLHdCQUNBLGNBQWMsQ0FBQyxNQUFNO0FBQ25CLGdDQUFNLE1BQU0sRUFBRSxjQUFjLGNBQWMsV0FBVztBQUNyRCxnQ0FBTSxLQUFLLEVBQUUsY0FBYyxjQUFjLFlBQVk7QUFDckQsOEJBQUksSUFBSyxLQUFJLE1BQU0sVUFBVTtBQUM3Qiw4QkFBSSxHQUFJLElBQUcsTUFBTSxVQUFVO0FBQUEsd0JBQzdCO0FBQUEsd0JBRUE7QUFBQSx3RUFBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssT0FBTyxVQUFVLEdBQUcsTUFBTSxHQUFHLGVBQWUscUJBQXFCLEVBQUUsS0FBSyxTQUFTLE9BQU8sR0FDL0k7QUFBQSw4QkFBRSxVQUNELDZDQUFDLGNBQVcsTUFBTSxJQUFJLElBQ3BCLEVBQUUscUJBQ0osNkNBQUMsY0FBVyxJQUNWLEVBQUUsWUFDSiw2Q0FBQyxnQkFBYSxNQUFNLElBQUksSUFDdEIsRUFBRSxXQUNKLDZDQUFDLFdBQVEsTUFBTSxJQUFJLFFBQVEsTUFBTSxPQUFPLEVBQUUsT0FBTyxXQUFXLFlBQVksRUFBRSxHQUFHLElBRTdFLDZDQUFDLFlBQVMsTUFBTSxJQUFJLE9BQU8sRUFBRSxZQUFZLEdBQUcsU0FBUyxJQUFJLEdBQUc7QUFBQSw0QkFHN0QscUJBQXFCLEVBQUUsS0FDdEI7QUFBQSw4QkFBQztBQUFBO0FBQUEsZ0NBQ0MsV0FBUztBQUFBLGdDQUNULE9BQU87QUFBQSxrQ0FDTCxHQUFHO0FBQUEsa0NBQ0gsVUFBVTtBQUFBLGtDQUNWLE1BQU07QUFBQSxrQ0FDTixRQUFRO0FBQUEsa0NBQ1IsVUFBVTtBQUFBLGtDQUNWLGFBQWE7QUFBQSxrQ0FDYixlQUFlO0FBQUEsZ0NBQ2pCO0FBQUEsZ0NBQ0EsT0FBTztBQUFBLGdDQUNQLFVBQVUsQ0FBQyxNQUFNLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLGdDQUNuRCxRQUFRLE1BQU0sd0JBQXdCLEVBQUUsRUFBRTtBQUFBLGdDQUMxQyxXQUFXLENBQUMsTUFBTTtBQUNoQixzQ0FBSSxFQUFFLFFBQVEsUUFBUyx5QkFBd0IsRUFBRSxFQUFFO0FBQ25ELHNDQUFJLEVBQUUsUUFBUSxTQUFVLHFCQUFvQixJQUFJO0FBQUEsZ0NBQ2xEO0FBQUEsZ0NBQ0EsU0FBUyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0I7QUFBQTtBQUFBLDRCQUNwQyxJQUVBO0FBQUEsOEJBQUM7QUFBQTtBQUFBLGdDQUNDLE9BQU87QUFBQSxrQ0FDTCxVQUFVO0FBQUEsa0NBQ1YsY0FBYztBQUFBLGtDQUNkLFlBQVk7QUFBQSxrQ0FDWixZQUFZO0FBQUEsa0NBQ1osa0JBQWtCO0FBQUEsZ0NBQ3BCO0FBQUEsZ0NBQ0EsT0FBTyxFQUFFO0FBQUEsZ0NBRVIsWUFBRTtBQUFBO0FBQUEsNEJBQ0w7QUFBQSw2QkFFSjtBQUFBLDBCQUVDLHFCQUFxQixFQUFFLE1BQ3RCO0FBQUEsNEJBQUM7QUFBQTtBQUFBLDhCQUNDLFdBQVU7QUFBQSw4QkFDVixPQUFPO0FBQUEsZ0NBQ0wsVUFBVTtBQUFBLGdDQUNWLE9BQU8sRUFBRSxVQUFVLFlBQVksRUFBRSxZQUFZLFlBQVk7QUFBQSxnQ0FDekQsWUFBWSxFQUFFLFlBQVksTUFBTTtBQUFBLGdDQUNoQyxZQUFZO0FBQUEsOEJBQ2Q7QUFBQSw4QkFFQyxZQUFFLFVBQVUsdUJBQVEsRUFBRSxZQUFZLHVCQUFRO0FBQUE7QUFBQSwwQkFDN0M7QUFBQSwwQkFJRiw4Q0FBQyxTQUFJLFdBQVUsWUFBVyxPQUFPLEVBQUUsU0FBUyxRQUFRLFlBQVksVUFBVSxLQUFLLE1BQU0sR0FDbkY7QUFBQTtBQUFBLDhCQUFDO0FBQUE7QUFBQSxnQ0FDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLEVBQUUsV0FBVyxZQUFZLDRDQUE0QyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsZ0NBQ2xLLE9BQU8sRUFBRSxXQUFXLDZCQUFTO0FBQUEsZ0NBQzdCLFNBQVMsT0FBTyxNQUFNO0FBQ3BCLG9DQUFFLGdCQUFnQjtBQUNsQix3Q0FBTSxnQkFBZ0IsaUJBQWlCLEdBQUcsTUFBTSxFQUFFLEVBQUU7QUFBQSxnQ0FDdEQ7QUFBQSxnQ0FFQSx1REFBQyxXQUFRLE1BQU0sSUFBSSxRQUFRLEVBQUUsVUFBVTtBQUFBO0FBQUEsNEJBQ3pDO0FBQUEsNEJBQ0E7QUFBQSw4QkFBQztBQUFBO0FBQUEsZ0NBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLGdDQUN6SSxPQUFNO0FBQUEsZ0NBQ04sU0FBUyxDQUFDLE1BQU07QUFDZCxvQ0FBRSxnQkFBZ0I7QUFDbEIsc0RBQW9CLEVBQUUsRUFBRTtBQUN4QixzREFBb0IsRUFBRSxLQUFLO0FBQUEsZ0NBQzdCO0FBQUEsZ0NBRUEsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLDRCQUN0QjtBQUFBLDRCQUNBO0FBQUEsOEJBQUM7QUFBQTtBQUFBLGdDQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sNENBQTRDLFFBQVEsV0FBVyxTQUFTLE1BQU07QUFBQSxnQ0FDekksT0FBTTtBQUFBLGdDQUNOLFNBQVMsQ0FBQyxNQUFNO0FBQ2Qsb0NBQUUsZ0JBQWdCO0FBQ2xCLHdDQUFNLGNBQWMsRUFBRSxFQUEwQjtBQUFBLGdDQUNsRDtBQUFBLGdDQUVBLHVEQUFDLFlBQVMsTUFBTSxJQUFJO0FBQUE7QUFBQSw0QkFDdEI7QUFBQSw0QkFFQSw4Q0FBQyxTQUFJLE9BQU8sRUFBRSxVQUFVLFlBQVksU0FBUyxjQUFjLEdBQ3pEO0FBQUE7QUFBQSxnQ0FBQztBQUFBO0FBQUEsa0NBQ0MsV0FBVTtBQUFBLGtDQUNWLE9BQU87QUFBQSxvQ0FDTCxZQUFZLDRCQUE0QixFQUFFLEtBQUssNEJBQTRCO0FBQUEsb0NBQzNFLFFBQVE7QUFBQSxvQ0FDUixPQUFPLDRCQUE0QixFQUFFLEtBQUssWUFBWTtBQUFBLG9DQUN0RCxRQUFRO0FBQUEsb0NBQ1IsU0FBUztBQUFBLG9DQUNULFNBQVM7QUFBQSxvQ0FDVCxZQUFZO0FBQUEsb0NBQ1osY0FBYztBQUFBLGtDQUNoQjtBQUFBLGtDQUNBLE9BQU07QUFBQSxrQ0FDTixTQUFTLENBQUMsTUFBTTtBQUNkLHNDQUFFLGdCQUFnQjtBQUNsQiwrREFBMkIsNEJBQTRCLEVBQUUsS0FBSyxPQUFPLEVBQUUsRUFBRTtBQUFBLGtDQUMzRTtBQUFBLGtDQUVBLHVEQUFDLG9CQUFpQixNQUFNLElBQUk7QUFBQTtBQUFBLDhCQUM5QjtBQUFBLDhCQUNDLG1CQUFtQixFQUFFLEVBQUU7QUFBQSwrQkFDMUI7QUFBQSw0QkFDQTtBQUFBLDhCQUFDO0FBQUE7QUFBQSxnQ0FDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLFdBQVcsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLGdDQUN4RyxPQUFNO0FBQUEsZ0NBQ04sU0FBUyxPQUFPLE1BQU07QUFDcEIsb0NBQUUsZ0JBQWdCO0FBQ2xCLHdDQUFNLG9CQUFvQixHQUFHLE1BQU0sRUFBRSxFQUFFO0FBQUEsZ0NBQ3pDO0FBQUEsZ0NBRUEsdURBQUMsYUFBVSxNQUFNLElBQUk7QUFBQTtBQUFBLDRCQUN2QjtBQUFBLDZCQUNGO0FBQUE7QUFBQTtBQUFBLHNCQXhLSyxFQUFFO0FBQUEsb0JBeUtUO0FBQUEsa0JBRUosQ0FBQztBQUFBO0FBQUEsY0FDSDtBQUFBLGlCQTlSTSxPQUFPLEVBZ1NqQjtBQUFBLFVBRUosQ0FBQztBQUFBLFVBR0EscUJBQXFCLElBQUksQ0FBQyxNQUFNO0FBQy9CLGtCQUFNLFdBQVcsb0JBQW9CLEVBQUU7QUFDdkMsa0JBQU0sVUFBVSxtQkFBbUIsRUFBRSxTQUFTO0FBRTlDLG1CQUNFO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBRUMsT0FBTztBQUFBLGtCQUNMLFNBQVM7QUFBQSxrQkFDVCxZQUFZO0FBQUEsa0JBQ1osZ0JBQWdCO0FBQUEsa0JBQ2hCLFFBQVE7QUFBQSxrQkFDUixTQUFTO0FBQUEsa0JBQ1QsY0FBYztBQUFBLGtCQUNkLFFBQVE7QUFBQSxrQkFDUixZQUFZO0FBQUEsa0JBQ1osa0JBQWtCO0FBQUEsa0JBQ2xCLFlBQVksV0FBVyxrRUFBa0U7QUFBQSxrQkFDekYsT0FBTyxXQUFXLHFEQUFxRDtBQUFBLGtCQUN2RSxVQUFVO0FBQUEsa0JBQ1YsWUFBWSxXQUFXLE1BQU07QUFBQSxrQkFDN0IsUUFBUTtBQUFBLGtCQUNSLFlBQVk7QUFBQSxnQkFDZDtBQUFBLGdCQUNBLFNBQVMsTUFBTSxrQkFBa0IsRUFBRSxFQUFFO0FBQUEsZ0JBQ3JDLGVBQWUsQ0FBQyxNQUFNO0FBQ3BCLG9CQUFFLGdCQUFnQjtBQUNsQixzQ0FBb0IsRUFBRSxFQUFFO0FBQ3hCLHNDQUFvQixFQUFFLEtBQUs7QUFBQSxnQkFDN0I7QUFBQSxnQkFDQSxjQUFjLENBQUMsTUFBTTtBQUNuQix3QkFBTSxNQUFNLEVBQUUsY0FBYyxjQUFjLFdBQVc7QUFDckQsd0JBQU0sS0FBSyxFQUFFLGNBQWMsY0FBYyxZQUFZO0FBQ3JELHNCQUFJLElBQUssS0FBSSxNQUFNLFVBQVU7QUFDN0Isc0JBQUksR0FBSSxJQUFHLE1BQU0sVUFBVTtBQUFBLGdCQUM3QjtBQUFBLGdCQUNBLGNBQWMsQ0FBQyxNQUFNO0FBQ25CLHdCQUFNLE1BQU0sRUFBRSxjQUFjLGNBQWMsV0FBVztBQUNyRCx3QkFBTSxLQUFLLEVBQUUsY0FBYyxjQUFjLFlBQVk7QUFDckQsc0JBQUksSUFBSyxLQUFJLE1BQU0sVUFBVTtBQUM3QixzQkFBSSxHQUFJLElBQUcsTUFBTSxVQUFVO0FBQUEsZ0JBQzdCO0FBQUEsZ0JBRUE7QUFBQSxnRUFBQyxTQUFJLE9BQU8sRUFBRSxTQUFTLFFBQVEsWUFBWSxVQUFVLEtBQUssT0FBTyxVQUFVLEdBQUcsTUFBTSxHQUFHLGVBQWUscUJBQXFCLEVBQUUsS0FBSyxTQUFTLE9BQU8sR0FDL0k7QUFBQSxzQkFBRSxVQUNELDZDQUFDLGNBQVcsTUFBTSxJQUFJLElBQ3BCLEVBQUUscUJBQ0osNkNBQUMsY0FBVyxJQUNWLEVBQUUsWUFDSiw2Q0FBQyxnQkFBYSxNQUFNLElBQUksSUFDdEIsRUFBRSxXQUNKLDZDQUFDLFdBQVEsTUFBTSxJQUFJLFFBQVEsTUFBTSxPQUFPLEVBQUUsT0FBTyxXQUFXLFlBQVksRUFBRSxHQUFHLElBRTdFLDZDQUFDLFlBQVMsTUFBTSxJQUFJLE9BQU8sRUFBRSxZQUFZLEdBQUcsU0FBUyxJQUFJLEdBQUc7QUFBQSxvQkFHN0QscUJBQXFCLEVBQUUsS0FDdEI7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsV0FBUztBQUFBLHdCQUNULE9BQU87QUFBQSwwQkFDTCxHQUFHO0FBQUEsMEJBQ0gsVUFBVTtBQUFBLDBCQUNWLE1BQU07QUFBQSwwQkFDTixRQUFRO0FBQUEsMEJBQ1IsVUFBVTtBQUFBLDBCQUNWLGFBQWE7QUFBQSwwQkFDYixlQUFlO0FBQUEsd0JBQ2pCO0FBQUEsd0JBQ0EsT0FBTztBQUFBLHdCQUNQLFVBQVUsQ0FBQyxNQUFNLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLHdCQUNuRCxRQUFRLE1BQU0sd0JBQXdCLEVBQUUsRUFBRTtBQUFBLHdCQUMxQyxXQUFXLENBQUMsTUFBTTtBQUNoQiw4QkFBSSxFQUFFLFFBQVEsUUFBUyx5QkFBd0IsRUFBRSxFQUFFO0FBQ25ELDhCQUFJLEVBQUUsUUFBUSxTQUFVLHFCQUFvQixJQUFJO0FBQUEsd0JBQ2xEO0FBQUEsd0JBQ0EsU0FBUyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0I7QUFBQTtBQUFBLG9CQUNwQyxJQUVBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU87QUFBQSwwQkFDTCxVQUFVO0FBQUEsMEJBQ1YsY0FBYztBQUFBLDBCQUNkLFlBQVk7QUFBQSwwQkFDWixZQUFZO0FBQUEsMEJBQ1osa0JBQWtCO0FBQUEsd0JBQ3BCO0FBQUEsd0JBQ0EsT0FBTyxFQUFFO0FBQUEsd0JBRVIsWUFBRTtBQUFBO0FBQUEsb0JBQ0w7QUFBQSxxQkFFSjtBQUFBLGtCQUVDLHFCQUFxQixFQUFFLE1BQ3RCO0FBQUEsb0JBQUM7QUFBQTtBQUFBLHNCQUNDLFdBQVU7QUFBQSxzQkFDVixPQUFPO0FBQUEsd0JBQ0wsVUFBVTtBQUFBLHdCQUNWLE9BQU8sRUFBRSxVQUFVLFlBQVksRUFBRSxZQUFZLFlBQVk7QUFBQSx3QkFDekQsWUFBWSxFQUFFLFlBQVksTUFBTTtBQUFBLHdCQUNoQyxZQUFZO0FBQUEsc0JBQ2Q7QUFBQSxzQkFFQyxZQUFFLFVBQVUsdUJBQVEsRUFBRSxZQUFZLHVCQUFRO0FBQUE7QUFBQSxrQkFDN0M7QUFBQSxrQkFJRiw4Q0FBQyxTQUFJLFdBQVUsWUFBVyxPQUFPLEVBQUUsU0FBUyxRQUFRLFlBQVksVUFBVSxLQUFLLE1BQU0sR0FDbkY7QUFBQTtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLEVBQUUsV0FBVyxZQUFZLDRDQUE0QyxRQUFRLFdBQVcsU0FBUyxNQUFNO0FBQUEsd0JBQ2xLLE9BQU8sRUFBRSxXQUFXLDZCQUFTO0FBQUEsd0JBQzdCLFNBQVMsT0FBTyxNQUFNO0FBQ3BCLDRCQUFFLGdCQUFnQjtBQUNsQixnQ0FBTSxnQkFBZ0IsaUJBQWlCLEdBQUcsTUFBTSxFQUFFLEVBQUU7QUFBQSx3QkFDdEQ7QUFBQSx3QkFFQSx1REFBQyxXQUFRLE1BQU0sSUFBSSxRQUFRLEVBQUUsVUFBVTtBQUFBO0FBQUEsb0JBQ3pDO0FBQUEsb0JBQ0E7QUFBQSxzQkFBQztBQUFBO0FBQUEsd0JBQ0MsT0FBTyxFQUFFLFlBQVksZUFBZSxRQUFRLFFBQVEsT0FBTyw0Q0FBNEMsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLHdCQUN6SSxPQUFNO0FBQUEsd0JBQ04sU0FBUyxDQUFDLE1BQU07QUFDZCw0QkFBRSxnQkFBZ0I7QUFDbEIsOENBQW9CLEVBQUUsRUFBRTtBQUN4Qiw4Q0FBb0IsRUFBRSxLQUFLO0FBQUEsd0JBQzdCO0FBQUEsd0JBRUEsdURBQUMsWUFBUyxNQUFNLElBQUk7QUFBQTtBQUFBLG9CQUN0QjtBQUFBLG9CQUNBO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE9BQU8sRUFBRSxZQUFZLGVBQWUsUUFBUSxRQUFRLE9BQU8sNENBQTRDLFFBQVEsV0FBVyxTQUFTLE1BQU07QUFBQSx3QkFDekksT0FBTTtBQUFBLHdCQUNOLFNBQVMsQ0FBQyxNQUFNO0FBQ2QsNEJBQUUsZ0JBQWdCO0FBQ2xCLGdDQUFNLGNBQWMsRUFBRSxFQUEwQjtBQUFBLHdCQUNsRDtBQUFBLHdCQUVBLHVEQUFDLFlBQVMsTUFBTSxJQUFJO0FBQUE7QUFBQSxvQkFDdEI7QUFBQSxvQkFFQSw4Q0FBQyxTQUFJLE9BQU8sRUFBRSxVQUFVLFlBQVksU0FBUyxjQUFjLEdBQ3pEO0FBQUE7QUFBQSx3QkFBQztBQUFBO0FBQUEsMEJBQ0MsV0FBVTtBQUFBLDBCQUNWLE9BQU87QUFBQSw0QkFDTCxZQUFZLDRCQUE0QixFQUFFLEtBQUssNEJBQTRCO0FBQUEsNEJBQzNFLFFBQVE7QUFBQSw0QkFDUixPQUFPLDRCQUE0QixFQUFFLEtBQUssWUFBWTtBQUFBLDRCQUN0RCxRQUFRO0FBQUEsNEJBQ1IsU0FBUztBQUFBLDRCQUNULFNBQVM7QUFBQSw0QkFDVCxZQUFZO0FBQUEsNEJBQ1osY0FBYztBQUFBLDBCQUNoQjtBQUFBLDBCQUNBLE9BQU07QUFBQSwwQkFDTixTQUFTLENBQUMsTUFBTTtBQUNkLDhCQUFFLGdCQUFnQjtBQUNsQix1REFBMkIsNEJBQTRCLEVBQUUsS0FBSyxPQUFPLEVBQUUsRUFBRTtBQUFBLDBCQUMzRTtBQUFBLDBCQUVBLHVEQUFDLG9CQUFpQixNQUFNLElBQUk7QUFBQTtBQUFBLHNCQUM5QjtBQUFBLHNCQUNDLG1CQUFtQixFQUFFLEVBQUU7QUFBQSx1QkFDMUI7QUFBQSxvQkFDQTtBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxPQUFPLEVBQUUsWUFBWSxlQUFlLFFBQVEsUUFBUSxPQUFPLFdBQVcsUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUFBLHdCQUN4RyxPQUFNO0FBQUEsd0JBQ04sU0FBUyxPQUFPLE1BQU07QUFDcEIsNEJBQUUsZ0JBQWdCO0FBQ2xCLGdDQUFNLG9CQUFvQixHQUFHLE1BQU0sRUFBRSxFQUFFO0FBQUEsd0JBQ3pDO0FBQUEsd0JBRUEsdURBQUMsYUFBVSxNQUFNLElBQUk7QUFBQTtBQUFBLG9CQUN2QjtBQUFBLHFCQUNGO0FBQUE7QUFBQTtBQUFBLGNBeEtLLEVBQUU7QUFBQSxZQXlLVDtBQUFBLFVBRUosQ0FBQztBQUFBLFVBR0EsQ0FBQyxXQUFXLGlCQUFpQixLQUM1QjtBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsT0FBTztBQUFBLGdCQUNMLFNBQVM7QUFBQSxnQkFDVCxVQUFVO0FBQUEsZ0JBQ1YsT0FBTztBQUFBLGdCQUNQLFFBQVE7QUFBQSxnQkFDUixjQUFjO0FBQUEsY0FDaEI7QUFBQSxjQUNBLGNBQWMsQ0FBQyxNQUFPLEVBQUUsY0FBYyxNQUFNLFFBQVE7QUFBQSxjQUNwRCxjQUFjLENBQUMsTUFBTyxFQUFFLGNBQWMsTUFBTSxRQUFRO0FBQUEsY0FDcEQsU0FBUyxNQUFNLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLFdBQVcsR0FBRyxLQUFLLEVBQUU7QUFBQSxjQUNyRjtBQUFBO0FBQUEsZ0JBQ087QUFBQSxnQkFBZTtBQUFBO0FBQUE7QUFBQSxVQUN2QjtBQUFBLFdBRUo7QUFBQSxXQTN0Qk0sR0FBRyxXQTZ0QmI7QUFBQSxJQUVKLENBQUMsR0FDSDtBQUFBLElBR0MsTUFBTSxhQUFhLG9DQUFvQyxTQUFTO0FBQUEsS0FDbkU7QUFFSjs7O0FEL2xETyxJQUFNLE9BQU87QUFDYixJQUFNLFNBQVMsQ0FBQyxTQUFTLFlBQVksWUFBWTtBQUVqRCxTQUFTLE1BQU0sS0FBMEI7QUFDOUMsTUFBSTtBQUNGO0FBQUMsSUFBQyxJQUFJLE1BQU0sT0FBZSxzQkFBc0IsTUFBTTtBQUNyRCxhQUFRLElBQUksTUFBTTtBQUFBLFFBQ2hCO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixVQUFVO0FBQUE7QUFBQSxVQUNWLFFBQVEsT0FBTztBQUFBLFlBQ2IsY0FBYyxDQUFDLGdCQUE4QixJQUFJLFlBQVksZUFBZSxXQUFXO0FBQUEsWUFDdkYsc0JBQXNCLE9BQU8sYUFBMEIsUUFBZ0IsYUFBcUI7QUFDMUYsa0JBQUk7QUFFRixzQkFBTSxZQUFZLE1BQU0sSUFBSSxZQUFZLG1CQUFtQixXQUFXO0FBQ3RFLG9CQUFJLFdBQVc7QUFDYix3QkFBTSxnQkFBZ0IsbUJBQW1CLFFBQVEsVUFBVSxTQUE4QjtBQUN6RixzQkFBSSxVQUFVLE9BQU8sU0FBUztBQUFBLGdCQUNoQztBQUFBLGNBQ0YsU0FBUyxLQUFLO0FBQ1osd0JBQVEsTUFBTSxxREFBcUQsR0FBRztBQUFBLGNBQ3hFO0FBQUEsWUFDRjtBQUFBLFlBQ0EsTUFBTSxDQUFDLGNBQXlCLElBQUksVUFBVSxPQUFPLFNBQVM7QUFBQSxZQUM5RCxpQkFBaUIsT0FBTyxhQUEwQixVQUFrQjtBQUNsRSxvQkFBTSxJQUFJLFlBQVksU0FBUyxhQUFhLEtBQUs7QUFBQSxZQUNuRDtBQUFBLFlBQ0EsaUJBQWlCLE9BQU8sZ0JBQTZCO0FBQ25ELG9CQUFNLElBQUksWUFBWSxTQUFTLFdBQVc7QUFBQSxZQUM1QztBQUFBLFlBQ0EsaUJBQWlCLENBQUMsVUFBNEIsSUFBSSxZQUFZLFNBQVMsS0FBSztBQUFBLFlBQzVFLGVBQWUsTUFBTSxJQUFJLFlBQVksZ0JBQWdCO0FBQUEsWUFDckQsZUFBZSxPQUFPLFdBQXNCLFVBQWtCO0FBQzVELG9CQUFNLFVBQVUsSUFBSSxVQUFVLFVBQVUsU0FBUyxHQUFHO0FBQ3BELGtCQUFJLFNBQVM7QUFDWCxzQkFBTSxRQUFRLE9BQU8sS0FBSztBQUFBLGNBQzVCO0FBQUEsWUFDRjtBQUFBLFlBQ0EsZ0JBQWdCLE9BQU8sY0FBeUI7QUFDOUMsb0JBQU0sSUFBSSxZQUFZLGlCQUFpQixTQUFTO0FBQUEsWUFDbEQ7QUFBQSxZQUNBLGFBQWEsQ0FBQyxjQUF5QjtBQUNyQyxrQkFBSSxVQUFVLE9BQU8sRUFBRSxXQUFXLGVBQWUsS0FBSyxDQUFDLEVBQ3BELEtBQUssQ0FBQyxZQUFZO0FBQUUsb0JBQUksVUFBVSxPQUFPLE9BQU87QUFBQSxjQUFFLENBQUMsRUFDbkQsTUFBTSxNQUFNO0FBQUEsY0FBQyxDQUFDO0FBQUEsWUFDbkI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxTQUFTLEtBQUs7QUFDWixZQUFRLE1BQU0sK0NBQStDLEdBQUc7QUFBQSxFQUNsRTtBQUNGOyIsCiAgIm5hbWVzIjogWyJuYW1lIiwgImltcG9ydF9qc3hfcnVudGltZSIsICJpbXBvcnRfanN4X3J1bnRpbWUiXQp9Cg==

return module.exports;
} });
