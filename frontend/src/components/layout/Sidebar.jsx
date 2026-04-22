import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { menuItems } from '../../utils/menu'
import { formatRole } from '../../utils/format'

const Sidebar = () => {
  const { user } = useAuth()

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false
    return true
  })

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-xl">
      <div className="border-b border-slate-700 px-6 py-5">
        <h1 className="text-2xl font-bold text-cyan-400">KhoHub</h1>
        <p className="mt-1 text-sm text-slate-300">Quản lý kho hàng</p>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4 rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Xin chào</p>
          <p className="font-semibold">{user?.full_name}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-cyan-400">
            {formatRole(user?.role)}
          </p>
        </div>

        <nav className="space-y-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar