import { useEffect, useRef, useCallback, useState } from 'react'

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LoadProgress {
  type: 'progress'
  file: string
  loaded: number
  total: number
}

let workerInstance: Worker | null = null // 싱글톤 워커

export function useEmbedder() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null)
  const pendingRef = useRef(new Map<number, (value: number[]) => void>())
  const idRef = useRef(0)

  useEffect(() => {
    if (workerInstance) {
      setModelStatus('ready')
      return
    }

    workerInstance = new Worker(new URL('../workers/embedder.worker.ts', import.meta.url), {
      type: 'module',
    })

    workerInstance.addEventListener('message', (e: MessageEvent) => {
      const msg = e.data as { type: string; message?: string; id?: number; vector?: number[] } & Partial<LoadProgress>
      if (msg.type === 'status') {
        setModelStatus(msg.message === '모델 준비 완료' ? 'ready' : 'loading')
      } else if (msg.type === 'progress') {
        setLoadProgress(msg as LoadProgress)
      } else if (msg.type === 'result' && msg.id !== undefined) {
        const resolve = pendingRef.current.get(msg.id)
        if (resolve) {
          resolve(msg.vector ?? [])
          pendingRef.current.delete(msg.id)
        }
      } else if (msg.type === 'error') {
        if (msg.id !== undefined) {
          pendingRef.current.delete(msg.id)
        }
        setModelStatus('error')
      }
    })

    setModelStatus('loading')

    // 워커를 웜업 (빈 메시지로 모델 로드 트리거)
    workerInstance.postMessage({ id: -1, text: '초기화', role: 'query' })
  }, [])

  const embed = useCallback((text: string, role: 'passage' | 'query' = 'passage'): Promise<number[]> => {
    return new Promise((resolve) => {
      const id = idRef.current++
      pendingRef.current.set(id, resolve)
      workerInstance!.postMessage({ id, text, role })
    })
  }, [])

  return { embed, modelStatus, loadProgress }
}
