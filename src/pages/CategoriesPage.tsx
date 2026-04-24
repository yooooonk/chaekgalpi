import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import CategoryManager from '../components/CategoryManager'

export default function CategoriesPage() {
  const { categories, addCat, deleteCat, sheetsLoading, spreadsheetId, connectById, notify } = useApp()
  const [input, setInput] = useState('')
  const [connecting, setConnecting] = useState(false)

  const sheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null

  async function handleConnect() {
    if (!input.trim()) return
    setConnecting(true)
    try {
      await connectById(input.trim())
      setInput('')
      notify('시트가 연결됐습니다')
    } catch {
      notify('연결 실패. URL 또는 ID를 확인해 주세요', 'error')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <section className="panel">
      <CategoryManager
        categories={categories}
        onAdd={addCat}
        onDelete={deleteCat}
        disabled={sheetsLoading}
      />

      <div className="reconnect-box">
        <div className="reconnect-current">
          <span className="reconnect-label">연결된 시트</span>
          {sheetUrl ? (
            <a href={sheetUrl} target="_blank" rel="noreferrer" className="reconnect-url">
              {spreadsheetId}
            </a>
          ) : (
            <span className="reconnect-url">없음</span>
          )}
        </div>

        <div className="reconnect-form">
          <input
            className="search-input"
            placeholder="다른 기기의 시트 URL 또는 ID 붙여넣기"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleConnect}
            disabled={connecting || !input.trim()}
          >
            연결
          </button>
        </div>
      </div>
    </section>
  )
}
