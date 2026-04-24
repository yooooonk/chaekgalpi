import { useState, useCallback } from 'react'
import {
  findSpreadsheet,
  createSpreadsheet,
  getCategories,
  addCategory,
  deleteCategory,
  appendRows,
  loadAllData,
  type Entry,
} from '../utils/sheets'

function spreadsheetKey(userId: string | null) {
  return userId ? `chaekgalpi_spreadsheet_id_${userId}` : 'chaekgalpi_spreadsheet_id'
}

export function useSheets(token: string | null, userId: string | null = null) {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = (e: unknown) => {
    setError(e instanceof Error ? e.message : String(e))
    setLoading(false)
  }

  // 초기화: localStorage 캐시 → Drive 검색 → 신규 생성 순으로 시트 ID 확보
  const init = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      let id = localStorage.getItem(spreadsheetKey(userId))
      if (!id) {
        // Drive에서 기존 시트 검색 (다른 브라우저·기기에서 만든 경우 포함)
        id = await findSpreadsheet(token)
        if (!id) {
          id = await createSpreadsheet(token)
        }
        localStorage.setItem(spreadsheetKey(userId), id)
      }
      setSpreadsheetId(id)
      const cats = await getCategories(token, id)
      setCategories(cats)
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }, [token, userId])

  const refreshCategories = useCallback(async () => {
    if (!token || !spreadsheetId) return
    try {
      const cats = await getCategories(token, spreadsheetId)
      setCategories(cats)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [token, spreadsheetId])

  const addCat = useCallback(
    async (name: string) => {
      setLoading(true)
      try {
        await addCategory(token!, spreadsheetId!, name)
        await refreshCategories()
      } catch (e) {
        handleError(e)
      } finally {
        setLoading(false)
      }
    },
    [token, spreadsheetId, refreshCategories],
  )

  const deleteCat = useCallback(
    async (name: string) => {
      setLoading(true)
      try {
        await deleteCategory(token!, spreadsheetId!, name)
        await refreshCategories()
      } catch (e) {
        handleError(e)
      } finally {
        setLoading(false)
      }
    },
    [token, spreadsheetId, refreshCategories],
  )

  const saveEntry = useCallback(
    async (text: string, vector: number[], category: string, tags: string[] = []) => {
      const date = new Date().toISOString().split('T')[0]
      const tagsStr = tags.join(',')
      await appendRows(token!, spreadsheetId!, category, [[text, JSON.stringify(vector), date, tagsStr]])
    },
    [token, spreadsheetId],
  )

  const loadAll = useCallback(
    async (cats?: string[]): Promise<Entry[]> => {
      return loadAllData(token!, spreadsheetId!, cats ?? categories)
    },
    [token, spreadsheetId, categories],
  )

  return {
    spreadsheetId,
    categories,
    loading,
    error,
    init,
    addCat,
    deleteCat,
    saveEntry,
    loadAll,
  }
}
