import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdsListPage from './pages/AdsListPage'
import AdViewPage from './pages/AdViewPage'
import AdEditPage from './pages/AdEditPage'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/ads" />} />
          <Route path="/ads" element={<AdsListPage />} />
          <Route path="/ads/:id" element={<AdViewPage />} />
          <Route path="/ads/:id/edit" element={<AdEditPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App