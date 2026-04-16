export default function SearchResults({ results, searching }) {
  if (searching) {
    return <div className="results-empty">검색 중…</div>
  }

  if (results === null) return null

  if (results.length === 0) {
    return <div className="results-empty">검색 결과가 없습니다.</div>
  }

  return (
    <ul className="results-list">
      {results.map((item, i) => (
        <li key={i} className="result-item">
          <div className="result-text">{item.text}</div>
          <div className="result-meta">
            <span className="result-category">{item.category}</span>
            <span className="result-date">{item.date}</span>
            <span className="result-score">{(item.score * 100).toFixed(1)}%</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
