# @dsh-external/dsh-workspace-tree

DeepSeek Harness (DSH) 虚拟会话分类与嵌套工作区管理器插件。

## 🌟 核心特性

1. **工作区内纯虚拟会话文件夹分类（Virtual Session Folders）**
   - 零侵入、零破坏：不挪动底层会话物理文件，元数据持久化于项目根目录 `.dsh/workspace-tree.json`；
   - 顶部常驻「📥 未分类会话 (Inbox)」收件箱分区，新会话自动沉淀；
   - 支持新建、重命名、删除分类文件夹，并支持自定义文件夹徽标颜色；
   - 原生 HTML5 拖拽（Drag & Drop）支持：支持自由拖拽会话归类或移回收件箱；
   - 展开/折叠状态按工作区独立记忆。

2. **父子嵌套工作区与子项目管理（Nested Subprojects）**
   - 自动嗅探识别子工程（Node / Rust / Python / Java / Go / 通用工程）；
   - 在子工程节点下一键创建独立原生会话，其 `CWD`、代码图谱（CodeGraph）、项目记忆与规则 100% 对齐子工程隔离环境。

3. **原生侧边栏无感增强（Native Sidebar Enhancement）**
   - 直接无缝融合进 DSH 原生侧边栏，自适应暗色/亮色主题（`--dsw-*`）；
   - Local-First 响应式状态机（TreeStore），操作即时响应并异步落盘。

## 📦 安装与启用

```bash
# 在当前 profile 添加本地插件
dsh plugin --profile web add link:/home/ppz/project/dsh/dsh-workspace-tree
```

## 🛠️ 构建与测试

```bash
# 类型检查
pnpm typecheck

# 单元测试
pnpm test

# 打包构建
pnpm build
```

## 📄 License
MIT
