import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { formatRole } from '../../utils/format'

const titleMap = {
  '/dashboard': 'Tổng quan hệ thống',
  '/products': 'Quản lý sản phẩm',
  '/suppliers': 'Quản lý nhà cung cấp',
  '/users': 'Quản lý người dùng',
  '/imports': 'Phiếu nhập kho',
  '/imports/create': 'Tạo phiếu nhập',
  '/exports': 'Phiếu xuất kho',
  '/exports/create': 'Tạo phiếu xuất',
  '/inventory': 'Tồn kho',
  '/alerts/low-stock': 'Cảnh báo tồn thấp',
  '/alerts/expiry': 'Cảnh báo hết hạn',
  '/alerts/slow-moving': 'Cảnh báo tồn lâu',
}

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {titleMap[location.pathname] || 'Trang hệ thống'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hệ thống quản lý kho hàng và sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl bg-slate-100 px-4 py-2 md:block">
            <p className="text-sm text-slate-500">Vai trò</p>
            <p className="font-semibold text-slate-700">{formatRole(user?.role)}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Đăng xuất
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 text-lg font-bold text-white">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header