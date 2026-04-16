import { useState, useCallback } from 'react'
import {
  createSpreadsheet,
  getCategories,
  addCategory,
  deleteCategory,
  appendRows,
  loadAllData,
} from '../utils/sheets'

const SPREADSHEET_KEY = 'chaekgalpi_spreadsheet_id'

export function useSheets(token) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    () => localStorage.getItem(SPREADSHEET_KEY) || null,
  )
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleError = (e) => {
    setError(e.message)
    setLoading(false)
  }

  // 초기화: 스프레드시트 ID 확인 또는 생성
  const init = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      let id = spreadsheetId
      if (!id) {
        id = await createSpreadsheet(token)
        localStorage.setItem(SPREADSHEET_KEY, id)
        setSpreadsheetId(id)
      }
      const cats = await getCategories(token, id)
      setCategories(cats)
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }, [token, spreadsheetId])

  const refreshCategories = useCallback(async () => {
    if (!token || !spreadsheetId) return
    try {
      const cats = await getCategories(token, spreadsheetId)
      setCategories(cats)
    } catch (e) {
      setError(e.message)
    }
  }, [token, spreadsheetId])

  const addCat = useCallback(
    async (name) => {
      setLoading(true)
      try {
        await addCategory(token, spreadsheetId, name)
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
    async (name) => {
      setLoading(true)
      try {
        await deleteCategory(token, spreadsheetId, name)
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
    async (text, vector, category, tags = []) => {
      const date = new Date().toISOString().split('T')[0]
      const tagsStr = tags.join(',')
      await appendRows(token, spreadsheetId, category, [[text, JSON.stringify(vector), date, tagsStr]])
    },
    [token, spreadsheetId],
  )

  const loadAll = useCallback(
    async (cats) => {
      return loadAllData(token, spreadsheetId, cats || categories)
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
