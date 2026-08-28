# 🌲 dsh-workspace-tree

<p align="center">
  <strong>English</strong> | <strong><a href="./README.zh.md">简体中文</a></strong>
</p>

> **Virtual Session Folder Grouping, Move-to-Folder Menu, and Nested Workspace Subproject Manager for DeepSeek Harness (DSH).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-success.svg)](https://github.com/pipipigu/dsh-workspace-tree)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-6e9f18.svg)](https://vitest.dev/)

---

## 📸 Visual Previews

### 1. Sidebar Overview & Core Features

![dsh-workspace-tree Sidebar Overview](docs/preview-main.svg)

---

### 2. Precision Click-to-Move Folder Menu

![dsh-workspace-tree Move-to-Folder Interaction](docs/preview-move-menu.svg)

---

## 🌟 Key Features

- **📁 Virtual Session Folders**
  - **Zero Filesystem Pollution**: Never moves or modifies underlying conversation logs or physical directories. Metadata is atomically persisted at `.dsh/workspace-tree.json`.
  - **Multi-Workspace Stability**: Independent classification and pin queue per workspace. Folders remain persistent and stable across workspace switches.
  - **Full Folder Lifecycle**: Create, inline rename (double-click), custom color badge, and delete (internal sessions safely fallback to uncategorized).

- **➕ Folder-Scoped Session Creation**
  - Hover on any folder and click **`[+]`** to start a new conversation **directly inside that targeted folder** with atomic SessionId binding, avoiding race conditions.

- **🚀 Active Task Banner & Read-to-Dismiss**
  - **Compact 28px Top Capsule**: Pins active running tasks and unread completed conversations at the top of the sidebar.
  - **Smooth Lifecycle Transition**: Pulsing blue dot during generation -> persistent green `[Unread]` badge when completed in background -> automatically dismissed upon reading.
  - **Deep-Jump & Auto-Expand**: One-click navigation that automatically expands the parent workspace and folder.

- **📂 Precision Move-to-Folder Dropdown Menu**
  - **Zero Misclicks**: Replaced awkward sidebar drag-and-drop with a crisp, reliable click-to-move dropdown menu.
  - **Instant Categorization**: Quick folder selection or inline new folder creation; dedicated eject button inside folders to return sessions to uncategorized.

- **📌 Session Pinning, Inline Rename & Pagination**
  - Pin important sessions to the top of the workspace.
  - Double-click any session title to activate inline renaming.
  - Displays top 10 sessions by default with an expander for remaining items.

- **🎨 Native Single Slot Shadowing**
  - Seamlessly shadows the native `sidebar.workspaces` slot with `priority: -10`, blending with DSH dark/light color schemes (`--dsw-*`).
  - Pure SVG vector icons with zero emoji clutter.

- **⚡ 0ms Reactive Engine (Version Snapshot)**
  - Powered by `useSyncExternalStore` with immutable version increment snapshots, ensuring instant 0ms UI re-renders on any action.

---

## 📦 Installation

### Option A: Install from GitHub (Recommended)

Run the following command in your terminal:

```bash
dsh plugin --profile web add github:pipipigu/dsh-workspace-tree
```

Restart your DSH Web instance (or refresh the browser) to enjoy!

### Option B: Local Development (Link Mode)

```bash
# 1. Clone repository
git clone https://github.com/pipipigu/dsh-workspace-tree.git
cd dsh-workspace-tree

# 2. Install dependencies & build
pnpm install
pnpm build

# 3. Link to DSH Web Profile
dsh plugin --profile web add link:$(pwd)
```

---

## 🏗️ Architecture & Data Flow

![dsh-workspace-tree Architecture & Data Flow](docs/architecture.svg)

---

## 🛠️ Development & Commands

```bash
# Install dependencies
pnpm install

# Type checking (0 errors)
pnpm typecheck

# Unit tests (Vitest)
pnpm test

# Production build (generates lib/index.js & lib/client.js)
pnpm build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
