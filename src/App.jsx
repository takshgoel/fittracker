import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ExercisesPage from './pages/ExercisesPage'
import WeightPage from './pages/WeightPage'
import CardioPage from './pages/CardioPage'
import AlcoholPage from './pages/AlcoholPage'
import SettingsPage from './pages/SettingsPage'
import ExportPage from './pages/ExportPage'

function ThemeWrapper({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('fitness_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('fitness_theme', dark ? 'dark' : 'light')
  }, [dark])

  return children({ dark, setDark })
}

export default function App() {
  return (
    <ThemeWrapper>
      {({ dark, setDark }) => (
        <AppProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 2500,
                style: {
                  background: dark ? '#1e293b' : '#fff',
                  color: dark ? '#f1f5f9' : '#0f172a',
                  border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                }
              }}
            />
            <Routes>
              <Route element={<Layout dark={dark} setDark={setDark} />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/exercises" element={<ExercisesPage />} />
                <Route path="/weight" element={<WeightPage />} />
                <Route path="/cardio" element={<CardioPage />} />
                <Route path="/alcohol" element={<AlcoholPage />} />
                <Route path="/settings" element={<SettingsPage dark={dark} setDark={setDark} />} />
                <Route path="/export" element={<ExportPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      )}
    </ThemeWrapper>
  )
}
