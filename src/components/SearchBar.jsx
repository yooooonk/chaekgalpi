import { useState } from 'react'

export default function SearchBar({ categories, onSearch, disabled }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('__all__')

  const isTagSearch = query.trim().startsWith('#')

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query.trim(), category === '__all__' ? null : category)
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="#태그 또는 검색어"
        disabled={disabled}
      />
      <select
        className="category-select"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={disabled}
      >
        <option value="__all__">전체</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary" disabled={disabled || !query.trim()}>
        검색
      </button>
    </form>
  )
}
