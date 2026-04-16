import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import SearchBar from '../components/SearchBar'
import SearchResults, { type SearchResultItem } from '../components/SearchResults'
import { rankBySimilarity } from '../utils/similarity'

const SEMANTIC_THRESHOLD = 0.82

export default function SearchPage() {
  const { embed, modelStatus, categories, sheetsLoading, loadAll, notify } = useApp()
  const [results, setResults] = useState<SearchResultItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const busy = modelStatus !== 'ready' || sheetsLoading

  async function handleSearch(query: string, category: string | null) {
    const isTagSearch = query.startsWith('#')

    setSearching(true)
    setResults(null)
    try {
      const cats = category ? [category] : categories
      const allData = await loadAll(cats)

      if (isTagSearch) {
        const searchTags = query
          .split(/\s+/)
          .map((t) => t.replace(/^#/, '').trim().toLowerCase())
          .filter(Boolean)
        const filtered = allData.filter((item) =>
          searchTags.every((st) => item.tags.map((t) => t.toLowerCase()).includes(st)),
        )
        setResults(filtered)
        return
      }

      if (modelStatus !== 'ready') {
        notify('모델 로딩 중입니다. 잠시 후 다시 시도하세요.', 'error')
        return
      }

      const queryLower = query.trim().toLowerCase()
      const queryWords = queryLower.split(/[\s,]+/).filter((w) => w.length > 0)

      // 1) 태그 일치
      const tagMatches: SearchResultItem[] = allData
        .filter((item) => item.tags.some((t) => t.toLowerCase() === queryLower))
        .map((item) => ({ ...item, matchType: 'tag' as const }))

      const seenTexts = new Set(tagMatches.map((item) => item.text))

      // 2) 키워드 일치
      const keywordMatches: SearchResultItem[] = allData
        .filter((item) => {
          if (seenTexts.has(item.text)) return false
          return queryWords.some((w) => item.text.toLowerCase().includes(w))
        })
        .map((item) => {
          const matchCount = queryWords.filter((w) => item.text.toLowerCase().includes(w)).length
          return { ...item, matchType: 'keyword' as const, matchCount }
        })
        .sort((a, b) => (b.matchCount ?? 0) - (a.matchCount ?? 0))

      keywordMatches.forEach((item) => seenTexts.add(item.text))

      // 3) 시맨틱 검색
      const queryVec = await embed(query, 'query')
      const semanticResults: SearchResultItem[] = rankBySimilarity(queryVec, allData, 20)
        .filter((item) => item.score >= SEMANTIC_THRESHOLD && !seenTexts.has(item.text))
        .map((item) => ({ ...item, matchType: 'semantic' as const }))

      setResults([...tagMatches, ...keywordMatches, ...semanticResults])
    } catch (e) {
      notify((e as Error).message, 'error')
    } finally {
      setSearching(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="section-title">시맨틱 검색</h2>
      <SearchBar
        categories={categories}
        onSearch={handleSearch}
        disabled={busy || searching}
      />
      <SearchResults results={results} searching={searching} />
    </section>
  )
}
