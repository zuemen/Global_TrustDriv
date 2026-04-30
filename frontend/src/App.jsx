import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './hooks/useI18n'
import MainPage from './pages/MainPage'
import SharePage from './pages/SharePage'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<MainPage />} />
          <Route path="/share/:docId" element={<SharePage />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
