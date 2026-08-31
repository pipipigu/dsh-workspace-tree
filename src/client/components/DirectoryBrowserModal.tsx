import React, { useEffect, useState } from 'react'
import {
  ArrowUpIcon,
  CloseIcon,
  EditIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  ChevronRightIcon,
} from './Icons.tsx'
import { fetchDirectoryList, createFsDirectory, type DirectoryListResult } from '../api.ts'

export interface DirectoryBrowserModalProps {
  initialPath?: string
  open: boolean
  onClose: () => void
  onConfirm: (selectedPath: string) => void
}

export const DirectoryBrowserModal: React.FC<DirectoryBrowserModalProps> = ({
  initialPath,
  open,
  onClose,
  onConfirm,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '')
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [homePath, setHomePath] = useState<string>('')
  const [directories, setDirectories] = useState<Array<{ name: string; path: string }>>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  // Direct text edit mode for path
  const [isEditingRawPath, setIsEditingRawPath] = useState(false)
  const [rawPathDraft, setRawPathDraft] = useState('')

  // Inline new folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingSubmitting, setIsCreatingSubmitting] = useState(false)

  const loadPath = async (targetPath?: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSelectedFolder(null)
    try {
      const res: DirectoryListResult = await fetchDirectoryList(targetPath, showHidden)
      if (res.error && res.directories.length === 0) {
        setErrorMsg(res.error)
      }
      setCurrentPath(res.currentPath)
      setParentPath(res.parentPath)
      setHomePath(res.homePath)
      setDirectories(res.directories || [])
      setRawPathDraft(res.currentPath)
    } catch (err: any) {
      setErrorMsg(err?.message || '读取目录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadPath(initialPath || undefined)
      setIsCreatingFolder(false)
      setIsEditingRawPath(false)
    }
  }, [open, showHidden])

  if (!open) return null

  const handleNavigate = (path: string) => {
    setIsCreatingFolder(false)
    loadPath(path)
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      setIsCreatingFolder(false)
      return
    }
    setIsCreatingSubmitting(true)
    try {
      const res = await createFsDirectory(currentPath, name)
      if (res.success && res.path) {
        setIsCreatingFolder(false)
        setNewFolderName('')
        await loadPath(res.path)
      } else {
        setErrorMsg(res.error || '创建文件夹失败')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || '创建文件夹失败')
    } finally {
      setIsCreatingSubmitting(false)
    }
  }

  const handleConfirmSelect = () => {
    const target = (isEditingRawPath && rawPathDraft.trim()) ? rawPathDraft.trim() : (selectedFolder || currentPath)
    if (target) {
      onConfirm(target)
    }
  }

  // Format breadcrumbs: replace homePath with ~
  const renderBreadcrumbs = () => {
    if (isEditingRawPath) {
      return (
        <input
          autoFocus
          style={{
            flex: 1,
            height: '28px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            borderRadius: '4px',
            color: '#f8fafc',
            fontSize: '12px',
            padding: '0 8px',
            outline: 'none',
          }}
          value={rawPathDraft}
          onChange={(e) => setRawPathDraft(e.target.value)}
          onBlur={() => {
            setIsEditingRawPath(false)
            if (rawPathDraft.trim() && rawPathDraft.trim() !== currentPath) {
              handleNavigate(rawPathDraft.trim())
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditingRawPath(false)
              if (rawPathDraft.trim()) handleNavigate(rawPathDraft.trim())
            }
            if (e.key === 'Escape') setIsEditingRawPath(false)
          }}
        />
      )
    }

    let displayPath = currentPath
    const isHomeRooted = homePath && currentPath.startsWith(homePath)
    if (isHomeRooted) {
      displayPath = '~' + currentPath.slice(homePath.length)
    }

    const segments = displayPath.split('/').filter(Boolean)
    let cumulativePath = isHomeRooted ? homePath : ''

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#93c5fd',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title={homePath || '主目录'}
          onClick={() => handleNavigate(homePath || '/')}
        >
          <HomeIcon size={12} />
          <span>主目录</span>
        </button>

        {isHomeRooted && segments[0] === '~' && segments.slice(1).map((seg, idx) => {
          cumulativePath = `${cumulativePath}/${seg}`
          const segPath = cumulativePath
          return (
            <React.Fragment key={idx}>
              <span style={{ color: '#64748b', fontSize: '11px' }}>/</span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: idx === segments.length - 2 ? '#f8fafc' : '#cbd5e1',
                  fontWeight: idx === segments.length - 2 ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={segPath}
                onClick={() => handleNavigate(segPath)}
              >
                {seg}
              </button>
            </React.Fragment>
          )
        })}

        {!isHomeRooted && segments.map((seg, idx) => {
          cumulativePath = `${cumulativePath}/${seg}`
          const segPath = cumulativePath
          return (
            <React.Fragment key={idx}>
              <span style={{ color: '#64748b', fontSize: '11px' }}>/</span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: idx === segments.length - 1 ? '#f8fafc' : '#cbd5e1',
                  fontWeight: idx === segments.length - 1 ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={segPath}
                onClick={() => handleNavigate(segPath)}
              >
                {seg}
              </button>
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
        fontFamily: 'inherit',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '540px',
          maxWidth: '94vw',
          height: '520px',
          maxHeight: '90vh',
          borderRadius: '12px',
          background: '#151b28',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderIcon size={18} color="#60a5fa" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>选择工作区目录</span>
          </div>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'inline-flex',
            }}
            onClick={onClose}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* 2. Path & Breadcrumb Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '8px',
          }}
        >
          {parentPath && (
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11px',
                flexShrink: 0,
              }}
              title={`返回上一级 (${parentPath})`}
              onClick={() => handleNavigate(parentPath)}
            >
              <ArrowUpIcon size={11} />
              <span>上级</span>
            </button>
          )}

          {renderBreadcrumbs()}

          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: isEditingRawPath ? '#60a5fa' : '#64748b',
              cursor: 'pointer',
              padding: '4px',
              display: 'inline-flex',
              flexShrink: 0,
            }}
            title="编辑完整路径"
            onClick={() => {
              setIsEditingRawPath(!isEditingRawPath)
              setRawPathDraft(currentPath)
            }}
          >
            <EditIcon size={13} />
          </button>
        </div>

        {/* 3. Error Banner */}
        {errorMsg && (
          <div style={{ padding: '6px 16px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '11px' }}>
            {errorMsg}
          </div>
        )}

        {/* 4. Directory List Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* Inline Folder Creation Row */}
          {isCreatingFolder && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: 'rgba(96, 165, 250, 0.12)',
                border: '1px dashed #60a5fa',
                borderRadius: '6px',
                margin: '2px 0 4px',
              }}
            >
              <FolderIcon size={15} color="#60a5fa" />
              <input
                autoFocus
                style={{
                  flex: 1,
                  height: '24px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '0 6px',
                  outline: 'none',
                }}
                placeholder="输入新文件夹名称..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') setIsCreatingFolder(false)
                }}
              />
              <button
                disabled={isCreatingSubmitting || !newFolderName.trim()}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={handleCreateFolder}
              >
                {isCreatingSubmitting ? '...' : '确定'}
              </button>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  padding: '3px 6px',
                  cursor: 'pointer',
                }}
                onClick={() => setIsCreatingFolder(false)}
              >
                取消
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: '#94a3b8', fontSize: '12px' }}>
              正在加载目录列表...
            </div>
          ) : directories.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: '#64748b', fontSize: '12px' }}>
              此目录下无子文件夹
            </div>
          ) : (
            directories.map((d) => {
              const isSelected = selectedFolder === d.path
              return (
                <div
                  key={d.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '34px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(96, 165, 250, 0.16)' : 'transparent',
                    color: isSelected ? '#93c5fd' : '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.12s ease',
                  }}
                  onClick={() => setSelectedFolder(d.path)}
                  onDoubleClick={() => handleNavigate(d.path)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <FolderIcon size={16} color={isSelected ? '#60a5fa' : '#94a3b8'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </span>
                  </div>

                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="进入该目录"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNavigate(d.path)
                    }}
                  >
                    <ChevronRightIcon size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* 5. Bottom Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Left Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => {
                setIsCreatingFolder(true)
                setNewFolderName('')
              }}
            >
              <PlusIcon size={11} />
              <span>新建文件夹</span>
            </button>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span>显示隐藏文件</span>
            </label>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              取消
            </button>

            <button
              style={{
                background: '#2563eb',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '6px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
              }}
              onClick={handleConfirmSelect}
            >
              打开
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
