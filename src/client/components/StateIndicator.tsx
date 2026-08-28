import React from 'react'

/**
 * Animated Pulse Indicator for running/streaming sessions matching DSH design.
 */
export const RunningDot: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
      title="正在对话与生成中..."
    >
      <span
        style={{
          position: 'absolute',
          width: `${size * 0.75}px`,
          height: `${size * 0.75}px`,
          borderRadius: '50%',
          background: 'rgba(96, 165, 250, 0.4)',
          animation: 'dsh-pulse 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          width: `${size * 0.45}px`,
          height: `${size * 0.45}px`,
          borderRadius: '50%',
          background: 'var(--dsw-alias-state-business-primary, #60a5fa)',
          boxShadow: '0 0 6px rgba(96, 165, 250, 0.8)',
        }}
      />
      <style>{`
        @keyframes dsh-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </span>
  )
}

/**
 * Amber Dot for sessions waiting on user interaction (questions/approvals).
 */
export const PendingDot: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
      title="等待交互 (审批/确认)"
    >
      <span
        style={{
          width: `${size * 0.45}px`,
          height: `${size * 0.45}px`,
          borderRadius: '50%',
          background: '#fbbf24',
          boxShadow: '0 0 6px rgba(251, 191, 36, 0.6)',
        }}
      />
    </span>
  )
}

/**
 * Green Dot for completed/unread sessions (finished in background, waiting to be read).
 */
export const CompletedDot: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
      title="已执行完毕 (未读)"
    >
      <span
        style={{
          position: 'absolute',
          width: `${size * 0.75}px`,
          height: `${size * 0.75}px`,
          borderRadius: '50%',
          background: 'rgba(74, 222, 128, 0.25)',
          animation: 'dsh-completed-pulse 2.2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          width: `${size * 0.48}px`,
          height: `${size * 0.48}px`,
          borderRadius: '50%',
          background: '#4ade80',
          boxShadow: '0 0 6px rgba(74, 222, 128, 0.8)',
        }}
      />
      <style>{`
        @keyframes dsh-completed-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.15; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      `}</style>
    </span>
  )
}
