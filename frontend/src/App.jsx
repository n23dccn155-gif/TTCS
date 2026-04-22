import React, { useState } from 'react'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProductListPage from './pages/products/ProductListPage'
import ImportCreatePage from './pages/imports/ImportCreatePage'
import LowStockPage from './pages/alert/LowStockPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState({
    full_name: 'Admin User',
    role: 'admin',
  })

  const handleLogin = (formData) => {
    setUser({
      full_name: formData.username || 'Người dùng',
      role: formData.username === 'admin' ? 'admin' : 'staff',
    })
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'products':
        return <ProductListPage />
      case 'imports':
        return <ImportCreatePage />
      case 'alerts-low-stock':
        return <LowStockPage />
      default:
        return <DashboardPage />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      user={user}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  )
}

export default App