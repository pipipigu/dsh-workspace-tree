import React from 'react'

export const ChevronRightIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M6 3.5L10.5 8L6 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const FolderIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 15,
  color,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: color || 'currentColor', ...style }}
  >
    <path
      d="M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V11.75C14 12.4404 13.4404 13 12.75 13H3.25C2.55964 13 2 12.4404 2 11.75V4.25Z"
      stroke="currentColor"
      strokeWidth="1.25"
      fill={color ? `${color}22` : 'currentColor'}
      fillOpacity={color ? 0.2 : 0.1}
      strokeLinejoin="round"
    />
  </svg>
)

export const ChatIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M3 4C3 3.44772 3.44772 3 4 3H12C12.5523 3 13 3.44772 13 4V10C13 10.5523 12.5523 11 12 11H5.5L3 13.5V4Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const PlusIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M8 3.5V12.5M3.5 8H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SearchIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export const EllipsisIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <circle cx="3.5" cy="8" r="1.1" fill="currentColor" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" />
    <circle cx="12.5" cy="8" r="1.1" fill="currentColor" />
  </svg>
)

export const EditIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const TrashIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M3.5 4.5H12.5M6 4.5V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4.5M4.5 4.5V13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13V4.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ForkIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <circle cx="4.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="4.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="11.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4.5 6V10M11.5 6V7.5C11.5 8.6 10.6 9.5 9.5 9.5H4.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export const MoveToFolderIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V11.75C14 12.4404 13.4404 13 12.75 13H3.25C2.55964 13 2 12.4404 2 11.75V4.25Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M6 8.5H10M8 6.5L10 8.5L8 10.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const MoveOutIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 12,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M6 3.5H3.5V12.5H12.5V10M8.5 2.5H13.5V7.5M7 9L13 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const AddFolderIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M2 4.25C2 3.55964 2.55964 3 3.25 3H6.08579C6.41732 3 6.73528 3.1317 6.96967 3.36612L8.13388 4.53033C8.36827 4.76475 8.68623 4.89645 9.01777 4.89645H12.75C13.4404 4.89645 14 5.45609 14 6.14645V8.5M2 4.25V11.75C2 12.4404 2.55964 13 3.25 13H8M11.5 10.5V14.5M9.5 12.5H13.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const PinIcon: React.FC<{ size?: number; pinned?: boolean; style?: React.CSSProperties }> = ({
  size = 13,
  pinned = false,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M9.5 3L13 6.5M6 6.5L3.5 9L4 12L2 14L4 12L7 12.5L9.5 10M6 6.5L9.5 3M6 6.5L9.5 10"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={pinned ? 'currentColor' : 'none'}
    />
  </svg>
)

export const CloseIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M4 4L12 12M12 4L4 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const HomeIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M2.5 6.5L8 2L13.5 6.5V13.5C13.5 13.7761 13.2761 14 13 14H9.5V9.5H6.5V14H3C2.72386 14 2.5 13.7761 2.5 13.5V6.5Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ArrowUpIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 14,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M8 12.5V3.5M4 7.5L8 3.5L12 7.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
