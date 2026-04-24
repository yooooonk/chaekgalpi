import { useState, useCallback } from 'react'
import {
  extractSpreadsheetId,
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
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    () => localStorage.getItem(spreadsheetKey(userId)) ?? null,
  )
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = (e: unknown) => {
    setError(e instanceof Error ? e.message : String(e))
    setLoading(false)
  }

  // userId 변경 시 해당 사용자 캐시로 업데이트
  const getOrCreateId = useCallback(async (): Promise<string> => {
    const cached = localStorage.getItem(spreadsheetKey(userId))
    if (cached) return cached
    const id = await createSpreadsheet(token!)
    localStorage.setItem(spreadsheetKey(userId), id)
    return id
  }, [token, userId])

  const init = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const id = await getOrCreateId()
      setSpreadsheetId(id)
      const cats = await getCategories(token, id)
      setCategories(cats)
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }, [token, getOrCreateId])

  /**
   * URL 또는 ID를 입력받아 해당 스프레드시트로 연결한다.
   */
  const connectById = useCallback(async (input: string) => {
    if (!token) return
    const id = extractSpreadsheetId(input)
    if (!id) throw new Error('올바른 Google Sheets URL 또는 ID를 입력해 주세요.')
    setLoading(true)
    setError(null)
    try {
      const cats = await getCategories(token, id)
      localStorage.setItem(spreadsheetKey(userId), id)
      setSpreadsheetId(id)
      setCategories(cats)
    } catch (e) {
      handleError(e)
      throw e
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
    connectById,
    addCat,
    deleteCat,
    saveEntry,
    loadAll,
  }
}
