import { useApp } from '../contexts/AppContext'
import SentenceList from '../components/SentenceList'

export default function ListPage() {
  const { categories, loadAll } = useApp()

  return (
    <section className="panel">
      <SentenceList categories={categories} onLoad={loadAll} />
    </section>
  )
}
