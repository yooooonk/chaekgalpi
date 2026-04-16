import { useEffect, useRef, useCallback, useState } from 'react'

let workerInstance = null // 싱글톤 워커

export function useEmbedder() {
  const [modelStatus, setModelStatus] = useState('idle') // idle | loading | ready | error
  const [loadProgress, setLoadProgress] = useState(null)
  const pendingRef = useRef(new Map())
  const idRef = useRef(0)

  useEffect(() => {
    if (workerInstance) {
      setModelStatus('ready')
      return
    }

    workerInstance = new Worker(new URL('../workers/embedder.worker.js', import.meta.url), {
      type: 'module',
    })

    workerInstance.addEventListener('message', (e) => {
      const msg = e.data
      if (msg.type === 'status') {
        setModelStatus(msg.message === '모델 준비 완료' ? 'ready' : 'loading')
      } else if (msg.type === 'progress') {
        setLoadProgress(msg)
      } else if (msg.type === 'result') {
        const resolve = pendingRef.current.get(msg.id)
        if (resolve) {
          resolve(msg.vector)
          pendingRef.current.delete(msg.id)
        }
      } else if (msg.type === 'error') {
        const pending = pendingRef.current.get(msg.id)
        if (pending) {
          // reject를 담은 경우 처리
          pendingRef.current.delete(msg.id)
        }
        setModelStatus('error')
      }
    })

    setModelStatus('loading')

    // 워커를 웜업 (빈 메시지로 모델 로드 트리거)
    workerInstance.postMessage({ id: -1, text: '초기화', role: 'query' })
  }, [])

  const embed = useCallback((text, role = 'passage') => {
    return new Promise((resolve, reject) => {
      const id = idRef.current++
      pendingRef.current.set(id, resolve)
      workerInstance.postMessage({ id, text, role })
    })
  }, [])

  return { embed, modelStatus, loadProgress }
}
