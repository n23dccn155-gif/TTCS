import React from 'react'
import { NavLink } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { menuItems } from '../../utils/menu'
import { formatRole } from '../../utils/format'

const Sidebar = ({ isCollapsed }) => {
  const { user } = useAuth()

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false
    return true
  })

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-gray-50 text-gray-700 shadow-xl transition-all duration-300 ${
        isCollapsed
          ? '-translate-x-full md:translate-x-0 md:w-20'
          : 'translate-x-0 w-64'
      }`}
    >
      {/* Logo area */}
      <div className="flex h-20 items-center justify-center border-b border-gray-200 bg-slate-600">
        {isCollapsed ? (
          <Package className="h-12 w-12 text-white" strokeWidth={2} />
        ) : (
          <div className="flex flex-row items-center gap-2">
            <Package className="h-12 w-12 text-white" strokeWidth={2} /> 
            <p className="text-lg text-white/80">Quản lý kho hàng</p>
          </div>
        )}
      </div>

      <div className="px-3 py-4">

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl transition-all duration-200 ${
                    isCollapsed
                      ? 'justify-center px-2 py-3'
                      : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-gray-200 text-cyan-600 shadow-md'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />

                {/* Label - hidden when collapsed */}
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
