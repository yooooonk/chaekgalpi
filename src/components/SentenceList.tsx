import { useState, useEffect } from 'react'
import type { Entry } from '../utils/sheets'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

interface SentenceListProps {
  categories: string[]
  onLoad: (cats: string[]) => Promise<Entry[]>
}

export default function SentenceList({ categories, onLoad }: SentenceListProps) {
  const [selectedCat, setSelectedCat] = useState('__all__')
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  const { visibleItems, hasMore, total, sentinelRef } = useInfiniteScroll(items)

  async function fetchItems(cat: string) {
    setLoading(true)
    setItems([])
    try {
      const cats = cat === '__all__' ? categories : [cat]
      const data = await onLoad(cats)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (categories.length > 0) fetchItems(selectedCat)
  }, [selectedCat, categories.join(',')])

  return (
    <div className="sentence-list">
      <div className="list-header">
        <div className="list-cat-tabs">
          <button
            className={`cat-tab ${selectedCat === '__all__' ? 'cat-tab-active' : ''}`}
            onClick={() => setSelectedCat('__all__')}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-tab ${selectedCat === cat ? 'cat-tab-active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => fetchItems(selectedCat)}
          disabled={loading}
        >
          새로고침
        </button>
      </div>

      {loading && <div className="results-empty">불러오는 중…</div>}

      {!loading && items.length === 0 && (
        <div className="results-empty">저장된 문장이 없습니다.</div>
      )}

      {!loading && items.length > 0 && (
        <>
          <ul className="results-list">
            {visibleItems.map((item, i) => {
              const showHeader =
                selectedCat === '__all__' &&
                (i === 0 || visibleItems[i - 1].category !== item.category)
              return (
                <li key={`${item.category}-${i}`}>
                  {showHeader && (
                    <h3 className="list-group-title">
                      {item.category}
                      <span className="list-group-count">
                        {items.filter((x) => x.category === item.category).length}
                      </span>
                    </h3>
                  )}
                  <div className="result-item">
                    <div className="result-text">{item.text}</div>
                    {item.tags.length > 0 && (
                      <div className="result-tags">
                        {item.tags.map((t) => (
                          <span key={t} className="tag">#{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="result-meta">
                      {selectedCat === '__all__' && (
                        <span className="result-category">{item.category}</span>
                      )}
                      <span className="result-date">{item.date}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {hasMore && (
            <div ref={sentinelRef} className="results-empty">
              불러오는 중…
            </div>
          )}

          {!hasMore && (
            <div className="list-total">전체 {total}개</div>
          )}
        </>
      )}
    </div>
  )
}
