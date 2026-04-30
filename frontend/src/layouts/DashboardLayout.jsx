import React, { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

const DashboardLayout = () => {
  const { isAuthenticated } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar isCollapsed={isCollapsed} />

      {/* Mobile overlay backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div
        className={`min-h-screen transition-all duration-300 ml-0 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Header onToggleSidebar={() => setIsCollapsed((prev) => !prev)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
