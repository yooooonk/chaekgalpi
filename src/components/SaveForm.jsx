import { useState } from 'react'

export default function SaveForm({ categories, onSave, disabled }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [saving, setSaving] = useState(false)

  // 카테고리 목록이 바뀌면 선택값도 초기화
  if (categories.length > 0 && !categories.includes(category)) {
    setCategory(categories[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      await onSave(text.trim(), category)
      setText('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="save-form">
      <textarea
        className="save-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="저장할 문장을 입력하세요"
        rows={4}
        disabled={disabled || saving}
      />
      <div className="save-form-footer">
        <select
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={disabled || saving}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled || saving || !text.trim()}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}
