import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useEmbedder, type ModelStatus, type LoadProgress } from '../hooks/useEmbedder'
import { useSheets } from '../hooks/useSheets'
import type { Entry } from '../utils/sheets'

// ─── Auth persistence ─────────────────────────────────────────────────────────

const AUTH_KEY = 'chaekgalpi_auth'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface StoredAuth {
  token: string
  expiresAt: number
  user: User
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const auth = JSON.parse(raw) as StoredAuth
    if (Date.now() >= auth.expiresAt) {
      sessionStorage.removeItem(AUTH_KEY)
      return null
    }
    return auth
  } catch {
    return null
  }
}

function saveAuth(token: string, user: User) {
  const auth: StoredAuth = {
    token,
    expiresAt: Date.now() + 55 * 60 * 1000, // 55분 (Google 토큰 만료 1시간 전)
    user,
  }
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth))
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
  saveEntry: (text: string, vector: number[], category: string, tags?: string[]) => Promise<void>
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
  const stored = useRef(loadStoredAuth())
  const [token, setToken] = useState<string | null>(stored.current?.token ?? null)
  const [user, setUser] = useState<User | null>(stored.current?.user ?? null)
  const [notification, setNotification] = useState<Notification | null>(null)

  const { embed, modelStatus, loadProgress } = useEmbedder()
  const sheets = useSheets(token, user?.sub ?? null)

  // GSI 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  // 토큰과 사용자 ID가 모두 준비되면 Sheets 초기화
  useEffect(() => {
    if (token) sheets.init()
  }, [token, user?.sub])

  const login = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as unknown as { google: any }).google
    google.accounts.oauth2
      .initTokenClient({
        client_id: CLIENT_ID,
        scope:
          'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
        callback: (resp: { error?: string; access_token: string }) => {
          if (resp.error) return
          const accessToken = resp.access_token
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => r.json())
            .then((info: { sub: string; name: string; picture: string }) => {
              const u: User = { sub: info.sub, name: info.name, picture: info.picture }
              setToken(accessToken)
              setUser(u)
              saveAuth(accessToken, u)
            })
        },
      })
      .requestAccessToken()
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem(AUTH_KEY)
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
