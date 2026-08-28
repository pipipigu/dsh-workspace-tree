import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { SessionId, WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client'
import { globalTreeStore } from './tree-store.ts'
import type { VirtualFolder, SubprojectInfo } from '../shared/types.ts'
import { formatRelativeTime } from './time.ts'
import {
  AddFolderIcon,
  ChatIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  EllipsisIcon,
  FolderIcon,
  ForkIcon,
  MoveOutIcon,
  MoveToFolderIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from './components/Icons.tsx'
import { CompletedDot, PendingDot, RunningDot } from './components/StateIndicator.tsx'

export interface EnhancedWorkspaceBrowserProps {
  useWorkspaces?: (selector: (s: any) => any) => any
  useSessions?: (selector: (s: any) => any) => any
  renderSlot?: (slotName: string, owner?: any) => React.ReactNode
  useDirectoryFlow?: (selector: (occupied: boolean) => any) => any
  startSession?: (workspaceId?: WorkspaceId) => void
  startSessionInFolder?: (workspaceId: WorkspaceId, wsPath: string, folderId: string) => Promise<void>
  open?: (sessionId: SessionId) => void
  renameWorkspace?: (workspaceId: WorkspaceId, title: string) => Promise<void>
  deleteWorkspace?: (workspaceId: WorkspaceId) => Promise<void>
  createWorkspace?: (input: { path: string }) => Promise<WorkspaceView>
  pickDirectory?: () => Promise<string | null>
  renameSession?: (sessionId: SessionId, title: string) => Promise<void>
  archiveSession?: (sessionId: SessionId) => Promise<void>
  forkSession?: (sessionId: SessionId) => void
}

const DEFAULT_VISIBLE_LIMIT = 10
const PRESET_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#c084fc', '#38bdf8']

/** Check if a session is just an empty placeholder like "session-cf6fe168" */
function isBlankPlaceholder(id: string, title?: string, isBlank = false, isActive = false): boolean {
  if (isActive) return false
  if (isBlank) return true
  if (!title) return true
  if (title === id) return true
  if (/^session-[a-z0-9-]+$/i.test(title)) return true
  return false
}

const DSH_INPUT_STYLE: React.CSSProperties = {
  boxSizing: 'border-box',
  padding: '1px 6px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--dsw-alias-label-primary, #f8fafc)',
  fontSize: '13px',
  lineHeight: '20px',
  outline: 'none',
  fontFamily: 'inherit',
}

interface BannerTask {
  sessionId: string
  title: string
  status: 'running' | 'pending' | 'completed'
  ws?: WorkspaceView
}

const TASK_STYLE_CONFIG = {
  running: {
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.22)',
    hoverBg: 'rgba(96, 165, 250, 0.16)',
    hoverBorder: 'rgba(96, 165, 250, 0.45)',
    tagText: '进行中',
    tagColor: '#60a5fa',
    tagBg: 'rgba(96, 165, 250, 0.14)',
    titlePrefix: '正在进行',
  },
  pending: {
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.25)',
    hoverBg: 'rgba(251, 191, 36, 0.16)',
    hoverBorder: 'rgba(251, 191, 36, 0.5)',
    tagText: '待确认',
    tagColor: '#fbbf24',
    tagBg: 'rgba(251, 191, 36, 0.14)',
    titlePrefix: '等待确认',
  },
  completed: {
    bg: 'rgba(74, 222, 128, 0.08)',
    border: 'rgba(74, 222, 128, 0.25)',
    hoverBg: 'rgba(74, 222, 128, 0.16)',
    hoverBorder: 'rgba(74, 222, 128, 0.5)',
    tagText: '待读',
    tagColor: '#4ade80',
    tagBg: 'rgba(74, 222, 128, 0.14)',
    titlePrefix: '已执行完毕待阅读',
  },
}

export const EnhancedWorkspaceBrowser: React.FC<EnhancedWorkspaceBrowserProps> = (props) => {
  // Subscribe to TreeStore changes with reactive version counter (guarantees instant 0ms re-renders)
  useSyncExternalStore(
    (cb) => globalTreeStore.subscribe(cb),
    () => globalTreeStore.getVersion(),
  )

  let workspacesState: {
    items?: readonly WorkspaceView[]
    archivedSessionIds?: readonly SessionId[]
    recentWorkspaceId?: WorkspaceId
  } = { items: [], archivedSessionIds: [] }

  try {
    if (props.useWorkspaces) {
      workspacesState = props.useWorkspaces((s: any) => s) || { items: [], archivedSessionIds: [] }
    }
  } catch {
    // ignore
  }

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newWorkspacePath, setNewWorkspacePath] = useState('')
  const [isSubmittingWs, setIsSubmittingWs] = useState(false)
  const [addWsError, setAddWsError] = useState<string | null>(null)
  const [activeMenuWsId, setActiveMenuWsId] = useState<string | null>(null)
  const [editingWsId, setEditingWsId] = useState<string | null>(null)
  const [editWsTitle, setEditWsTitle] = useState('')
  const [isCreatingFolderWsId, setIsCreatingFolderWsId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')

  // Local unread completion tracker (reactive to running true->false edge when not active)
  const [localUnreadSet, setLocalUnreadSet] = useState<Set<string>>(new Set())
  const prevRunningMap = useRef<Map<string, boolean>>(new Map())

  // Session rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editSessionTitle, setEditSessionTitle] = useState('')
  
  // Session move-to-folder dropdown menu state
  const [activeMoveMenuSessionId, setActiveMoveMenuSessionId] = useState<string | null>(null)
  
  const [showAllSessionsMap, setShowAllSessionsMap] = useState<Record<string, boolean>>({})

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuWsId(null)
      }
      const target = e.target as HTMLElement
      if (!target.closest('.move-menu-container') && !target.closest('.move-menu-btn')) {
        setActiveMoveMenuSessionId(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuWsId(null)
        setActiveMoveMenuSessionId(null)
        setEditingWsId(null)
        setIsCreatingFolderWsId(null)
        setEditingFolderId(null)
        setEditingSessionId(null)
      }
    }
    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  let sessionsState: {
    ids?: SessionId[]
    byId?: Record<string, { sessionId: SessionId; title?: string; updatedAt?: number; running?: boolean; pendingInteraction?: any; completed?: boolean; blank?: boolean }>
    current?: SessionId
  } = { ids: [], byId: {} }

  try {
    if (props.useSessions) {
      sessionsState = props.useSessions((s: any) => s) || {}
    }
  } catch {
    // ignore
  }

  const activeSessionId = sessionsState.current as unknown as string | undefined
  const items: readonly WorkspaceView[] = workspacesState.items || []
  const archivedSessionIds: readonly SessionId[] = workspacesState.archivedSessionIds || []
  const archivedSet = useMemo(() => new Set(archivedSessionIds.map(String)), [archivedSessionIds])

  // Preload all workspace metadata once items arrive
  useEffect(() => {
    for (const ws of items) {
      if (ws.path) {
        globalTreeStore.getMetaForWorkspace(ws.path)
      }
    }
  }, [items])

  // Watch running -> completed transitions for background unread reminders
  useEffect(() => {
    const byId = sessionsState.byId || {}
    const newUnread = new Set(localUnreadSet)
    let changed = false

    for (const [id, session] of Object.entries(byId)) {
      if (archivedSet.has(id)) {
        if (newUnread.has(id)) {
          newUnread.delete(id)
          changed = true
        }
        continue
      }
      const wasRunning = prevRunningMap.current.get(id) || false
      const isNowRunning = Boolean(session?.running)

      // Transition: running true -> false while NOT active session => Mark as Unread
      if (wasRunning && !isNowRunning && id !== activeSessionId) {
        newUnread.add(id)
        changed = true
      }

      // If active session, clear unread
      if (id === activeSessionId && newUnread.has(id)) {
        newUnread.delete(id)
        changed = true
      }

      prevRunningMap.current.set(id, isNowRunning)
    }

    if (changed) {
      setLocalUnreadSet(newUnread)
    }
  }, [sessionsState.byId, activeSessionId, archivedSet])

  // Clear unread on session open
  const handleOpenSession = (sessionId: string) => {
    if (localUnreadSet.has(sessionId)) {
      const next = new Set(localUnreadSet)
      next.delete(sessionId)
      setLocalUnreadSet(next)
    }
    props.open?.(sessionId as unknown as SessionId)
  }

  useEffect(() => {
    if (items.length > 0 && expandedWorkspaces.size === 0) {
      const targetId = workspacesState.recentWorkspaceId || items[0]?.workspaceId
      if (targetId) {
        setExpandedWorkspaces(new Set([targetId]))
        const first = items.find((w) => w.workspaceId === targetId)
        if (first?.path) globalTreeStore.loadWorkspace(first.path)
      }
    }
  }, [items, workspacesState.recentWorkspaceId])

  const toggleWorkspace = (wsId: string, wsPath: string) => {
    const next = new Set(expandedWorkspaces)
    if (next.has(wsId)) {
      next.delete(wsId)
      setShowAllSessionsMap((prev) => ({ ...prev, [wsId]: false }))
    } else {
      next.add(wsId)
      globalTreeStore.loadWorkspace(wsPath)
    }
    setExpandedWorkspaces(next)
  }

  const handleCreateFolder = async (wsPath: string) => {
    if (newFolderName.trim()) {
      await globalTreeStore.createFolder(wsPath, newFolderName.trim())
      setNewFolderName('')
      setIsCreatingFolderWsId(null)
    }
  }

  const handleSaveRenameWs = async (wsId: WorkspaceId) => {
    if (editWsTitle.trim() && props.renameWorkspace) {
      await props.renameWorkspace(wsId, editWsTitle.trim())
    }
    setEditingWsId(null)
    setActiveMenuWsId(null)
  }

  const handleSaveRenameSession = async (sessionId: string) => {
    if (editSessionTitle.trim() && props.renameSession) {
      await props.renameSession(sessionId as unknown as SessionId, editSessionTitle.trim())
    }
    setEditingSessionId(null)
  }

  // 删除会话：从本地文件夹清除 + 从未读清除 + 调用 DSH 核心归档删除
  const handleDeleteSession = async (wsPath: string, sessionId: string) => {
    try {
      if (localUnreadSet.has(sessionId)) {
        const next = new Set(localUnreadSet)
        next.delete(sessionId)
        setLocalUnreadSet(next)
      }
      await globalTreeStore.purgeSession(wsPath, sessionId)
      if (props.archiveSession) {
        await props.archiveSession(sessionId as unknown as SessionId)
      }
    } catch (err) {
      console.error('[dsh-workspace-tree] Delete session failed:', err)
    }
  }

  // 🌟 在指定文件夹内新建会话（直连 connectWorkspace 获取 SessionId 并归入文件夹，零时序竞态）
  const handleCreateSessionInFolder = async (wsId: WorkspaceId, wsPath: string, folderId: string) => {
    if (props.startSessionInFolder) {
      await props.startSessionInFolder(wsId, wsPath, folderId)
    } else {
      props.startSession?.(wsId)
    }
  }

  // 🌟 顶部活动与待读任务队列（进行中 / 待交互 / 已完成待读，点击阅读后自动消除）
  const bannerTasks = useMemo(() => {
    const list: BannerTask[] = []
    const byId = sessionsState.byId || {}

    for (const [sId, session] of Object.entries(byId)) {
      if (archivedSet.has(sId)) continue
      const isRunning = Boolean(session?.running)
      const isPending = Boolean(session?.pendingInteraction)
      const isUnreadCompleted = (Boolean(session?.completed) || localUnreadSet.has(sId)) && sId !== activeSessionId

      const ownerWs = items.find((w) => (w.sessionIds || []).includes(sId as unknown as SessionId))
      const title = session?.title || sId.slice(0, 16)

      if (isRunning) {
        list.push({ sessionId: sId, title, status: 'running', ws: ownerWs })
      } else if (isPending) {
        list.push({ sessionId: sId, title, status: 'pending', ws: ownerWs })
      } else if (isUnreadCompleted) {
        list.push({ sessionId: sId, title, status: 'completed', ws: ownerWs })
      }
    }

    const order: Record<'running' | 'pending' | 'completed', number> = { running: 0, pending: 1, completed: 2 }
    return list.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0))
  }, [sessionsState.byId, items, localUnreadSet, activeSessionId, archivedSet])

  // 点击任务：一键展开对应工作区、展开文件夹、打开对话并消除未读
  const handleJumpToActiveTask = (sessionId: string, ownerWs?: WorkspaceView) => {
    if (ownerWs) {
      setExpandedWorkspaces((prev) => new Set([...prev, ownerWs.workspaceId]))
      const meta = globalTreeStore.getMetaForWorkspace(ownerWs.path)
      const targetFolder = meta.folders.find((f) => f.sessionIds.includes(sessionId))
      if (targetFolder && targetFolder.collapsed) {
        globalTreeStore.toggleFolder(ownerWs.path, targetFolder.id)
      }
    }
    handleOpenSession(sessionId)
  }

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((ws) => {
      const matchTitle = (ws.title || '').toLowerCase().includes(q)
      const matchSessions = (ws.sessionIds || []).some((sId) => {
        const sidStr = sId as unknown as string
        if (archivedSet.has(sidStr)) return false
        const title = sessionsState.byId?.[sidStr]?.title || ''
        return title.toLowerCase().includes(q)
      })
      return matchTitle || matchSessions
    })
  }, [items, searchQuery, sessionsState.byId, archivedSet])

  // DSH 原生 DirectoryFlow 交互状态
  const [flowOpen, setFlowOpen] = useState(false)
  const [pickingFolder, setPickingFolder] = useState(false)

  const flowOwner = {
    open: flowOpen,
    busy: pickingFolder,
    onPicked: async (path: string) => {
      setPickingFolder(true)
      try {
        const res = await props.createWorkspace?.({ path })
        if (res) {
          const wsId = (res as any).workspaceId || (res as any).id
          if (wsId) {
            setExpandedWorkspaces((prev) => new Set([...prev, wsId]))
            props.startSession?.(wsId)
          }
          globalTreeStore.loadWorkspace(path)
        }
      } catch (err) {
        console.error('[dsh-workspace-tree] Create workspace from flow failed:', err)
      } finally {
        setPickingFolder(false)
        setFlowOpen(false)
        setIsAddModalOpen(false)
      }
    },
    onCancel: () => {
      setFlowOpen(false)
    },
    onError: (msg: string) => {
      console.warn('[dsh-workspace-tree] Directory flow error:', msg)
      setFlowOpen(false)
    },
  }

  const handleOpenAddWorkspace = () => {
    setAddWsError(null)
    setNewWorkspacePath('')
    setIsAddModalOpen(true)
    setShowSearch(false)
  }

  const handlePickFromOS = async () => {
    setFlowOpen(true)
    if (props.pickDirectory) {
      try {
        const picked = await props.pickDirectory()
        if (picked) {
          await flowOwner.onPicked(picked)
        }
      } catch (err) {
        console.warn('[dsh-workspace-tree] pickDirectory failed:', err)
      }
    }
  }

  const handleConfirmAddWorkspace = async (customPath?: string) => {
    const targetPath = (customPath || newWorkspacePath).trim()
    if (!targetPath) {
      setAddWsError('请输入工作区目录的绝对路径')
      return
    }
    setIsSubmittingWs(true)
    setAddWsError(null)
    try {
      const res = await props.createWorkspace?.({ path: targetPath })
      if (res) {
        const wsId = (res as any).workspaceId || (res as any).id
        if (wsId) {
          setExpandedWorkspaces((prev) => new Set([...prev, wsId]))
          props.startSession?.(wsId)
        }
        globalTreeStore.loadWorkspace(targetPath)
        setIsAddModalOpen(false)
        setNewWorkspacePath('')
      }
    } catch (err: any) {
      console.error('[dsh-workspace-tree] Create workspace failed:', err)
      setAddWsError(err?.message || '创建工作区失败，请检查目录路径是否存在且有效')
    } finally {
      setIsSubmittingWs(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', userSelect: 'none', fontFamily: 'inherit' }}>
      {/* 1. Header Bar: 工作区 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 6px', color: 'var(--dsw-alias-label-primary, #f8fafc)', fontSize: '13px', fontWeight: 600 }}>
        <span>工作区</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            style={{
              background: isAddModalOpen ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              border: 'none',
              color: isAddModalOpen ? '#60a5fa' : 'var(--dsw-alias-label-tertiary, #94a3b8)',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="添加/新建工作区"
            onClick={handleOpenAddWorkspace}
          >
            <PlusIcon size={14} />
          </button>
          <button
            style={{
              background: showSearch ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              border: 'none',
              color: showSearch ? '#60a5fa' : 'var(--dsw-alias-label-tertiary, #94a3b8)',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="搜索工作区或会话"
            onClick={() => {
              setShowSearch(!showSearch)
              setIsAddModalOpen(false)
            }}
          >
            <SearchIcon size={14} />
          </button>
        </div>
      </div>

      {/* 🌟 添加/新建工作区居中对话框 (Modal Overlay & Card) */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              width: '420px',
              maxWidth: '92vw',
              borderRadius: '10px',
              background: '#151b28',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
              padding: '18px 20px',
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderIcon size={18} color="#60a5fa" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>添加 / 新建工作区</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'inline-flex' }}
                onClick={() => setIsAddModalOpen(false)}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            {/* Path Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>目录绝对路径 (Directory Path):</label>
              <input
                autoFocus
                style={{
                  ...DSH_INPUT_STYLE,
                  width: '100%',
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
                placeholder="/home/ppz/project/my-workspace"
                value={newWorkspacePath}
                onChange={(e) => setNewWorkspacePath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddWorkspace()
                  if (e.key === 'Escape') setIsAddModalOpen(false)
                }}
              />
              {addWsError && (
                <span style={{ fontSize: '11px', color: '#f87171' }}>{addWsError}</span>
              )}
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>快速填入参考目录:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['/home/ppz/project', '/home/ppz/project/dsh', '/home/ppz'].map((p) => (
                  <button
                    key={p}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onClick={() => setNewWorkspacePath(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={handlePickFromOS}
              >
                📂 浏览系统目录...
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  取消
                </button>
                <button
                  disabled={isSubmittingWs}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isSubmittingWs ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingWs ? 0.6 : 1,
                  }}
                  onClick={() => handleConfirmAddWorkspace()}
                >
                  {isSubmittingWs ? '正在创建...' : '创建并进入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 紧凑搜索输入框 */}
      {showSearch && (
        <div style={{ padding: '2px 10px 6px' }}>
          <input
            autoFocus
            style={{
              ...DSH_INPUT_STYLE,
              width: '100%',
              height: '28px',
              padding: '0 8px',
              borderRadius: '6px',
            }}
            placeholder="搜索工作区或会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* 2. 顶部活动/待读任务 (单行极简精致胶囊 28px 高度，进行中/待确认/待读) */}
      {bannerTasks.length > 0 && (
        <div style={{ padding: '2px 8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {bannerTasks.map((task) => {
            const conf = TASK_STYLE_CONFIG[task.status]
            return (
              <div
                key={task.sessionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '28px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  background: conf.bg,
                  border: `1px solid ${conf.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={`${conf.titlePrefix} (点击直达${task.status === 'completed' ? '并消除待读' : ''}，位于: ${task.ws?.title || '当前工作区'})`}
                onClick={() => handleJumpToActiveTask(task.sessionId, task.ws)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = conf.hoverBg
                  e.currentTarget.style.borderColor = conf.hoverBorder
                  const chevron = e.currentTarget.querySelector('.task-chevron') as HTMLElement
                  if (chevron) chevron.style.color = 'var(--dsw-alias-label-primary, #fff)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = conf.bg
                  e.currentTarget.style.borderColor = conf.border
                  const chevron = e.currentTarget.querySelector('.task-chevron') as HTMLElement
                  if (chevron) chevron.style.color = 'var(--dsw-alias-label-tertiary, #94a3b8)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                  {task.status === 'running' ? (
                    <RunningDot size={12} />
                  ) : task.status === 'pending' ? (
                    <PendingDot size={12} />
                  ) : (
                    <CompletedDot size={12} />
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dsw-alias-label-primary, #f8fafc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  {task.ws?.title && (
                    <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                      · {task.ws.title}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: conf.tagColor,
                      background: conf.tagBg,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      lineHeight: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {conf.tagText}
                  </span>
                  <span className="task-chevron" style={{ color: 'var(--dsw-alias-label-tertiary, #94a3b8)', paddingLeft: '2px', transition: 'color 0.15s ease' }}>
                    <ChevronRightIcon size={11} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Workspaces Tree List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 6px' }}>
        {filteredWorkspaces.map((ws) => {
          const isExpanded = expandedWorkspaces.has(ws.workspaceId)
          
          // 🌟 读取每个工作区独立的元数据（永久稳定常驻）
          const wsMeta = globalTreeStore.getMetaForWorkspace(ws.path)
          const wsPinnedSet = new Set(wsMeta.pinnedSessionIds || [])

          const rawSessions = (ws.sessionIds || []).map((sId) => {
            const sidStr = sId as unknown as string
            const session = sessionsState.byId?.[sidStr]
            const isUnread = Boolean(session?.completed || localUnreadSet.has(sidStr))

            return {
              id: sidStr,
              title: session?.title || sidStr.slice(0, 16),
              updatedAt: session?.updatedAt || 0,
              running: Boolean(session?.running),
              pendingInteraction: session?.pendingInteraction,
              completed: isUnread && sidStr !== activeSessionId,
              blank: Boolean(session?.blank),
              isPinned: wsPinnedSet.has(sidStr),
            }
          })

          const validSessions = rawSessions
            .filter((s) => !archivedSet.has(s.id))
            .filter((s) => !isBlankPlaceholder(s.id, s.title, s.blank, activeSessionId === s.id))
            .sort((a, b) => {
              if (a.running !== b.running) return a.running ? -1 : 1
              if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
              return (b.updatedAt || 0) - (a.updatedAt || 0)
            })

          const categorizedSessionIds = new Set<string>()
          for (const f of wsMeta.folders) {
            for (const sId of f.sessionIds) categorizedSessionIds.add(sId)
          }

          const uncategorizedSessions = validSessions.filter((s) => !categorizedSessionIds.has(s.id))
          const showAll = showAllSessionsMap[ws.workspaceId] || false
          const visibleUncategorized = showAll ? uncategorizedSessions : uncategorizedSessions.slice(0, DEFAULT_VISIBLE_LIMIT)
          const remainingCount = uncategorizedSessions.length - DEFAULT_VISIBLE_LIMIT

          const renderMoveDropdown = (sId: string) => {
            if (activeMoveMenuSessionId !== sId) return null
            const isCategorized = categorizedSessionIds.has(sId)
            return (
              <div
                className="move-menu-container"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 9999,
                  minWidth: '160px',
                  background: 'var(--dsw-alias-bg-layer-2, #1e293b)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', padding: '4px 8px', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  移动至目标文件夹:
                </div>
                {wsMeta.folders.length === 0 ? (
                  <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #64748b)' }}>
                    暂无文件夹，请先创建
                  </div>
                ) : (
                  wsMeta.folders.map((f) => {
                    const inThisFolder = f.sessionIds.includes(sId)
                    return (
                      <div
                        key={f.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: inThisFolder ? '#60a5fa' : 'var(--dsw-alias-label-primary, #e2e8f0)',
                          background: inThisFolder ? 'rgba(96, 165, 250, 0.12)' : 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = inThisFolder ? 'rgba(96, 165, 250, 0.12)' : 'transparent')}
                        onClick={async () => {
                          await globalTreeStore.moveSession(ws.path, sId, f.id)
                          setActiveMoveMenuSessionId(null)
                        }}
                      >
                        <FolderIcon size={13} color={f.color || '#60a5fa'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                        {inThisFolder && <span style={{ fontSize: '10px', color: '#60a5fa' }}>✓</span>}
                      </div>
                    )
                  })
                )}

                {/* 如果已经在某个文件夹内，显示移出选项 */}
                {isCategorized && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#cbd5e1',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      marginTop: '2px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={async () => {
                      await globalTreeStore.moveSession(ws.path, sId, null)
                      setActiveMoveMenuSessionId(null)
                    }}
                  >
                    <MoveOutIcon size={12} />
                    <span>移出至未分类</span>
                  </div>
                )}
              </div>
            )
          }

          return (
            <div key={ws.workspaceId} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Workspace Row Item */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '34px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isExpanded ? 'var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))' : 'transparent',
                  color: 'var(--dsw-alias-label-primary, #f8fafc)',
                  fontSize: '13px',
                  fontWeight: 500,
                  position: 'relative',
                }}
                onClick={() => toggleWorkspace(ws.workspaceId, ws.path)}
                onMouseEnter={(e) => {
                  const actions = e.currentTarget.querySelector('.ws-actions') as HTMLElement
                  if (actions) actions.style.display = 'inline-flex'
                }}
                onMouseLeave={(e) => {
                  const actions = e.currentTarget.querySelector('.ws-actions') as HTMLElement
                  if (actions && activeMenuWsId !== ws.workspaceId) actions.style.display = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                  <ChevronRightIcon
                    size={12}
                    style={{
                      color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                    }}
                  />
                  <FolderIcon size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
                  {editingWsId === ws.workspaceId ? (
                    <input
                      autoFocus
                      style={{
                        ...DSH_INPUT_STYLE,
                        minWidth: 0,
                        flex: 1,
                        marginRight: '6px',
                      }}
                      value={editWsTitle}
                      onChange={(e) => setEditWsTitle(e.target.value)}
                      onBlur={() => handleSaveRenameWs(ws.workspaceId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameWs(ws.workspaceId)
                        if (e.key === 'Escape') setEditingWsId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ws.path}>
                      {ws.title}
                    </span>
                  )}
                </div>

                {/* Workspace Action Buttons */}
                <div
                  className="ws-actions"
                  style={{ display: activeMenuWsId === ws.workspaceId ? 'inline-flex' : 'none', alignItems: 'center', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="在当前工作区新建分类文件夹"
                    onClick={() => {
                      if (!isExpanded) toggleWorkspace(ws.workspaceId, ws.path)
                      setIsCreatingFolderWsId(ws.workspaceId)
                    }}
                  >
                    <AddFolderIcon size={14} />
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="新建会话"
                    onClick={() => props.startSession?.(ws.workspaceId)}
                  >
                    <PlusIcon size={14} />
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="更多操作"
                    onClick={() => setActiveMenuWsId(activeMenuWsId === ws.workspaceId ? null : ws.workspaceId)}
                  >
                    <EllipsisIcon size={14} />
                  </button>
                </div>

                {/* 弹出菜单 */}
                {activeMenuWsId === ws.workspaceId && (
                  <div
                    ref={menuRef}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '32px',
                      zIndex: 100,
                      background: 'var(--dsw-surface-0, #181818)',
                      border: '1px solid var(--dsw-border-default, rgba(255, 255, 255, 0.08))',
                      borderRadius: '8px',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
                      padding: '4px',
                      minWidth: '120px',
                      backdropFilter: 'blur(12px)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--dsw-alias-label-primary, #f8fafc)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => {
                        setEditingWsId(ws.workspaceId)
                        setEditWsTitle(ws.title)
                        setActiveMenuWsId(null)
                      }}
                    >
                      <EditIcon size={13} />
                      <span>重命名</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#f87171',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => {
                        props.deleteWorkspace?.(ws.workspaceId)
                        setActiveMenuWsId(null)
                      }}
                    >
                      <TrashIcon size={13} />
                      <span>删除工作区</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Content (Folders + Sessions) */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '14px' }}>
                  {/* Inline New Folder Input Form */}
                  {isCreatingFolderWsId === ws.workspaceId && (
                    <div style={{ padding: '4px 6px' }}>
                      <input
                        autoFocus
                        style={{
                          ...DSH_INPUT_STYLE,
                          width: '100%',
                          height: '26px',
                          padding: '0 8px',
                        }}
                        placeholder="输入文件夹名称 (回车创建, ESC取消)"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateFolder(ws.path)
                          if (e.key === 'Escape') setIsCreatingFolderWsId(null)
                        }}
                        onBlur={() => {
                          if (!newFolderName.trim()) setIsCreatingFolderWsId(null)
                          else handleCreateFolder(ws.path)
                        }}
                      />
                    </div>
                  )}

                  {/* A. Virtual Folders */}
                  {wsMeta.folders.map((folder) => {
                    const folderSessions = folder.sessionIds
                      .map((sId) => {
                        const session = sessionsState.byId?.[sId as unknown as string]
                        const isUnread = Boolean(session?.completed || localUnreadSet.has(sId))
                        return {
                          id: sId,
                          title: session?.title || sId.slice(0, 16),
                          updatedAt: session?.updatedAt || 0,
                          running: Boolean(session?.running),
                          pendingInteraction: session?.pendingInteraction,
                          completed: isUnread && sId !== activeSessionId,
                          blank: Boolean(session?.blank),
                          isPinned: wsPinnedSet.has(sId),
                        }
                      })
                      .filter((s) => !archivedSet.has(s.id))
                      .sort((a, b) => {
                        if (a.running !== b.running) return a.running ? -1 : 1
                        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
                        return (b.updatedAt || 0) - (a.updatedAt || 0)
                      })

                    return (
                      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Folder Header Row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '30px',
                            padding: '0 6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'var(--dsw-alias-label-primary, #e2e8f0)',
                            background: 'transparent',
                            border: '1px solid transparent',
                            fontSize: '12px',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => globalTreeStore.toggleFolder(ws.path, folder.id)}
                          onMouseEnter={(e) => {
                            const actions = e.currentTarget.querySelector('.folder-actions') as HTMLElement
                            if (actions) actions.style.display = 'inline-flex'
                          }}
                          onMouseLeave={(e) => {
                            const actions = e.currentTarget.querySelector('.folder-actions') as HTMLElement
                            if (actions) actions.style.display = 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                            <ChevronRightIcon
                              size={10}
                              style={{
                                color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                                transform: folder.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                transition: 'transform 0.15s ease',
                                flexShrink: 0,
                              }}
                            />
                            <FolderIcon size={14} color={folder.color || '#60a5fa'} style={{ flexShrink: 0 }} />
                            {editingFolderId === folder.id ? (
                              <input
                                autoFocus
                                style={{
                                  ...DSH_INPUT_STYLE,
                                  minWidth: 0,
                                  flex: 1,
                                  height: '22px',
                                  fontSize: '12px',
                                  marginRight: '6px',
                                }}
                                value={editFolderName}
                                onChange={(e) => setEditFolderName(e.target.value)}
                                onBlur={async () => {
                                  if (editFolderName.trim()) await globalTreeStore.renameFolder(ws.path, folder.id, editFolderName.trim())
                                  setEditingFolderId(null)
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    if (editFolderName.trim()) await globalTreeStore.renameFolder(ws.path, folder.id, editFolderName.trim())
                                    setEditingFolderId(null)
                                  }
                                  if (e.key === 'Escape') setEditingFolderId(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} onDoubleClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}>
                                {folder.name}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #64748b)' }}>({folderSessions.length})</span>
                          </div>

                          {/* 🌟 文件夹操作栏：包含 [+] 在文件夹下直接新建会话 */}
                          <div className="folder-actions" style={{ display: 'none', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                              title="在此文件夹下新建会话"
                              onClick={() => handleCreateSessionInFolder(ws.workspaceId, ws.path, folder.id)}
                            >
                              <PlusIcon size={12} />
                            </button>
                            <button
                              style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                              title="重命名文件夹"
                              onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}
                            >
                              <EditIcon size={12} />
                            </button>
                            <button
                              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                              title="删除文件夹 (内部会话返回未分类)"
                              onClick={() => globalTreeStore.deleteFolder(ws.path, folder.id)}
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Folder Internal Sessions */}
                        {!folder.collapsed && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1px',
                              paddingLeft: '16px',
                            }}
                          >
                            {folderSessions.map((s) => {
                              const isActive = activeSessionId === s.id
                              const relTime = formatRelativeTime(s.updatedAt)

                              return (
                                <div
                                  key={s.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    height: '30px',
                                    padding: '0 6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    background: isActive ? 'var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))' : 'transparent',
                                    color: isActive ? 'var(--dsw-alias-state-business-primary, #93c5fd)' : 'var(--dsw-alias-label-primary, #cbd5e1)',
                                    fontSize: '12px',
                                    fontWeight: isActive ? 600 : 400,
                                    border: '1px solid transparent',
                                    transition: 'background 0.12s ease',
                                  }}
                                  onClick={() => handleOpenSession(s.id)}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSessionId(s.id)
                                    setEditSessionTitle(s.title)
                                  }}
                                  onMouseEnter={(e) => {
                                    const act = e.currentTarget.querySelector('.sess-act') as HTMLElement
                                    const tm = e.currentTarget.querySelector('.sess-time') as HTMLElement
                                    if (act) act.style.display = 'inline-flex'
                                    if (tm) tm.style.display = 'none'
                                  }}
                                  onMouseLeave={(e) => {
                                    const act = e.currentTarget.querySelector('.sess-act') as HTMLElement
                                    const tm = e.currentTarget.querySelector('.sess-time') as HTMLElement
                                    if (act) act.style.display = 'none'
                                    if (tm) tm.style.display = 'inline'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? 'auto' : 'none' }}>
                                    {s.running ? (
                                      <RunningDot size={12} />
                                    ) : s.pendingInteraction ? (
                                      <PendingDot />
                                    ) : s.completed ? (
                                      <CompletedDot size={12} />
                                    ) : s.isPinned ? (
                                      <PinIcon size={12} pinned={true} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                    ) : (
                                      <ChatIcon size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                                    )}

                                    {editingSessionId === s.id ? (
                                      <input
                                        autoFocus
                                        style={{
                                          ...DSH_INPUT_STYLE,
                                          minWidth: 0,
                                          flex: 1,
                                          height: '22px',
                                          fontSize: '12px',
                                          marginRight: '6px',
                                          pointerEvents: 'auto',
                                        }}
                                        value={editSessionTitle}
                                        onChange={(e) => setEditSessionTitle(e.target.value)}
                                        onBlur={() => handleSaveRenameSession(s.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveRenameSession(s.id)
                                          if (e.key === 'Escape') setEditingSessionId(null)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <span
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          userSelect: 'none',
                                          WebkitUserSelect: 'none',
                                        }}
                                        title={s.title}
                                      >
                                        {s.title}
                                      </span>
                                    )}
                                  </div>

                                  {editingSessionId !== s.id && (
                                    <span
                                      className="sess-time"
                                      style={{
                                        fontSize: '11px',
                                        color: s.running ? '#60a5fa' : s.completed ? '#4ade80' : 'var(--dsw-alias-label-tertiary, #64748b)',
                                        fontWeight: s.completed ? 500 : 400,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {s.running ? '生成中' : s.completed ? '已完成' : relTime}
                                    </span>
                                  )}

                                  {/* 会话悬停操作按钮组 */}
                                  <div className="sess-act" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
                                    <button
                                      style={{ background: 'transparent', border: 'none', color: s.isPinned ? '#fbbf24' : 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                                      title={s.isPinned ? '取消置顶' : '置顶会话'}
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        await globalTreeStore.togglePinSession(ws.path, s.id)
                                      }}
                                    >
                                      <PinIcon size={12} pinned={s.isPinned} />
                                    </button>
                                    <button
                                      style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                                      title="重命名会话"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingSessionId(s.id)
                                        setEditSessionTitle(s.title)
                                      }}
                                    >
                                      <EditIcon size={12} />
                                    </button>
                                    <button
                                      style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                                      title="分叉会话 (Fork)"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        props.forkSession?.(s.id as unknown as SessionId)
                                      }}
                                    >
                                      <ForkIcon size={12} />
                                    </button>
                                    {/* 移动至文件夹下拉菜单按钮 */}
                                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                                      <button
                                        className="move-menu-btn"
                                        style={{
                                          background: activeMoveMenuSessionId === s.id ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                                          border: 'none',
                                          color: activeMoveMenuSessionId === s.id ? '#60a5fa' : 'var(--dsw-alias-label-tertiary, #64748b)',
                                          cursor: 'pointer',
                                          padding: '2px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          borderRadius: '4px',
                                        }}
                                        title="移动会话至其他文件夹或未分类..."
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMoveMenuSessionId(activeMoveMenuSessionId === s.id ? null : s.id)
                                        }}
                                      >
                                        <MoveToFolderIcon size={12} />
                                      </button>
                                      {renderMoveDropdown(s.id)}
                                    </div>
                                    <button
                                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                      title="删除会话"
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        await handleDeleteSession(ws.path, s.id)
                                      }}
                                    >
                                      <TrashIcon size={12} />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* B. Uncategorized Sessions (Sorted by time + Pinned First + 10 Limit) */}
                  {visibleUncategorized.map((s) => {
                    const isActive = activeSessionId === s.id
                    const relTime = formatRelativeTime(s.updatedAt)

                    return (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '30px',
                          padding: '0 6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          background: isActive ? 'var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06))' : 'transparent',
                          color: isActive ? 'var(--dsw-alias-state-business-primary, #93c5fd)' : 'var(--dsw-alias-label-primary, #cbd5e1)',
                          fontSize: '12px',
                          fontWeight: isActive ? 600 : 400,
                          border: '1px solid transparent',
                          transition: 'background 0.12s ease',
                        }}
                        onClick={() => handleOpenSession(s.id)}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setEditingSessionId(s.id)
                          setEditSessionTitle(s.title)
                        }}
                        onMouseEnter={(e) => {
                          const act = e.currentTarget.querySelector('.sess-act') as HTMLElement
                          const tm = e.currentTarget.querySelector('.sess-time') as HTMLElement
                          if (act) act.style.display = 'inline-flex'
                          if (tm) tm.style.display = 'none'
                        }}
                        onMouseLeave={(e) => {
                          const act = e.currentTarget.querySelector('.sess-act') as HTMLElement
                          const tm = e.currentTarget.querySelector('.sess-time') as HTMLElement
                          if (act) act.style.display = 'none'
                          if (tm) tm.style.display = 'inline'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, pointerEvents: editingSessionId === s.id ? 'auto' : 'none' }}>
                          {s.running ? (
                            <RunningDot size={12} />
                          ) : s.pendingInteraction ? (
                            <PendingDot />
                          ) : s.completed ? (
                            <CompletedDot size={12} />
                          ) : s.isPinned ? (
                            <PinIcon size={12} pinned={true} style={{ color: '#fbbf24', flexShrink: 0 }} />
                          ) : (
                            <ChatIcon size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                          )}

                          {editingSessionId === s.id ? (
                            <input
                              autoFocus
                              style={{
                                ...DSH_INPUT_STYLE,
                                minWidth: 0,
                                flex: 1,
                                height: '22px',
                                fontSize: '12px',
                                marginRight: '6px',
                                pointerEvents: 'auto',
                              }}
                              value={editSessionTitle}
                              onChange={(e) => setEditSessionTitle(e.target.value)}
                              onBlur={() => handleSaveRenameSession(s.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRenameSession(s.id)
                                if (e.key === 'Escape') setEditingSessionId(null)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                              }}
                              title={s.title}
                            >
                              {s.title}
                            </span>
                          )}
                        </div>

                        {editingSessionId !== s.id && (
                          <span
                            className="sess-time"
                            style={{
                              fontSize: '11px',
                              color: s.running ? '#60a5fa' : s.completed ? '#4ade80' : 'var(--dsw-alias-label-tertiary, #64748b)',
                              fontWeight: s.completed ? 500 : 400,
                              flexShrink: 0,
                            }}
                          >
                            {s.running ? '生成中' : s.completed ? '已完成' : relTime}
                          </span>
                        )}

                        {/* 会话悬停操作按钮组 */}
                        <div className="sess-act" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
                          <button
                            style={{ background: 'transparent', border: 'none', color: s.isPinned ? '#fbbf24' : 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                            title={s.isPinned ? '取消置顶' : '置顶会话'}
                            onClick={async (e) => {
                              e.stopPropagation()
                              await globalTreeStore.togglePinSession(ws.path, s.id)
                            }}
                          >
                            <PinIcon size={12} pinned={s.isPinned} />
                          </button>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                            title="重命名会话"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSessionId(s.id)
                              setEditSessionTitle(s.title)
                            }}
                          >
                            <EditIcon size={12} />
                          </button>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-tertiary, #64748b)', cursor: 'pointer', padding: '2px' }}
                            title="分叉会话 (Fork)"
                            onClick={(e) => {
                              e.stopPropagation()
                              props.forkSession?.(s.id as unknown as SessionId)
                            }}
                          >
                            <ForkIcon size={12} />
                          </button>
                          {/* 移动至文件夹下拉菜单按钮 */}
                          <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <button
                              className="move-menu-btn"
                              style={{
                                background: activeMoveMenuSessionId === s.id ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                                border: 'none',
                                color: activeMoveMenuSessionId === s.id ? '#60a5fa' : 'var(--dsw-alias-label-tertiary, #64748b)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                              }}
                              title="移动会话至文件夹..."
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMoveMenuSessionId(activeMoveMenuSessionId === s.id ? null : s.id)
                              }}
                            >
                              <MoveToFolderIcon size={12} />
                            </button>
                            {renderMoveDropdown(s.id)}
                          </div>
                          <button
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                            title="删除会话"
                            onClick={async (e) => {
                              e.stopPropagation()
                              await handleDeleteSession(ws.path, s.id)
                            }}
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* 展开其余 N 个会话 */}
                  {!showAll && remainingCount > 0 && (
                    <div
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--dsw-alias-label-primary, #fff)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dsw-alias-label-tertiary, #94a3b8)')}
                      onClick={() => setShowAllSessionsMap((prev) => ({ ...prev, [ws.workspaceId]: true }))}
                    >
                      展开其余 {remainingCount} 个会话
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 🌟 渲染 DSH 原生 directoryFlow 子槽位 (拉起 DSH 自身自带的目录选择弹窗或系统选择器) */}
      {props.renderSlot?.('sidebar.workspaces.directoryFlow', flowOwner)}
    </div>
  )
}
