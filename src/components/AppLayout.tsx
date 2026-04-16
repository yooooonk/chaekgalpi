import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import type { ModelStatus, LoadProgress } from '../hooks/useEmbedder'

const NAV_ITEMS = [
  { to: '/save', label: '저장' },
  { to: '/list', label: '목록' },
  { to: '/search', label: '검색' },
  { to: '/categories', label: '카테고리' },
] as const

export default function AppLayout() {
  const { token, user, logout, modelStatus, loadProgress, notification, sheetsError } = useApp()

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">책갈피</h1>
        <div className="header-right">
          <ModelBadge status={modelStatus} progress={loadProgress} />
          {user && (
            <div className="user-info">
              {user.picture && (
                <img src={user.picture} alt={user.name} className="avatar" />
              )}
              <span className="user-name">{user.name}</span>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <nav className="tabs">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `tab${isActive ? ' tab-active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {sheetsError && (
        <div className="notification notification-error">{sheetsError}</div>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}

interface ModelBadgeProps {
  status: ModelStatus
  progress: LoadProgress | null
}

function ModelBadge({ status, progress }: ModelBadgeProps) {
  const labels: Record<ModelStatus, string> = {
    idle: '',
    loading: '모델 로딩 중',
    ready: '모델 준비됨',
    error: '모델 오류',
  }
  const classes: Record<ModelStatus, string> = {
    idle: '',
    loading: 'badge-loading',
    ready: 'badge-ready',
    error: 'badge-error',
  }

  if (status === 'idle') return null

  let detail = ''
  if (status === 'loading' && progress?.total) {
    const pct = Math.round((progress.loaded / progress.total) * 100)
    detail = ` ${pct}%`
  }

  return (
    <span className={`badge ${classes[status]}`}>
      {labels[status]}
      {detail}
    </span>
  )
}
