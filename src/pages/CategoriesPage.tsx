import { useApp } from '../contexts/AppContext'
import CategoryManager from '../components/CategoryManager'

export default function CategoriesPage() {
  const { categories, addCat, deleteCat, sheetsLoading } = useApp()

  return (
    <section className="panel">
      <CategoryManager
        categories={categories}
        onAdd={addCat}
        onDelete={deleteCat}
        disabled={sheetsLoading}
      />
    </section>
  )
}
