import { useApp } from '../contexts/AppContext'
import SaveForm from '../components/SaveForm'

export default function SavePage() {
  const { embed, modelStatus, saveEntry, categories, sheetsLoading, notify } = useApp()
  const busy = modelStatus !== 'ready' || sheetsLoading

  async function handleSave(text: string, category: string, tags: string[]) {
    if (modelStatus !== 'ready') {
      notify('모델 로딩 중입니다. 잠시 후 다시 시도하세요.', 'error')
      return
    }
    try {
      const vector = await embed(text, 'passage')
      await saveEntry(text, vector, category, tags)
      notify(`"${category}"에 저장했습니다.`)
    } catch (e) {
      notify((e as Error).message, 'error')
    }
  }

  return (
    <section className="panel">
      <h2 className="section-title">문장 저장</h2>
      <SaveForm categories={categories} onSave={handleSave} disabled={busy} />
    </section>
  )
}
