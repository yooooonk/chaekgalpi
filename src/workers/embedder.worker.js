import { pipeline, env } from '@huggingface/transformers'

// 캐시를 브라우저 스토리지에 저장
env.useBrowserCache = true
env.allowLocalModels = false

let extractor = null

async function loadModel() {
  if (extractor) return extractor
  self.postMessage({ type: 'status', message: '모델 로딩 중...' })
  extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
    progress_callback: (progress) => {
      if (progress.status === 'downloading') {
        self.postMessage({
          type: 'progress',
          file: progress.file,
          loaded: progress.loaded,
          total: progress.total,
        })
      }
    },
  })
  self.postMessage({ type: 'status', message: '모델 준비 완료' })
  return extractor
}

self.addEventListener('message', async (e) => {
  const { id, text } = e.data
  try {
    const model = await loadModel()
    // multilingual-e5 모델은 "query: " 또는 "passage: " 접두사 사용
    const prefix = e.data.role === 'query' ? 'query: ' : 'passage: '
    const output = await model(prefix + text, { pooling: 'mean', normalize: true })
    const vector = Array.from(output.data)
    self.postMessage({ type: 'result', id, vector })
  } catch (err) {
    self.postMessage({ type: 'error', id, message: err.message })
  }
})
