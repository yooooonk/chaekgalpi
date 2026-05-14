import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useEmbedder, type ModelStatus, type LoadProgress } from '../hooks/useEmbedder'
import { useSheets } from '../hooks/useSheets'
import type { Entry } from '../utils/sheets'

// ─── Auth persistence ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'chaekgalpi_token'
const USER_KEY  = 'chaekgalpi_user'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile'

interface StoredToken { token: string; expiresAt: number }

function loadStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const { token, expiresAt } = JSON.parse(raw) as StoredToken
    if (Date.now() >= expiresAt) { localStorage.removeItem(TOKEN_KEY); return null }
    return token
  } catch { return null }
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) as User : null
  } catch { return null }
}

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  }))
}

function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  sub: string
  name: string
  picture: string
}

interface Notification {
  msg: string
  type: 'success' | 'error'
}

interface AppContextValue {
  // Auth
  token: string | null
  user: User | null
  login: () => void
  logout: () => void
  clientIdMissing: boolean
  // Embedder
  embed: (text: string, role?: 'passage' | 'query') => Promise<number[]>
  modelStatus: ModelStatus
  loadProgress: LoadProgress | null
  // Sheets
  spreadsheetId: string | null
  categories: string[]
  sheetsLoading: boolean
  sheetsError: string | null
  saveEntry: (text: string, vector: number[], category: string, tags?: string[], source?: string) => Promise<void>
  loadAll: (cats?: string[]) => Promise<Entry[]>
  addCat: (name: string) => Promise<void>
  deleteCat: (name: string) => Promise<void>
  connectById: (input: string) => Promise<void>
  // Notification
  notification: Notification | null
  notify: (msg: string, type?: 'success' | 'error') => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadStoredToken())
  const [user,  setUser]  = useState<User | null>(() => loadStoredUser())
  const [notification, setNotification] = useState<Notification | null>(null)

  const { embed, modelStatus, loadProgress } = useEmbedder()
  const sheets = useSheets(token, user?.sub ?? null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGoogle = () => (window as unknown as { google: any }).google

  const applyToken = useCallback((accessToken: string, u: User) => {
    saveToken(accessToken)
    saveUser(u)
    setToken(accessToken)
    setUser(u)
  }, [])

  // GSI 스크립트 로드 + 토큰 만료 시 자동 재발급
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true

    let refreshInterval: ReturnType<typeof setInterval> | null = null

    const silentRefresh = () => {
      if (!loadStoredUser()) return
      getGoogle().accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        prompt: '',
        callback: (resp: { error?: string; access_token: string }) => {
          if (!resp.error) {
            saveToken(resp.access_token)
            setToken(resp.access_token)
          }
        },
      }).requestAccessToken({ prompt: '' })
    }

    script.onload = () => {
      if (loadStoredUser() && !loadStoredToken()) silentRefresh()
      // 앱이 열려있는 동안 50분마다 자동 갱신
      refreshInterval = setInterval(silentRefresh, 50 * 60 * 1000)
    }

    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [])

  // 토큰과 사용자 ID가 모두 준비되면 Sheets 초기화
  useEffect(() => {
    if (token) sheets.init()
  }, [token, user?.sub])

  const login = useCallback(() => {
    getGoogle().accounts.oauth2
      .initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (resp: { error?: string; access_token: string }) => {
          if (resp.error) return
          const accessToken = resp.access_token
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => r.json())
            .then((info: { sub: string; name: string; picture: string }) => {
              applyToken(accessToken, { sub: info.sub, name: info.name, picture: info.picture })
            })
        },
      })
      .requestAccessToken()
  }, [applyToken])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        clientIdMissing: !CLIENT_ID,
        embed,
        modelStatus,
        loadProgress,
        spreadsheetId: sheets.spreadsheetId,
        categories: sheets.categories,
        sheetsLoading: sheets.loading,
        sheetsError: sheets.error,
        saveEntry: sheets.saveEntry,
        loadAll: sheets.loadAll,
        addCat: sheets.addCat,
        deleteCat: sheets.deleteCat,
        connectById: sheets.connectById,
        notification,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
