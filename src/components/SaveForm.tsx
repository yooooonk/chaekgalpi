import { useState } from 'react'

interface SaveFormProps {
  categories: string[]
  onSave: (text: string, category: string, tags: string[]) => Promise<void>
  disabled: boolean
}

function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, '').trim()
}

export default function SaveForm({ categories, onSave, disabled }: SaveFormProps) {
  const [text, setText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState(categories[0] ?? '')
  const [saving, setSaving] = useState(false)

  if (categories.length > 0 && !categories.includes(category)) {
    setCategory(categories[0])
  }

  function commitTag() {
    const name = normalizeTag(tagInput)
    if (name && !tags.includes(name)) {
      setTags([...tags, name])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commitTag()
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || saving) return
    // 입력 중인 태그도 함께 저장
    const finalTags = [...tags]
    const pending = normalizeTag(tagInput)
    if (pending && !finalTags.includes(pending)) finalTags.push(pending)

    setSaving(true)
    try {
      await onSave(text.trim(), category, finalTags)
      setText('')
      setTagInput('')
      setTags([])
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
      <div className="tag-input-box">
        {tags.map((t) => (
          <span key={t} className="tag tag-removable">
            #{t}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(t)}
              disabled={disabled || saving}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="tag-input"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => setTimeout(commitTag, 100)}
          placeholder={tags.length === 0 ? '#태그 입력 후 스페이스 또는 엔터' : ''}
          disabled={disabled || saving}
        />
      </div>
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
