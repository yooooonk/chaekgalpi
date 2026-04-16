import type { Entry } from '../utils/sheets'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

export interface SearchResultItem extends Entry {
  matchType?: 'tag' | 'keyword' | 'semantic'
  matchCount?: number
  score?: number
}

interface SearchResultsProps {
  results: SearchResultItem[] | null
  searching: boolean
}

export default function SearchResults({ results, searching }: SearchResultsProps) {
  const { visibleItems, hasMore, total, sentinelRef } = useInfiniteScroll(results ?? [])

  if (searching) {
    return <div className="results-empty">검색 중…</div>
  }

  if (results === null) return null

  if (results.length === 0) {
    return <div className="results-empty">검색 결과가 없습니다.</div>
  }

  return (
    <>
      <ul className="results-list">
        {visibleItems.map((item, i) => (
          <li key={i} className="result-item">
            <div className="result-text">{item.text}</div>
            {item.tags.length > 0 && (
              <div className="result-tags">
                {item.tags.map((t) => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            )}
            <div className="result-meta">
              {item.matchType === 'tag' && <span className="result-badge badge-tag">태그</span>}
              {item.matchType === 'keyword' && <span className="result-badge badge-keyword">키워드</span>}
              <span className="result-category">{item.category}</span>
              <span className="result-date">{item.date}</span>
              {item.score != null && (
                <span className="result-score">{(item.score * 100).toFixed(1)}%</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div ref={sentinelRef} className="results-empty">
          불러오는 중…
        </div>
      )}

      {!hasMore && (
        <div className="list-total">총 {total}개 결과</div>
      )}
    </>
  )
}
