/**
 * Google Sheets API v4 유틸리티
 *
 * 시트 구조:
 *   - "_meta" 탭: A열에 카테고리 이름 목록
 *   - 카테고리 탭: A=문장, B=벡터(JSON), C=날짜, D=해시태그(쉼표 구분)
 */

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export interface Entry {
  text: string
  vector: number[]
  date: string
  tags: string[]
  category: string
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

// ─── 스프레드시트 초기화 ─────────────────────────────────────────────────────

const APP_CONFIG_NAME = 'chaekgalpi-config.json'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files'

/**
 * appDataFolder에서 스프레드시트 ID를 읽어온다. 없으면 null.
 */
export async function readConfigFromAppData(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${APP_CONFIG_NAME}'`)
  const listRes = await fetch(
    `${DRIVE_FILES}?spaces=appDataFolder&q=${q}&fields=files(id)&pageSize=1`,
    { headers: authHeader(token) },
  )
  if (!listRes.ok) return null
  const list = await listRes.json()
  const files = (list.files as Array<{ id: string }> | undefined) ?? []
  if (files.length === 0) return null

  const contentRes = await fetch(
    `${DRIVE_FILES}/${files[0].id}?alt=media`,
    { headers: authHeader(token) },
  )
  if (!contentRes.ok) return null
  const config = await contentRes.json() as { spreadsheetId?: string }
  return config.spreadsheetId ?? null
}

/**
 * appDataFolder에 스프레드시트 ID를 저장한다.
 */
export async function saveConfigToAppData(token: string, spreadsheetId: string): Promise<void> {
  const boundary = 'chaekgalpi_boundary'
  const metadata = JSON.stringify({ name: APP_CONFIG_NAME, parents: ['appDataFolder'] })
  const content = JSON.stringify({ spreadsheetId })
  const body = [
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  await fetch(DRIVE_UPLOAD, {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
}

/**
 * 새 스프레드시트를 생성하고 _meta 시트를 추가한다.
 */
export async function createSpreadsheet(token: string): Promise<string> {
  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: '책갈피 데이터' },
      sheets: [
        { properties: { title: '_meta' } },
        { properties: { title: '기본' } },
      ],
    }),
  })
  if (!res.ok) throw new Error(`스프레드시트 생성 실패: ${res.status}`)
  const data = await res.json()
  // _meta에 헤더 + 첫 카테고리 기록
  await appendRows(token, data.spreadsheetId, '_meta', [['기본']])
  return data.spreadsheetId as string
}

// ─── 카테고리(시트 탭) 관리 ───────────────────────────────────────────────────

export async function getCategories(token: string, spreadsheetId: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: authHeader(token),
  })
  if (!res.ok) throw new Error(`카테고리 조회 실패: ${res.status}`)
  const data = await res.json()
  return (data.sheets as Array<{ properties: { title: string } }>)
    .map((s) => s.properties.title)
    .filter((t) => t !== '_meta')
}

export async function addCategory(token: string, spreadsheetId: string, name: string): Promise<void> {
  // 시트 추가
  const res = await fetch(`${BASE_URL}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: name } } }],
    }),
  })
  if (!res.ok) throw new Error(`카테고리 추가 실패: ${res.status}`)
  // _meta에도 기록
  await appendRows(token, spreadsheetId, '_meta', [[name]])
}

export async function deleteCategory(token: string, spreadsheetId: string, name: string): Promise<void> {
  // 시트 ID 조회
  const infoRes = await fetch(`${BASE_URL}/${spreadsheetId}?fields=sheets.properties`, {
    headers: authHeader(token),
  })
  if (!infoRes.ok) throw new Error(`시트 정보 조회 실패`)
  const info = await infoRes.json()
  const sheet = (info.sheets as Array<{ properties: { title: string; sheetId: number } }>)
    .find((s) => s.properties.title === name)
  if (!sheet) throw new Error(`"${name}" 카테고리를 찾을 수 없습니다`)
  const sheetId = sheet.properties.sheetId

  const res = await fetch(`${BASE_URL}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ deleteSheet: { sheetId } }],
    }),
  })
  if (!res.ok) throw new Error(`카테고리 삭제 실패: ${res.status}`)
}

// ─── 행 읽기/쓰기 ─────────────────────────────────────────────────────────────

export async function appendRows(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rows: string[][],
): Promise<void> {
  const range = encodeURIComponent(`${sheetName}!A1`)
  const res = await fetch(
    `${BASE_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    },
  )
  if (!res.ok) throw new Error(`행 추가 실패: ${res.status}`)
}

export async function getRows(
  token: string,
  spreadsheetId: string,
  sheetName: string,
): Promise<string[][]> {
  const range = encodeURIComponent(`${sheetName}!A:D`)
  const res = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
    headers: authHeader(token),
  })
  if (!res.ok) throw new Error(`데이터 조회 실패: ${res.status}`)
  const data = await res.json()
  return (data.values as string[][] | undefined) ?? []
}

/**
 * 특정 카테고리의 모든 행을 파싱해 반환
 */
export function parseRows(rows: string[][], category: string): Entry[] {
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      text: r[0],
      vector: JSON.parse(r[1]) as number[],
      date: r[2] ?? '',
      tags: r[3] ? r[3].split(',').map((t) => t.trim()).filter(Boolean) : [],
      category,
    }))
}

/**
 * 모든 카테고리 데이터를 한꺼번에 로드
 */
export async function loadAllData(
  token: string,
  spreadsheetId: string,
  categories: string[],
): Promise<Entry[]> {
  const results = await Promise.all(
    categories.map(async (cat) => {
      const rows = await getRows(token, spreadsheetId, cat)
      return parseRows(rows, cat)
    }),
  )
  return results.flat()
}
