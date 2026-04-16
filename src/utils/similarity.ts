import type { Entry } from './sheets'

export interface ScoredEntry extends Entry {
  score: number
}

/**
 * 코사인 유사도 계산 (두 벡터 모두 정규화된 경우 내적과 동일)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}

/**
 * 문장 목록에서 쿼리 벡터와 가장 유사한 항목을 정렬해 반환
 */
export function rankBySimilarity(queryVec: number[], items: Entry[], topK = 20): ScoredEntry[] {
  return items
    .map((item) => ({
      ...item,
      score: cosineSimilarity(queryVec, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
