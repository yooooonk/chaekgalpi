import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import SavePage from './pages/SavePage'
import SearchPage from './pages/SearchPage'
import ListPage from './pages/ListPage'
import CategoriesPage from './pages/CategoriesPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/save" replace />} />
            <Route path="/save" element={<SavePage />} />
            <Route path="/list" element={<ListPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
