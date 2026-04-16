import { useEffect, useState, useCallback } from 'react'
import { useEmbedder } from './hooks/useEmbedder'
import { useSheets } from './hooks/useSheets'
import { rankBySimilarity } from './utils/similarity'
import SaveForm from './components/SaveForm'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import CategoryManager from './components/CategoryManager'
import './App.css'

// ─── Google OAuth (GSI) ───────────────────────────────────────────────────────
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function useGoogleAuth() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

  const login = useCallback(() => {
    window.google.accounts.oauth2
      .initTokenClient({
        client_id: CLIENT_ID,
        scope:
          'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
        callback: (resp) => {
          if (resp.error) return
          setToken(resp.access_token)
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          })
            .then((r) => r.json())
            .then((info) => setUser({ name: info.name, picture: info.picture }))
        },
      })
      .requestAccessToken()
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('chaekgalpi_spreadsheet_id')
  }, [])

  return { token, user, login, logout }
}

// ─── 앱 ───────────────────────────────────────────────────────────────────────
const TABS = ['저장', '검색', '카테고리']

export default function App() {
  const { token, user, login, logout } = useGoogleAuth()
  const { embed, modelStatus, loadProgress } = useEmbedder()
  const sheets = useSheets(token)
  const [tab, setTab] = useState('저장')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (token) sheets.init()
  }, [token])

  function notify(msg, type = 'success') {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  async function handleSave(text, category) {
    if (modelStatus !== 'ready') {
      notify('모델 로딩 중입니다. 잠시 후 다시 시도하세요.', 'error')
      return
    }
    try {
      const vector = await embed(text, 'passage')
      await sheets.saveEntry(text, vector, category)
      notify(`"${category}"에 저장했습니다.`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  async function handleSearch(query, category) {
    if (modelStatus !== 'ready') {
      notify('모델 로딩 중입니다. 잠시 후 다시 시도하세요.', 'error')
      return
    }
    setSearching(true)
    setResults(null)
    try {
      const queryVec = await embed(query, 'query')
      const cats = category ? [category] : sheets.categories
      const allData = await sheets.loadAll(cats)
      const ranked = rankBySimilarity(queryVec, allData, 20)
      setResults(ranked)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setSearching(false)
    }
  }

  // 미로그인 화면
  if (!token) {
    return (
      <div className="landing">
        <div className="landing-card">
          <h1 className="logo">책갈피</h1>
          <p className="tagline">문장을 모으고, 의미로 찾는 공간</p>
          <button className="btn btn-google" onClick={login}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              width={20}
            />
            Google로 시작하기
          </button>
          {!CLIENT_ID && (
            <p className="warning">
              ⚠️ <code>VITE_GOOGLE_CLIENT_ID</code>가 설정되지 않았습니다.
              <br />
              <code>.env</code> 파일을 확인하세요.
            </p>
          )}
        </div>
      </div>
    )
  }

  const busy = modelStatus !== 'ready' || sheets.loading

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
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {sheets.error && (
        <div className="notification notification-error">{sheets.error}</div>
      )}

      <main className="main">
        {tab === '저장' && (
          <section className="panel">
            <h2 className="section-title">문장 저장</h2>
            <SaveForm
              categories={sheets.categories}
              onSave={handleSave}
              disabled={busy}
            />
          </section>
        )}

        {tab === '검색' && (
          <section className="panel">
            <h2 className="section-title">시맨틱 검색</h2>
            <SearchBar
              categories={sheets.categories}
              onSearch={handleSearch}
              disabled={busy || searching}
            />
            <SearchResults results={results} searching={searching} />
          </section>
        )}

        {tab === '카테고리' && (
          <section className="panel">
            <CategoryManager
              categories={sheets.categories}
              onAdd={sheets.addCat}
              onDelete={sheets.deleteCat}
              disabled={sheets.loading}
            />
          </section>
        )}
      </main>
    </div>
  )
}

function ModelBadge({ status, progress }) {
  const labels = { idle: '', loading: '모델 로딩 중', ready: '모델 준비됨', error: '모델 오류' }
  const classes = { idle: '', loading: 'badge-loading', ready: 'badge-ready', error: 'badge-error' }

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
