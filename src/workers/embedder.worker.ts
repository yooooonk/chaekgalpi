import { pipeline, env } from '@huggingface/transformers'

// 캐시를 브라우저 스토리지에 저장
env.useBrowserCache = true
env.allowLocalModels = false

type Extractor = Awaited<ReturnType<typeof pipeline>>

// Worker 컨텍스트 타입 (DOM lib의 Window.postMessage와 충돌 방지)
type WorkerCtx = {
  postMessage(data: unknown): void
  addEventListener(type: 'message', handler: (e: MessageEvent) => void): void
}
const ctx = self as unknown as WorkerCtx

let extractor: Extractor | null = null

async function loadModel(): Promise<Extractor> {
  if (extractor) return extractor
  ctx.postMessage({ type: 'status', message: '모델 로딩 중...' })
  extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
    progress_callback: (progress: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (progress.status === 'downloading') {
        ctx.postMessage({
          type: 'progress',
          file: progress.file,
          loaded: progress.loaded,
          total: progress.total,
        })
      }
    },
  })
  ctx.postMessage({ type: 'status', message: '모델 준비 완료' })
  return extractor
}

ctx.addEventListener('message', async (e: MessageEvent<{ id: number; text: string; role?: string }>) => {
  const { id, text } = e.data
  try {
    const model = await loadModel()
    // multilingual-e5 모델은 "query: " 또는 "passage: " 접두사 사용
    const prefix = e.data.role === 'query' ? 'query: ' : 'passage: '
    const output = await (model as (input: string, options: Record<string, unknown>) => Promise<{ data: ArrayLike<number> }>)(
      prefix + text,
      { pooling: 'mean', normalize: true },
    )
    const vector = Array.from(output.data)
    ctx.postMessage({ type: 'result', id, vector })
  } catch (err) {
    ctx.postMessage({ type: 'error', id, message: (err as Error).message })
  }
})
