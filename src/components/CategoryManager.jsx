import { useState } from 'react'

export default function CategoryManager({ categories, onAdd, onDelete, disabled }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      await onAdd(name)
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="category-manager">
      <h3 className="section-title">카테고리 관리</h3>
      <ul className="category-list">
        {categories.map((cat) => (
          <li key={cat} className="category-item">
            <span>{cat}</span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(cat)}
              disabled={disabled || categories.length <= 1}
              title={categories.length <= 1 ? '카테고리는 최소 1개 이상 필요합니다' : '삭제'}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="category-add-form">
        <input
          className="search-input"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 카테고리 이름"
          disabled={disabled || adding}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={disabled || adding || !newName.trim()}
        >
          {adding ? '추가 중…' : '추가'}
        </button>
      </form>
    </div>
  )
}
